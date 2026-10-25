# Changelog — LiveDub

## v0.7.0 — 2026-10-25

- **YouTube en segundo plano:** LiveDub lee la **transcripción completa** del vídeo (el panel «Mostrar transcripción», que abre y cierra por sí mismo) en vez del texto que YouTube dibuja en pantalla. Ya no se corta al cambiar de pestaña, y se traduce con antelación como en Awwwards.
- Nuevo ajuste **YouTube: leer la transcripción completa** (activado por defecto). Si YouTube cambia su página y falla, se puede desactivar para volver al modo anterior.
- Si el vídeo no tiene transcripción, vuelve automáticamente al modo de lectura en pantalla (CC automático; la pestaña debe estar visible).
- Al cambiar de vídeo dentro de YouTube, LiveDub se apaga solo para no doblar con el texto del vídeo anterior.

## v0.6.2 — 2026-10-25

- **Arreglo YouTube:** ya no lee en voz alta textos de la interfaz del reproductor (barra de progreso, tooltips, capítulos, "0:04 / 53:17"…). En YouTube solo se leen los subtítulos reales (activa CC).
- En YouTube activa los subtítulos (CC) automáticamente si estaban apagados y oculta los de inglés, mostrando el subtítulo en español de LiveDub (si «Mostrar subtítulo» está activado).
- Filtro general: se ignoran textos con marcas de tiempo y zonas de controles del reproductor.

## v0.6.1 — 2026-10-25
- Ajustes: selector de tema claro / automático / oscuro (se recuerda).
- Ajustes: índice lateral con anclas que resalta la sección visible y diseño en dos columnas (en móvil pasa a barra superior).

## v0.6.0 — 2026-10-25
- Rediseño: nueva página de ajustes oscura y moderna (tarjetas por sección, interruptores, sliders, cabecera fija con «Guardar todo»).
- Nuevo icono de la extensión (play + ondas de voz) en 16/32/48/128 px.
- Botones y avisos sobre el vídeo con el mismo estilo (degradado naranja, vidrio oscuro).
- La versión se muestra en los ajustes.

## v0.5.2 — 2026-10-25
- Fix: con ElevenLabs, al terminar una frase se volvía a leer la misma hasta que cambiaba el subtítulo, y al llegar la siguiente se solapaban las dos. Causa: el audio terminado seguía referenciado y el planificador llamaba a `play()` en cada tick, que reinicia un audio acabado. Ahora el audio se libera al terminar y solo se reanuda lo que pausó la propia extensión al pausar el vídeo.
- Al cortar una frase por retraso se libera su promesa pendiente (sin colas huérfanas).

## v0.5.1 — 2026-10-25
- El subtítulo en español sobre el vídeo (propio de la extensión, no de la plataforma) ahora se personaliza en los ajustes: tamaño, opacidad del fondo, opacidad del texto, altura desde el borde inferior, ancho máximo, fuente (fuentes del sistema) y negrita. Con vista previa; se guarda solo y se aplica al instante en las pestañas abiertas.
- Por defecto queda más abajo (56 px del borde) y algo más grande/legible que antes.
- Pantalla completa: botones y subtítulo se mueven al elemento a pantalla completa para que sigan viéndose.

## v0.5.0 — 2026-10-25
- Lee los subtítulos en INGLÉS directamente del reproductor Video.js (Awwwards Academy y otros), aunque el CC esté apagado o en español. Nuevo `page.js` (content script en el mundo de la página) que lee `player.textTracks()` y se lo pasa al content script. Ya no hace falta tocar el menú CC ni caer en el modo «live».
- Se acabó depender de los subtítulos en español automáticos de la plataforma (malos): se traduce el inglés con Haiku.
- Prompt de traducción (v3): sabe que los subtítulos son automáticos y corrige errores de reconocimiento por contexto («playing jazz it» → «plain JavaScript»), y usa los trozos vecinos como contexto. Invalida las traducciones antiguas de la caché.
- Si el reproductor no es Video.js o no hay pista en inglés, se sigue usando textTracks del `<video>` y, en último caso, el modo live por DOM.

## v0.4.1 — 2026-10-25
- Subtítulo en español sobre el vídeo con lo que traduce Haiku (se puede desactivar en ajustes): así ves la traducción aunque no se oiga la voz.
- Vigilante de la voz del navegador: Chrome a veces no avisa de que terminó de hablar (voces «online») y la cola se quedaba bloqueada en silencio; ahora se desbloquea sola.
- Si pasan 7 s en modo live sin detectar subtítulos, el botón avisa «activa CC».
- Logs en consola (`[DobES] Haiku: EN → ES`) para diagnosticar.

## v0.4.0 — 2026-10-25
- Interruptor «Usar ElevenLabs» en los ajustes y botón «🔊 ElevenLabs / 🔈 Voz del navegador» sobre el vídeo: la clave y el Voice ID se quedan guardados y tú eliges qué voz usar, sin borrar nada.
- Si ElevenLabs falla con un error fatal (401/402/403/404/422) o 3 veces seguidas, se desactiva **y se recuerda** (también tras recargar): ya no hay «error, voz gratis, error, voz gratis…». Se avisa una sola vez, con qué hacer.
- El bloqueo se levanta solo si cambias clave, Voice ID o modelo, con «Reintentar ElevenLabs» (ajustes), con el botón sobre el vídeo o si «Probar ElevenLabs» funciona.
- Los ajustes muestran el estado: activo, apagado, bloqueado (con el motivo) o sin configurar.
- El botón de la extensión se alinea al borde derecho del vídeo aunque cambie de ancho.

## v0.3.2 — 2026-10-24
- Fix: el filtro de la 0.3.1 era demasiado agresivo y descartaba subtítulos reales (los contenedores del reproductor con «control/menu» en la clase o role=status). Ahora solo excluye botones, sliders, menús, tooltips y textos de interfaz conocidos.
- Log de depuración en consola: «[DobES] subtítulo detectado».

## v0.3.1 — 2026-10-24
- Fix modo live: ya no dobla los avisos del reproductor («Pause», «Play», «Unmute», «1x», tiempos…). Se ignoran botones, controles, menús y avisos aria-live de 1–2 palabras.

## v0.3.0 — 2026-10-24
- Caché en IndexedDB: traducciones y audios de ElevenLabs se guardan; al recargar o rebobinar no se gastan tokens ni créditos. Límite configurable (500 MB por defecto, borra lo más antiguo).
- Ajustes: estadísticas de caché, «Actualizar» y «Vaciar caché».
- ElevenLabs: sliders de estabilidad, similitud y velocidad; `language_code: es` en Flash/Turbo.
- Selector de voz del navegador (gratis) + «Probar voz del navegador».
- Prompt de traducción afinado para voz hablada natural (invalida traducciones antiguas).
- Permiso nuevo: unlimitedStorage.

## v0.2.1 — 2026-10-24
- Errores con recomendación: cada fallo de ElevenLabs o Anthropic se traduce a «qué ha pasado» + «qué hacer» (plan sin voces clonadas, permiso de clave, créditos agotados, voz no encontrada, clave inválida, saturación…), con el detalle técnico debajo.
- Aviso junto al botón del reproductor (una vez por tipo de error, se cierra al pulsar) y en la consola.
- Ajustes: nuevo botón «Probar traducción».

## v0.2.0 — 2026-10-24
- Errores de ElevenLabs visibles: el botón muestra el estado y, si falla (401/402/403…), cae a la voz del navegador sin repetir peticiones.
- Ajustes: «Probar voz» y «Cargar mis voces»; selector de modelo de voz y modelo de traducción personalizado.
- Si los subtítulos ya vienen en español, se salta la traducción.
- Ahorro de créditos: el audio de ElevenLabs solo se genera para los próximos ~25 s.
- Fix de sincronización al cortar una frase con retraso.

## v0.1.0 — 2026-10-24
- Primera versión: subtítulos EN (textTracks) agrupados en frases, traducción con Claude Haiku 4.5 por adelantado, voz del navegador o ElevenLabs, ducking del audio original, pausa/seek sincronizados, modo «live» por DOM.
- Pendiente: fallback por audio (tabCapture), selectores por sitio, caché de traducciones.

## Aprendido
- Las voces «Instant Voice Clone» (p. ej. la de Douglas) devuelven 401 por API en el plan Pay As You Go; hacen falta voces predefinidas o un plan de pago.
