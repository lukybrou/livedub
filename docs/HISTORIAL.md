# Historial de decisiones y lecciones (para agentes y mantenedores)

Contexto que no se deduce del código. Complementa `CLAUDE.md`.

## Navegadores: qué sabemos
- **Chrome:** funciona (Awwwards Academy v0.6.x, YouTube v0.7.0). Se carga sin empaquetar desde `chrome://extensions` (modo desarrollador → «Cargar descomprimida»). Un botón «Errores» con «Extension context invalidated» es residuo de recargar la extensión: «Borrar todo» y F5 en las pestañas.
- **Edge y Opera:** se usan con la misma carpeta sin empaquetar. **No hay resultados de prueba registrados**: pendiente confirmar y reflejarlo en la tabla de compatibilidad del README.
- **Firefox escritorio:** sin probar.
- **Firefox Android (Nightly):** probado con la 0.7.1 en `m.youtube.com`. Hallazgos: (1) en YouTube móvil el botón `ES ▸` no traducía hasta activar el CC a mano (selector de CC distinto); (2) los navegadores móviles ignoran `video.volume`, así que sonaban a la vez el original y el doblaje. La 0.7.2 lo corrige (CC automático con selectores ampliados, **adivinados, sin verificar**; audio original silenciado en móvil y restaurado al parar). **Falta confirmar el resultado real en el móvil.**
- Navegadores móviles: la app de YouTube no admite extensiones; hay que usar el navegador.
- La etiqueta de idioma de las pistas automáticas de YouTube («Hindi (generados automáticamente)») es irrelevante.
- El panel de Firefox «Probar traducciones privadas» no tiene relación con LiveDub.

## Firefox: firmado y tienda (AMO)
- Firefox solo instala de forma permanente extensiones firmadas por Mozilla. Se eligió primero «Por tu cuenta» (no listado): firma automática en minutos (0.7.1 y 0.7.2 aprobadas). El `.xpi` firmado se baja del Developer Hub con clic derecho sobre el enlace del `.xpi` → «Guardar enlace como…», tipo «Todos los archivos» (un mal clic guardó una página HTML).
- Instalar en Nightly Android: tocar ~5 veces el logo en Ajustes → Acerca de → menú de depuración → «Instalar extensión desde archivo».
- **Listado público:** se hace desde «Subir nueva versión» → «Cambio» → «En este sitio». No hay interruptor en la ficha; AMO no admite repetir número de versión. Campos: resumen ≤250 caracteres, descripción (Markdown), casilla «necesita pago/servicios» **marcada** (requiere clave de Anthropic de pago), categoría «Ayuda de idioma», licencia MIT, política de privacidad **como texto** (casilla + cuadro), correo de ayuda vacío (es público), página de ayuda = issues de GitHub, notas para el revisor (acceso a todas las páginas porque los vídeos van en iframes; sin build ni minificado). Textos listos en `docs/amo-listing.md`. Estado al escribir esto: ficha en envío; la revisión es manual (horas a días).

## GitHub
- Ruleset: exige PR en `main`; el admin puede saltarlo (sale «Bypassed rule violations» al hacer push, normal). CodeQL, push protection, reporte privado de vulnerabilidades, Copilot Autofix y Discussions activados.
- Política de releases: solo para cambios visibles al usuario; documentación = commit + push sin tag.
- Un tag/release se crea sobre el commit que se tiene localmente: se creó una vez sobre un commit antiguo por un `.git/index.lock` colgado; se arregló con `git tag -f` + `git push origin <tag> --force`. Comprobar siempre en qué commit queda la release.

## Entorno del mantenedor
- Windows; el repo se toca a veces desde un agente en la nube con un shell que **no puede borrar**: `git checkout`, `rm` o commits dejan `.lock` y fallan. Para restaurar un fichero: `git show HEAD:ruta > ruta`.
- Para zips usar Python (`zipfile`) o `tools/build.py`, no `zip`.
- Avisos LF→CRLF de git en Windows: inofensivos.
- Mensajes e instrucciones al mantenedor: en español, paso a paso, sencillos; le gusta el tono enérgico y positivo.

## Decisiones de producto
- Prioridad: **móvil y facilidad de instalación** para otros usuarios (por eso la tienda de Mozilla; Chrome Web Store después).
- El icono de la barra hoy abre los ajustes. Idea aparcada: que haga de interruptor on/off por pestaña.
- Aviso de error (p. ej. sin créditos de ElevenLabs): debe poder cerrarse siempre (v0.7.4: ✕, clic por coordenadas en captura de ventana, Esc), porque algunos reproductores se tragan los clics sobre el vídeo.
