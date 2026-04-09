export default class Menu extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  preload() {

    // ------ fundo estático (imagem) --------------------
    this.load.image('menu_bg_new', 'assets/bg/bg-Gem3.png');
  }
    // ---------------------------------------------------

  create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;
    
    // ------ fundo animado (overlay + gradiente) --------
    const bg = this.add.image(width / 2, height / 2, 'menu_bg_new');
    bg.setDisplaySize(width, height);
    
    const darkOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6); // mais ou menos escuro
    darkOverlay.setOrigin(0);
    
    const gradientOverlay = this.add.graphics();
    this.time.addEvent({
      delay: 100, // delay
      callback: () => {
        gradientOverlay.clear();
        const intensity = 0.1 + Math.sin(Date.now() * 0.002) * 0.03; // brilho inicial - velocidade de efeito - efeito

        gradientOverlay.fillGradientStyle(0x00ffff, 0xff00ff, 0x00ffff, 0xff00ff, 1, 1, 1, 1);
        gradientOverlay.fillRect(0, 0, width, height);
        gradientOverlay.setAlpha(intensity);
      },
      loop: true
    });
    // ---------------------------------------------------
    
    // ------ linhas do fundo (quadriculado) -------------
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffff, 0.1); // espessura - cor (ciano) - transparência
    for (let i = 0; i < width; i += 100) { // qtd. (espaçamento)
      grid.moveTo(i, 0);
      grid.lineTo(i, height);
      grid.moveTo(0, i);
      grid.lineTo(width, i);
    }
    grid.strokePath();
    
    const scanlines = this.add.graphics(); // linhas horizontais
    scanlines.lineStyle(2, 0x00ffff, 0.1);
    for (let i = 0; i < height; i += 8) {
      scanlines.moveTo(0, i);
      scanlines.lineTo(width, i);
    }
    scanlines.strokePath();
    // ---------------------------------------------------
    

    // ------ partículas ---------------------------------
    const particleTexture = this.add.graphics(); // criando um pontinho branco redondo para uso posterior
    particleTexture.fillStyle(0xffffff, 1);
    particleTexture.fillCircle(4, 4, 4);
    particleTexture.generateTexture('particle', 8, 8);
    particleTexture.destroy();
    
    const emitter = this.add.particles(0, 0, 'particle', { // uso posterior
      x: { min: 0, max: width },
      y: height + 20,
      speedY: { min: -80, max: -30 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 3000,
      frequency: 200,
      tint: [0x00ffff, 0xff00ff, 0xffffff],
      blendMode: 'ADD'
    });
    // ---------------------------------------------------

    
    // ------ título principal ---------------------------
    const titleStyle = {
      fontFamily: '"Orbitron", "Impact", monospace',
      fontSize: '98px',
      align: 'center',
      fontStyle: '700'
    };
    
    const titleGlitch1 = this.add.text(width / 2, height / 2 - 150, 'NEON CITY', { // sombra1. rosa
      ...titleStyle,
      color: '#ff00ff',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0.7);
    const titleGlitch2 = this.add.text(width / 2, height / 2 - 150, 'NEON CITY', { // sombra2. ciano
      ...titleStyle,
      color: '#00ffff',
      stroke: '#00ffff',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0.7);
    
    const titleMain = this.add.text(width / 2, height / 2 - 150, 'NEON CITY', {
      ...titleStyle,
      color: '#ffffff',
      fontSize: '96px',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 4, offsetY: 4, color: '#00ffff', blur: 8, fill: true }
    }).setOrigin(0.5);
    
    let glitchCounter = 0;
    this.time.addEvent({
      delay: 80,
      callback: () => {
        glitchCounter++;
        if (Math.random() > 0.7) { // random
            if (glitchCounter % 10 === 0) { // frequência da sombra1
              titleGlitch1.setVisible(true);
              titleGlitch1.setX(width / 2 + (Math.random() * 6 - 3));
              titleGlitch1.setY(height / 2 - 150 + (Math.random() * 4 - 2));
              titleGlitch2.setVisible(false);
            } else if (glitchCounter % 10 === 1) { // frequência da sombra2
              titleGlitch2.setVisible(true);
              titleGlitch2.setX(width / 2 + (Math.random() * 6 - 3));
              titleGlitch2.setY(height / 2 - 150 + (Math.random() * 4 - 2));
              titleGlitch1.setVisible(false);
            } else {
              titleGlitch1.setVisible(false);
              titleGlitch2.setVisible(false);
      } } },
      loop: true
    });
    
    this.tweens.add({
      targets: titleMain,
      alpha: 0.95,
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    // ---------------------------------------------------
    
    // ------ menu ---------------------------------------
    const menuOptions = [ {
      text: 'Iniciar', key: 'start', yOffset: 80, shortcut: ' Enter '
      }, {
      text: 'Instruções', key: 'instructions', yOffset: 150, shortcut: ' I '
    } ];

    let selectedIndex = 0;
    const menuItems = [];
    
    menuOptions.forEach((option, index) => { // criar opções
      const yPos = height / 2 + option.yOffset;
      const itemText = this.add.text(width / 2, yPos, option.text, { // texto
        fontFamily: '"Orbitron", monospace',
        fontSize: '46px',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center'
      }).setOrigin(0.5);
      
      const indicator = this.add.text(width / 2 - 180, yPos, '|', { // indicator, é possível colocar o que quiser e ajustar a fontSize por ex.
        fontFamily: '"Orbitron", monospace',
        fontSize: '24px',
        color: '#00ffff',
        stroke: '#ff00ff',
        strokeThickness: 1
      }).setOrigin(0.4).setAlpha(0);
      
      const shortcutText = this.add.text(width / 2 + 180, yPos, `[${option.shortcut}]`, { // shortcut
        fontFamily: '"Orbitron", monospace',
        fontSize: '24px',
        color: '#666666',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.4);
      
      const glow = this.add.ellipse(width / 2, yPos, 300, 50, 0x00ffff, 0.1); // elipse quase invisível atrás do texto
      glow.setOrigin(0.6);
      
      menuItems.push({ // referências guardadas
        text: itemText,
        indicator: indicator,
        glow: glow,
        shortcut: shortcutText,
        yPos: yPos,
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
    
    // ------ seleção ---------------------------------------
    this.selectMenuItem = (index) => {
      menuItems.forEach((item, i) => {
        item.text.setColor('#aaaaaa');
        item.indicator.setAlpha(0);
        item.glow.setAlpha(0);
        item.text.setScale(1);
      });
      
      selectedIndex = index; // item selecionado
      menuItems[selectedIndex].text.setColor('#ffffff');
      menuItems[selectedIndex].indicator.setAlpha(1);
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
    
    this.activateOption = (key) => { // clique e redirecionamento
      const flash = this.add.rectangle(0, 0, width, height, 0xffffff).setAlpha(0);
      flash.setOrigin(0);
      flash.setDepth(9999);
      this.tweens.add({
        targets: flash,
        alpha: 0.1,
        duration: 100, // aumente e veja melhor a animação do flash de redirecionamento
        yoyo: true,
        onComplete: () => {
          flash.destroy();
          if (key === 'start') {
            this.scene.start('Fase1');
          } else if (key === 'instructions') {
            this.scene.start('Instructions');
    } } }); };
    
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
    this.handleInstructionsKey = () => {
      this.activateOption('instructions');
    };
    this.input.keyboard.on('keydown-UP', this.handleUpKey);
    this.input.keyboard.on('keydown-DOWN', this.handleDownKey);
    this.input.keyboard.on('keydown-ENTER', this.handleEnterKey);
    this.input.keyboard.on('keydown-I', this.handleInstructionsKey);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-UP', this.handleUpKey);
      this.input.keyboard.off('keydown-DOWN', this.handleDownKey);
      this.input.keyboard.off('keydown-ENTER', this.handleEnterKey);
      this.input.keyboard.off('keydown-I', this.handleInstructionsKey);
    });
    // ---------------------------------------------------

    // ------ outros -------------------------------------
    const border = this.add.graphics(); // bordas (moldura)
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
    
    const sidetext = this.add.text(width / 2, height - 60, '11 : 11', { // texto extra que pisca (centro inferior)
      fontFamily: '"Orbitron", monospace',
      fontSize: '23px',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: sidetext,
      alpha: 0.4, // opacidade
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    this.tweens.add({ // zoom in and out no fundo
      targets: bg,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 20000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    // ---------------------------------------------------
}); } }

// ---------------------------------------------------
