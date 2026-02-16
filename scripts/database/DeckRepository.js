import { SUITS, RANKS } from '../types/GameTypes.js';

export class DeckRepository {
    constructor() {
        this.deck = [];
    }

    createDeck() {
        this.deck = [];
        Object.values(SUITS).forEach(suit => {
            RANKS.forEach(rank => {
                this.deck.push({
                    id: `${rank}-${suit}`,
                    rank: rank,
                    suit: suit,
                    color: (suit === SUITS.HEARTS || suit === SUITS.DIAMONDS) ? 'red' : 'black'
                });
            });
        });
        return this.shuffle(this.deck);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}