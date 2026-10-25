// LiveDub — script del "mundo de la página" (world: MAIN). v0.5
// Los reproductores Video.js guardan sus pistas de subtítulos en el objeto player (el.player), no en video.textTracks,
// y un content script normal no puede verlo. Este script lo lee y se lo pasa al content script por postMessage.
// Solo lee subtítulos; no toca cookies ni datos de sesión.
(() => {
  if (window.__dobPage) return;
  window.__dobPage = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const findPlayer = () => {
    for (const el of document.querySelectorAll(".video-js")) if (el.player) return el.player;
    return null;
  };
  const tracksOf = (p) => {
    const L = p.textTracks(), out = [];
    for (let i = 0; i < L.length; i++) out.push(L[i]);
    return out.filter((t) => ["captions", "subtitles"].includes(t.kind));
  };

  async function getCues() {
    const p = findPlayer();
    if (!p) return { ok: false, reason: "no-videojs" };
    const tr = tracksOf(p);
    const t = tr.find((x) => /^en/i.test(x.language)) || null;
    if (!t) return { ok: false, reason: "no-english-track", langs: tr.map((x) => x.language) };
    // Si la pista está desactivada y sin cues, "hidden" fuerza la carga sin pintarla en pantalla.
    if (t.mode === "disabled" && !(t.cues && t.cues.length)) t.mode = "hidden";
    for (let i = 0; i < 12 && !(t.cues && t.cues.length); i++) await sleep(300);
    if (!t.cues || !t.cues.length) return { ok: false, reason: "no-cues" };
    const cues = [];
    for (let i = 0; i < t.cues.length; i++) {
      const c = t.cues[i];
      cues.push({ start: c.startTime, end: c.endTime, text: String(c.text || "") });
    }
    return { ok: true, lang: t.language, label: t.label, cues };
  }

  addEventListener("message", async (e) => {
    if (e.source !== window || !e.data || e.data.dobes !== "getCues") return;
    let res;
    try { res = await getCues(); } catch (err) { res = { ok: false, reason: String(err) }; }
    postMessage({ dobes: "cues", id: e.data.id, ...res }, "*");
  });
})();
