import styles from './TikTokSocialOverlay.module.scss';

type TikTokSocialOverlayProps = {
  artist: string;
  title: string;
};

const formatHandle = (artist: string): string => {
  const trimmed = artist.trim();
  if (!trimmed) {
    return '@artist';
  }
  const slug = trimmed
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '');
  return slug ? `@${slug}` : '@artist';
};

export const TikTokSocialOverlay = ({
  artist,
  title,
}: TikTokSocialOverlayProps) => {
  const handle = formatHandle(artist);
  const caption = title.trim() || 'Lyric video';
  const soundLabel = artist.trim()
    ? `Original sound — ${artist.trim()}`
    : 'Original sound';

  return (
    <div className={styles.overlay} aria-hidden>
      <div className={styles.rightRail}>
        <div className={styles.avatarStack}>
          <span className={styles.avatar} />
          <span className={styles.followBadge}>+</span>
        </div>

        <div className={styles.action}>
          <span className={styles.actionIcon} data-icon="like" />
          <span className={styles.actionCount}>24.8K</span>
        </div>
        <div className={styles.action}>
          <span className={styles.actionIcon} data-icon="comment" />
          <span className={styles.actionCount}>1,204</span>
        </div>
        <div className={styles.action}>
          <span className={styles.actionIcon} data-icon="bookmark" />
          <span className={styles.actionCount}>3,891</span>
        </div>
        <div className={styles.action}>
          <span className={styles.actionIcon} data-icon="share" />
          <span className={styles.actionCount}>Share</span>
        </div>

        <span className={styles.disc} />
      </div>

      <div className={styles.bottomMeta}>
        <p className={styles.handle}>{handle}</p>
        <p className={styles.caption}>{caption}</p>
        <p className={styles.sound}>
          <span className={styles.soundIcon} aria-hidden />
          <span className={styles.soundText}>{soundLabel}</span>
        </p>
      </div>

      <div className={styles.topBar}>
        <span className={styles.topTab} data-active="true">Following</span>
        <span className={styles.topTab}>For You</span>
      </div>
    </div>
  );
};
