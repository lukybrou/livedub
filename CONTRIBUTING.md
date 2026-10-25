# Contribuir a LiveDub

¡Gracias por el interés! LiveDub es una extensión **sin build y sin dependencias**: editas los archivos de `extension/`, recargas la extensión y pruebas en un vídeo. Esta guía te cuenta cómo hacerlo.

> English speakers: you're welcome too. Issues, discussions and pull requests in English are fine.

## Antes de empezar

- **¿Una pregunta o una idea?** Usa [Discussions](../../discussions) (Q&A para dudas, Ideas para propuestas).
- **¿Un fallo?** Abre un [issue](../../issues/new/choose) con la plantilla. No pegues claves API.
- **¿Un cambio grande** (nueva plataforma, nuevo proveedor, otro idioma)? Abre antes un issue o una discusión para acordar el enfoque. Así no pierdes tiempo con algo que quizá encaje de otra manera.
- Para cambios pequeños (un arreglo, un texto, un selector) puedes ir directo a un pull request.

## Flujo de trabajo (pull requests)

La rama `main` está protegida: **nadie sube directamente a ella**, ni siquiera el autor. Todo entra por pull request.

1. Haz un **fork** del repositorio y clónalo.
2. Crea una rama con un nombre descriptivo: `fix/youtube-transcripcion`, `feat/proveedor-openai`, `docs/instalacion`.
3. Haz tus cambios, prueba (ver abajo) y commitea.
4. Sube la rama a tu fork y abre un **pull request** hacia `main`. Rellena la plantilla.
5. Se fusiona con *squash*: tus commits se unen en uno. La rama se borra sola al fusionar.

```bash
git clone https://github.com/<tu-usuario>/livedub.git
cd livedub
git checkout -b fix/lo-que-arreglas
# ...cambios...
git add -A
git commit -m "fix(youtube): descripción corta"
git push -u origin fix/lo-que-arreglas
```

**Mensajes de commit:** prefijo + descripción corta, en español o inglés: `feat:` (función nueva), `fix:` (arreglo), `docs:` (solo documentación), `refactor:` (sin cambio visible).

## Probar en local

1. Abre `chrome://extensions`, activa **Modo desarrollador** y pulsa **Cargar descomprimida** → elige la carpeta `extension/`.
2. Tras cada cambio, pulsa **↻** en la tarjeta de LiveDub y **recarga con F5** la página del vídeo.
3. Necesitas tu propia API key de Anthropic (ver el [README](README.md#cómo-conseguir-las-claves)). ElevenLabs es opcional.
4. Mira las consolas: la de la página (F12, filtro `DobES`) y la del *service worker* (en `chrome://extensions`, enlace «service worker»). Ver [Diagnóstico](README.md#diagnóstico-cómo-ver-qué-está-pasando).

**Lista de comprobación manual** (no hay tests automáticos todavía). Antes de abrir el PR, prueba lo que toque tu cambio:

- [ ] Un vídeo de **YouTube** con transcripción, y con la pestaña en segundo plano.
- [ ] Un curso **Video.js** (por ejemplo Awwwards Academy), con el CC apagado.
- [ ] Con la **voz del navegador** y, si puedes, con **ElevenLabs**.
- [ ] Pausa, rebobinar (seek) y pantalla completa.
- [ ] La página de **Ajustes**, en tema claro y oscuro, si la tocas.
- [ ] Que no aparecen errores nuevos en el botón «Errores» de `chrome://extensions`.

## Mapa del código

| Archivo | Qué hace |
|---|---|
| `extension/manifest.json` | Permisos, scripts y versión. |
| `extension/content.js` | El corazón en la página: encuentra el vídeo, lee los subtítulos, agrupa frases, pide traducciones, reproduce la voz, pinta el botón y el subtítulo en español. |
| `extension/page.js` | Corre en el «mundo de la página» para leer las pistas de los reproductores Video.js, que `content.js` no puede ver. |
| `extension/background.js` | *Service worker*: habla con Anthropic (traducción) y ElevenLabs (voz), guarda la caché (IndexedDB) y entrega los ajustes. |
| `extension/options.html` + `options.js` | Página de ajustes. |
| `extension/errors.js` | Traduce los errores de las APIs a mensajes comprensibles. |

`content.js` y `background.js` se hablan con mensajes (`chrome.runtime.sendMessage`): `translate`, `tts`, `voices`, `cfg`, `cacheStats`… Los verás en `background.js`, en el `onMessage`.

## Cómo añadir…

### …una plataforma nueva

`content.js` intenta leer los subtítulos en este orden y se queda con el primero que funcione: **YouTube** (`loadFromYouTube`), **Video.js** y pistas del `<video>` (`loadFromTrack`), y como último recurso el **DOM** (`loadFromDom`, lo que el reproductor pinta en pantalla).

Para una plataforma con su propio reproductor, lo habitual es añadir una función `loadFromX()` que devuelva frases con esta forma y se llame desde `start()`:

```js
{ start: 12.4, end: 15.0, en: "Texto en inglés de la frase", state: 0 }
```

`state` es 0 (pendiente), 1 (traduciendo) o 2 (traducida, con `es`). Lo más cómodo es construir una lista de «cues» `{ start, end, text }` y pasarla por `groupSentences()`, que las une en frases completas. Si la plataforma solo pinta subtítulos en pantalla, a veces basta añadir su selector a `loadFromDom`.

Cuando lo pruebes, añade la plataforma a la tabla de [compatibilidad](README.md#compatibilidad) y cuéntalo en el PR.

### …otro proveedor de traducción

Hoy la traducción pasa por `callClaude()` y `translate()` en `background.js`. Un proveedor nuevo debería: devolver un texto por cada frase de entrada, mantener el `sha(...)` de la caché (incluye modelo y versión del prompt) y respetar los errores ya explicados en `errors.js`. Si cambias el prompt, **sube `PROMPT_V`** para invalidar la caché antigua. Añade el selector y los campos de clave en `options.html`/`options.js`, y guarda las claves solo en `chrome.storage.local`.

### …otro proveedor de voz

Mira `tts()` en `background.js` y `speakEleven` / `speakBrowser` en `content.js`. Respeta la caché de audio, el límite de MB y la lógica de «si falla, se desactiva y se recuerda».

### …otro idioma de destino

Hoy está fijado en español en tres sitios: el prompt (`SYSTEM`), `isSpanish()` y la voz. Hay una nota en el [README](README.md#idiomas-y-plataformas) y un hueco en la hoja de ruta. Antes de empezar, abre una discusión: es un cambio transversal.

## Reglas del proyecto

- **Sin dependencias ni build.** JavaScript sencillo, que se pueda leer y auditar.
- **Las claves solo viven en `chrome.storage.local`.** Nada se envía a más servidores que Anthropic y ElevenLabs. Sin analítica ni telemetría.
- **Cambios pequeños y centrados.** Un PR, un propósito.
- **Nunca subas claves ni capturas con claves visibles.**
- **Si cambia el comportamiento visible para el usuario:** añade una entrada al `CHANGELOG.md` y sube la versión en `extension/manifest.json` (parche `0.7.1` para un arreglo, `0.8.0` para una función). El mantenedor decide cuándo se publica una *release*.
- **Solo documentación:** no hace falta tocar versión ni CHANGELOG.
- Comentarios del código y textos de la interfaz en **español**, salvo que el cambio sea para otro idioma.

## Licencia

Al contribuir, aceptas que tu aportación se publique bajo la licencia [MIT](LICENSE) del proyecto.

## Seguridad

Si encuentras una vulnerabilidad, **no abras un issue público**: sigue [SECURITY.md](SECURITY.md).
