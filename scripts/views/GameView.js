export class GameView {
    constructor() {
        this.deckContainer = document.getElementById('deck-container');
        this.dropZones = document.querySelectorAll('.drop-zone');
    }

    renderDeck(cards) {
        this.deckContainer.innerHTML = '';
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card', card.color);
            cardElement.setAttribute('draggable', 'true');
            cardElement.dataset.id = card.id;
            cardElement.dataset.suit = card.suit;
            cardElement.textContent = `${card.rank} ${this.getSuitSymbol(card.suit)}`;
            
            this.deckContainer.appendChild(cardElement);
        });
    }

    getSuitSymbol(suit) {
        switch(suit) {
            case 'hearts': return '♥';
            case 'spades': return '♠';
            case 'diamonds': return '♦';
            case 'clubs': return '♣';
            default: return '';
        }
    }

    removeCardFromDeck(cardId) {
        const card = document.querySelector(`.card[data-id="${cardId}"]`);
        if (card) {
            card.remove();
        }
    }

    addCardToZone(cardElement, zoneElement) {
        zoneElement.appendChild(cardElement);
    }
}