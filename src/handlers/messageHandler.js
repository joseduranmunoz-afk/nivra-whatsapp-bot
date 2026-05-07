const logger = require('../utils/logger');

// ─── Mensajes exactos del documento técnico Nivra_Bot_WhatsApp_v1 ───────────

const MSG = {
  MSG_0:
    `Hola 👋 Soy el asistente de *Nivra*.\n\n` +
    `¿Tu empresa tiene problemas de coordinación entre áreas que afectan resultados o clientes?\n\n` +
    `Responde:\n1️⃣ Sí, es un problema real\n2️⃣ Lo sospecho pero no tengo datos\n3️⃣ Solo estoy explorando`,

  MSG_1:
    `Entendido. Para mostrarte algo relevante:\n\n` +
    `¿Cuántas personas trabajan en tu empresa?\n` +
    `1️⃣ Menos de 100\n2️⃣ Entre 100 y 500\n3️⃣ Más de 500`,

  MSG_2:
    `¿Cuál es tu rol?\n` +
    `1️⃣ Recursos Humanos / Personas\n` +
    `2️⃣ Operaciones / Calidad\n` +
    `3️⃣ Desarrollo Organizacional\n` +
    `4️⃣ Otro cargo directivo`,

  MSG_3:
    `Perfecto. Para coordinar una demo de 20 min:\n\n` +
    `¿Cuál es tu nombre y empresa?\n` +
    `Escríbelo así: 👉 *Nombre / Empresa*`,

  MSG_4: (name) =>
    `Gracias ${name} 🙌\n\n` +
    `Elige un horario para tu demo:\n` +
    `1️⃣ Lunes o martes\n2️⃣ Miércoles o jueves\n3️⃣ Viernes\n\n` +
    `Te confirmo el link en minutos.`,

  MSG_5:
    `¡Listo! 🎉\n\n` +
    `Un ejecutivo de Nivra te escribirá en menos de 2 horas para confirmar día y hora exactos.\n\n` +
    `Mientras tanto puedes ver más en:\n🌐 nivraconsulting.com`,

  R1:
    `¡Gracias por tu interés! 🙌\n\n` +
    `Por ahora Nivra está optimizado para empresas con más de 100 colaboradores.\n\n` +
    `¿Te avisamos cuando tengamos un plan para equipos más pequeños?\n` +
    `1️⃣ Sí, avísame\n2️⃣ No, gracias`,

  R2:
    `Perfecto, no hay apuro 🙂\n\n` +
    `Te comparto un resumen de cómo Nivra mide la coordinación interna (ICSI) y qué resultados han visto otras empresas.\n\n` +
    `📎 nivraconsulting.com\n\n` +
    `Si en algún momento quieres ver una demo en vivo, escríbenos aquí.`,

  R3:
    `Gracias por contactarnos 👋\n\n` +
    `Nivra está diseñado para equipos de Personas, DO, Calidad u Operaciones.\n\n` +
    `¿Podrías reenviar este mensaje a quien lidera alguna de esas áreas?\n\n` +
    `Si eres tú, cuéntanos más sobre tu rol y con gusto agendamos igual 😊`,

  R4:
    `Hola de nuevo 👋\n\n` +
    `Solo queríamos asegurarnos de que recibiste nuestro mensaje.\n\n` +
    `¿Sigues interesado en ver cómo Nivra mide la calidad del servicio interno?\n` +
    `1️⃣ Sí, quiero agendar una demo\n2️⃣ Ahora no, escríbeme después\n3️⃣ No me interesa`,

  R5:
    `Entendido, sin problema 🙌\n\n` +
    `¿En cuánto tiempo sería mejor que te contactemos?\n` +
    `1️⃣ En 2 semanas\n2️⃣ En 1 mes\n3️⃣ Escríbeme yo cuando esté listo`,

  R6:
    `Perfecto, gracias por avisarnos 🙏\n\n` +
    `Si en algún momento cambia la situación, estamos aquí.\n\n` +
    `Que te vaya muy bien.`,
};

// ─── Mapeos de opciones a datos ────────────────────────────────────────────

const URGENCY   = { '1': 'alta', '2': 'media', '3': 'exploración' };
const COMP_SIZE = { '1': '<100', '2': '100-500', '3': '+500' };
const ROLE      = { '1': 'RRHH/Personas', '2': 'Operaciones/Calidad', '3': 'Desarrollo Organizacional', '4': 'Otro directivo' };
const SCHEDULE  = { '1': 'Lunes-Martes', '2': 'Miércoles-Jueves', '3': 'Viernes' };

// ─── Estado de sesiones ────────────────────────────────────────────────────

const sessions = new Map();

function newSession() {
  return {
    step: 'INIT',
    data: {},
    lastActivity: new Date(),
    followUpSent: false,
    leadLogged: false,
  };
}

// Extrae el número de opción (1-4) del mensaje del usuario
function parseOption(text) {
  const t = text.trim();
  if (/^[1-4]$/.test(t)) return t;
  const emojiMap = { '1️⃣': '1', '2️⃣': '2', '3️⃣': '3', '4️⃣': '4' };
  return emojiMap[t] ?? null;
}

function logLead(phone, data, tag) {
  const summary = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
  logger.info(`🎯 LEAD [${tag}] ${phone}: ${summary}`);
}

// ─── Manejador principal ────────────────────────────────────────────────────

async function handleWhatsappMessage(message, senderNumber) {
  if (!message?.trim()) return '¡Hola! Escríbeme tu pregunta 😊';

  const text = message.trim();

  // Reinicio del flujo si el usuario saluda por primera vez o usa /start
  const isGreeting = /^(hola|hi|hello|inicio|empezar|start|buenas|buenos)$/i.test(text) || text === '/start';

  if (isGreeting || !sessions.has(senderNumber)) {
    sessions.set(senderNumber, newSession());
    const session = sessions.get(senderNumber);
    session.step = 'MSG_0';
    session.lastActivity = new Date();
    return MSG.MSG_0;
  }

  const session = sessions.get(senderNumber);
  session.lastActivity = new Date();

  const opt = parseOption(text);
  const step = session.step;

  // ── MSG_0: nivel de urgencia ─────────────────────────────────────────────
  if (step === 'MSG_0') {
    if (opt === '1' || opt === '2') {
      session.data.urgency_level = URGENCY[opt];
      session.step = 'MSG_1';
      return MSG.MSG_1;
    }
    if (opt === '3') {
      session.data.urgency_level = URGENCY['3'];
      session.data.lead_status = 'lead-frío';
      session.step = 'R2';
      logLead(senderNumber, session.data, 'cold-lead');
      return MSG.R2;
    }
    return `Por favor responde con 1, 2 o 3 👆`;
  }

  // ── MSG_1: tamaño de empresa (solo captura, sin filtro) ──────────────────
  if (step === 'MSG_1') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.company_size = COMP_SIZE[opt];
      session.step = 'MSG_2';
      return MSG.MSG_2;
    }
    return `Por favor responde con 1, 2 o 3 👆`;
  }

  // ── MSG_2: rol del contacto ──────────────────────────────────────────────
  if (step === 'MSG_2') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.contact_role = ROLE[opt];
      session.step = 'MSG_3';
      return MSG.MSG_3;
    }
    if (opt === '4') {
      session.data.contact_role = ROLE['4'];
      session.step = 'R3';
      logLead(senderNumber, session.data, 'wrong-role');
      return MSG.R3;
    }
    return `Por favor responde con 1, 2, 3 o 4 👆`;
  }

  // ── MSG_3: nombre y empresa (texto libre) ────────────────────────────────
  if (step === 'MSG_3') {
    let name, company;
    if (text.includes('/')) {
      const parts = text.split('/');
      name    = parts[0].trim();
      company = parts.slice(1).join('/').trim();
    } else {
      name    = text;
      company = '';
    }
    session.data.name    = name;
    session.data.company = company;
    session.step = 'MSG_4';
    return MSG.MSG_4(name);
  }

  // ── MSG_4: disponibilidad horaria ────────────────────────────────────────
  if (step === 'MSG_4') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.preferred_schedule = SCHEDULE[opt];
      session.data.lead_status        = 'demo_agendada';
      session.step = 'MSG_5';
      if (!session.leadLogged) {
        session.leadLogged = true;
        logLead(senderNumber, session.data, '✅ DEMO-AGENDADA');
      }
      return MSG.MSG_5;
    }
    return `Por favor elige 1, 2 o 3 para tu disponibilidad 👆`;
  }

  // ── R2: lead frío (solo exploración) ─────────────────────────────────────
  if (step === 'R2') {
    // Si en algún momento expresan interés, retomar el flujo
    const interested = opt === '1' || /demo|si|sí|quiero|interesa/i.test(text);
    if (interested) {
      session.step = 'MSG_1';
      return MSG.MSG_1;
    }
    return `Cuando quieras ver la demo en vivo, escríbenos aquí 😊`;
  }

  // ── R3: cargo no calificado ──────────────────────────────────────────────
  if (step === 'R3') {
    // Cualquier respuesta positiva retoma el flujo de captura
    session.step = 'MSG_3';
    return MSG.MSG_3;
  }

  // ── R4: follow-up automático (enviado tras 24h de inactividad) ───────────
  if (step === 'R4') {
    if (opt === '1') { session.step = 'MSG_1'; return MSG.MSG_1; }
    if (opt === '2') { session.step = 'R5';    return MSG.R5; }
    if (opt === '3') {
      session.data.lead_status = 'descartado';
      session.step = 'R6';
      logLead(senderNumber, session.data, 'discarded');
      return MSG.R6;
    }
    return `Por favor responde 1, 2 o 3 👆`;
  }

  // ── R5: nurturing suave ──────────────────────────────────────────────────
  if (step === 'R5') {
    const pref = { '1': '2-semanas', '2': '1-mes', '3': 'user-iniciado' };
    if (opt && pref[opt]) {
      session.data.follow_up_preference = pref[opt];
      session.data.lead_status = 'nurturing';
      session.step = 'closed';
      logLead(senderNumber, session.data, 'nurturing');
      return `Perfecto, lo tenemos anotado 📋\nTe contactaremos cuando corresponda. ¡Hasta pronto!`;
    }
    return `Por favor responde 1, 2 o 3 👆`;
  }

  // ── Flujo completado ─────────────────────────────────────────────────────
  if (step === 'MSG_5' || step === 'R6' || step === 'closed') {
    return `Gracias por escribirnos 🙏\nSi tienes alguna otra consulta, escríbenos aquí.`;
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  session.step = 'MSG_0';
  return MSG.MSG_0;
}

// ─── Follow-up automático: R4 a las 24h de inactividad ─────────────────────
// (solo aplica si el bot tiene capacidad de envío proactivo via Twilio REST API)
// Por ahora se registra en log para activación manual o futura integración.

// ─── Limpieza de sesiones > 48h ────────────────────────────────────────────
setInterval(() => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  for (const [key, s] of sessions.entries()) {
    if (s.lastActivity < cutoff) sessions.delete(key);
  }
}, 60 * 60 * 1000);

module.exports = { handleWhatsappMessage };
