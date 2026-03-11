// Arquivo: Fase1.js
class Fase1 extends Phaser.Scene {
  constructor() {
    super({ key: "Fase1" });
  }

  init(data) {
    this.startMaxHealth = typeof data?.maxHealth === "number" ? data.maxHealth : null;
    this.startHealth = typeof data?.health === "number" ? data.health : null;
  }

  preload() {
    this.load.image("fundo-cidade", "assets/bg/Bacground.png");
    this.load.image("chao-metal", "assets/tiles/Tiles/Tile (2).png");
    this.load.image("chao-metal-alt", "assets/tiles/Tiles/Tile (10).png");
    this.load.image("spike", "assets/tiles/Tiles/Spike.png");
    this.load.image("fence", "assets/tiles/Tiles/Fence (1).png");

    // Player (Nova)
    this.load.spritesheet("nova-idle", "assets/player/Idle1.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("nova-run", "assets/player/Run1.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("nova-jump", "assets/player/Jump1.png", { frameWidth: 48, frameHeight: 48 });

    // Bots
    this.load.spritesheet("bot1-idle", "assets/bots/bot1/Idle1.png", { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet("bot1-run", "assets/bots/bot1/Run1.png", { frameWidth: 48, frameHeight: 48 });

    // Armas / projéteis
    this.load.image("gun-player-idle", "assets/guns/10_1.png");
    this.load.image("gun-player-fire", "assets/guns/10_2.png");
    this.load.image("gun-enemy-idle", "assets/guns/9_1.png");
    this.load.image("gun-enemy-fire", "assets/guns/9_2.png");

    this.load.image("bullet-player", "assets/guns/2_1.png");
    this.load.image("bullet-player-2", "assets/guns/2_2.png");
    this.load.image("bullet-enemy", "assets/guns/3_1.png");
    this.load.image("bullet-enemy-2", "assets/guns/3_2.png");
  }

  create() {
    this.add.image(400, 300, "fundo-cidade").setScale(2);

    // Texturas simples para tiros (evita depender de PNG novo)
    this.ensureBulletTexture("bullet-player", 0x00ffff);
    this.ensureBulletTexture("bullet-enemy", 0xff3355);
    this.ensureBulletAnim("bullet-player-anim", ["bullet-player", "bullet-player-2"], 14);
    this.ensureBulletAnim("bullet-enemy-anim", ["bullet-enemy", "bullet-enemy-2"], 14);

    // Plataformas
    this.platforms = this.physics.add.staticGroup();
    for (let i = 0; i < 800; i += 128) {
      this.platforms.create(i + 64, 568, "chao-metal").setScale(1).refreshBody();
    }
    this.platforms.create(600, 400, "chao-metal-alt");
    this.platforms.create(50, 250, "chao-metal-alt");
    this.platforms.create(750, 220, "chao-metal");

    // DecoraÃ§Ã£o simples do mapa
    this.add.image(600, 368, "fence").setAlpha(0.9);
    this.add.image(50, 218, "fence").setAlpha(0.9);
    this.add.image(750, 188, "fence").setAlpha(0.9);

    // Grupos
    this.playerBullets = this.physics.add.group({ defaultKey: "bullet-player", maxSize: 40, classType: Phaser.Physics.Arcade.Sprite });
    this.enemyBullets = this.physics.add.group({ defaultKey: "bullet-enemy", maxSize: 60, classType: Phaser.Physics.Arcade.Sprite });
    this.enemies = this.physics.add.group();

    // Jogador
    this.player = this.physics.add.sprite(100, 300, "nova-idle").setScale(2);
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);

    // Arma (visual)
    this.playerGunIdleKey = "gun-player-idle";
    this.playerGunFireKey = "gun-player-fire";
    this.playerGun = this.add.sprite(this.player.x, this.player.y, this.playerGunIdleKey).setScale(1.4);
    this.playerGun.setDepth(10);

    // Animações (evita recriar ao reiniciar a cena)
    if (!this.anims.exists("parada")) {
      this.anims.create({
        key: "parada",
        frames: this.anims.generateFrameNumbers("nova-idle", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("correndo")) {
      this.anims.create({
        key: "correndo",
        frames: this.anims.generateFrameNumbers("nova-run", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists("pulando")) {
      this.anims.create({
        key: "pulando",
        frames: this.anims.generateFrameNumbers("nova-jump", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: 0,
      });
    }
    if (!this.anims.exists("bot1-parado")) {
      this.anims.create({
        key: "bot1-parado",
        frames: this.anims.generateFrameNumbers("bot1-idle", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("bot1-correndo")) {
      this.anims.create({
        key: "bot1-correndo",
        frames: this.anims.generateFrameNumbers("bot1-run", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Colisões
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.playerBullets, this.platforms, (bullet) => this.disableBullet(bullet));
    this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => this.disableBullet(bullet));

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyShoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyNext = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Status do jogador
    this.playerMaxHealth = this.startMaxHealth ?? 5;
    this.playerHealth = Phaser.Math.Clamp(this.startHealth ?? this.playerMaxHealth, 0, this.playerMaxHealth);
    this.playerInvulnerableUntil = 0;
    this.playerNextShotTime = 0;

    // UI
    this.add.text(20, 20, "Fase 1: Telhados de Neon", { fontSize: "24px", fill: "#fff" });
    this.hpText = this.add.text(20, 52, `HP: ${this.playerHealth}/${this.playerMaxHealth}`, { fontSize: "18px", fill: "#00ffff" });
    this.helpText = this.add.text(20, 80, "Setas: mover/pular | ESPAÇO: atirar | ENTER: ir para Fase 2", {
      fontSize: "14px",
      fill: "#fff",
    });

    // Inimigos (placeholder)
    this.spawnEnemy(600, 300);
    this.spawnEnemy(420, 100);
    this.spawnEnemy(740, 120);

    // Hazards (espinhos)
    this.hazards = this.physics.add.staticGroup();
    this.hazards.create(360, 552, "spike");
    this.hazards.create(600, 384, "spike");
    this.hazards.create(750, 204, "spike");
    this.physics.add.overlap(this.player, this.hazards, () => this.onPlayerHitHazard());

    // Dano
    this.physics.add.overlap(this.playerBullets, this.enemies, (bullet, enemy) => this.onBulletHitEnemy(bullet, enemy));
    this.physics.add.overlap(this.enemyBullets, this.player, (bullet, player) => this.onBulletHitPlayer(bullet, player));

    // Troca de fase (libera o ESPAÇO para atirar)
    this.keyNext.on("down", () =>
      this.scene.start("Fase2", { health: this.playerHealth, maxHealth: this.playerMaxHealth })
    );
  }

  update() {
    const now = this.time.now;

    // Movimento do player
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.setFlipX(true);
      if (this.player.body.touching.down) this.player.anims.play("correndo", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.setFlipX(false);
      if (this.player.body.touching.down) this.player.anims.play("correndo", true);
    } else {
      this.player.setVelocityX(0);
      if (this.player.body.touching.down) this.player.anims.play("parada", true);
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    if (!this.player.body.touching.down) {
      this.player.anims.play("pulando", true);
    }

    // Atualiza arma (visual)
    if (this.playerGun) {
      const dir = this.player.flipX ? -1 : 1;
      this.playerGun.setPosition(this.player.x + dir * 14, this.player.y - 6);
      this.playerGun.setFlipX(this.player.flipX);
      this.updateGunSprite(this.playerGun, now);
    }

    // Tiro do jogador
    if (this.keyShoot.isDown && now >= this.playerNextShotTime && this.playerHealth > 0) {
      const dir = this.player.flipX ? -1 : 1;
      this.fireBullet(this.playerBullets, "bullet-player", this.player.x + dir * 18, this.player.y - 10, dir * 420, 0, 800, "bullet-player-anim");
      this.triggerGunFire(this.playerGun, this.playerGunIdleKey, this.playerGunFireKey, now);
      this.playerNextShotTime = now + 200;
    }

    // IA dos inimigos
    this.enemies.children.each((enemy) => {
      if (!enemy || !enemy.active) return;

      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const dirToPlayer = this.player.x < enemy.x ? -1 : 1;

      // Patrulha / perseguição curta
      if (distance < 260) {
        enemy.setVelocityX(dirToPlayer * 90);
      } else {
        enemy.setVelocityX(enemy.patrolDir * enemy.patrolSpeed);
      }

      if (enemy.body.blocked.left) enemy.patrolDir = 1;
      if (enemy.body.blocked.right) enemy.patrolDir = -1;

      enemy.setFlipX(enemy.body.velocity.x < 0);
      if (enemy.body.touching.down) {
        if (Math.abs(enemy.body.velocity.x) > 10) enemy.anims.play(enemy.animRunKey, true);
        else enemy.anims.play(enemy.animIdleKey, true);
      }

      // Atira quando o player estiver por perto
      if (distance < 380 && now >= enemy.nextShotTime && this.playerHealth > 0) {
        const fromX = enemy.x + dirToPlayer * 18;
        const fromY = enemy.y - 10;
        const aim = new Phaser.Math.Vector2(this.player.x - fromX, this.player.y - 10 - fromY).normalize();
        this.fireBullet(this.enemyBullets, "bullet-enemy", fromX, fromY, aim.x * 240, aim.y * 240, 1400, "bullet-enemy-anim");
        if (enemy.gunSprite) this.triggerGunFire(enemy.gunSprite, enemy.gunIdleKey, enemy.gunFireKey, now);
        enemy.nextShotTime = now + Phaser.Math.Between(900, 1400);
      }

      if (enemy.gunSprite) {
        this.positionAttachedGun(enemy.gunSprite, enemy, enemy.flipX);
        this.updateGunSprite(enemy.gunSprite, now);
      }
    });

    // Limpeza de bullets (TTL / fora da tela)
    this.cleanupBullets(this.playerBullets, now);
    this.cleanupBullets(this.enemyBullets, now);
  }

  ensureBulletTexture(textureKey, color) {
    if (this.textures.exists(textureKey)) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, 10, 3);
    g.generateTexture(textureKey, 10, 3);
    g.destroy();
  }

  ensureBulletAnim(animKey, frameKeys, frameRate) {
    if (this.anims.exists(animKey)) return;
    const frames = frameKeys.filter((k) => this.textures.exists(k)).map((key) => ({ key }));
    if (frames.length < 2) return;
    this.anims.create({ key: animKey, frames, frameRate, repeat: -1 });
  }

  positionAttachedGun(gunSprite, ownerSprite, ownerFlipX) {
    if (!gunSprite || !ownerSprite) return;
    const dir = ownerFlipX ? -1 : 1;
    gunSprite.setPosition(ownerSprite.x + dir * 14, ownerSprite.y - 6);
    gunSprite.setFlipX(ownerFlipX);
  }

  triggerGunFire(gunSprite, idleKey, fireKey, now, durationMs = 80) {
    if (!gunSprite) return;
    gunSprite.gunIdleKey = idleKey;
    gunSprite.gunFireKey = fireKey;
    gunSprite.gunRevertAt = now + durationMs;
    if (fireKey && this.textures.exists(fireKey)) gunSprite.setTexture(fireKey);
  }

  updateGunSprite(gunSprite, now) {
    if (!gunSprite) return;
    if (gunSprite.gunRevertAt && now >= gunSprite.gunRevertAt) {
      gunSprite.gunRevertAt = 0;
      if (gunSprite.gunIdleKey && this.textures.exists(gunSprite.gunIdleKey)) gunSprite.setTexture(gunSprite.gunIdleKey);
    }
  }

  spawnEnemy(x, y) {
    const enemy = this.physics.add.sprite(x, y, "bot1-idle").setScale(2);
    enemy.setBounce(0.1);
    enemy.setCollideWorldBounds(true);
    enemy.hp = 3;
    enemy.patrolSpeed = 70;
    enemy.patrolDir = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    enemy.nextShotTime = this.time.now + Phaser.Math.Between(600, 1200);
    enemy.animIdleKey = "bot1-parado";
    enemy.animRunKey = "bot1-correndo";
    enemy.anims.play(enemy.animIdleKey, true);

    enemy.gunIdleKey = "gun-enemy-idle";
    enemy.gunFireKey = "gun-enemy-fire";
    enemy.gunSprite = this.add.sprite(enemy.x, enemy.y, enemy.gunIdleKey).setScale(1.25).setDepth(9);
    this.enemies.add(enemy);
    return enemy;
  }

  fireBullet(group, textureKey, x, y, vx, vy, ttlMs, animKey) {
    const bullet = group.get(x, y, textureKey);
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setPosition(x, y);
    bullet.setVelocity(vx, vy);
    if (bullet.body?.setAllowGravity) bullet.body.setAllowGravity(false);
    else if (bullet.body) bullet.body.allowGravity = false;
    bullet.spawnTime = this.time.now;
    bullet.ttlMs = ttlMs;
    bullet.body.setSize(14, 6, true);
    if (animKey && bullet.anims) bullet.anims.play(animKey, true);
  }

  cleanupBullets(group, now) {
    group.children.each((bullet) => {
      if (!bullet || !bullet.active) return;
      const expired = now - bullet.spawnTime >= bullet.ttlMs;
      const out = bullet.x < -20 || bullet.x > 820 || bullet.y < -20 || bullet.y > 620;
      if (expired || out) this.disableBullet(bullet);
    });
  }

  disableBullet(bullet) {
    if (!bullet || !bullet.body) return;
    bullet.disableBody(true, true);
    bullet.setActive(false).setVisible(false);
  }

  onBulletHitEnemy(bullet, enemy) {
    this.disableBullet(bullet);
    if (!enemy || !enemy.active) return;

    enemy.hp -= 1;
    this.tweens.add({ targets: enemy, alpha: 0.3, yoyo: true, duration: 80, repeat: 2 });

    if (enemy.hp <= 0) {
      if (enemy.gunSprite) enemy.gunSprite.destroy();
      enemy.disableBody(true, true);
    }
  }

  onBulletHitPlayer(bullet, player) {
    const bulletX = bullet.x;
    this.disableBullet(bullet);
    if (!player || !player.active) return;

    const now = this.time.now;
    if (now < this.playerInvulnerableUntil) return;

    this.playerHealth = Math.max(0, this.playerHealth - 1);
    this.hpText.setText(`HP: ${this.playerHealth}/${this.playerMaxHealth}`);

    this.playerInvulnerableUntil = now + 900;
    this.cameras.main.shake(120, 0.004);

    const knockDir = player.x < bulletX ? -1 : 1;
    player.setVelocityX(knockDir * 220);
    player.setVelocityY(-160);

    this.tweens.add({ 
      targets: player,
      alpha: 0.35,
      yoyo: true,
      repeat: 6,
      duration: 60,
      onComplete: () => player.setAlpha(1),
    });

    if (this.playerHealth <= 0) {
      this.helpText.setText("VOCÊ CAIU! Reiniciando...");
      this.time.delayedCall(900, () => this.scene.restart());
    }
  }

  onPlayerHitHazard() {
    const now = this.time.now;
    if (now < this.playerInvulnerableUntil || this.playerHealth <= 0) return;

    this.playerHealth = Math.max(0, this.playerHealth - 1);
    this.hpText.setText(`HP: ${this.playerHealth}/${this.playerMaxHealth}`);
    this.playerInvulnerableUntil = now + 900;

    this.cameras.main.shake(90, 0.004);
    const knockDir = this.player.flipX ? 1 : -1;
    this.player.setVelocityX(knockDir * 220);
    this.player.setVelocityY(-200);

    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      yoyo: true,
      repeat: 6,
      duration: 60,
      onComplete: () => this.player.setAlpha(1),
    });

    if (this.playerHealth <= 0) {
      this.helpText.setText("VOCE CAIU! Reiniciando...");
      this.time.delayedCall(900, () => this.scene.restart());
    }
  }
}
