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
            tableau: [[], [], [], [], [], [], []],
            score: 0,
            recycles: 0
        };
        this.history = [];
        this.draggedCardData = null;
        this.isDrawing = false;
        this.timeElapsed = 0;
        this.timerInterval = null;
    }

    init() {
        this.history = [];
        const fullDeck = this.repository.createDeck();
        let cardIndex = 0;
        
        this.gameState = {
            stock: [],
            waste: [],
            foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
            tableau: [[], [], [], [], [], [], []],
            score: 0,
            recycles: 0
        };

        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                const card = fullDeck[cardIndex++];
                card.visible = (j === i); 
                this.gameState.tableau[i].push(card);
            }
        }
        this.gameState.stock = fullDeck.slice(cardIndex);
        
        this.timeElapsed = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.updateScoreView();
        }, 1000);

        this.updateView();
        this.updateScoreView();
        this.setupEventListeners();
    }

    updateView() {
        this.view.renderTableau(this.gameState.tableau);
        this.view.renderStock(this.gameState.stock);
        this.view.renderWaste(this.gameState.waste);
        this.view.renderFoundations(this.gameState.foundations);
    }

    updateScoreView() {
        let finalScore = this.gameState.score - (this.gameState.recycles * 50) - (Math.floor(this.timeElapsed / 10) * 2);
        if (finalScore < 0) finalScore = 0;
        
        const minutes = String(Math.floor(this.timeElapsed / 60)).padStart(2, '0');
        const seconds = String(this.timeElapsed % 60).padStart(2, '0');
        
        this.view.updateStats(finalScore, `${minutes}:${seconds}`);
    }

    setupEventListeners() {
        const confirmModal = document.getElementById('confirm-modal');
        const victoryModal = document.getElementById('victory-modal');
        
        const stockEl = document.getElementById('stock');
        if(stockEl) {
            stockEl.replaceWith(stockEl.cloneNode(true));
            document.getElementById('stock').addEventListener('click', () => this.drawCard());
        }
        
        const resetBtn = document.getElementById('reset-btn');
        if(resetBtn) {
            resetBtn.replaceWith(resetBtn.cloneNode(true));
            document.getElementById('reset-btn').addEventListener('click', () => {
                if(confirmModal) confirmModal.classList.remove('hidden');
            });
        }

        const undoBtn = document.getElementById('undo-btn');
        if(undoBtn) {
            undoBtn.replaceWith(undoBtn.cloneNode(true));
            document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        }

        const btnCancel = document.getElementById('btn-cancel');
        if(btnCancel) {
            btnCancel.replaceWith(btnCancel.cloneNode(true));
            document.getElementById('btn-cancel').addEventListener('click', () => {
                if(confirmModal) confirmModal.classList.add('hidden');
            });
        }

        const btnConfirm = document.getElementById('btn-confirm');
        if(btnConfirm) {
            btnConfirm.replaceWith(btnConfirm.cloneNode(true));
            document.getElementById('btn-confirm').addEventListener('click', () => {
                if(confirmModal) confirmModal.classList.add('hidden');
                this.init();
            });
        }

        const btnPlayAgain = document.getElementById('btn-play-again');
        if(btnPlayAgain) {
            btnPlayAgain.replaceWith(btnPlayAgain.cloneNode(true));
            document.getElementById('btn-play-again').addEventListener('click', () => {
                if(victoryModal) victoryModal.classList.add('hidden');
                this.init();
            });
        }

        if (this.handleDragStartBound) {
            document.removeEventListener('dragstart', this.handleDragStartBound);
            document.removeEventListener('dragover', this.handleDragOverBound);
            document.removeEventListener('drop', this.handleDropBound);
        }

        this.handleDragStartBound = (e) => this.handleDragStart(e);
        this.handleDragOverBound = (e) => e.preventDefault();
        this.handleDropBound = (e) => this.handleDrop(e);

        document.addEventListener('dragstart', this.handleDragStartBound);
        document.addEventListener('dragover', this.handleDragOverBound);
        document.addEventListener('drop', this.handleDropBound);
    }

    saveState() {
        this.history.push(JSON.parse(JSON.stringify(this.gameState)));
    }

    undo() {
        if (this.history.length > 0) {
            this.gameState = this.history.pop();
            this.gameState.waste.forEach(c => c.isNewDrawn = false);
            this.updateView();
            this.updateScoreView();
        }
    }

    drawCard() {
        if (this.isDrawing) return;
        this.isDrawing = true;

        if (this.gameState.stock.length > 0 || this.gameState.waste.length > 0) {
            this.saveState();
        }

        this.gameState.waste.forEach(c => c.isNewDrawn = false);

        if (this.gameState.stock.length > 0) {
            const card = this.gameState.stock.pop();
            card.visible = true;
            card.isNewDrawn = true;
            this.gameState.waste.push(card);
        } else if (this.gameState.waste.length > 0) {
            this.gameState.recycles++;
            const recycledCards = this.gameState.waste.reverse();
            recycledCards.forEach(c => {
                c.visible = false;
                c.isNewDrawn = false;
            });
            this.gameState.stock = recycledCards;
            this.gameState.waste = [];
        }
        
        this.updateView();
        this.updateScoreView();
        
        setTimeout(() => {
            this.isDrawing = false;
        }, 350);
    }

    handleDragStart(e) {
        this.gameState.waste.forEach(c => c.isNewDrawn = false);

        if (!e.target.classList.contains('card')) return;
        if (e.target.classList.contains('face-down')) {
            e.preventDefault();
            return;
        }

        const cardId = e.target.dataset.id;
        this.draggedCardData = this.findCardLocation(cardId);
        if(!this.draggedCardData) return;
        
        e.dataTransfer.setData('text/plain', cardId);

        const { location, index } = this.draggedCardData;
        if (location.startsWith('tableau')) {
            const colIdx = parseInt(location.split('-')[1]);
            const cardsToDrag = this.gameState.tableau[colIdx].slice(index);

            if (cardsToDrag.length > 1) {
                const ghost = document.createElement('div');
                ghost.classList.add('drag-ghost');
                
                cardsToDrag.forEach((c, i) => {
                    const clone = this.view.createCardElement(c);
                    clone.style.top = `${i * 30}px`;
                    ghost.appendChild(clone);
                });
                
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 50, 50);
                setTimeout(() => ghost.remove(), 0);
            }
        }
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
        this.saveState();
        this.gameState.waste.forEach(c => c.isNewDrawn = false);

        const { location, index } = this.draggedCardData;
        let cardsMoved = [];

        if (location === 'waste') {
            cardsMoved = [this.gameState.waste.pop()];
            this.gameState.score += 5;
        } else if (location.startsWith('tableau')) {
            const colIdx = parseInt(location.split('-')[1]);
            cardsMoved = this.gameState.tableau[colIdx].splice(index);
            
            const newTop = this.gameState.tableau[colIdx][this.gameState.tableau[colIdx].length - 1];
            if (newTop && !newTop.visible) {
                newTop.visible = true;
                this.gameState.score += 20;
            }
        }

        cardsMoved.forEach(c => c.isNewDrawn = false);

        if (targetType === 'tableau') {
            this.gameState.tableau[targetId].push(...cardsMoved);
        } else if (targetType === 'foundation') {
            this.gameState.foundations[targetId].push(cardsMoved[0]);
            this.gameState.score += 50;
            this.checkWinCondition();
        }

        this.updateView();
        this.updateScoreView();
        this.draggedCardData = null;
    }

    checkWinCondition() {
        const f = this.gameState.foundations;
        if (f.hearts.length === 13 && f.diamonds.length === 13 && f.clubs.length === 13 && f.spades.length === 13) {
            clearInterval(this.timerInterval);
            
            const finalScoreEl = document.getElementById('final-score');
            const scoreDisplayEl = document.getElementById('score-display');
            if (finalScoreEl && scoreDisplayEl) {
                finalScoreEl.textContent = scoreDisplayEl.textContent;
            }
            
            const finalTimeEl = document.getElementById('final-time');
            const timeDisplayEl = document.getElementById('time-display');
            if (finalTimeEl && timeDisplayEl) {
                finalTimeEl.textContent = timeDisplayEl.textContent;
            }
            
            const victoryModal = document.getElementById('victory-modal');
            if(victoryModal) victoryModal.classList.remove('hidden');
        }
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