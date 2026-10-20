# Videomaker — дополнение к спецификации

См. §6 в [PROJECT_SPEC.md](./PROJECT_SPEC.md). UI на английском.

---

## Workflow (кратко)

1. **Options** — audio (обязательно для шага 2), cover, title/artist.  
2. **Liricks** — split, sync, End lyrics, JSON import/export.  
3. **Videomaker** — format, background, layout, preview, **Download video** (MP4).

Подробные таблицы — §2.1 в [PROJECT_SPEC.md](./PROJECT_SPEC.md).

---

## Компоновка вкладки

| Зона | Описание |
|------|----------|
| WorkflowHeader | **Reset session** (с подтверждением) + **Download video** на Videomaker; на других шагах — **Reset session** + **Next** (см. §Экспорт MP4, §WorkflowHeader). |
| Колонка настроек (`aside.settings`) | **280px**, на **полную высоту** сетки, вертикальный скролл, border справа; **не перекрывается** плеером. |
| Правая колонка (`mainColumn`) | Preview + **нижний dock** только здесь (не на всю ширину окна). |
| Preview | Внутри `mainColumn`, `flex: 1`, aspect ratio кадра по формату; container queries для типографики. |
| Bottom dock | В потоке **правой** колонки (`flex-shrink: 0`), не `position: fixed` на весь viewport — сайдбар остаётся до низа без «полосы» снизу. |

**Сетка:** `workspace` → `layout` (`grid-template-columns: 280px 1fr`). На узком экране (&lt; 720px) — колонка настроек сверху (max-height ~42vh), превью и плеер снизу.

Файлы: `src/components/videomaker/panel/VideomakerPanel.tsx`, `VideomakerPanel.module.scss`, `src/components/videomaker/preview/VideoPreviewFrame.tsx`.

### Секции настроек (`Section`)

Каждый блок в сайдбаре — обёртка **`Section`** (`src/components/shared/section/Section.tsx`): заголовок + контент с **padding/gap 12px**. Общие стили списков опций: `pickers/pickerShared.module.scss`. Подробнее — §2.2 в [PROJECT_SPEC.md](./PROJECT_SPEC.md).

### Структура кода Videomaker

| Папка | Назначение |
|-------|------------|
| `panel/` | `VideomakerPanel` — сетка, сайдбар, preview, плеер |
| `pickers/` | Format, background, cover layout, track info, lyric layout/font/animation/effects |
| `preview/` | `VideoPreviewFrame`, `AnimatedPreviewLyric`, фон, tint |
| `overlay/` | `TikTokSocialOverlay` (только preview) |
| `lyric/` | CSS keyframes пикера (`LyricAnimation.module.scss`), `lyricAnimationClass.ts` |

Экспорт-оверлей: `src/components/layout/export/ExportBlockingOverlay.tsx`.

---

## Video format (пункт 1)

Пользователь выбирает **один** из двух пресетов. Значение: `VideoSettings.formatId`.

| ID | Платформа | Соотношение | Разрешение экспорта |
|----|-----------|-------------|---------------------|
| `youtube` | YouTube | 16:9 | 1920 × 1080 |
| `tiktok` | TikTok | 9:16 | 1080 × 1920 |

Константы: `src/constants/videoFormats.ts`.

- UI: **Video format** — два варианта (radio-поведение).
- Preview меняет aspect ratio (`previewFrameWrap[data-format]`).

### TikTok short clip (Reels / Shorts)

Только при `formatId === 'tiktok'`. Настройка **на нижнем плеере**, не в сайдбаре.

| Поле store | Описание |
|------------|----------|
| `tiktokClipDurationSec` | Длина экспорта **15–45 s** (default **30**), константы `tiktokClip.ts` |
| `tiktokClipStartSec` | Начало отрезка на **полной** длительности аудио (`track.durationSec`) |

UI: `ClipRangeTimeline` — waveform на всю песню; синяя рамка — клип; **‹ ›** — длина (resize), середина — drag; клик/drag playhead — seek. **Play** воспроизводит только интервал клипа (стоп в конце).

Логика: `clampTiktokClipSettings`, `resolveTiktokExportWindow` (`tiktokExportWindow.ts`). Экспорт: `exportLyricVideo.ts` — `sliceAudioBuffer`, кадры по `lineStart + localTime`; границы клипа — длина **файла**, не `lyricsEndTimeSec`.

Persistence: `tiktokClipDurationSec`, `tiktokClipStartSec` в `videoSettings` (localStorage).

---

## Background (пункт 2)

Источник: `VideoSettings.backgroundSource`.

| Значение | Поведение |
|----------|-----------|
| `track_cover` | Карточка — обложка из **Options**; фон (backdrop) — release art или custom media (`trackCoverBackdropSource`). |
| `custom` | Файл **image/** или **video/** на весь кадр; input только при `custom`. |

Store: `trackCoverBackdropSource` (`release_art` \| `custom_media`), `customBackgroundFile`, `customBackgroundObjectUrl`, `customBackgroundKind`.

Разрешение URL: `resolveVideoBackground()` (full / custom), `resolveTrackCoverBackdrop()` (backdrop за карточкой). Загрузка backdrop в track cover — `setTrackCoverBackdropFile` (режим **не** переключается на full `custom`); full-bleed — `setCustomBackgroundFile` (ставит `backgroundSource: 'custom'`).

**UI (Track cover):** под радио «Track cover» — блок **Backdrop behind the cover card**: **Release art** \| **Custom media** + file input при custom. Пока custom-файл не выбран, backdrop = release art.

### Режим full (`custom` или track cover без split)

- Медиа на весь кадр (`VideoPreviewBackground`), opacity ~0.45 + затемнение.
- Текст в `previewLyricOverlay` с отступами и **Lyric position**.

### Режим cover-split (`track_cover` + обложка в Options)

- **Карточка** — всегда release art из Options (`coverSplitCard`).
- **Backdrop** (`CoverSplitBackdrop`, `resolveTrackCoverBackdrop`):
  - **Release art** (`release_art` или custom без файла): `object-fit: cover`, **blur** (`max(10px, 1cqmin)`), **scale 1.05**, scrim ~58% (`data-backdrop="release-art"` на `.coverSplitBg`).
  - **Custom media** (`custom_media` + загруженный файл, `isTrackCoverCustomMediaBackdrop`): **без blur и без scale** — чистый cover; scrim ~58% сохраняется (`data-backdrop="custom"`).
- **MP4:** `drawCoverSplitBackdrop` — blur + scale 1.05 только если нет отдельных `coverSplitBackdropImage` / `coverSplitBackdropVideo` в assets (т.е. fallback на обложку).
- **YouTube:** ряд — карточка обложки + текст; сторона карточки — `youtubeCoverSide` (`left` \| `right`).
- **TikTok:** карточка **фиксирована** сверху или снизу (`tiktokCoverPosition`); текст — в отдельном `previewLyricOverlay` (не внутри карточки), с отступами под размер карточки.
- Масштаб в preview: **container queries** (`cqw`, `cqh`, `cqmin`), `line-height` числом (1.45 / 1.5).

Если URL фона нет — заглушка «No background».

### Custom video — клип на таймлайне песни (вторая дорожка плеера)

**`customBackgroundKind === 'video'`** при `backgroundSource === 'custom'` **или** при track cover + `trackCoverBackdropSource === 'custom_media'`. Вторая строка в `AudioPlayer` (`mediaRow` + `ClipRangeTimeline` без waveform).

| Поле store | Описание |
|------------|----------|
| `customBackgroundDurationSec` | Длительность исходного файла (probe при загрузке / restore) |
| `customBackgroundClipStartSec` | Начало **окна на оси песни** (`track.durationSec`) |
| `customBackgroundClipDurationSec` | Длина окна на оси песни; max = `min(media, track)` |

**Шкала второй дорожки:** `contentEndSec` = **`track.durationSec`** (как у аудио), не длина видеофайла. Playhead = время песни; seek по второй дорожке **перематывает аудио** (`seekTo`).

**Воспроизведение / MP4:** `resolveBackgroundMediaPlaybackTimeSec(songTime, clipStart, clipDuration, mediaDuration)` — время песни → позиция в файле; при окне длиннее ролика — **loop** внутри `min(clipDuration, mediaDuration)`.

**Clamp:** `clampBackgroundMediaClipSettings(timelineDurationSec, mediaDurationSec, …)` в `src/utils/backgroundMediaClip.ts`. При появлении `track.durationSec` (metadata, restore) клип пересчитывается (`setDurationSec`, `buildVideoSettingsFromBlob`).

**UI:** `isBackgroundVideoClipable` — показ второй дорожки; GIF по-прежнему может быть фоном без отдельного таймлайна.

Константа мин. длины сегмента: `BACKGROUND_MEDIA_CLIP_MIN_SEC` (`backgroundMediaClip.ts`).

### Видимость блоков cover в сайдбаре

| Блок | Условие показа |
|------|----------------|
| **Track info under cover** | `backgroundSource === 'track_cover'` **и** есть `track.coverObjectUrl` |
| **Cover layout** (YouTube / TikTok) | То же + выбранный формат (`youtube` → сторона карточки; `tiktok` → позиция) |

При **Custom media** (image/video) или track cover без файла обложки в Options эти секции **не рендерятся** (`isTrackCoverLayout` в `VideomakerPanel.tsx`). Значения в store (`showTrackInfoUnderCover`, `youtubeCoverSide`, `tiktokCoverPosition`) сохраняются в persistence и снова применяются при возврате к track cover.

---

## Track info under cover

Подпись метаданных трека **под квадратной карточкой обложки** в режиме **cover-split** (`track_cover` + image cover).

| Поле store | Default | UI |
|------------|---------|-----|
| `showTrackInfoUnderCover` | `false` | Секция **Track info under cover** — chips **Show** / **Hide** (`TrackInfoUnderCoverPicker.tsx`) |

**Текст:** `formatTrackInfoLabel(artist, title)` → `Artist — Title` (пустые части опускаются; если обе пусты — блок не показывается даже при Show).

**Preview:** колонка карточки (`coverSplitCoverColumn` в `VideomakerPanel.module.scss`) — карточка + `coverSplitTrackInfo` под ней; типографика в духе кадра (белый текст, тень).

**MP4:** `drawFrame.ts` после отрисовки карточки вызывает `drawTrackInfoUnderCover` (`canvasDraw.ts`) — тот же label, перенос по ширине карточки, `line-height` 1.45, шрифт **Rubik 600** (как в export layout).

**Не входит:** режим full-bleed custom/track без split; TikTok social overlay.

Persistence: `showTrackInfoUnderCover` в `videoSettings` (localStorage).

---

## Lyric visual effects (Glow / Outline / Cut out)

Секция **Lyric effects** в сайдбаре (`LyricEffectsPicker.tsx`).

| Правило | Реализация |
|---------|------------|
| Одновременно **не больше одного** эффекта | `normalizeLyricVisualEffects`, `lyricEffectsWithSingle` (`videoLyricEffects.ts`) |
| ID | `glow` \| `outline` \| `cutOut` → `VideoSettings.lyricEffects` |

**Cut out:** луч по диагонали 45°, длина луча **`LYRIC_CUTOUT_LENGTH_PX` = 1000** (export px), заливка `LYRIC_CUTOUT_FILL`.

**Glow:** анимированный shimmer; скорость **`LYRIC_GLOW_CHARS_PER_SEC`**, 4 источника, сид от `lineId` (`lyricGlowWave.ts`, `useGlowMotionTimeSec.ts`, `GlowLyricChars.tsx`).

**Цвета эффектов:** `VideoSettings.lyricEffectColor` — 12 пресетов + **custom** (`lyricEffectColors.ts`, `LyricEffectColorSettings`). Палитра влияет на glow/outline/cut out и **лёгкий tint фона** (`LYRIC_EFFECT_BG_TINT_OPACITY` = **0.1**) — preview: `LyricEffectBackgroundTint.tsx`, export: `drawLyricEffectBackgroundTint`.

Preview + MP4: `lyricVisualEffectsStyle.ts`, `lyricCanvasEffects.ts`, `canvasDraw.ts` / `AnimatedPreviewLyric`.

Persistence: `lyricEffects`, `lyricEffectColor` в `videoSettings` (localStorage); нормализация в `sessionPersistence.ts`.

---

## Layout текста (пункт 3)

`VideoSettings`:

| Поле | Значения | UI |
|------|----------|-----|
| `lyricVerticalAlign` | `top` \| `center` \| `bottom` | Lyric position → Vertical |
| `lyricHorizontalAlign` | `left` \| `center` \| `right` | Lyric position → Horizontal |
| `lyricFontSize` | `small` \| `medium` \| `large` | Lyric position → **Text size** |
| `lyricFontId` | см. каталог ниже | **Lyric font** (блок **после** Lyric position) |
| `lyricAnimationPreset` | см. §Lyric entrance | **Lyric entrance** — плитки + **No animation** (иконка ban) |
| `tiktokClipDurationSec` / `tiktokClipStartSec` | 15–45 s, start ≥ 0 | Только TikTok — **нижний плеер**, §TikTok short clip |

Константы: `src/constants/videoLyricLayout.ts`, `src/constants/videoLyricFontSize.ts`, `src/constants/videoLyricFonts.ts`, `src/constants/videoLyricAnimation.ts`, `src/constants/tiktokClip.ts`.

**Порядок блоков в сайдбаре (сверху вниз):** Video format → Background → (при track cover) **Track info under cover** → (при track cover) **Cover layout** → Lyric position → Lyric font → Lyric entrance → **Lyric effects**.

### Каталог шрифтов (Google Fonts)

Загрузка: `src/styles/lyricFonts.scss` (импорт в `main.tsx`). Категории в UI = **optgroup** в `LyricFontPicker`.

В UI один общий грид (39 семейств, сортировка по имени). В коде категории `catalog` / `alt_character` остаются для данных; default: **Rubik**.

Preview: CSS `--lyric-font-family`. Export: `ensureLyricFontLoaded` + `drawLyricInBox` с тем же family.

- **Medium** — базовый размер (как до фичи).
- **Small** — ×**0.8** (−20%).
- **Large** — ×**1.2** (+20%).
- Preview: CSS-переменная `--lyric-font-scale` на `previewBox`, атрибут `data-lyric-size`.
- Export: те же множители в `drawFrame.ts` (`scaleLyricFontPx`).

Атрибуты на `previewBox`: `data-lyric-v`, `data-lyric-h`, `data-lyric-size`.

---

## Lyric entrance (анимация строки)

**UI:** секция **Lyric entrance** в колонке настроек (`LyricAnimationPicker.tsx`).

| Элемент | Поведение |
|---------|-----------|
| **No animation** | Первая плитка в гриде, иконка «запрет»; `lyricAnimationPreset === 'none'` (default). |
| Пресеты (10) | Плитки с зацикленным превью **Aa** (CSS loop keyframes, ~1.1 s). |

**ID пресетов** (`LyricAnimationPresetId`): `fade_in`, `rise_up`, `drop_down`, `scale_in`, `pop`, `blur_in`, `bounce`, `elastic`, `glitch`, `zoom_blur`.

**Не в каталоге (удалены из UI):** slide left/right, spin in, drift, flicker — старые id в persistence нормализуются в `none` через `sessionPersistence.ts` / валидатор пресета.

**Длительность фазы входа и выхода:** `LYRIC_ANIMATION_DURATION_SEC` = **0.45 s** (константа в `videoLyricAnimation.ts`).

### Вход и выход

Для каждого пресета (кроме `none`):

- **Вход** — первые 0.45 s после `startTimeSec` строки.
- **Выход** — последние 0.45 s до конца показа строки.

**Конец строки** (`lineEndSec` в `getActiveLyricStateAtTime`):

- `lines[i+1].startTimeSec`, если есть следующая синхронизированная строка;
- иначе `lyricsEndTimeSec` из Liricks (если задан);
- иначе выход не анимируется (строка держится до смены контекста).

Если длительность строки **&lt; 0.9 s**, вход и выход делят таймлайн пополам (первая половина — вход, вторая — выход).

**Поведение по пресетам (выход — зеркало / логическое продолжение входа):**

| Пресет | Вход (кратко) | Выход (кратко) |
|--------|----------------|----------------|
| Fade in | opacity 0→1 | opacity 1→0 |
| Rise up | снизу вверх + fade | вверх + fade |
| Drop down | сверху вниз + fade | вниз + fade |
| Scale in | scale 0.35→1 + fade | **scale 1→~1.72**, blur, fade («растворение») |
| Pop | pop-in (ease back) | сжатие + fade |
| Blur in | blur→0 + fade | blur↑ + fade |
| Bounce | отскок снизу | лёгкое падение вниз + fade |
| Elastic | elastic scale-in | elastic shrink + fade |
| Glitch | jitter-in | jitter-out + fade |
| Zoom blur | zoom out + blur-in | zoom in + blur-out + fade |
| Random words · fade | — | слова по одному: случайный **момент** старта в коротком burst, быстрый fade (база `fade_in`) |
| Random words · rise | — | то же, база `rise_up` |
| Random words · pop | — | то же, база `pop` |

**Random words:** порядок появления **не** по тексту — у каждого слова свой offset в окне ~0.26–0.65 s (масштаб `WORD_RANDOM_TIMING_SCALE` ≈ 1.3), вход слова ~0.23 s; сид от `lineId` (preview = MP4). Пока burst не завершён, строка читается с трудом. Реализация: `lyricWordAnimation.ts`, `splitLyricIntoWords`; preview — `AnimatedPreviewLyric` (span на слово); MP4 — `drawWordAnimatedLyricInBox` в `canvasDraw.ts`.

### Реализация (preview + MP4)

| Слой | Файлы |
|------|--------|
| Единая математика трансформа | `src/utils/lyricAnimationTransform.ts` — `getLyricAnimationTransform(preset, timeSec, lineStartSec, lineEndSec, fontSize)` |
| Активная строка + границы | `src/utils/activeLyricLine.ts` — `lineStartSec`, `lineEndSec` |
| Preview (DOM) | `AnimatedPreviewLyric.tsx` — inline `transform` / `opacity` / `filter` из `lyricAnimationTransformToStyle` |
| Плавное время в preview | `src/hooks/useAudioDrivenTimeSec.ts` — при play **rAF** + `audio.currentTime` (~60 fps); на паузе/seek — `previewTimeSec` с плеера (событие `timeupdate` ~4 Hz недостаточно для анимации) |
| MP4 | `drawFrame.ts` → `drawLyricInBox` / `drawWordAnimatedLyricInBox` (`drawLyricForRuntime`) |
| Плитки пикера | `LyricAnimation.module.scss` — enter keyframes + `*-loop` для превью; `lyricAnimationClass.ts` |

**Ограничение:** canvas-рендер приближён к CSS preview (blur/transform вокруг центра бокса текста); pixel-perfect не гарантируется.

---

## TikTok: кадр, обложка и UI preview

### Track cover (вертикальный TikTok)

Когда `formatId === 'tiktok'`, `backgroundSource === 'track_cover'` и есть обложка:

| Слой | Содержимое |
|------|------------|
| Фон | Backdrop как в §cover-split: release art — blur + scale; custom backdrop — cover без blur/scale; scrim ~58% |
| Карточка | Квадратная обложка (`tiktokCoverPosition`: **top** или **bottom**), скругление + тень |
| Текст | Активная строка в **`previewLyricOverlay`** (не внутри карточки), отступы под позицию карточки |
| Track info (опц.) | `Artist — Title` под карточкой при **Show** (`showTrackInfoUnderCover`) |

Горизонтальный **YouTube** — см. §Background (ряд: текст + карточка, сторона `youtubeCoverSide`).

Масштаб типографики и отступов — **container queries** на `previewBox` (`cqw` / `cqh`).

### Откат PNG-оверлея «как в приложении»

Пробовали наложение **готового PNG** (рамка телефона + UI TikTok / вырезанные side + bottom bar). **Отклонено и удалено из кода:**

- не используем `tiktok-ui-overlay.png`, `tiktok-ui-side.png`, `tiktok-ui-bottom.png`;
- **не** накладываем full-frame картинку поверх `[data-videomaker-export-root]`;
- низ tab bar из мока **не** дублируем отдельным asset.

Причина: нужен чистый **контент кадра** (фон + обложка + лирика) для MP4; «оболочка приложения» мешала preview и не должна попадать в export.

### TikTok social overlay (только preview, CSS)

Вместо PNG — компонент **`TikTokSocialOverlay`** (`src/components/videomaker/overlay/`):

| Элемент | Данные |
|---------|--------|
| Top tabs | Following / For You (декор) |
| Right rail | Аватар, like / comment / bookmark / share (статичные счётчики-заглушки) |
| Bottom meta | `@handle` из **Artist**, caption из **Title**, строка Original sound |

**Условие:** `formatId === 'tiktok'`.

**DOM / export:**

```
previewFrameWrap
├── [data-videomaker-export-root]  → VideoPreviewFrame  →  попадает в MP4
└── TikTokSocialOverlay (absolute, inset 0)               →  только preview
```

- Оверлей — **сосед** export root внутри `previewFrameWrap`, не ребёнок `data-videomaker-export-root`.
- Стили: `TikTokSocialOverlay.module.scss`, единицы **cqw/cqh** (тот же container, что у кадра).
- **`pointer-events: none`**, `aria-hidden` — не мешает кликам по preview.
- В **MP4 не входит** (экспорт рисует только содержимое export root через `drawFrame.ts`).

**Не путать с:** lyric overlay (`previewLyricOverlay`) — это **текст песни** внутри кадра и **входит** в export.

---

## Preview playback (нижний dock)

**Liricks:** `AudioPlayer` на **всю ширину** окна (`position: fixed`, `left: 0`).

**Videomaker:** тот же `AudioPlayer` (`embedded`), но только в **`mainColumn`** (см. §Компоновка вкладки).

| Ряд | Условие | UI |
|-----|---------|-----|
| Аудио | Всегда при загруженном audio | `SimpleWaveformSeek` или `ClipRangeTimeline` + waveform (`WaveformBars`) |
| Видео | `isBackgroundVideoClipable` + известны `track.durationSec` и `customBackgroundDurationSec` | Вторая строка: `ClipRangeTimeline` **без** waveform, метка ▦ |

- Waveform: `useAudioWaveformPeaks` — RMS, нормализация по перцентилю, на **всю** длину трека.
- Seek: клик и drag playhead (`usePointerTimelineSeek`); обёртка `timelineSlot` (`flex: 1`) — дорожка не схлопывается по ширине.
- **TikTok:** `clipConfig` на **верхнем** ряду — клип экспорта 15–45 s (§TikTok short clip).
- **Custom video:** `mediaClipConfig` на **нижнем** ряду — клип фона на оси песни (§Custom video).

---

## Preview: активная строка и время

- Проект: `buildLyricsProject(track, lines, lyricsEndTimeSec)`.
- Состояние строки: `getActiveLyricStateAtTime(lines, timeSec, lyricsEndTimeSec)` → `text`, `lineId`, `lineStartSec`, `lineEndSec`.
- До первой строки и после **End lyrics** — пустой текст.
- Custom **video** bg: `backgroundPlaybackTimeSec` из `resolveBackgroundMediaPlaybackTimeSec` + `previewTimeSec`; иначе фон следует времени трека (`VideoPreviewBackground`).
- Текст и анимация: `VideoPreviewFrame` → `AnimatedPreviewLyric` (передаётся `audioRef`, `lines`, `lyricsEndTimeSec`); время кадра для лирики — **не** только `previewTimeSec` из state панели.

---

## WorkflowHeader (действия справа)

| Кнопка | Шаги | Поведение |
|--------|------|-----------|
| **Reset session** | Все | Модалка `ConfirmDialog` (`src/components/layout/confirm/ConfirmDialog.tsx`): сброс store, `localStorage` + IndexedDB blobs (`resetApplicationSession` в `sessionPersistence.ts`); переход на **Options**. Пауза плеера (`requestPlaybackPause`). Disabled во время MP4 export / пока идёт reset. |
| **Next: …** | Options, Liricks | Gating (`workflowReadiness.ts`). |
| **Download video** | Videomaker | См. §Экспорт MP4; перед стартом — **пауза** preview/аудио (`requestPlaybackPause` → `playbackPauseSignal` в store, `AudioPlayer`). |

---

## Экспорт MP4

**Триггер:** WorkflowHeader → **Download video** (см. §WorkflowHeader).

**Стек:**

| Слой | Реализация |
|------|------------|
| Отрисовка кадра | `src/utils/videoExport/drawFrame.ts` (логика раскладок как в preview) |
| Кодирование | **mediabunny** — `CanvasSource` (AVC) + `AudioBufferSource` (AAC) |
| Выход | `Mp4OutputFormat` → `BufferTarget` → Blob `video/mp4` |

**Параметры:**

- **60 fps** (`EXPORT_FPS` в `exportLyricVideo.ts`), офлайн-цикл по кадрам (без реального воспроизведения во время кодирования).
- Длительность: **YouTube** — `lyricsEndTimeSec` ?? `durationSec` ?? декодированное аудио; **TikTok** — длина клипа (`resolveTiktokExportWindow` по полному `decodedAudio.duration`).
- Для video-фона: на каждый кадр `drawExportFrame` → **`await seekBackgroundVideo`** до `drawImage` (`loadAssets.ts`). Порог пропуска seek **`SEEK_TIME_EPSILON_SEC = 1/240`** (меньше шага кадра 1/60 s), иначе фон «залипает» и визуально ~15–20 fps при 30/60 fps экспорта.
- Клип custom video в export: те же `customBackgroundClipStartSec` / `customBackgroundClipDurationSec` / `customBackgroundDurationSec`, что в preview (`drawFrame.ts`).
- Имя файла: `{Song title}.mp4` (`buildVideoDownloadFileName` в `exportLyricVideo.ts`).
- Метаданные MP4: title / artist из `TrackMeta`.
- Анимация строк: `videoSettings.lyricAnimationPreset` + `lineEndSec` на каждом кадре (см. §Lyric entrance).

**Проверки:** `getVideoExportBlockers` — аудио, ≥1 синхронизированная строка; при `backgroundSource === 'track_cover'` — обложка в Options; при `custom` — загруженный custom background file.

**Блокировка UI на время экспорта:**

- Компонент `ExportBlockingOverlay` (портал на `document.body`, `z-index` поверх всего приложения).
- **Во время кодирования:** спиннер, «Exporting video», подсказка не закрывать вкладку, progress bar + проценты.
- **После успешного скачивания:** оверлей **не скрывается** — «Download ready», галочка, 100%; закрытие — **×** в правом верхнем углу карточки или **Escape**.
- `document.body.style.overflow = 'hidden'`; корень `data-app-shell` получает **`inert`** пока оверлей открыт (ссылки Boosty/Band.link внутри портала кликабельны).
- Состояние в `WorkflowHeader`: `showExportOverlay`, `exportInProgress`, `exportFinished`, `exportProgress`. При ошибке export — оверлей снимается, текст ошибки в header.

**Поддержка проекта в оверлее** (две карточки, сетка 2 колонки / на узком экране столбик):

| Карточка | QR | Кнопка | URL (константа) |
|----------|-----|--------|------------------|
| Boosty | `src/assets/boosty-donate-qr.png` | Support on Boosty (primary) | `BOOSTY_DONATE_URL` |
| Band.link | `src/assets/band-link-qr.png` | Open Band.link | `BAND_LINK_URL` |

Файл констант: `src/constants/projectSupport.ts`. Подписи и кнопки — английский UI.

**Ограничение:** нужны WebCodecs H.264/AAC; иначе сообщение об ошибке в header.

Canvas-рендер приближён к preview; pixel-perfect совпадение с CSS не гарантируется.

---

## Persistence

В `localStorage` (вложено в `videoSettings`): `formatId`, `backgroundSource`, `trackCoverBackdropSource`, `youtubeCoverSide`, `tiktokCoverPosition`, `lyricVerticalAlign`, `lyricHorizontalAlign`, `lyricFontSize`, `lyricFontId`, `lyricAnimationPreset`, **`lyricEffects`**, **`lyricEffectColor`**, `tiktokClipDurationSec`, `tiktokClipStartSec`, `showTrackInfoUnderCover`, **`customBackgroundDurationSec`**, **`customBackgroundClipStartSec`**, **`customBackgroundClipDurationSec`**; blob custom bg — IndexedDB.

При restore клип видео clamp’ится с учётом **`track.durationSec`** (`buildVideoSettingsFromBlob`).

Невалидный `lyricAnimationPreset` → fallback `none`; эффекты и цвет — `normalizePersistedLyricEffects` / `normalizeLyricEffectColorSettings` (`sessionPersistence.ts`).

---

## История (Videomaker)

| Дата | Изменение |
|------|-----------|
| 2026-10-04 | Cover-split TikTok: статичная карточка + lyric overlay; YouTube cover side. |
| 2026-10-04 | Social overlay только preview; export root без overlay. |
| 2026-10-04 | Офлайн MP4 export (mediabunny), имя по title трека. |
| 2026-10-04 | Полноэкранный blocking overlay на время export. |
| 2026-10-05 | Text size small / medium / large для текста на кадре. |
| 2026-10-05 | **Lyric font:** грид плиток Aa, 39 Google Fonts (`videoLyricFonts.ts`, `lyricFonts.scss`), default Rubik. |
| 2026-10-05 | **Lyric entrance:** 10 пресетов + No animation (плитка ban); вход/выход 0.45 s; preview (rAF) + MP4 (`lyricAnimationTransform.ts`). |
| 2026-10-05 | **Scale in** exit: увеличение + blur + fade. Preview: `useAudioDrivenTimeSec` вместо `timeupdate` для плавности. |
| 2026-10-07 | **Export overlay:** после MP4 остаётся открытым до × / Escape; Boosty + Band.link с QR; `projectSupport.ts`. |
| 2026-10-13 | **TikTok short clip** на плеере (15–45 s); экспорт среза; `tiktokExportWindow.ts`. |
| 2026-10-13 | **Waveform** на таймлайне плеера; drag seek playhead. |
| 2026-10-13 | **Random words** (fade / rise / pop); `lyricWordAnimation.ts`. |
| 2026-10-13 | Сайдбар: Lyric position перед Lyric font. |
| 2026-10-14 | **Lyric effects:** Glow / Outline / Cut out (взаимоисключающие), палитры + custom, tint фона 10%. |
| 2026-10-14 | **Custom video clip:** вторая дорожка плеера, ось = длина трека; probe + store; preview/export loop. |
| 2026-10-14 | **Макет Videomaker:** dock только в `mainColumn`, сайдбар на полную высоту (без fixed на весь viewport). |
| 2026-10-14 | **MP4 export:** 60 fps; fix seek фонового video (`SEEK_TIME_EPSILON_SEC`). |
| 2026-10-16 | **Track info under cover:** Show/Hide, preview + MP4; `formatTrackInfoLabel`, `drawTrackInfoUnderCover`. |
| 2026-10-16 | **Сайдбар:** Track info и Cover layout только при `track_cover` + обложка; скрыты для custom media. |
| 2026-10-16 | **UI:** все пикеры на `Section`; реорганизация `src/components/` (panel/pickers/preview/…). |
| 2026-10-16 | **Lyric entrance:** сокращён набор пресетов; No animation — плитка ban; плавный preview (rAF). |
| 2026-10-16 | **Док:** §TikTok — track cover vertical, откат PNG UI, граница export root vs `TikTokSocialOverlay`. |
| 2026-10-20 | **Track cover backdrop:** `trackCoverBackdropSource` + custom file за карточкой; preview `CoverSplitBackdrop`; export `loadExportMediaAssets` + `drawCoverSplitBackdrop`. |
| 2026-10-20 | **Custom backdrop:** без blur/scale (`isTrackCoverCustomMediaBackdrop`); release art — blur + scale 1.05. |
| 2026-10-20 | **WorkflowHeader:** **Reset session** + `ConfirmDialog`; **Download video** останавливает воспроизведение (`playbackPauseSignal`). |
