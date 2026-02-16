export class GameView {
    constructor() {
        this.stockContainer = document.getElementById('stock');
        this.wasteContainer = document.getElementById('waste');
    }

    createCardElement(card) {
        const div = document.createElement('div');
        div.classList.add('card');
        div.dataset.id = card.id;

        if (!card.visible) {
            div.classList.add('face-down');
            div.draggable = false;
        } else {
            div.classList.add(card.color);
            div.draggable = true;
            div.innerHTML = `
                <div class="top">${card.rank} ${this.getSymbol(card.suit)}</div>
                <div class="center">${this.getSymbol(card.suit)}</div>
                <div class="bottom">${card.rank} ${this.getSymbol(card.suit)}</div>
            `;
        }
        return div;
    }

    getSymbol(suit) {
        const symbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
        return symbols[suit];
    }

    renderTableau(tableauData) {
        tableauData.forEach((columnCards, index) => {
            const colDiv = document.querySelector(`.column[data-col="${index}"]`);
            colDiv.innerHTML = ''; // Limpiar
            columnCards.forEach(card => {
                colDiv.appendChild(this.createCardElement(card));
            });
        });
    }

    renderStock(stockCards) {
        this.stockContainer.innerHTML = '';
        if (stockCards.length > 0) {
            // Mostrar reverso genérico si hay cartas
            const placeholder = document.createElement('div');
            placeholder.classList.add('card', 'face-down');
            this.stockContainer.appendChild(placeholder);
        } else {
            this.stockContainer.innerHTML = '<div class="card-placeholder">↺</div>';
        }
    }

    renderWaste(wasteCards) {
        this.wasteContainer.innerHTML = '';
        if (wasteCards.length > 0) {
            // Mostrar solo la última carta del descarte
            const topCard = wasteCards[wasteCards.length - 1];
            this.wasteContainer.appendChild(this.createCardElement(topCard));
        }
    }

    renderFoundations(foundationsData) {
        Object.keys(foundationsData).forEach(suit => {
            const pileDiv = document.getElementById(`f-${suit}`);
            pileDiv.innerHTML = '';
            const cards = foundationsData[suit];
            if (cards.length > 0) {
                pileDiv.appendChild(this.createCardElement(cards[cards.length - 1]));
            } else {
                pileDiv.textContent = this.getSymbol(suit); // Símbolo de fondo si está vacía
            }
        });
    }
}