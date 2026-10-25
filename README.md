<p align="center"><img src="docs/banner.svg" alt="LiveDub" width="100%"></p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Versión" src="https://img.shields.io/badge/versi%C3%B3n-0.7.2-fa5a28">
  <img alt="Licencia MIT" src="https://img.shields.io/badge/licencia-MIT-green">
  <img alt="Sin dependencias" src="https://img.shields.io/badge/dependencias-0-lightgrey">
  <img alt="Claves locales" src="https://img.shields.io/badge/claves-solo%20en%20tu%20navegador-success">
</p>

<p align="center"><b>ES</b> · <a href="#english">EN</a></p>

# LiveDub — doblaje en vivo al español

Extensión de Chrome que **dobla al español, casi en tiempo real, cursos en vídeo en inglés**. Lee los subtítulos en inglés del reproductor, los traduce con **Claude** y los locuta con **ElevenLabs** (o con la voz gratuita del navegador), bajando el volumen del vídeo original. Pensada para cursos como los de Awwwards Academy.

## Por qué

Los subtítulos automáticos en español de las plataformas suelen ser malos. Aquí se parte del **inglés** y se traduce con un prompt que sabe que el texto viene de reconocimiento automático y corrige errores por contexto («playing jazz it» → «plain JavaScript»).

## Características

- **Lee los subtítulos en inglés aunque el CC esté apagado** (reproductores Video.js; resto de sitios por `textTracks` o por el DOM).
- **YouTube en segundo plano:** lee la transcripción completa del vídeo, así que sigue doblando aunque cambies de pestaña (ver [compatibilidad](#compatibilidad)).
- **Traducción con Claude** (Haiku 4.5 por defecto, Sonnet opcional), con 90 s de antelación y contexto de las frases vecinas.
- **Dos voces**: ElevenLabs (calidad) o voz del navegador (gratis). Interruptor para alternar sin borrar claves; si ElevenLabs falla, se desactiva y se recuerda.
- **Subtítulo en español propio** sobre el vídeo, personalizable: tamaño, opacidad, fuente, posición, ancho y negrita.
- **Caché local** (IndexedDB): no repites gasto de tokens ni créditos al rebobinar o recargar.
- **Sincronizado**: pausa, seek y ducking del audio original; funciona en pantalla completa.
- **Errores explicados**: cada fallo dice qué ha pasado y qué hacer.
- **Sin servidor, sin telemetría, sin dependencias.** Tus claves solo viven en `chrome.storage.local`.

## Idiomas y plataformas

**Idioma:** de momento LiveDub hace **solo inglés → español** (español de España). Está fijado en el prompt de traducción, en la detección de idioma y en la voz. Otros idiomas de destino (catalán, francés, portugués, alemán…) **no están previstos hasta que haya demanda**: si te interesan, propónlo en [Discussions → Ideas](../../discussions) y, si hay interés, se añade o puedes contribuir ([CONTRIBUTING.md](CONTRIBUTING.md)).

### Compatibilidad

| Plataforma | Estado | Cómo lee los subtítulos | Probado en |
|---|---|---|---|
| **Awwwards Academy** (Video.js) | ✅ Probado | Pista de subtítulos en inglés, **aunque el CC esté apagado** | v0.6.x |
| **YouTube** | ✅ Probado | Lee la **transcripción completa** de YouTube (funciona con la pestaña en segundo plano). Si el vídeo no la tiene, activa el CC por ti y lee lo que se ve en pantalla (ahí la pestaña debe estar visible). En ambos casos oculta los subtítulos en inglés y muestra el tuyo en español | v0.7.0 |
| Otros reproductores Video.js | 🟡 Debería funcionar | Pista de subtítulos (`textTracks`) | Sin probar |
| Otros sitios | 🟡 Depende | Si publican `textTracks` o pintan los subtítulos en pantalla (activa el CC) | Sin probar |
| Vídeos **sin subtítulos** | ❌ No soportado | No hay texto que leer (modo por audio en la hoja de ruta) | — |

¿Lo has probado en otra plataforma (Udemy, Vimeo, Coursera, Frontend Masters…)? Cuéntalo en [Discussions → Show and tell](../../discussions) con lo que funcionó y lo que no, y lo añadimos a la tabla.

## Instalación (2 minutos)

1. Descarga el ZIP de la [última release](../../releases/latest) y **descomprímelo en una carpeta que no vayas a borrar** (o clona el repo y usa la carpeta `extension/`).
2. Abre `chrome://extensions` y activa **Modo desarrollador**.
3. **Cargar descomprimida** → elige la carpeta que contiene el archivo `manifest.json` (la del ZIP descomprimido, o `extension/` si clonaste el repo).
4. Haz clic en el icono de la extensión y pega tu **API key de Anthropic**. (Opcional: API key de ElevenLabs y Voice ID.)
5. Pulsa **Probar traducción** y **Guardar todo**.

> Al abrir Chrome verás un aviso de «extensiones en modo de desarrollador». Es normal con las extensiones cargadas así; puedes cerrarlo. Cuando LiveDub esté en la Chrome Web Store (está en la hoja de ruta), se instalará con un clic y no saldrá.

### Instalación en Firefox (escritorio y Android)

Firefox solo instala de forma permanente extensiones **firmadas por Mozilla**. Cada release incluye el archivo **`.xpi` firmado** (`…-0.7.2.xpi`); el ZIP de Firefox sin firmar solo sirve para cargarlo de forma temporal con `about:debugging`.

**Firefox para Android** (probado en Firefox Nightly, v0.7.2):

1. Instala **Firefox Nightly** desde Google Play y descarga el `.xpi` de la [última release](../../releases/latest) en el móvil.
2. En Nightly: **⋮ → Ajustes → Acerca de Firefox Nightly**, toca el logo unas 5 veces para activar el menú de depuración.
3. Vuelve a **Ajustes → Instalar extensión desde archivo** y elige el `.xpi`. Acepta el aviso de permisos.
4. Abre los ajustes de LiveDub (⋮ → Extensiones → LiveDub), pega tu **API key de Anthropic** y guarda: es un navegador distinto, así que empieza sin claves.
5. Abre un vídeo en `youtube.com` o Awwwards **desde el navegador** (la app de YouTube no admite extensiones) y pulsa **ES ▸ off**.

Notas: en móvil LiveDub **silencia** el audio original mientras dobla, porque el navegador no deja bajarle el volumen. Es una versión nueva: si algo no funciona, abre una [incidencia](../../issues) con tu modelo de móvil y la versión de Firefox. La publicación en la tienda de Mozilla (instalación con un toque) está en la hoja de ruta.

## Cómo conseguir las claves

- **Anthropic (obligatoria):** entra en <https://console.anthropic.com> → *API keys* → *Create key*. Hace falta saldo en la cuenta; con unos pocos dólares tienes para muchas horas de vídeo.
- **ElevenLabs (opcional):** entra en <https://elevenlabs.io> → *Ajustes → Developers → API keys*. El **Voice ID** se copia desde la voz elegida en la biblioteca o en «Mis voces». Con el plan gratuito, las voces **clonadas** no funcionan por API (error 401); usa una voz de la biblioteca.
- Sin ElevenLabs se usa la voz del navegador (gratis). En Edge, las voces «Natural» suenan mucho mejor.

## Actualizar a una versión nueva

1. Descarga el ZIP de la [última release](../../releases/latest) y descomprímelo **encima de la misma carpeta** que cargaste en Chrome (así se conservan tus claves y ajustes).
2. En `chrome://extensions`, pulsa ↻ en LiveDub y comprueba el número de versión.
3. Recarga con F5 la página del curso.

## Uso

1. Abre la lección y pulsa el botón naranja **«ES ▸ off»** sobre el vídeo → pasa a **«ES ▸ on»**.
2. Dale a play. El botón **🔊/🔈** alterna ElevenLabs y la voz del navegador.
3. Ajusta voz, modelo y aspecto del subtítulo en los ajustes.

## Guía de ajustes

Haz clic en el icono de LiveDub para abrir los ajustes. Arriba a la derecha puedes elegir tema **claro, automático u oscuro**, y a la izquierda tienes el índice de secciones.

<details>
<summary><b>🌐 Traducción</b></summary>

- **API key de Anthropic:** obligatoria. Se guarda solo en tu navegador.
- **Modelo:** Haiku 4.5 (rápido y barato, recomendado) o Sonnet 4.5 (más fino con la jerga técnica). El campo **Otro modelo** permite escribir un ID exacto y tiene prioridad sobre la lista.
- **Cómo traduce:** agrupa los subtítulos en frases, las envía a Claude en lotes y traduce con unos **90 segundos de antelación**. El prompt sabe que los subtítulos son automáticos y corrige errores de reconocimiento usando el contexto de las frases vecinas.
- **YouTube: leer la transcripción completa** (activado por defecto): LiveDub abre un momento el panel «Mostrar transcripción» de YouTube (invisible), lee las frases con su tiempo y lo cierra. Permite doblar con la pestaña en segundo plano y traducir con antelación. Desactívalo solo si YouTube cambia su página y falla: entonces vuelve a leer lo que se ve en pantalla (con la pestaña visible).
- **Probar traducción:** hace una petición de prueba y te dice si la clave funciona, con el motivo y qué hacer si falla.
</details>

<details>
<summary><b>🎙️ Voz de ElevenLabs (opcional)</b></summary>

- **Usar ElevenLabs:** interruptor para alternar con la voz del navegador **sin borrar la clave ni el Voice ID**. También lo puedes cambiar con el botón 🔊/🔈 sobre el vídeo.
- **API key y Voice ID:** van juntos. Sin ellos se usa la voz del navegador.
- **Modelo de voz:** Flash v2.5 (rápido y más barato), Turbo v2.5 (equilibrado) o Multilingual v2 (mejor calidad, más lento y caro).
- **Estabilidad:** más baja = voz más expresiva y variable; más alta = más constante. Para un curso, entre 0,5 y 0,7.
- **Similitud con la voz:** cuánto se parece a la voz original elegida.
- **Velocidad:** velocidad base. Además, LiveDub acelera cada frase lo justo para que no se solape con la siguiente.
- **Ahorro de créditos:** el audio solo se genera para los próximos ~25 segundos de vídeo, no por adelantado entero.
- **Si ElevenLabs falla** con un error fatal (clave inválida, sin créditos, voz no permitida…) o 3 veces seguidas, se **desactiva y se recuerda**, y se usa la voz del navegador sin más errores. Se levanta solo si cambias clave, Voice ID o modelo, con **Reintentar ElevenLabs**, con el botón sobre el vídeo o si **Probar ElevenLabs** funciona.
- **Cargar mis voces:** lista las voces de tu cuenta para elegir una. La clave necesita el permiso «Voces → Leído».
</details>

<details>
<summary><b>🔈 Voz del navegador (gratis)</b></summary>

Es la voz de reserva cuando no hay ElevenLabs. Elige una concreta o **Automática** (la mejor en español disponible). Las voces «Natural» u «Online» (por ejemplo en Edge) suenan mucho mejor que las locales. **Probar voz del navegador** la reproduce al momento.
</details>

<details>
<summary><b>💬 Subtítulo sobre el vídeo</b></summary>

LiveDub dibuja su **propio subtítulo en español** sobre el vídeo, independiente del de la plataforma. Puedes activarlo o desactivarlo y cambiar:

- **Tamaño**, **ancho máximo** (% del vídeo) y **fuente** (solo fuentes del sistema), además de la **negrita**.
- **Opacidad del fondo** y **del texto**.
- **Altura desde el borde inferior:** más bajo = más cerca del borde. La barra del reproductor ocupa unos 45 px.

Hay una vista previa en vivo, los cambios se guardan solos y se aplican al instante en las pestañas abiertas. En pantalla completa el subtítulo y los botones se mueven al elemento a pantalla completa para que sigan visibles.
</details>

<details>
<summary><b>⚡ Caché</b></summary>

Guarda en tu navegador (IndexedDB) cada **traducción** y cada **audio de ElevenLabs** ya generado. Si repites la misma frase con la misma voz, modelo y ajustes, **no se gastan tokens ni créditos**: al rebobinar o recargar la lección suena al instante.

- **Estadísticas:** número de traducciones, de audios y megas ocupados. Pulsa **Actualizar** para refrescarlas.
- **Límite de caché de audio (MB):** 500 por defecto. Al superarlo se borran primero los audios más antiguos. Un audio ocupa unos 30 MB por hora de vídeo.
- **Vaciar caché:** borra todo; la próxima vez que veas esas frases volverá a gastar tokens y créditos.
- Cambiar el modelo de traducción o la voz no corrompe nada: simplemente genera entradas nuevas.
- Las traducciones se invalidan solas cuando la extensión mejora el prompt de traducción.
</details>

<details>
<summary><b>🔍 Cómo lee los subtítulos</b></summary>

1. En **YouTube** lee la **transcripción completa** (la del botón «Mostrar transcripción»), aunque el CC esté apagado y con la pestaña en segundo plano. Si el vídeo no tiene transcripción, pasa al modo «live» (punto 4).
2. En reproductores **Video.js** (como Awwwards Academy) lee directamente la pista en inglés, **aunque el CC esté apagado o en español**.
3. Si no hay Video.js, usa las pistas de texto del `<video>`.
4. Como último recurso, el **modo «live»**: lee el texto que pinta el reproductor en pantalla. Ahí necesitas tener el CC activado (en YouTube lo activa LiveDub por ti); si pasan unos segundos sin detectar subtítulos, el botón avisa «activa CC».

Si los subtítulos ya vienen en español, se salta la traducción y solo locuta.
</details>

## Costes

Usas **tus propias claves**. Haiku es muy barato (céntimos por hora de vídeo) y la caché evita pagar dos veces la misma frase. ElevenLabs consume créditos de tu plan; sin ElevenLabs el coste de voz es cero.

## Privacidad, permisos y uso responsable

LiveDub **no tiene servidor propio, ni analítica, ni telemetría**. El código es abierto y pequeño para que puedas auditarlo.

**Qué datos salen de tu navegador:** solo el **texto de los subtítulos** que estás doblando, y únicamente después de pulsar «on».

- Se envía a **Anthropic** (`api.anthropic.com`) para traducirlo, con tu clave.
- Se envía a **ElevenLabs** (`api.elevenlabs.io`) para generar la voz, **solo si lo configuras**, con tu clave.
- No hay ninguna otra conexión. Tus claves se guardan en `chrome.storage.local`, en tu navegador.

**Por qué pide esos permisos** (Chrome mostrará «leer y cambiar datos en todos los sitios web»; es por lo primero de esta tabla):

| Permiso | Para qué lo usa |
|---|---|
| Scripts en todas las páginas (`<all_urls>`, todos los marcos) | Detectar si la página tiene un vídeo y pintar el botón «ES ▸ off». Hace falta porque los cursos usan reproductores en muchos dominios e *iframes*. |
| `storage` | Guardar tus ajustes y claves en tu navegador. |
| `unlimitedStorage` | Caché local de traducciones y audios, que puede superar el límite normal. |
| `https://api.anthropic.com/*` | Llamar a Claude para traducir. |
| `https://api.elevenlabs.io/*` | Llamar a ElevenLabs para la voz y la lista de voces. |

**Qué hace en una página:**

- **Sin pulsar el botón**, solo busca un `<video>` y dibuja el botón. No lee subtítulos ni envía nada.
- **Al pulsar «on»**, lee los subtítulos del reproductor (en YouTube abre un momento el panel de transcripción para leerlo) y los traduce.
- **No lee cookies, contraseñas ni formularios**, ni usa el almacenamiento de las páginas. Lo único que guarda es su propia caché.

¿Has encontrado algo que no cuadra? Mira [SECURITY.md](SECURITY.md).

**Uso responsable**

- Úsala para **uso personal en contenido al que tienes acceso legítimo**. No redistribuyas ni grabes material de terceros doblado. Respeta los términos de cada plataforma.
- Con el plan gratuito de ElevenLabs, las voces clonadas no se pueden usar por API (error 401); usa una voz de la biblioteca.

## Diagnóstico: cómo ver qué está pasando

LiveDub tiene dos "partes" y cada una escribe en su propia consola:

| Parte | Qué hace | Dónde ver sus mensajes |
|---|---|---|
| **Script de la página** | Detecta el vídeo y los subtítulos, pinta los botones y el subtítulo, reproduce la voz. | En la página del curso: **F12 → Consola**, y escribe `DobES` en el filtro. |
| **Service worker** | Habla con Anthropic (traducción) y ElevenLabs (voz), gestiona la caché. | En `chrome://extensions`, en la tarjeta de LiveDub, pulsa **«service worker»** (enlace «Inspeccionar vistas»). Se abre una ventana de DevTools: pestaña **Consola** para los mensajes y **Red (Network)** para ver cada petición a `api.anthropic.com` y `api.elevenlabs.io` con su código de respuesta (200 = bien, 401 = clave, 402/429 = créditos o límite). |

**Qué buscar**

- En la consola de la página:
  - `[DobES] transcripción de YouTube leída: N líneas → M frases` confirma que en YouTube lee la transcripción completa.
  - `[DobES] YouTube: este vídeo no ofrece transcripción` indica que ese vídeo no la tiene y usa el modo en pantalla.
  - `[DobES] subtítulo detectado: …` confirma que lee los subtítulos en el modo en pantalla.
  - `[DobES] Haiku: EN → ES` muestra cada traducción.
- En el service worker: los errores de las APIs con su código y el detalle. Si algo falla, los ajustes y el aviso junto al botón ya te dicen **qué ha pasado y qué hacer**; esta consola es el detalle técnico.
- Si el service worker aparece como «inactivo», es normal: Chrome lo duerme y lo despierta cuando hace falta. Pulsar el enlace lo despierta.

**El botón «Errores» de `chrome://extensions`**

Aparece en rojo cuando la extensión ha registrado algún error, aunque ya esté resuelto (por ejemplo, un fallo de ElevenLabs o una petición cancelada al cambiar de página). Púlsalo para leer el mensaje y la línea del código, y usa **«Borrar todo»** para limpiar el historial. Si salen errores nuevos mientras la usas con normalidad, abre un [issue](../../issues) con el texto (sin tus claves).

**Para reportar un fallo**, abre un [issue](../../issues/new/choose) y copia: la versión (ajustes, arriba), la plataforma, la voz que usabas, los mensajes de `DobES` de la consola de la página y el error del service worker. Nunca pegues tus claves.

## Solución de problemas

- **No suena nada**: comprueba que el botón dice «on». Abre la consola (F12), filtra por `DobES` y busca «subtítulo detectado».
- **Suena la voz del navegador en vez de ElevenLabs**: ElevenLabs falló y se desactivó. Mira el aviso junto al botón o «Probar ElevenLabs» en los ajustes.
- **Actualizar**: sustituye los archivos de la misma carpeta cargada en Chrome, pulsa ↻ en `chrome://extensions` y recarga la página.

## Hoja de ruta

- [ ] Probar y documentar otros navegadores Chromium (Edge, Opera, Brave).
- [ ] Publicar en la Chrome Web Store (y en la tienda de Edge).
- [ ] Firefox: probado en Android (Nightly) con `.xpi` firmado. Falta probar en escritorio y publicar en la tienda de Mozilla.
- [ ] Más plataformas probadas (Udemy, Vimeo, Coursera…), con lector propio si hace falta.
- [ ] Modo por captura de audio (para vídeos sin subtítulos): tabCapture + STT en streaming.
- [ ] Otros idiomas de destino (catalán, francés, portugués…): idioma configurable en Ajustes, prompt y voz dinámicos. *En pausa hasta que haya demanda o lo proponga la comunidad.*
- [ ] Más estilos de subtítulo (borde, color de fondo).
- [ ] Voz local gratuita de mejor calidad.

¿Quieres ayudar con alguna? Mira [CONTRIBUTING.md](CONTRIBUTING.md) o cuéntalo en [Discussions](../../discussions).

Más detalle de cambios en el [CHANGELOG](CHANGELOG.md). ¿Ideas o fallos? Abre un [issue](../../issues). Guía de contribución en [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

[MIT](LICENSE) © Douglas Ortega

LiveDub es un proyecto independiente y **no está afiliado, respaldado ni patrocinado** por Anthropic, ElevenLabs, Google/YouTube, Awwwards ni ninguna otra plataforma mencionada. Los nombres y marcas pertenecen a sus propietarios.

---

<a id="english"></a>

# LiveDub — live Spanish dubbing (EN)

A Chrome (Manifest V3) extension that **dubs English video courses into Spanish in near real time**. It reads the player's English subtitles, translates them with **Claude**, and speaks them with **ElevenLabs** or the free browser voice, ducking the original audio. Built for courses like Awwwards Academy, and it works on YouTube too.

**Highlights:** reads English tracks even with CC off (Video.js) · on YouTube it reads the full transcript, so it keeps dubbing in a background tab · context-aware translation that fixes auto-caption errors · ElevenLabs / browser voice switch with remembered failures · customizable on-screen Spanish subtitle · local cache to avoid re-spending tokens and credits · zero dependencies, no server, keys stay in `chrome.storage.local`.

**Languages:** currently **English → Spanish only** (Spain Spanish). Other target languages are not planned until there is demand — suggest one in [Discussions → Ideas](../../discussions) or contribute it.

### Install

1. Download the ZIP from the [latest release](../../releases/latest) and unzip it into a folder you won't delete (or clone the repo and use `extension/`).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the folder that contains `manifest.json`.
4. Click the LiveDub icon, paste your **Anthropic API key** (ElevenLabs key + Voice ID are optional), press **Test translation** and **Save all**.

Chrome will show a "developer mode extensions" notice on startup; that's normal for unpacked extensions. To update, unzip the new version over the same folder, press ↻ in `chrome://extensions` and reload the page.

### Install on Firefox (desktop and Android)

Firefox only permanently installs extensions **signed by Mozilla**. Each release includes the **signed `.xpi`** (`…-0.7.2.xpi`); the unsigned Firefox ZIP is only for temporary loading via `about:debugging`.

**Firefox for Android** (tested on Firefox Nightly, v0.7.2): install Firefox Nightly, download the `.xpi` from the [latest release](../../releases/latest) on your phone, tap the Firefox logo ~5 times in **Settings → About Firefox Nightly** to enable the debug menu, then use **Settings → Install extension from file**. Open LiveDub's settings and paste your Anthropic key (new browser, no keys yet). Use the site in the browser (the YouTube app doesn't support extensions). On mobile LiveDub **mutes** the original audio while dubbing, since the browser ignores the video volume. Store listing on Mozilla's add-ons site is on the roadmap.

### Get your keys

- **Anthropic (required):** <https://console.anthropic.com> → *API keys* → *Create key*. You need credit on the account; a few dollars cover many hours of video.
- **ElevenLabs (optional):** <https://elevenlabs.io> → *Settings → Developers → API keys*. Copy the **Voice ID** from the voice in your library. On the free plan, *cloned* voices don't work through the API (401 error); use a library voice.
- Without ElevenLabs, the free browser voice is used (voices called "Natural" in Edge sound much better).

### Use

Open a lesson and click the orange **"ES ▸ off"** button over the video so it turns into **"ES ▸ on"**, then press play. The 🔊/🔈 button switches between ElevenLabs and the browser voice. Voice, model and subtitle appearance are in the settings (light, auto and dark themes).

### Compatibility

| Platform | Status | How it reads subtitles |
|---|---|---|
| Awwwards Academy (Video.js) | ✅ Tested | English track, even with CC off |
| YouTube | ✅ Tested | Full transcript (works in a background tab). Falls back to on-screen captions if the video has no transcript |
| Other Video.js players | 🟡 Should work | Text tracks. Untested |
| Other sites | 🟡 Depends | If they expose `textTracks` or render captions on screen. Untested |
| Videos **without** subtitles | ❌ Not supported | Nothing to read (audio mode is on the roadmap) |

Tried another platform? Tell us in [Discussions → Show and tell](../../discussions).

### Troubleshooting & diagnostics

- **Nothing plays:** check the button says "on". Open the page console (F12), filter by `DobES` and look for "subtítulo detectado" (on-screen mode) or "transcripción de YouTube leída" (YouTube).
- **Browser voice instead of ElevenLabs:** ElevenLabs failed and was switched off. Check the notice next to the button, or use *Test ElevenLabs* in the settings.
- **Service worker logs:** in `chrome://extensions`, click **service worker** on the LiveDub card. The *Network* tab shows each request to `api.anthropic.com` and `api.elevenlabs.io` (401 = key, 402/429 = credits or rate limit).
- **Reporting a bug:** open an [issue](../../issues/new/choose) with the version, platform, voice used, the `DobES` console lines and any service worker error. **Never paste your keys.**

### Privacy & permissions

No server of its own, no analytics, no telemetry. The only data that leaves your browser is the **subtitle text** being dubbed, after you press "on": it goes to **Anthropic** (translation) and, if you enable it, to **ElevenLabs** (voice), using your own keys. Keys live in `chrome.storage.local`. It does not read cookies, passwords or forms.

The extension asks for access to all sites only to detect a video and draw its button; it does nothing else until you press "on". Other permissions: `storage` and `unlimitedStorage` (settings and local cache), plus the two API hosts above. Found something that doesn't add up? See [SECURITY.md](SECURITY.md).

### Costs, responsible use and roadmap

You use **your own keys**: Haiku is very cheap and the cache avoids paying twice for the same sentence; ElevenLabs uses your plan's credits. **Use responsibly:** personal use on content you are entitled to watch; don't redistribute dubbed third-party material; follow each platform's terms. See the roadmap (in Spanish, above) and [CONTRIBUTING.md](CONTRIBUTING.md) if you'd like to help.

LiveDub is an independent project and is **not affiliated with or endorsed by** Anthropic, ElevenLabs, Google/YouTube, Awwwards or any other mentioned platform.

Licensed under [MIT](LICENSE).
