import Menu from './scenes/Menu.js';
import Instructions from './scenes/Instructions.js';
import Fase1 from './scenes/Fase1.js';
import Fase2 from './scenes/Fase2.js';
import FaseFinal from './scenes/FaseFinal.js';

const urlParams = new URLSearchParams(window.location.search);
const physicsDebug = urlParams.has('debug') || urlParams.has('dev');

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: physicsDebug
    }
  },

  scene: [Menu, Instructions, Fase1, Fase2, FaseFinal] 
};

const game = new Phaser.Game(config);
