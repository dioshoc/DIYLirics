import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import panel from '../../shared/panel/Panel.module.scss';
import styles from './ConfirmDialog.module.scss';

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isConfirmBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({
  title,
  description,
  confirmLabel,
  cancelLabel,
  isConfirmBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
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
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isConfirmBusy) {
        return;
      }
      onCancel();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isConfirmBusy, onCancel]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || isConfirmBusy) {
      return;
    }
    onCancel();
  };

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className={styles.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <h2 id="confirm-dialog-title" className={styles.title}>
          {title}
        </h2>
        <p id="confirm-dialog-desc" className={styles.description}>
          {description}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={panel.button}
            disabled={isConfirmBusy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={panel.button}
            data-variant="danger"
            disabled={isConfirmBusy}
            aria-busy={isConfirmBusy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
