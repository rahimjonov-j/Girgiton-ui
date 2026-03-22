import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger.js';

const SPEECH_ENDPOINT = 'https://uzbekvoice.ai/api/v1/stt';

/**
 * Returns the file extension and normalized content-type for the given mimeType.
 * UzbekVoice.ai accepts: wav, mp3, ogg, webm, mp4 (m4a)
 */
function resolveAudioFormat(mimeType) {
  if (!mimeType) return { ext: 'webm', contentType: 'audio/webm' };

  // iOS Safari records audio/mp4 or audio/mp4;codecs=mp4a.40.2
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
    return { ext: 'mp4', contentType: 'audio/mp4' };
  }
  if (mimeType.includes('aac')) {
    return { ext: 'aac', contentType: 'audio/aac' };
  }
  if (mimeType.includes('ogg')) {
    return { ext: 'ogg', contentType: 'audio/ogg' };
  }
  if (mimeType.includes('wav')) {
    return { ext: 'wav', contentType: 'audio/wav' };
  }
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    return { ext: 'mp3', contentType: 'audio/mpeg' };
  }
  // Default: webm (Android Chrome)
  return { ext: 'webm', contentType: 'audio/webm' };
}

export async function speechToText(audioBase64, mimeType) {
  const apiKey = process.env.SPEECH_TO_TEXT_API_KEY;
  if (!apiKey) {
    throw new Error('SPEECH_TO_TEXT_API_KEY is missing');
  }

  const buffer = Buffer.from(audioBase64, 'base64');
  // Strip codec params (e.g. 'audio/webm;codecs=opus' → 'audio/webm')
  const cleanMimeType = (mimeType || '').split(';')[0].trim();
  const { ext, contentType } = resolveAudioFormat(cleanMimeType);

  const form = new FormData();
  form.append('file', buffer, {
    filename: `audio.${ext}`,
    contentType,
    knownLength: buffer.length,
  });
  form.append('return_offsets', 'false');
  form.append('run_diarization', 'false');
  form.append('language', 'uz');
  form.append('blocking', 'true');

  logger.info({ mimeType, ext, contentType, sizeBytes: buffer.length }, 'UzbekVoice STT request');

  let data;
  try {
    const response = await axios.post(SPEECH_ENDPOINT, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: apiKey,
      },
      timeout: 90000, // 90s — iOS files can be larger
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    data = response.data;
  } catch (err) {
    const status = err?.response?.status;
    const errorData = err?.response?.data;
    logger.error({ status, errorData, mimeType, ext }, 'UzbekVoice STT failed');
    const errText =
      typeof errorData === 'object' ? JSON.stringify(errorData) : String(errorData || 'No details');
    throw new Error(
      `UzbekVoice STT failed${status ? ` (HTTP ${status})` : ''}: ${errText}`
    );
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
