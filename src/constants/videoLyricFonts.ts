export type LyricFontCategoryId = 'catalog' | 'alt_character';

export type LyricFontId =
  | 'russo_one'
  | 'oswald'
  | 'unbounded'
  | 'archivo_black'
  | 'rubik'
  | 'manrope'
  | 'orbitron'
  | 'fira_sans'
  | 'comfortaa'
  | 'montserrat'
  | 'merriweather'
  | 'playfair_display'
  | 'amatic_sc'
  | 'pt_sans'
  | 'pt_serif'
  | 'roboto_slab'
  | 'ubuntu'
  | 'cuprum'
  | 'exo_2'
  | 'neucha'
  | 'alegreya'
  | 'stalinist_one'
  | 'rubik_dirt'
  | 'rubik_glitch'
  | 'rubik_spray_paint'
  | 'rubik_burned'
  | 'rubik_broken_fax'
  | 'rubik_vinyl'
  | 'rubik_microbe'
  | 'tektur'
  | 'days_one'
  | 'kelly_slab'
  | 'poiret_one'
  | 'ruslan_display'
  | 'prosto_one'
  | 'yeseva_one'
  | 'podkova'
  | 'press_start_2p'
  | 'jura';

export type LyricFontDefinition = {
  id: LyricFontId;
  label: string;
  family: string;
  googleFamily: string;
};

export type LyricFontCategory = {
  id: LyricFontCategoryId;
  label: string;
  fonts: LyricFontDefinition[];
};

const font = (
  id: LyricFontId,
  label: string,
  family: string,
  googleFamily: string,
): LyricFontDefinition => ({ id, label, family, googleFamily });

const CATALOG_FONTS: LyricFontDefinition[] = [
  font('russo_one', 'Russo One', 'Russo One', 'Russo+One'),
  font('oswald', 'Oswald', 'Oswald', 'Oswald'),
  font('unbounded', 'Unbounded', 'Unbounded', 'Unbounded'),
  font('archivo_black', 'Archivo Black', 'Archivo Black', 'Archivo+Black'),
  font('rubik', 'Rubik', 'Rubik', 'Rubik'),
  font('manrope', 'Manrope', 'Manrope', 'Manrope'),
  font('orbitron', 'Orbitron', 'Orbitron', 'Orbitron'),
  font('fira_sans', 'Fira Sans', 'Fira Sans', 'Fira+Sans'),
  font('comfortaa', 'Comfortaa', 'Comfortaa', 'Comfortaa'),
  font('montserrat', 'Montserrat', 'Montserrat', 'Montserrat'),
  font('merriweather', 'Merriweather', 'Merriweather', 'Merriweather'),
  font(
    'playfair_display',
    'Playfair Display',
    'Playfair Display',
    'Playfair+Display',
  ),
  font('amatic_sc', 'Amatic SC', 'Amatic SC', 'Amatic+SC'),
  font('pt_sans', 'PT Sans', 'PT Sans', 'PT+Sans'),
  font('pt_serif', 'PT Serif', 'PT Serif', 'PT+Serif'),
  font('roboto_slab', 'Roboto Slab', 'Roboto Slab', 'Roboto+Slab'),
  font('ubuntu', 'Ubuntu', 'Ubuntu', 'Ubuntu'),
  font('cuprum', 'Cuprum', 'Cuprum', 'Cuprum'),
  font('exo_2', 'Exo 2', 'Exo 2', 'Exo+2'),
  font('neucha', 'Neucha', 'Neucha', 'Neucha'),
  font('alegreya', 'Alegreya', 'Alegreya', 'Alegreya'),
];

const ALT_CHARACTER_FONTS: LyricFontDefinition[] = [
  font('stalinist_one', 'Stalinist One', 'Stalinist One', 'Stalinist+One'),
  font('rubik_dirt', 'Rubik Dirt', 'Rubik Dirt', 'Rubik+Dirt'),
  font('rubik_glitch', 'Rubik Glitch', 'Rubik Glitch', 'Rubik+Glitch'),
  font(
    'rubik_spray_paint',
    'Rubik Spray Paint',
    'Rubik Spray Paint',
    'Rubik+Spray+Paint',
  ),
  font('rubik_burned', 'Rubik Burned', 'Rubik Burned', 'Rubik+Burned'),
  font(
    'rubik_broken_fax',
    'Rubik Broken Fax',
    'Rubik Broken Fax',
    'Rubik+Broken+Fax',
  ),
  font('rubik_vinyl', 'Rubik Vinyl', 'Rubik Vinyl', 'Rubik+Vinyl'),
  font('rubik_microbe', 'Rubik Microbe', 'Rubik Microbe', 'Rubik+Microbe'),
  font('tektur', 'Tektur', 'Tektur', 'Tektur'),
  font('days_one', 'Days One', 'Days One', 'Days+One'),
  font('kelly_slab', 'Kelly Slab', 'Kelly Slab', 'Kelly+Slab'),
  font('poiret_one', 'Poiret One', 'Poiret One', 'Poiret+One'),
  font('ruslan_display', 'Ruslan Display', 'Ruslan Display', 'Ruslan+Display'),
  font('prosto_one', 'Prosto One', 'Prosto One', 'Prosto+One'),
  font('yeseva_one', 'Yeseva One', 'Yeseva One', 'Yeseva+One'),
  font('podkova', 'Podkova', 'Podkova', 'Podkova'),
  font('press_start_2p', 'Press Start 2P', 'Press Start 2P', 'Press+Start+2P'),
  font('jura', 'Jura', 'Jura', 'Jura'),
];

export const LYRIC_FONT_CATEGORIES: LyricFontCategory[] = [
  {
    id: 'catalog',
    label: 'Fonts',
    fonts: CATALOG_FONTS,
  },
  {
    id: 'alt_character',
    label: 'Alt / punk / experimental',
    fonts: ALT_CHARACTER_FONTS,
  },
];

export const DEFAULT_LYRIC_FONT_ID: LyricFontId = 'rubik';

const fontById = new Map<LyricFontId, LyricFontDefinition>();

LYRIC_FONT_CATEGORIES.forEach((category) => {
  category.fonts.forEach((entry) => {
    if (!fontById.has(entry.id)) {
      fontById.set(entry.id, entry);
    }
  });
});

export const isLyricFontId = (value: string): value is LyricFontId =>
  fontById.has(value as LyricFontId);

export const getLyricFontDefinition = (id: LyricFontId): LyricFontDefinition =>
  fontById.get(id) ?? fontById.get(DEFAULT_LYRIC_FONT_ID)!;

export const getLyricFontFamily = (id: LyricFontId): string =>
  getLyricFontDefinition(id).family;

export const getLyricFontCssFamily = (id: LyricFontId): string =>
  `"${getLyricFontFamily(id)}", system-ui, sans-serif`;

export const LYRIC_FONT_GOOGLE_FAMILIES_QUERY = [...fontById.values()]
  .map((entry) => `family=${entry.googleFamily}`)
  .join('&');

export const ALL_LYRIC_FONTS: LyricFontDefinition[] = [...fontById.values()].sort(
  (a, b) => a.label.localeCompare(b.label, 'en'),
);
