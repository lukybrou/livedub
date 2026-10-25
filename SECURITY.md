# Política de seguridad

LiveDub guarda tus claves de API en tu navegador y las usa para llamar a Anthropic y ElevenLabs. Nos tomamos en serio cualquier fallo que pueda exponerlas.

## Cómo reportar una vulnerabilidad

**No abras un issue público** con los detalles. Usa el aviso privado de GitHub:

1. Ve a la pestaña [**Security**](../../security) del repositorio.
2. Pulsa **Report a vulnerability** y describe el problema: qué ocurre, cómo reproducirlo y qué impacto crees que tiene.

Responderé en cuanto pueda y te mantendré al tanto. Cuando esté corregido, publicaré una nueva versión y, si lo deseas, te mencionaré en las notas.

## Qué nos interesa especialmente

- Cualquier forma de **filtrar o leer las claves de API** (por ejemplo, desde una página web).
- Que la extensión envíe datos a **dominios distintos de Anthropic y ElevenLabs**.
- Que una página pueda **activar acciones** de la extensión sin que el usuario lo pida.

## Qué debes hacer tú

- **Nunca pegues tus claves** en issues, discusiones ni capturas.
- Si crees que una clave se ha expuesto, **revócala y crea otra** en [Anthropic](https://console.anthropic.com) o [ElevenLabs](https://elevenlabs.io).
- Instala LiveDub solo desde este repositorio o desde fuentes oficiales anunciadas aquí.

## Versiones con soporte

Solo la **última versión** publicada recibe correcciones de seguridad.
