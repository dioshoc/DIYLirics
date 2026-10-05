# Инструкции для AI-агента (DIYLirics)

При создании или изменении кода **сначала прочитай** [docs/PROJECT_SPEC.md](./docs/PROJECT_SPEC.md).

## Краткие правила

- **Только фронтенд**, одна браузерная сессия, **React** (+ TypeScript).
- Единый session store: аудио и обложка (blob URL), `title`/`artist`, `LyricsProject`, настройки Videomaker.
- **UI пользователя — английский** (labels, buttons, placeholders).
- Сессия персистится: `src/storage/sessionPersistence.ts` (localStorage + IndexedDB).
- Три шага workflow в **WorkflowHeader**: **Options**, **Liricks**, **Videomaker** (без бокового сайдбара). Gating: `src/utils/workflowReadiness.ts`.
- Options / Liricks: контент по центру, max-width **1200px** (`$content-max-width`).
- Экспорт из Liricks: JSON `LyricsProject` (+ `meta.lyricsEndTimeSec`); **Import .json** поддерживается.
- Videomaker: настройки, preview, **MP4 export** — `docs/VIDEOMaker.md`, код в `src/utils/videoExport/`; на время export — `ExportBlockingOverlay`. Шаги workflow — §2.1 `PROJECT_SPEC.md`.
- Videomaker lyric: шрифты `videoLyricFonts.ts` / `LyricFontPicker`; анимации `videoLyricAnimation.ts`, `lyricAnimationTransform.ts`, preview `AnimatedPreviewLyric` + `useAudioDrivenTimeSec`; активная строка `activeLyricLine.ts` (`lineEndSec` для выхода).
- Не добавлять бэкенд, не писать лишнюю пользовательскую документацию без запроса.
- Код: объекты вместо `switch`, `handle*` для событий, SCSS с переменными из `src/styles`, `line-height` как `1.5` и т.п.

## Дополнения к спецификации

Новые решения по Videomaker и UX фиксировать в `docs/VIDEOMaker.md` или в конце `PROJECT_SPEC.md` с датой.
