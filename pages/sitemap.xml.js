/**
 * pages/sitemap.xml.js
 * Dynamic sitemap at /sitemap.xml — includes home, lang pages, and all 40 static job pages.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobrisk.docset.in";

const JOB_SLUGS = [
  "computer-programmer", "customer-service-rep", "data-entry-keyer", "telemarketer", "proofreader",
  "tax-preparer", "financial-analyst", "medical-transcriptionist", "paralegal", "bookkeeping-clerk",
  "technical-writer", "software-developer", "translator", "insurance-underwriter", "market-research-analyst",
  "accountant-auditor", "management-consultant", "lawyer-attorney", "marketing-manager", "journalist-reporter",
  "hr-specialist", "graphic-designer", "real-estate-agent", "registered-nurse", "high-school-teacher",
  "architect", "pharmacist", "psychologist", "police-officer", "veterinarian",
  "physical-therapist", "chef-head-cook", "electrician", "plumber", "firefighter",
  "bartender", "lifeguard", "motorcycle-mechanic", "agricultural-worker", "massage-therapist",
];

const LANG_CODES = ["en", "hi", "es", "fr", "de", "pt", "ja", "ar", "zh"];

function generateSitemap() {
  const now = new Date().toISOString().split("T")[0];
  const pages = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/#analyze", priority: "0.9", changefreq: "weekly" },
    { path: "/#leaderboard", priority: "0.8", changefreq: "monthly" },
    ...LANG_CODES.map(l => ({ path: `/${l}`, priority: "0.7", changefreq: "monthly" })),
    ...JOB_SLUGS.map(s => ({ path: `/jobs/${s}`, priority: "0.9", changefreq: "monthly" })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${now}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`).join("\n")}
</urlset>`;
}

export default function Sitemap() { return null; }

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
  res.write(generateSitemap());
  res.end();
  return { props: {} };
}
