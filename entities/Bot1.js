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
    this.leftBound = x - this.patrolRange;
    this.rightBound = x + this.patrolRange;
    this.health = 2;
    this.nextJumpAt = scene.time.now + Phaser.Math.Between(900, 1800);
    this.nextShotAt = scene.time.now + Phaser.Math.Between(1200, 2400);

    this.setCollideWorldBounds(true);
    this.setGravityY(600);
    this.setOrigin(0.5, 1);
    this.setScale(2);
    this.body.setSize(20, 34);

    this.createAnimations(scene);
    this.updateFacing();
    this.play('bot1_walk');
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

    if (this.x <= this.leftBound) {
      this.direction = 'right';
    } else if (this.x >= this.rightBound) {
      this.direction = 'left';
    } else if (this.body.blocked.left) {
      this.direction = 'right';
    } else if (this.body.blocked.right) {
      this.direction = 'left';
    }

    this.setVelocityX(this.direction === 'left' ? -this.moveSpeed : this.moveSpeed);
    this.updateFacing();

    if (!this.body.blocked.down) {
      this.play('bot1_jump', true);
    } else {
      this.play('bot1_walk', true);
      this.tryJump(now);
      this.tryShoot(now);
    }
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
    this.nextShotAt = now + 3000;
  }

  canSeePlayer() {
    const player = this.scene.player;

    if (!player || !player.active || !player.body) {
      return false;
    }

    const deltaX = player.body.center.x - this.body.center.x;
    const deltaY = Math.abs(player.body.center.y - this.body.center.y);
    const isPlayerInFront = this.direction === 'left' ? deltaX < 0 : deltaX > 0;

    if (!isPlayerInFront) {
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

  takeDamage() {
    if (!this.active) {
      return;
    }

    this.health -= 1;

    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      yoyo: true,
      repeat: 1,
      duration: 60,
      onComplete: () => {
        if (this.active) {
          this.setAlpha(1);
        }
      }
    });

    if (this.health <= 0) {
      this.destroy();
    }
  }
}
