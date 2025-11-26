import type { LoaderFunctionArgs } from "react-router";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const robotText = `
User-agent: *
Allow: /
Allow: /changelog
Disallow: /trends/
Disallow: /dashboard/
Disallow: /wardrobe/
Disallow: /outfits/
Disallow: /settings/
Disallow: /onboarding/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
  `.trim();

  return new Response(robotText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
