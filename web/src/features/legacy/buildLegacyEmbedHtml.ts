/**
 * Full HTML document for an iframe `srcDoc`. Isolated window so `js/main.js` runs again
 * each time the iframe is recreated (fixes SPA remount after leaving `/game`).
 */
export function buildLegacyEmbedHtml(bodyHtml: string, basePath: string): string {
    const base = basePath.endsWith("/") ? basePath : `${basePath}/`;
    const zodCdn = "https://cdn.jsdelivr.net/npm/zod@3.24.1/+esm";
    const mathJaxInit = JSON.stringify({
        tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["$$", "$$"]] }
    });
    const importMapJson = JSON.stringify({ imports: { zod: zodCdn } });
    return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Math Creature Battler</title>
  <link rel="icon" href="${base}favicon.svg" type="image/svg+xml" />
  <script src="${base}firebase-config.js"></script>
  <script src="${base}runtime-config.js"></script>
  <script>
    (function () {
      try {
        if (window.__mathbattler_production_ui__) {
          document.documentElement.classList.add("mb-production-ui");
        }
      } catch (e) {}
      try {
        if (!window.__mathbattler_production_ui__) return;
        if (typeof URLSearchParams !== "undefined" && new URLSearchParams(location.search).get("debug") === "1") return;
        var noop = function () {};
        console.log = noop;
        console.info = noop;
        console.debug = noop;
        console.warn = noop;
        console.group = noop;
        console.groupCollapsed = noop;
        console.groupEnd = noop;
      } catch (e2) {}
    })();
  </script>
  <script src="${base}ai-config.js"></script>
  <script>
    (function () {
      try {
        var SF = "mb_dev_firebase_config_json";
        function fbOk(s) {
          try {
            var o = typeof s === "string" ? JSON.parse(s) : null;
            if (!o || typeof o !== "object") return false;
            var k = String(o.apiKey || "");
            var p = String(o.projectId || "");
            if (!k || k.indexOf("PASTE") !== -1) return false;
            if (!p || p === "YOUR_PROJECT_ID") return false;
            return true;
          } catch (e) {
            return false;
          }
        }
        var fc = typeof window.__firebase_config === "string" ? window.__firebase_config : "";
        if (fbOk(fc)) sessionStorage.setItem(SF, fc);
        else {
          var bf = sessionStorage.getItem(SF);
          if (fbOk(bf) && !fbOk(fc)) window.__firebase_config = bf;
        }
      } catch (e) {}
    })();
  </script>
  <link rel="stylesheet" href="${base}tailwind.css" />
  <link rel="stylesheet" href="${base}style.css" />
  <script type="importmap">${importMapJson}</script>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <script>window.MathJax = ${mathJaxInit};</script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <style>
    html, body { height: 100%; margin: 0; }
    html { display: flex; flex-direction: column; }
    body {
      position: relative;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  </style>
</head>
<body class="relative bg-gray-900 text-white font-sans w-full overflow-hidden flex flex-col">
${bodyHtml}
<script type="module" src="${base}js/main.js"></script>
</body>
</html>`;
}
