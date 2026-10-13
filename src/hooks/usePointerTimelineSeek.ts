import { useCallback, useRef, type RefObject } from 'react';

import { clampTime } from '../utils/time';

export const timelineTimeFromClientX = (
  clientX: number,
  rect: DOMRect,
  durationSec: number,
): number => {
  if (rect.width <= 0 || durationSec <= 0) {
    return 0;
  }
  const ratio = clampTime((clientX - rect.left) / rect.width, 0, 1);
  return ratio * durationSec;
};

export const usePointerTimelineSeek = (
  trackRef: RefObject<HTMLDivElement | null>,
  durationSec: number,
  onSeek: (timeSec: number) => void,
  shouldIgnoreTarget?: (target: EventTarget | null) => boolean,
) => {
  const seekPointerIdRef = useRef<number | null>(null);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const element = trackRef.current;
      if (!element || durationSec <= 0) {
        return;
      }
      const rect = element.getBoundingClientRect();
      onSeek(timelineTimeFromClientX(clientX, rect, durationSec));
    },
    [durationSec, onSeek, trackRef],
  );

  const handleSeekPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      if (shouldIgnoreTarget?.(event.target)) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      seekPointerIdRef.current = event.pointerId;
      seekFromClientX(event.clientX);
    },
    [seekFromClientX, shouldIgnoreTarget],
  );

  const handleSeekPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (seekPointerIdRef.current !== event.pointerId) {
        return;
      }
      seekFromClientX(event.clientX);
    },
    [seekFromClientX],
  );

  const handleSeekPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (seekPointerIdRef.current !== event.pointerId) {
        return;
      }
      seekPointerIdRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  return {
    handleSeekPointerDown,
    handleSeekPointerMove,
    handleSeekPointerEnd,
    handleSeekPointerCancel: handleSeekPointerEnd,
    isSeekPointerActive: () => seekPointerIdRef.current !== null,
  };
};
