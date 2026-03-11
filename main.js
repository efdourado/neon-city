// Arquivo: main.js
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 }, // A gravidade puxando para baixo
            debug: false,
        },
    },
    // Aqui nós passamos as classes que criamos nos outros arquivos!
    scene: [Fase1, Fase2] 
};

const game = new Phaser.Game(config);