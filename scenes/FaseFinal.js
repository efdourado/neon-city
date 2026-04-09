export default class FaseFinal extends Phaser.Scene {
  constructor() {
    super({ key: 'FaseFinal' });
  }

  preload() {
    this.load.image('bg_boss_scene', 'assets/bg/bg_boss.png');
  }

  create() {
    const width = Number(this.sys.game.config.width);
    const height = Number(this.sys.game.config.height);

    const bg = this.add.image(width / 2, height / 2, 'bg_boss_scene');
    bg.setDisplaySize(width, height);

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35);

    this.add.text(width / 2, height / 2 - 40, 'FASE FINAL', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '54px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 32, 'Area do chefe preparada para a proxima etapa', {
      fontFamily: '"Courier New", monospace',
      fontSize: '24px',
      color: '#d9faff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 48, 'M para voltar ao menu', {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.keyMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyMenu)) {
      this.scene.start('Menu');
    }
  }
}
