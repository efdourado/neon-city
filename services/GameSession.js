const RUN_STATE_KEY = 'neon-city-current-run';
const RANKING_KEY = 'neon-city-ranking';
const PLAYER_NAME_KEY = 'neon-city-player-name';
const MAX_RANKING_ENTRIES = 10;

// Este modulo concentra o fluxo de dados da run:
// 1. cria/recupera a run atual no localStorage;
// 2. registra eventos das fases (inicio, conclusao, dano e mortes);
// 3. finaliza a run, calcula score e atualiza o ranking local;
// 4. monta um payload resumido para o POST opcional ao n8n.
//
// Importante: o ranking e totalmente local. O n8n nao decide ranking, nao salva
// score no navegador e nao recebe a lista completa de colocacoes.

const PHASE_LABELS = {
  fase1: 'Telhados de Neon',
  fase2: 'Laboratorio Subterraneo',
  faseFinal: 'GeminiBoss'
};

function getStorage() {
  // Alguns navegadores/modos privados podem bloquear localStorage. O jogo segue
  // funcionando sem persistencia, usando os fallbacks das funcoes de leitura.
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function readJson(key, fallback) {
  const storage = getStorage();
  if (!storage) {
    return fallback;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

function now() {
  return Date.now();
}

function createRun(playerName = getPlayerName()) {
  // A run e a unidade de pontuacao: nasce quando o jogador inicia a Fase 1 e
  // termina somente quando o Data-Core e coletado na fase final.
  return {
    id: `run-${now()}-${Math.round(Math.random() * 9999)}`,
    playerName: normalizePlayerName(playerName),
    startedAt: now(),
    finishedAt: null,
    phases: {},
    counters: {
      damageTaken: 0,
      deaths: 0,
      objectives: 0
    },
    completed: false,
    score: 0,
    durationMs: 0
  };
}

function normalizePlayerName(name) {
  const cleanName = String(name ?? '').trim().slice(0, 18);
  return cleanName || 'Nova';
}

function saveRun(run) {
  writeJson(RUN_STATE_KEY, run);
  return run;
}

export function getPlayerName() {
  const storage = getStorage();
  const storedName = storage?.getItem(PLAYER_NAME_KEY);
  return normalizePlayerName(storedName || 'Nova');
}

export function setPlayerName(name) {
  const playerName = normalizePlayerName(name);
  getStorage()?.setItem(PLAYER_NAME_KEY, playerName);

  const run = getCurrentRun();
  if (run && !run.completed) {
    run.playerName = playerName;
    saveRun(run);
  }

  return playerName;
}

export function startRun(playerName = getPlayerName()) {
  // Reinicia a tentativa ativa e apaga o progresso parcial anterior.
  return saveRun(createRun(playerName));
}

export function ensureRun() {
  const run = getCurrentRun();
  if (run && !run.completed) {
    return run;
  }

  return startRun();
}

export function getCurrentRun() {
  return readJson(RUN_STATE_KEY, null);
}

export function recordPhaseStart(phaseKey) {
  // Chamado no create() de cada fase. Se a fase ja tinha sido concluida e for
  // reaberta, ela volta a ficar "em andamento"; mortes dentro da mesma fase
  // continuam contando no intervalo da run.
  const run = ensureRun();
  const phase = run.phases[phaseKey] ?? {
    label: PHASE_LABELS[phaseKey] ?? phaseKey,
    startedAt: now(),
    completedAt: null,
    deaths: 0,
    damageTaken: 0
  };

  if (!phase.startedAt || phase.completedAt) {
    phase.startedAt = now();
    phase.completedAt = null;
  }

  run.phases[phaseKey] = phase;
  return saveRun(run);
}

export function recordPhaseComplete(phaseKey) {
  // Completar uma fase incrementa objectives; este contador vira bonus no score
  // e tambem entra no JSON enviado ao n8n.
  const run = ensureRun();
  const phase = run.phases[phaseKey] ?? {
    label: PHASE_LABELS[phaseKey] ?? phaseKey,
    startedAt: now(),
    deaths: 0,
    damageTaken: 0
  };

  if (!phase.completedAt) {
    phase.completedAt = now();
  }

  run.phases[phaseKey] = phase;
  run.counters.objectives += 1;
  return saveRun(run);
}

export function recordDamage(phaseKey) {
  // Conta dano por fase e no total. O valor total penaliza o score.
  const run = ensureRun();
  const phase = run.phases[phaseKey] ?? {
    label: PHASE_LABELS[phaseKey] ?? phaseKey,
    startedAt: now(),
    completedAt: null,
    deaths: 0,
    damageTaken: 0
  };

  phase.damageTaken += 1;
  run.counters.damageTaken += 1;
  run.phases[phaseKey] = phase;
  return saveRun(run);
}

export function recordDeath(phaseKey) {
  // Conta mortes por fase e no total. O valor total penaliza mais que dano.
  const run = ensureRun();
  const phase = run.phases[phaseKey] ?? {
    label: PHASE_LABELS[phaseKey] ?? phaseKey,
    startedAt: now(),
    completedAt: null,
    deaths: 0,
    damageTaken: 0
  };

  phase.deaths += 1;
  run.counters.deaths += 1;
  run.phases[phaseKey] = phase;
  return saveRun(run);
}

export function finishRun() {
  // A ordem e intencional: primeiro salva score/ranking local, depois a cena
  // final tenta chamar o n8n. Assim uma falha no webhook nunca perde a run.
  const run = ensureRun();
  if (run.completed) {
    return run;
  }

  run.finishedAt = now();
  run.completed = true;
  run.durationMs = Math.max(0, run.finishedAt - run.startedAt);
  run.score = calculateScore(run);
  saveRun(run);
  saveRankingEntry(run);
  return run;
}

function calculateScore(run) {
  const durationSeconds = Math.round((run.durationMs ?? 0) / 1000);
  const baseScore = 10000;
  const timePenalty = durationSeconds * 6;
  const deathPenalty = (run.counters?.deaths ?? 0) * 450;
  const damagePenalty = (run.counters?.damageTaken ?? 0) * 90;
  const objectiveBonus = (run.counters?.objectives ?? 0) * 550;

  return Math.max(100, baseScore + objectiveBonus - timePenalty - deathPenalty - damagePenalty);
}

function saveRankingEntry(run) {
  // Ranking local: lista top 10 no localStorage do proprio navegador. Nao ha
  // backend, sincronizacao entre maquinas, nem dependencia da resposta do n8n.
  const ranking = getRanking();
  const entry = toRankingEntry(run);
  const filteredRanking = ranking.filter((item) => item.id !== entry.id);

  filteredRanking.push(entry);
  filteredRanking.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.durationMs - b.durationMs;
  });

  writeJson(RANKING_KEY, filteredRanking.slice(0, MAX_RANKING_ENTRIES));
}

export function getRanking() {
  return readJson(RANKING_KEY, []);
}

export function clearRanking() {
  writeJson(RANKING_KEY, []);
}

export function toRankingEntry(run) {
  return {
    id: run.id,
    playerName: run.playerName,
    score: run.score,
    durationMs: run.durationMs,
    deaths: run.counters?.deaths ?? 0,
    damageTaken: run.counters?.damageTaken ?? 0,
    finishedAt: run.finishedAt
  };
}

export function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.round((durationMs ?? 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function buildRunPayload(run) {
  // JSON enviado no POST ao webhook n8n. Ele contem apenas o resumo da run
  // finalizada; nao envia ranking completo, URL do webhook, localStorage bruto
  // nem nenhuma chave de API.
  return {
    event: 'neon_city_run_finished',
    game: 'Neon City',
    playerName: run.playerName,
    score: run.score,
    durationSeconds: Math.round((run.durationMs ?? 0) / 1000),
    deaths: run.counters?.deaths ?? 0,
    damageTaken: run.counters?.damageTaken ?? 0,
    objectivesCompleted: run.counters?.objectives ?? 0,
    phases: Object.entries(run.phases ?? {}).map(([key, phase]) => ({
      key,
      label: phase.label,
      durationSeconds: phase.completedAt && phase.startedAt
        ? Math.round((phase.completedAt - phase.startedAt) / 1000)
        : null,
      deaths: phase.deaths ?? 0,
      damageTaken: phase.damageTaken ?? 0
    }))
  };
}
