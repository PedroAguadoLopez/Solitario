export class GameView {
    constructor() {
        this.stockContainer = document.getElementById('stock');
        this.wasteContainer = document.getElementById('waste');
    }

    getRankNumber(rank) {
        if (rank === 'A') return 1;
        if (rank === 'J') return 11;
        if (rank === 'Q') return 12;
        if (rank === 'K') return 13;
        return rank;
    }

    createCardElement(card) {
        const div = document.createElement('div');
        div.classList.add('card');
        div.dataset.id = card.id;

        if (!card.visible) {
            div.classList.add('face-down');
            div.draggable = false;
        } else {
            div.draggable = true;
            const rankNum = this.getRankNumber(card.rank);
            div.style.backgroundImage = `url('assets/cards/card-${card.suit}-${rankNum}.png')`;
        }
        
        return div;
    }

    renderTableau(tableauData) {
        tableauData.forEach((columnCards, index) => {
            const colDiv = document.querySelector(`.column[data-col="${index}"]`);
            colDiv.innerHTML = ''; 
            columnCards.forEach(card => {
                colDiv.appendChild(this.createCardElement(card));
            });
        });
    }

    renderStock(stockCards) {
        this.stockContainer.innerHTML = '';
        if (stockCards.length > 0) {
            const placeholder = document.createElement('div');
            placeholder.classList.add('card', 'face-down');
            this.stockContainer.appendChild(placeholder);
        } else {
            this.stockContainer.innerHTML = '<div style="width:100px; height:145px; border:2px solid rgba(255,255,255,0.2); border-radius:8px;"></div>';
        }
    }

    renderWaste(wasteCards) {
        this.wasteContainer.innerHTML = '';
        if (wasteCards.length > 0) {
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
                pileDiv.innerHTML = this.getSuitSymbol(suit); 
            }
        });
    }

    getSuitSymbol(suit) {
        const symbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
        return symbols[suit];
    }
}