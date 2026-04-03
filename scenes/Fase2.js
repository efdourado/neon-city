import Player from '../entities/Player.js';

export default class Fase2 extends Phaser.Scene {
  constructor () {
    super({ key: 'Fase2' });
  }

  preload () {
    this.load.image('lab_background', 'assets/bg/Lab.png');
    this.load.image('floor_left', 'assets/tiles/Tiles/Tile (1).png');
    this.load.image('floor_mid', 'assets/tiles/Tiles/Tile (2).png');
    this.load.image('floor_right', 'assets/tiles/Tiles/Tile (3).png');
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
      { frameWidth: 231, frameHeight: 132 }
    );
  }

  create () {
    this.screenWidth = Number(this.sys.game.config.width);
    this.screenHeight = Number(this.sys.game.config.height);
    this.worldHeight = this.screenHeight;
    this.backgroundScrollFactor = 0.22;

    const bgImage = this.textures.get('lab_background').getSourceImage();
    const bgScale = this.screenHeight / bgImage.height;
    const scaledBackgroundWidth = bgImage.width * bgScale;
    const scrollCoverageMargin = 1400;

    // Expande o mapa o suficiente para a camera percorrer toda a largura util do fundo.
    this.worldWidth = Math.ceil(
      this.screenWidth + ((scaledBackgroundWidth - this.screenWidth) / this.backgroundScrollFactor) + scrollCoverageMargin
    );

    this.bg = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'lab_background')
      .setOrigin(0, 0)
      .setScrollFactor(0);

    this.bg.tileScaleX = bgScale;
    this.bg.tileScaleY = bgScale;

    this.platforms = this.physics.add.staticGroup();
    this.bullets = this.physics.add.group();
    this.cursors = this.input.keyboard.createCursorKeys();

    this.createFloor();

    this.player = new Player(this, 180, 520);
    this.player.setDepth(12);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      bullet.destroy();
    });

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.add.text(36, 28, 'Fase 2', {
      fontSize: '28px',
      color: '#ffffff'
    })
      .setScrollFactor(0)
      .setDepth(20);
  }

  update () {
    if (!this.player) {
      return;
    }

    this.player.update(this.cursors);
    this.bg.tilePositionX = this.cameras.main.scrollX * this.backgroundScrollFactor;
  }

  createFloor() {
    const tileWidth = this.textures.get('floor_mid').getSourceImage().width;
    const floorY = this.screenHeight - 16;
    const columns = Math.ceil(this.worldWidth / tileWidth);

    for (let i = 0; i < columns; i++) {
      let texture = 'floor_mid';

      if (i === 0) {
        texture = 'floor_left';
      } else if (i === columns - 1) {
        texture = 'floor_right';
      }

      this.platforms.create((tileWidth / 2) + (i * tileWidth), floorY, texture);
    }
  }
}
