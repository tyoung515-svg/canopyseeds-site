import en from './en.json';
import es from './es.json';
import zhHans from './zh-Hans.json';
import ja from './ja.json';
import pt from './pt.json';

export const defaultLang = 'en' as const;

// Canonical string source of truth. `en` is the reference schema every other
// locale mirrors. The KMM app consumes these same files (see nav/footer/common
// namespaces). Never translate or reorder the keys, only the values.
export const languages = {
  en,
  es,
  'zh-Hans': zhHans,
  ja,
  pt,
} as const;

export type Lang = keyof typeof languages;

export const locales = Object.keys(languages) as Lang[];
export const nonDefaultLocales = locales.filter((l) => l !== defaultLang);

export const langLabels: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  'zh-Hans': '简体中文',
  ja: '日本語',
  pt: 'Português',
};

/** Read the active locale from a URL path (e.g. /es/knowledge -> 'es'). */
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/')[1];
  return (locales as string[]).includes(seg) ? (seg as Lang) : defaultLang;
}

/** t('home.hero.lede') with per-key English fallback, so a locale JSON can ship partial. */
export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    const lookup = (o: any): unknown =>
      key.split('.').reduce((acc: any, k) => (acc == null ? acc : acc[k]), o);
    const val = lookup(languages[lang]);
    if (typeof val === 'string') return val;
    const fallback = lookup(languages[defaultLang]);
    return typeof fallback === 'string' ? fallback : key;
  };
}

// --- content-collection helpers: entry.id is "<locale>/<slug>" after the Phase 3 move.
// Both helpers tolerate a bare "<slug>" id (pre-move) and treat it as English.
export const localeOf = (entry: { id: string }): Lang => {
  const seg = entry.id.split('/')[0];
  return (locales as string[]).includes(seg) ? (seg as Lang) : defaultLang;
};

export const slugOf = (entry: { id: string }): string => {
  const parts = entry.id.split('/');
  return (locales as string[]).includes(parts[0]) ? parts.slice(1).join('/') : entry.id;
};

/** Localized entry for (locale, slug), falling back to the English entry. */
export function pickEntry<T extends { id: string }>(
  all: T[],
  locale: Lang,
  slug: string,
): T | undefined {
  return (
    all.find((e) => localeOf(e) === locale && slugOf(e) === slug) ??
    all.find((e) => localeOf(e) === defaultLang && slugOf(e) === slug)
  );
}
