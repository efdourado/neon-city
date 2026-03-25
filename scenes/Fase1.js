
export default class Fase1 extends Phaser.Scene {
  constructor () {
    super({ key: 'Fase1' });
  }

  preload () {
      this.load.image('background', 'assets/bg/Background.png');
      this.load.image('floor_left', 'assets/tiles/Tiles/Tile (1).png');
      this.load.image('floor_mid', 'assets/tiles/Tiles/Tile (2).png');
      this.load.image('floor_right', 'assets/tiles/Tiles/Tile (3).png');
      this.load.spritesheet('nova', 'assets/player/Idle1.png',
          { frameWidth: 32, frameHeight: 48 }
      );
  }

  create () {
    // tamanho da tela
    const screen_width = this.sys.game.config.width;
    const screen_height = this.sys.game.config.height;
    // aqui basicamente vai criar o background de acordo com o tamanho da imagem e da tela
    this.bg = this.add.tileSprite(0, 0, screen_width, screen_height, 'background').setOrigin(0, 0);
    
    const imgWidth = this.textures.get('background').getSourceImage().width;
    const imgHeight = this.textures.get('background').getSourceImage().height;

    this.bg.tileScaleX = screen_width / imgWidth;
    this.bg.tileScaleY = screen_height / imgHeight;

    
    // cria as plataformas
    this.platforms = this.physics.add.staticGroup();
    
    this.createPlatform(125, 650, 5);
     
  }

  update () {
    this.bg.tilePositionX += 0.5;
  }

  createPlatform(initialX, initialY, repetitions) {
    // largura da plataforma
    let platWidth = this.textures.get('floor_mid').getSourceImage().width;

    for (let i = 0; i < repetitions; i++) {
      let x = initialX + (i * platWidth);
      
      if (i === 0) {
        this.platforms.create(x, initialY, 'floor_left');
      } else if (i === repetitions - 1) {
        this.platforms.create(x, initialY, 'floor_right');
      } else {
        this.platforms.create(x, initialY, 'floor_mid');
      }
    }
  }
}
