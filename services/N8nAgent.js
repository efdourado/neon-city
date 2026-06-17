const WEBHOOK_KEY = 'neon-city-n8n-webhook';
const REQUEST_TIMEOUT_MS = 9000;

// Este modulo e a ponte opcional com o n8n.
// O frontend guarda somente a URL do Webhook e envia o payload da run via POST.
// Credenciais de OpenAI, prompts longos e persistencia remota devem ficar no
// workflow n8n, nunca neste repositorio nem no navegador.

function getStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function readWebhookFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('n8n') || params.get('webhook') || '';
}

function normalizeUrl(url) {
  const trimmedUrl = String(url ?? '').trim();
  if (!trimmedUrl) {
    return '';
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return '';
    }

    return parsedUrl.toString();
  } catch (error) {
    return '';
  }
}

export function getWebhookUrl() {
  // Ordem de prioridade para facilitar testes:
  // 1. window.NEON_CITY_N8N_WEBHOOK, caso index.html injete a URL;
  // 2. query string ?n8n=... ou ?webhook=..., que tambem salva no navegador;
  // 3. ultima URL configurada na tela de ranking.
  const globalUrl = normalizeUrl(window.NEON_CITY_N8N_WEBHOOK);
  if (globalUrl) {
    return globalUrl;
  }

  const queryUrl = normalizeUrl(readWebhookFromQuery());
  if (queryUrl) {
    setWebhookUrl(queryUrl);
    return queryUrl;
  }

  return normalizeUrl(getStorage()?.getItem(WEBHOOK_KEY));
}

export function setWebhookUrl(url) {
  // Salva ou limpa apenas a URL do webhook. Esta informacao e local ao
  // navegador e nao altera o ranking nem o estado da run.
  const webhookUrl = normalizeUrl(url);
  const storage = getStorage();

  if (webhookUrl) {
    storage?.setItem(WEBHOOK_KEY, webhookUrl);
  } else {
    storage?.removeItem(WEBHOOK_KEY);
  }

  return webhookUrl;
}

export function getConnectionStatus() {
  const webhookUrl = getWebhookUrl();
  return {
    configured: Boolean(webhookUrl),
    webhookUrl
  };
}

export async function submitRunToAgent(payload) {
  // A cena final passa aqui o objeto criado por buildRunPayload(run).
  // O POST envia JSON puro para o n8n e espera texto ou JSON como resposta.
  // Qualquer erro vira um status amigavel; a run ja foi salva localmente antes.
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return {
      ok: false,
      status: 'not_configured',
      message: 'Webhook n8n nao configurado. Ranking salvo localmente.'
    };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseText = await response.text();
    const parsedBody = parseResponseBody(responseText);

    if (!response.ok) {
      return {
        ok: false,
        status: 'http_error',
        message: `n8n respondeu HTTP ${response.status}.`,
        body: parsedBody
      };
    }

    return {
      ok: true,
      status: 'ok',
      message: extractAgentMessage(parsedBody),
      body: parsedBody
    };
  } catch (error) {
    return {
      ok: false,
      status: error.name === 'AbortError' ? 'timeout' : 'network_error',
      message: error.name === 'AbortError'
        ? 'n8n demorou demais para responder.'
        : 'Nao foi possivel conectar ao n8n.'
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function parseResponseBody(text) {
  // O n8n pode responder JSON pelo node "Respond to Webhook" ou texto puro.
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { text };
  }
}

function extractAgentMessage(body) {
  // Aceita os nomes mais comuns usados por Webhook/AI Agent/Respond nodes.
  if (typeof body === 'string') {
    return body;
  }

  const directMessage = body.message
    || body.reply
    || body.analysis
    || body.output
    || body.text;

  if (typeof directMessage === 'string' && directMessage.trim()) {
    return directMessage.trim();
  }

  if (Array.isArray(body) && body.length > 0) {
    return extractAgentMessage(body[0]);
  }

  if (body.data) {
    return extractAgentMessage(body.data);
  }

  return 'Agente IA recebeu a run, mas nao retornou comentario.';
}
