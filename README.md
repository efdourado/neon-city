# Neon City

Repositório criado para o nosso projeto final da disciplina de Sistemas Multimídias. O jogo é um plataforma 2D (side-scroller) com uma pegada sci-fi, onde a gente controla a detetive cibernética Nova para recuperar o Data-Core e salvar a cidade.

## Tech

* HTML, CSS e JavaScript puro
* Framework Phaser 3

## Rodando localmente

É só clonar esse repositório na máquina e usar a extensão Live Server para rodar o index.html. Se tentar abrir o arquivo do jogo direto no navegador dando dois cliques, o Phaser vai bloquear o carregamento das imagens por segurança (erro de CORS).

## Roadmap

### Etapa 1: Documentação e Protótipo
* Fase 1 nos telhados com cartões de acesso, inimigos, hazards e porta para o laboratório.
* Fase 2 no laboratório com switches, barreiras de serras, combate mais pesado e corrida final.
* Transição completa: Fase 1 -> Fase 2 -> Boss Final.


### Etapas 2 e 3
* Colisões, física, HP, tiros do player e tiros inimigos.
* HUD de objetivo em cada fase e overlay dev com a tecla D.
* Boss final com teleporte, rajadas de projéteis, fase enraivecida e vitória ao claimar o Data-Core.
* Hitboxes de física disponíveis com `?debug=1` ou `?dev=1` na URL.

## Controles (atual)

* Setas: mover / pular
* Shift: correr
* Espaço: atirar
* D: status dev da fase
* M: voltar ao menu
* L: pular para o corredor final da Fase 2
