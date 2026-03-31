
export default class Bullet extends Phaser.Physics.Arcade.Sprite 
{
  constructor(scene, x, y, direction, options = {}) 
  {
    super(scene, x, y, 'bullet1');

    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.speed = options.speed ?? 800;
    this.maxDistance = options.maxDistance ?? scene.worldWidth;
    this.startX = x;
    this.owner = options.owner ?? 'player';

    if (direction == 'left') 
    {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    }
    else 
    {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    }

    this.body.setAllowGravity(false);
    this.body.setSize(60, 24, true);

    if (options.tint) {
      this.setTint(options.tint);
    }

    this.createAnimations(scene);
    this.play('bullet_anim');

  }
  
  createAnimations(scene) 
  {
    if(!scene.anims.exists('bullet_anim')) 
    {
      scene.anims.create({
        key: 'bullet_anim',
        frames: scene.anims.generateFrameNumbers('bullet1', {start: 0, end: 6}),
        frameRate: 12,
        repeat: -1
      });
    }
  }

  update() 
  {
    if (Math.abs(this.x - this.startX) > this.maxDistance || this.x < -50 || this.x > this.scene.worldWidth + 50) {
      this.destroy();
    }
  }
}
