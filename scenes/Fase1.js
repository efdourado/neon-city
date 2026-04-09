import Player from '../entities/Player.js';
import Bullet from '../entities/Bullet.js';
import Bot1 from '../entities/Bot1.js';
import Saw from '../entities/Saw.js';

export default class Fase1 extends Phaser.Scene {
  constructor () {
    super({ key: 'Fase1' });
  }

  preload () {
    this.load.image('background', 'assets/bg/Dark_Background.png');
    this.load.image('spike', 'assets/tiles/Tiles/Spike.png');
    this.load.image('saw', 'assets/tiles/Objects/Saw.png');
    this.load.image('access_card', 'assets/tiles/Objects/CartaoAcesso.png');
    this.load.image('door_locked', 'assets/tiles/Objects/DoorLocked.png');
    this.load.image('door_unlocked', 'assets/tiles/Objects/DoorUnlocked.png');
    this.load.image('door_open', 'assets/tiles/Objects/DoorOpen.png');
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
    this.load.spritesheet('bot1_idle', 'assets/bots/bot1/Idle1.png',
        { frameWidth: 48, frameHeight: 48 }
    );
    this.load.spritesheet('bot1_walk', 'assets/bots/bot1/Walk1.png',
        { frameWidth: 48, frameHeight: 48 }
    );
    this.load.spritesheet('bot1_jump', 'assets/bots/bot1/Jump1.png',
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
    this.worldWidth = 5600;
    this.worldHeight = 1200;
    // aqui basicamente vai criar o background de acordo com o tamanho da imagem e da tela
    this.bg = this.add.tileSprite(0, 0, this.screen_width, this.screen_height, 'background').setOrigin(0, 0);
    
    const imgWidth = this.textures.get('background').getSourceImage().width;
    const imgHeight = this.textures.get('background').getSourceImage().height;

    this.bg.tileScaleX = this.screen_width / imgWidth;
    this.bg.tileScaleY = this.screen_height / imgHeight;

    this.bg.setScrollFactor(0);

    this.bullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.bots = this.physics.add.group();
    this.saws = this.physics.add.group();
    this.accessCards = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.maxHealth = 3;
    this.health = this.maxHealth;
    this.invulnerableUntil = 0;
    this.totalAccessCards = 5;
    this.collectedAccessCards = 0;
    this.exitDoor = null;
    this.exitDoorTrigger = null;
    this.exitDoorState = 'locked';
    this.isTransitioning = false;

    // cria as plataformas
    this.platforms = this.physics.add.staticGroup();
    this.platformOccupancy = new Set();
    this.platformTopByX = new Map();
    this.platformTileWidth = this.textures.get('floor_mid').getSourceImage().width;
    this.platformTileHeight = this.textures.get('floor_mid').getSourceImage().height;
    this.spikeScale = 0.6;
    this.spikeHitbox = {
      insetLeft: 18,
      insetRight: 18,
      top: 86,
      bottom: 6
    };

    const platformLayout = [
      { x: 125, y: 700, repetitions: 3 },
      { x: 1050, y: 500, repetitions: 3 },
      { x: 2074, y: 700, repetitions: 4 },
      { x: 3098, y: 500, repetitions: 3 },
      { x: 4122, y: 700, repetitions: 4 },
      { x: 4890, y: 500, repetitions: 3 }
    ];

    platformLayout.forEach(({ x, y, repetitions }) => {
      this.createPlatform(x, y, repetitions);
    });

    this.spikes = this.physics.add.staticGroup();
    [1306, 3098, 4378, 5146].forEach((x) => {
      this.createSpike(x);
    });

    [
      { x: 637, range: 92, speed: 110, direction: 1 },
      { x: 2586, range: 180, speed: 145, direction: -1 },
      { x: 4634, range: 180, speed: 135, direction: 1 }
    ].forEach((config) => {
      this.createGroundSaw(config);
    });

    [
      { x: 1306, y: 250, range: 120, speed: 125, direction: 1 },
      { x: 3610, y: 250, range: 150, speed: 140, direction: -1 }
    ].forEach((config) => {
      this.createVerticalSaw(config);
    });

    [381, 1562, 2330, 3610, 4890].forEach((x) => {
      this.createAccessCard(x);
    });

    this.createExitDoor(5402);

    // cria os controles para o player
    this.cursors = this.input.keyboard.createCursorKeys();
    this.handlePhase2Hotkey = (event) => {
      if (event.key === '\u00E7' || event.key === '\u00C7') {
        this.scene.start('Fase2');
      }
    };
    this.input.keyboard.on('keydown', this.handlePhase2Hotkey);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', this.handlePhase2Hotkey);
    });

    // cria o player
    this.player = new Player(this, 100, 400);
    this.player.setDepth(12);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.spikes, (_, spike) => {
      this.handlePlayerDamage(spike.x);
    });
    this.physics.add.overlap(this.player, this.saws, (_, saw) => {
      this.handlePlayerDamage(saw.x);
    });
    this.physics.add.overlap(this.player, this.bots, (_, bot) => {
      this.handlePlayerDamage(bot.x);
    });
    this.physics.add.overlap(this.player, this.accessCards, (_, card) => {
      this.collectAccessCard(card);
    });
    this.physics.add.overlap(this.player, this.exitDoorTrigger, (player) => {
      this.tryEnterExitDoor(player);
    });

    [
      { x: 381, patrolRange: 110, direction: 'right' },
      { x: 2330, patrolRange: 150, direction: 'left' },
      { x: 3354, patrolRange: 120, direction: 'right' },
      { x: 5402, patrolRange: 90, direction: 'left' }
    ].forEach((config) => {
      this.createBot(config);
    });

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.physics.add.collider(this.bots, this.platforms);
    this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => {
      bullet.destroy();
    });

    this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
      bullet.destroy();
    });
    this.physics.add.overlap(this.bullets, this.bots, (bullet, bot) => {
      bullet.destroy();
      bot.takeDamage();
    });
    this.physics.add.overlap(this.player, this.enemyBullets, (_, bullet) => {
      const sourceX = bullet.x;
      bullet.destroy();
      this.handlePlayerDamage(sourceX);
    });

    this.createHealthBar();
    this.createAccessCardHud();


    this.keyMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  update (time, delta) {
    if(this.player && !this.isTransitioning) {
      this.player.update(this.cursors);
      this.cameras.main.scrollY = 0;
      this.bg.tilePositionX = this.cameras.main.scrollX * 0.15;
      // morte
      if (this.player.y > 800) 
      {
        this.scene.restart();
      }
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

    if (Phaser.Input.Keyboard.JustDown(this.keyMenu)) {
      this.scene.start('Menu');
      return;
  } }

  createPlatform(initialX, initialY, repetitions) {
    let platWidth = this.platformTileWidth;
    let platHeight = this.platformTileHeight;
    let maxVerticalSegments = 2;

    for (let j = 0; j < repetitions; j++)
    {
      let x = initialX + (j * platWidth);
      let segments = [];

      for (let i = 0; i < maxVerticalSegments; i++)
      {
        let y = initialY + (i * platHeight);
        let occupiedKey = `${x}:${y}`;

        if (y > this.worldHeight) {
          break;
        }

        if (this.platformOccupancy.has(occupiedKey)) {
          break;
        }

        segments.push({ x, y });
      }

      segments.forEach(({ x, y }, index) => {
        this.platforms.create(x, y, this.getPlatformTexture(index, j, repetitions));
        this.platformOccupancy.add(`${x}:${y}`);

        if (index === 0) {
          const platformTop = y - (platHeight / 2);
          const currentTop = this.platformTopByX.get(x);

          if (currentTop === undefined || platformTop < currentTop) {
            this.platformTopByX.set(x, platformTop);
          }
        }
      });
    }
  }

  getPlatformTexture(rowIndex, columnIndex, columnCount) {
    if (rowIndex === 0) {
      if (columnIndex === 0) {
        return 'floor_left';
      }

      if (columnIndex === columnCount - 1) {
        return 'floor_right';
      }

      return 'floor_mid';
    }

    if (columnIndex === 0) {
      return 'floor_bottom_left';
    }

    if (columnIndex === columnCount - 1) {
      return 'floor_bottom_right';
    }

    return 'floor_neutral';
  }

  createSpike(x) {
    const platformTop = this.getPlatformTopForX(x);

    if (platformTop === null) {
      console.warn(`Spike at x=${x} has no platform support and was skipped.`);
      return;
    }

    const spike = this.spikes.create(x, platformTop, 'spike');

    spike.setOrigin(0.5, 1);
    spike.setScale(this.spikeScale);
    spike.refreshBody();

    const hitboxWidth = Math.round(
      spike.displayWidth - ((this.spikeHitbox.insetLeft + this.spikeHitbox.insetRight) * this.spikeScale)
    );
    const hitboxHeight = Math.round(
      spike.displayHeight - ((this.spikeHitbox.top + this.spikeHitbox.bottom) * this.spikeScale)
    );

    spike.body.setSize(hitboxWidth, hitboxHeight);
    spike.body.setOffset(
      Math.round(this.spikeHitbox.insetLeft * this.spikeScale),
      Math.round(this.spikeHitbox.top * this.spikeScale)
    );
  }

  createBot(config) {
    const platformTop = this.getPlatformTopForX(config.x);

    if (platformTop === null) {
      console.warn(`Bot at x=${config.x} has no platform support and was skipped.`);
      return null;
    }

    const bot = new Bot1(this, config.x, platformTop, config);
    this.bots.add(bot);

    return bot;
  }

  createGroundSaw(config) {
    const platformTop = this.getPlatformTopForX(config.x);

    if (platformTop === null) {
      console.warn(`Ground saw at x=${config.x} has no platform support and was skipped.`);
      return null;
    }

    const scale = config.scale ?? 0.16;
    const texture = this.textures.get('saw').getSourceImage();
    const sawY = platformTop - ((texture.height * scale) / 2) + 8;
    const saw = new Saw(this, config.x, sawY, {
      axis: 'horizontal',
      speed: config.speed,
      direction: config.direction,
      rotationSpeed: config.rotationSpeed,
      scale,
      minX: config.x - (config.range ?? 120),
      maxX: config.x + (config.range ?? 120),
      minY: sawY,
      maxY: sawY
    });

    this.saws.add(saw);
    return saw;
  }

  createVerticalSaw(config) {
    const range = config.range ?? 140;
    const saw = new Saw(this, config.x, config.y, {
      axis: 'vertical',
      speed: config.speed,
      direction: config.direction,
      rotationSpeed: config.rotationSpeed,
      scale: config.scale ?? 0.16,
      minX: config.x,
      maxX: config.x,
      minY: config.y - range,
      maxY: config.y + range
    });

    this.saws.add(saw);
    return saw;
  }

  createAccessCard(x) {
    const platformTop = this.getPlatformTopForX(x);

    if (platformTop === null) {
      console.warn(`Access card at x=${x} has no platform support and was skipped.`);
      return null;
    }

    const scale = 0.18;
    const texture = this.textures.get('access_card').getSourceImage();
    const cardY = platformTop - ((texture.height * scale) / 2) - 18;
    const card = this.accessCards.create(x, cardY, 'access_card');

    card.setScale(scale);
    card.setDepth(12);
    card.body.setAllowGravity(false);
    card.body.setImmovable(true);
    card.body.setSize(
      Math.round(card.displayWidth * 0.72),
      Math.round(card.displayHeight * 0.8)
    );
    card.body.setOffset(
      Math.round(card.displayWidth * 0.14),
      Math.round(card.displayHeight * 0.1)
    );

    this.tweens.add({
      targets: card,
      y: card.y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return card;
  }

  createExitDoor(x) {
    const platformTop = this.getPlatformTopForX(x);

    if (platformTop === null) {
      console.warn(`Exit door at x=${x} has no platform support and was skipped.`);
      return null;
    }

    const scale = 0.42;
    const door = this.physics.add.staticSprite(x, platformTop, 'door_locked');

    door.setOrigin(0.5, 1);
    door.setScale(scale);
    door.setDepth(10);
    door.refreshBody();

    this.exitDoor = door;
    this.exitDoorTrigger = this.add.zone(
      x,
      platformTop - Math.round(door.displayHeight * 0.24),
      Math.round(door.displayWidth * 0.28),
      Math.round(door.displayHeight * 0.44)
    );
    this.physics.add.existing(this.exitDoorTrigger, true);
    this.exitDoorTrigger.body.enable = false;

    return door;
  }

  spawnEnemyBullet(x, y, direction) {
    const bullet = new Bullet(this, x, y, direction, {
      owner: 'enemy',
      speed: 340,
      maxDistance: 1100,
      tint: 0xff7b7b
    });

    this.enemyBullets.add(bullet);
    bullet.body.setAllowGravity(false);
    bullet.body.moves = true;
    bullet.setVelocityX(direction === 'left' ? -340 : 340);

    return bullet;
  }

  getPlatformTopForX(x) {
    if (this.platformTopByX.has(x)) {
      return this.platformTopByX.get(x);
    }

    return null;
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

  createAccessCardHud() {
    this.accessCardHudIcon = this.add.image(this.screen_width - 124, 30, 'access_card')
      .setOrigin(0, 0.5)
      .setScale(0.16)
      .setScrollFactor(0)
      .setDepth(20);

    this.accessCardHudText = this.add.text(this.screen_width - 74, 18, '0/5', {
      fontSize: '24px',
      color: '#ffffff'
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(20);

    this.updateAccessCardHud();
  }

  updateHealthBar() {
    this.healthSegments.forEach((segment, index) => {
      segment.fillColor = index < this.health ? 0x39d353 : 0x3d3d52;
    });
  }

  updateAccessCardHud() {
    this.accessCardHudText.setText(`${this.collectedAccessCards}/${this.totalAccessCards}`);
  }

  collectAccessCard(card) {
    if (!card?.active) {
      return;
    }

    card.destroy();
    this.collectedAccessCards += 1;
    this.updateAccessCardHud();

    if (this.collectedAccessCards >= this.totalAccessCards) {
      this.unlockExitDoor();
    }
  }

  unlockExitDoor() {
    if (!this.exitDoor || this.exitDoorState !== 'locked') {
      return;
    }

    this.exitDoor.setTexture('door_unlocked');
    this.exitDoor.refreshBody();
    this.exitDoorTrigger.body.enable = true;
    this.exitDoorState = 'unlocked';
  }

  tryEnterExitDoor(player) {
    if (this.isTransitioning || !this.exitDoor || this.exitDoorState !== 'unlocked') {
      return;
    }

    this.isTransitioning = true;
    this.exitDoorTrigger.body.enable = false;
    this.exitDoor.setTexture('door_open');
    this.exitDoor.refreshBody();
    this.exitDoorState = 'open';

    player.setVelocity(0, 0);
    player.body.enable = false;
    player.play('idle', true);

    this.tweens.add({
      targets: player,
      x: this.exitDoor.x,
      y: this.exitDoor.y - 6,
      alpha: 0.15,
      scaleX: player.scaleX * 0.7,
      scaleY: player.scaleY * 0.7,
      duration: 850,
      ease: 'Sine.easeInOut'
    });

    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
    });
    this.time.delayedCall(1250, () => {
      this.scene.start('Fase2');
    });
  }

  handlePlayerDamage(sourceX) {
    const now = this.time.now;

    if (now < this.invulnerableUntil) {
      return;
    }

    this.health -= 1;
    this.invulnerableUntil = now + 800;
    this.updateHealthBar();
    this.cameras.main.shake(120, 0.004);

    const knockDirection = this.player.x < sourceX ? -1 : 1;
    this.player.setVelocityX(knockDirection * 220);
    this.player.setVelocityY(-220);

    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      yoyo: true,
      repeat: 5,
      duration: 60,
      onComplete: () => this.player.setAlpha(1)
    });

    if (this.health <= 0) {
      this.time.delayedCall(150, () => {
        this.scene.restart();
      });
    }
  }
}
