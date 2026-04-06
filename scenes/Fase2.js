import Player from '../entities/Player.js';
import Bullet from '../entities/Bullet.js';
import Bot1 from '../entities/Bot1.js';
import Saw from '../entities/Saw.js';

export default class Fase2 extends Phaser.Scene {
  constructor () {
    super({ key: 'Fase2' });
  }

  preload () {
    this.load.image('lab_background', 'assets/bg/Lab.png');
    this.load.image('floor_left', 'assets/tiles/Tiles/Tile (1).png');
    this.load.image('floor_mid', 'assets/tiles/Tiles/Tile (2).png');
    this.load.image('floor_right', 'assets/tiles/Tiles/Tile (3).png');
    this.load.image('floor_neutral', 'assets/tiles/Tiles/Tile (5).png');

    this.load.image('acid', 'assets/tiles/Tiles/Acid (1).png');
    this.load.image('box', 'assets/tiles/Objects/Box.png');
    this.load.image('barrel', 'assets/tiles/Objects/Barrel (1).png');

    this.load.image('spike', 'assets/tiles/Tiles/Spike.png');
    this.load.image('saw', 'assets/tiles/Objects/Saw.png');
    this.load.image('access_card', 'assets/tiles/Objects/CartaoAcesso.png');
    this.load.image('door_locked', 'assets/tiles/Objects/DoorLocked.png');
    this.load.image('door_unlocked', 'assets/tiles/Objects/DoorUnlocked.png');
    this.load.image('door_open', 'assets/tiles/Objects/DoorOpen.png');

    this.load.spritesheet('nova', 'assets/player/Idle1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('nova_run', 'assets/player/Run1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('nova_walk', 'assets/player/Walk1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('jump', 'assets/player/Jump1.png', { frameWidth: 48, frameHeight: 48 });

    this.load.spritesheet('bot1_idle', 'assets/bots/bot1/Idle1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('bot1_walk', 'assets/bots/bot1/Walk1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('bot1_jump', 'assets/bots/bot1/Jump1.png', { frameWidth: 48, frameHeight: 48 });

    this.load.spritesheet('bullet1', 'assets/guns/Bullets/bullet1.png', { frameWidth: 231, frameHeight: 132 });
  }

  create () {
    this.screenWidth = Number(this.sys.game.config.width);
    this.screenHeight = Number(this.sys.game.config.height);
    this.worldHeight = 1200;
    this.worldWidth = 5600;
    this.backgroundScrollFactor = 0.22;

    const bgImage = this.textures.get('lab_background').getSourceImage();
    const bgScale = this.screenHeight / bgImage.height;

    this.bg = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'lab_background')
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.bg.tileScaleX = bgScale;
    this.bg.tileScaleY = bgScale;

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.decorations = this.physics.add.staticGroup();

    this.bullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.bots = this.physics.add.group();
    this.saws = this.physics.add.group();
    this.accessCards = this.physics.add.group({ allowGravity: false, immovable: true });

    this.maxHealth = 3;
    this.health = this.maxHealth;
    this.invulnerableUntil = 0;
    this.totalAccessCards = 3;
    this.collectedAccessCards = 0;
    this.exitDoorState = 'locked';
    this.isTransitioning = false;

    this.platformOccupancy = new Set();
    this.platformTopByX = new Map();
    this.platformTileWidth = this.textures.get('floor_mid').getSourceImage().width;
    this.platformTileHeight = this.textures.get('floor_mid').getSourceImage().height;

    this.createBoundaries();

    for (let x = 64; x < this.worldWidth; x += 128) {
      const acid = this.hazards.create(x, this.worldHeight - 150, 'acid')
        .setScale(1.5)
        .setTint(0x00ff00)
        .setDepth(10);
      acid.body.setSize(acid.width, acid.height - 30).setOffset(0, 30);
    }

    const platformLayout = [
      { x: 150, y: 900, repetitions: 4 },
      { x: 800, y: 750, repetitions: 3 },
      { x: 1350, y: 600, repetitions: 3 },
      { x: 1900, y: 750, repetitions: 3 },
      { x: 2450, y: 900, repetitions: 2 },
      { x: 2900, y: 750, repetitions: 2 },
      { x: 3350, y: 600, repetitions: 3 },
      { x: 3900, y: 450, repetitions: 2 },
      { x: 4350, y: 600, repetitions: 3 },
      { x: 4900, y: 750, repetitions: 2 },
      { x: 5300, y: 900, repetitions: 3 }
    ];

    platformLayout.forEach(({ x, y, repetitions }) => {
      this.createPlatform(x, y, repetitions);
    });

    this.createDecoration(950, 'box');
    this.createDecoration(2000, 'barrel');
    this.createDecoration(3500, 'box');

    this.createBot({ x: 300, patrolRange: 100, direction: 'right' });
    this.createBot({ x: 1500, patrolRange: 100, direction: 'left' });
    this.createBot({ x: 4500, patrolRange: 100, direction: 'left' });

    this.createGroundSaw({ x: 4500, range: 100, speed: 130, direction: 1 });
    this.createVerticalSaw({ x: 1260, y: 650, range: 100, speed: 150, direction: 1 });

    this.createAccessCard(1500);
    this.createAccessCard(2550);
    this.createAccessCard(4000);
    this.createAccessCard(4500);

    this.createExitDoor(5500);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.player = new Player(this, 200, 700);
    this.player.setDepth(12);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.decorations);
    this.physics.add.collider(this.bots, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => bullet.destroy());
    this.physics.add.collider(this.bullets, this.decorations, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => bullet.destroy());

    this.physics.add.overlap(this.player, this.hazards, () => {
      this.scene.restart();
    });
    this.physics.add.overlap(this.player, this.saws, (_, saw) => this.handlePlayerDamage(saw.x));
    this.physics.add.overlap(this.player, this.bots, (_, bot) => this.handlePlayerDamage(bot.x));
    this.physics.add.overlap(this.player, this.enemyBullets, (_, bullet) => {
      const sourceX = bullet.x;
      bullet.destroy();
      this.handlePlayerDamage(sourceX);
    });

    this.physics.add.overlap(this.bullets, this.bots, (bullet, bot) => {
      bullet.destroy();
      bot.takeDamage();
    });

    this.physics.add.overlap(this.player, this.accessCards, (_, card) => this.collectAccessCard(card));
    this.physics.add.overlap(this.player, this.exitDoorTrigger, (player) => this.tryEnterExitDoor(player));

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.createHealthBar();
    this.createAccessCardHud();
  }

  createHealthBar() {
    this.healthSegments = [];
    this.healthLabel = this.add.text(24, 18, 'HP', {
      fontSize: '20px',
      color: '#ffffff'
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(20);

    for (let i = 0; i < this.maxHealth; i++) {
      const segment = this.add.rectangle(70 + (i * 46), 24, 38, 16, 0x39d353)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(20);

      this.healthSegments.push(segment);
    }

    this.updateHealthBar();
  }

  updateHealthBar() {
    this.healthSegments.forEach((segment, index) => {
      segment.fillColor = index < this.health ? 0x39d353 : 0x3d3d52;
    });
  }

  createAccessCardHud() {
    this.accessCardHudIcon = this.add.image(this.screenWidth - 124, 30, 'access_card')
      .setOrigin(0, 0.5)
      .setScale(0.16)
      .setScrollFactor(0)
      .setDepth(20);

    this.accessCardHudText = this.add.text(this.screenWidth - 74, 18, `0/${this.totalAccessCards}`, {
      fontSize: '24px',
      color: '#ffffff'
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(20);
  }

  collectAccessCard(card) {
    if (!card?.active) {
      return;
    }

    card.destroy();
    this.collectedAccessCards += 1;
    this.accessCardHudText.setText(`${this.collectedAccessCards}/${this.totalAccessCards}`);

    if (this.collectedAccessCards >= this.totalAccessCards) {
      this.exitDoor.setTexture('door_unlocked');
      this.exitDoorTrigger.body.enable = true;
      this.exitDoorState = 'unlocked';
    }
  }

  update(time, delta) {
    if (this.player && !this.isTransitioning) {
      this.player.update(this.cursors);
      this.bg.tilePositionX = this.cameras.main.scrollX * this.backgroundScrollFactor;
    }

    this.bots.children.iterate((bot) => {
      if (bot?.active) {
        bot.update();
      }
    });
    this.bullets.children.iterate((bullet) => {
      if (bullet?.active) {
        bullet.update();
      }
    });
    this.enemyBullets.children.iterate((bullet) => {
      if (bullet?.active) {
        bullet.update();
      }
    });
    this.saws.children.iterate((saw) => {
      if (saw?.active) {
        saw.update(time, delta);
      }
    });

    if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
      this.scene.start('Menu');
    }
  }

  createBoundaries() {
    const w = this.worldWidth;
    const h = this.worldHeight;
    const thickness = 60;

    const teto = this.add.tileSprite(w / 2, thickness / 2, w, thickness, 'floor_mid');
    this.physics.add.existing(teto, true);
    this.platforms.add(teto);

    const chao = this.add.tileSprite(w / 2, h - thickness / 2, w, thickness, 'floor_mid');
    this.physics.add.existing(chao, true);
    this.platforms.add(chao);

    const paredeEsq = this.add.tileSprite(thickness / 2, h / 2, thickness, h, 'floor_mid');
    this.physics.add.existing(paredeEsq, true);
    this.platforms.add(paredeEsq);

    const paredeDir = this.add.tileSprite(w - thickness / 2, h / 2, thickness, h, 'floor_mid');
    this.physics.add.existing(paredeDir, true);
    this.platforms.add(paredeDir);
  }

  createDecoration(x, key) {
    const platformTop = this.getPlatformTopForX(x);
    if (!platformTop) {
      return;
    }

    const obj = this.decorations.create(x, platformTop, key);
    obj.setOrigin(0.5, 1);
    obj.setScale(0.5);
    obj.refreshBody();
  }

  createPlatform(initialX, initialY, repetitions) {
    const platWidth = this.platformTileWidth;
    const platHeight = this.platformTileHeight;

    for (let j = 0; j < repetitions; j++) {
      const x = initialX + (j * platWidth);
      const y = initialY;

      if (!this.platformOccupancy.has(`${x}:${y}`)) {
        let texture = 'floor_mid';
        if (j === 0) {
          texture = 'floor_left';
        } else if (j === repetitions - 1) {
          texture = 'floor_right';
        }

        this.platforms.create(x, y, texture);
        this.platformOccupancy.add(`${x}:${y}`);

        const platformTop = y - (platHeight / 2);
        if (!this.platformTopByX.has(x) || platformTop < this.platformTopByX.get(x)) {
          this.platformTopByX.set(x, platformTop);
        }
      }
    }
  }

  getPlatformTopForX(x) {
    for (let offset = 0; offset < this.platformTileWidth; offset += 5) {
      if (this.platformTopByX.has(x - offset)) {
        return this.platformTopByX.get(x - offset);
      }
      if (this.platformTopByX.has(x + offset)) {
        return this.platformTopByX.get(x + offset);
      }
    }

    return null;
  }

  createBot(config) {
    const platformTop = this.getPlatformTopForX(config.x);
    if (!platformTop) {
      return null;
    }

    const bot = new Bot1(this, config.x, platformTop, config);
    bot.setTint(0xffaa00);
    this.bots.add(bot);
    return bot;
  }

  createGroundSaw(config) {
    const platformTop = this.getPlatformTopForX(config.x);
    if (!platformTop) {
      return null;
    }

    const saw = new Saw(this, config.x, platformTop - 15, { axis: 'horizontal', ...config });
    this.saws.add(saw);
    return saw;
  }

  createVerticalSaw(config) {
    const saw = new Saw(this, config.x, config.y, { axis: 'vertical', ...config });
    this.saws.add(saw);
    return saw;
  }

  createAccessCard(x) {
    const platformTop = this.getPlatformTopForX(x);
    if (!platformTop) {
      return null;
    }

    const card = this.accessCards.create(x, platformTop - 40, 'access_card').setScale(0.18).setDepth(12);
    this.tweens.add({ targets: card, y: card.y - 10, duration: 900, yoyo: true, repeat: -1 });
    return card;
  }

  createExitDoor(x) {
    const platformTop = this.getPlatformTopForX(x);
    if (!platformTop) {
      return null;
    }

    this.exitDoor = this.physics.add.staticSprite(x, platformTop, 'door_locked')
      .setOrigin(0.5, 1)
      .setScale(0.42)
      .setDepth(10);
    this.exitDoorTrigger = this.add.zone(x, platformTop - 50, 40, 60);
    this.physics.add.existing(this.exitDoorTrigger, true);
    this.exitDoorTrigger.body.enable = false;
    return this.exitDoor;
  }

  tryEnterExitDoor(player) {
    if (this.isTransitioning || this.exitDoorState !== 'unlocked') {
      return;
    }

    this.isTransitioning = true;
    this.exitDoor.setTexture('door_open');
    player.setVelocity(0, 0);
    player.body.enable = false;
    player.play('idle', true);

    this.tweens.add({ targets: player, x: this.exitDoor.x, alpha: 0.15, scale: 0.7, duration: 850 });
    this.time.delayedCall(1000, () => this.cameras.main.fadeOut(250, 0, 0, 0));
    this.time.delayedCall(1250, () => {
      this.scene.start('Menu');
    });
  }

  handlePlayerDamage(sourceX) {
    if (this.time.now < this.invulnerableUntil) {
      return;
    }

    this.health -= 1;
    this.invulnerableUntil = this.time.now + 800;
    this.updateHealthBar();
    this.cameras.main.shake(120, 0.004);

    const knockDirection = this.player.x < sourceX ? -1 : 1;
    this.player.setVelocity(knockDirection * 220, -220);
    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      yoyo: true,
      repeat: 5,
      duration: 60,
      onComplete: () => this.player.setAlpha(1)
    });

    if (this.health <= 0) {
      this.time.delayedCall(150, () => this.scene.restart());
    }
  }

  spawnEnemyBullet(x, y, direction) {
    const bullet = new Bullet(this, x, y, direction, { owner: 'enemy', speed: 340, tint: 0xff7b7b });
    this.enemyBullets.add(bullet);
    bullet.body.setAllowGravity(false);
    bullet.setVelocityX(direction === 'left' ? -340 : 340);
    return bullet;
  }
}
