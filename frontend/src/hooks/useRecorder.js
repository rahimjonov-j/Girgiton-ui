import { useCallback, useRef, useState } from 'react';

// iOS Safari detection
const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// Get the best supported mimeType
function getSupportedMimeType() {
  // iOS Safari 14.3+ supports audio/mp4
  // Android Chrome supports audio/webm;codecs=opus
  // Firefox supports audio/ogg;codecs=opus
  const types = [
    'audio/mp4;codecs=mp4a.40.2', // iOS AAC-LC
    'audio/mp4',                  // iOS fallback
    'audio/webm;codecs=opus',     // Android Chrome, Desktop
    'audio/webm',
    'audio/ogg;codecs=opus',      // Firefox
    '',                           // Browser default
  ];

  for (const type of types) {
    if (!type) return ''; // let browser decide
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      // MediaRecorder not available
    }
  }
  return '';
}

export function useRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async () => {
    setError(null);
    chunksRef.current = [];

    const ios = isIOS();

    // iOS needs specific audio constraints
    const constraints = {
      audio: ios
        ? {
            channelCount: 1,
            sampleRate: 44100,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
          },
    };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Mikrofon ruxsati berilmadi'
          : `Mikrofon xatosi: ${err.message}`;
      setError(msg);
      throw new Error(msg);
    }

    const mimeType = getSupportedMimeType();

    let mediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
    } catch {
      // If preferred mimeType fails on iOS, try bare audio/mp4
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
    };

    // iOS needs timeslice to get data before onstop fires
    mediaRecorder.start(ios ? 100 : undefined);
    startTimeRef.current = Date.now();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  }, []);

  const stop = useCallback(async () => {
    if (!mediaRecorderRef.current) {
      return null;
    }

    const recorder = mediaRecorderRef.current;

    // Request any remaining data (important on iOS)
    if (recorder.state === 'recording') {
      recorder.requestData();
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        // Use the actual mimeType or fallback
        const actualMime =
          recorder.mimeType && recorder.mimeType !== ''
            ? recorder.mimeType
            : isIOS()
            ? 'audio/mp4'
            : 'audio/webm';

        const blob = new Blob(chunksRef.current, { type: actualMime });
        // Strip codec params so backend/ffmpeg gets a clean container MIME
        const cleanMime = actualMime.split(';')[0].trim();
        setIsRecording(false);
        mediaRecorderRef.current = null;
        resolve({ blob, durationMs, mimeType: cleanMime });
      };

      if (recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        // already stopped (edge case)
        const actualMime = isIOS() ? 'audio/mp4' : 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setIsRecording(false);
        mediaRecorderRef.current = null;
        resolve({ blob, durationMs: Date.now() - startTimeRef.current, mimeType: actualMime });
      }
    });
  }, []);

  return { isRecording, start, stop, error };
}
