import Menu from './scenes/Menu.js';
import Fase1 from './scenes/Fase1.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  physics: {
  default: "arcade",
  arcade: {
    gravity: { y: 300 },
    debug: false,
  }, },

  scene: [Menu, Fase1] 
};

const game = new Phaser.Game(config);