/**
 * 博客阅读量 Worker
 * 路由：
 *   GET  /api/views/:slug  → { slug, views }
 *   POST /api/views/:slug  → { slug, views }（自增）
 * KV 绑定：BLOG_VIEWS（key: views:{slug}）
 */
const SITE_ORIGIN = "https://xiaozha.org";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/views/")) {
      return new Response("Not Found", { status: 404 });
    }

    const slug = decodeURIComponent(url.pathname.slice("/api/views/".length));
    if (!slug) {
      return new Response("Bad Request", { status: 400 });
    }
    const key = `views:${slug}`;

    if (request.method === "GET") {
      const views = Number((await env.BLOG_VIEWS.get(key)) ?? 0);
      return json({ slug, views });
    }

    if (request.method === "POST") {
      // 简单同源校验：仅接受本站页面的请求（防刷的轻量措施）
      const referer = request.headers.get("Referer") ?? "";
      if (referer && !referer.startsWith(SITE_ORIGIN)) {
        return json({ error: "forbidden" }, 403);
      }
      const views = Number((await env.BLOG_VIEWS.get(key)) ?? 0) + 1;
      await env.BLOG_VIEWS.put(key, String(views));
      return json({ slug, views });
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
