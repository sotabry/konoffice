"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createInitialGameState, labelIntent, resolveAction, type GameState, type Phase } from "@/lib/game";
import {
  phraseAttemptSchema,
  runSpecSchema,
  type Intent,
  type PhraseAttempt,
  type PracticePhrase,
  type RunSpec,
} from "@/lib/schemas";
import { GameCanvas } from "@/components/game-canvas";

type StartRunResponse = {
  run: RunSpec;
  transcript: string;
  usedFallback: boolean;
  warning?: string;
};

type InterpretActionResponse = {
  attempt: PhraseAttempt;
  usedFallback: boolean;
  warning?: string;
};

type RecorderMode = "prompt" | "action";

export function KonofficeApp() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [promptText, setPromptText] = useState(
    "A mushroom designer has to survive an all-day planning ritual about a product nobody understands.",
  );
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<PracticePhrase | null>(null);
  const [typedPhrase, setTypedPhrase] = useState("");
  const [lastAttempt, setLastAttempt] = useState<PhraseAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const recorder = useAudioRecorder();

  useEffect(() => {
    const saved = window.localStorage.getItem("konoffice:lastRun");
    if (!saved) {
      return;
    }
    const parsed = runSpecSchema.safeParse(JSON.parse(saved));
    if (parsed.success) {
      setGame(createInitialGameState(parsed.data));
    }
  }, []);

  const effectivePhase = game?.phase ?? phase;
  const canAct = effectivePhase === "encounter" && !recorder.isRecording && !isPending;
  const context = useMemo(() => {
    if (!game) {
      return "";
    }
    return JSON.stringify({
      room: game.run.floors[game.encounterIndex],
      enemy: {
        name: game.enemy.name,
        flavor: game.enemy.flavor,
        weaknessVisible: game.enemy.revealed,
        weaknessIntent: game.enemy.revealed ? game.enemy.weaknessIntent : "hidden",
      },
      player: {
        hp: game.playerHp,
        shield: game.shield,
        focus: game.focus,
      },
    });
  }, [game]);

  const startRun = useCallback(
    async (audio?: Blob) => {
      setError(null);
      setLastWarning(null);
      setSelectedPhrase(null);
      setTypedPhrase("");
      setLastAttempt(null);
      setPhase("generating");
      setGame(null);

      try {
        const formData = new FormData();
        formData.set("promptText", promptText);
        if (audio) {
          formData.set("audio", audio, "workday.webm");
        }
        const response = await fetch("/api/start-run", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as StartRunResponse;
        const run = runSpecSchema.parse(data.run);
        window.localStorage.setItem("konoffice:lastRun", JSON.stringify(run));
        setGame(createInitialGameState(run));
        setPhase("encounter");
        setLastWarning(data.warning ?? (data.usedFallback ? "Using local fallback run. Add OPENAI_API_KEY for generated runs." : null));
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unable to start the run.";
        setError(message);
        setPhase("error");
      }
    },
    [promptText],
  );

  const resolveAttempt = useCallback(
    (attempt: PhraseAttempt) => {
      setSelectedPhrase(null);
      setTypedPhrase("");
      setLastAttempt(attempt);
      setGame((current) => {
        if (!current) {
          return current;
        }
        const resolved = resolveAction(current, attempt).state;
        if (resolved.phase === "victory") {
          window.localStorage.setItem(
            "konoffice:bestResult",
            JSON.stringify({
              title: resolved.run.runTitle,
              summary: resolved.run.shareSummary,
              completedAt: new Date().toISOString(),
            }),
          );
        }
        return resolved;
      });
    },
    [],
  );

  const submitPhraseAttempt = useCallback(
    async (audio?: Blob, textOverride?: string) => {
      if (!game || !selectedPhrase) {
        return;
      }
      setError(null);
      setLastWarning(null);
      setPhase("interpreting");
      try {
        const formData = new FormData();
        formData.set("intent", selectedPhrase.intent);
        formData.set("targetPhrase", selectedPhrase.text);
        formData.set("successSubtitle", selectedPhrase.successSubtitle);
        formData.set("context", context);
        formData.set("actionText", textOverride ?? typedPhrase);
        if (audio) {
          formData.set("audio", audio, "action.webm");
        }
        const response = await fetch("/api/interpret-action", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as InterpretActionResponse;
        const attempt = phraseAttemptSchema.parse(data.attempt);
        setLastWarning(data.warning ?? null);
        setPhase("encounter");
        startTransition(() => resolveAttempt(attempt));
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Unable to score that phrase.";
        setError(message);
        setPhase("encounter");
      }
    },
    [context, game, resolveAttempt, selectedPhrase, typedPhrase],
  );

  const startRecording = useCallback(
    async (mode: RecorderMode) => {
      setError(null);
      try {
        await recorder.start(async (audio) => {
          if (mode === "prompt") {
            await startRun(audio);
            return;
          }
          await submitPhraseAttempt(audio);
        });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Microphone access failed.";
        setError(message);
      }
    },
    [recorder, startRun, submitPhraseAttempt],
  );

  const selectIntent = useCallback(
    (intent: Intent) => {
      if (!game) {
        return;
      }
      const phrase = choosePhrase(game.run.floors[game.encounterIndex].practicePhrases[intent], game.log.length);
      setSelectedPhrase(phrase);
      setTypedPhrase("");
      setLastAttempt(null);
    },
    [game],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!canAct) {
        return;
      }
      if (event.key.toLowerCase() === "p") {
        selectIntent("push");
      }
      if (event.key.toLowerCase() === "d") {
        selectIntent("deflect");
      }
      if (event.key.toLowerCase() === "a") {
        selectIntent("align");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canAct, selectIntent]);

  return (
    <main className="app-shell">
      <div className="game-frame">
        <section className="stage">
          <div className="canvas-wrap">
            <GameCanvas game={game} />
          </div>
          <div className="top-hud">
            <div className="meter-row">
              <div className="meter">
                HP
                <span>
                  {game?.playerHp ?? 36}/{game?.maxPlayerHp ?? 36}
                </span>
              </div>
              <div className="meter">
                Cover
                <span>{game?.shield ?? 0}</span>
              </div>
              <div className="meter">
                Focus
                <span>{game?.focus ?? 0}</span>
              </div>
            </div>
            <div className="sticker">{phaseLabel(effectivePhase)}</div>
          </div>
          {!game ? (
            <div className="intro-overlay">
              <div className="intro-card">
                <h1>konoffice</h1>
                <p>
                  Corporate language is combat. Describe a workplace nightmare, then survive three
                  meetings by speaking professionally enough to weaponize it.
                </p>
                <div className="prompt-form">
                  <textarea
                    value={promptText}
                    onChange={(event) => setPromptText(event.target.value)}
                    placeholder="Describe the workday dungeon..."
                  />
                  <div className="button-row">
                    <button className="primary-button" disabled={phase === "generating"} onClick={() => startRun()}>
                      {phase === "generating" ? "Generating..." : "Generate Workday"}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={phase === "generating" || recorder.isRecording}
                      onClick={() => (recorder.isRecording ? recorder.stop() : startRecording("prompt"))}
                    >
                      {recorder.isRecording ? "Stop Prompt Mic" : "Speak Prompt"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="side-panel">
          <section className="panel brand-card">
            <h2 className="brand-title">Survive the office.</h2>
            <p className="brand-subtitle">Push, Deflect, or Align your way through a cute corporate dungeon.</p>
          </section>

          {game ? (
            <section className="panel">
              <div className="panel-body">
                <h3 className="section-title">{game.run.runTitle}</h3>
                <div className="run-copy">
                  <span>
                    <strong>{game.run.companyName}</strong> / {game.run.department}
                  </span>
                  <span>{game.run.crisis}</span>
                  <span>
                    Current threat: <strong>{game.enemy.name}</strong>
                  </span>
                </div>
              </div>
            </section>
          ) : null}

          {game && effectivePhase !== "victory" && effectivePhase !== "death" ? (
            <section className="panel">
              <div className="panel-body">
                <h3 className="section-title">Choose Intent</h3>
                <div className="actions-grid">
                  <button className="intent-button" disabled={!canAct} onClick={() => selectIntent("push")}>
                    Push
                    <small>P key</small>
                  </button>
                  <button className="intent-button" disabled={!canAct} onClick={() => selectIntent("deflect")}>
                    Deflect
                    <small>D key</small>
                  </button>
                  <button className="intent-button" disabled={!canAct} onClick={() => selectIntent("align")}>
                    Align
                    <small>A key</small>
                  </button>
                </div>
                <p className="small-copy" style={{ marginTop: 10 }}>
                  Pick a strategy first. The game will give you a workplace English phrase to speak.
                </p>
              </div>
            </section>
          ) : null}

          {game && selectedPhrase && effectivePhase !== "victory" && effectivePhase !== "death" ? (
            <section className="panel">
              <div className="panel-body interpretation">
                <h3 className="section-title">Practice Phrase</h3>
                <span className="intent-pill">{labelIntent(selectedPhrase.intent)}</span>
                <p className="target-phrase">"{selectedPhrase.text}"</p>
                <p className="small-copy">{selectedPhrase.meaning}</p>
                <button
                  className={`voice-button${recorder.isRecording ? " recording" : ""}`}
                  disabled={!canAct && !recorder.isRecording}
                  onClick={() => (recorder.isRecording ? recorder.stop() : startRecording("action"))}
                >
                  {recorder.isRecording ? "Stop Recording" : "Speak Phrase"}
                </button>
                <input
                  className="phrase-input"
                  value={typedPhrase}
                  onChange={(event) => setTypedPhrase(event.target.value)}
                  placeholder="Type the phrase if mic is unavailable"
                />
                <div className="button-row">
                  <button
                    className="primary-button"
                    disabled={!typedPhrase.trim() || !canAct}
                    onClick={() => submitPhraseAttempt(undefined, typedPhrase)}
                  >
                    Submit Typed Phrase
                  </button>
                  <button className="secondary-button" disabled={!canAct} onClick={() => setSelectedPhrase(null)}>
                    Change Intent
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {lastAttempt ? (
            <section className="panel">
              <div className="panel-body interpretation">
                <h3 className="section-title">English Feedback</h3>
                <span className="intent-pill">{lastAttempt.result}</span>
                <p className="small-copy">
                  Target: <strong>{lastAttempt.targetPhrase}</strong>
                </p>
                <p className="small-copy">You said: "{lastAttempt.transcript}"</p>
                <p className="small-copy">
                  Score: {Math.round(lastAttempt.score * 100)}% / Power: {Math.round(lastAttempt.multiplier * 100)}%
                </p>
                <p className="small-copy">{lastAttempt.tip}</p>
              </div>
            </section>
          ) : null}

          {game && (effectivePhase === "victory" || effectivePhase === "death") ? (
            <section className="panel">
              <div className="panel-body">
                <h3 className="section-title">{effectivePhase === "victory" ? "Victory" : "Death by Process"}</h3>
                <p className="small-copy">
                  {effectivePhase === "victory" ? game.run.victoryText : game.run.deathText}
                </p>
                <div className="button-row" style={{ marginTop: 12 }}>
                  <button className="primary-button" onClick={() => startRun()}>
                    New Run
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => navigator.clipboard.writeText(game.run.shareSummary)}
                  >
                    Copy Summary
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {error ? <div className="error-box">{error}</div> : null}
          {lastWarning ? <div className="error-box">{lastWarning}</div> : null}

          {game ? (
            <section className="panel">
              <div className="panel-body">
                <h3 className="section-title">Event Log</h3>
                <div className="event-log">
                  {game.log.map((line, index) => (
                    <div className="log-line" key={`${line}-${index}`}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onCompleteRef = useRef<((audio: Blob) => Promise<void>) | null>(null);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const start = useCallback(async (onComplete: (audio: Blob) => Promise<void>) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not expose microphone recording.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    onCompleteRef.current = onComplete;
    streamRef.current = stream;
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      setIsRecording(false);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      void onCompleteRef.current?.(audio);
    };
    recorder.start();
    setIsRecording(true);
  }, []);

  return { isRecording, start, stop };
}

function phaseLabel(phase: Phase) {
  if (phase === "intro") {
    return "It's literally your job";
  }
  if (phase === "generating") {
    return "Generating agenda";
  }
  if (phase === "interpreting") {
    return "Parsing jargon";
  }
  if (phase === "victory") {
    return "Aligned";
  }
  if (phase === "death") {
    return "Action itemed";
  }
  if (phase === "error") {
    return "Blocked";
  }
  return "In meeting";
}

function choosePhrase(phrases: PracticePhrase[], salt: number) {
  return phrases[salt % phrases.length];
}
