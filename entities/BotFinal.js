export default class BotFinal extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, platformSegments, config = {}) {
    super(scene, x, y, 'bot2_idle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.platformSegments = platformSegments;
    this.currentPlatformIndex = this.getClosestPlatformIndex(x);
    this.direction = 'left';
    this.moveSpeed = config.moveSpeed ?? 88;
    this.maxHealth = config.maxHealth ?? 24;
    this.health = this.maxHealth;
    this.warpChance = config.warpChance ?? 14;
    this.walkMovesBeforeWarp = config.walkMovesBeforeWarp ?? 3;
    this.walkMovesSinceWarp = 0;
    this.forceWarpDelay = config.forceWarpDelay ?? 5000;
    this.shotCooldownMin = config.shotCooldownMin ?? 1150;
    this.shotCooldownMax = config.shotCooldownMax ?? 1900;
    this.enrageThreshold = config.enrageThreshold ?? 0.45;
    this.isEnraged = false;
    this.lastWarpAt = scene.time.now;
    this.destinationX = x;
    this.nextDecisionAt = scene.time.now + 900;
    this.nextShotAt = scene.time.now + Phaser.Math.Between(700, 1400);
    this.isWarping = false;

    this.setCollideWorldBounds(true);
    this.setGravityY(600);
    this.setOrigin(0.5, 1);
    this.setScale(2);
    this.body.setSize(20, 34);

    this.createAnimations(scene);
    this.updateFacing();
    this.play('bot2_walk', true);
  }

  createAnimations(scene) {
    if (!scene.anims.exists('bot2_idle')) {
      scene.anims.create({
        key: 'bot2_idle',
        frames: scene.anims.generateFrameNumbers('bot2_idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!scene.anims.exists('bot2_walk')) {
      scene.anims.create({
        key: 'bot2_walk',
        frames: scene.anims.generateFrameNumbers('bot2_walk', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!scene.anims.exists('bot2_jump')) {
      scene.anims.create({
        key: 'bot2_jump',
        frames: scene.anims.generateFrameNumbers('bot2_jump', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });
    }
  }

  getClosestPlatformIndex(x) {
    let closestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    this.platformSegments.forEach((segment, index) => {
      const distance = Math.abs(segment.centerX - x);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  getPlatform(index = this.currentPlatformIndex) {
    return this.platformSegments[index];
  }

  getRandomXInPlatform(index = this.currentPlatformIndex) {
    const segment = this.getPlatform(index);
    return Phaser.Math.Between(segment.left + 48, segment.right - 48);
  }

  chooseNextAction(now) {
    if (this.isWarping || !this.active) {
      return;
    }

    const effectiveWarpChance = this.isEnraged ? this.warpChance + 18 : this.warpChance;
    const shouldWarp = this.platformSegments.length > 1
      && this.walkMovesSinceWarp >= this.walkMovesBeforeWarp
      && Phaser.Math.Between(1, 100) <= effectiveWarpChance;
    if (shouldWarp) {
      let nextPlatformIndex = this.currentPlatformIndex;
      while (nextPlatformIndex === this.currentPlatformIndex) {
        nextPlatformIndex = Phaser.Math.Between(0, this.platformSegments.length - 1);
      }

      this.startWarp(nextPlatformIndex);
      this.walkMovesSinceWarp = 0;
      this.nextDecisionAt = now + Phaser.Math.Between(1500, 2300);
      return;
    }

    this.destinationX = this.getRandomXInPlatform(this.currentPlatformIndex);
    this.walkMovesSinceWarp += 1;
    this.nextDecisionAt = now + Phaser.Math.Between(1400, 2400);
  }

  startWarp(targetPlatformIndex) {
    if (this.isWarping) {
      return;
    }

    const targetPlatform = this.getPlatform(targetPlatformIndex);
    const targetX = this.getRandomXInPlatform(targetPlatformIndex);
    const targetY = targetPlatform.standY;

    this.isWarping = true;
    this.destinationX = targetX;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.play('bot2_jump', true);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: 140,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.setPosition(targetX, targetY);
        this.currentPlatformIndex = targetPlatformIndex;
        this.lastWarpAt = this.scene.time.now;
        this.body.enable = true;
        this.body.stop();
        this.body.updateFromGameObject();
        this.setAlpha(1);
        this.isWarping = false;
        this.nextShotAt = Math.min(this.nextShotAt, this.scene.time.now + 260);
      }
    });
  }

  update() {
    if (!this.active || !this.body) {
      return;
    }

    const now = this.scene.time.now;
    const platform = this.getPlatform();

    if (this.isWarping) {
      this.setVelocity(0, 0);
      return;
    }

    this.updateEnrage();
    this.tryShoot(now);

    if (now - this.lastWarpAt >= this.forceWarpDelay) {
      let forcedPlatformIndex = this.currentPlatformIndex;
      while (forcedPlatformIndex === this.currentPlatformIndex) {
        forcedPlatformIndex = Phaser.Math.Between(0, this.platformSegments.length - 1);
      }
      this.startWarp(forcedPlatformIndex);
      this.walkMovesSinceWarp = 0;
      this.nextDecisionAt = now + Phaser.Math.Between(1500, 2300);
      return;
    }

    if (now >= this.nextDecisionAt && Math.abs(this.x - this.destinationX) < 16) {
      this.chooseNextAction(now);
    }

    if (this.body.blocked.left || this.x <= platform.left + 18) {
      this.direction = 'right';
      this.destinationX = this.getRandomXInPlatform(this.currentPlatformIndex);
    } else if (this.body.blocked.right || this.x >= platform.right - 18) {
      this.direction = 'left';
      this.destinationX = this.getRandomXInPlatform(this.currentPlatformIndex);
    } else if (this.destinationX !== null) {
      this.direction = this.destinationX < this.x ? 'left' : 'right';
    }

    if (!this.body.blocked.down) {
      this.play('bot2_jump', true);
      return;
    }

    if (Math.abs(this.destinationX - this.x) < 10) {
      this.setVelocityX(0);
      this.play('bot2_idle', true);
      return;
    }

    this.setVelocityX(this.direction === 'left' ? -this.moveSpeed : this.moveSpeed);
    this.updateFacing();
    this.play('bot2_walk', true);
  }

  updateEnrage() {
    if (this.isEnraged || this.health > this.maxHealth * this.enrageThreshold) {
      return;
    }

    this.isEnraged = true;
    this.moveSpeed = Math.round(this.moveSpeed * 1.22);
    this.forceWarpDelay = Math.max(2600, Math.round(this.forceWarpDelay * 0.72));
    this.scene.cameras?.main?.shake(180, 0.004);
  }

  tryShoot(now) {
    if (
      now < this.nextShotAt ||
      !this.scene.player?.body ||
      !this.scene.spawnBossBullet ||
      this.isWarping
    ) {
      return;
    }

    const player = this.scene.player;
    const shotDirection = player.body.center.x < this.body.center.x ? 'left' : 'right';
    const bounds = this.getBounds();
    const bulletX = shotDirection === 'left' ? bounds.left - 18 : bounds.right + 18;
    const burstVelocities = this.isEnraged ? [-120, 0, 120] : [-70, 70];
    const speed = this.isEnraged ? 500 : 430;

    this.direction = shotDirection;
    this.updateFacing();
    this.play('bot2_idle', true);

    burstVelocities.forEach((velocityY, index) => {
      this.scene.time.delayedCall(index * 105, () => {
        if (!this.active || this.isWarping) {
          return;
        }

        this.scene.spawnBossBullet(bulletX, this.y - 58, shotDirection, {
          speed,
          velocityY,
          tint: this.isEnraged ? 0xff2d75 : 0x00ffff
        });
      });
    });

    const cooldownScale = this.isEnraged ? 0.68 : 1;
    this.nextShotAt = now + Math.round(
      Phaser.Math.Between(this.shotCooldownMin, this.shotCooldownMax) * cooldownScale
    );
  }

  updateFacing() {
    if (this.direction === 'left') {
      this.setFlipX(true);
      this.displayOriginX = 42;
      this.body.setOffset(26, 14);
      return;
    }

    this.setFlipX(false);
    this.displayOriginX = 24;
    this.body.setOffset(2, 14);
  }

  takeDamage(amount = 1) {
    if (!this.active) {
      return this.health;
    }

    this.health = Math.max(0, this.health - amount);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.health <= 0) {
      if (this.scene.handleBossDefeated) {
        this.scene.handleBossDefeated(this);
      }
      this.destroy();
    }

    return this.health;
  }
}
