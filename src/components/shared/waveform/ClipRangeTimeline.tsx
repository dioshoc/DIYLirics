import { useCallback, useEffect, useRef, useState } from 'react';

import {
  TIKTOK_CLIP_DURATION_MAX_SEC,
  TIKTOK_CLIP_DURATION_MIN_SEC,
} from '../../../constants/tiktokClip';
import {
  timelineTimeFromClientX,
  usePointerTimelineSeek,
} from '../../../hooks/usePointerTimelineSeek';
import { clampTime } from '../../../utils/time';
import { clampTiktokClipSettings } from '../../../utils/tiktokExportWindow';
import { WaveformBars } from './WaveformBars';
import styles from './ClipRangeTimeline.module.scss';

export type ClipRangeTimelineProps = {
  contentEndSec: number;
  clipStartSec: number;
  clipDurationSec: number;
  playheadSec: number;
  waveformPeaks: number[] | null;
  isWaveformLoading?: boolean;
  clipDurationMinSec?: number;
  clipDurationMaxSec?: number;
  clampClipWindow?: (
    contentEndSec: number,
    clipDurationSec: number,
    clipStartSec: number,
  ) => { clipStartSec: number; clipDurationSec: number };
  onClipWindowChange: (startSec: number, durationSec: number) => void;
  onPlayheadSeek: (timeSec: number) => void;
};

type DragMode = 'move' | 'resize-start' | 'resize-end';

type DragState = {
  mode: DragMode;
  pointerId: number;
  anchorTimeSec: number;
  initialStartSec: number;
  initialDurationSec: number;
};

type BodyPointerState = {
  pointerId: number;
  startClientX: number;
  anchorTimeSec: number;
  initialStartSec: number;
  initialDurationSec: number;
  dragStarted: boolean;
};

const CLIP_BODY_DRAG_THRESHOLD_PX = 4;

const shouldIgnoreSeekTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(
    target.closest('[data-clip-handle]') || target.closest('[data-clip-body]'),
  );
};

export const ClipRangeTimeline = ({
  contentEndSec,
  clipStartSec,
  clipDurationSec,
  playheadSec,
  waveformPeaks,
  isWaveformLoading = false,
  clipDurationMinSec = TIKTOK_CLIP_DURATION_MIN_SEC,
  clipDurationMaxSec = TIKTOK_CLIP_DURATION_MAX_SEC,
  clampClipWindow,
  onClipWindowChange,
  onPlayheadSeek,
}: ClipRangeTimelineProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const bodyPointerRef = useRef<BodyPointerState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const clampWindow =
    clampClipWindow ??
    ((contentEnd, duration, start) =>
      clampTiktokClipSettings(contentEnd, duration, start));

  const { clipStartSec: start, clipDurationSec: duration } = clampWindow(
    contentEndSec,
    clipDurationSec,
    clipStartSec,
  );
  const startPercent = contentEndSec > 0 ? (start / contentEndSec) * 100 : 0;
  const widthPercent = contentEndSec > 0 ? (duration / contentEndSec) * 100 : 100;
  const playheadPercent =
    contentEndSec > 0
      ? clampTime(playheadSec / contentEndSec, 0, 1) * 100
      : 0;
  const dimAfterPercent = Math.max(0, 100 - startPercent - widthPercent);

  const applyWindow = useCallback(
    (nextStart: number, nextDuration: number) => {
      const clamped = clampWindow(contentEndSec, nextDuration, nextStart);
      onClipWindowChange(clamped.clipStartSec, clamped.clipDurationSec);
    },
    [clampWindow, contentEndSec, onClipWindowChange],
  );

  const {
    handleSeekPointerDown,
    handleSeekPointerMove,
    handleSeekPointerEnd,
    handleSeekPointerCancel,
  } = usePointerTimelineSeek(
    trackRef,
    contentEndSec,
    onPlayheadSeek,
    shouldIgnoreSeekTarget,
  );

  const beginDrag = (
    event: React.PointerEvent<HTMLElement>,
    mode: DragMode,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (!trackRef.current) {
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      anchorTimeSec: timelineTimeFromClientX(
        event.clientX,
        rect,
        contentEndSec,
      ),
      initialStartSec: start,
      initialDurationSec: duration,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !trackRef.current) {
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const timeSec = timelineTimeFromClientX(
      event.clientX,
      rect,
      contentEndSec,
    );
    const durationMin = Math.min(clipDurationMinSec, contentEndSec);
    const durationMax = Math.min(clipDurationMaxSec, contentEndSec);

    if (drag.mode === 'move') {
      const delta = timeSec - drag.anchorTimeSec;
      applyWindow(drag.initialStartSec + delta, drag.initialDurationSec);
      return;
    }

    if (drag.mode === 'resize-start') {
      const fixedEnd = drag.initialStartSec + drag.initialDurationSec;
      const nextStart = clampTime(timeSec, 0, fixedEnd - durationMin);
      const nextDuration = clampTime(
        fixedEnd - nextStart,
        durationMin,
        durationMax,
      );
      applyWindow(fixedEnd - nextDuration, nextDuration);
      return;
    }

    const nextDuration = clampTime(
      timeSec - drag.initialStartSec,
      durationMin,
      durationMax,
    );
    applyWindow(drag.initialStartSec, nextDuration);
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleBodyPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (!trackRef.current) {
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    bodyPointerRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      anchorTimeSec: timelineTimeFromClientX(
        event.clientX,
        rect,
        contentEndSec,
      ),
      initialStartSec: start,
      initialDurationSec: duration,
      dragStarted: false,
    };
  };

  const handleBodyPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const body = bodyPointerRef.current;
    if (!body || body.pointerId !== event.pointerId) {
      handlePointerMove(event);
      return;
    }

    if (!body.dragStarted) {
      if (
        Math.abs(event.clientX - body.startClientX) < CLIP_BODY_DRAG_THRESHOLD_PX
      ) {
        return;
      }
      body.dragStarted = true;
      dragRef.current = {
        mode: 'move',
        pointerId: event.pointerId,
        anchorTimeSec: body.anchorTimeSec,
        initialStartSec: body.initialStartSec,
        initialDurationSec: body.initialDurationSec,
      };
      setIsDragging(true);
    }

    handlePointerMove(event);
  };

  const handleBodyPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const body = bodyPointerRef.current;
    if (body && body.pointerId === event.pointerId && !body.dragStarted) {
      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        onPlayheadSeek(
          timelineTimeFromClientX(event.clientX, rect, contentEndSec),
        );
      }
    }

    bodyPointerRef.current = null;
    endDrag(event);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleBodyPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    bodyPointerRef.current = null;
    endDrag(event);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      dragRef.current = null;
      bodyPointerRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging]);

  return (
    <div
      ref={trackRef}
      className={styles.track}
      role="group"
      aria-label="Clip range and seek"
      onPointerDown={handleSeekPointerDown}
      onPointerMove={handleSeekPointerMove}
      onPointerUp={handleSeekPointerEnd}
      onPointerCancel={handleSeekPointerCancel}
    >
      <div className={styles.waveformLayer}>
        <WaveformBars
          peaks={waveformPeaks}
          isLoading={isWaveformLoading}
          dimBeforePercent={startPercent}
          dimAfterPercent={dimAfterPercent}
        />
      </div>
      <div
        className={styles.selection}
        style={{
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
        }}
      >
        <button
          type="button"
          className={styles.handle}
          data-clip-handle="start"
          aria-label="Trim clip start"
          onPointerDown={(event) => beginDrag(event, 'resize-start')}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={(event) => event.stopPropagation()}
        >
          ‹
        </button>
        <div
          className={styles.selectionBody}
          data-clip-body="true"
          role="slider"
          aria-label="Move clip"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, contentEndSec - duration)}
          aria-valuenow={start}
          tabIndex={0}
          onPointerDown={handleBodyPointerDown}
          onPointerMove={handleBodyPointerMove}
          onPointerUp={handleBodyPointerUp}
          onPointerCancel={handleBodyPointerCancel}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 1 : 0.1;
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              applyWindow(start - step, duration);
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              applyWindow(start + step, duration);
            }
          }}
        />
        <button
          type="button"
          className={styles.handle}
          data-clip-handle="end"
          aria-label="Trim clip end"
          onPointerDown={(event) => beginDrag(event, 'resize-end')}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={(event) => event.stopPropagation()}
        >
          ›
        </button>
      </div>
      <div
        className={styles.playhead}
        data-playhead="true"
        style={{ left: `${playheadPercent}%` }}
        aria-hidden
      />
    </div>
  );
};
