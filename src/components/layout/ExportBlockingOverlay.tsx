import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import bandLinkQr from '../../assets/band-link-qr.png';
import boostyDonateQr from '../../assets/boosty-donate-qr.png';
import {
  BAND_LINK_URL,
  BOOSTY_DONATE_URL,
} from '../../constants/projectSupport';
import panel from '../shared/Panel.module.scss';
import styles from './ExportBlockingOverlay.module.scss';

type ExportBlockingOverlayProps = {
  progressRatio: number;
  isComplete: boolean;
  onClose: () => void;
};

export const ExportBlockingOverlay = ({
  progressRatio,
  isComplete,
  onClose,
}: ExportBlockingOverlayProps) => {
  const percent = Math.min(
    100,
    Math.max(0, Math.round((isComplete ? 1 : progressRatio) * 100)),
  );

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

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isComplete, onClose]);

  return createPortal(
    <div
      className={styles.overlay}
      data-complete={isComplete}
      role="alertdialog"
      aria-modal="true"
      aria-busy={!isComplete}
      aria-labelledby="export-overlay-title"
      aria-describedby="export-overlay-desc"
    >
      <div className={styles.card}>
        {isComplete ? (
          <button
            type="button"
            className={styles.dismissButton}
            aria-label="Close"
            onClick={onClose}
          >
            <span className={styles.dismissIcon} aria-hidden>×</span>
          </button>
        ) : null}
        {isComplete ? (
          <div className={styles.doneMark} aria-hidden>✓</div>
        ) : (
          <div className={styles.spinner} aria-hidden />
        )}
        <p id="export-overlay-title" className={styles.title}>
          {isComplete ? 'Download ready' : 'Exporting video'}
        </p>
        <p id="export-overlay-desc" className={styles.hint}>
          {isComplete
            ? 'Your video should be in your downloads folder. Close this window when you are done.'
            : 'Please wait. Do not close this tab until the download finishes.'}
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

        <div className={styles.supportSection}>
          <p className={styles.supportIntro}>
            If DIY Lirics helps you, consider supporting the project.
          </p>
          <div className={styles.supportGrid}>
            <article
              className={styles.supportCard}
              aria-labelledby="export-boosty-title"
            >
              <img
                className={styles.supportQr}
                src={boostyDonateQr}
                alt="QR code linking to Boosty donation page"
                width={150}
                height={150}
                decoding="async"
              />
              <h2 id="export-boosty-title" className={styles.supportCardTitle}>
                Boosty
              </h2>
              <p className={styles.supportCardHint}>
                Scan or tap to donate while the export runs.
              </p>
              <a
                className={panel.button}
                data-variant="primary"
                href={BOOSTY_DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Support on Boosty
              </a>
            </article>

            <article
              className={styles.supportCard}
              aria-labelledby="export-band-title"
            >
              <img
                className={styles.supportQr}
                src={bandLinkQr}
                alt="QR code linking to Band.link page"
                width={150}
                height={150}
                decoding="async"
              />
              <h2 id="export-band-title" className={styles.supportCardTitle}>
                Band.link
              </h2>
              <p className={styles.supportCardHint}>
                Music by 4.3.11 — links to streaming platforms.
              </p>
              <a
                className={panel.button}
                href={BAND_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Band.link
              </a>
            </article>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
