# DIYLirics — спецификация проекта

Приложение для ручной синхронизации текста песни с аудио и последующей генерации lyric-видео. Вся логика выполняется **только в браузере**, в **одной пользовательской сессии**, **без сервера и API**.

---

## 1. Цели и ограничения

| Требование | Описание |
|------------|----------|
| Только фронтенд | Нет бэкенда, БД, авторизации, облачного хранения |
| Одна сессия | Состояние вкладки **сохраняется локально** и восстанавливается после перезагрузки (см. §1.1) |
| React | UI и бизнес-логика на React (рекомендуется TypeScript) |
| Аудио | Файл трека загружается пользователем (`File` → `URL.createObjectURL`) |
| Экспорт | JSON с метаданными и таймкодами строк — основной артеfact для Videomaker |

**Вне scope v1:** автоматическое распознавание текста, стриминг, совместное редактирование, аккаунты.

### 1.1. Локальное сохранение сессии

| Хранилище | Данные |
|-----------|--------|
| `localStorage` (`diylirics.session.v1`) | JSON: tab, title/artist, duration, lyrics text, lines + timestamps, `lyricsEndTimeSec`, syncCursor, video format, background и **layout**-настройки Videomaker |
| IndexedDB (`diylirics-session`) | Blob-файлы: **audio**, **cover**, **custom background** |

- Автосохранение с debounce ~400 ms при любом изменении store.
- При старте приложения — restore до первого рендера UI (`Loading session…`).
- Object URL пересоздаются после restore; старые revoke при замене файлов в store как раньше.

---

## 2. Общая компоновка UI

**Язык интерфейса (v1):** все подписи, кнопки, placeholder’ы и сообщения в UI — **английский** (`lang="en"`). Спека и комментарии для разработки могут оставаться на русском.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [logo]    │  ① Options — ② Liricks — ③ Videomaker   │  Next / Download │
├──────────────────────────────────────────────────────────────────────────┤
│  Options / Liricks: контент по центру, max-width 1200px ($content-max) │
│  Videomaker: на всю ширину (колонка настроек ~280px + preview)           │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Навигация:** верхний **WorkflowHeader** (`src/components/layout/WorkflowHeader.tsx`) — логотип слева, три шага (клик = смена `activeTab`), справа **Next: …** на Options/Liricks или **Download video** на Videomaker.
- Отдельного бокового сайдбара с табами **нет** (с 2026-10-04).
- **Порядок шагов (gating):** логика в `src/utils/workflowReadiness.ts`. На следующий шаг и на заблокированные шаги в хедере нельзя перейти, пока не выполнен предыдущий:
  - **Liricks** — нужно загруженное **аудио** в Options (`track.audioObjectUrl`).
  - **Videomaker** — нужна хотя бы **одна синхронизированная** строка в Liricks (`startTimeSec !== null`).
  - Назад на уже доступные шаги можно всегда; текущий шаг остаётся активным, даже если условия позже сбросились.
  - Кнопка **Next** disabled + `title` с причиной; шаги впереди — `disabled` в stepper.
- Общее состояние сессии (аудио, метаданные, lyrics, настройки видео) — **единый Zustand store**, доступный всем шагам.

### 2.1. Шаги workflow (подробно)

Линейный сценарий: **Options → Liricks → Videomaker → Download video**. Код gating: `src/utils/workflowReadiness.ts`.

#### Шаг 1 — Options

| # | Действие пользователя | Результат в store |
|---|------------------------|-------------------|
| 1 | Загрузить **audio** | `track.audioFile`, `audioObjectUrl`, `durationSec` |
| 2 | (Опционально) загрузить **cover** | `coverFile`, `coverObjectUrl` — для Videomaker track-cover |
| 3 | Ввести **Song title** / **Artist** | `track.title`, `track.artist` — имя MP4, TikTok overlay |
| 4 | **Next: Liricks** | Только если есть `audioObjectUrl` |

#### Шаг 2 — Liricks

| # | Действие пользователя | Результат в store |
|---|------------------------|-------------------|
| 1 | Вставить текст, **Split into lines** | `lyricsRawText`, `lines[]` с `startTimeSec: null` |
| 2 | **Play** + **Mark** / ▲ / ▼ | `startTimeSec` на строках, `syncCursor` |
| 3 | (Опционально) **End lyrics** + Mark | `lyricsEndTimeSec` — конец показа текста |
| 4 | Fine-tune ±0.01 / ±0.1 | `nudgeLineTime`, `nudgeLyricsEndTime` |
| 5 | **Export JSON** / **Import .json** | `LyricsProject` файл ↔ store |
| 6 | **Next: Videomaker** | ≥1 строка с `startTimeSec !== null` |

Нижний **fixed dock**: плеер + Mark/▲/▼ (после split и при наличии аудио).

#### Шаг 3 — Videomaker

| # | Действие пользователя | Результат в store |
|---|------------------------|-------------------|
| 1 | **Video format** | `formatId` (`youtube` \| `tiktok`) |
| 2 | **Background** | `backgroundSource`, custom blob при необходимости |
| 3 | **Cover side** (YouTube) / **Cover position** (TikTok) | `youtubeCoverSide`, `tiktokCoverPosition` |
| 4 | **Lyric font**, **Lyric entrance**, **Lyric position**, **Text size** | `lyricFontId`, `lyricAnimationPreset`, align v/h, `lyricFontSize` (±20%) |
| 5 | Preview + нижний плеер | preview time + rAF для анимации текста; TikTok social UI только в preview |
| 6 | **Download video** | офлайн MP4; `ExportBlockingOverlay` на время кодирования и до закрытия пользователем (× / Escape) |

**Download video** требует: аудио, синхронизированные строки, доступный URL фона (`getVideoExportBlockers`).

---

## 3. Модель данных сессии

### 3.1. Метаданные трека (Options)

```ts
type TrackMeta = {
  title: string;
  artist: string;
  audioFile: File | null;
  audioObjectUrl: string | null; // revoke on replace/unmount
  coverFile: File | null;
  coverObjectUrl: string | null; // revoke on replace/unmount
  durationSec: number | null;    // из loadedmetadata аудио
};
```

### 3.2. Строка лирики с таймкодом

```ts
type LyricLine = {
  id: string;           // stable uuid или nanoid
  text: string;
  startTimeSec: number; // секунды, float, точность UI до 0.01
  endTimeSec: number | null; // опционально: следующая строка или ручная правка позже
};
```

### 3.3. Проект синхронизации (выход Liricks)

```ts
type LyricsProject = {
  version: 1;
  meta: {
    title: string;
    artist: string;
    audioFileName: string | null;
    coverArtFileName: string | null;
    durationSec: number | null;
    lyricsEndTimeSec: number | null; // конец показа текста в preview/export
  };
  lines: LyricLine[];
};
```

**Правила:**

- Строки упорядочены по `startTimeSec` (после каждой правки — пересортировка или запрет нарушения порядка — на выбор реализации; минимум: предупреждение при `startTime` меньше предыдущей).
- `endTimeSec` для строки `i`: по умолчанию `lines[i+1].startTimeSec`, для последней — `lyricsEndTimeSec` (если задан) или `durationSec`.
- **End lyrics:** отдельная «строка» в UI (`END_LYRICS_ROW_ID`); Mark задаёт `lyricsEndTimeSec` — после этого момента текст в preview и в MP4 не показывается.
- Экспорт: кнопка «Скопировать JSON» / «Скачать .json» — тот же объект `LyricsProject`.
- **Импорт:** кнопка **Import .json** → `importLyricsProject` (`src/utils/importLyricsProject.ts`) восстанавливает lines и `meta.lyricsEndTimeSec` (title/artist при наличии в JSON).

### 3.4. Videomaker

```ts
type VideoFormatId = 'youtube' | 'tiktok';

type VideoBackgroundSource = 'track_cover' | 'custom';

type VideoSettings = {
  formatId: VideoFormatId;
  backgroundSource: VideoBackgroundSource;
  youtubeCoverSide: 'left' | 'right';
  tiktokCoverPosition: 'top' | 'bottom';
  lyricVerticalAlign: 'top' | 'center' | 'bottom';
  lyricHorizontalAlign: 'left' | 'center' | 'right';
  lyricFontSize: 'small' | 'medium' | 'large';
  lyricFontId: string; // id из videoLyricFonts.ts (каталог Google Fonts)
  lyricAnimationPreset: LyricAnimationPresetId; // 'none' | fade_in | … — см. VIDEOMaker.md §Lyric entrance
  customBackgroundFile: File | null;
  customBackgroundObjectUrl: string | null;
  customBackgroundKind: 'image' | 'video' | null;
};
```

Пресеты разрешения и aspect ratio — `src/constants/videoFormats.ts`. Preview, layout и экспорт MP4 — [VIDEOMaker.md](./VIDEOMaker.md).

---

## 4. Таб Options

**Назначение:** загрузка аудио и базовые метаданные для всего проекта.

| Элемент | Поведение |
|---------|-----------|
| Audio file | `accept="audio/*"`, один файл; при смене — revoke старый object URL |
| Release cover art | `accept="image/*"`, один файл; превью 160×160; revoke object URL при смене |
| Song title | controlled input → `TrackMeta.title` |
| Artist / band | controlled input → `TrackMeta.artist` |
| Превью | имя аудioфайла, длительность после `loadedmetadata` |

**Валидация workflow:**

- Переход **Options → Liricks** блокируется без загруженного аудио (см. §2 gating).
- Title / artist могут быть пустыми — синхронизацию не блокируют.

---

## 5. Таб Liricks

**Назначение:** ввод текста, проигрывание трека, ручная расстановка таймкодов «по нажатию», fine-tune, экспорт JSON.

### 5.1. Макет (логический)

Контент вкладки прокручивается в центральной колонке (**max-width 1200px**); **плеер и блок меток времени закреплены снизу окна** (`left: 0`, на всю ширину), поверх прокрутки.

```
┌─────────────────────────────────────────────────────────────┐
│  [ textarea: полный текст песни ]                            │
│  Список строк (время + текст + стрелки ±0.01/±0.1)           │
│  JSON export …                                               │
│                    (scroll)                                  │
├─────────────────────────────────────────────────────────────┤ ← fixed bottom dock
│  Текущая строка N/M  ·  превью текста    [▲] [Mark] [▼]    │
│  ▶  ─────────●──────────────  time / duration                │
└─────────────────────────────────────────────────────────────┘
```

- Нижний док (`position: fixed`, `left: 0`, `right: 0`) всегда виден на вкладке Liricks после загрузки аудио.
- Полоса меток (▲ / Mark / ▼) показывается, когда есть хотя бы одна строка после «Разбить на строки».
- У прокручиваемой области — нижний `padding`, чтобы список и JSON не перекрывались доком.

### 5.2. Подготовка строк из текста

- Пользователь вставляет текст в textarea.
- Кнопка «Разбить на строки» (или авто при blur): split по `\n`, trim, пустые строки отбрасывать или сохранять как пустые — **отбрасывать** в v1.
- Каждая строка получает `id`, `startTimeSec: null` → в UI «не синхронизировано» до первого mark.

### 5.3. Режим синхронизации

- Индекс **текущей строки** (`syncCursor`): с какой строкой работаем.
- При воспроизведении аудио пользователь нажимает **Mark** — зафиксировать время **начала** текущей строки = `audio.currentTime`.
- После mark: записать `startTimeSec`, увеличить `syncCursor` на 1.
- **▲** — предыдущая строка в списке (курсор вверх), перезапись времени при новом Mark.
- **▼** — следующая строка без записи времени (курсор вниз).

Рекомендуемые hotkeys (accessibility):

- `Space` — play/pause (не когда фокус в textarea).
- `Enter` или `M` — mark текущей строки.

### 5.4. Список строк

Для каждой строки отображать (элементы строки **выровнены по центру по вертикали**):

- Блок **время + подстройка**: `startTimeSec` (формат `mm:ss.ms` или `ss.ms`) и сразу рядом кнопки сдвига.
- Текст строки.
- Подстройка времени **в один горизонтальный ряд** у значения времени (как перемотка), активна только если `startTimeSec` задан:
  - `‹‹` — минус **0.1** с
  - `‹` — минус **0.01** с
  - `›` — плюс **0.01** с
  - `››` — плюс **0.1** с  
  (одна галочка — fine, две — coarse; подсказка в `title` / `aria-label`.)
- Clamp: `>= 0`, `<= durationSec` если известна.
- При смене **текущей строки** (`syncCursor` — Mark, ▲, ▼, клик по строке) список **прокручивается**, чтобы активная строка оставалась видимой в области списка (`scrollIntoView`, `block: nearest`).

### 5.5. Проигрыватель

- HTML `<audio>` или Web Audio — достаточно `<audio ref>` для v1.
- Seek bar, текущее время, длительность.
- **Размещение:** в нижнем фиксированном доке (см. §5.1), не в потоке прокрутки.
- При клике по строке в списке — optional seek к `startTimeSec`.

### 5.6. Экспорт и импорт

- Панель **JSON preview** по умолчанию **скрыта** (кнопка Show JSON / Hide JSON) + Copy / Download.
- **Import .json** — загрузка ранее экспортированного `LyricsProject`.
- В JSON **только синхронизированные** строки (`startTimeSec` задан); несинхронизированные — предупреждение в UI.

---

## 6. Таб Videomaker

**Макет:** левая колонка настроек (~280px) + **preview на всю оставшуюся высоту/ширину** (`MainLayout` без padding на этом табе). Нижний **AudioPlayer** — fixed dock как в Liricks.

Детали preview, layout и рендера — [VIDEOMaker.md](./VIDEOMaker.md).

### 6.1. Настройки (колонка слева)

- **Video format** — YouTube 16:9 / TikTok 9:16.
- **Background** — track cover или custom image/video; input файла custom — только при `backgroundSource === 'custom'`.
- **YouTube:** сторона карточки обложки (`youtubeCoverSide`).
- **TikTok:** позиция карточки (`tiktokCoverPosition`); опциональный **TikTok social overlay** — только в preview, не в экспорт.
- **Lyric font** — каталог Google Fonts, плитки с превью Aa (`LyricFontPicker`).
- **Lyric entrance** — анимация появления/исчезновения строки (`LyricAnimationPicker`); default **No animation**.
- **Lyric position** — vertical / horizontal align; **Text size** — Small / Medium / Large (±20% от базового размера, preview + MP4).

### 6.2. Preview vs export

- Узел **`[data-videomaker-export-root]`** — то, что попадает в MP4 (без TikTok UI chrome).
- Активная строка: `getActiveLyricStateAtTime` (`text`, `lineStartSec`, `lineEndSec`) + учёт `lyricsEndTimeSec`.
- Анимация текста в preview: `getLyricAnimationTransform` + `useAudioDrivenTimeSec` (rAF при воспроизведении).
- Масштаб типографики в preview — **container queries** (`cqw` / `cqh`), без привязки к фиксированному UI-scale.

### 6.3. Экспорт MP4 (реализовано)

- Кнопка **Download video** в WorkflowHeader (только шаг Videomaker).
- **Офлайн-рендер:** Canvas 2D (`src/utils/videoExport/drawFrame.ts`) + **mediabunny** → **H.264 + AAC**, файл **`.mp4`** (не WebM).
- Кадры: 30 fps, по таймлайну до `lyricsEndTimeSec` или длительности аудио; имя файла — **Song title** из Options (кириллица сохраняется, недопустимые символы пути заменяются).
- Зависимость: `mediabunny` + WebCodecs (H.264/AAC) в браузере.
- Блокеры: нет аудио, нет синхронизированных строк, нет URL фона (`getVideoExportBlockers`).
- **UI во время экспорта:** полноэкранный **`ExportBlockingOverlay`** (`src/components/layout/ExportBlockingOverlay.tsx`) — portal на `document.body`, прогресс %, `body { overflow: hidden }`, на `[data-app-shell]` атрибут **`inert`**. Тексты оверлея на английском.
  - **Фазы:** во время кодирования — спиннер, «Exporting video», progress bar; после успешного скачивания оверлей **остаётся открытым** — «Download ready», 100%, галочка; закрытие только кнопкой **×** в углу карточки или **Escape** (`WorkflowHeader`: `showExportOverlay`, `exportFinished`).
  - **Поддержка проекта** (внизу карточки, видна и во время экспорта, и после): две карточки в сетке — **Boosty** (QR + ссылка) и **Band.link** (QR + ссылка). URL: `src/constants/projectSupport.ts`; QR: `src/assets/boosty-donate-qr.png`, `src/assets/band-link-qr.png`.
  - При **ошибке** экспорта оверлей закрывается, сообщение — в WorkflowHeader.
- **Брендинг в шапке:** логотип-картинка `src/assets/diylirics-logo.webp` в `WorkflowHeader` (`alt="DIY Lirics"`).

**Зависимости от Liricks / Options:**

- `LyricsProject.lines`, `lyricsEndTimeSec`, `TrackMeta` (audio, cover, title, artist).
- Без синхронизированных lines — предупреждение вместо панели (UI на английском).

---

## 7. Технический стек (рекомендация для реализации)

| Слой | Выбор |
|------|--------|
| Сборка | Vite |
| UI | React 18+, TypeScript |
| Стили | SCSS модули; переменные из `src/styles/**/*` (когда появятся) |
| Состояние | Zustand или React Context + useReducer |
| ID строк | `nanoid` |
| Тесты | Vitest + RTL — по необходимости |

**Паттерны кода (из правил проекта):**

- Обработчики: `handleClick`, `handleKeyDown`.
- `const Component = () => {}`.
- Вместо `switch` — объекты-маппинги для табов и режимов.
- `line-height` в CSS: числовые множители (например `1.5`), не `%`.
- Early return в компонентах и хуках.

---

## 8. Структура каталогов (целевая)

```
src/
  app/                 # корень приложения, провайдеры
  components/
    layout/            # MainLayout, WorkflowHeader, ExportBlockingOverlay
    options/
    liricks/
    videomaker/
  store/               # session store
  types/               # TrackMeta, LyricLine, LyricsProject, VideoSettings
  hooks/
    useAudioDrivenTimeSec.ts  # плавное время preview для lyric animation
  utils/
    workflowReadiness.ts  # gating шагов workflow
    activeLyricLine.ts    # активная строка + lineEndSec
    lyricAnimationTransform.ts
    videoExport/       # drawFrame, exportLyricVideo (MP4)
    importLyricsProject.ts, exportProject.ts, …
  styles/              # globals, variables
docs/
  PROJECT_SPEC.md      # этот файл
  VIDEOMaker.md        # дополнение: пункты 1–2 Videomaker (когда готовы)
```

---

## 9. Нефункциональные требования

- **Производительность:** списки до ~500 строк без лагов (virtualization опционально).
- **Доступность:** кнопки с `aria-label`, фокус-кольца, клавиатура для mark/play.
- **Память:** `URL.revokeObjectURL` при замене файла и unmount.
- **Ошибки:** битый аудioфайл — сообщение пользователю; не падать silently.

---

## 10. Этапы разработки

1. **Scaffold:** Vite + React + layout + 3 таба + пустой store.
2. **Options:** загрузка аудио, meta, duration.
3. **Liricks:** textarea → lines, player, sync cursor, mark, nudge ±0.01/±0.1, JSON export.
4. **Videomaker:** настройки, preview, MP4 export — см. `docs/VIDEOMaker.md` и §6.3.
5. **Полировка:** hotkeys; ~~localStorage draft~~ — реализовано (§1.1).

---

## 11. Открытые вопросы (для заказчика)

1. Videomaker: точное описание **первых двух** пунктов сайдбара.
2. ~~Нужен ли импорт готового JSON~~ — **Import .json** в Liricks (2026-10-04).
3. Формат lyric-видео: разрешение, фон, шрифт, анимация строк — в Videomaker.
4. ~~Одна кнопка Mark vs пара ▲/▼~~ — в доке: ▲ предыдущая / Mark / ▼ следующая.

---

---

## 12. История изменений

| Дата | Изменение |
|------|-----------|
| 2026-10-03 | **Liricks UX:** плеер и кнопки меток времени (▼ / Mark / ▲) перенесены в **фиксированный нижний док** экрана; список строк и JSON прокручиваются выше. |
| 2026-10-03 | **Liricks строки:** сдвиг таймкода — **4 кнопки в ряд** со стрелками (‹‹ ‹ › ››), 0.01 / 0.1 с. |
| 2026-10-03 | **Liricks метки:** **▲** = предыдущая строка, **▼** = следующая (иконки согласованы с направлением по списку). |
| 2026-10-03 | **Liricks список:** автоскролл к текущей строке при смене `syncCursor`. |
| 2026-10-03 | **Liricks строки:** стрелки сдвига времени **рядом с таймкодом**; строка списка — **vertical-align center**. |
| 2026-10-03 | **UI:** без нумерации строк в списке Liricks; глобальные стили скроллбаров в палитре проекта (`src/styles/global.scss`). |
| 2026-10-03 | **Options:** загрузка **обложки релиза** (`image/*`); **UI на английском**; `coverArtFileName` в JSON meta. |
| 2026-10-03 | **Videomaker:** выбор формата **YouTube (16:9)** или **TikTok (9:16)**; preview под aspect ratio. |
| 2026-10-03 | **Videomaker Background:** **track cover** или **custom image/video** для фона кадра. |
| 2026-10-03 | **Persistence:** автосохранение сессии в **localStorage** + файлы в **IndexedDB**. |
| 2026-10-04 | **Videomaker track cover preview:** blur/dim background + side cover card + lyrics. |
| 2026-10-04 | **TikTok preview:** vertical cover layout (без overlay UI — откат). |
| 2026-10-04 | **Liricks:** строка **End lyrics** + `lyricsEndTimeSec` в store, JSON meta, persistence; текст скрывается после этой метки в preview/export. |
| 2026-10-04 | **Liricks:** **Import .json**; JSON preview **скрыт по умолчанию**. |
| 2026-10-04 | **Videomaker:** `youtubeCoverSide`, `tiktokCoverPosition`, **Lyric position** (v/h); TikTok **social overlay** только в preview. |
| 2026-10-04 | **Videomaker:** TikTok track cover — карточка статична, текст в отдельном overlay; preview на весь main; container queries для масштаба. |
| 2026-10-04 | **UI:** **WorkflowHeader** (логотип, шаги, Next / Download video); боковой сайдбар с табами убран. |
| 2026-10-04 | **UI:** Options и Liricks — контент по центру, **max-width 1200px** (`$content-max-width`). |
| 2026-10-04 | **Export:** офлайн **MP4** (mediabunny, Canvas 2D), имя файла по **Song title**. |
| 2026-10-04 | **Workflow:** gating шагов (`workflowReadiness.ts`) — Next и шаги впереди disabled до выполнения предыдущего. |
| 2026-10-04 | **Export UX:** полноэкранный блокирующий оверлей с прогрессом на время MP4 export (`ExportBlockingOverlay`). |
| 2026-10-05 | **Док:** §2.1 — подробное описание всех шагов workflow. |
| 2026-10-05 | **Videomaker:** `lyricFontSize` small / medium / large (×0.8 / ×1 / ×1.2), preview (`--lyric-font-scale`) и MP4 export. |
| 2026-10-05 | **Videomaker:** каталог шрифтов лирики (`lyricFontId`), анимации входа/выхода строк (`lyricAnimationPreset`); детали — `docs/VIDEOMaker.md`. |
| 2026-10-07 | **Брендинг:** логотип в WorkflowHeader (`diylirics-logo.webp`). |
| 2026-10-07 | **Export UX:** оверлей после успешного MP4 не закрывается сам; × / Escape; блоки Boosty + Band.link с QR (`projectSupport.ts`). |

*Документ версии 2.10 — база для генерации кода агентом и разработчиком.*
