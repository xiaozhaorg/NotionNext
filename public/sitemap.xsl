<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
                exclude-result-prefixes="s">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>小吒博客 · Sitemap 网站地图</title>
        <meta name="robots" content="noindex,nofollow"/>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f7f8fb; color: #1a1d23; }
          .wrap { max-width: 960px; margin: 0 auto; padding: 48px 20px 80px; }
          .hero { background: linear-gradient(135deg,#0ea5e9,#6366f1); color:#fff; padding:28px 30px; border-radius:14px; box-shadow: 0 10px 30px rgb(99 102 241 / 25%); }
          .hero h1 { margin: 0 0 6px; font-size: 1.6rem; }
          .hero p { margin: 0; opacity: 0.9; }
          .badges { margin-top: 18px; display:flex; gap: 10px; flex-wrap: wrap; }
          .badge { background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.35); padding: 6px 12px; border-radius: 999px; font-size: .82rem; }
          table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgb(0 0 0 / 3%); }
          th, td { padding: 10px 14px; text-align: left; font-size: .88rem; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-all; }
          th { background: #f8fafc; color: #475569; font-weight: 600; position: sticky; top: 0; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #fafbff; }
          a { color: #4f46e5; text-decoration: none; }
          a:hover { text-decoration: underline; }
          h2 { margin: 32px 0 14px; font-size: 1.15rem; }
          .col-url { width: 58%; }
          .col-date { width: 18%; }
          .col-freq { width: 10%; }
          .col-prio { width: 14%; }
          .bar { display: inline-block; height: 8px; background: linear-gradient(90deg,#22d3ee,#4f46e5); border-radius: 4px; margin-right: 6px; }
          .hint { margin-top: 18px; background: #fff; border: 1px dashed #c7d2fe; border-radius: 10px; padding: 14px 16px; color: #374151; font-size: .88rem; line-height: 1.7; }
          .hint b { color: #4f46e5; }
          .search-box { margin-top: 14px; display:flex; gap:10px; flex-wrap: wrap; }
          input { flex: 1; min-width: 220px; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: .92rem; outline: none; transition: border-color .2s, box-shadow .2s; }
          input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgb(99 102 241 / 18%); }
          select { padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background:#fff; font-size: .92rem; cursor: pointer; }
          .count { color: #64748b; font-size: .85rem; margin-left: 8px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <section class="hero">
            <h1>🗺️ 小吒博客 · Sitemap 网站地图</h1>
            <p>本页面向搜索引擎与访客展示本站全部可收录页面，支持按类型与路径快速筛选。</p>
            <div class="badges">
              <span class="badge">📄 合计 <strong id="totalCount">0</strong> 条链接</span>
              <span class="badge">📝 文章 <strong id="postCount">0</strong> 篇</span>
              <span class="badge">🏷️ 标签页 <strong id="tagCount">0</strong> 个</span>
              <span class="badge">🧭 其他 <strong id="otherCount">0</strong> 个</span>
            </div>
          </section>

          <div class="hint">
            <b>🔍 搜索引擎提示：</b>本站 sitemap 已在 <a style="color:#4f46e5" href="/robots.txt">robots.txt</a> 中声明。<br/>
            在百度/必应/Google 站长后台手动提交时，请提交这两个地址（任意一个均可）：
            <div style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap;">
              <code style="background:#eef2ff;color:#4338ca;padding:4px 8px;border-radius:6px;">https://xiaozha.org/sitemap.xml</code>
              <code style="background:#eef2ff;color:#4338ca;padding:4px 8px;border-radius:6px;">https://xiaozha.org/sitemap-index.xml</code>
            </div>
          </div>

          <h2>🗂️ 全部链接 <span class="count" id="showCount"></span></h2>
          <div class="search-box">
            <input id="q" type="search" placeholder="🔎 搜索 URL、标题关键字（如 /article/、/tags/AI）..." />
            <select id="filter">
              <option value="all">全部类型</option>
              <option value="article">只看文章 /article/</option>
              <option value="tag">只看标签 /tags/</option>
              <option value="page">只看静态页（不含前两类）</option>
            </select>
          </div>
          <div style="margin-top:14px;overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th class="col-url">URL 地址</th>
                  <th class="col-date">上次更新</th>
                  <th class="col-freq">更新频率</th>
                  <th class="col-prio">权重</th>
                </tr>
              </thead>
              <tbody id="tbody">
                <xsl:choose>
                  <!-- sitemap index 嵌套情况：如果有 <sitemapindex> 就展开 -->
                  <xsl:when test="/s:sitemapindex">
                    <xsl:for-each select="/s:sitemapindex/s:sitemap">
                      <tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                          <td><xsl:value-of select="s:lastmod"/></td>
                          <td>index</td><td>-</td></tr>
                    </xsl:for-each>
                  </xsl:when>
                  <!-- 普通 urlset -->
                  <xsl:otherwise>
                    <xsl:for-each select="/s:urlset/s:url">
                      <xsl:variable name="type">
                        <xsl:choose>
                          <xsl:when test="contains(s:loc,'/article/')">article</xsl:when>
                          <xsl:when test="contains(s:loc,'/tags/')">tag</xsl:when>
                          <xsl:otherwise>page</xsl:otherwise>
                        </xsl:choose>
                      </xsl:variable>
                      <xsl:variable name="prio" select="number(s:priority)"/>
                      <tr data-type="{$type}" data-loc="{s:loc}">
                        <td><a href="{s:loc}" rel="nofollow"><xsl:value-of select="s:loc"/></a></td>
                        <td><xsl:value-of select="substring(s:lastmod,1,19)"/></td>
                        <td><xsl:value-of select="s:changefreq"/></td>
                        <td>
                          <span class="bar" style="width:{($prio) * 80}px;"></span>
                          <xsl:value-of select="s:priority"/>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </xsl:otherwise>
                </xsl:choose>
              </tbody>
            </table>
          </div>
        </div>
        <script>
          (function(){
            var rows = document.querySelectorAll('#tbody tr[data-type]');
            function classOf(type){ return document.getElementById(type+'Count'); }
            var p=0, t=0, o=0;
            rows.forEach(function(r){
              var ty = r.getAttribute('data-type');
              if (ty==='article') p++; else if (ty==='tag') t++; else o++;
            });
            document.getElementById('totalCount').textContent = rows.length;
            document.getElementById('postCount').textContent = p;
            document.getElementById('tagCount').textContent = t;
            document.getElementById('otherCount').textContent = o;

            function apply(){
              var q = document.getElementById('q').value.trim().toLowerCase();
              var f = document.getElementById('filter').value;
              var shown = 0;
              rows.forEach(function(r){
                var ok = true;
                if (f !== 'all') ok = (r.getAttribute('data-type') === f);
                if (ok && q) ok = r.getAttribute('data-loc').toLowerCase().indexOf(q) !== -1;
                r.style.display = ok ? '' : 'none';
                if (ok) shown++;
              });
              document.getElementById('showCount').textContent = '(显示 '+shown+' / 共 '+rows.length+' 条)';
            }
            document.getElementById('q').addEventListener('input', apply);
            document.getElementById('filter').addEventListener('change', apply);
            apply();
          })();
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
