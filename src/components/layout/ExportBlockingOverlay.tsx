import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import styles from './ExportBlockingOverlay.module.scss';

type ExportBlockingOverlayProps = {
  progressRatio: number;
};

export const ExportBlockingOverlay = ({
  progressRatio,
}: ExportBlockingOverlayProps) => {
  const percent = Math.min(100, Math.max(0, Math.round(progressRatio * 100)));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const appShell = document.querySelector('[data-app-shell]');
    appShell?.setAttribute('inert', '');

    return () => {
      document.body.style.overflow = previousOverflow;
      appShell?.removeAttribute('inert');
    };
  }, []);

  return createPortal(
    <div
      className={styles.overlay}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="export-overlay-title"
      aria-describedby="export-overlay-desc"
    >
      <div className={styles.card}>
        <div className={styles.spinner} aria-hidden />
        <p id="export-overlay-title" className={styles.title}>
          Exporting video
        </p>
        <p id="export-overlay-desc" className={styles.hint}>
          Please wait. Do not close this tab until the download finishes.
        </p>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Export progress"
        >
          <div
            className={styles.progressFill}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className={styles.percent}>{percent}%</p>
      </div>
    </div>,
    document.body,
  );
};
