import { useId, type ReactNode } from 'react';

import styles from './Section.module.scss';

type SectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  titleId?: string;
};

export const Section = ({
  title,
  children,
  className,
  contentClassName,
  titleId,
}: SectionProps) => {
  const autoTitleId = useId();
  const resolvedTitleId = titleId ?? autoTitleId;

  return (
    <section
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-labelledby={title ? resolvedTitleId : undefined}
    >
      {title ? (
        <header className={styles.header}>
          <h3 className={styles.title} id={resolvedTitleId}>
            {title}
          </h3>
        </header>
      ) : null}
      <div
        className={[styles.content, contentClassName].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </section>
  );
};
