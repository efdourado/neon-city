import Fase1 from './scenes/Fase1.js';
// Arquivo: main.js
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 }, // A gravidade puxando para baixo
            debug: true,
        },
    },
    // Aqui nós passamos as classes que criamos nos outros arquivos!
    scene: [Fase1] 
};

const game = new Phaser.Game(config);

