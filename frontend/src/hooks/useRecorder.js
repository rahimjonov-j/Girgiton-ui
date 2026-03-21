import { useCallback, useRef, useState } from 'react';

export function useRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const start = useCallback(async () => {
    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferredTypes = [
      'audio/ogg;codecs=opus',
      'audio/webm;codecs=opus',
      'audio/webm'
    ];
    const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

    const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    startTimeRef.current = Date.now();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  }, []);

  const stop = useCallback(async () => {
    if (!mediaRecorderRef.current) {
      return null;
    }
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setIsRecording(false);
        mediaRecorderRef.current = null;
        resolve({ blob, durationMs, mimeType: recorder.mimeType });
      };
      recorder.stop();
    });
  }, []);

  return { isRecording, start, stop, error };
}
