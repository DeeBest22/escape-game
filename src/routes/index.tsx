import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Lightbulb, RotateCcw, Undo2 } from "lucide-react";
import { Board } from "@/components/game/Board";
import { Confetti } from "@/components/game/Confetti";
import {
  applyMove,
  generateLevel,
  isSolved,
  solve,
  type Difficulty,
  type Vehicle,
} from "@/lib/puzzle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Escape — Unblock the Red Car Puzzle" },
      {
        name: "description",
        content:
          "Slide the cars to clear a path and drive the red car out. Endless procedurally generated levels across Easy, Medium and Hard.",
      },
      { property: "og:title", content: "Escape — Unblock the Red Car Puzzle" },
      {
        property: "og:description",
        content:
          "Endless sliding car puzzles, freshly generated for every level. Play on phone, tablet or desktop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EscapeGame,
});

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const LABELS: Record<Difficulty, string> = { easy: "EASY", medium: "MEDIUM", hard: "HARD" };
const TONE: Record<Difficulty, string> = {
  easy: "text-easy",
  medium: "text-medium",
  hard: "text-hard",
};
const STORAGE_KEY = "escape:progress";
const HINTS_PER_LEVEL = 2;

function formatTime(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function EscapeGame() {
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [progress, setProgress] = useState<Record<Difficulty, number>>({
    easy: 1,
    medium: 1,
    hard: 1,
  });

  const [level, setLevel] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [optimal, setOptimal] = useState(0);
  const [history, setHistory] = useState<Vehicle[][]>([]);
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(HINTS_PER_LEVEL);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [escaping, setEscaping] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProgress({ easy: 1, medium: 1, hard: 1, ...JSON.parse(raw) });
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  useEffect(() => {
    if (screen !== "game" || won || !vehicles) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [screen, won, vehicles]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const startLevel = useCallback((lvl: number, diff: Difficulty) => {
    setLoading(true);
    setVehicles(null);
    setHistory([]);
    setMoves(0);
    setSeconds(0);
    setHints(HINTS_PER_LEVEL);
    setHintIndex(null);
    setEscaping(false);
    setWon(false);
    setLevel(lvl);
    setDifficulty(diff);
    setScreen("game");
    window.setTimeout(() => {
      const built = generateLevel(lvl, diff);
      setVehicles(built.vehicles);
      setOptimal(built.optimalMoves);
      setLoading(false);
    }, 40);
  }, []);

  const finish = useCallback(
    (diff: Difficulty, lvl: number) => {
      setEscaping(true);
      later(() => setWon(true), 620);
      setProgress((prev) => {
        const next = { ...prev, [diff]: Math.max(prev[diff], lvl + 1) };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore unwritable storage */
        }
        return next;
      });
    },
    [],
  );

  const handleMove = useCallback(
    (index: number, delta: number) => {
      setHintIndex(null);
      setVehicles((prev) => {
        if (!prev) return prev;
        const next = applyMove(prev, index, delta);
        setHistory((h) => [...h, prev]);
        setMoves((m) => m + 1);
        if (isSolved(next)) finish(difficulty, level);
        return next;
      });
    },
    [difficulty, level, finish],
  );

  const undo = () => {
    if (!history.length || escaping) return;
    setVehicles(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
    setHintIndex(null);
  };

  const useHint = () => {
    if (!vehicles || hints <= 0 || escaping) return;
    const { first } = solve(vehicles);
    if (!first) return;
    setHints((h) => h - 1);
    setHintIndex(first.index);
    later(() => handleMove(first.index, first.delta), 700);
  };

  if (screen === "menu") {
    return (
      <Menu
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        progress={progress}
        onPlay={() => startLevel(progress[difficulty], difficulty)}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col px-4 pb-8 pt-5 sm:max-w-[620px]">
      <header className="flex items-center justify-between">
        <button
          onClick={() => setScreen("menu")}
          aria-label="Back to menu"
          className="pill-btn size-12 bg-card text-foreground shadow-lg"
        >
          <ArrowLeft className="size-6" />
        </button>

        <div className="text-center">
          <p className={`text-xs font-bold tracking-[0.25em] ${TONE[difficulty]}`}>
            {LABELS[difficulty]}
          </p>
          <h1 className="text-2xl font-extrabold tracking-wide">Level {level}</h1>
        </div>

        <button
          onClick={() => startLevel(level, difficulty)}
          aria-label="Restart level"
          className="pill-btn size-12 bg-card text-foreground shadow-lg"
        >
          <RotateCcw className="size-6" />
        </button>
      </header>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm font-semibold text-muted-foreground">
        <span>Moves {moves}</span>
        <span>{formatTime(seconds)}</span>
        <span>Best {optimal > 0 ? optimal : "—"}</span>
      </div>

      <div className="relative mt-5 flex flex-1 items-center justify-center">
        <div className="relative w-full">
          {vehicles ? (
            <Board
              vehicles={vehicles}
              onMove={handleMove}
              locked={escaping || won}
              hintIndex={hintIndex}
              escaping={escaping}
            />
          ) : (
            <div className="board-frame">
              <div className="board-surface items-center justify-center">
                <p className="col-span-6 row-span-6 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {loading ? "Building a fresh level…" : ""}
                </p>
              </div>
            </div>
          )}

          {won && (
            <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-background/70 backdrop-blur-[2px]">
              <Confetti />
              <div className="animate-rise text-center">
                <p className="text-gold text-4xl font-extrabold tracking-wider drop-shadow-lg sm:text-5xl">
                  AWESOME!
                </p>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  {moves} moves · {formatTime(seconds)}
                </p>
                <button
                  onClick={() => startLevel(level + 1, difficulty)}
                  className="pill-btn mt-5 bg-primary px-8 py-3 text-lg font-extrabold text-primary-foreground shadow-xl"
                >
                  NEXT LEVEL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-6 flex items-center justify-between">
        <button
          onClick={undo}
          disabled={!history.length || escaping || won}
          aria-label="Undo last move"
          className="pill-btn size-14 bg-primary text-primary-foreground shadow-xl"
        >
          <Undo2 className="size-7" />
        </button>

        <p className="max-w-[55%] text-center text-xs font-semibold text-muted-foreground">
          Drag cars along their lane. Clear the way and drive the red car out.
        </p>

        <button
          onClick={useHint}
          disabled={hints <= 0 || escaping || won || !vehicles}
          aria-label="Use a hint"
          className="pill-btn relative size-14 bg-primary text-primary-foreground shadow-xl"
        >
          <Lightbulb className="size-7" />
          <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-card text-xs font-bold text-foreground">
            {hints}
          </span>
        </button>
      </footer>
    </main>
  );
}

interface MenuProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  progress: Record<Difficulty, number>;
  onPlay: () => void;
}

function Menu({ difficulty, setDifficulty, progress, onPlay }: MenuProps) {
  const index = DIFFICULTIES.indexOf(difficulty);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col items-center px-6 py-10 text-center sm:max-w-[620px]">
      <h1 className="text-5xl font-extrabold tracking-[0.12em] sm:text-6xl">ESCAPE</h1>
      <p className="mt-3 max-w-sm text-sm font-semibold leading-relaxed text-muted-foreground">
        Slide the cars to clear a path and move the red car out of the board!
      </p>

      <div className="mt-8 w-full rounded-3xl bg-card p-6 shadow-2xl">
        <p className={`text-3xl font-extrabold tracking-wide ${TONE[difficulty]}`}>
          {LABELS[difficulty]}
        </p>

        <div className="mt-5 flex gap-2">
          {DIFFICULTIES.map((d, i) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              aria-pressed={d === difficulty}
              className={[
                "pill-btn flex-1 py-3 text-sm font-extrabold tracking-wide",
                d === difficulty
                  ? `bg-secondary ${TONE[d]} ring-2 ring-current`
                  : "bg-secondary/60 text-muted-foreground",
                i <= index ? "" : "",
              ].join(" ")}
            >
              {LABELS[d]}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-semibold text-muted-foreground">
          Every level is generated fresh — the levels are endless.
        </p>

        <button
          onClick={onPlay}
          className="pill-btn mt-6 w-full flex-col bg-easy px-8 py-4 text-2xl font-extrabold text-background shadow-xl"
        >
          PLAY
          <span className="text-sm font-bold opacity-80">Level {progress[difficulty]}</span>
        </button>
      </div>

      <div className="mt-8 grid w-full grid-cols-3 gap-3 text-xs font-semibold text-muted-foreground">
        {DIFFICULTIES.map((d) => (
          <div key={d} className="rounded-2xl bg-card/70 px-3 py-3">
            <p className={`text-sm font-extrabold ${TONE[d]}`}>{LABELS[d]}</p>
            <p className="mt-1">Level {progress[d]}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
