import axios from 'axios';
import { SYSTEM_PROMPT, RESPONSE_SCHEMA } from '../ai/prompt.js';
import { logger } from '../utils/logger.js';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, retries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      const retryable = status === 429 || status === 503 || status === 502;
      if (attempt < retries && retryable) {
        const baseDelay = 1000 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 300);
        await sleep(baseDelay + jitter);
        continue;
      }
      break;
    }
  }
  throw lastError;
}

async function callOpenAI(messages, apiKey) {
  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1';

  const response = await withRetry(async () => {
    try {
      const { data } = await axios.post(
        OPENAI_ENDPOINT,
        {
          model,
          messages,
          temperature: 0.2,
          max_tokens: 2048,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );
      return data;
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      logger.error({ status, data, model }, 'OpenAI request failed');

      if (status === 400 || status === 403 || status === 404) {
        const configError = new Error('OPENAI_INVALID_REQUEST');
        configError.statusCode = status;
        configError.details = data?.error?.message || 'Noma\'lum xato';
        throw configError;
      }
      throw err;
    }
  });

  return response?.choices?.[0]?.message?.content?.trim();
}

function buildMessages(text, extraInstruction = '') {
  const userContent = extraInstruction
    ? `${text}\n\n${extraInstruction}\n\nReturn JSON in this exact shape:\n${RESPONSE_SCHEMA}`
    : `${text}\n\nReturn JSON in this exact shape:\n${RESPONSE_SCHEMA}`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ];
}

const tryParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const repairJson = (value) => {
  if (!value) return null;
  const match = value.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : value;
  const cleaned = candidate.replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

export async function parseOrderWithOpenAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  let rawText;

  // --- First attempt ---
  try {
    rawText = await callOpenAI(buildMessages(text), apiKey);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 429) {
      const rateError = new Error('OPENAI_RATE_LIMIT');
      rateError.statusCode = 429;
      throw rateError;
    }
    if (err?.message === 'OPENAI_INVALID_REQUEST') {
      throw err;
    }
    throw err;
  }

  if (!rawText) {
    throw new Error('OpenAI response empty');
  }

  logger.info({ rawLength: rawText.length, rawText }, 'OpenAI response');

  // Off-topic check
  const prelimParsed = tryParse(rawText);
  if (prelimParsed?.mavzudan_chiqildi) {
    return 'Mavzudan chiqildi';
  }
  if (prelimParsed) {
    return prelimParsed;
  }

  const repaired = repairJson(rawText);
  if (repaired) {
    return repaired;
  }

  // --- Second attempt: ask for strict JSON only ---
  logger.warn({ rawText }, 'OpenAI response not parseable, retrying with strict instruction');
  try {
    rawText = await callOpenAI(
      buildMessages(text, 'Return ONLY a valid JSON object. Do not include any extra text, markdown, or commentary.'),
      apiKey
    );
  } catch (err) {
    throw err;
  }

  if (!rawText) {
    throw new Error('OpenAI response empty');
  }

  logger.info({ rawLength: rawText.length, rawText }, 'OpenAI response (retry)');

  const parsed2 = tryParse(rawText) ?? repairJson(rawText);
  if (parsed2?.mavzudan_chiqildi) return 'Mavzudan chiqildi';
  if (parsed2) return parsed2;

  // --- Third attempt: fix JSON directive ---
  const fixMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Fix this broken JSON and return ONLY valid JSON:\n${rawText}` }
  ];

  try {
    rawText = await callOpenAI(fixMessages, apiKey);
  } catch (err) {
    throw err;
  }

  if (!rawText) {
    throw new Error('OpenAI response empty');
  }

  logger.info({ rawLength: rawText.length, rawText }, 'OpenAI response (fix)');

  const parsed3 = tryParse(rawText) ?? repairJson(rawText);
  if (parsed3?.mavzudan_chiqildi) return 'Mavzudan chiqildi';
  if (parsed3) return parsed3;

  const invalidJson = new Error('OPENAI_JSON_INVALID');
  invalidJson.statusCode = 422;
  invalidJson.preview = rawText.slice(0, 200);
  throw invalidJson;
}
