import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * 文章集合
 * 用 Markdown 文件作为内容源，替代 NotionNext 的 Notion CMS
 */
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDatetime: z.coerce.date(),
    modDatetime: z.coerce.date().optional(),
    author: z.string().default("小吒"),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
    coverAlt: z.string().optional(),
    category: z.string().optional(),
    notionPageId: z.string().optional(),
  }),
});

export const collections = { posts };
