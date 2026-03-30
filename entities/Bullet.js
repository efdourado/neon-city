
export default class Bullet extends Phaser.Physics.Arcade.Sprite 
{
  constructor(scene, x, y, direction) 
  {
    super(scene, x, y, 'nova');

    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.speed = 800;

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
    this.body.setImmovable(true);

    this.createAnimations(scene);
    this.play('bullet_anim');

  }
  
  createAnimations(scene) 
  {
    if(!scene.anims.exists('bullet1')) 
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
    if(this.x < 0 || this.x > 2000) {
      this.destroy();
    }
  }
}
