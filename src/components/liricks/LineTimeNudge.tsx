import styles from './LineTimeNudge.module.scss';

type NudgeStep = {
  delta: number;
  chevronCount: 1 | 2;
  direction: 'left' | 'right';
  ariaLabel: string;
};

const NUDGE_STEPS: NudgeStep[] = [
  {
    delta: -0.1,
    chevronCount: 2,
    direction: 'left',
    ariaLabel: 'Shift 0.1 seconds earlier',
  },
  {
    delta: -0.01,
    chevronCount: 1,
    direction: 'left',
    ariaLabel: 'Shift 0.01 seconds earlier',
  },
  {
    delta: 0.01,
    chevronCount: 1,
    direction: 'right',
    ariaLabel: 'Shift 0.01 seconds later',
  },
  {
    delta: 0.1,
    chevronCount: 2,
    direction: 'right',
    ariaLabel: 'Shift 0.1 seconds later',
  },
];

const CHEVRON = {
  left: '‹',
  right: '›',
} as const;

type LineTimeNudgeProps = {
  disabled: boolean;
  onNudge: (delta: number) => void;
};

export const LineTimeNudge = ({ disabled, onNudge }: LineTimeNudgeProps) => {
  const handleNudgeClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    delta: number,
  ) => {
    event.stopPropagation();
    onNudge(delta);
  };

  return (
    <div className={styles.root} role="group" aria-label="Adjust line timing">
      {NUDGE_STEPS.map((step) => (
        <button
          key={`${step.direction}-${step.chevronCount}-${step.delta}`}
          type="button"
          className={styles.btn}
          disabled={disabled}
          aria-label={step.ariaLabel}
          title={step.ariaLabel}
          onClick={(event) => handleNudgeClick(event, step.delta)}
        >
          <span
            className={styles.chevrons}
            data-direction={step.direction}
            aria-hidden
          >
            {Array.from({ length: step.chevronCount }, (_, index) => (
              <span key={index} className={styles.chevron}>
                {CHEVRON[step.direction]}
              </span>
            ))}
          </span>
        </button>
      ))}
    </div>
  );
};
