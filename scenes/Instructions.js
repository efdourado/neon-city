export default class Instructions extends Phaser.Scene {
  constructor() {
    super({ key: 'Instructions' });
  }

  preload() {
    // ------ fundo estático (imagem) --------------------
    this.load.image('bg_dark', 'assets/bg/bg-Gem3.png');
  }
  // ---------------------------------------------------

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    // ------ fundo animado (overlay + gradiente) --------
    const bg = this.add.image(width / 2, height / 2, 'bg_dark');
    bg.setDisplaySize(width, height);
    
    const darkOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
    
    const gradientOverlay = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        gradientOverlay.clear();
        const intensity = 0.08 + Math.sin(Date.now() * 0.002) * 0.02;
        gradientOverlay.fillGradientStyle(0x00ffff, 0xff00ff, 0x00ffff, 0xff00ff, 1, 1, 1, 1);
        gradientOverlay.fillRect(0, 0, width, height);
        gradientOverlay.setAlpha(intensity);
      },
      loop: true
    });
    // ---------------------------------------------------

    // ------ linhas do fundo (quadriculado) -------------
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffff, 0.08);
    for (let i = 0; i < width; i += 100) {
      grid.moveTo(i, 0);
      grid.lineTo(i, height);
      grid.moveTo(0, i);
      grid.lineTo(width, i);
    }
    grid.strokePath();
    // ---------------------------------------------------

    // ------ partículas ---------------------------------
    const particleTexture = this.add.graphics();
    particleTexture.fillStyle(0xffffff, 1);
    particleTexture.fillCircle(4, 4, 4);
    particleTexture.generateTexture('particle', 8, 8);
    particleTexture.destroy();

    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: width },
      y: height + 20,
      speedY: { min: -60, max: -20 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 3000,
      frequency: 250,
      tint: [0x00ffff, 0xff00ff],
      blendMode: 'ADD'
    });
    // ---------------------------------------------------

    // ------ título principal ---------------------------
    const titleStyle = {
      fontFamily: '"Orbitron", monospace',
      fontSize: '52px',
      align: 'center',
      fontStyle: '700'
    };

    const titleGlitch1 = this.add.text(width / 2, 80, 'Instruções', {
      ...titleStyle,
      color: '#ff00ff'
    }).setOrigin(0.5).setAlpha(0.7);

    const titleGlitch2 = this.add.text(width / 2, 80, 'Instruções', {
      ...titleStyle,
      color: '#00ffff'
    }).setOrigin(0.5).setAlpha(0.7);

    const titleMain = this.add.text(width / 2, 80, 'Instruções', {
      ...titleStyle,
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 90,
      callback: () => {
        const rand = Math.random();
        if (rand > 0.75) {
          titleGlitch1.setVisible(true);
          titleGlitch1.setX(width / 2 + Phaser.Math.Between(-3, 3));
          titleGlitch2.setVisible(false);
        } else if (rand > 0.6) {
          titleGlitch2.setVisible(true);
          titleGlitch2.setX(width / 2 + Phaser.Math.Between(-3, 3));
          titleGlitch1.setVisible(false);
        } else {
          titleGlitch1.setVisible(false);
          titleGlitch2.setVisible(false);
        }
      },
      loop: true
    });
    // ---------------------------------------------------

    // ------ container do texto (terminal) --------------
    const boxWidth = 900;
    const boxHeight = 500;
    const boxY = height / 2 - 20;

    this.add.rectangle(width / 2, boxY, boxWidth, boxHeight, 0x000000, 0.6)
      .setStrokeStyle(2, 0xaaaaaa, 0.3);

    const infoText = [
      '| Missão: Recuperar o Data-Core roubado e seus segredos',
      '',
      '| Fases:',
      '  [01] Telhados de Neon (Buscar Cartões de Acesso)',
      '  [02] Laboratório Subterrâneo (Ativar Switches)',
      '  [03] Boss Final (Derrotar GeminiBoss e claimar o Data-Core)',
      '',
      '| Controles Importantes:',
      '  SHIFT     Corrida',
      '  ESPAÇO    Disparo',
      '  M         Menu',
      '  D         Status dev da fase',
      '  L         Pular para o corredor final da Fase 2',
      '',
      '| Dev: adicione ?debug=1 na URL para ver hitboxes da física.',
      '',
      '| Créditos: Eduardo Dourado, Henrico Costa e Cássio Rodrigues',
    ];

    const paddingX = 40;
    const paddingY = 40;

    const terminalText = this.add.text(width / 2 - (boxWidth / 2) + paddingX, boxY - (boxHeight / 2) + paddingY, infoText, {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#ffffff',
      lineSpacing: 8
    }).setOrigin(0, 0); 

    this.tweens.add({
      targets: terminalText,
      alpha: 0.75,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    // ---------------------------------------------------

    // ------ menu ---------------------------------------
    const menuOptions = [ 
      { text: 'Iniciar', key: 'start', yPos: height - 90, shortcut: ' Enter ' }, 
    ];

    let selectedIndex = 0;
    const menuItems = [];

    menuOptions.forEach((option, index) => {
      const itemText = this.add.text(width / 2, option.yPos, option.text, {
        fontFamily: '"Orbitron", monospace',
        fontSize: '46px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center'
      }).setOrigin(0.5);
      
      const shortcutText = this.add.text(width / 2 + 180, option.yPos, `[${option.shortcut}]`, {
        fontFamily: '"Orbitron", monospace',
        fontSize: '24px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.4);
      
      const glow = this.add.ellipse(width / 2, option.yPos, 300, 50, 0x00ffff, 0.1);
      glow.setOrigin(0.6);
      
      menuItems.push({
        text: itemText,
        glow: glow,
        shortcut: shortcutText,
        yPos: option.yPos,
        key: option.key
      });      
      
      // interações (mouse)
      itemText.setInteractive({ useHandCursor: true });
      itemText.on('pointerover', () => this.selectMenuItem(index));
      itemText.on('pointerout', () => this.selectMenuItem(selectedIndex)); 
      itemText.on('pointerdown', () => this.activateOption(option.key));
      
      shortcutText.setInteractive({ useHandCursor: true });
      shortcutText.on('pointerover', () => this.selectMenuItem(index));
      shortcutText.on('pointerdown', () => this.activateOption(option.key));
    });
    // ---------------------------------------------------

    // ------ seleção ------------------------------------
    this.selectMenuItem = (index) => {
      menuItems.forEach((item) => {
        item.text.setColor('#aaaaaa');
        item.glow.setAlpha(0);
        item.text.setScale(1);
      });
      
      selectedIndex = index;
      menuItems[selectedIndex].text.setColor('#ffffff');
      menuItems[selectedIndex].glow.setAlpha(0.3);
      
      this.tweens.add({
        targets: menuItems[selectedIndex].glow,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      
      this.tweens.add({
        targets: menuItems[selectedIndex].text,
        scale: 1.05,
        duration: 200,
        yoyo: true,
        repeat: 0
    }); };

    this.activateOption = (key) => {
      this.cameras.main.flash(150, 255, 255, 255);
      this.time.delayedCall(150, () => {
        if (key === 'start') {
          this.scene.start('Fase1');
        } else if (key === 'back') {
          this.scene.start('Menu');
    } }); };

    this.selectMenuItem(0);
    // ---------------------------------------------------

    // ------ teclado ------------------------------------
    this.handleUpKey = () => {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : menuItems.length - 1;
      this.selectMenuItem(newIndex);
    };
    this.handleDownKey = () => {
      const newIndex = selectedIndex < menuItems.length - 1 ? selectedIndex + 1 : 0;
      this.selectMenuItem(newIndex);
    };
    this.handleEnterKey = () => {
      this.activateOption(menuItems[selectedIndex].key);
    };
    this.handleEscKey = () => {
      this.activateOption('back');
    };
    this.input.keyboard.on('keydown-UP', this.handleUpKey);
    this.input.keyboard.on('keydown-DOWN', this.handleDownKey);
    this.input.keyboard.on('keydown-ENTER', this.handleEnterKey);
    this.input.keyboard.on('keydown-ESC', this.handleEscKey);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-UP', this.handleUpKey);
      this.input.keyboard.off('keydown-DOWN', this.handleDownKey);
      this.input.keyboard.off('keydown-ENTER', this.handleEnterKey);
      this.input.keyboard.off('keydown-ESC', this.handleEscKey);
    });
    // ---------------------------------------------------

    // ------ outros -------------------------------------
    const border = this.add.graphics();
    this.time.addEvent({
      delay: 100,
      callback: () => {
        border.clear();
        const hue = (Date.now() * 0.005) % 360;
        const color1 = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
        const color2 = Phaser.Display.Color.HSLToColor((hue + 180) / 360, 1, 0.5);
        
        border.lineStyle(3, color1.color, 0.8);
        border.strokeRect(10, 10, width - 20, height - 20);
        border.lineStyle(1, color2.color, 0.5);
        border.strokeRect(15, 15, width - 30, height - 30);
      },
      loop: true
    });
    
    this.tweens.add({
      targets: bg,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 20000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    // ---------------------------------------------------
} }
// ---------------------------------------------------
