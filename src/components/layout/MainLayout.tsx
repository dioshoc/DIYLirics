import type { ReactNode } from 'react';

import { useSessionStore } from '../../store/sessionStore';
import { WorkflowHeader } from './WorkflowHeader';
import styles from './MainLayout.module.scss';

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const activeTab = useSessionStore((s) => s.activeTab);

  return (
    <div className={styles.shell} data-app-shell>
      <main className={styles.main} data-tab={activeTab}>
        <WorkflowHeader />
        <div className={styles.mainContent}>{children}</div>
      </main>
    </div>
  );
};
