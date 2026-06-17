# Neon City

Neon City é um jogo 2D de plataforma e ação com estética cyberpunk, desenvolvido em HTML, CSS e JavaScript com Phaser 3. O jogador controla Nova, uma detetive cibernética que precisa atravessar os telhados da cidade, invadir um laboratório subterrâneo e derrotar GeminiBoss para recuperar o Data-Core.

O jogo está completo como experiência jogável: possui menu inicial, tela de instruções, três fases conectadas, HUD de vida e objetivos, inimigos com patrulha e disparos, hazards, itens de missão, sequência final automatizada, boss fight e tela de vitória.

## Como jogar

1. Encoste nos cartões de acesso para coletar todos eles na Fase 1.
2. Entre pela porta liberada para chegar ao laboratório.
3. Encoste nos switches da Fase 2 para derrubar as barreiras de serras.
4. Sobreviva ao corredor de lockdown até a câmara final.
5. Derrote GeminiBoss e pegue o Data-Core para vencer.

## Controles

| Ação | Tecla |
| --- | --- |
| Mover Nova | Setas esquerda e direita |
| Pular | Seta para cima |
| Correr | Shift |
| Atirar | Espaço |
| Voltar ao menu durante o jogo | M |
| Alternar status de desenvolvimento | D |
| Reiniciar a boss fight ou reiniciar após a vitória | R, apenas na fase final |

### Menu e instruções

| Ação | Tecla ou entrada |
| --- | --- |
| Navegar no menu | Setas para cima e baixo |
| Confirmar opção selecionada | Enter |
| Abrir instruções pelo menu | I |
| Abrir ranking pelo menu | R |
| Selecionar opção | Mouse |
| Voltar das instruções para o menu | Esc |

### Ranking e IA

| Ação | Tecla ou entrada |
| --- | --- |
| Abrir ranking | R no menu |
| Iniciar pelo ranking | Enter |
| Configurar jogador | P na tela de ranking |
| Configurar Webhook n8n | N na tela de ranking |
| Limpar ranking local | C na tela de ranking |

### Atalhos de desenvolvimento

| Atalho | Função |
| --- | --- |
| D | Mostra ou oculta o painel de status da fase atual |
| Ç, na Fase 1 | Pula diretamente para a Fase 2 |
| L, na Fase 2 | Move Nova para perto do corredor final |
| `?debug=1` ou `?dev=1` na URL | Ativa a visualização das hitboxes da física Arcade |

## Fases

### Fase 1: Telhados de Neon

A primeira fase apresenta a cidade em um percurso lateral de telhados. O objetivo é encontrar e coletar 5 cartões de acesso espalhados pelas plataformas. Enquanto coleta os cartões, Nova precisa evitar spikes, serras móveis, tiros inimigos e bots em patrulha.

Quando todos os cartões são coletados, a porta do laboratório muda para o estado desbloqueado. Entrar nela inicia a transição para a Fase 2.

### Fase 2: Laboratório Subterrâneo

A segunda fase aumenta a escala do mapa e adiciona ácido, paredes, plataformas altas, decorações com colisão, bots mais agressivos, spikes e serras verticais e horizontais.

O objetivo principal é ativar 2 switches. Cada switch desativa uma barreira de serras. Depois que a rota final fica liberada, Nova chega ao corredor de lockdown, onde o jogo inicia uma corrida automática até a câmara do Data-Core.

### Fase Final: GeminiBoss

A fase final acontece em uma arena com três plataformas sobre ácido. GeminiBoss patrulha, teleporta entre plataformas e dispara rajadas de projéteis. Ao perder vida suficiente, entra em estado enraivecido, ficando mais rápido e atirando com maior pressão.

Depois que o boss é derrotado, o Data-Core aparece na arena. A vitória acontece quando Nova coleta o Data-Core.

## Sistemas do jogo

### Jogador

Nova possui animações de idle, caminhada, corrida e pulo. A personagem pode andar, correr, pular e atirar para a esquerda ou direita de acordo com a última direção usada.

A vida da jogadora é exibida por uma barra de HP com 3 segmentos. Ao sofrer dano, Nova recebe knockback, fica brevemente invulnerável e pisca. Se a vida chega a zero, a fase reinicia ou a personagem respawna, dependendo da cena.

### Combate

Os tiros do jogador usam projéteis físicos sem gravidade. Eles atravessam uma distância máxima, colidem com plataformas e causam dano aos bots ou ao boss.

Os bots comuns patrulham plataformas, viram ao encontrar limites, detectam Nova por alcance horizontal e vertical, reduzem a velocidade quando miram e disparam quando têm linha de visão.

GeminiBoss tem barra de vida própria, teleporte, decisões de movimentação, rajadas de projéteis e fase enraivecida.

### Obstáculos

O jogo inclui:

| Obstáculo | Comportamento |
| --- | --- |
| Spikes | Causam dano ao encostar |
| Serras horizontais | Patrulham um trecho da plataforma |
| Serras verticais | Sobem e descem em zonas específicas |
| Barreiras de serras | Bloqueiam rotas até o switch relacionado ser ativado |
| Ácido | Reinicia ou mata Nova ao contato, dependendo da fase |
| Bots | Causam dano por contato e por projéteis |
| Projéteis inimigos | Causam dano e knockback |

### HUD

Cada fase mostra informações relevantes ao jogador:

| Elemento | Onde aparece |
| --- | --- |
| HP de Nova | Todas as fases jogáveis |
| Contador de cartões | Fase 1 |
| Objetivo atual | Todas as fases jogáveis |
| Nome da fase | Fases 1 e 2 |
| Barra de vida do boss | Fase final |
| Pulsos de objetivo | Durante eventos importantes |
| Painel dev | Com a tecla D |
| Score, ranking e comentario da IA | Tela de ranking e vitoria final |

### Ranking

O jogo registra uma run completa desde o inicio da Fase 1 ate a coleta do Data-Core. Ao vencer, ele calcula:

- tempo total;
- mortes;
- dano recebido;
- objetivos concluidos;
- score final.

O ranking local fica salvo no `localStorage` do navegador. Isso evita depender de banco para demonstrar a mecanica, mas ainda permite apresentar placar por tempo e score durante o video.

### Integracao n8n + agente de IA

O n8n entra como Backend REST + Agente de IA. O jogo envia um `POST` para um Webhook n8n quando a run termina. A credencial da OpenAI deve ficar somente no n8n, nunca no frontend, no GitHub ou em arquivos publicos do projeto.

Se uma chave da OpenAI foi compartilhada em chat, GitHub, video ou print, revogue a chave e gere outra antes de usar.

#### Como configurar no jogo

Existem duas formas:

1. Abra a tela de ranking e pressione `N` para colar a URL do Webhook n8n.
2. Passe a URL pela query string:

```text
http://localhost:8080/?n8n=https://SEU-N8N/webhook/neon-city-agent
```

O jogo salva a URL no `localStorage` do navegador. Para trocar, volte ao ranking e pressione `N` novamente.

#### Payload enviado ao Webhook

```json
{
  "event": "neon_city_run_finished",
  "game": "Neon City",
  "playerName": "Nova",
  "score": 10120,
  "durationSeconds": 315,
  "deaths": 2,
  "damageTaken": 7,
  "objectivesCompleted": 3,
  "phases": [
    {
      "key": "fase1",
      "label": "Telhados de Neon",
      "durationSeconds": 85,
      "deaths": 1,
      "damageTaken": 3
    }
  ]
}
```

#### Resposta esperada do n8n

O jogo aceita texto puro ou JSON. O formato recomendado e:

```json
{
  "message": "Run aprovada. Voce venceu rapido, mas tomou muito dano na fase do laboratorio."
}
```

Tambem sao aceitos os campos `reply`, `analysis`, `output` ou `text`.

#### Workflow sugerido no n8n

1. Crie um node `Webhook` com metodo `POST`.
2. Conecte o Webhook a um node de IA ou `AI Agent` usando a credencial OpenAI cadastrada no proprio n8n.
3. Use um prompt como:

```text
Voce e o agente tecnico de Neon City. Analise a run recebida em JSON.
Responda em portugues, em ate 2 frases, comentando score, tempo, mortes e dano.
Se a run foi boa, elogie objetivamente. Se teve muitas mortes ou dano, de uma dica curta.
Retorne apenas JSON no formato {"message":"..."}.
```

4. Finalize com `Respond to Webhook`, retornando o JSON gerado pelo agente.

## Como rodar localmente

O jogo usa módulos JavaScript e carrega assets pelo Phaser, então deve ser servido por HTTP. Abrir `index.html` diretamente pelo navegador pode bloquear imagens e scripts por CORS.

### Requisitos

- Node.js instalado
- npm instalado
- Conexão com a internet para carregar Phaser 3 e a fonte Orbitron via CDN

### Instalação

```bash
npm install
```

### Executar

```bash
npm start
```

Depois acesse:

```text
http://localhost:8080
```

O script `npm start` usa o Servor com reload automático. Se a porta `8080` estiver ocupada, o Servor tenta encontrar outra porta disponível e mostra a URL correta no terminal.

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| HTML | Estrutura da página que carrega o jogo |
| CSS | Reset e estilos básicos da página |
| JavaScript ES Modules | Organização das cenas e entidades |
| Phaser 3.80.1 | Renderização, cenas, física Arcade, input, câmera, animações e tweens |
| Servor | Servidor local para desenvolvimento |

## Estrutura do projeto

```text
.
├── assets/              # Sprites, fundos, tiles, objetos, armas e projéteis
├── entities/            # Classes reutilizáveis do jogo
│   ├── Bot1.js          # Bot comum com patrulha, vida e disparo
│   ├── BotFinal.js      # GeminiBoss
│   ├── Bullet.js        # Projétil do jogador, inimigos e boss
│   ├── Player.js        # Nova, controles, movimento e disparo
│   └── Saw.js           # Serra móvel horizontal ou vertical
├── scenes/              # Cenas Phaser
│   ├── Menu.js          # Menu inicial
│   ├── Instructions.js  # Tela de instruções
│   ├── Fase1.js         # Telhados de Neon
│   ├── Fase2.js         # Laboratório Subterrâneo
│   └── FaseFinal.js     # GeminiBoss e Data-Core
├── index.html           # Página principal
├── main.js              # Configuração do Phaser e registro das cenas
├── package.json         # Scripts e dependências
└── styles.css           # Estilos básicos
```

## Fluxo das cenas

```text
Menu
├── Instruções
└── Fase 1: Telhados de Neon
    └── Fase 2: Laboratório Subterrâneo
        └── Fase Final: GeminiBoss
            └── Vitória: Data-Core recuperado
```

## Créditos

Projeto final da disciplina de Sistemas Multimídias.

Desenvolvido por Eduardo Dourado, Henrico Costa e Cássio Rodrigues.
