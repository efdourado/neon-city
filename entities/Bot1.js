export default class Bot1 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'bot1_idle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.direction = config.direction ?? 'left';
    this.moveSpeed = config.moveSpeed ?? 90;
    this.jumpForce = config.jumpForce ?? -380;
    this.jumpChance = config.jumpChance ?? 35;
    this.patrolRange = config.patrolRange ?? 120;
    this.visionRange = config.visionRange ?? 420;
    this.visionHeight = config.visionHeight ?? 120;
    this.shotCooldownMin = config.shotCooldownMin ?? 1700;
    this.shotCooldownMax = config.shotCooldownMax ?? 2600;
    this.leftBound = x - this.patrolRange;
    this.rightBound = x + this.patrolRange;
    this.maxHealth = config.maxHealth ?? 2;
    this.health = this.maxHealth;
    this.baseTint = config.tint ?? null;
    this.nextJumpAt = scene.time.now + Phaser.Math.Between(900, 1800);
    this.nextShotAt = scene.time.now + Phaser.Math.Between(this.shotCooldownMin, this.shotCooldownMax);

    this.setCollideWorldBounds(true);
    this.setGravityY(600);
    this.setOrigin(0.5, 1);
    this.setScale(2);
    this.body.setSize(20, 34);
    if (this.baseTint) {
      this.setTint(this.baseTint);
    }

    this.createAnimations(scene);
    this.healthBar = scene.add.graphics().setDepth(28);
    this.updateFacing();
    this.play('bot1_walk');
    this.updateHealthBar();
  }

  createAnimations(scene) {
    if (!scene.anims.exists('bot1_idle')) {
      scene.anims.create({
        key: 'bot1_idle',
        frames: scene.anims.generateFrameNumbers('bot1_idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!scene.anims.exists('bot1_walk')) {
      scene.anims.create({
        key: 'bot1_walk',
        frames: scene.anims.generateFrameNumbers('bot1_walk', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!scene.anims.exists('bot1_jump')) {
      scene.anims.create({
        key: 'bot1_jump',
        frames: scene.anims.generateFrameNumbers('bot1_jump', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });
    }
  }

  update() {
    if (!this.active || !this.body) {
      return;
    }

    const now = this.scene.time.now;
    const playerInRange = this.canSeePlayer({ requireFacing: false });

    if (this.x <= this.leftBound) {
      this.direction = 'right';
    } else if (this.x >= this.rightBound) {
      this.direction = 'left';
    } else if (this.body.blocked.left) {
      this.direction = 'right';
    } else if (this.body.blocked.right) {
      this.direction = 'left';
    }

    if (playerInRange) {
      this.direction = this.scene.player.body.center.x < this.body.center.x ? 'left' : 'right';
    }

    const speedMultiplier = playerInRange ? 0.35 : 1;
    this.setVelocityX(this.direction === 'left'
      ? -this.moveSpeed * speedMultiplier
      : this.moveSpeed * speedMultiplier
    );
    this.updateFacing();

    if (!this.body.blocked.down) {
      this.play('bot1_jump', true);
    } else {
      this.play('bot1_walk', true);
      if (!playerInRange) {
        this.tryJump(now);
      }
      this.tryShoot(now);
    }

    this.updateHealthBar();
  }

  tryJump(now) {
    if (now < this.nextJumpAt) {
      return;
    }

    if (Phaser.Math.Between(1, 100) <= this.jumpChance) {
      this.setVelocityY(this.jumpForce);
    }

    this.nextJumpAt = now + Phaser.Math.Between(1200, 2400);
  }

  tryShoot(now) {
    if (now < this.nextShotAt) {
      return;
    }

    if (!this.canSeePlayer()) {
      return;
    }

    const shotDirection = this.scene.player.body.center.x < this.body.center.x ? 'left' : 'right';
    const bounds = this.getBounds();
    const bulletX = shotDirection === 'left' ? bounds.left - 14 : bounds.right + 14;
    this.scene.spawnEnemyBullet(bulletX, this.y - 52, shotDirection);
    this.nextShotAt = now + Phaser.Math.Between(this.shotCooldownMin, this.shotCooldownMax);

    const flash = this.scene.add.circle(bulletX, this.y - 52, 7, 0xff7b7b, 0.85)
      .setDepth(24)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => flash.destroy()
    });
  }

  canSeePlayer(options = {}) {
    const player = this.scene.player;
    const requireFacing = options.requireFacing ?? true;

    if (!player || !player.active || !player.body) {
      return false;
    }

    const deltaX = player.body.center.x - this.body.center.x;
    const deltaY = Math.abs(player.body.center.y - this.body.center.y);
    const isPlayerInFront = this.direction === 'left' ? deltaX < 0 : deltaX > 0;

    if (requireFacing && !isPlayerInFront) {
      return false;
    }

    if (Math.abs(deltaX) > this.visionRange) {
      return false;
    }

    if (deltaY > this.visionHeight) {
      return false;
    }

    return true;
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

  updateHealthBar() {
    if (!this.healthBar) {
      return;
    }

    this.healthBar.clear();
    if (!this.active || this.health <= 0) {
      return;
    }

    const width = 44;
    const height = 6;
    const x = this.x - (width / 2);
    const y = this.y - 92;
    const ratio = Phaser.Math.Clamp(this.health / this.maxHealth, 0, 1);

    this.healthBar.fillStyle(0x12121a, 0.82);
    this.healthBar.fillRoundedRect(x, y, width, height, 2);
    this.healthBar.fillStyle(ratio > 0.5 ? 0xffd166 : 0xff4d6d, 1);
    this.healthBar.fillRoundedRect(x + 1, y + 1, (width - 2) * ratio, height - 2, 2);
  }

  takeDamage(amount = 1) {
    if (!this.active) {
      return;
    }

    this.health -= amount;
    this.updateHealthBar();

    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      yoyo: true,
      repeat: 1,
      duration: 60,
      onComplete: () => {
        if (this.active) {
          this.setAlpha(1);
          if (this.baseTint) {
            this.setTint(this.baseTint);
          } else {
            this.clearTint();
          }
        }
      }
    });

    if (this.health <= 0) {
      this.destroy();
    }
  }

  destroy(fromScene) {
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }

    return super.destroy(fromScene);
  }
}
