// Service worker (v0.3): traducción (Claude), TTS (ElevenLabs) y caché en IndexedDB.
// Las claves viven en chrome.storage.local y nunca llegan a la página.

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// Súbelo si cambias SYSTEM: invalida las traducciones guardadas con el prompt anterior.
const PROMPT_V = 3;

const SYSTEM = `Eres un traductor-doblador EN→ES (español de España, tono natural y cercano, como un buen profesor hablando) para cursos de diseño web creativo y desarrollo.
Reglas:
- Recibes un array JSON de fragmentos de una transcripción en inglés. Devuelve SOLO un array JSON de strings con el mismo número de elementos y el mismo orden.
- Si un fragmento ya está en español, devuélvelo tal cual.
- Traduce para ser HABLADO EN VOZ ALTA: frases naturales y fluidas, no literales; sin paréntesis, comillas ni símbolos raros; concisas (el audio debe caber en el mismo tiempo que el original).
- Escribe números, siglas y símbolos como se pronunciarían de forma natural cuando ayude a la lectura en voz alta.
- Mantén en inglés los términos técnicos habituales (GSAP, WebGL, shader, easing, scroll, hover, framework, canvas, timeline, CSS, JavaScript, etc.), los nombres propios y los nombres de marcas o librerías. No traduzcas código.
- La transcripción procede de SUBTÍTULOS AUTOMÁTICOS y tiene errores de reconocimiento (palabras mal oídas): por ejemplo «playing jazz it» o «plain jazz» son «plain JavaScript», «jazz» suele ser «JS», «GSAP» puede salir como «gee sap», y «frameworks» como «marcos». Corrígelos por el contexto (curso de desarrollo web creativo: JavaScript, GSAP, WebGL, CSS, animación, shaders…) y traduce lo que el instructor quiso decir, no el error.
- Los fragmentos consecutivos suelen ser trozos de una misma frase o explicación: úsalos como contexto unos de otros para que la traducción sea coherente.
- No añadas ni quites información. No expliques nada.`;

const DEFAULTS = {
  anthropicKey: "",
  model: "claude-haiku-4-5",
  modelCustom: "",
  elevenKey: "",
  elevenVoice: "",
  elevenModel: "eleven_flash_v2_5",
  elevenStability: 0.5,
  elevenSimilarity: 0.75,
  elevenSpeed: 1,
  browserVoice: "",
  cacheMaxMb: 500,
  ytTranscript: true,  // YouTube: lee la transcripción completa (funciona con la pestaña en segundo plano)
  showCaptions: true,  // muestra la traducción como subtítulo sobre el vídeo
  capSize: 18,         // aspecto del subtítulo: tamaño (px)
  capBg: 0.6,          // opacidad del fondo (0–1)
  capText: 1,          // opacidad del texto (0.3–1)
  capFont: "system-ui, sans-serif",
  capBottom: 56,       // distancia al borde inferior del vídeo (px)
  capWidth: 70,        // ancho máximo (% del vídeo)
  capBold: true,
  elevenEnabled: true, // interruptor «Usar ElevenLabs» (la clave y el ID se quedan guardados)
  elevenBlock: null,   // {sig, status, error, t}: ElevenLabs falló con esta clave/voz/modelo; no se reintenta solo
};
const getCfg = () => chrome.storage.local.get(DEFAULTS);

// Firma de la configuración de ElevenLabs: si cambias clave, voz o modelo, el bloqueo se levanta solo.
const elevenSig = (c) => `${String(c.elevenKey || "").slice(-8)}|${c.elevenVoice}|${c.elevenModel}`;
function elevenState(c) {
  if (!c.elevenKey || !c.elevenVoice) return "missing";
  if (c.elevenEnabled === false) return "off";
  if (c.elevenBlock && c.elevenBlock.sig === elevenSig(c)) return "blocked";
  return "ready";
}
const num = (v, d) => (v === "" || v == null || !Number.isFinite(Number(v)) ? d : Number(v));

/* ---------------- Caché (IndexedDB) ---------------- */
// "tr": traducciones {k, es, t}. "audio": audios mp3 {k, buf, b, t}. Clave = SHA-256 del contexto + texto.
let dbp = null;
function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open("dobes-cache", 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore("tr", { keyPath: "k" });
        d.createObjectStore("audio", { keyPath: "k" }).createIndex("t", "t");
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => { dbp = null; reject(r.error); };
    });
  }
  return dbp;
}
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function idbGet(store, k) { const d = await db(); return req(d.transaction(store).objectStore(store).get(k)); }
async function idbPut(store, v) { const d = await db(); return req(d.transaction(store, "readwrite").objectStore(store).put(v)); }

async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function cacheStats() {
  const d = await db();
  const translations = await req(d.transaction("tr").objectStore("tr").count());
  let audios = 0, bytes = 0;
  await new Promise((res, rej) => {
    const c = d.transaction("audio").objectStore("audio").openCursor();
    c.onsuccess = () => {
      const cur = c.result;
      if (cur) { audios++; bytes += cur.value.b || 0; cur.continue(); } else res();
    };
    c.onerror = () => rej(c.error);
  });
  return { translations, audios, bytes };
}

async function cacheClear() {
  const d = await db();
  await Promise.all(["tr", "audio"].map((s) => req(d.transaction(s, "readwrite").objectStore(s).clear())));
}

// Si el audio guardado supera el límite, borra los más antiguos hasta bajar al 90 %.
async function evict() {
  const { cacheMaxMb } = await getCfg();
  const max = num(cacheMaxMb, 500) * 1024 * 1024;
  const { bytes } = await cacheStats();
  if (bytes <= max) return;
  let over = bytes - max * 0.9;
  const d = await db();
  await new Promise((res, rej) => {
    const tx = d.transaction("audio", "readwrite");
    const c = tx.objectStore("audio").index("t").openCursor();
    c.onsuccess = () => {
      const cur = c.result;
      if (cur && over > 0) { over -= cur.value.b || 0; cur.delete(); cur.continue(); }
    };
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}
let puts = 0;

/* ---------------- APIs ---------------- */
// Construye un Error legible con el estado HTTP y el motivo que devuelve la API.
async function apiError(res, name) {
  let detail = "";
  try {
    const j = await res.clone().json();
    const d = j.detail ?? j.error ?? j;
    detail = typeof d === "string" ? d : d.message || d.status || JSON.stringify(d);
  } catch {
    try { detail = (await res.text()).slice(0, 160); } catch {}
  }
  const e = new Error(`${name} ${res.status}: ${String(detail).slice(0, 220)}`);
  e.status = res.status;
  return e;
}

async function callClaude(texts, key, model) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(texts) }],
    }),
  });
  if (!res.ok) throw await apiError(res, "Anthropic");
  const data = await res.json();
  const raw = data.content?.map((b) => b.text || "").join("") || "";
  const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
  let out = null;
  try { out = JSON.parse(json); } catch { /* respuesta que no es JSON válido: se trata abajo */ }
  if (!Array.isArray(out) || out.length !== texts.length) {
    // Una sola frase: nos quedamos con lo que devuelva (une los trozos si la partió).
    if (texts.length === 1) {
      const one = Array.isArray(out) ? out.map(String).join(" ").trim() : raw.trim();
      if (one) return [one];
    }
    const e = new Error("Respuesta de traducción con longitud distinta.");
    e.code = "LEN";
    throw e;
  }
  return out.map(String);
}

// Claude a veces junta o parte frases y devuelve otro número de elementos. Entonces partimos el lote por la mitad
// y reintentamos cada mitad, hasta llegar a frases sueltas: así el resultado siempre cuadra con lo enviado.
async function callClaudeSplit(texts, key, model) {
  try { return await callClaude(texts, key, model); }
  catch (e) {
    if (e?.code !== "LEN" || texts.length < 2) throw e;
    const mid = texts.length >> 1;
    const [a, b] = await Promise.all([
      callClaudeSplit(texts.slice(0, mid), key, model),
      callClaudeSplit(texts.slice(mid), key, model),
    ]);
    return a.concat(b);
  }
}

// Traduce usando la caché: solo se llama a Claude por las frases que no estén guardadas.
async function translate(texts) {
  const c = await getCfg();
  if (!c.anthropicKey) throw new Error("Falta la API key de Anthropic (ajustes de la extensión).");
  const model = c.modelCustom || c.model;
  const keys = await Promise.all(texts.map((t) => sha(`tr|${PROMPT_V}|${model}|${t}`)));
  const hits = await Promise.all(keys.map((k) => idbGet("tr", k).catch(() => null)));
  const out = hits.map((h) => (h ? h.es : null));
  const miss = out.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
  if (miss.length) {
    const fresh = await callClaudeSplit(miss.map((i) => texts[i]), c.anthropicKey, model);
    await Promise.all(miss.map((i, j) => {
      out[i] = fresh[j];
      return idbPut("tr", { k: keys[i], es: fresh[j], t: Date.now() }).catch(() => {});
    }));
  }
  return { data: out, cached: texts.length - miss.length };
}

function b64(buf) {
  const u = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(bin);
}

// Voz con caché: si ya generamos este texto con esta voz/modelo/ajustes, no se gastan créditos.
async function tts(text, force) {
  const c = await getCfg();
  if (!c.elevenKey || !c.elevenVoice) throw new Error("Falta API key o Voice ID de ElevenLabs.");
  // Bloqueado por un error anterior (o apagado): no gastamos peticiones. «Probar ElevenLabs» usa force.
  if (!force && ["blocked", "off"].includes(elevenState(c))) return { blocked: true };
  const model = c.elevenModel || "eleven_flash_v2_5";
  const vs = {
    stability: num(c.elevenStability, 0.5),
    similarity_boost: num(c.elevenSimilarity, 0.75),
    speed: num(c.elevenSpeed, 1),
  };
  const key = await sha(["audio", c.elevenVoice, model, vs.stability, vs.similarity_boost, vs.speed, text].join("|"));
  const hit = await idbGet("audio", key).catch(() => null);
  if (hit) return { data: b64(hit.buf), cached: true };

  const body = { text, model_id: model, voice_settings: vs };
  // language_code solo lo aceptan Flash v2.5 y Turbo v2.5; con otros modelos da error.
  if (/flash_v2_5|turbo_v2_5/.test(model)) body.language_code = "es";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(c.elevenVoice)}?output_format=mp3_44100_64`,
    { method: "POST", headers: { "xi-api-key": c.elevenKey, "content-type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw await apiError(res, "ElevenLabs");
  if (c.elevenBlock) chrome.storage.local.set({ elevenBlock: null }); // ya funciona: levanta el bloqueo
  const ab = await res.arrayBuffer();
  idbPut("audio", { k: key, buf: ab, b: ab.byteLength, t: Date.now() })
    .then(() => { if (++puts % 20 === 0) evict().catch(() => {}); })
    .catch(() => {});
  return { data: b64(ab), cached: false };
}

// Lista las voces de la cuenta (requiere permiso "Voces: Leído" en la clave).
async function listVoices() {
  const c = await getCfg();
  if (!c.elevenKey) throw new Error("Falta la API key de ElevenLabs.");
  const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": c.elevenKey } });
  if (!res.ok) throw await apiError(res, "ElevenLabs");
  const j = await res.json();
  return (j.voices || []).map((v) => ({ id: v.voice_id, name: v.name, category: v.category || "" }));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "translate") sendResponse({ ok: true, ...(await translate(msg.texts)) });
      else if (msg.type === "tts") {
        const r = await tts(msg.text, msg.force);
        sendResponse(r.blocked ? { ok: false, blocked: true } : { ok: true, ...r });
      }
      else if (msg.type === "elevenFailed") {
        const c = await getCfg();
        await chrome.storage.local.set({ elevenBlock: { sig: elevenSig(c), status: msg.status || 0, error: String(msg.error || ""), t: Date.now() } });
        sendResponse({ ok: true });
      }
      else if (msg.type === "setEleven") {
        // Enciende/apaga ElevenLabs. Al encender también se levanta un bloqueo previo (reintentar).
        await chrome.storage.local.set(msg.enabled ? { elevenEnabled: true, elevenBlock: null } : { elevenEnabled: false });
        sendResponse({ ok: true });
      }
      else if (msg.type === "voices") sendResponse({ ok: true, data: await listVoices() });
      else if (msg.type === "cacheStats") sendResponse({ ok: true, data: await cacheStats() });
      else if (msg.type === "cacheClear") { await cacheClear(); sendResponse({ ok: true }); }
      else if (msg.type === "cfg") {
        const c = await getCfg();
        const st = elevenState(c);
        sendResponse({ ok: true, data: {
          eleven: st === "ready", elevenState: st,
          elevenMsg: st === "blocked" ? c.elevenBlock.error : "", elevenStatus: st === "blocked" ? c.elevenBlock.status : 0,
          browserVoice: c.browserVoice || "", showCaptions: c.showCaptions !== false, ytTranscript: c.ytTranscript !== false,
          cap: { capSize: num(c.capSize, 18), capBg: num(c.capBg, 0.6), capText: num(c.capText, 1), capFont: c.capFont || DEFAULTS.capFont,
                 capBottom: num(c.capBottom, 56), capWidth: num(c.capWidth, 70), capBold: c.capBold !== false },
        } });
      }
    } catch (e) {
      console.warn("[DobES]", e);
      sendResponse({ ok: false, error: String(e.message || e), status: e.status });
    }
  })();
  return true; // respuesta asíncrona
});
