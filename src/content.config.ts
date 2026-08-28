import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postSchema = z.object({
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
  sourceUrl: z.string().optional(),
  /** 关联的中文版文章 slug（英文文章用，用于 hreflang 互指） */
  zhSlug: z.string().optional(),
  /** 关联的英文版文章 slug（中文文章用，用于 hreflang 互指） */
  enSlug: z.string().optional(),
});

/**
 * 中文文章集合
 */
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: postSchema,
});

/**
 * 英文文章集合
 */
const postsEn = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts-en" }),
  schema: postSchema,
});

export const collections = { posts, "posts-en": postsEn };
