# Textos para la ficha de AMO (listada)

## Nombre
LiveDub

## Resumen (máx. 250 caracteres)
EN: Watch English video courses in Spanish. LiveDub reads the subtitles, translates them with your own Claude key and speaks them in real time, with Spanish captions. Works on YouTube and online course sites, desktop and Android.

ES: Mira cursos en vídeo en inglés como si estuvieran en español. LiveDub lee los subtítulos, los traduce con tu propia clave de Claude y los dobla en directo con voz y subtítulos en español. YouTube, cursos online, escritorio y Android.

## Descripción (EN)
LiveDub dubs English video courses into Spanish in near real time.

How it works
1. It reads the English subtitles or transcript of the video you're watching (YouTube, Awwwards Academy and other course sites).
2. It translates them to Spanish with Claude (Anthropic), using YOUR OWN API key.
3. It speaks the translation with an ElevenLabs voice (your own key) or your browser's built-in voice, and shows its own Spanish captions.
4. Translations are cached locally, so rewatching a lesson costs nothing.

Features
- Real-time Spanish voice + captions
- Works on desktop and Firefox for Android
- Original audio is lowered (muted on mobile) so you only hear the dub
- Local cache: pay once per lesson
- Open source (MIT): https://github.com/lukybrou/livedub

Privacy: no accounts, no analytics, no tracking. Your keys stay in your browser. Subtitle text goes only to Anthropic (and spoken text to ElevenLabs if you enable it), with your keys. You need your own Anthropic API key (ElevenLabs optional).

## Descripción (ES)
LiveDub dobla al español cursos en vídeo en inglés, casi en tiempo real.

Cómo funciona
1. Lee los subtítulos o la transcripción en inglés del vídeo que estás viendo (YouTube, Awwwards Academy y otras plataformas de cursos).
2. Los traduce al español con Claude (Anthropic), usando TU PROPIA clave de API.
3. Los lee en voz alta con una voz de ElevenLabs (tu clave) o con la voz del navegador, y muestra sus propios subtítulos en español.
4. Las traducciones se guardan en caché local, así que volver a ver una clase no cuesta nada.

Características
- Voz y subtítulos en español en directo
- Funciona en escritorio y en Firefox para Android
- Baja el audio original (lo silencia en móvil) para oír solo el doblaje
- Caché local: pagas una sola vez por clase
- Código abierto (MIT): https://github.com/lukybrou/livedub

Privacidad: sin cuentas, sin analítica, sin rastreo. Tus claves se quedan en tu navegador. El texto de los subtítulos solo va a Anthropic (y el texto a locutar a ElevenLabs si lo activas), con tus claves. Necesitas tu propia clave de API de Anthropic (ElevenLabs es opcional).

## Categoría
Otros / Accesibilidad / Herramientas de vídeo (la que ofrezca AMO)

## Etiquetas
subtitles, translation, dubbing, spanish, youtube, courses

## Política de privacidad (URL)
https://github.com/lukybrou/livedub/blob/main/PRIVACY.md

## Soporte
https://github.com/lukybrou/livedub/issues  — Web: https://github.com/lukybrou/livedub

## Notas para el revisor
LiveDub needs host access on all pages because course videos are embedded in many sites and iframes. It reads subtitle text only from the video being watched. It connects only to api.anthropic.com and api.elevenlabs.io with keys the user enters. No remote code, no analytics. Source: https://github.com/lukybrou/livedub (extension/ folder is the submitted code, no build step, no minification).
