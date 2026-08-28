<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title><xsl:value-of select="/rss/channel/title"/> · RSS</title>
        <meta name="robots" content="noindex,nofollow"/>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f7f8fb; color: #1a1d23; }
          .wrap { max-width: 760px; margin: 0 auto; padding: 48px 20px 80px; }
          .hero { background: linear-gradient(135deg,#4f46e5,#22d3ee); color:#fff; padding:28px 30px; border-radius:14px; box-shadow: 0 10px 30px rgb(79 70 229 / 25%); }
          .hero h1 { margin: 0 0 6px; font-size: 1.6rem; }
          .hero p { margin: 0; opacity: 0.9; }
          .desc { margin-top: 8px; color: #fff; opacity: .85; }
          h2 { margin: 36px 0 14px; font-size: 1.15rem; }
          .list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
          .item { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; transition: border-color .2s, transform .2s, box-shadow .2s; }
          .item:hover { border-color: #4f46e5; transform: translateY(-1px); box-shadow: 0 6px 18px rgb(0 0 0 / 6%); }
          .item a { color: #1a1d23; text-decoration: none; }
          .item h3 { margin: 0 0 6px; font-size: 1rem; font-weight: 600; line-height: 1.45; }
          .item p { margin: 0; color: #5b616f; font-size: .88rem; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .meta { margin-top: 8px; display: flex; gap: 10px; color: #9aa1ad; font-size: .78rem; flex-wrap: wrap; }
          .tag { background: #eef2ff; color: #4f46e5; padding: 2px 8px; border-radius: 999px; }
          .copy-btn { margin-top: 14px; display: inline-flex; gap: 6px; align-items: center; padding: 8px 14px; border-radius: 8px; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.35); color: #fff; cursor: pointer; font-size: .88rem; }
          .copy-btn:hover { background: rgba(255,255,255,.3); }
          .hint { margin-top: 18px; background: #fff; border: 1px dashed #c7d2fe; border-radius: 10px; padding: 14px 16px; color: #374151; font-size: .88rem; line-height: 1.7; }
          .hint b { color: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <section class="hero">
            <h1><xsl:value-of select="/rss/channel/title"/></h1>
            <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
            <div id="feedUrl"></div>
            <button class="copy-btn" onclick="copyFeed()">📋 复制 RSS 订阅地址</button>
          </section>

          <div class="hint">
            <b>✨ 这是 RSS 订阅源</b>，可以直接复制地址，粘贴到 Feedly、Inoreader、NetNewsWire、Reeder、Follow 等 RSS 阅读器里订阅，第一时间收到新文章。<br/>
            机器阅读该源返回 <b>RSS 2.0 XML</b>，人类访问会自动转换为当前美化版，浏览器不会影响抓取。
          </div>

          <h2>📚 近期文章 <xsl:text>（共 </xsl:text><xsl:value-of select="count(/rss/channel/item)"/> 篇）</h2>
          <ul class="list">
            <xsl:for-each select="/rss/channel/item">
              <li class="item">
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
                  <h3><xsl:value-of select="title"/></h3>
                </a>
                <p><xsl:value-of select="description"/></p>
                <div class="meta">
                  <span>🕒 <xsl:value-of select="pubDate"/></span>
                  <xsl:if test="category!=''">
                    <span class="tag">🏷️ <xsl:value-of select="category"/></span>
                  </xsl:if>
                </div>
              </li>
            </xsl:for-each>
          </ul>
        </div>
        <script>
          var url = location.origin + location.pathname;
          document.getElementById('feedUrl').textContent = '🔗 ' + url;
          function copyFeed(){
            try{
              navigator.clipboard.writeText(url).then(function(){
                document.querySelector('.copy-btn').textContent='✅ 已复制，打开 RSS 阅读器粘贴即可';
              });
            }catch(e){alert('请手动复制：'+url);}
          }
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
