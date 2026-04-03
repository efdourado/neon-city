export default class Saw extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'saw');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.axis = config.axis ?? 'horizontal';
    this.speed = config.speed ?? 120;
    this.direction = config.direction ?? 1;
    this.rotationSpeed = config.rotationSpeed ?? 260;
    this.scaleValue = config.scale ?? 0.16;
    this.anchorX = x;
    this.anchorY = y;
    this.travelDurationOverride = config.travelDuration;

    this.setOrigin(0.5, 0.5);
    this.setScale(this.scaleValue);
    this.setDepth(config.depth ?? 8);

    this.body.setAllowGravity(false);
    this.setImmovable(true);
    this.body.moves = false;
    this.syncDamageHitbox();

    this.minX = config.minX ?? x;
    this.maxX = config.maxX ?? x;
    this.minY = config.minY ?? y;
    this.maxY = config.maxY ?? y;

    this.createMovementTween();
  }

  createMovementTween() {
    const isVertical = this.axis === 'vertical';
    const start = isVertical ? this.minY : this.minX;
    const end = isVertical ? this.maxY : this.maxX;
    const distance = Math.abs(end - start);
    const duration = this.travelDurationOverride ?? Math.max(250, (distance / Math.max(1, this.speed)) * 1000);

    if (start === end) {
      return;
    }

    const from = this.direction >= 0 ? start : end;
    const to = this.direction >= 0 ? end : start;

    if (isVertical) {
      this.y = from;
      this.anchorY = from;
    } else {
      this.x = from;
      this.anchorX = from;
    }

    this.moveTween = this.scene.tweens.add({
      targets: this,
      [isVertical ? 'y' : 'x']: to,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Linear'
    });
  }

  syncDamageHitbox() {
    const hitboxWidth = Math.round(this.displayWidth * 5);
    const hitboxHeight = Math.round(this.displayHeight * 5);

    this.body.setSize(hitboxWidth, hitboxHeight, true);
  }

  update(_, delta) {
    if (!this.active || !this.body) {
      return;
    }

    if (this.axis === 'vertical') {
      this.x = this.anchorX;
    } else {
      this.y = this.anchorY;
    }

    this.syncDamageHitbox();
    this.body.updateFromGameObject();
    this.angle += this.rotationSpeed * (delta / 1000);
  }

  destroy(fromScene) {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }

    return super.destroy(fromScene);
  }
}
