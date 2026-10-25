// Traduce errores técnicos de las APIs a "qué ha pasado" + "qué hacer".
// Se usa en la página de ajustes y en el reproductor (aviso junto al botón).
(function (g) {
  function explain(raw, status) {
    raw = String(raw || "");
    const low = raw.toLowerCase();
    const prov = /^elevenlabs/i.test(raw) ? "eleven" : /^anthropic/i.test(raw) ? "anthropic" : "other";
    const m = raw.match(/^(?:ElevenLabs|Anthropic) (\d{3})/i);
    const st = Number(status || (m && m[1]) || 0);

    if (/failed to fetch|networkerror|load failed/.test(low) || (!st && /network/.test(low))) {
      return {
        title: "Sin conexión con el servicio",
        tip: "Comprueba tu conexión a internet. Si usas VPN, bloqueador de anuncios o un firewall, pueden estar bloqueando api.anthropic.com o api.elevenlabs.io.",
      };
    }

    if (prov === "eleven") {
      if (/instantly cloned|not available on your current plan|upgrade your subscription/.test(low))
        return {
          title: "Tu plan no permite voces clonadas por API",
          tip: "Esa voz es una clonación instantánea y ElevenLabs solo la deja usar por API en planes de pago. Elige una voz predefinida con «Cargar mis voces», o mejora el plan en ElevenLabs → Suscripción. Mientras tanto se usa la voz del navegador.",
        };
      if (/missing_permissions|missing the permission|permission/.test(low))
        return {
          title: "A la clave de ElevenLabs le falta un permiso",
          tip: "En ElevenLabs → Desarrolladores → Claves de API, edita la clave y activa «De texto a voz → Acceso» (y «Voces → Leído» para poder listar voces). Si no te deja editarla, crea una nueva y pégala aquí.",
        };
      if (/invalid_api_key|invalid api key/.test(low))
        return {
          title: "La clave de ElevenLabs no es válida",
          tip: "Puede estar mal pegada (sin espacios), borrada o caducada. Crea una nueva en ElevenLabs → Desarrolladores → Claves de API y pégala en su campo.",
        };
      if (/quota|credits|insufficient|payment/.test(low) || st === 402)
        return {
          title: "Te has quedado sin créditos de ElevenLabs",
          tip: "Se agotó el saldo. Espera a la renovación mensual o añade créditos en ElevenLabs → Suscripción. Mientras tanto se usa la voz del navegador.",
        };
      if (st === 401)
        return {
          title: "ElevenLabs rechazó la clave (401)",
          tip: "Revisa que la clave esté bien pegada y tenga el permiso «De texto a voz». Si usas una voz clonada, tu plan puede no permitirla: prueba con una voz predefinida.",
        };
      if (st === 403)
        return {
          title: "No tienes acceso a esa voz (403)",
          tip: "Las voces de la biblioteca comunitaria suelen requerir plan de pago. Usa una voz predefinida de tu cuenta con «Cargar mis voces».",
        };
      if (st === 404 || /voice_not_found|voice.*not.*found/.test(low))
        return {
          title: "No se encuentra esa voz (404)",
          tip: "El Voice ID está mal copiado o no es de tu cuenta. Usa «Cargar mis voces» y elígela de la lista.",
        };
      if (st === 422 || st === 400)
        return {
          title: "ElevenLabs no acepta los datos (" + st + ")",
          tip: "Revisa el Voice ID y el modelo de voz elegido. Prueba con «Flash v2.5».",
        };
      if (st === 429)
        return {
          title: "Demasiadas peticiones a ElevenLabs (429)",
          tip: "Espera unos segundos; la extensión reintenta sola con las siguientes frases. Si se repite, el plan limita las peticiones simultáneas.",
        };
      if (st >= 500)
        return {
          title: "ElevenLabs tiene un fallo temporal (" + st + ")",
          tip: "No es cosa tuya. Se usa la voz del navegador y se vuelve a intentar con las siguientes frases.",
        };
    }

    if (prov === "anthropic" || /anthropic/.test(low)) {
      if (/credit balance|billing|too low/.test(low))
        return {
          title: "Sin saldo en Anthropic",
          tip: "Añade fondos en platform.claude.com → Billing. Sin saldo no se puede traducir.",
        };
      if (st === 401)
        return {
          title: "La clave de Anthropic no es válida (401)",
          tip: "Puede estar mal pegada, borrada o caducada (las claves nuevas caducan según lo que elegiste al crearlas). Crea otra en platform.claude.com → Claves y acceso.",
        };
      if (st === 403)
        return { title: "Anthropic denegó el acceso (403)", tip: "La clave no tiene permiso en ese espacio de trabajo. Crea una nueva en el espacio de trabajo predeterminado." };
      if (st === 404)
        return {
          title: "Ese modelo no existe (404)",
          tip: "Revisa el campo «Otro modelo». Déjalo vacío para usar el de la lista (Haiku 4.5).",
        };
      if (st === 429)
        return { title: "Límite de peticiones de Anthropic (429)", tip: "Demasiadas peticiones seguidas. Espera unos segundos; la extensión reintenta sola." };
      if (st === 529 || st >= 500)
        return { title: "Anthropic está saturado (" + st + ")", tip: "Fallo temporal. Se reintenta con las siguientes frases." };
      if (st === 400)
        return { title: "Anthropic rechazó la petición (400)", tip: "Suele ser un modelo mal escrito en «Otro modelo». Déjalo vacío para usar el predeterminado." };
    }

    if (/falta api key o voice id/.test(low))
      return { title: "Falta la clave o el Voice ID de ElevenLabs", tip: "Rellena los dos campos de ElevenLabs y pulsa Guardar. Sin ambos se usa la voz del navegador." };
    if (/falta la api key de anthropic/.test(low))
      return { title: "Falta la clave de Anthropic", tip: "Pégala en «API key de Anthropic» y pulsa Guardar." };
    if (/longitud distinta/.test(low))
      return { title: "La traducción llegó incompleta", tip: "Pasa de vez en cuando; se reintenta sola. Si se repite mucho, prueba con Sonnet en el selector de modelo." };

    return {
      title: "Error inesperado",
      tip: "Copia el detalle técnico y envíaselo a quien mantiene la extensión.",
    };
  }
  g.DobErr = { explain };
})(typeof window !== "undefined" ? window : self);
