---
title: "BT Panel Login Returns 404"
pubDatetime: "2026-04-17T00:00:00.000Z"
description: "How to fix a 404 error when logging into BT Panel, including troubleshooting and resolving a port conflict caused by Nginx."
author: "Xiaozha"
tags: ["BT Panel", "Tutorial", "Nginx"]
featured: false
draft: false
ogImage: "/images/bt-panel-404-real.jpg"
coverAlt: "Racks of neatly arranged server cabinets and network equipment in a data center"
zhSlug: "bt-panel-404"
---

Today I suddenly noticed that one of my other WordPress sites was showing a white screen. I planned to log into BT Panel to check what was going on, only to find that logging into the panel returned a 404 error.

I started by searching the web, but most of the advice from bloggers was that the BT Panel port wasn't open or that I hadn't entered the correct security entry path, and they suggested running the `BT 14` command to check the correct port and security entry. In all honesty, though, I was certain I hadn't made that kind of basic mistake — I was confident that the IP address, port, and security entry I'd typed in were all correct.

Accessing the panel over HTTPS returned "This site can't provide a secure connection," while accessing it over HTTP returned "404 Not Found."

![image](/images/remote/1484480974693-6ca0a78fb36b.webp)

![image](/images/remote/1499750310107-5fef28a66643.webp)

After coming up empty in my web searches, I switched to an SSH terminal with an AI assistant to troubleshoot, and that's when I finally found the problem.

![image](/images/remote/1484480974693-6ca0a78fb36b.webp)

It turned out that the BT Panel port was occupied. I checked again to see which service was holding the port, and the result told me it was Nginx.

![image](/images/remote/1499750310107-5fef28a66643.webp)

Once the problem was identified, the fix was easy: I changed the BT Panel login port (I switched mine to 8888 for testing), then opened port 8888 in the BT security firewall entry on the server management console. After that, everything worked normally.
