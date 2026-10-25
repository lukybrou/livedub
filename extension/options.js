const F = [
  "anthropicKey", "model", "modelCustom",
  "elevenKey", "elevenVoice", "elevenModel", "elevenStability", "elevenSimilarity", "elevenSpeed",
  "browserVoice", "cacheMaxMb",
  "capSize", "capBg", "capText", "capBottom", "capWidth", "capFont",
];
const RANGES = ["elevenStability", "elevenSimilarity", "elevenSpeed", "capSize", "capBg", "capText", "capBottom", "capWidth"];
const $ = (id) => document.getElementById(id);
const send = (m) => chrome.runtime.sendMessage(m);

try { $("ver").textContent = "v" + chrome.runtime.getManifest().version; } catch (e) {}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

/* ---------- Mensajes ---------- */
function say(text, kind) {
  const m = $("msg");
  m.innerHTML = "";
  if (text) m.appendChild(el("div", "box " + (kind || "info"), text));
}
// Error explicado: qué ha pasado + qué hacer + detalle técnico.
function fail(r, extraTip) {
  const m = $("msg");
  m.innerHTML = "";
  const e = DobErr.explain(r?.error || "sin respuesta del service worker", r?.status);
  const box = el("div", "box err");
  box.appendChild(el("div", "t", "✗ " + e.title));
  box.appendChild(el("div", "tip", "Qué hacer: " + e.tip + (extraTip ? " " + extraTip : "")));
  box.appendChild(el("div", "raw", "Detalle técnico: " + (r?.error || "sin respuesta")));
  m.appendChild(box);
}

/* ---------- Voces del navegador ---------- */
function autoVoice() {
  const vs = speechSynthesis.getVoices();
  return vs.find((v) => /es-ES/i.test(v.lang) && /google|natural|online/i.test(v.name)) ||
         vs.find((v) => /es-ES/i.test(v.lang)) || vs.find((v) => /^es/i.test(v.lang)) || null;
}
function fillBrowserVoices() {
  const sel = $("browserVoice");
  const cur = sel.dataset.saved ?? sel.value;
  sel.innerHTML = "";
  sel.appendChild(new Option("Automática (la mejor en español disponible)", ""));
  speechSynthesis.getVoices()
    .filter((v) => /^es/i.test(v.lang))
    .forEach((v) => sel.appendChild(new Option(`${v.name} (${v.lang})${v.localService ? "" : " · online"}`, v.name)));
  sel.value = cur || "";
}
speechSynthesis.onvoiceschanged = fillBrowserVoices;

/* ---------- Carga / guardado ---------- */
const INT_RANGES = ["capSize", "capBottom", "capWidth"];
function showRange(id) {
  const v = Number($(id).value);
  $(id + "V").textContent = INT_RANGES.includes(id) ? String(v) : v.toFixed(2);
}
// Vista previa del subtítulo con los valores actuales de los controles.
function updatePreview() {
  const p = $("capPreview");
  p.style.fontSize = $("capSize").value + "px";
  p.style.lineHeight = "1.35";
  p.style.fontFamily = $("capFont").value;
  p.style.fontWeight = $("capBold").checked ? "700" : "400";
  p.style.background = `rgba(0,0,0,${$("capBg").value})`;
  p.style.color = `rgba(255,255,255,${$("capText").value})`;
  p.style.textShadow = Number($("capBg").value) < 0.35 ? "0 1px 3px rgba(0,0,0,.9)" : "0 1px 2px rgba(0,0,0,.5)";
  p.style.maxWidth = $("capWidth").value + "%";
}
// El aspecto del subtítulo se guarda solo al moverlo (sin pulsar «Guardar todo») y se ve al instante en el vídeo.
let capT;
function saveCapSoon() {
  clearTimeout(capT);
  capT = setTimeout(() => chrome.storage.local.set({
    capSize: Number($("capSize").value), capBg: Number($("capBg").value), capText: Number($("capText").value),
    capBottom: Number($("capBottom").value), capWidth: Number($("capWidth").value),
    capFont: $("capFont").value, capBold: $("capBold").checked,
  }), 250);
}
RANGES.forEach((id) => {
  $(id).oninput = () => { showRange(id); updatePreview(); if (id.startsWith("cap")) saveCapSoon(); };
});
$("capFont").onchange = () => { updatePreview(); saveCapSoon(); };
$("capBold").onchange = () => { updatePreview(); saveCapSoon(); };
$("showCaptions").onchange = () => chrome.storage.local.set({ showCaptions: $("showCaptions").checked });
$("ytTranscript").onchange = () => chrome.storage.local.set({ ytTranscript: $("ytTranscript").checked });

// Estado de ElevenLabs (activo / apagado / bloqueado por un error anterior / sin configurar).
async function refreshElState() {
  const r = await send({ type: "cfg" });
  const box = $("elState");
  box.innerHTML = "";
  const st = r?.data?.elevenState;
  if (!st || st === "ready") return;
  if (st === "missing") { box.appendChild(el("div", "box info", "Rellena la API key y el Voice ID de ElevenLabs para poder usarlo.")); return; }
  if (st === "off") { box.appendChild(el("div", "box info", "ElevenLabs está apagado: se usa la voz del navegador. Tu clave y tu Voice ID siguen guardados.")); return; }
  const e = DobErr.explain(r.data.elevenMsg || "error", r.data.elevenStatus);
  const b = el("div", "box err");
  b.appendChild(el("div", "t", "ElevenLabs desactivado por un error anterior: " + e.title));
  b.appendChild(el("div", "tip", "Qué hacer: " + e.tip + " Mientras tanto se usa la voz del navegador, sin más errores."));
  const retry = el("button", "sec", "Reintentar ElevenLabs");
  retry.onclick = async () => { await send({ type: "setEleven", enabled: true }); refreshElState(); say("ElevenLabs reactivado: se probará en el próximo vídeo.", "info"); };
  b.appendChild(retry);
  box.appendChild(b);
}
$("elevenEnabled").onchange = async () => {
  await send({ type: "setEleven", enabled: $("elevenEnabled").checked });
  refreshElState();
};
chrome.storage.onChanged.addListener((ch) => {
  if (ch.elevenEnabled) $("elevenEnabled").checked = ch.elevenEnabled.newValue !== false;
  if (ch.elevenBlock || ch.elevenEnabled) refreshElState();
});

chrome.storage.local.get([...F, "elevenEnabled", "showCaptions", "ytTranscript", "capBold"]).then((v) => {
  $("elevenEnabled").checked = v.elevenEnabled !== false;
  $("showCaptions").checked = v.showCaptions !== false;
  $("ytTranscript").checked = v.ytTranscript !== false;
  $("capBold").checked = v.capBold !== false;
  refreshElState();
  F.forEach((i) => { if (v[i] !== undefined && v[i] !== "" && i !== "browserVoice") $(i).value = v[i]; });
  $("browserVoice").dataset.saved = v.browserVoice || "";
  fillBrowserVoices();
  RANGES.forEach(showRange);
  updatePreview();
});
fillBrowserVoices();

async function save() {
  const o = {};
  F.forEach((i) => {
    const v = $(i).value.trim();
    o[i] = RANGES.includes(i) || i === "cacheMaxMb" ? Number(v) : v;
  });
  o.elevenEnabled = $("elevenEnabled").checked;
  o.showCaptions = $("showCaptions").checked;
  o.ytTranscript = $("ytTranscript").checked;
  o.capBold = $("capBold").checked;
  await chrome.storage.local.set(o);
  $("browserVoice").dataset.saved = o.browserVoice;
  refreshElState();
}

$("save").onclick = async () => {
  await save();
  say("Guardado ✓", "ok");
  setTimeout(() => say(""), 2000);
};

/* ---------- Pruebas ---------- */
$("testTr").onclick = async () => {
  await save();
  say("Probando traducción…");
  const r = await send({ type: "translate", texts: ["This is a quick test of the live dubbing extension."] });
  if (!r?.ok) return fail(r);
  say("✓ La traducción funciona: «" + r.data[0] + "»" + (r.cached ? " (desde caché, sin gastar tokens)" : ""), "ok");
  refreshStats();
};

$("test").onclick = async () => {
  await save();
  say("Probando ElevenLabs…");
  const r = await send({ type: "tts", text: "Hola, esta es una prueba de mi voz doblada al español.", force: true });
  if (!r?.ok) return fail(r);
  say("✓ ElevenLabs funciona" + (r.cached ? " (audio desde caché, sin gastar créditos)" : "") + ". Reproduciendo…", "ok");
  new Audio("data:audio/mpeg;base64," + r.data).play().catch(() => {});
  refreshStats();
};

$("testBr").onclick = () => {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance("Hola, esta es una prueba de la voz del navegador en español.");
  const name = $("browserVoice").value;
  const v = speechSynthesis.getVoices().find((x) => x.name === name) || autoVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "es-ES";
  speechSynthesis.speak(u);
  say("Reproduciendo con: " + (v ? v.name : "la voz por defecto del sistema"), "info");
};

$("voices").onclick = async () => {
  await save();
  say("Cargando voces…");
  const r = await send({ type: "voices" });
  if (!r?.ok) return fail(r, "(Para listar voces la clave necesita «Voces → Leído».)");
  const box = $("voicesBox");
  box.innerHTML = "";
  const lab = el("label", "", "Mis voces de ElevenLabs");
  lab.setAttribute("for", "voicePick");
  box.appendChild(lab);
  const sel = el("select");
  sel.id = "voicePick";
  sel.appendChild(new Option("— elige una —", ""));
  r.data.forEach((v) => sel.appendChild(new Option(`${v.name} (${v.category})`, v.id)));
  sel.onchange = () => { if (sel.value) $("elevenVoice").value = sel.value; };
  box.appendChild(sel);
  say(`${r.data.length} voces cargadas. Elige una, pulsa «Probar ElevenLabs». Ojo: las de tipo «cloned» pueden no estar permitidas en tu plan.`, "info");
};

/* ---------- Caché ---------- */
async function refreshStats() {
  const r = await send({ type: "cacheStats" });
  if (!r?.ok) { $("stats").textContent = "No se pudo leer la caché."; return; }
  const d = r.data;
  $("stats").textContent = `${d.translations} traducciones · ${d.audios} audios · ${(d.bytes / 1048576).toFixed(1)} MB de audio`;
}
$("statsBtn").onclick = refreshStats;
$("clear").onclick = async () => {
  if (!confirm("¿Vaciar la caché? Volverá a gastar tokens y créditos la próxima vez que veas esas frases.")) return;
  const r = await send({ type: "cacheClear" });
  if (!r?.ok) return fail(r);
  say("Caché vaciada ✓", "ok");
  refreshStats();
};
refreshStats();

/* ---------- Tema (claro / automático / oscuro) ---------- */
function applyTheme(t) {
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const cur = t === "light" || t === "dark" ? t : "auto";
  [["thLight", "light"], ["thAuto", "auto"], ["thDark", "dark"]].forEach(([id, v]) => $(id).classList.toggle("on", v === cur));
}
[["thLight", "light"], ["thAuto", "auto"], ["thDark", "dark"]].forEach(([id, v]) => {
  $(id).onclick = () => { applyTheme(v); chrome.storage.local.set({ theme: v }); };
});
chrome.storage.local.get("theme").then((v) => applyTheme(v.theme || "auto"));

/* ---------- Índice lateral: resalta la sección visible ---------- */
(() => {
  const links = [...document.querySelectorAll("#toc a")];
  const secs = links.map((a) => document.querySelector(a.getAttribute("href")));
  const mark = () => {
    let cur = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < 140) cur = i; });
    if (innerHeight + scrollY >= document.body.scrollHeight - 4) cur = secs.length - 1;
    links.forEach((a, i) => a.classList.toggle("on", i === cur));
  };
  addEventListener("scroll", mark, { passive: true });
  addEventListener("resize", mark);
  mark();
})();
