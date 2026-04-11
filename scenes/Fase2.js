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
    this.load.image('floor_bottom_left', 'assets/tiles/Tiles/Tile (4).png');
    this.load.image('floor_bottom_right', 'assets/tiles/Tiles/Tile (6).png');
    this.load.image('high_left', 'assets/tiles/Tiles/Tile (13).png');
    this.load.image('high_mid', 'assets/tiles/Tiles/Tile (14).png');
    this.load.image('high_right', 'assets/tiles/Tiles/Tile (15).png');

    this.load.image('acid', 'assets/tiles/Tiles/Acid (1).png');
    this.load.image('box', 'assets/tiles/Objects/Box.png');
    this.load.image('barrel', 'assets/tiles/Objects/Barrel (1).png');
    this.load.image('barrel_alt', 'assets/tiles/Objects/Barrel (2).png');
    this.load.image('switch_off', 'assets/tiles/Objects/Switch (1).png');
    this.load.image('switch_on', 'assets/tiles/Objects/Switch (2).png');

    this.load.image('spike', 'assets/tiles/Tiles/Spike.png');
    this.load.image('saw', 'assets/tiles/Objects/Saw.png');
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
    this.worldWidth = 15000;
    this.backgroundScrollFactor = 0.22;
    this.finalCorridorStartX = 10496;
    this.finalCorridorFloorY = 860;
    this.finalCorridorTriggerX = 10752;
    this.finalCorridorExitX = 13120;
    this.finalRunSpeed = 320;
    this.finalCorridorSkipX = this.finalCorridorTriggerX - 320;

    const bgImage = this.textures.get('lab_background').getSourceImage();
    const bgScale = this.screenHeight / bgImage.height;

    this.bg = this.add.tileSprite(0, 0, this.screenWidth, this.screenHeight, 'lab_background')
      .setOrigin(0, 0)
      .setScrollFactor(0);
    this.bg.tileScaleX = bgScale;
    this.bg.tileScaleY = bgScale;

    this.autoRunGrayOverlay = this.add.rectangle(0, 0, this.screenWidth, this.screenHeight, 0x9a9a9a, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(50);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.decorations = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.routeSwitches = this.physics.add.staticGroup();

    this.bullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.bots = this.physics.add.group();
    this.saws = this.physics.add.group();
    this.sawBarriers = new Map();

    this.maxHealth = 3;
    this.health = this.maxHealth;
    this.invulnerableUntil = 0;
    this.isTransitioning = false;
    this.isRespawning = false;
    this.isAutoRunning = false;
    this.isAutoRunFinishing = false;
    this.devOverlayVisible = false;
    this.totalRouteSwitches = 2;
    this.activatedRouteSwitches = 0;

    this.platformOccupancy = new Set();
    this.platformTopByX = new Map();
    this.platformTileWidth = this.textures.get('floor_mid').getSourceImage().width;
    this.platformTileHeight = this.textures.get('floor_mid').getSourceImage().height;
    this.spikeScale = 0.58;
    this.spikeHitbox = {
      insetLeft: 18,
      insetRight: 18,
      top: 86,
      bottom: 6
    };

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

      { x: 1280, y: 900, repetitions: 3 },
      { x: 2048, y: 900, repetitions: 6 },
      { x: 3840, y: 900, repetitions: 3 },
      { x: 2048, y: 640, repetitions: 1, style: 'high' },
      { x: 2304, y: 420, repetitions: 2, style: 'high' },

      { x: 4352, y: 780, repetitions: 2 },
      { x: 4864, y: 620, repetitions: 2, style: 'high' },
      { x: 5376, y: 860, repetitions: 7 },
      { x: 7424, y: 860, repetitions: 3 },
      { x: 5632, y: 620, repetitions: 1, style: 'high' },
      { x: 5888, y: 420, repetitions: 2, style: 'high' },

      { x: 8192, y: 700, repetitions: 2, style: 'high' },
      { x: 8704, y: 860, repetitions: 3, supportRows: 1 },
      { x: 9472, y: 700, repetitions: 2, style: 'high' },
      { x: 9984, y: 860, repetitions: 1, supportRows: 1 },
      { x: this.finalCorridorStartX, y: 860, repetitions: 14, supportRows: 1 },
      { x: this.finalCorridorStartX, y: 420, repetitions: 14, style: 'high' }
    ];

    platformLayout.forEach((config) => {
      this.createPlatform(config);
    });

    [
      { x: 2816, topY: 36, rows: 3 },
      { x: 3072, topY: 36, rows: 3 },
      { x: 6400, topY: -20, rows: 3 },
      { x: 6656, topY: -20, rows: 3 },
      { x: 10240, topY: 36, rows: 5, skipRows: [2, 3] }
    ].forEach((config) => this.createSolidWall(config));

    [
      { x: 406, key: 'box' },
      { x: 1792, key: 'barrel' },
      { x: 2304, key: 'barrel_alt' },
      { x: 3584, key: 'barrel' },
      { x: 4864, key: 'barrel_alt' },
      { x: 5888, key: 'barrel' },
      { x: 7424, key: 'barrel_alt' },
      { x: 8960, key: 'barrel' }
    ].forEach((config) => this.createDecoration(config));

    [
      1536,
      3328,
      4608,
      7680,
      8960,
      9984
    ].forEach((x) => this.createSpike(x));

    [
      { x: 2560, barrierId: 'gate1' },
      { x: 6144, barrierId: 'gate2' }
    ].forEach((config) => this.createRouteSwitch(config));

    [
      { x: 300, patrolRange: 90, direction: 'right', shotCooldownMin: 1700 },
      { x: 2048, patrolRange: 120, direction: 'right', moveSpeed: 105, shotCooldownMin: 1500, shotCooldownMax: 2200 },
      { x: 3840, patrolRange: 90, direction: 'left', maxHealth: 3 },
      { x: 5632, patrolRange: 70, direction: 'right', moveSpeed: 110, shotCooldownMin: 1450, shotCooldownMax: 2150 },
      { x: 7424, patrolRange: 80, direction: 'left', maxHealth: 3 },
      { x: 8704, patrolRange: 100, direction: 'right', moveSpeed: 108, shotCooldownMin: 1400, shotCooldownMax: 2050 },
      { x: 9984, patrolRange: 90, direction: 'left', maxHealth: 3, shotCooldownMin: 1350, shotCooldownMax: 2000 }
    ].forEach((config) => this.createBot(config));

    [
      { x: 3328, range: 54, speed: 135, direction: -1 },
      { x: 7680, range: 54, speed: 150, direction: 1 },
      { x: 8960, range: 56, speed: 155, direction: -1 }
    ].forEach((config) => this.createGroundSaw(config));

    [
      { x: 7680, y: 560, range: 130, speed: 180, direction: 1 },
      { x: 9216, y: 560, range: 120, speed: 185, direction: -1 }
    ].forEach((config) => this.createVerticalSaw(config));

    [
      {
        id: 'gate1',
        xPositions: [3072, 3328, 3584, 3840, 4096],
        yPositions: [520, 640, 760, 880, 1000],
        range: 130,
        speed: 470
      },
      {
        id: 'gate2',
        xPositions: [6656, 6912, 7168, 7424, 7680],
        yPositions: [520, 640, 760, 880, 1000],
        range: 130,
        speed: 490
      }
    ].forEach((config) => this.createSawBarrier(config));

    this.phaseStart = {
      x: 220,
      y: this.getPlatformTopForX(220) ?? 700
    };

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keySkipToCorridor = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.keyDevOverlay = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.player = new Player(this, this.phaseStart.x, this.phaseStart.y);
    this.player.setDepth(12);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.decorations);
    this.physics.add.collider(this.bots, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => bullet.destroy());

    this.physics.add.overlap(this.player, this.hazards, () => this.restartPhase());
    this.physics.add.overlap(this.player, this.spikes, (_, spike) => this.handlePlayerDamage(spike.x));
    this.physics.add.overlap(this.player, this.saws, (_, saw) => this.handlePlayerDamage(saw.x));
    this.physics.add.overlap(this.player, this.bots, (_, bot) => this.handlePlayerDamage(bot.x));
    this.physics.add.overlap(this.player, this.routeSwitches, (_, routeSwitch) => this.activateRouteSwitch(routeSwitch));
    this.physics.add.overlap(this.player, this.enemyBullets, (_, bullet) => {
      const sourceX = bullet.x;
      bullet.destroy();
      this.handlePlayerDamage(sourceX);
    });

    this.physics.add.overlap(this.bullets, this.bots, (bullet, bot) => {
      bullet.destroy();
      bot.takeDamage(bullet.damage ?? 1);
    });

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.createFinalCorridorTrigger();
    this.createHealthBar();
    this.createObjectiveHud();
    this.createDevOverlay();
    this.showObjectivePulse('Ative os switches e sobreviva ao laboratorio.');
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

  createObjectiveHud() {
    this.objectiveText = this.add.text(24, 54, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(22);

    this.phaseBadge = this.add.text(24, 82, 'FASE 2: Laboratorio Subterraneo', {
      fontFamily: '"Courier New", monospace',
      fontSize: '15px',
      color: '#7df9ff',
      stroke: '#000000',
      strokeThickness: 3
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(22);

    this.objectivePulse = this.add.text(this.screenWidth / 2, 124, '', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center'
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(40)
      .setAlpha(0);

    this.updateObjectiveHud();
  }

  updateObjectiveHud() {
    if (!this.objectiveText) {
      return;
    }

    const gateText = this.activatedRouteSwitches >= this.totalRouteSwitches
      ? 'corredor final liberado'
      : `switches ${this.activatedRouteSwitches}/${this.totalRouteSwitches}`;
    const runText = this.isAutoRunning ? 'lockdown em fuga' : gateText;
    this.objectiveText.setText(`Objetivo: ${runText}`);
  }

  showObjectivePulse(message) {
    if (!this.objectivePulse) {
      return;
    }

    this.tweens.killTweensOf(this.objectivePulse);
    this.objectivePulse.setText(message);
    this.objectivePulse.setAlpha(0);
    this.objectivePulse.setY(124);

    this.tweens.add({
      targets: this.objectivePulse,
      alpha: 1,
      y: 110,
      duration: 180,
      yoyo: true,
      hold: 1450,
      onComplete: () => this.objectivePulse.setAlpha(0)
    });
  }

  createDevOverlay() {
    this.devOverlay = this.add.text(24, 112, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#aefcff',
      backgroundColor: 'rgba(0, 0, 0, 0.58)',
      padding: { x: 10, y: 8 }
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(80)
      .setVisible(false);
  }

  toggleDevOverlay() {
    this.devOverlayVisible = !this.devOverlayVisible;
    this.devOverlay.setVisible(this.devOverlayVisible);
    this.updateDevOverlay();
  }

  updateDevOverlay() {
    if (!this.devOverlayVisible || !this.devOverlay) {
      return;
    }

    this.devOverlay.setText([
      'DEV STATUS - FASE 2',
      `HP Nova: ${this.health}/${this.maxHealth}`,
      `Switches: ${this.activatedRouteSwitches}/${this.totalRouteSwitches}`,
      `Bots vivos: ${this.bots.countActive(true)}`,
      `Serras: ${this.saws.countActive(true)}`,
      `Tiros player/inimigo: ${this.bullets.countActive(true)}/${this.enemyBullets.countActive(true)}`,
      `Auto-run: ${this.isAutoRunning ? 'sim' : 'nao'}`,
      `Player x/y: ${Math.round(this.player?.x ?? 0)}, ${Math.round(this.player?.y ?? 0)}`,
      'D overlay | L corredor | M menu'
    ]);
  }

  update(time, delta) {
    if (this.player) {
      this.bg.tilePositionX = this.cameras.main.scrollX * this.backgroundScrollFactor;

      if (this.isAutoRunning) {
        this.updateFinalCorridorRun();
      } else if (!this.isTransitioning) {
        this.player.update(this.cursors);

        if (this.player.y > this.worldHeight + 120) {
          this.restartPhase();
        }
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

    if (!this.isAutoRunning && !this.isTransitioning && Phaser.Input.Keyboard.JustDown(this.keySkipToCorridor)) {
      this.jumpToFinalCorridor();
    }

    if (!this.isAutoRunning && Phaser.Input.Keyboard.JustDown(this.keyMenu)) {
      this.scene.start('Menu');
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyDevOverlay)) {
      this.toggleDevOverlay();
    }

    this.updateDevOverlay();
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

  createDecoration(config) {
    const x = typeof config === 'number' ? config : config.x;
    const key = typeof config === 'string' ? config : config.key;
    const platformTop = this.getPlatformTopForX(x);
    if (platformTop === null) {
      return;
    }

    const obj = this.decorations.create(x, platformTop, key);
    obj.setOrigin(0.5, 1);
    obj.setScale(config.scale ?? 0.5);
    obj.refreshBody();
  }

  createRouteSwitch(config) {
    const platformTop = this.getPlatformTopExactForX(config.x);
    if (platformTop === null) {
      return null;
    }

    const routeSwitch = this.routeSwitches.create(config.x, platformTop - 6, 'switch_off');
    routeSwitch.setOrigin(0.5, 1);
    routeSwitch.setScale(0.5);
    routeSwitch.setDepth(13);
    routeSwitch.refreshBody();
    routeSwitch.body.setSize(
      Math.round(routeSwitch.displayWidth * 0.7),
      Math.round(routeSwitch.displayHeight * 0.8)
    );
    routeSwitch.body.setOffset(
      Math.round(routeSwitch.displayWidth * 0.15),
      Math.round(routeSwitch.displayHeight * 0.2)
    );
    routeSwitch.activated = false;
    routeSwitch.barrierId = config.barrierId;

    return routeSwitch;
  }

  createFinalCorridorTrigger() {
    const corridorTop = this.finalCorridorFloorY - (this.platformTileHeight / 2);
    const trigger = this.add.zone(this.finalCorridorTriggerX, corridorTop - 18, 260, 260);
    this.physics.add.existing(trigger, true);

    this.finalCorridorTrigger = trigger;
    this.physics.add.overlap(this.player, trigger, () => this.startFinalCorridorSequence());
    return trigger;
  }

  jumpToFinalCorridor() {
    if (!this.player?.body) {
      return;
    }

    const targetY = this.finalCorridorFloorY - (this.platformTileHeight / 2);
    this.player.setPosition(this.finalCorridorSkipX, targetY);
    this.player.setVelocity(0, 0);
    this.player.body.stop();
    this.player.body.updateFromGameObject();
    this.player.setFlipX(false);
    this.player.displayOriginX = 24;
    this.player.body.setOffset(2, 14);
    this.player.direction = 'right';
    this.player.play('idle', true);
    this.cameras.main.flash(120, 180, 220, 255);
  }

  startFinalCorridorSequence() {
    if (this.isAutoRunning || this.isTransitioning || !this.player?.body) {
      return;
    }

    this.isAutoRunning = true;
    this.isAutoRunFinishing = false;
    this.invulnerableUntil = Number.MAX_SAFE_INTEGER;
    this.bullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.updateObjectiveHud();
    this.showObjectivePulse('Lockdown ativado. Fuga automatica para a camara final.');
    this.player.setVelocityY(0);
    this.player.setFlipX(false);
    this.player.displayOriginX = 24;
    this.player.body.setOffset(2, 14);
    this.player.direction = 'right';
    this.cameras.main.flash(160, 255, 255, 255);
    this.tweens.killTweensOf(this.cameras.main);
    this.autoRunGrayOverlay.setAlpha(0.08);
    this.cameras.main.setZoom(1);
    this.cameras.main.shake(220, 0.0025);

    if (this.finalCorridorTrigger?.body) {
      this.finalCorridorTrigger.body.enable = false;
    }
  }

  updateFinalCorridorRun() {
    if (!this.player?.body) {
      return;
    }

    this.player.setVelocityX(this.finalRunSpeed);
    this.player.setFlipX(false);
    this.player.displayOriginX = 24;
    this.player.body.setOffset(2, 14);
    this.player.direction = 'right';

    const runProgress = Phaser.Math.Clamp(
      (this.player.x - this.finalCorridorTriggerX) / (this.finalCorridorExitX - this.finalCorridorTriggerX),
      0,
      1
    );
    this.autoRunGrayOverlay.setAlpha(Phaser.Math.Linear(0.08, 0.42, runProgress));

    if (this.player.body.blocked.down) {
      this.player.play('run', true);
    } else {
      this.player.play('jump', true);
    }

    if (!this.isAutoRunFinishing && this.player.x >= this.finalCorridorExitX) {
      this.finishFinalCorridorSequence();
    }
  }

  finishFinalCorridorSequence() {
    if (this.isAutoRunFinishing || !this.player?.body) {
      return;
    }

    this.isAutoRunFinishing = true;
    this.isTransitioning = true;
    this.showObjectivePulse('Camara do Data-Core localizada.');
    this.tweens.add({
      targets: this.autoRunGrayOverlay,
      alpha: 0.58,
      duration: 260,
      ease: 'Sine.easeInOut'
    });
    this.cameras.main.setZoom(1);
    this.cameras.main.fadeOut(520, 145, 145, 145);
    this.time.delayedCall(560, () => {
      this.scene.start('FaseFinal');
    });
  }

  createSolidWall(config) {
    const skipRows = new Set(config.skipRows ?? []);

    for (let row = 0; row < config.rows; row++) {
      if (skipRows.has(row)) {
        continue;
      }

      const y = config.topY + (row * this.platformTileHeight);
      const wall = this.platforms.create(config.x, y, 'floor_neutral');
      wall.body.setSize(this.platformTileWidth, this.platformTileHeight);
      wall.body.setOffset(0, 0);
    }
  }

  createPlatform(configOrX, initialY, repetitions) {
    const config = typeof configOrX === 'object'
      ? configOrX
      : { x: configOrX, y: initialY, repetitions };
    const platWidth = this.platformTileWidth;
    const platHeight = this.platformTileHeight;
    const supportRows = config.supportRows ?? 0;
    const style = config.style ?? (config.y <= 640 ? 'high' : 'normal');
    const supportStyle = config.supportStyle ?? 'support';

    for (let j = 0; j < config.repetitions; j++) {
      const x = config.x + (j * platWidth);

      for (let rowIndex = 0; rowIndex <= supportRows; rowIndex++) {
        const y = config.y + (rowIndex * platHeight);
        const occupiedKey = `${x}:${y}`;

        if (this.platformOccupancy.has(occupiedKey)) {
          continue;
        }

        const texture = this.getPlatformTexture(
          rowIndex === 0 ? style : supportStyle,
          rowIndex,
          j,
          config.repetitions
        );

        let tile = null;
        if (rowIndex === 0) {
          tile = this.platforms.create(x, y, texture);
          if (style === 'high') {
            tile.body.setSize(this.platformTileWidth, 131);
            tile.body.setOffset(0, 0);
          }
        } else {
          tile = this.add.image(x, y, texture);
          tile.setOrigin(0.5, 0.5);
          tile.setDepth(1);
        }
        this.platformOccupancy.add(occupiedKey);

        if (rowIndex === 0) {
          const platformTop = y - (platHeight / 2);
          if (!this.platformTopByX.has(x) || platformTop < this.platformTopByX.get(x)) {
            this.platformTopByX.set(x, platformTop);
          }
        }
      }
    }
  }

  getPlatformTexture(style, rowIndex, columnIndex, columnCount) {
    if (style === 'high' && rowIndex === 0) {
      return 'high_mid';
    }

    if (style === 'support' || rowIndex > 0) {
      return 'floor_neutral';
    }

    return 'floor_mid';
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

  getPlatformTopExactForX(x) {
    return this.platformTopByX.get(x) ?? null;
  }

  createBot(config) {
    const platformTop = this.getPlatformTopForX(config.x);
    if (platformTop === null) {
      return null;
    }

    const bot = new Bot1(this, config.x, platformTop, {
      ...config,
      tint: config.tint ?? 0xffaa00
    });
    this.bots.add(bot);
    return bot;
  }

  createSpike(x) {
    const platformTop = this.getPlatformTopExactForX(x);
    if (platformTop === null) {
      return null;
    }

    const spike = this.spikes.create(x, platformTop, 'spike');
    spike.setOrigin(0.5, 1);
    spike.setScale(this.spikeScale);
    spike.setDepth(11);
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

    return spike;
  }

  createGroundSaw(config) {
    const platformTop = this.getPlatformTopForX(config.x);
    if (platformTop === null) {
      return null;
    }

    const scale = config.scale ?? 0.16;
    const texture = this.textures.get('saw').getSourceImage();
    const sawY = platformTop - ((texture.height * scale) / 2) - 12;
    const range = config.range ?? 120;
    const saw = new Saw(this, config.x, sawY, {
      axis: 'horizontal',
      speed: config.speed,
      direction: config.direction,
      rotationSpeed: config.rotationSpeed,
      scale,
      depth: config.depth ?? 12,
      minX: config.x - range,
      maxX: config.x + range,
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
      depth: config.depth ?? 12,
      minX: config.x,
      maxX: config.x,
      minY: config.y - range,
      maxY: config.y + range
    });

    this.saws.add(saw);
    return saw;
  }

  createSawBarrier(config) {
    const xPositions = config.xPositions ?? [config.x];
    const barrierSaws = [];

    xPositions.forEach((x, columnIndex) => {
      config.yPositions.forEach((y, index) => {
        const saw = new Saw(this, x, y, {
          axis: 'vertical',
          speed: config.speed,
          direction: (index + columnIndex) % 2 === 0 ? 1 : -1,
          rotationSpeed: 340,
          scale: 0.16,
          depth: 12,
          minX: x,
          maxX: x,
          minY: y - config.range,
          maxY: y + config.range
        });

        this.saws.add(saw);
        barrierSaws.push(saw);
      });
    });

    this.sawBarriers.set(config.id, barrierSaws);
    return barrierSaws;
  }

  deactivateSawBarrier(barrierId) {
    const barrierSaws = this.sawBarriers.get(barrierId);
    if (!barrierSaws) {
      return;
    }

    barrierSaws.forEach((saw) => {
      if (saw?.active) {
        saw.destroy();
      }
    });

    this.sawBarriers.delete(barrierId);
  }

  activateRouteSwitch(routeSwitch) {
    if (!routeSwitch?.active || routeSwitch.activated) {
      return;
    }

    routeSwitch.activated = true;
    routeSwitch.setTexture('switch_on');
    routeSwitch.refreshBody();
    this.deactivateSawBarrier(routeSwitch.barrierId);
    this.activatedRouteSwitches += 1;
    this.updateObjectiveHud();
    this.cameras.main.shake(160, 0.0035);
    this.cameras.main.flash(120, 80, 255, 180);

    if (this.activatedRouteSwitches >= this.totalRouteSwitches) {
      this.showObjectivePulse('Rota final liberada. Corra para o nucleo.');
    } else {
      this.showObjectivePulse('Switch ativado. Uma barreira caiu.');
    }
  }

  restartPhase(delay = 120) {
    if (this.isRespawning || this.isTransitioning || !this.player) {
      return;
    }

    this.isRespawning = true;
    this.tweens.killTweensOf(this.player);
    this.player?.setAlpha(1);
    this.player?.setVelocity(0, 0);
    this.cameras.main.flash(180, 0, 255, 110);

    this.time.delayedCall(delay, () => {
      this.scene.restart();
    });
  }

  handlePlayerDamage(sourceX) {
    if (this.isAutoRunning || this.isTransitioning || this.time.now < this.invulnerableUntil) {
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
      this.restartPhase(150);
    }
  }

  spawnEnemyBullet(x, y, direction, options = {}) {
    const speed = options.speed ?? 360;
    const bullet = new Bullet(this, x, y, direction, {
      owner: 'enemy',
      speed,
      tint: options.tint ?? 0xff7b7b
    });
    this.enemyBullets.add(bullet);
    bullet.body.setAllowGravity(false);
    bullet.setVelocityX(direction === 'left' ? -speed : speed);
    return bullet;
  }
}
