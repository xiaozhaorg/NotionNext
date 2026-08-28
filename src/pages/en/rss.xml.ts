import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@/config";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts-en", ({ data }) => !data.draft);
  const siteUrl = String(context.site ?? SITE.url).replace(/\/$/, "");

  return rss({
    title: SITE.titleEn,
    description: SITE.descriptionEn,
    site: `${siteUrl}/en/`,
    stylesheet: "/rss.xsl",
    customData: `<language>en</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<managingEditor>no-reply@xiaozha.org (${SITE.author})</managingEditor>
<webMaster>no-reply@xiaozha.org (${SITE.author})</webMaster>
<copyright>© ${SITE.since}-${new Date().getFullYear()} ${SITE.titleEn}</copyright>
<generator>NotionNext-Astro</generator>
<atom:link href="${siteUrl}/en/rss.xml" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
<image>
  <url>${siteUrl}/favicon.svg</url>
  <title>${SITE.titleEn}</title>
  <link>${siteUrl}/en/</link>
</image>`,
    items: posts
      .sort((a, b) => b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime())
      .map((post) => {
        const url = `${siteUrl}/en/${SITE.post.urlPrefix}/${post.id}/`;
        const cover = post.data.ogImage
          ? /^https?:\/\//.test(post.data.ogImage)
            ? post.data.ogImage
            : `${siteUrl}${post.data.ogImage.startsWith("/") ? "" : "/"}${post.data.ogImage}`
          : "";
        return {
          title: post.data.title,
          description: post.data.description,
          pubDate: post.data.pubDatetime,
          link: url,
          customData: `<guid isPermaLink="true">${url}</guid>
<category>${post.data.tags.join(",") || "uncategorized"}</category>
<dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${post.data.author}</dc:creator>${
  cover ? `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${cover}"/>` : ""
}`,
          categories: post.data.tags,
        };
      }),
  });
}
