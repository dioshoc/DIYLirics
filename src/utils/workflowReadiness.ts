import type { AppTab, LyricLine, TrackMeta } from '../types/session';

export const WORKFLOW_TAB_ORDER: AppTab[] = ['options', 'liricks', 'videomaker'];

export const isOptionsStepComplete = (track: TrackMeta): boolean =>
  Boolean(track.audioObjectUrl);

export const isLiricksStepComplete = (lines: LyricLine[]): boolean =>
  lines.some((line) => line.startTimeSec !== null);

export const getMaxAccessibleStepIndex = (
  track: TrackMeta,
  lines: LyricLine[],
): number => {
  if (!isOptionsStepComplete(track)) {
    return 0;
  }
  if (!isLiricksStepComplete(lines)) {
    return 1;
  }
  return 2;
};

export const canNavigateToTab = (
  tab: AppTab,
  activeTab: AppTab,
  track: TrackMeta,
  lines: LyricLine[],
): boolean => {
  if (tab === activeTab) {
    return true;
  }

  const tabIndex = WORKFLOW_TAB_ORDER.indexOf(tab);
  const maxIndex = getMaxAccessibleStepIndex(track, lines);
  return tabIndex <= maxIndex;
};

export const getAdvanceStepBlockers = (
  activeTab: AppTab,
  track: TrackMeta,
  lines: LyricLine[],
): string[] => {
  if (activeTab === 'options') {
    if (!isOptionsStepComplete(track)) {
      return ['Upload audio in Options to continue.'];
    }
    return [];
  }

  if (activeTab === 'liricks') {
    if (!isLiricksStepComplete(lines)) {
      return ['Sync at least one lyric line to continue.'];
    }
    return [];
  }

  return [];
};

export const isWorkflowStepComplete = (
  tab: AppTab,
  track: TrackMeta,
  lines: LyricLine[],
): boolean => {
  if (tab === 'options') {
    return isOptionsStepComplete(track);
  }
  if (tab === 'liricks') {
    return isLiricksStepComplete(lines);
  }
  return false;
};

export const getStepAccessBlockers = (
  tab: AppTab,
  track: TrackMeta,
  lines: LyricLine[],
): string[] => {
  const tabIndex = WORKFLOW_TAB_ORDER.indexOf(tab);
  if (tabIndex <= 0) {
    return [];
  }

  if (!isOptionsStepComplete(track)) {
    return ['Upload audio in Options to unlock this step.'];
  }

  if (tabIndex >= 2 && !isLiricksStepComplete(lines)) {
    return ['Sync at least one lyric line in Liricks to unlock this step.'];
  }

  return [];
};
