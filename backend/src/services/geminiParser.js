import axios from 'axios';
import { GEMINI_RESPONSE_SCHEMA, GEMINI_SYSTEM_PROMPT } from '../ai/prompt.js';
import { logger } from '../utils/logger.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALLBACK_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, retries = 4) {
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

function buildPayload(text, extraInstruction, useSystemInstruction, useResponseMimeType) {
  const userText = `${text}\n\nReturn JSON in this shape:\n${GEMINI_RESPONSE_SCHEMA}\n${extraInstruction}`;
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: useSystemInstruction ? userText : `${GEMINI_SYSTEM_PROMPT}\n\n${userText}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 2048
    }
  };

  if (useSystemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: GEMINI_SYSTEM_PROMPT }]
    };
  }

  if (useResponseMimeType) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  return payload;
}

async function callGemini(text, apiKey, model, extraInstruction = '', options = {}) {
  const payload = buildPayload(
    text,
    extraInstruction,
    options.useSystemInstruction ?? true,
    options.useResponseMimeType ?? true
  );

  const response = await withRetry(async () => {
    try {
      const { data } = await axios.post(
        `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`,
        payload,
        { timeout: 30000 }
      );
      return data;
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      logger.error({ status, data, model }, 'Gemini request failed');
      if (status === 400 || status === 403 || status === 404) {
        const configError = new Error('GEMINI_INVALID_REQUEST');
        configError.statusCode = status;
        throw configError;
      }
      throw err;
    }
  });

  return response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

export async function parseOrderWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const tryParse = (value) => {
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

  const callWithFallbacks = async (promptText, extraInstruction = '') => {
    const models = [model, ...FALLBACK_MODELS].filter(
      (item, index, arr) => item && arr.indexOf(item) === index
    );
    const variants = [
      { useSystemInstruction: true, useResponseMimeType: true },
      { useSystemInstruction: false, useResponseMimeType: false }
    ];

    let lastError;
    for (const candidate of models) {
      for (const variant of variants) {
        try {
          return await callGemini(promptText, apiKey, candidate, extraInstruction, variant);
        } catch (err) {
          if (err?.message === 'GEMINI_RATE_LIMIT') {
            throw err;
          }
          if (err?.message === 'GEMINI_INVALID_REQUEST') {
            lastError = err;
            continue;
          }
          if (err?.response?.status === 429) {
            throw err;
          }
          lastError = err;
          break;
        }
      }
    }
    throw lastError;
  };

  let rawText;
  try {
    rawText = await callWithFallbacks(text, '');
  } catch (err) {
    const status = err?.response?.status;
    if (status === 429) {
      const rateError = new Error('GEMINI_RATE_LIMIT');
      rateError.statusCode = 429;
      throw rateError;
    }
    if (err?.message === 'GEMINI_INVALID_REQUEST') {
      const invalid = new Error('GEMINI_INVALID_REQUEST');
      invalid.statusCode = err?.statusCode ?? 400;
      throw invalid;
    }
    throw err;
  }

  if (!rawText) {
    throw new Error('Gemini response empty');
  }

  logger.info({ rawLength: rawText.length, rawText }, 'Gemini response');

  if (rawText.includes('Mavzudan chiqildi')) {
    return 'Mavzudan chiqildi';
  }

  let parsed = tryParse(rawText);
  if (parsed) {
    return parsed;
  }

  const repaired = repairJson(rawText);
  if (repaired) {
    return repaired;
  }

  rawText = await callWithFallbacks(
    text,
    'Return ONLY a valid JSON object. Do not include any extra text, markdown, or commentary.'
  );

  if (!rawText) {
    throw new Error('Gemini response empty');
  }

  logger.info({ rawLength: rawText.length, rawText }, 'Gemini response (retry)');

  parsed = tryParse(rawText) ?? repairJson(rawText);
  if (parsed) {
    return parsed;
  }

  const fixPrompt = `Fix this JSON and return ONLY valid JSON:\n${rawText}`;
  rawText = await callWithFallbacks(fixPrompt, '');
  if (!rawText) {
    throw new Error('Gemini response empty');
  }
  logger.info({ rawLength: rawText.length, rawText }, 'Gemini response (fix)');
  parsed = tryParse(rawText) ?? repairJson(rawText);
  if (parsed) {
    return parsed;
  }

  const invalidJson = new Error('GEMINI_JSON_INVALID');
  invalidJson.statusCode = 422;
  invalidJson.preview = rawText.slice(0, 200);
  throw invalidJson;
}
