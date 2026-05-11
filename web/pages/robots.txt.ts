import type { APIRoute } from "astro";

// PRE-LAUNCH: block all crawlers from indexing the site.
//
// TODO(launch): when the site is ready to go live, replace the body below
// with the indexable variant:
//
//   const body = [
//     "User-agent: *",
//     "Allow: /",
//     "Disallow: /app/",
//     "",
//     `Sitemap: ${site?.origin ?? ""}/sitemap-index.xml`,
//     "",
//   ].join("\n");
//
// Paired with the unconditional <meta name="robots" content="noindex,
// nofollow"> in web/layouts/BaseLayout.astro — both must be reverted
// together at launch.
export const GET: APIRoute = () => {
  const body = ["User-agent: *", "Disallow: /", ""].join("\n");
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
