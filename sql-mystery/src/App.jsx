import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles/variables.css";
import "./App.css";

import Header from "./components/Header.jsx";
import DifficultyPicker from "./components/DifficultyPicker.jsx";
import Editor from "./components/Editor.jsx";
import ResultsTable from "./components/ResultsTable.jsx";
import SchemaPanel from "./components/SchemaPanel.jsx";
import HintPanel from "./components/HintPanel.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import SubmitSolution from "./components/SubmitSolution.jsx";
import VictoryScreen from "./components/VictoryScreen.jsx";
import { MYSTERIES } from "./data/mysteries.js";
import { useDatabase } from "./hooks/useDatabase.js";
import { useTimer } from "./hooks/useTimer.js";
import { useSoundEffects } from "./hooks/useSound.js";

const DEFAULT_TAB = "submit";

function formatTimestamp() {
  return new Date().toISOString();
}

function getHistoryStatus(queryResult) {
  if (queryResult?.error) {
    return "error";
  }

  if (queryResult?.empty || !queryResult?.rows?.length) {
    return "empty";
  }

  return "success";
}

export default function App() {
  const { loading, error, runQuery } = useDatabase();
  const sounds = useSoundEffects();

  const [screen, setScreen] = useState("picker");
  const [difficultyId, setDifficultyId] = useState(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [revealedHints, setRevealedHints] = useState(0);
  const [rightTab, setRightTab] = useState(DEFAULT_TAB);
  const [currentScore, setCurrentScore] = useState(null);
  const [showVictory, setShowVictory] = useState(false);
  const [layer1Solved, setLayer1Solved] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Case Open");

  const editorRef = useRef(null);
  const timerStartedRef = useRef(false);

  const difficulty = difficultyId ? MYSTERIES[difficultyId] : null;

  const handleExpire = useCallback(() => {
    setTimerExpired(true);
    setStatusLabel((current) =>
      current === "Case Solved" ? current : "Case Open",
    );
  }, []);

  const timer = useTimer(difficulty?.timeLimit ?? null, handleExpire);

  const startTimerIfNeeded = useCallback(() => {
    if (!timerStartedRef.current && screen === "game") {
      timerStartedRef.current = true;
      timer.start();
    }
  }, [screen, timer]);

  const recordQuery = useCallback((sql, queryResult) => {
    setHistory((previous) => {
      const nextEntry = {
        id: `${Date.now()}-${previous.length}`,
        query: sql,
        status: getHistoryStatus(queryResult),
        timestamp: formatTimestamp(),
      };

      return [...previous, nextEntry].slice(-20);
    });
  }, []);

  const executeQuery = useCallback(
    (sql) => {
      const trimmed = sql.trim();
      if (!trimmed) {
        return;
      }

      startTimerIfNeeded();
      const nextResult = runQuery(trimmed);
      setResult(nextResult);
      recordQuery(trimmed, nextResult);
    },
    [recordQuery, runQuery, startTimerIfNeeded],
  );

  const handleStart = useCallback(
    (nextDifficultyId) => {
      const nextDifficulty = MYSTERIES[nextDifficultyId];
      setDifficultyId(nextDifficultyId);
      setQuery(nextDifficulty.starterQuery);
      setResult(null);
      setHistory([]);
      setRevealedHints(0);
      setRightTab(DEFAULT_TAB);
      setCurrentScore(null);
      setShowVictory(false);
      setLayer1Solved(false);
      setTimerExpired(false);
      setStatusLabel("Case Open");
      setLeftDrawerOpen(false);
      setRightDrawerOpen(false);
      timerStartedRef.current = false;
      timer.reset();
      setScreen("game");
    },
    [timer],
  );

  const handleTablePreview = useCallback(
    (tableName) => {
      const nextQuery = `SELECT * FROM ${tableName} LIMIT 5;`;
      setQuery(nextQuery);
      executeQuery(nextQuery);
    },
    [executeQuery],
  );

  const handleCopyHintQuery = useCallback((hintQuery) => {
    setQuery(hintQuery);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(hintQuery).catch(() => {});
    }
    editorRef.current?.focus();
  }, []);

  const handleRun = useCallback(() => {
    executeQuery(query);
  }, [executeQuery, query]);

  const handleClearEditor = useCallback(() => {
    setQuery("");
    editorRef.current?.focus();
  }, []);

  const handleShowNextHint = useCallback(() => {
    if (!difficulty || revealedHints >= difficulty.hints.length) {
      return;
    }

    if (difficulty.id === "hard" && revealedHints === 0) {
      const confirmed = window.confirm("Use your one hard-mode hint?");
      if (!confirmed) {
        return;
      }
    }

    setRevealedHints((current) =>
      Math.min(current + 1, difficulty.hints.length),
    );
  }, [difficulty, revealedHints]);

  const handleLayer1Solved = useCallback(() => {
    setLayer1Solved(true);
    setStatusLabel("Suspect Found");
    setRightTab("submit");
  }, []);

  const handleLayer2Solved = useCallback(() => {
    timer.stop();
    sounds.playVictory();
    setStatusLabel("Case Solved");
    setShowVictory(true);
  }, [sounds, timer]);

  const handlePlayAgain = useCallback(() => {
    timer.reset();
    timerStartedRef.current = false;
    setScreen("picker");
    setDifficultyId(null);
    setQuery("");
    setResult(null);
    setHistory([]);
    setRevealedHints(0);
    setRightTab(DEFAULT_TAB);
    setCurrentScore(null);
    setShowVictory(false);
    setLayer1Solved(false);
    setTimerExpired(false);
    setStatusLabel("Case Open");
    setHelpOpen(false);
    setLeftDrawerOpen(false);
    setRightDrawerOpen(false);
  }, [timer]);

  const handleViewLeaderboard = useCallback((entry) => {
    setCurrentScore(entry ?? null);
    setRightTab("leaderboard");
    setRightDrawerOpen(true);
    setShowVictory(false);

    requestAnimationFrame(() => {
      document
        .getElementById("leaderboard-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const handleLoadFromHistory = useCallback((sql) => {
    setQuery(sql);
    editorRef.current?.focus();
  }, []);

  useEffect(() => {
    if (screen !== "game") {
      return undefined;
    }

    const handleShortcut = (event) => {
      const withModifier = event.ctrlKey || event.metaKey;

      if (event.key === "?" && !withModifier) {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }

      if (!withModifier) {
        return;
      }

      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        handleShowNextHint();
      }

      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        handleClearEditor();
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        editorRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleClearEditor, handleShowNextHint, screen]);

  const status = useMemo(() => {
    if (statusLabel === "Case Solved") {
      return "Case Solved";
    }

    if (statusLabel === "Suspect Found") {
      return "Suspect Found";
    }

    return timerExpired ? "Time Expired" : "Case Open";
  }, [statusLabel, timerExpired]);

  if (loading) {
    return (
      <div className="app-loading">
        <div>
          <div className="loading-spinner" />
          <p>Loading the in-browser SQLite case files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-loading">
        <div className="panel panel-error">
          <h1>Database failed to load</h1>
          <p>{error}</p>
          <p className="panel-error-note">
            Run `npm run setup` to ensure `public/sql-wasm.wasm` is present.
          </p>
        </div>
      </div>
    );
  }

  if (screen === "picker" || !difficulty) {
    return <DifficultyPicker onStart={handleStart} />;
  }

  return (
    <div className="app-shell">
      <Header
        difficulty={difficulty}
        muted={sounds.muted}
        onShowHelp={() => setHelpOpen(true)}
        onToggleMute={sounds.toggleMute}
        status={status}
        timer={timer}
      />

      <div className="app-grid">
        <aside
          className={`drawer drawer-left ${leftDrawerOpen ? "is-open" : ""}`}
        >
          {!difficulty.hideSchema && (
            <SchemaPanel onTableClick={handleTablePreview} />
          )}
          <HintPanel
            difficulty={difficulty}
            hints={difficulty.hints}
            onCopyQuery={handleCopyHintQuery}
            onShowNextHint={handleShowNextHint}
            revealedCount={revealedHints}
          />
        </aside>

        <main className="workspace">
          {timerExpired && (
            <div className="banner banner-warning">
              The clock hit zero. You can keep exploring the database, but this
              run is out of time.
            </div>
          )}

          {status === "Case Solved" && !showVictory && (
            <div className="banner banner-success">
              Case solved. The leaderboard is open on the right, and you can
              start a fresh investigation any time.
              <button
                className="ghost-button banner-action"
                onClick={handlePlayAgain}
                type="button"
              >
                Play again
              </button>
            </div>
          )}

          <Editor
            onChange={setQuery}
            onClear={handleClearEditor}
            onRun={handleRun}
            playClick={sounds.playClick}
            playRunQuery={sounds.playRunQuery}
            textareaRef={editorRef}
            value={query}
            runQueryFunc={runQuery}
          />

          <ResultsTable result={result} />
        </main>

        <aside
          className={`drawer drawer-right ${rightDrawerOpen ? "is-open" : ""}`}
        >
          <div className="tabs">
            {[
              ["history", "History"],
              ["leaderboard", "Leaderboard"],
              ["submit", "Submit"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`tab-button ${rightTab === id ? "is-active" : ""}`}
                onClick={() => setRightTab(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="tab-panel">
            {rightTab === "history" && (
              <HistoryPanel
                history={history}
                onClear={() => setHistory([])}
                onLoad={handleLoadFromHistory}
              />
            )}

            {rightTab === "leaderboard" && (
              <Leaderboard currentScore={currentScore} />
            )}

            {rightTab === "submit" && (
              <SubmitSolution
                layer1Solved={layer1Solved}
                onLayer1Solved={handleLayer1Solved}
                onLayer2Solved={handleLayer2Solved}
                playSuccess={sounds.playSuccess}
                playWrong={sounds.playWrong}
                solution={difficulty.solution}
              />
            )}
          </div>
        </aside>
      </div>

      <button
        className="mobile-toggle mobile-toggle-left"
        onClick={() => {
          setLeftDrawerOpen((current) => !current);
          setRightDrawerOpen(false);
        }}
        type="button"
      >
        {leftDrawerOpen ? "Close" : "Intel"}
      </button>

      <button
        className="mobile-toggle mobile-toggle-right"
        onClick={() => {
          setRightDrawerOpen((current) => !current);
          setLeftDrawerOpen(false);
        }}
        type="button"
      >
        {rightDrawerOpen ? "Close" : "Panels"}
      </button>

      {helpOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setHelpOpen(false)}
          role="presentation"
        >
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>Keyboard Shortcuts</h2>
            <div className="shortcut-list">
              <div>
                <code>Ctrl+Enter</code>
                <span>Run query</span>
              </div>
              <div>
                <code>Ctrl+H</code>
                <span>Show next hint</span>
              </div>
              <div>
                <code>Ctrl+L</code>
                <span>Clear editor</span>
              </div>
              <div>
                <code>Ctrl+K</code>
                <span>Focus editor</span>
              </div>
              <div>
                <code>?</code>
                <span>Open this help panel</span>
              </div>
            </div>
            <button
              className="secondary-button"
              onClick={() => setHelpOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showVictory && (
        <VictoryScreen
          difficulty={difficulty}
          elapsed={timer.elapsed}
          onPlayAgain={handlePlayAgain}
          onViewLeaderboard={handleViewLeaderboard}
          solution={difficulty.solution}
        />
      )}
    </div>
  );
}
