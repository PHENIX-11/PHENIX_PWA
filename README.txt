PHENIX GROUP'S OF COMPANIES — PWA PACKAGE

Files to upload to the ROOT of a NEW GitHub repository:
- index.html
- service-worker.js
- manifest.json
- assets/ (entire folder)
- robots.txt
- sitemap.xml
- README.md / README.txt

GitHub Pages setup: Settings > Pages > Deploy from a branch > main > /(root).

Caching: the service worker automatically caches the app shell and selected same-origin assets on first visit, then caches other same-origin GET resources as they are requested. It can fall back to cached index.html when offline. Browser storage can be evicted, and first visit still requires downloading resources.

Install: an Install PHENIX button is included. Supported browsers show their native confirmation UI after the visitor clicks it. Websites cannot silently install themselves without the visitor's choice. Some browsers (including iOS browsers) require Add to Home Screen from the browser's Share/menu UI.

Important: this PWA improves repeat loading/offline resilience; it does not guarantee fixing a slow click caused by JavaScript, animations, or external embeds.
