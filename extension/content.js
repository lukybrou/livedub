// LiveDub — content script (v0.5.2). Requiere errors.js (DobErr) cargado antes.
// Flujo: vídeo -> subtítulos (textTracks o DOM) -> frases -> Claude (por adelantado, solo si no están ya en español) -> voz ES sincronizada.
(() => {
  if (window.__dobEs) return;
  window.__dobEs = true;

  const LOOKAHEAD_S = 90;       // segundos de vídeo que traducimos por adelantado (barato)
  const AUDIO_AHEAD_S = 25;     // segundos de vídeo para los que generamos audio ElevenLabs (cuesta créditos)
  const MAX_AUDIO_INFLIGHT = 3; // peticiones TTS simultáneas
  const BATCH = 12;             // frases por petición de traducción
  const DUCK = 0.08;            // volumen del audio original mientras se dobla
  const CPS = 14;               // caracteres/seg de habla ES a velocidad 1.0
  const MAX_LAG_S = 2.5;        // si vamos más tarde que esto, se corta y se resincroniza

  let video = null, btn = null, on = false;
  let segments = [];            // {start,end,en,es?,state(0 pend,1 en curso,2 lista),audioPromise?,audio?}
  let liveMode = false, liveSeen = 0;
  let origVolume = 1, timer = null, translating = 0;
  let audioEl = null, audioDone = null, pausedSpeech = false, pausedAudio = false;
  let useEleven = false, domObs = null;
  let elevenFails = 0, audioInflight = 0, speakId = 0, speaking = false;
  const send = (m) => new Promise((r) => chrome.runtime.sendMessage(m, r));

  /* ---------- Utilidades ---------- */
  const ES_W = new Set("el la los las de del que y en un una por con para es se no lo al su más pero como esto está son muy así vamos esta este también cuando porque entonces".split(" "));
  const EN_W = new Set("the and of to is in that it for with this are was you we on be have at but not so as can will your our they there what".split(" "));
  function isSpanish(t) {
    const w = t.toLowerCase().match(/[a-záéíóúñü']+/g) || [];
    let es = 0, en = 0;
    for (const x of w) { if (ES_W.has(x)) es++; if (EN_W.has(x)) en++; }
    if (/[¿¡ñáéíóú]/i.test(t) && en < 2) return true;
    return es > en;
  }

  const status = (t, title) => { if (btn) { btn.textContent = t; btn.title = title || ""; layout(); } };

  // Botón secundario «🔊 ElevenLabs / 🔈 Voz navegador»: enciende o apaga ElevenLabs sin tocar la clave ni el Voice ID.
  // (Estas variables van aquí arriba porque layout() se ejecuta al montar el botón, antes que el resto del script.)
  let voiceBtn = null, elState = "missing", elMsg = "";
  let banner = null, capEl = null, capId = 0, showCapOn = true;
  let cap = { capSize: 18, capBg: 0.6, capText: 1, capFont: "system-ui, sans-serif", capBottom: 56, capWidth: 70, capBold: true };
  function layout() {
    if (!btn || !video) return;
    // En pantalla completa solo se ve lo que cuelga del elemento a pantalla completa: movemos botones y subtítulo ahí.
    const host = document.fullscreenElement || document.documentElement;
    for (const el of [btn, voiceBtn, capEl, banner]) if (el && el.parentNode !== host && !el.contains(host)) host.appendChild(el);
    styleCaption();
    const r = video.getBoundingClientRect();
    btn.style.top = Math.max(8, r.top + 8) + "px";
    btn.style.left = Math.max(8, r.right - btn.offsetWidth - 12) + "px";
    if (voiceBtn) {
      const b = btn.getBoundingClientRect();
      voiceBtn.style.top = b.bottom + 6 + "px";
      voiceBtn.style.left = Math.max(8, b.right - voiceBtn.offsetWidth) + "px";
    }
  }
  function renderVoiceBtn() {
    if (!voiceBtn) return;
    const L = { ready: "🔊 ElevenLabs", off: "🔈 Voz del navegador", blocked: "⚠ ElevenLabs falló · reintentar" };
    voiceBtn.style.display = elState === "missing" ? "none" : "";
    voiceBtn.textContent = L[elState] || "";
    voiceBtn.title = elState === "ready" ? "Pulsa para usar solo la voz del navegador (gratis)"
      : elState === "off" ? "Pulsa para usar ElevenLabs"
      : "ElevenLabs se desactivó por un error (" + elMsg + "). Pulsa para reintentar.";
    layout();
  }
  // Lee el estado guardado (listo / apagado / bloqueado / sin configurar) y lo aplica en caliente.
  async function refreshElState() {
    const cfg = await send({ type: "cfg" });
    if (!cfg?.ok) return;
    elState = cfg.data.elevenState || "missing";
    elMsg = cfg.data.elevenMsg || "";
    useEleven = !!cfg.data.eleven;
    if (on) status(liveMode ? `ES ▸ on (live) · ${useEleven ? "ElevenLabs" : "voz navegador"}` : `ES ▸ on · ${useEleven ? "ElevenLabs" : "voz navegador"}`,
      elState === "blocked" ? "ElevenLabs desactivado por un error anterior: " + elMsg : "");
    renderVoiceBtn();
  }
  try {
    chrome.storage.onChanged.addListener((ch) => {
      if (ch.elevenEnabled || ch.elevenBlock || ch.elevenKey || ch.elevenVoice || ch.elevenModel) refreshElState();
      if (ch.showCaptions || Object.keys(ch).some((k) => k.startsWith("cap"))) loadCap();
    });
  } catch {}

  // Aviso junto al botón: qué ha pasado y qué hacer. Una vez por tipo de error, se cierra al pulsar.
  const notified = new Set();
  function notify(prefix, raw, st, extra) {
    const e = DobErr.explain(raw, st);
    console.warn("[DobES]", prefix + e.title, "|", e.tip, "|", raw);
    const key = prefix + e.title;
    if (notified.has(key) || !btn) return e;
    notified.add(key);
    banner?.remove();
    banner = document.createElement("div");
    banner.setAttribute("data-dobes-ui", "");
    const t = document.createElement("div");
    t.textContent = prefix + e.title;
    t.style.cssText = "font-weight:700;margin-bottom:4px";
    const p = document.createElement("div");
    p.textContent = e.tip + (extra ? " " + extra : "");
    banner.append(t, p);
    Object.assign(banner.style, {
      position: "fixed", zIndex: 2147483647, maxWidth: "340px", padding: "11px 14px", borderRadius: "12px",
      background: "rgba(20,22,28,.96)", color: "#f1f3f8", font: "12.5px/1.5 system-ui, sans-serif", boxShadow: "0 12px 32px rgba(0,0,0,.5)", cursor: "pointer",
      border: "1px solid rgba(255,255,255,.1)", borderLeft: "3px solid #fa5a28",
    });
    const r = (voiceBtn && voiceBtn.style.display !== "none" ? voiceBtn : btn).getBoundingClientRect();
    banner.style.top = r.bottom + 8 + "px";
    banner.style.left = Math.max(8, r.right - 340) + "px";
    banner.title = "Pulsa para cerrar";
    banner.onclick = () => banner?.remove();
    document.documentElement.appendChild(banner);
    setTimeout(() => banner?.remove(), 20000);
    return e;
  }

  /* ---------- 1. Detectar vídeo y botón flotante ---------- */
  function findVideo() {
    const vids = [...document.querySelectorAll("video")].filter((v) => v.offsetWidth > 200);
    return vids.sort((a, b) => b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight)[0] || null;
  }
  function mountButton() {
    const v = findVideo();
    if (!v || v === video) return;
    video = v;
    btn?.remove();
    btn = document.createElement("button");
    btn.textContent = "ES ▸ off";
    Object.assign(btn.style, {
      position: "fixed", zIndex: 2147483647, padding: "7px 14px", border: "1px solid rgba(255,255,255,.18)", borderRadius: "999px",
      background: "linear-gradient(135deg,#fa5a28,#e23d3d)", color: "#fff", font: "700 12px system-ui, sans-serif", letterSpacing: ".2px", cursor: "pointer", opacity: ".95",
      boxShadow: "0 4px 14px rgba(250,90,40,.4)", maxWidth: "320px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    });
    btn.onclick = () => (on ? stop() : start());
    document.documentElement.appendChild(btn);

    voiceBtn?.remove();
    voiceBtn = document.createElement("button");
    voiceBtn.style.display = "none";
    Object.assign(voiceBtn.style, {
      position: "fixed", zIndex: 2147483647, padding: "5px 11px", border: "1px solid rgba(255,255,255,.14)", borderRadius: "999px",
      background: "rgba(20,22,28,.88)", color: "#f1f3f8", font: "600 11px system-ui, sans-serif", cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,.35)", whiteSpace: "nowrap",
    });
    voiceBtn.onclick = async () => {
      await send({ type: "setEleven", enabled: elState !== "ready" });
      refreshElState();
    };
    document.documentElement.appendChild(voiceBtn);
    layout();
    refreshElState();
  }
  document.addEventListener("fullscreenchange", layout);
  addEventListener("scroll", layout, { passive: true });
  addEventListener("resize", layout);
  setInterval(layout, 1000);
  setInterval(mountButton, 1500);
  mountButton();

  /* ---------- 2. Obtener subtítulos ---------- */
  function pickTrack() {
    const tracks = [...video.textTracks].filter((t) => ["subtitles", "captions"].includes(t.kind));
    return tracks.find((t) => /^en/i.test(t.language)) || tracks.find((t) => /^es/i.test(t.language)) || tracks[0] || null;
  }

  // Pide a page.js (mundo de la página) las frases en inglés del reproductor Video.js, aunque el CC esté apagado.
  function pageCues(timeout = 5000) {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2);
      const h = (e) => {
        if (e.source !== window || !e.data || e.data.dobes !== "cues" || e.data.id !== id) return;
        removeEventListener("message", h); clearTimeout(t); resolve(e.data);
      };
      const t = setTimeout(() => { removeEventListener("message", h); resolve(null); }, timeout);
      addEventListener("message", h);
      postMessage({ dobes: "getCues", id }, "*");
    });
  }

  async function loadFromTrack() {
    const pc = await pageCues();
    if (pc?.ok && pc.cues?.length) {
      const cues = pc.cues.map((c) => ({
        start: c.start, end: c.end, text: String(c.text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      })).filter((c) => c.text);
      segments = groupSentences(cues, /^es/i.test(pc.lang));
      console.info(`[DobES] subtítulos leídos del reproductor (${pc.label || pc.lang}): ${cues.length} cues → ${segments.length} frases`);
      return segments.length > 0;
    }
    if (pc && !pc.ok) console.info("[DobES] page.js:", pc.reason, pc.langs || "");
    const track = pickTrack();
    if (!track) return false;
    if (track.mode === "disabled") track.mode = "hidden"; // carga los cues sin pintarlos
    for (let i = 0; i < 20 && !(track.cues && track.cues.length); i++) await new Promise((r) => setTimeout(r, 300));
    if (!track.cues || !track.cues.length) return false;
    const cues = [...track.cues].map((c) => ({
      start: c.startTime, end: c.endTime, text: c.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    })).filter((c) => c.text);
    segments = groupSentences(cues, /^es/i.test(track.language));
    return segments.length > 0;
  }

  // Une cues sueltos en frases completas: traduce y suena mucho mejor.
  function groupSentences(cues, trackIsEs) {
    const out = [];
    let cur = null;
    for (const c of cues) {
      if (cur && c.start - cur.end > 1.2) { out.push(cur); cur = null; }
      if (!cur) cur = { start: c.start, end: c.end, en: c.text, state: 0 };
      else { cur.end = c.end; cur.en += " " + c.text; }
      if (/[.!?…]["')\]]?$/.test(c.text) || cur.end - cur.start > 9) { out.push(cur); cur = null; }
    }
    if (cur) out.push(cur);
    // Si ya está en español, no hace falta traducir.
    for (const s of out) if (trackIsEs || isSpanish(s.en)) { s.es = s.en; s.state = 2; }
    return out;
  }

  // Plan B: subtítulos pintados por el reproductor (DOM). Sin pretraducción.
  function loadFromDom() {
    const sel = [
      '[class*="caption" i]', '[class*="subtitle" i]', '[class*="cue" i]', '[class*="vp-captions" i]',
      '[data-testid*="caption" i]', '[aria-live]',
    ];
    // Textos de la interfaz del reproductor que NO son subtítulos (avisos de accesibilidad, botones…).
    const UI = /^(play|pause|paused|playing|resume|replay|mute|unmute|muted|unmuted|volume|fullscreen|exit fullscreen|full screen|settings|quality|captions?|subtitles?|cc|hd|auto|loading|buffering|live|next|previous|seek|forward|rewind|speed|\d+(\.\d+)?x|[\d:.\- ]+|(captions?|subtitles?) (on|off)|picture[- ]in[- ]picture)$/i;
    const isUi = (el, t) =>
      UI.test(t.replace(/[.!¡¿?…,]+$/g, "").trim()) ||
      !!el.closest('button, [role="button"], [role="slider"], [role="menu"], [role="menuitem"], [role="tooltip"], [data-dobes-ui]');
    let last = "";
    const read = () => {
      let txt = "";
      for (const s of sel) {
        for (const el of document.querySelectorAll(s)) {
          const t = (el.innerText || "").trim();
          if (!t || t.length >= 300 || el.offsetParent === null) continue;
          if (isUi(el, t)) continue;
          // Un aria-live sin pinta de subtítulo (1–2 palabras) suele ser un aviso del reproductor.
          if (s === "[aria-live]" && t.split(/\s+/).length < 3) continue;
          txt = t; break;
        }
        if (txt) break;
      }
      if (txt && txt !== last) { last = txt; if (!liveSeen++) refreshElState(); console.debug("[DobES] subtítulo detectado:", txt); onLiveText(txt.replace(/\s+/g, " ")); }
    };
    domObs = new MutationObserver(read);
    domObs.observe(document.body, { childList: true, subtree: true, characterData: true });
    liveMode = true;
  }

  /* ---------- 3. Traducción por adelantado ---------- */
  async function translateWindow() {
    if (liveMode || !video || translating >= 2) return;
    const t = video.currentTime;
    const todo = segments.filter((s) => s.state === 0 && s.end >= t - 1 && s.start <= t + LOOKAHEAD_S).slice(0, BATCH);
    if (!todo.length) return;
    todo.forEach((s) => (s.state = 1));
    translating++;
    const res = await send({ type: "translate", texts: todo.map((s) => s.en) });
    translating--;
    if (!res?.ok) {
      todo.forEach((s) => (s.state = 0));
      const e = notify("Traducción: ", res?.error, res?.status);
      status("ES ⚠ " + e.title.slice(0, 40), res?.error);
      return;
    }
    todo.forEach((s, i) => { s.es = res.data[i]; s.state = 2; });
  }

  /* ---------- 4. Voz ---------- */
  let esVoice = null, preferredVoice = "";
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    esVoice = (preferredVoice && vs.find((v) => v.name === preferredVoice)) ||
              vs.find((v) => /es-ES/i.test(v.lang) && /google|natural|online/i.test(v.name)) ||
              vs.find((v) => /es-ES/i.test(v.lang)) || vs.find((v) => /^es/i.test(v.lang)) || null;
  }
  speechSynthesis.onvoiceschanged = pickVoice; pickVoice();

  function speakBrowser(seg, rateMul) {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(seg.es);
      u.lang = esVoice ? esVoice.lang : "es-ES"; if (esVoice) u.voice = esVoice;
      const dur = Math.max(0.8, seg.end - seg.start);
      const need = seg.es.length / (CPS * dur);
      u.rate = Math.min(1.7, Math.max(0.95, need)) * Math.min(1.3, rateMul);
      // Chrome a veces no dispara onend (sobre todo con voces «online»): un vigilante evita que la cola se quede bloqueada.
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(wd); resolve(); } };
      const wd = setTimeout(fin, Math.max(8, dur * 2 + 5) * 1000);
      u.onend = u.onerror = fin;
      speechSynthesis.speak(u);
    });
  }

  // Subtítulo en español sobre el vídeo: así ves lo que ha traducido Haiku aunque no suene.
  // Aspecto del subtítulo (se cambia en los ajustes y se aplica al momento).
  function styleCaption() {
    if (!capEl || !video) return;
    const r = video.getBoundingClientRect();
    const w = Math.round(r.width * (cap.capWidth / 100));
    Object.assign(capEl.style, {
      background: `rgba(0,0,0,${cap.capBg})`,
      color: `rgba(255,255,255,${cap.capText})`,
      font: `${cap.capBold ? 700 : 400} ${cap.capSize}px/1.35 ${cap.capFont}`,
      textShadow: cap.capBg < 0.35 ? "0 1px 3px rgba(0,0,0,.9)" : "0 1px 2px rgba(0,0,0,.5)",
      width: w + "px",
      left: Math.round(r.left + (r.width - w) / 2) + "px",
      bottom: Math.max(4, innerHeight - r.bottom + cap.capBottom) + "px",
    });
  }
  async function loadCap() {
    const c = await send({ type: "cfg" });
    if (c?.data?.cap) { cap = { ...cap, ...c.data.cap }; showCapOn = c.data.showCaptions !== false; styleCaption(); }
  }
  function showCaption(t) {
    if (!showCapOn || !video || !t) return;
    const id = ++capId;
    if (!capEl) {
      capEl = document.createElement("div");
      capEl.setAttribute("data-dobes-ui", "");
      Object.assign(capEl.style, {
        position: "fixed", zIndex: 2147483646, padding: "6px 12px", borderRadius: "8px", textAlign: "center",
        pointerEvents: "none",
      });
      (document.fullscreenElement || document.documentElement).appendChild(capEl);
    }
    capEl.textContent = t;
    capEl.style.display = "";
    styleCaption();
    return id;
  }
  function hideCaption(id, delay = 700) {
    setTimeout(() => { if (capEl && id === capId) capEl.style.display = "none"; }, delay);
  }

  // ElevenLabs: si falla, avisa en el botón y cae a la voz del navegador (sin repetir peticiones inútiles).
  function onElevenError(r) {
    if (r?.blocked) return; // ya estaba desactivado: sin ruido
    if (!useEleven) return; // otro fallo en vuelo después de desactivarlo: ya se avisó
    const msg = r?.error || "sin respuesta";
    elevenFails++;
    const fatal = [401, 402, 403, 404, 422].includes(r?.status);
    if (fatal || elevenFails >= 3) {
      useEleven = false;
      notify("ElevenLabs: ", msg, r?.status, "Sigo con la voz del navegador y no lo vuelvo a intentar (puedes reactivarlo con el botón «ElevenLabs»).");
      status("ES ▸ on · voz navegador ⚠", "ElevenLabs desactivado: " + msg);
      // Se recuerda entre páginas y recargas: no más «error, voz gratis, error…» hasta que lo reactives o cambies la clave/voz.
      send({ type: "elevenFailed", status: r?.status, error: msg }).then(refreshElState);
    } else {
      notify("ElevenLabs: ", msg, r?.status);
      status("ES ▸ on ⚠ " + (r?.status || "error"), msg);
    }
  }

  function prefetchAudio(seg) {
    if (!useEleven || !seg.es) return Promise.resolve();
    if (seg.audioPromise) return seg.audioPromise;
    audioInflight++;
    seg.audioPromise = (async () => {
      const r = await send({ type: "tts", text: seg.es });
      audioInflight--;
      if (r?.ok) { seg.audio = "data:audio/mpeg;base64," + r.data; elevenFails = 0; }
      else onElevenError(r);
    })();
    return seg.audioPromise;
  }

  // Solo genera audio para los próximos AUDIO_AHEAD_S segundos: ahorra créditos si saltas por el vídeo.
  function prefetchWindow() {
    if (!useEleven || liveMode || !video) return;
    const t = video.currentTime;
    for (const s of segments) {
      if (audioInflight >= MAX_AUDIO_INFLIGHT) break;
      if (s.state === 2 && !s.audioPromise && s.end >= t - 0.5 && s.start <= t + AUDIO_AHEAD_S) prefetchAudio(s);
    }
  }

  async function speakEleven(seg, rateMul) {
    await prefetchAudio(seg);
    if (!seg.audio) return speakBrowser(seg, rateMul); // fallback
    return new Promise((resolve) => {
      const a = new Audio(seg.audio);
      audioEl = a;
      pausedAudio = false;
      a.onloadedmetadata = () => {
        const dur = Math.max(0.8, seg.end - seg.start);
        a.playbackRate = Math.min(1.6, Math.max(1, a.duration / dur)) * Math.min(1.3, rateMul);
      };
      // Al terminar se suelta el audio: antes seguía referenciado y tick() lo volvía a reproducir (releía la frase).
      const done = () => {
        a.onended = a.onerror = null;
        if (audioEl === a) audioEl = null;
        if (audioDone === done) audioDone = null;
        resolve();
      };
      audioDone = done;
      a.onended = a.onerror = done;
      a.play().catch(done);
    });
  }

  function cancelSpeech() {
    speechSynthesis.cancel();
    pausedSpeech = false; pausedAudio = false;
    const a = audioEl, d = audioDone;
    audioEl = null; audioDone = null;
    if (a) a.pause();
    if (d) d(); // libera la promesa pendiente de la frase cortada
  }

  async function speak(seg, rate) {
    const id = ++speakId;
    speaking = true;
    const cid = showCaption(seg.es);
    try { await (useEleven ? speakEleven : speakBrowser)(seg, rate); }
    finally { if (id === speakId) speaking = false; hideCaption(cid); }
  }

  /* ---------- 5. Planificador sincronizado con el vídeo ---------- */
  function tick() {
    if (!on || !video) return;
    // Solo pausamos/reanudamos lo que realmente está sonando y lo que pausamos nosotros.
    // (Antes se llamaba a audioEl.play() en cada tick: un audio ya terminado volvía a empezar y se solapaba con el siguiente.)
    if (video.paused || video.seeking) {
      if (speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); pausedSpeech = true; }
      if (audioEl && !audioEl.paused && !audioEl.ended) { audioEl.pause(); pausedAudio = true; }
      return;
    }
    if (pausedSpeech) { speechSynthesis.resume(); pausedSpeech = false; }
    if (pausedAudio) { if (audioEl && !audioEl.ended) audioEl.play().catch(() => {}); pausedAudio = false; }
    if (liveMode) return;

    translateWindow();
    prefetchWindow();
    const t = video.currentTime;
    const seg = segments.find((s) => s.state === 2 && !s.spoken && s.start <= t + 0.15 && s.end > t - 0.3);
    if (!seg) return;
    const lag = t - seg.start;
    if (speaking) { if (lag > MAX_LAG_S) cancelSpeech(); else return; }
    seg.spoken = true;
    speak(seg, video.playbackRate || 1);
  }

  // Modo DOM: traduce (si hace falta) y habla según llega, con cola de 1 frase.
  let liveBusy = false, liveNext = null;
  async function onLiveText(text) {
    if (!on) return;
    if (liveBusy) { liveNext = text; return; }
    liveBusy = true;
    let es = null;
    if (isSpanish(text)) { es = text; console.debug("[DobES] ya está en español, no se traduce"); }
    else {
      const r = await send({ type: "translate", texts: [text] });
      if (r?.ok) { es = r.data[0]; console.debug("[DobES] Haiku:", text, "→", es, r.cached ? "(caché)" : ""); }
      else { const e = notify("Traducción: ", r?.error, r?.status); status("ES ⚠ " + e.title.slice(0, 40), r?.error); }
    }
    if (es) {
      const seg = { es, start: 0, end: Math.max(1.5, text.length / 14) };
      cancelSpeech();
      await speak(seg, video?.playbackRate || 1);
    }
    liveBusy = false;
    if (liveNext) { const n = liveNext; liveNext = null; onLiveText(n); }
  }

  /* ---------- 6. Arranque / parada ---------- */
  async function start() {
    if (!video) return;
    status("ES … cargando");
    const cfg = await send({ type: "cfg" });
    useEleven = !!cfg?.data?.eleven;
    elState = cfg?.data?.elevenState || "missing"; elMsg = cfg?.data?.elevenMsg || ""; renderVoiceBtn();
    showCapOn = cfg?.data?.showCaptions !== false;
    if (cfg?.data?.cap) cap = { ...cap, ...cfg.data.cap };
    liveSeen = 0;
    preferredVoice = cfg?.data?.browserVoice || ""; pickVoice();
    elevenFails = 0; audioInflight = 0;
    segments = []; liveMode = false;
    const ok = await loadFromTrack();
    if (!ok) { loadFromDom(); console.info("[DobES] sin textTracks: usando subtítulos del DOM (modo en vivo). Activa CC en el reproductor."); }
    origVolume = video.volume; video.volume = DUCK;
    on = true;
    video.addEventListener("seeking", onSeek);
    timer = setInterval(tick, 150);
    const voz = useEleven ? "ElevenLabs" : "voz navegador";
    status(ok ? `ES ▸ on · ${voz}` : `ES ▸ on (live) · ${voz}`);
    if (!ok) setTimeout(() => {
      if (on && liveMode && !liveSeen) status("ES ▸ on (live) · activa CC ⚠", "No detecto subtítulos. Activa CC (subtítulos) en el reproductor, en inglés o en español.");
    }, 7000);
    translateWindow();
  }
  function onSeek() { cancelSpeech(); speaking = false; segments.forEach((s) => (s.spoken = false)); }
  function stop() {
    on = false; clearInterval(timer); cancelSpeech(); domObs?.disconnect();
    if (capEl) capEl.style.display = "none";
    if (video) { video.volume = origVolume; video.removeEventListener("seeking", onSeek); }
    status("ES ▸ off");
  }
})();
