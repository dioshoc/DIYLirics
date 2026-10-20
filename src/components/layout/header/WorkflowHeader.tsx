import { useMemo, useState } from 'react';

import { useSessionStore } from '../../../store/sessionStore';
import type { AppTab } from '../../../types/session';
import { buildLyricsProject } from '../../../utils/exportProject';
import { resolveVideoBackground } from '../../../utils/videoBackground';
import { exportAndDownloadLyricVideo } from '../../../utils/videoExport/exportLyricVideo';
import { getVideoExportBlockers } from '../../../utils/videoExport/exportReadiness';
import {
  WORKFLOW_TAB_ORDER,
  canNavigateToTab,
  getAdvanceStepBlockers,
  getStepAccessBlockers,
  isWorkflowStepComplete,
} from '../../../utils/workflowReadiness';
import diyliricsLogo from '../../../assets/diylirics-logo.webp';
import panel from '../../shared/panel/Panel.module.scss';
import { ConfirmDialog } from '../confirm/ConfirmDialog';
import { ExportBlockingOverlay } from '../export/ExportBlockingOverlay';
import { resetApplicationSession } from '../../../storage/sessionPersistence';
import styles from './WorkflowHeader.module.scss';

const STEP_LABELS: Record<AppTab, string> = {
  options: 'Options',
  liricks: 'Liricks',
  videomaker: 'Videomaker',
};

const NEXT_TAB: Partial<Record<AppTab, AppTab>> = {
  options: 'liricks',
  liricks: 'videomaker',
};

export const WorkflowHeader = () => {
  const activeTab = useSessionStore((s) => s.activeTab);
  const setActiveTab = useSessionStore((s) => s.setActiveTab);
  const track = useSessionStore((s) => s.track);
  const lines = useSessionStore((s) => s.lines);
  const lyricsEndTimeSec = useSessionStore((s) => s.lyricsEndTimeSec);
  const videoSettings = useSessionStore((s) => s.videoSettings);
  const requestPlaybackPause = useSessionStore((s) => s.requestPlaybackPause);

  const [showExportOverlay, setShowExportOverlay] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);
  const [exportFinished, setExportFinished] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInProgress, setResetInProgress] = useState(false);

  const nextTab = NEXT_TAB[activeTab];

  const exportBlockers = useMemo(
    () => getVideoExportBlockers(track, lines, videoSettings),
    [track, lines, videoSettings],
  );

  const advanceBlockers = useMemo(
    () => getAdvanceStepBlockers(activeTab, track, lines),
    [activeTab, track, lines],
  );

  const handleStepClick = (tab: AppTab) => {
    if (!canNavigateToTab(tab, activeTab, track, lines)) {
      return;
    }
    setActiveTab(tab);
  };

  const handleNextClick = () => {
    if (!nextTab || advanceBlockers.length > 0) {
      return;
    }
    setActiveTab(nextTab);
  };

  const handleCloseExportOverlay = () => {
    setShowExportOverlay(false);
    setExportFinished(false);
    setExportProgress(0);
  };

  const handleDownloadClick = async () => {
    if (exportInProgress || exportBlockers.length > 0) {
      return;
    }

    requestPlaybackPause();

    setExportError(null);
    setShowExportOverlay(true);
    setExportInProgress(true);
    setExportFinished(false);
    setExportProgress(0);

    const project = buildLyricsProject(track, lines, lyricsEndTimeSec);
    const background = resolveVideoBackground(track, videoSettings);

    try {
      await exportAndDownloadLyricVideo(
        {
          track,
          project,
          videoSettings,
          background,
          lyricsEndTimeSec,
        },
        (progress) => {
          setExportProgress(progress.ratio);
        },
      );
      setExportProgress(1);
      setExportFinished(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Video export failed.';
      setExportError(message);
      setShowExportOverlay(false);
      setExportProgress(0);
    } finally {
      setExportInProgress(false);
    }
  };

  const handleOpenResetConfirm = () => {
    if (exportInProgress || resetInProgress) {
      return;
    }
    setShowResetConfirm(true);
  };

  const handleCloseResetConfirm = () => {
    if (resetInProgress) {
      return;
    }
    setShowResetConfirm(false);
  };

  const handleConfirmReset = async () => {
    if (resetInProgress) {
      return;
    }

    requestPlaybackPause();
    setResetInProgress(true);

    try {
      await resetApplicationSession();
      setExportError(null);
      setShowResetConfirm(false);
    } finally {
      setResetInProgress(false);
    }
  };

  const nextLabel = nextTab ? `Next: ${STEP_LABELS[nextTab]}` : null;
  const exportPercent = Math.round(exportProgress * 100);

  return (
    <>
      {showResetConfirm ? (
        <ConfirmDialog
          title="Reset session?"
          description="This clears audio, lyrics, cover art, video settings, and saved files in this browser. You cannot undo this."
          confirmLabel={resetInProgress ? 'Resetting…' : 'Reset session'}
          cancelLabel="Cancel"
          isConfirmBusy={resetInProgress}
          onConfirm={() => {
            void handleConfirmReset();
          }}
          onCancel={handleCloseResetConfirm}
        />
      ) : null}
      {showExportOverlay ? (
        <ExportBlockingOverlay
          progressRatio={exportProgress}
          isComplete={exportFinished}
          onClose={handleCloseExportOverlay}
        />
      ) : null}
    <header
      className={styles.header}
      aria-label="Workflow"
      aria-hidden={showExportOverlay || showResetConfirm}
    >
      <h1 className={styles.brand}>
        <img
          className={styles.brandLogo}
          src={diyliricsLogo}
          alt="DIY Lirics"
          width={700}
          height={233}
          decoding="async"
        />
      </h1>
      <ol className={styles.steps}>
        {WORKFLOW_TAB_ORDER.map((tab, index) => {
          const isStepAccessible = canNavigateToTab(
            tab,
            activeTab,
            track,
            lines,
          );
          const stepBlocker = !isStepAccessible
            ? getStepAccessBlockers(tab, track, lines).join(' ')
            : undefined;

          return (
          <li key={tab} className={styles.stepItem}>
            <button
              type="button"
              className={styles.stepButton}
              data-active={activeTab === tab}
              data-complete={isWorkflowStepComplete(tab, track, lines)}
              data-disabled={!isStepAccessible}
              disabled={!isStepAccessible}
              aria-current={activeTab === tab ? 'step' : undefined}
              title={stepBlocker}
              onClick={() => handleStepClick(tab)}
            >
              <span className={styles.stepIndex}>{index + 1}</span>
              <span className={styles.stepLabel}>{STEP_LABELS[tab]}</span>
            </button>
            {index < WORKFLOW_TAB_ORDER.length - 1 ? (
              <span className={styles.stepDivider} aria-hidden />
            ) : null}
          </li>
          );
        })}
      </ol>

      <div className={styles.actions}>
        {exportError ? (
          <p className={styles.exportError} role="alert">{exportError}</p>
        ) : null}
        <button
          type="button"
          className={panel.button}
          disabled={exportInProgress || resetInProgress}
          onClick={handleOpenResetConfirm}
        >
          Reset session
        </button>
        {activeTab === 'videomaker' ? (
          <button
            type="button"
            className={panel.button}
            data-variant="primary"
            disabled={exportInProgress || exportBlockers.length > 0}
            aria-busy={exportInProgress}
            title={exportBlockers.join(' ')}
            onClick={() => {
              void handleDownloadClick();
            }}
          >
            {exportInProgress ? `Exporting… ${exportPercent}%` : 'Download video'}
          </button>
        ) : (
          <button
            type="button"
            className={panel.button}
            data-variant="primary"
            disabled={advanceBlockers.length > 0}
            title={advanceBlockers.join(' ')}
            onClick={handleNextClick}
          >
            {nextLabel}
          </button>
        )}
      </div>
    </header>
    </>
  );
};
