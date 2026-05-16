/**
 * pages/index.js — Root page
 * Serves English by default with full SEO metadata.
 * Language selection is handled client-side in the App component.
 * /en, /hi, /es etc. serve language-specific pages via [lang]/index.js.
 */
import Head from "next/head";
import App from "../components/AIJobAnalyzer";
import { SUPPORTED_LANGS } from "../lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aifuture.docset.in";
const TITLE = "AI Job Risk Score + Career Action Plan — AI Future (Free)";
const DESCRIPTION = "Is your job at risk from AI? Get a research-backed 0–100 risk score for any occupation plus a personalised 3-step Career Action Plan — free, instant, no signup. Based on Anthropic's 2026 labor market study across 800+ jobs.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

/* ── 1. WebApplication — "Free App" panel in Google ──────────────────────── */
const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Future",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "All",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  inLanguage: SUPPORTED_LANGS,
  featureList: [
    "3-tab Career Action Plan: Stay & Adapt, Lateral Moves, Bold Pivot — personalised per occupation",
    "AI job displacement risk scores (0–100) for 800+ occupations",
    "AI-powered risk analysis backed by 2026 Anthropic labor market research",
    "BLS employment projections and growth rates per occupation",
    "Personalized scores based on described work tasks and context",
    "Full leaderboard of 40 occupations ranked by AI exposure",
    "Available in 9 languages: English, Hindi, Spanish, French, German, Portuguese, Japanese, Arabic, Chinese",
  ],
  screenshot: `${SITE_URL}/og-image.png`,
  author: { "@type": "Organization", name: "AI Future", url: SITE_URL },
};

/* ── 2. FAQPage — 8 questions for rich accordion results ─────────────────── */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question", name: "Will AI replace my job?",
      acceptedAnswer: { "@type": "Answer", text: "It depends on your occupation and specific tasks. Computer programmers (75% task coverage), customer service reps (70%), data entry keyers (67%), telemarketers (65%), and proofreaders (63%) face the highest AI displacement risk according to Anthropic's 2026 research. Physical and high-empathy roles like electricians and massage therapists score under 10 out of 100." }
    },
    {
      "@type": "Question", name: "Which jobs are most at risk from AI automation in 2026?",
      acceptedAnswer: { "@type": "Answer", text: "The highest-risk occupations by AI task coverage: Computer Programmers (75%), Customer Service Representatives (70%), Data Entry Keyers (67%), Telemarketers (65%), Proofreaders (63%), Tax Preparers (62%), Financial Analysts (60%), Paralegals (58%), Medical Transcriptionists (57%), Bookkeeping Clerks (55%). All data is sourced from Anthropic's Economic Index and O*NET task databases." }
    },
    {
      "@type": "Question", name: "Which jobs are safe from AI replacement?",
      acceptedAnswer: { "@type": "Answer", text: "Jobs with very low AI exposure include: Physical Therapists (score 15/100), Chef / Head Cook (12), Electrician (9), Plumber (7), Firefighter (6), Bartender (4), Lifeguard (3), Agricultural Worker (2), Massage Therapist (2). These roles require physical presence, empathy, and real-world dexterity that AI cannot currently replicate." }
    },
    {
      "@type": "Question", name: "Is AI causing unemployment in 2026?",
      acceptedAnswer: { "@type": "Answer", text: "As of early 2026, no statistically significant unemployment increase has been found for AI-exposed workers overall. However, Anthropic's research documents a 14% drop in new hiring for workers aged 22–25 entering high-exposure occupations post-ChatGPT. Entry-level white-collar workers are the most affected demographic." }
    },
    {
      "@type": "Question", name: "How is the AI job risk score calculated?",
      acceptedAnswer: { "@type": "Answer", text: "The score (0–100) combines three data sources: the O*NET task database (800+ US occupations), the Anthropic Economic Index (real Claude professional usage patterns from Aug/Nov 2025), and Eloundou et al. beta exposure scores. Fully automated use is weighted 1.0× and AI-augmented use is weighted 0.5×. A score of 75+ means AI can handle most of the role's tasks." }
    },
    {
      "@type": "Question", name: "Do higher-paid workers face more AI risk?",
      acceptedAnswer: { "@type": "Answer", text: "Yes — this is a reversal of historical automation patterns. Anthropic's 2026 research found that higher-wage occupations, particularly those requiring cognitive and analytical skills, face significantly higher AI exposure than lower-wage physical jobs. Workers in the top wage quartile are 3× more exposed than those in the bottom quartile." }
    },
    {
      "@type": "Question", name: "How should I future-proof my career against AI?",
      acceptedAnswer: { "@type": "Answer", text: "The AI Future provides a personalized Career Action Plan after each analysis. It includes three strategies: (1) Stay & Adapt — specializations and skills to build that are AI-resistant; (2) Lateral Moves — adjacent roles with lower AI exposure and similar skill requirements; (3) Bold Pivot — cross-domain career transitions where your current skills translate unexpectedly well. Each plan is generated live by AI using Anthropic's research framework." }
    },
    {
      "@type": "Question", name: "Is the AI Future free to use?",
      acceptedAnswer: { "@type": "Answer", text: "Yes, the AI Future is completely free. No account, email, or payment is required. You can analyze any job title and receive a full AI risk report including exposure score, task breakdown, BLS employment outlook, and a personalized Career Action Plan instantly. Available in 9 languages." }
    },
  ],
};

/* ── 3. HowTo — Featured snippet eligibility ─────────────────────────────── */
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Check If AI Will Replace Your Job",
  description: "Use the AI Future to get a free, research-backed risk score for any occupation in under 2 minutes.",
  totalTime: "PT2M",
  tool: [{ "@type": "HowToTool", name: "AI Future (free, no signup)" }],
  step: [
    { "@type": "HowToStep", position: 1, name: "Enter your job title", text: "Type any occupation — e.g. 'Software Engineer', 'Nurse', 'Graphic Designer' — into the search field on the Analyze page.", image: `${SITE_URL}/og-image.png` },
    { "@type": "HowToStep", position: 2, name: "Optionally describe your work", text: "Expand the work context panel and describe your daily tasks. This personalizes your score — a nurse who mainly does documentation scores differently than one doing hands-on patient care." },
    { "@type": "HowToStep", position: 3, name: "Read your AI Risk Score", text: "Receive a 0–100 AI exposure score, a breakdown of which tasks are at risk vs. protected, BLS employment projections, and a full Career Action Plan with skills, lateral moves, and pivot paths." },
  ],
};

/* ── 4. Organization — Entity authority for AI-powered search ────────────── */
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AI Future",
  url: SITE_URL,
  description: "Free AI job displacement risk analyzer based on Anthropic's 2026 Economic Index and O*NET task database. Risk scores for 800+ occupations, career action plans, 9 languages.",
  foundingDate: "2026",
  sameAs: [
    "https://www.anthropic.com/research/labor-market-impacts",
  ],
  knowsAbout: [
    "AI job displacement", "Labor market automation", "Anthropic Economic Index",
    "O*NET occupational data", "Future of work", "Career planning"
  ],
};

/* ── 5. BreadcrumbList — Navigation in SERP ──────────────────────────────── */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Analyze Your Job", item: `${SITE_URL}/#analyze` },
    { "@type": "ListItem", position: 3, name: "Risk Leaderboard", item: `${SITE_URL}/#leaderboard` },
    { "@type": "ListItem", position: 4, name: "Job Details", item: `${SITE_URL}/jobs/software-developer` },
  ],
};

export default function Home() {
  const schemas = [webAppSchema, faqSchema, howToSchema, orgSchema, breadcrumbSchema];
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="keywords" content="will AI replace my job, AI job displacement risk, AI job automation checker, artificial intelligence job risk, which jobs are safe from AI, AI exposure score occupation, future of work AI 2026, jobs most at risk from AI, AI labor market research 2026, Anthropic AI employment study, career future proof AI" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href={SITE_URL} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Alternate languages / hreflang */}
        {SUPPORTED_LANGS.map(l => (
          <link key={l} rel="alternate" hrefLang={l} href={`${SITE_URL}/${l}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="AI Future" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AI Future — Will AI replace your job? Free risk score." />
        <meta property="og:locale" content="en_US" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        {/* PWA / Theme */}
        <meta name="theme-color" content="#11151B" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Fonts */}
        {/* Fonts are now optimally handled via next/font/google in _app.js */}
        {/* JSON-LD */}
        {schemas.map((s, i) => (
          <script key={i} type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(s).replace(/</g, "\\u003c") }} />
        ))}
      </Head>

      {/* Semantic crawlable content */}
      <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        <h1>AI Future — Will AI Replace Your Job? Free Risk Analyzer 2026</h1>
        <p>Research-backed AI job displacement risk scores for 800+ occupations based on Anthropic's 2026 Economic Index. Free, instant analysis. Available in English, Hindi, Spanish, French, German, Portuguese, Japanese, Arabic, Chinese.</p>
        <h2>Which jobs are most at risk from AI?</h2>
        <p>Computer Programmers, Customer Service Reps, Data Entry Keyers, Telemarketers, Proofreaders, Tax Preparers, Financial Analysts, Paralegals, Medical Transcriptionists have the highest AI exposure scores.</p>
        <h2>Which jobs are safe from AI?</h2>
        <p>Electricians, Plumbers, Firefighters, Physical Therapists, Massage Therapists, Lifeguards, Agricultural Workers score below 15 out of 100 and are largely safe from AI displacement.</p>
      </div>

      <App initialTheme="light" />
    </>
  );
}
