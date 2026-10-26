# Política de privacidad / Privacy policy — LiveDub

*Última actualización / Last updated: 2026-10-26*

## Español

**LiveDub no recoge, almacena ni envía datos a ningún servidor del autor.** No hay cuentas, analítica, publicidad ni rastreadores. El autor (Douglas Ortega) no recibe nada de lo que haces con la extensión.

**Qué hace la extensión con tus datos**

- **Subtítulos del vídeo:** LiveDub lee el texto de los subtítulos o la transcripción del vídeo que estás viendo (por ejemplo en YouTube o en cursos online) para poder traducirlo.
- **Traducción (Anthropic):** ese texto se envía a la API de Anthropic (`api.anthropic.com`) usando **tu propia clave de API**, para traducirlo al español. Se aplica la política de privacidad de Anthropic.
- **Voz (ElevenLabs, opcional):** si activas la voz de ElevenLabs, el texto traducido se envía a `api.elevenlabs.io` con **tu propia clave**. Se aplica la política de ElevenLabs. Si usas la voz del navegador, no se envía nada a ElevenLabs.
- **Tus claves de API:** se guardan únicamente en el almacenamiento local de tu navegador (`storage.local`). Nunca se envían a nadie salvo al servicio al que pertenecen (Anthropic o ElevenLabs).
- **Caché:** las traducciones y el audio generado se guardan localmente en tu navegador (IndexedDB) para no pagar dos veces por lo mismo. Puedes borrarlos desde las opciones de la extensión o desactivando/desinstalando la extensión.

**Permisos:** `storage` y `unlimitedStorage` (ajustes y caché locales) y acceso a las páginas que visitas (para leer subtítulos y mostrar los subtítulos en español), además de conexión a `api.anthropic.com` y `api.elevenlabs.io`. No se usa para nada más.

**Código abierto:** todo el código está en https://github.com/lukybrou/livedub (licencia MIT) y puedes comprobarlo.

**Contacto:** https://github.com/lukybrou/livedub/issues

## English

**LiveDub does not collect, store or send data to any server owned by the author.** There are no accounts, analytics, ads or trackers. The author (Douglas Ortega) receives nothing about how you use the extension.

**What the extension does with your data**

- **Video subtitles:** LiveDub reads the subtitle/transcript text of the video you are watching (e.g. on YouTube or online course sites) in order to translate it.
- **Translation (Anthropic):** that text is sent to the Anthropic API (`api.anthropic.com`) using **your own API key** to translate it into Spanish. Anthropic's privacy policy applies.
- **Voice (ElevenLabs, optional):** if you enable ElevenLabs voice, the translated text is sent to `api.elevenlabs.io` with **your own key**. ElevenLabs' privacy policy applies. If you use the browser voice, nothing is sent to ElevenLabs.
- **Your API keys:** stored only in your browser's local storage (`storage.local`). They are never sent anywhere except to the service they belong to (Anthropic or ElevenLabs).
- **Cache:** translations and generated audio are stored locally in your browser (IndexedDB) to avoid paying twice for the same content. You can clear them from the extension options or by uninstalling.

**Permissions:** `storage` and `unlimitedStorage` (local settings and cache) and access to the pages you visit (to read subtitles and display Spanish captions), plus network access to `api.anthropic.com` and `api.elevenlabs.io`. Nothing else.

**Open source:** all code is at https://github.com/lukybrou/livedub (MIT) and can be inspected.

**Contact:** https://github.com/lukybrou/livedub/issues
