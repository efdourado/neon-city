
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'nova');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setGravityY(300);
    this.setOrigin(0.5, 1);
    this.body.setSize(20,34);
    this.setScale(2);

    this.createAnimations(scene);

    this.play('idle');
  }

  createAnimations(scene) {
    if(!scene.anims.exists('idle')) {
      scene.anims.create({
        key: 'idle',
        frames: scene.anims.generateFrameNumbers('nova', {start: 0, end: 3}),
        frameRate: 8,
        repeat: -1
      });

      scene.anims.create({
        key: 'run',
        frames: scene.anims.generateFrameNumbers('nova_run', {start: 0, end: 5}),
        frameRate: 12,
        repeat: -1
      });
    }
  }
  update(cursors) {
    if(!cursors) return;

    const center = 24;
    const playerSpeed = 300; 
  
    if(cursors.left.isDown) {
      this.setVelocityX(-playerSpeed);
      this.setFlipX(true);
      this.displayOriginX = center + 18;
      this.body.setOffset(26,14);
      this.direction = "left";
      this.play('run', true);
    } else if (cursors.right.isDown) {
      this.setVelocityX(playerSpeed);
      this.setFlipX(false);
      this.displayOriginX = center;
      this.body.setOffset(2,14);
      this.direction = "right";
      this.play('run', true);
    } else {
      this.setVelocityX(0);
      this.play('idle', true);
      if (this.direction == "left") {
        this.displayOriginX = center + 18;
        this.body.setOffset(26,14);
      } else {
        this.displayOriginX = center;
        this.body.setOffset(2,14);
      }
    }
  }
}
