PHENIX GROUP’S OF COMPANIES — CACHE RELOAD PROMPT UPDATE

Upload the contents of this ZIP to the ROOT of the existing PHENIX_PWA GitHub repository, replacing files with the same names. Keep the assets folder at the root.

Updated files: index.html and service-worker.js. Other files and assets are included unchanged.

Behavior:
- The popup waits at least 30 seconds after the page starts running.
- It appears only after an active service worker and cached index.html are confirmed.
- It has one button: “Reload now”. The user chooses whether to reload; the page never reloads automatically.
- Clicking it reloads once and suppresses another prompt for the rest of that browser tab session, avoiding a reload loop.
- Navigation is cache-first when a cached page exists, while a fresh copy is updated in the background.

Notes: First-visit performance still depends on connection speed and downloading the large HTML document. Browser storage can be cleared/evicted, and cache readiness cannot be guaranteed on every device.
