# LiveDub — guía para agentes (AGENTS.md)

> Archivo principal para **OpenCode** y otros agentes. `CLAUDE.md` solo remite a este.

LiveDub es una extensión MV3 (Chrome/Edge/Opera/Firefox, escritorio y Android) que dobla al español vídeos en inglés casi en tiempo real: lee los subtítulos/transcripción en inglés → Claude Haiku los traduce (clave del propio usuario) → voz de ElevenLabs o del navegador + subtítulo propio en español + caché local (IndexedDB). Mantenedor: Douglas Ortega (`lukybrou`). Hablamos en **español**. Lee también `CONTRIBUTING.md` (mapa del código y reglas), `README.md` y **`docs/HISTORIAL.md`** (decisiones, lecciones y qué se probó en cada navegador).

## Qué puede hacer el agente (autorizado por el mantenedor) y qué no
**Autorizado, sin pedir permiso:** crear ramas, commits, `python tools/build.py`, abrir PR (con `gh pr create`) y consultar el estado de PRs y Actions.
**Autorizado, avisando antes de cada paso (el mantenedor confirma):** `git push` de la rama, y —solo después de que el mantenedor haga el merge del PR— crear el tag `vX.Y.Z` sobre el HEAD de `main` (verificando el hash) y la release (`gh release create`) con los zips de `python tools/build.py`. El `.xpi` firmado lo adjunta el mantenedor.
**Prohibido siempre:**
- Push a `main`, push forzado, reescribir historia, borrar ramas, tags o releases.
- Hacer el merge de un PR (`gh pr merge`): lo hace el mantenedor tras revisar.
- Subir nada a AMO, Chrome Web Store u otros servicios externos.
- Tocar los ajustes del repo en GitHub (rulesets, seguridad, colaboradores) ni la config global de git.
- Leer, imprimir o guardar claves de API o tokens. **No saques el token con `git credential fill` ni equivalente.** Para hablar con GitHub usa la CLI oficial `gh` ya autenticada por el mantenedor (`gh auth status`); si no está instalada o autenticada, para y pídele al mantenedor que la instale/autentique o que haga el paso desde la web.
- Cambiar `opencode.json`, `.claude/settings.json` o esta sección sin permiso explícito.
Si algo te lo impide, no lo rodees: para y pregunta.
Los permisos de `opencode.json` (OpenCode, el agente que usa el mantenedor) y `.claude/settings.json` (Claude Code, opcional) refuerzan estas reglas. El candado real está en GitHub: el ruleset de `main` exige PR.

## Reglas de trabajo
- `main` está protegida: **trabaja en una rama y abre un PR**. No hagas push a `main`. El mantenedor hace el merge.
- **La fuente de verdad es `extension/`.** No edites copias. El manifest de Firefox se genera en `tools/build.py`.
- Nunca pongas claves de API en el repo, en capturas ni en el chat. Las claves solo viven en `chrome.storage.local` del navegador del usuario.
- Red: solo `api.anthropic.com` y `api.elevenlabs.io`. No añadas analítica ni otros dominios. Si cambia lo que se envía o guarda, actualiza `PRIVACY.md`.
- Si el cambio es **visible para el usuario**: entrada en `CHANGELOG.md` + subir versión en `extension/manifest.json` (parche = arreglo, menor = función) + badge del README. Solo los cambios visibles llevan tag y release; la documentación sola = commit + push, sin tag.
- Prueba antes de dar algo por hecho; di claramente qué probaste y qué no (no se puede probar el DOM real de las plataformas desde el agente).

## Estructura
`extension/content.js` (corazón en la página: vídeo, subtítulos, botón ES, voz, avisos), `page.js` (mundo de la página, pistas Video.js), `background.js` (service worker: Anthropic, ElevenLabs, caché), `options.html/.js` (ajustes), `errors.js` (mensajes de error). Lectura de subtítulos por orden: transcripción de YouTube → `textTracks` de Video.js → DOM en vivo. Detalles en `CONTRIBUTING.md`.

## Empaquetar
`python tools/build.py` genera en `dist/`: `livedub-vX.Y.Z.zip` (Chrome/Edge/Opera) y `livedub-firefox-vX.Y.Z.zip` (Firefox: `background.scripts`, `browser_specific_settings.gecko` con id `livedub@lukybrou.github.io`, min 128, `data_collection_permissions: websiteContent`, y `gecko_android`).
Chrome/Opera cargan la carpeta `extension/` sin empaquetar desde `chrome://extensions` (modo desarrollador).

## Publicar
1. Cambios en rama → PR → merge del mantenedor.
2. `python tools/build.py`. Tag `vX.Y.Z` y GitHub Release con los zips.
3. **Firefox:** Firefox solo instala de forma permanente extensiones firmadas por Mozilla. En AMO (Centro de Desarrolladores, add-on LiveDub, id arriba) se sube `livedub-firefox-vX.Y.Z.zip` con «Subir nueva versión». **AMO no admite repetir un número de versión**, ni entre canales. Canales: «Por tu cuenta» (no listado, firma automática en minutos, sirve el `.xpi` firmado para la release) y «En este sitio» (listado público, revisión manual). Textos de la ficha: `docs/amo-listing.md`; política de privacidad: `PRIVACY.md`. El `.xpi` firmado se descarga del Developer Hub y se adjunta a la release.
4. Chrome Web Store (pendiente): cuenta de desarrollador de pago único (~5 $), ficha con capturas y política de privacidad (`PRIVACY.md`).

## Estado (2026-10-26)
- Última versión: **0.7.4** (arreglo: el aviso de error se cierra siempre; ✕, clic en cualquier parte del aviso y Esc). Puede estar sin commit/push: revisa `git status`.
- Release publicada en GitHub: v0.7.2 (con `.xpi` firmado). Pendiente: commit + tag + release v0.7.4.
- AMO: 0.7.1 y 0.7.2 aprobadas como no listadas. Se está enviando la ficha **listada** (descripción, categoría «Ayuda de idioma», licencia MIT, política de privacidad, notas para el revisor, 3 capturas). Si se envió una 0.7.3, queda sustituida por la 0.7.4.
- Probado: Awwwards Academy (desktop), YouTube (desktop y m.youtube.com en Firefox Nightly Android con la 0.7.1; la 0.7.2 añadió CC automático en móvil y silenciar el audio original: **falta confirmar el resultado en el móvil**).
- Sin probar: Firefox de escritorio; Edge/Opera (resultados pendientes para la tabla de compatibilidad del README); prueba de 5–10 min en segundo plano.

## Pendiente (en orden de valor)
1. Terminar el envío de AMO listado y esperar la revisión. Confirmar prueba de móvil v0.7.2+.
2. Commit/PR/tag/release de la 0.7.4. Actualizar tabla de compatibilidad del README.
3. Idea aparcada: clic en el icono de la barra = activar/desactivar el doblaje en esa pestaña (clic derecho → opciones).
4. GIF de demostración y capturas; mensaje de bienvenida en Discussions; Chrome Web Store (+Edge); post en LinkedIn.
5. Higiene: eliminar el tema `claude-code` del repo, borrar el repo antiguo `doblar-voz` y carpetas locales viejas; rotar la clave de Anthropic que se expuso en el pasado.
6. Más adelante: otros idiomas, modo solo audio; iOS solo si hay demanda.

## Entorno local del mantenedor (Windows)
Repo: `C:\yolatam\ia-generativa\doblaje-en-vivo\livedub`. Existen copias antiguas fuera del repo (`...\doblaje-en-vivo\v0.1` para cargar en Chrome, `firefox-build`, `doblar-voz-releases`): **no son fuente de verdad**; si el mantenedor sigue cargando `v0.1`, hay que sincronizar `extension/` a esa carpeta o cambiar Chrome para que cargue `extension/`. En Windows git avisa de LF→CRLF (inofensivo). Si un `git` falla con `index.lock`, borra `.git\index.lock`.
