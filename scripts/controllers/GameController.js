import { DeckRepository } from '../database/DeckRepository.js';
import { GameView } from '../views/Gameview.js';

export class GameController {
    constructor() {
        this.repository = new DeckRepository();
        this.view = new GameView();
        this.draggedCard = null;
    }

    init() {
        const cards = this.repository.createDeck();
        this.view.renderDeck(cards);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const cards = document.querySelectorAll('.card');
        const zones = document.querySelectorAll('.drop-zone');

        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('card')) {
                this.handleDragStart(e);
            }
        });

        zones.forEach(zone => {
            zone.addEventListener('dragover', (e) => this.handleDragOver(e));
            zone.addEventListener('drop', (e) => this.handleDrop(e));
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.init());
    }

    handleDragStart(e) {
        this.draggedCard = e.target;
        e.dataTransfer.setData('text/plain', JSON.stringify({
            suit: e.target.dataset.suit,
            id: e.target.dataset.id
        }));
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        const zone = e.target.closest('.drop-zone');
        if (!zone) return;

        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const zoneSuit = zone.dataset.suit;

        if (data.suit === zoneSuit) {
            this.view.addCardToZone(this.draggedCard, zone);
            this.draggedCard = null;
        } else {
            alert('¡Palo incorrecto!');
        }
    }
}