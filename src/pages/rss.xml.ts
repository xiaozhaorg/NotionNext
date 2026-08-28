import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@/config";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  // context.site 在 Astro 构建中可能是 URL 对象，也可能是字符串，先统一 toString
  const siteUrl = String(context.site ?? SITE.url).replace(/\/$/, "");

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: siteUrl,
    // 默认 RSS 2.0 命名空间下没有 xmlns，额外加上 atom 自链 + image，提升阅读器识别
    stylesheet: "/rss.xsl",
    customData: `<language>zh-CN</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<managingEditor>no-reply@xiaozha.org (${SITE.author})</managingEditor>
<webMaster>no-reply@xiaozha.org (${SITE.author})</webMaster>
<copyright>© ${SITE.since}-${new Date().getFullYear()} ${SITE.title}</copyright>
<generator>NotionNext-Astro</generator>
<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
<image>
  <url>${siteUrl}/favicon.svg</url>
  <title>${SITE.title}</title>
  <link>${siteUrl}/</link>
</image>`,
    items: posts
      .sort((a, b) => b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime())
      .map((post) => {
        const url = `${siteUrl}/${SITE.post.urlPrefix}/${post.id}/`;
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
          // 为每个 item 补上 guid，防止 RSS 重复抓取
          customData: `<guid isPermaLink="true">${url}</guid>
<category>${post.data.tags.join(",") || "未分类"}</category>
<dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${post.data.author}</dc:creator>${
  cover ? `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${cover}"/>` : ""
}`,
          categories: post.data.tags,
        };
      }),
  });
}
