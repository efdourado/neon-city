import Bullet from './Bullet.js';

export default class Player extends Phaser.Physics.Arcade.Sprite 
{
  constructor(scene, x, y) {
    super(scene, x, y, 'nova');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.direction = "right";

    this.setCollideWorldBounds(true);

    this.setGravityY(600);
    this.setOrigin(0.5, 1);
    this.body.setSize(20,34);
    this.setScale(2);

    this.createAnimations(scene);

    this.play('idle');

    this.spaceBar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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

      scene.anims.create({
        key: 'walk',
        frames: scene.anims.generateFrameNumbers('nova_walk', {start: 0, end: 5}),
        frameRate: 8,
        repeat: -1
      });

      scene.anims.create({
        key: 'jump',
        frames: scene.anims.generateFrameNumbers('jump', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });
    }
  }
  update(cursors) {
    if(!cursors) return;
    
    const center = 24;
    const walkSpeed = 200;
    const runSpeed = 300;
    const jumpForce = -700;

    let currentSpeed = walkSpeed;
    let moveAnim = 'walk';

    if(Phaser.Input.Keyboard.JustDown(this.spaceBar)) 
    {
      let bulletX = this.direction === 'left' ? this.x - 10 : this.x + 10;

      let bullet = new Bullet(this.scene, bulletX, this.y - 35, this.direction);

      this.scene.bullets.add(bullet);

      const speed = this.direction === 'left' ? -1000 : 1000;
      bullet.setVelocityX(speed);

      bullet.body.setAllowGravity(false);
    }

    if (cursors.shift.isDown) {
      currentSpeed = runSpeed;
      moveAnim = 'run';
    }
  
    if(cursors.up.isDown && this.body.blocked.down) {
      this.setVelocityY(jumpForce);
    }

    if(!this.body.blocked.down) {
      this.play('jump', true);
    }

    if(cursors.left.isDown) {
      this.setVelocityX(-currentSpeed);
      this.setFlipX(true);
      this.displayOriginX = center + 18;
      this.body.setOffset(26,14);
      this.direction = "left";

      if (this.body.blocked.down) {
        this.play(moveAnim, true);
      }
    } 
    else if (cursors.right.isDown) {
      this.setVelocityX(currentSpeed);
      this.setFlipX(false);
      this.displayOriginX = center;
      this.body.setOffset(2,14);
      this.direction = "right";

      if (this.body.blocked.down) {
        this.play(moveAnim, true);
      }
    } else {
      this.setVelocityX(0);
      
      if (this.body.blocked.down) {
        this.play('idle', true);
      }

      if (this.direction == "left") {
        this.displayOriginX = center + 18;
        this.body.setOffset(26,14);
        this.setFlipX(true);
      } else {
        this.displayOriginX = center;
        this.body.setOffset(2,14);
        this.setFlipX(false);
      }
    }
  }
}
