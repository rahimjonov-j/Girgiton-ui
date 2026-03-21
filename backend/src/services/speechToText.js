import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger.js';

const SPEECH_ENDPOINT = 'https://uzbekvoice.ai/api/v1/stt';

function getExtension(mimeType) {
  if (!mimeType) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg')) return 'mp3';
  return 'webm';
}

export async function speechToText(audioBase64, mimeType) {
  const apiKey = process.env.SPEECH_TO_TEXT_API_KEY;
  if (!apiKey) {
    throw new Error('SPEECH_TO_TEXT_API_KEY is missing');
  }

  const buffer = Buffer.from(audioBase64, 'base64');
  const ext = getExtension(mimeType);

  const form = new FormData();
  form.append('file', buffer, { filename: `audio.${ext}`, contentType: mimeType || 'application/octet-stream' });
  form.append('return_offsets', 'false');
  form.append('run_diarization', 'false');
  form.append('language', 'uz');
  form.append('blocking', 'true');

  logger.info({ mimeType, size: buffer.length }, 'UzbekVoice STT request');

  let data;
  try {
    const response = await axios.post(SPEECH_ENDPOINT, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: apiKey
      },
      timeout: 60000
    });
    data = response.data;
  } catch (err) {
    const status = err?.response?.status;
    const errorData = err?.response?.data;
    logger.error({ status, errorData }, 'UzbekVoice STT failed');
    throw new Error(`UzbekVoice STT failed${status ? ` (HTTP ${status})` : ''}`);
  }

  const transcript =
    data?.text ??
    data?.result?.text ??
    data?.transcription ??
    data?.results?.[0]?.text ??
    data?.results?.[0]?.alternatives?.[0]?.transcript;

  if (!transcript || !String(transcript).trim()) {
    logger.error({ data }, 'UzbekVoice STT empty response');
    throw new Error('Speech transcription empty');
  }

  logger.info({ transcript }, 'Speech transcription');
  return String(transcript);
}
