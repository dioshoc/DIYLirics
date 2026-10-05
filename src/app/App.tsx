import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { MainLayout } from '../components/layout/MainLayout';
import { LiricksPanel } from '../components/liricks/LiricksPanel';
import { OptionsPanel } from '../components/options/OptionsPanel';
import { VideomakerPanel } from '../components/videomaker/VideomakerPanel';
import {
  restoreSessionFromStorage,
  startPersistenceSubscriber,
  stopPersistenceSubscriber,
} from '../storage/sessionPersistence';
import { useSessionStore } from '../store/sessionStore';
import type { AppTab } from '../types/session';
import styles from './App.module.scss';

const TAB_CONTENT: Record<AppTab, ReactNode> = {
  options: <OptionsPanel />,
  liricks: <LiricksPanel />,
  videomaker: <VideomakerPanel />,
};

export const App = () => {
  const activeTab = useSessionStore((s) => s.activeTab);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      await restoreSessionFromStorage();
      if (cancelled) {
        return;
      }
      startPersistenceSubscriber();
      setIsReady(true);
    };

    void boot();

    return () => {
      cancelled = true;
      stopPersistenceSubscriber();
    };
  }, []);

  if (!isReady) {
    return (
      <div className={styles.boot} role="status" aria-live="polite">
        Loading session…
      </div>
    );
  }

  return <MainLayout>{TAB_CONTENT[activeTab]}</MainLayout>;
};
