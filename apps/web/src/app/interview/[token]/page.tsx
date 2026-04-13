"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { useProctoringTracker } from "@/hooks/use-proctoring-tracker";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "loading"       // fetching interview info
  | "welcome"       // start screen
  | "starting"      // mic permission + first question fetch
  | "ai-speaking"   // TTS playing current question
  | "listening"     // SpeechRecognition auto-restart loop active
  | "processing"    // waiting for next question from backend
  | "wrapping-up"   // TTS playing closing statement
  | "complete"      // done
  | "error";

type ErrorKind = "browser-unsupported" | "mic-denied" | "network" | "expired";

interface InterviewInfo {
  id: string;
  status: string;
  interviewType: string;
  durationPlanned: number;
  candidateName: string;
  jobTitle: string;
}

interface Turn {
  question: string;
  answer: string;
}

// ─── SpeechRecognition type shim ──────────────────────────────────────────────
// The Web Speech API is not in the default TS lib; we declare just what we use.

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── TTS helper ───────────────────────────────────────────────────────────────

function speakText(text: string, onEnd: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92;
  utt.pitch = 1.0;

  // Pick a natural English voice when available
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang === "en-US" && /google|natural|premium/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en-")) ??
    voices[0];
  if (preferred) utt.voice = preferred;

  utt.onend = onEnd;
  utt.onerror = () => onEnd();
  window.speechSynthesis.speak(utt);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CandidateInterviewPage() {
  const { token } = useParams<{ token: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [info, setInfo] = useState<InterviewInfo | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [turnNumber, setTurnNumber] = useState(0);
  const MAX_TURNS = 7;

  // Refs for auto-restart SpeechRecognition loop
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isDoneRef = useRef(false);
  const accumulatedRef = useRef("");
  const liveTranscriptRef = useRef("");

  // Sync liveTranscript state into ref so onend closure can read latest value
  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  const { proctoringWarning, dismissWarning, getSignals } = useProctoringTracker({
    sessionId: token,
    enabled: phase === "listening" || phase === "processing" || phase === "ai-speaking",
    trackTabSwitches: true,
    trackCopyPaste: false, // voice interview — copy/paste not relevant
    persistToStorage: false,
  });

  // ── Load interview info ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/interview/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setErrorKind(
            json.error?.toLowerCase().includes("expir") ? "expired" : "network"
          );
          setPhase("error");
          return;
        }
        setInfo(json.data);
        setPhase(json.data.status === "started" ? "starting" : "welcome");
      } catch {
        setErrorKind("network");
        setPhase("error");
      }
    }
    load();
  }, [token]);

  // Auto-resume if already started (page refresh during interview)
  useEffect(() => {
    if (phase === "starting") {
      fetchNextQuestion("", []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "starting"]);

  // ── SpeechRecognition loop ─────────────────────────────────────────────────

  const startListeningLoop = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognition();
    if (!SpeechRecognitionAPI) {
      setErrorKind("browser-unsupported");
      setPhase("error");
      return;
    }

    isDoneRef.current = false;
    accumulatedRef.current = "";
    liveTranscriptRef.current = "";
    setLiveTranscript("");

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;   // more reliable than true across browsers
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      // Rebuild text from all results in this recognition session
      let sessionText = "";
      for (let i = 0; i < e.results.length; i++) {
        sessionText += e.results[i][0].transcript;
      }
      const full = (accumulatedRef.current + " " + sessionText).trim();
      liveTranscriptRef.current = full;
      setLiveTranscript(full);
    };

    recognition.onend = () => {
      if (isDoneRef.current) return;
      // Capture whatever was said in this session before restarting
      accumulatedRef.current = liveTranscriptRef.current;
      // Silent restart — candidate paused to think, keep listening
      try {
        recognition.start();
      } catch {
        // Already started or aborted — safe to ignore
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        isDoneRef.current = true;
        setErrorKind("mic-denied");
        setPhase("error");
      }
      // "no-speech", "aborted", "audio-capture" — auto-restart handles these
    };

    recognition.start();
    setPhase("listening");
  }, []);

  const stopListeningLoop = useCallback(() => {
    isDoneRef.current = true;
    try {
      recognitionRef.current?.abort();
    } catch {
      // Safe to ignore
    }
  }, []);

  // ── Core flow ──────────────────────────────────────────────────────────────

  const fetchNextQuestion = useCallback(
    async (answer: string, currentHistory: Turn[]) => {
      setPhase("processing");
      try {
        const res = await fetch(`/api/interview/${token}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer, history: currentHistory }),
        });
        const json = await res.json();

        if (!res.ok) {
          setErrorKind("network");
          setPhase("error");
          return;
        }

        if (json.isComplete) {
          setPhase("wrapping-up");
          speakText(
            "Thank you for completing this interview. Your responses have been recorded and the hiring team will review them shortly. We appreciate your time.",
            () => submitComplete(currentHistory)
          );
        } else {
          setCurrentQuestion(json.nextQuestion);
          setTurnNumber(json.turnNumber);
          setPhase("ai-speaking");
          speakText(json.nextQuestion, () => startListeningLoop());
        }
      } catch {
        setErrorKind("network");
        setPhase("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, startListeningLoop]
  );

  const handleDoneSpeaking = useCallback(() => {
    stopListeningLoop();
    const answer = liveTranscriptRef.current.trim();

    if (!answer) {
      // Nothing captured — restart loop silently
      startListeningLoop();
      return;
    }

    const newHistory: Turn[] = [...history, { question: currentQuestion, answer }];
    setHistory(newHistory);
    setLiveTranscript("");
    fetchNextQuestion(answer, newHistory);
  }, [stopListeningLoop, startListeningLoop, history, currentQuestion, fetchNextQuestion]);

  const submitComplete = useCallback(
    async (finalHistory: Turn[]) => {
      try {
        await fetch(`/api/interview/${token}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: finalHistory,
            clientSignals: getSignals(),
          }),
        });
      } catch {
        // Still show complete screen even if final save fails
      }
      setPhase("complete");
    },
    [token, getSignals]
  );

  const handleStart = useCallback(async () => {
    // Check browser support before doing anything
    if (!getSpeechRecognition()) {
      setErrorKind("browser-unsupported");
      setPhase("error");
      return;
    }

    setPhase("starting");
    try {
      await fetch(`/api/interview/${token}/start`, { method: "POST" });
    } catch {
      // Non-fatal — start route is idempotent
    }
    await fetchNextQuestion("", []);
  }, [token, fetchNextQuestion]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-sm text-surface-500">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-surface-800">
              {errorKind === "browser-unsupported"
                ? "Browser Not Supported"
                : errorKind === "mic-denied"
                ? "Microphone Access Required"
                : errorKind === "expired"
                ? "Interview Unavailable"
                : "Something Went Wrong"}
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              {errorKind === "browser-unsupported"
                ? "This interview requires voice capabilities. Please open this link in Google Chrome or Microsoft Edge."
                : errorKind === "mic-denied"
                ? "Please allow microphone access in your browser settings and reload the page to continue."
                : errorKind === "expired"
                ? "This interview link has expired or is no longer available."
                : "A network error occurred. Please check your connection and try reloading."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "welcome" && info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-6 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
              <Bot className="h-8 w-8 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-surface-800">AI Voice Interview</h1>
              <p className="mt-1 text-sm text-surface-500">{info.jobTitle}</p>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-sm text-surface-600">
                Hello <span className="font-medium">{info.candidateName}</span>, welcome to your
                AI-powered interview.
              </p>
              <p className="text-sm text-surface-500">
                The AI will ask you questions out loud. Speak your answers naturally — take your
                time, pause to think, and click{" "}
                <span className="font-medium text-surface-700">"Done Speaking"</span> when you have
                finished each answer.
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-surface-500">
              <span className="flex items-center gap-1.5">
                <Mic className="h-4 w-4" />
                Voice-based
              </span>
              <span className="flex items-center gap-1.5">
                <Bot className="h-4 w-4" />~{MAX_TURNS} questions
              </span>
              <span className="flex items-center gap-1.5">
                <Volume2 className="h-4 w-4" />
                ~{info.durationPlanned} min
              </span>
            </div>

            <div className="rounded-lg bg-surface-100 px-4 py-3 text-left text-xs text-surface-600">
              <p className="font-medium">Before you begin</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>Find a quiet space with minimal background noise</li>
                <li>Allow microphone access when prompted</li>
                <li>Ensure your speakers or headphones are on</li>
              </ul>
            </div>

            <Button onClick={handleStart} size="lg" className="w-full gap-2">
              <Mic className="h-4 w-4" />
              Start Voice Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-surface-800">Interview Complete</h2>
            <p className="mt-2 text-sm text-surface-500">
              Thank you for completing the interview. Your responses have been recorded and
              will be evaluated by our AI system.
            </p>
            <p className="mt-4 text-xs text-surface-400">
              The hiring team will review your results and be in touch soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Call interface (ai-speaking | listening | processing | starting | wrapping-up) ──

  const isAiSpeaking = phase === "ai-speaking" || phase === "wrapping-up";
  const isListening = phase === "listening";
  const isProcessing = phase === "processing" || phase === "starting";

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      {/* Proctoring warning */}
      {proctoringWarning && (
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
          <p className="text-xs font-medium text-amber-800 sm:text-sm">{proctoringWarning}</p>
          <button
            onClick={dismissWarning}
            className="shrink-0 text-lg font-bold leading-none text-amber-600 hover:text-amber-800"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-500" />
          <span className="text-sm font-medium text-surface-700">AI Voice Interview</span>
        </div>
        {info && (
          <span className="text-xs text-surface-400">
            {info.jobTitle}
          </span>
        )}
        <span className="text-xs font-medium text-surface-500">
          Question {Math.min(turnNumber, MAX_TURNS)} of {MAX_TURNS}
        </span>
      </div>

      {/* Main call area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10">

        {/* Avatar with pulsing rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse — only visible when AI is speaking */}
          <span
            className={cn(
              "absolute h-36 w-36 rounded-full bg-brand-400/20 transition-all duration-700",
              isAiSpeaking ? "animate-ping" : "opacity-0"
            )}
          />
          {/* Mid ring */}
          <span
            className={cn(
              "absolute h-28 w-28 rounded-full bg-brand-400/30 transition-all duration-500",
              isAiSpeaking ? "animate-pulse" : "opacity-0"
            )}
          />
          {/* Avatar circle */}
          <div
            className={cn(
              "relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
              isAiSpeaking
                ? "bg-brand-500 shadow-lg shadow-brand-500/40"
                : isListening
                ? "bg-surface-300"
                : "bg-surface-200"
            )}
          >
            <Bot
              className={cn(
                "h-9 w-9 transition-colors duration-300",
                isAiSpeaking ? "text-white" : "text-surface-500"
              )}
            />
          </div>
        </div>

        {/* Status label */}
        <div className="flex flex-col items-center gap-1 text-center">
          {isAiSpeaking && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-brand-600">
              <Volume2 className="h-4 w-4 animate-pulse" />
              AI is speaking...
            </span>
          )}
          {isListening && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <Mic className="h-4 w-4 animate-pulse" />
              Listening...
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1.5 text-sm text-surface-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI is thinking...
            </span>
          )}
        </div>

        {/* Current question text */}
        {currentQuestion && (
          <div className="w-full max-w-xl rounded-2xl bg-white px-6 py-4 shadow-sm border border-surface-200">
            <p className="text-center text-sm font-medium leading-relaxed text-surface-800">
              {currentQuestion}
            </p>
          </div>
        )}

        {/* Live transcript — only shown while listening */}
        {isListening && (
          <div className="w-full max-w-xl">
            <div className="min-h-[80px] rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              {liveTranscript ? (
                <p className="text-sm leading-relaxed text-surface-700">{liveTranscript}</p>
              ) : (
                <p className="text-sm text-surface-400 italic">
                  Start speaking — your words will appear here...
                </p>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-surface-400">
              Listening restarts automatically if you pause to think.
            </p>
          </div>
        )}

        {/* Done Speaking button */}
        {isListening && (
          <Button
            onClick={handleDoneSpeaking}
            size="lg"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 px-8"
          >
            <MicOff className="h-4 w-4" />
            Done Speaking
          </Button>
        )}
      </div>
    </div>
  );
}
