import { DeckRepository } from '../database/DeckRepository.js';
import { GameView } from '../views/Gameview.js';

export class GameController {
    constructor() {
        this.repository = new DeckRepository();
        this.view = new GameView();
        
        // Estado del juego
        this.gameState = {
            stock: [],
            waste: [],
            foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
            tableau: [[], [], [], [], [], [], []] // 7 columnas
        };
        
        this.draggedCardData = null;
    }

    init() {
        // 1. Crear baraja barajada
        const fullDeck = this.repository.createDeck();
        
        // 2. Repartir en el Tableau (Columna 1 tiene 1 carta, Col 2 tiene 2...)
        let cardIndex = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                const card = fullDeck[cardIndex++];
                // La última carta de cada columna se pone boca arriba (visible)
                card.visible = (j === i); 
                this.gameState.tableau[i].push(card);
            }
        }

        // 3. El resto al Mazo (Stock)
        this.gameState.stock = fullDeck.slice(cardIndex);

        // 4. Pintar todo
        this.updateView();
        this.setupEventListeners();
    }

    updateView() {
        this.view.renderTableau(this.gameState.tableau);
        this.view.renderStock(this.gameState.stock);
        this.view.renderWaste(this.gameState.waste);
        this.view.renderFoundations(this.gameState.foundations);
    }

    setupEventListeners() {
        // Evento para robar carta del mazo
        document.getElementById('stock').addEventListener('click', () => this.drawCard());

        // Reset
        document.getElementById('reset-btn').addEventListener('click', () => {
            // Limpiar estado y reiniciar
            this.gameState = { stock: [], waste: [], foundations: { hearts: [], diamonds: [], clubs: [], spades: [] }, tableau: [[], [], [], [], [], [], []] };
            this.init();
        });

        // Delegación de eventos Drag & Drop
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragover', (e) => e.preventDefault()); // Permitir drop
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }

    drawCard() {
        if (this.gameState.stock.length > 0) {
            const card = this.gameState.stock.pop();
            card.visible = true;
            this.gameState.waste.push(card);
        } else {
            // Reciclar descarte al mazo
            this.gameState.stock = this.gameState.waste.reverse().map(c => ({...c, visible: false}));
            this.gameState.waste = [];
        }
        this.updateView();
    }

    handleDragStart(e) {
        if (!e.target.classList.contains('card')) return;
        if (e.target.classList.contains('face-down')) {
            e.preventDefault(); // No arrastrar cartas boca abajo
            return;
        }

        const cardId = e.target.dataset.id;
        // Guardamos qué carta es y de dónde viene para validar luego
        this.draggedCardData = this.findCardLocation(cardId);
        e.dataTransfer.setData('text/plain', cardId);
    }

    handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.column, .foundation');
        if (!target || !this.draggedCardData) return;

        const sourceCard = this.draggedCardData.card;
        
        // Lógica para soltar en TABLEAU (Columnas)
        if (target.classList.contains('column')) {
            const colIndex = parseInt(target.dataset.col);
            const column = this.gameState.tableau[colIndex];
            const topCard = column[column.length - 1];

            // Reglas: Color alterno y Rango descendente (K sobre Q, Q sobre J...)
            // O si la columna está vacía, solo Reyes (K)
            if (this.isValidTableauMove(sourceCard, topCard)) {
                this.executeMove(colIndex, 'tableau');
            }
        }
        
        // Lógica para soltar en FOUNDATION (Palos arriba)
        if (target.classList.contains('foundation')) {
            const suit = target.dataset.suit;
            const pile = this.gameState.foundations[suit];
            const topCard = pile[pile.length - 1];

            // Reglas: Mismo palo y Rango ascendente (A sobre vacío, 2 sobre A...)
            if (this.isValidFoundationMove(sourceCard, topCard, suit)) {
                this.executeMove(suit, 'foundation');
            }
        }
    }

    isValidTableauMove(card, topCard) {
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const cardRankIndex = ranks.indexOf(card.rank);
        
        if (!topCard) {
            return card.rank === 'K'; // Solo K en huecos vacíos
        }
        
        const topRankIndex = ranks.indexOf(topCard.rank);
        const isDifferentColor = card.color !== topCard.color;
        const isNextRank = topRankIndex === cardRankIndex + 1; // El de la mesa debe ser 1 mayor

        return isDifferentColor && isNextRank;
    }

    isValidFoundationMove(card, topCard, targetSuit) {
        if (card.suit !== targetSuit) return false;

        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const cardRankIndex = ranks.indexOf(card.rank);

        if (!topCard) {
            return card.rank === 'A'; // Solo A en huecos vacíos
        }

        const topRankIndex = ranks.indexOf(topCard.rank);
        return cardRankIndex === topRankIndex + 1;
    }

    executeMove(targetId, targetType) {
        // 1. Sacar carta del origen
        const { location, index } = this.draggedCardData;
        let cardMoved;

        if (location === 'waste') {
            cardMoved = this.gameState.waste.pop();
        } else if (location.startsWith('tableau')) {
            const colIdx = parseInt(location.split('-')[1]);
            cardMoved = this.gameState.tableau[colIdx].pop();
            
            // Voltear la nueva carta superior si estaba boca abajo
            const newTop = this.gameState.tableau[colIdx][this.gameState.tableau[colIdx].length - 1];
            if (newTop) newTop.visible = true;
        }

        // 2. Poner en destino
        if (targetType === 'tableau') {
            this.gameState.tableau[targetId].push(cardMoved);
        } else if (targetType === 'foundation') {
            this.gameState.foundations[targetId].push(cardMoved);
        }

        this.updateView();
        this.draggedCardData = null;
    }

    findCardLocation(id) {
        // Buscar en Waste
        const wasteCard = this.gameState.waste.find(c => c.id === id);
        if (wasteCard) return { card: wasteCard, location: 'waste' };

        // Buscar en Tableau
        for (let i = 0; i < 7; i++) {
            const card = this.gameState.tableau[i].find(c => c.id === id);
            if (card) return { card, location: `tableau-${i}` };
        }
        return null;
    }
}