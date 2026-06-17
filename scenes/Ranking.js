import {
  clearRanking,
  formatDuration,
  getPlayerName,
  getRanking,
  setPlayerName,
  startRun
} from '../services/GameSession.js';
import {
  getConnectionStatus,
  setWebhookUrl
} from '../services/N8nAgent.js';

export default class Ranking extends Phaser.Scene {
  constructor() {
    super({ key: 'Ranking' });
  }

  preload() {
    this.load.image('ranking_bg', 'assets/bg/bg-Gem3.png');
  }

  create() {
    this.screenWidth = Number(this.sys.game.config.width);
    this.screenHeight = Number(this.sys.game.config.height);

    const bg = this.add.image(this.screenWidth / 2, this.screenHeight / 2, 'ranking_bg');
    bg.setDisplaySize(this.screenWidth, this.screenHeight);

    this.add.rectangle(0, 0, this.screenWidth, this.screenHeight, 0x000000, 0.68).setOrigin(0);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffff, 0.08);
    for (let x = 0; x < this.screenWidth; x += 80) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.screenHeight);
    }
    for (let y = 0; y < this.screenHeight; y += 80) {
      grid.moveTo(0, y);
      grid.lineTo(this.screenWidth, y);
    }
    grid.strokePath();

    this.add.text(this.screenWidth / 2, 78, 'RANKING IA', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '58px',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5);

    this.statusText = this.add.text(112, 145, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#dffcff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0);

    this.rankingText = this.add.text(112, 220, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      lineSpacing: 10
    }).setOrigin(0, 0);

    this.actionText = this.add.text(this.screenWidth / 2, this.screenHeight - 86, [
      'ENTER iniciar | ESC menu',
      'P jogador | N webhook n8n | C limpar ranking'
    ], {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#ff8bd9',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    this.refreshTexts();
    this.bindInput();
  }

  bindInput() {
    this.handleEnter = () => {
      startRun();
      this.scene.start('Fase1');
    };
    this.handleEsc = () => {
      this.scene.start('Menu');
    };
    this.handlePlayer = () => {
      const playerName = window.prompt('Nome do jogador:', getPlayerName());
      if (playerName !== null) {
        setPlayerName(playerName);
        this.refreshTexts();
      }
    };
    this.handleWebhook = () => {
      const currentUrl = getConnectionStatus().webhookUrl;
      const webhookUrl = window.prompt('URL do Webhook n8n:', currentUrl);
      if (webhookUrl !== null) {
        // Apenas a URL do Webhook e guardada localmente. O ranking nao e enviado
        // daqui; o POST acontece somente ao vencer a fase final.
        setWebhookUrl(webhookUrl);
        this.refreshTexts();
      }
    };
    this.handleClear = () => {
      const confirmed = window.confirm('Limpar ranking local?');
      if (confirmed) {
        clearRanking();
        this.refreshTexts();
      }
    };

    this.input.keyboard.on('keydown-ENTER', this.handleEnter);
    this.input.keyboard.on('keydown-ESC', this.handleEsc);
    this.input.keyboard.on('keydown-P', this.handlePlayer);
    this.input.keyboard.on('keydown-N', this.handleWebhook);
    this.input.keyboard.on('keydown-C', this.handleClear);

    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-ENTER', this.handleEnter);
      this.input.keyboard.off('keydown-ESC', this.handleEsc);
      this.input.keyboard.off('keydown-P', this.handlePlayer);
      this.input.keyboard.off('keydown-N', this.handleWebhook);
      this.input.keyboard.off('keydown-C', this.handleClear);
    });
  }

  refreshTexts() {
    // Esta tela sempre le o ranking do localStorage. A conexao n8n exibida aqui
    // e so o status da URL configurada para o comentario da IA na vitoria.
    const connection = getConnectionStatus();
    const webhookLabel = connection.configured ? 'n8n conectado' : 'n8n pendente';
    const webhookUrl = connection.webhookUrl ? this.compactUrl(connection.webhookUrl) : 'sem webhook';

    this.statusText.setText([
      `Jogador: ${getPlayerName()}`,
      `Agente IA: ${webhookLabel} (${webhookUrl})`
    ]);

    const ranking = getRanking();
    if (ranking.length === 0) {
      this.rankingText.setText([
        'Nenhuma run finalizada ainda.',
        '',
        'Finalize o Data-Core para aparecer aqui.'
      ]);
      return;
    }

    const lines = ranking.slice(0, 8).map((entry, index) => {
      const position = String(index + 1).padStart(2, '0');
      const name = String(entry.playerName ?? 'Nova').padEnd(18, ' ').slice(0, 18);
      const score = String(entry.score ?? 0).padStart(5, ' ');
      const time = formatDuration(entry.durationMs);
      return `${position}. ${name} ${score} pts  ${time}  KOs ${entry.deaths}`;
    });

    this.rankingText.setText(lines);
  }

  compactUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.host}${parsedUrl.pathname.slice(0, 24)}...`;
    } catch (error) {
      return 'url salva';
    }
  }
}
