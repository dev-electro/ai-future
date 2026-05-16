/**
 * pages/robots.txt.js
 * Served at /robots.txt — tells crawlers what to index and where the sitemap is.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-exposure-index.vercel.app";

export default function Robots() {
  return null;
}

export async function getServerSideProps({ res }) {
  const content = `# AI Future — robots.txt
User-agent: *
Allow: /
Disallow: /api/

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Search engine crawl-delay hints
Crawl-delay: 1
`;
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, s-maxage=86400");
  res.write(content);
  res.end();
  return { props: {} };
}
