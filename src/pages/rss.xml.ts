import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@/config";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts
      .sort((a, b) => b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDatetime,
        link: `/${SITE.post.urlPrefix}/${post.id}/`,
      })),
  });
}
