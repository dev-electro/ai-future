/**
 * pages/[lang]/index.js
 * Handles /en, /hi, /es, /fr, /de, /pt, /ja, /ar, /zh
 * Passes detected/selected language to the App component.
 */
import Head from "next/head";
import App from "../../components/AIJobAnalyzer";
import { SUPPORTED_LANGS, LANG_META } from "../../lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-exposure-index.vercel.app";

export default function LangPage({ lang }) {
  const meta = LANG_META[lang] || LANG_META.en;
  const isRTL = meta.dir === "rtl";

  return (
    <>
      <Head>
        <title>AI Future — Will AI Replace Your Job? | {meta.nativeName}</title>
        <meta name="description" content="Research-backed AI job displacement risk scores for 800+ occupations. Based on Anthropic's 2026 labor market study." />
        <link rel="canonical" href={`${SITE_URL}/${lang}`} />
        <meta property="og:url" content={`${SITE_URL}/${lang}`} />
        <meta httpEquiv="Content-Language" content={lang} />
        {/* Alternate language links for SEO */}
        {SUPPORTED_LANGS.map(l => (
          <link key={l} rel="alternate" hrefLang={l} href={`${SITE_URL}/${l}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        {isRTL && <style>{`html { direction: rtl; }`}</style>}
      </Head>
      <App initialLang={lang} />
    </>
  );
}

export async function getStaticProps({ params }) {
  const lang = SUPPORTED_LANGS.includes(params.lang) ? params.lang : "en";
  return { props: { lang } };
}

export async function getStaticPaths() {
  return {
    paths: SUPPORTED_LANGS.map(lang => ({ params: { lang } })),
    fallback: false,
  };
}
