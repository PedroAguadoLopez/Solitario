import { DeckRepository } from '../database/DeckRepository.js';
import { GameView } from '../views/GameView.js';

export class GameController {
    constructor() {
        this.repository = new DeckRepository();
        this.view = new GameView();
        this.gameState = {
            stock: [],
            waste: [],
            foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
            tableau: [[], [], [], [], [], [], []]
        };
        this.draggedCardData = null;
    }

    init() {
        const fullDeck = this.repository.createDeck();
        let cardIndex = 0;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                const card = fullDeck[cardIndex++];
                card.visible = (j === i); 
                this.gameState.tableau[i].push(card);
            }
        }
        this.gameState.stock = fullDeck.slice(cardIndex);
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
        document.getElementById('stock').addEventListener('click', () => this.drawCard());
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.gameState = { stock: [], waste: [], foundations: { hearts: [], diamonds: [], clubs: [], spades: [] }, tableau: [[], [], [], [], [], [], []] };
            this.init();
        });
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }

    drawCard() {
        if (this.gameState.stock.length > 0) {
            const card = this.gameState.stock.pop();
            card.visible = true;
            this.gameState.waste.push(card);
        } else {
            this.gameState.stock = this.gameState.waste.reverse().map(c => ({...c, visible: false}));
            this.gameState.waste = [];
        }
        this.updateView();
    }

    handleDragStart(e) {
        if (!e.target.classList.contains('card')) return;
        if (e.target.classList.contains('face-down')) {
            e.preventDefault();
            return;
        }

        const cardId = e.target.dataset.id;
        this.draggedCardData = this.findCardLocation(cardId);
        e.dataTransfer.setData('text/plain', cardId);
    }

    handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.column, .foundation');
        if (!target || !this.draggedCardData) return;

        const sourceCard = this.draggedCardData.card;
        const { location, index } = this.draggedCardData;

        if (target.classList.contains('column')) {
            const colIndex = parseInt(target.dataset.col);
            const column = this.gameState.tableau[colIndex];
            const topCard = column[column.length - 1];

            if (this.isValidTableauMove(sourceCard, topCard)) {
                this.executeMove(colIndex, 'tableau');
            }
        }
        
        if (target.classList.contains('foundation')) {
            const suit = target.dataset.suit;
            const pile = this.gameState.foundations[suit];
            const topCard = pile[pile.length - 1];

            let isStack = false;
            if (location.startsWith('tableau')) {
                const colIdx = parseInt(location.split('-')[1]);
                if (this.gameState.tableau[colIdx].length - 1 > index) {
                    isStack = true;
                }
            }

            if (!isStack && this.isValidFoundationMove(sourceCard, topCard, suit)) {
                this.executeMove(suit, 'foundation');
            }
        }
    }

    isValidTableauMove(card, topCard) {
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const cardRankIndex = ranks.indexOf(card.rank);
        
        if (!topCard) {
            return card.rank === 'K';
        }
        
        const topRankIndex = ranks.indexOf(topCard.rank);
        const isDifferentColor = card.color !== topCard.color;
        const isNextRank = topRankIndex === cardRankIndex + 1;

        return isDifferentColor && isNextRank;
    }

    isValidFoundationMove(card, topCard, targetSuit) {
        if (card.suit !== targetSuit) return false;

        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const cardRankIndex = ranks.indexOf(card.rank);

        if (!topCard) {
            return card.rank === 'A';
        }

        const topRankIndex = ranks.indexOf(topCard.rank);
        return cardRankIndex === topRankIndex + 1;
    }

    executeMove(targetId, targetType) {
        const { location, index } = this.draggedCardData;
        let cardsMoved = [];

        if (location === 'waste') {
            cardsMoved = [this.gameState.waste.pop()];
        } else if (location.startsWith('tableau')) {
            const colIdx = parseInt(location.split('-')[1]);
            cardsMoved = this.gameState.tableau[colIdx].splice(index);
            
            const newTop = this.gameState.tableau[colIdx][this.gameState.tableau[colIdx].length - 1];
            if (newTop) newTop.visible = true;
        }

        if (targetType === 'tableau') {
            this.gameState.tableau[targetId].push(...cardsMoved);
        } else if (targetType === 'foundation') {
            this.gameState.foundations[targetId].push(cardsMoved[0]);
        }

        this.updateView();
        this.draggedCardData = null;
    }

    findCardLocation(id) {
        const wasteCard = this.gameState.waste.find(c => c.id === id);
        if (wasteCard) return { card: wasteCard, location: 'waste', index: this.gameState.waste.length - 1 };

        for (let i = 0; i < 7; i++) {
            const index = this.gameState.tableau[i].findIndex(c => c.id === id);
            if (index !== -1) return { card: this.gameState.tableau[i][index], location: `tableau-${i}`, index: index };
        }
        return null;
    }
}