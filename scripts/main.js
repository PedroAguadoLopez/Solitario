import { GameController } from './controllers/GameController.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = new GameController();
    app.init();
});