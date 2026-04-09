import Player from '../entities/Player.js';
import BotFinal from '../entities/BotFinal.js';

export default class FaseFinal extends Phaser.Scene {
  constructor() {
    super({ key: 'FaseFinal' });
  }

  preload() {
    this.load.image('bg_boss_scene', 'assets/bg/bg_boss.png');
    this.load.image('floor_mid', 'assets/tiles/Tiles/Tile (2).png');
    this.load.image('acid', 'assets/tiles/Tiles/Acid (1).png');

    this.load.spritesheet('nova', 'assets/player/Idle1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('nova_run', 'assets/player/Run1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('nova_walk', 'assets/player/Walk1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('jump', 'assets/player/Jump1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('bullet1', 'assets/guns/Bullets/bullet1.png', { frameWidth: 231, frameHeight: 132 });

    this.load.spritesheet('bot2_idle', 'assets/bots/bot2/Idle1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('bot2_walk', 'assets/bots/bot2/Walk1.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('bot2_jump', 'assets/bots/bot2/Jump1.png', { frameWidth: 48, frameHeight: 48 });
  }

  create() {
    this.screenWidth = Number(this.sys.game.config.width);
    this.screenHeight = Number(this.sys.game.config.height);
    this.worldWidth = 1360;
    this.worldHeight = this.screenHeight;
    this.platformY = 540;
    this.platformHeight = 48;
    this.platformStandY = this.platformY - (this.platformHeight / 2);
    this.spawnPoint = { x: 140, y: this.platformStandY };
    this.maxHealth = 3;
    this.health = this.maxHealth;
    this.invulnerableUntil = 0;
    this.isRespawning = false;

    const bg = this.add.image(this.worldWidth / 2, this.screenHeight / 2, 'bg_boss_scene');
    bg.setDisplaySize(this.worldWidth, this.screenHeight);

    this.add.rectangle(this.worldWidth / 2, this.screenHeight / 2, this.worldWidth, this.screenHeight, 0x000000, 0.22);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.bullets = this.physics.add.group();

    this.platformSegments = this.createArena();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y);
    this.player.setDepth(12);

    const bossSpawn = this.platformSegments[1];
    this.boss = new BotFinal(this, bossSpawn.centerX, bossSpawn.standY, this.platformSegments, {
      maxHealth: 10,
      moveSpeed: 96,
      warpChance: 12,
      walkMovesBeforeWarp: 4,
      forceWarpDelay: 5000
    });
    this.boss.setDepth(12);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.boss, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, (bullet) => bullet.destroy());
    this.physics.add.overlap(this.player, this.hazards, () => this.killPlayer());
    this.physics.add.overlap(this.player, this.boss, () => this.handlePlayerDamage(this.boss.x));

    this.createHealthBar();
    this.createBossHud();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  createArena() {
    const margin = 40;
    const gapWidth = 130;
    const platformWidth = 340;
    const acidTop = this.platformY + (this.platformHeight / 2) + 10;
    const acidHeight = this.screenHeight - acidTop;
    const platformCenters = [
      margin + (platformWidth / 2),
      margin + platformWidth + gapWidth + (platformWidth / 2),
      margin + (platformWidth * 2) + (gapWidth * 2) + (platformWidth / 2)
    ];
    const segments = [];

    platformCenters.forEach((x) => {
      const platform = this.add.tileSprite(x, this.platformY, platformWidth, this.platformHeight, 'floor_mid');
      this.physics.add.existing(platform, true);
      platform.body.setSize(platformWidth, this.platformHeight);
      this.platforms.add(platform);

      segments.push({
        left: x - (platformWidth / 2),
        right: x + (platformWidth / 2),
        centerX: x,
        standY: this.platformStandY
      });
    });

    const acid = this.add.tileSprite(this.worldWidth / 2, acidTop + (acidHeight / 2), this.worldWidth, acidHeight, 'acid');
    acid.setTint(0x66ff33);
    acid.setAlpha(0.92);
    acid.setDepth(2);
    this.physics.add.existing(acid, true);
    acid.body.setSize(this.worldWidth, acidHeight);
    this.hazards.add(acid);

    this.add.text(this.screenWidth / 2, this.screenHeight - 34, 'M para voltar ao menu', {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0);

    return segments;
  }

  createHealthBar() {
    this.healthSegments = [];
    this.healthLabel = this.add.text(24, 18, 'HP', {
      fontSize: '20px',
      color: '#ffffff'
    })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(30);

    for (let i = 0; i < this.maxHealth; i++) {
      const segment = this.add.rectangle(70 + (i * 46), 24, 38, 16, 0x39d353)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setStrokeStyle(2, 0xffffff)
        .setDepth(30);

      this.healthSegments.push(segment);
    }

    this.updateHealthBar();
  }

  updateHealthBar() {
    this.healthSegments.forEach((segment, index) => {
      segment.fillColor = index < this.health ? 0x39d353 : 0x3d3d52;
    });
  }

  createBossHud() {
    this.bossBarWidth = 460;
    this.bossName = this.add.text(this.screenWidth / 2, 14, 'GeminiBoss', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(30);

    this.bossBarBg = this.add.rectangle(this.screenWidth / 2, 60, this.bossBarWidth + 8, 28, 0x1a1a24, 0.88)
      .setStrokeStyle(2, 0xffffff, 0.85)
      .setScrollFactor(0)
      .setDepth(29);

    this.bossBarFill = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(30);

    this.updateBossHealthBar();
  }

  updateBossHealthBar() {
    const currentHealth = this.boss?.active ? this.boss.health : 0;
    const maxHealth = this.boss?.maxHealth ?? 1;
    const ratio = Phaser.Math.Clamp(currentHealth / maxHealth, 0, 1);
    const fillColor = ratio > 0.55 ? 0xff5a5a : ratio > 0.25 ? 0xffa63d : 0xe03b3b;
    const fillWidth = this.bossBarWidth * ratio;

    this.bossBarFill.clear();
    if (fillWidth > 0) {
      this.bossBarFill.fillStyle(fillColor, 1);
      this.bossBarFill.fillRoundedRect(
        (this.screenWidth / 2) - (this.bossBarWidth / 2),
        51,
        fillWidth,
        18,
        4
      );
    }

    this.bossName.setAlpha(currentHealth > 0 ? 1 : 0.65);
  }

  handlePlayerDamage(sourceX) {
    if (this.isRespawning || this.time.now < this.invulnerableUntil || !this.player?.body) {
      return;
    }

    this.health -= 1;
    this.invulnerableUntil = this.time.now + 800;
    this.updateHealthBar();

    const knockDirection = this.player.x < sourceX ? -1 : 1;
    this.player.setVelocity(knockDirection * 220, -220);
    this.cameras.main.shake(120, 0.004);
    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      yoyo: true,
      repeat: 5,
      duration: 60,
      onComplete: () => this.player?.setAlpha(1)
    });

    if (this.health <= 0) {
      this.killPlayer();
    }
  }

  killPlayer() {
    if (this.isRespawning || !this.player?.body) {
      return;
    }

    this.isRespawning = true;
    this.health = 0;
    this.updateHealthBar();
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.cameras.main.flash(180, 80, 255, 180);

    this.time.delayedCall(180, () => {
      this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
      this.player.body.stop();
      this.player.body.updateFromGameObject();
      this.player.play('idle', true);
      this.health = this.maxHealth;
      this.invulnerableUntil = this.time.now + 900;
      this.isRespawning = false;
      this.updateHealthBar();
    });
  }

  update() {
    if (this.player && !this.isRespawning) {
      this.player.update(this.cursors);

      if (this.player.y > this.worldHeight + 80) {
        this.killPlayer();
      }
    }

    if (this.boss?.active) {
      this.boss.update();
    } else if (this.boss) {
      this.boss = null;
      this.updateBossHealthBar();
    }

    this.bullets.children.iterate((bullet) => {
      if (bullet?.active) {
        bullet.update();
        this.checkBossBulletHit(bullet);
      }
    });

    if (Phaser.Input.Keyboard.JustDown(this.keyMenu)) {
      this.scene.start('Menu');
    }
  }

  checkBossBulletHit(bullet) {
    if (!bullet?.active || !this.boss?.active || this.boss.isWarping) {
      return;
    }

    const bulletBounds = bullet.getBounds();
    const bossBounds = this.boss.getBounds();

    if (!Phaser.Geom.Intersects.RectangleToRectangle(bulletBounds, bossBounds)) {
      return;
    }

    bullet.disableBody(true, true);
    this.boss.takeDamage(1);
    this.updateBossHealthBar();
  }
}
