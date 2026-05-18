import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechRecognitionErrorMessage } from "@/lib/voice";

type SpeechRecognitionAlternative = {
  transcript?: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionErrorLike = {
  error?: string;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("Speech recognition is not supported in this browser.");
    }

    recognitionRef.current?.stop?.();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let latestTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const chunk = event.results[index][0]?.transcript?.trim();

        if (!chunk) continue;

        if (event.results[index].isFinal) {
          finalTranscript = `${finalTranscript} ${chunk}`.trim();
        } else {
          latestTranscript = `${latestTranscript} ${chunk}`.trim();
        }
      }

      const nextTranscript = finalTranscript || latestTranscript;

      if (nextTranscript) {
        setTranscript(nextTranscript);
      }

      if (finalTranscript) {
        recognition.stop();
      }
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setIsListening(false);

      if (event.error === "aborted") {
        return;
      }

      setLastError(getSpeechRecognitionErrorMessage(event.error));
    };

    recognitionRef.current = recognition;
    clearLastError();
    setTranscript("");
    recognition.start();
  }, [clearLastError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    setTranscript,
    lastError,
    clearLastError,
  };
}
