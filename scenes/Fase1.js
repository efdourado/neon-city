import Player from '../entities/Player.js';

export default class Fase1 extends Phaser.Scene {
  constructor () {
    super({ key: 'Fase1' });
  }

  preload () {
    this.load.image('background', 'assets/bg/Background.png');
    this.load.image('floor_left', 'assets/tiles/Tiles/Tile (1).png');
    this.load.image('floor_mid', 'assets/tiles/Tiles/Tile (2).png');
    this.load.image('floor_right', 'assets/tiles/Tiles/Tile (3).png');
    this.load.image('floor_neutral', 'assets/tiles/Tiles/Tile (5).png');
    this.load.image('floor_bottom_left', 'assets/tiles/Tiles/Tile (4).png');
    this.load.image('floor_bottom_right', 'assets/tiles/Tiles/Tile (6).png');
    this.load.spritesheet('nova', 'assets/player/Idle1.png',
        { frameWidth: 48, frameHeight: 48 }
    );
    this.load.spritesheet('nova_run', 'assets/player/Run1.png',
        { frameWidth: 48, frameHeight: 48 }
    );
    this.load.spritesheet('nova_walk', 'assets/player/Walk1.png',
        { frameWidth: 48, frameHeight: 48 }
    );
    this.load.spritesheet('jump', 'assets/player/Jump1.png',
          { frameWidth: 48, frameHeight: 48 }  
    );
    this.load.spritesheet('bullet1', 'assets/guns/Bullets/bullet1.png', 
        { frameWidth: 231, frameHeight: 132}
    );
  }

  create () {
    // tamanho da tela
    this.screen_width = this.sys.game.config.width;
    this.screen_height = this.sys.game.config.height;
    // aqui basicamente vai criar o background de acordo com o tamanho da imagem e da tela
    this.bg = this.add.tileSprite(0, 0, this.screen_width, this.screen_height, 'background').setOrigin(0, 0);
    
    const imgWidth = this.textures.get('background').getSourceImage().width;
    const imgHeight = this.textures.get('background').getSourceImage().height;

    this.bg.tileScaleX = this.screen_width / imgWidth;
    this.bg.tileScaleY = this.screen_height / imgHeight;

    this.bg.setScrollFactor(0);

    this.bullets = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // cria as plataformas
    this.platforms = this.physics.add.staticGroup();
    
    this.createPlatform(125, 700, 3);
    this.createPlatform(1050, 500, 3);

    // cria os controles para o player
    this.cursors = this.input.keyboard.createCursorKeys();

    // cria o player
    this.player = new Player(this, 100, 400);
    this.physics.add.collider(this.player, this.platforms);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    const worldWidth = 2000;
    const worldHeight = 1200;
    this.cameras.main.setBounds(0,0, worldWidth, worldHeight);
    this.physics.world.setBounds(0,0, worldWidth, worldHeight);

    this.physics.add.collider(this.bullets, this.platforms);

    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      bullet.destroy();
    });
     
  }

  update () {
    this.bg.tilePositionX += 0.5;
    if(this.player) {
      this.player.update(this.cursors);
      this.cameras.main.scrollY = 0;
      // morte
      if (this.player.y > 800) 
      {
        this.scene.restart();
      }
    }

  }

  createPlatform(initialX, initialY, repetitions) {
    // largura da plataforma
    let platWidth = this.textures.get('floor_mid').getSourceImage().width;
    let platHeight = this.textures.get('floor_mid').getSourceImage().height;
    let numVerticalPlat = (this.screen_height + 1) / platHeight;

    for (let i = 0; i < numVerticalPlat; i++) 
    {
      for (let j = 0; j < repetitions; j++)
      {
        let y = initialY + (i * platHeight);      
        let x = initialX + (j * platWidth);
        
        if (i === 0) 
        {
          if (j === 0) 
          {
            this.platforms.create(x, y, 'floor_left');
          } 
          else if (j === repetitions - 1) 
          {
            this.platforms.create(x, y, 'floor_right');
          } 
          else 
          {
            this.platforms.create(x, y, 'floor_mid');
          }
        } 
        else 
        {
          if (j === 0) 
          {
            this.platforms.create(x, y, 'floor_bottom_left');
          }
          else if (j === repetitions - 1) 
          {
            this.platforms.create(x, y, 'floor_bottom_right');
          }
          else 
          {
            this.platforms.create(x, y, 'floor_neutral');
          }
        }
      }
    }
  }
}
