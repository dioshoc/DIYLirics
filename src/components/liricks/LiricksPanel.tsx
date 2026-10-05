import { useEffect, useMemo, useRef, useState } from 'react';

import {
  END_LYRICS_LABEL,
  END_LYRICS_ROW_ID,
} from '../../constants/lyricsEndMarker';
import { useSessionStore } from '../../store/sessionStore';
import { buildLyricsProject, downloadJson } from '../../utils/exportProject';
import { parseLyricsProjectJson } from '../../utils/importLyricsProject';
import { parseLyricsText } from '../../utils/lyrics';
import { formatTimeSec } from '../../utils/time';
import panel from '../shared/Panel.module.scss';
import { AudioPlayer } from './AudioPlayer';
import { LineTimeNudge } from './LineTimeNudge';
import styles from './LiricksPanel.module.scss';

export const LiricksPanel = () => {
  const track = useSessionStore((s) => s.track);
  const lyricsRawText = useSessionStore((s) => s.lyricsRawText);
  const lines = useSessionStore((s) => s.lines);
  const syncCursor = useSessionStore((s) => s.syncCursor);
  const lyricsEndTimeSec = useSessionStore((s) => s.lyricsEndTimeSec);
  const setLyricsRawText = useSessionStore((s) => s.setLyricsRawText);
  const setLines = useSessionStore((s) => s.setLines);
  const setDurationSec = useSessionStore((s) => s.setDurationSec);
  const markCurrentLine = useSessionStore((s) => s.markCurrentLine);
  const goToPreviousSyncLine = useSessionStore((s) => s.goToPreviousSyncLine);
  const nudgeLineTime = useSessionStore((s) => s.nudgeLineTime);
  const nudgeLyricsEndTime = useSessionStore((s) => s.nudgeLyricsEndTime);
  const setSyncCursor = useSessionStore((s) => s.setSyncCursor);
  const importLyricsProject = useSessionStore((s) => s.importLyricsProject);

  const audioRef = useRef<HTMLAudioElement>(null);
  const linesListRef = useRef<HTMLUListElement>(null);
  const jsonImportInputRef = useRef<HTMLInputElement>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const project = useMemo(
    () => buildLyricsProject(track, lines, lyricsEndTimeSec),
    [track, lines, lyricsEndTimeSec],
  );

  const unsyncedCount = lines.filter((l) => l.startTimeSec === null).length;
  const isEndCursor = lines.length > 0 && syncCursor >= lines.length;
  const currentLine = isEndCursor ? null : lines[syncCursor];
  const syncTotal = lines.length + 1;

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLyricsRawText(event.target.value);
  };

  const handleSplitLines = () => {
    setLines(parseLyricsText(lyricsRawText));
  };

  const handleMark = () => {
    const time = audioRef.current?.currentTime ?? 0;
    markCurrentLine(time);
  };

  const handleLineClick = (index: number, startTimeSec: number | null) => {
    setSyncCursor(index);
    if (startTimeSec === null || !audioRef.current) {
      return;
    }
    audioRef.current.currentTime = startTimeSec;
  };

  const handleEndLyricsClick = () => {
    setSyncCursor(lines.length);
    if (lyricsEndTimeSec === null || !audioRef.current) {
      return;
    }
    audioRef.current.currentTime = lyricsEndTimeSec;
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(project, null, 2));
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Copy failed');
    }
  };

  const handleDownloadJson = () => {
    const base = track.title.trim() || 'lyrics';
    downloadJson(project, `${base}-sync.json`);
  };

  const handleImportJsonClick = () => {
    jsonImportInputRef.current?.click();
  };

  const handleImportJsonChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const result = parseLyricsProjectJson(raw);

      if (!result.ok) {
        setImportStatus(result.message);
        return;
      }

      importLyricsProject(result.project);
      setImportStatus('Imported');
      setJsonOpen(true);
    } catch {
      setImportStatus('Import failed');
    }
  };

  useEffect(() => {
    const activeId = isEndCursor
      ? END_LYRICS_ROW_ID
      : lines[syncCursor]?.id;
    if (!activeId) {
      return;
    }

    const list = linesListRef.current;
    if (!list) {
      return;
    }

    const activeEl = list.querySelector<HTMLElement>(
      `[data-line-id="${activeId}"]`,
    );
    if (!activeEl) {
      return;
    }

    activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [syncCursor, lines, isEndCursor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        const audio = audioRef.current;
        if (!audio) {
          return;
        }
        if (audio.paused) {
          void audio.play();
        } else {
          audio.pause();
        }
      }

      if (event.key === 'm' || event.key === 'M' || event.key === 'Enter') {
        if (lines.length === 0) {
          return;
        }
        event.preventDefault();
        handleMark();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!track.audioObjectUrl) {
    return (
      <section className={panel.panel}>
        <h2 className={panel.title}>Liricks</h2>
        <p className={panel.warning}>
          Upload audio in Options first.
        </p>
      </section>
    );
  }

  const showSyncDock = lines.length > 0;

  return (
    <section className={styles.panel} aria-labelledby="liricks-heading">
      <div className={styles.scrollArea}>

        <div className={styles.topRow}>

              <h3 className={styles.linesTitle}>Lines</h3>
        <textarea
          id="lyrics-text"
          className={panel.textarea}
          value={lyricsRawText}
          placeholder="Paste lyrics — one line per row"
          onChange={handleTextChange}
        />
        <div className={panel.buttonRow}>
          <button
            type="button"
            className={panel.button}
            data-variant="primary"
            onClick={handleSplitLines}
          >
            Split into lines
          </button>
        </div>
        </div>

        {lines.length === 0 ? (
          <p className={panel.hint}>
            Split lyrics into lines to start syncing.
          </p>
        ) : (
          <div className={styles.workspace}>
            <div className={styles.linesColumn}>
            <div className={styles.linesHeader}>
              <h3 className={styles.linesTitle}>Lines</h3>
              {unsyncedCount > 0 && (
                <span className={panel.hint}>
                  Without timestamp: {unsyncedCount}
                </span>
              )}
            </div>
            <ul
              ref={linesListRef}
              className={styles.linesList}
              aria-label="Lyrics lines"
            >
              {lines.map((line, index) => (
                <li key={line.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={styles.lineItem}
                    data-line-id={line.id}
                    data-active={index === syncCursor}
                    data-synced={line.startTimeSec !== null}
                    aria-label={`Line ${index + 1}`}
                    onClick={() =>
                      handleLineClick(index, line.startTimeSec)
                    }
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') {
                        return;
                      }
                      event.preventDefault();
                      handleLineClick(index, line.startTimeSec);
                    }}
                  >
                    <div
                      className={styles.timeCell}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      role="presentation"
                    >
                      <span className={styles.timeValue}>
                        {formatTimeSec(line.startTimeSec)}
                      </span>
                      <LineTimeNudge
                        disabled={line.startTimeSec === null}
                        onNudge={(delta) => nudgeLineTime(line.id, delta)}
                      />
                    </div>
                    <span className={styles.lineText}>{line.text}</span>
                  </div>
                </li>
              ))}
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  className={styles.lineItem}
                  data-line-id={END_LYRICS_ROW_ID}
                  data-active={isEndCursor}
                  data-synced={lyricsEndTimeSec !== null}
                  data-variant="end-marker"
                  aria-label={END_LYRICS_LABEL}
                  onClick={handleEndLyricsClick}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                      return;
                    }
                    event.preventDefault();
                    handleEndLyricsClick();
                  }}
                >
                  <div
                    className={styles.timeCell}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    role="presentation"
                  >
                    <span className={styles.timeValue}>
                      {formatTimeSec(lyricsEndTimeSec)}
                    </span>
                    <LineTimeNudge
                      disabled={lyricsEndTimeSec === null}
                      onNudge={nudgeLyricsEndTime}
                    />
                  </div>
                  <span className={styles.lineText}>{END_LYRICS_LABEL}</span>
                </div>
              </li>
            </ul>
            </div>
          </div>
        )}

        <div className={styles.jsonBlock}>
        <div className={panel.buttonRow}>
          <button
            type="button"
            className={panel.button}
            onClick={() => setJsonOpen((open) => !open)}
          >
            {jsonOpen ? 'Hide JSON' : 'Show JSON'}
          </button>
          <button
            type="button"
            className={panel.button}
            data-variant="primary"
            onClick={handleCopyJson}
          >
            Copy JSON
          </button>
          <button
            type="button"
            className={panel.button}
            onClick={handleDownloadJson}
          >
            Download .json
          </button>
          <button
            type="button"
            className={panel.button}
            onClick={handleImportJsonClick}
          >
            Import .json
          </button>
          <input
            ref={jsonImportInputRef}
            className={styles.hiddenFileInput}
            type="file"
            accept="application/json,.json"
            aria-hidden
            tabIndex={-1}
            onChange={handleImportJsonChange}
          />
          {copyStatus && <span className={panel.hint}>{copyStatus}</span>}
          {importStatus && <span className={panel.hint}>{importStatus}</span>}
        </div>
        {jsonOpen && (
          <pre className={styles.jsonPre}>
            {JSON.stringify(project, null, 2)}
          </pre>
        )}
        </div>
      </div>

      <footer
        className={styles.bottomDock}
        aria-label="Player and timing marks"
      >
        {showSyncDock && (
          <div className={styles.syncBar}>
            <div className={styles.syncMeta}>
              <span className={styles.syncIndex}>
                {isEndCursor
                  ? END_LYRICS_LABEL
                  : `Line ${syncCursor + 1} / ${syncTotal}`}
              </span>
              <p
                className={styles.syncLinePreview}
                title={isEndCursor ? END_LYRICS_LABEL : currentLine?.text}
              >
                {isEndCursor ? END_LYRICS_LABEL : (currentLine?.text ?? '—')}
              </p>
            </div>
            <div className={styles.syncActions}>
              <button
                type="button"
                className={styles.syncButton}
                aria-label="Previous line (up in list)"
                disabled={syncCursor <= 0}
                onClick={goToPreviousSyncLine}
              >
                ▲
              </button>
              <button
                type="button"
                className={styles.markButton}
                aria-label={
                  isEndCursor ? 'Mark end lyrics time' : 'Mark current line time'
                }
                onClick={handleMark}
              >
                Mark
              </button>
              <button
                type="button"
                className={styles.syncButton}
                aria-label="Next line (down in list, no mark)"
                disabled={syncCursor >= lines.length}
                onClick={() => setSyncCursor(syncCursor + 1)}
              >
                ▼
              </button>
            </div>
          </div>
        )}
        <AudioPlayer
          src={track.audioObjectUrl}
          audioRefExternal={audioRef}
          onDuration={setDurationSec}
          embedded
        />
      </footer>
    </section>
  );
};
