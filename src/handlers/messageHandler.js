const logger = require('../utils/logger');

// ─── Mensajes ─────────────────────────────────────────────────────────────────

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

  MSG_2B:
    `¿Qué es lo que más te interesa?\n\n` +
    `1️⃣ Mejora continua\n` +
    `2️⃣ Medir una vez y después decidir\n` +
    `3️⃣ Mejorar el servicio al cliente interno`,

  MSG_3:
    `Perfecto. Para coordinar una demo de 20 min:\n\n` +
    `¿Cuál es tu nombre y empresa?\n` +
    `Escríbelo así: 👉 *Nombre / Empresa*`,

  MSG_3B: (name) =>
    `Gracias ${name} 😊\n\n` +
    `¿Cuál es tu correo electrónico?\n` +
    `_(Para enviarte la confirmación de la demo)_`,

  MSG_4_CALENDLY: (name, url) =>
    `Perfecto ${name} 🙌\n\n` +
    `Agenda tu demo de 20 min directamente aquí:\n` +
    `📅 ${url}\n\n` +
    `Elige el horario que mejor te acomode.`,

  MSG_4_MANUAL: (name) =>
    `Gracias ${name} 🙌\n\n` +
    `Elige tu disponibilidad:\n` +
    `1️⃣ Lunes o martes\n2️⃣ Miércoles o jueves\n3️⃣ Viernes\n\n` +
    `Un ejecutivo te confirmará el link de la reunión.`,

  MSG_5:
    `¡Listo! 🎉\n\n` +
    `Un ejecutivo de Nivra te escribirá en menos de 2 horas para confirmar.\n\n` +
    `Mientras tanto: 🌐 nivraconsulting.com`,

  R2:
    `Perfecto, no hay apuro 🙂\n\n` +
    `Te comparto un resumen de cómo Nivra mide la coordinación interna (ICSI).\n\n` +
    `📎 nivraconsulting.com\n\n` +
    `Cuando quieras ver la demo, escríbenos aquí.`,

  R3:
    `Gracias por contactarnos 👋\n\n` +
    `Nivra está diseñado para Personas, DO, Calidad u Operaciones.\n\n` +
    `¿Podrías reenviar este mensaje a quien lidera alguna de esas áreas?\n` +
    `Si eres tú, cuéntanos más y con gusto agendamos igual 😊`,

  R5:
    `Entendido 🙌\n\n¿En cuánto tiempo te contactamos?\n` +
    `1️⃣ En 2 semanas\n2️⃣ En 1 mes\n3️⃣ Escríbeme yo cuando esté listo`,

  R6:
    `Perfecto, gracias por avisarnos 🙏\n\n` +
    `Si en algún momento cambia la situación, estamos aquí.\nQue te vaya muy bien.`,
};

// ─── Mapeos ───────────────────────────────────────────────────────────────────

const URGENCY   = { '1': 'alta', '2': 'media', '3': 'exploración' };
const COMP_SIZE = { '1': '<100', '2': '100-500', '3': '+500' };
const ROLE      = { '1': 'RRHH/Personas', '2': 'Operaciones/Calidad', '3': 'Desarrollo Organizacional', '4': 'Otro directivo' };
const INTEREST  = { '1': 'mejora-continua', '2': 'medir-y-decidir', '3': 'mejorar-servicio-interno' };
const SCHEDULE  = { '1': 'Lunes-Martes', '2': 'Miércoles-Jueves', '3': 'Viernes' };

// ─── Almacén de leads (en memoria + webhook) ──────────────────────────────────

const leadsStore = [];

async function saveLead(phone, data, tag) {
  const lead = {
    id: Date.now(),
    phone,
    tag,
    ...data,
    captured_at: new Date().toISOString(),
  };

  leadsStore.push(lead);

  const summary = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
  logger.info(`🎯 LEAD [${tag}] ${phone}: ${summary}`);

  // Enviar a webhook externo si está configurado (Make.com, Zapier, n8n, etc.)
  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const https = require('https');
      const http  = require('http');
      const body  = JSON.stringify(lead);
      const url   = new URL(webhookUrl);
      const lib   = url.protocol === 'https:' ? https : http;
      await new Promise((resolve, reject) => {
        const req = lib.request(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, (res) => { res.resume(); resolve(); });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
      logger.info(`📤 Lead enviado a webhook: ${webhookUrl}`);
    } catch (err) {
      logger.error(`⚠️  No se pudo enviar lead al webhook: ${err.message}`);
    }
  }

  return lead;
}

function getLeads() { return leadsStore; }

// ─── Sesiones ─────────────────────────────────────────────────────────────────

const sessions = new Map();

function newSession() {
  return { step: 'INIT', data: {}, lastActivity: new Date(), leadSaved: false };
}

function parseOption(text) {
  const t = text.trim();
  if (/^[1-4]$/.test(t)) return t;
  const map = { '1️⃣': '1', '2️⃣': '2', '3️⃣': '3', '4️⃣': '4' };
  return map[t] ?? null;
}

function isValidEmail(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}

// ─── Handler principal ────────────────────────────────────────────────────────

async function handleWhatsappMessage(message, senderNumber) {
  if (!message?.trim()) return '¡Hola! Escríbeme tu pregunta 😊';

  const text = message.trim();
  const isGreeting = /^(hola|hi|hello|inicio|empezar|start|buenas|buenos)$/i.test(text) || text === '/start';

  if (isGreeting || !sessions.has(senderNumber)) {
    const s = newSession();
    s.step = 'MSG_0';
    sessions.set(senderNumber, s);
    return MSG.MSG_0;
  }

  const session = sessions.get(senderNumber);
  session.lastActivity = new Date();
  const opt  = parseOption(text);
  const step = session.step;

  // ── MSG_0: urgencia ───────────────────────────────────────────────────────
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
      await saveLead(senderNumber, session.data, 'cold-lead');
      return MSG.R2;
    }
    return `Por favor responde con 1, 2 o 3 👆`;
  }

  // ── MSG_1: tamaño empresa (solo captura) ──────────────────────────────────
  if (step === 'MSG_1') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.company_size = COMP_SIZE[opt];
      session.step = 'MSG_2';
      return MSG.MSG_2;
    }
    return `Por favor responde con 1, 2 o 3 👆`;
  }

  // ── MSG_2: rol ────────────────────────────────────────────────────────────
  if (step === 'MSG_2') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.contact_role = ROLE[opt];
      session.step = 'MSG_2B';
      return MSG.MSG_2B;
    }
    if (opt === '4') {
      session.data.contact_role = ROLE['4'];
      session.step = 'R3';
      await saveLead(senderNumber, session.data, 'wrong-role');
      return MSG.R3;
    }
    return `Por favor responde con 1, 2, 3 o 4 👆`;
  }

  // ── MSG_2B: interés principal ─────────────────────────────────────────────
  if (step === 'MSG_2B') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.main_interest = INTEREST[opt];
      session.step = 'MSG_3';
      return MSG.MSG_3;
    }
    return `Por favor responde con 1, 2 o 3 👆`;
  }

  // ── MSG_3: nombre / empresa ───────────────────────────────────────────────
  if (step === 'MSG_3') {
    let name, company;
    if (text.includes('/')) {
      const parts = text.split('/');
      name    = parts[0].trim();
      company = parts.slice(1).join('/').trim();
    } else {
      name = text; company = '';
    }
    session.data.name    = name;
    session.data.company = company;
    session.step = 'MSG_3B';
    return MSG.MSG_3B(name);
  }

  // ── MSG_3B: email ─────────────────────────────────────────────────────────
  if (step === 'MSG_3B') {
    if (!isValidEmail(text)) {
      return `Por favor escribe un correo válido, por ejemplo: nombre@empresa.com`;
    }
    session.data.email = text.trim().toLowerCase();
    session.step = 'MSG_4';

    const calendlyUrl = process.env.CALENDLY_URL;
    if (calendlyUrl) {
      session.data.lead_status = 'demo_agendada';
      if (!session.leadSaved) {
        session.leadSaved = true;
        await saveLead(senderNumber, session.data, '✅ DEMO-AGENDADA-CALENDLY');
      }
      session.step = 'MSG_5';
      return MSG.MSG_4_CALENDLY(session.data.name, calendlyUrl);
    }

    return MSG.MSG_4_MANUAL(session.data.name);
  }

  // ── MSG_4: disponibilidad (solo si no hay Calendly) ───────────────────────
  if (step === 'MSG_4') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.preferred_schedule = SCHEDULE[opt];
      session.data.lead_status        = 'demo_agendada';
      session.step = 'MSG_5';
      if (!session.leadSaved) {
        session.leadSaved = true;
        await saveLead(senderNumber, session.data, '✅ DEMO-AGENDADA');
      }
      return MSG.MSG_5;
    }
    return `Por favor elige 1, 2 o 3 para tu disponibilidad 👆`;
  }

  // ── R2: lead frío ─────────────────────────────────────────────────────────
  if (step === 'R2') {
    if (opt === '1' || /demo|si|sí|quiero|interesa/i.test(text)) {
      session.step = 'MSG_1';
      return MSG.MSG_1;
    }
    return `Cuando quieras ver la demo, escríbenos aquí 😊`;
  }

  // ── R3: cargo no calificado ───────────────────────────────────────────────
  if (step === 'R3') {
    session.step = 'MSG_3';
    return MSG.MSG_3;
  }

  // ── R5: nurturing ─────────────────────────────────────────────────────────
  if (step === 'R5') {
    const pref = { '1': '2-semanas', '2': '1-mes', '3': 'user-iniciado' };
    if (opt && pref[opt]) {
      session.data.follow_up_preference = pref[opt];
      session.data.lead_status = 'nurturing';
      session.step = 'closed';
      await saveLead(senderNumber, session.data, 'nurturing');
      return `Perfecto, lo tenemos anotado 📋\nTe contactaremos en su momento. ¡Hasta pronto!`;
    }
    return `Por favor responde 1, 2 o 3 👆`;
  }

  // ── Flujo completado ──────────────────────────────────────────────────────
  if (step === 'MSG_5' || step === 'R6' || step === 'closed') {
    return `Gracias por escribirnos 🙏 Si tienes más preguntas, estamos aquí.`;
  }

  session.step = 'MSG_0';
  return MSG.MSG_0;
}

// ─── Limpieza de sesiones > 48h ───────────────────────────────────────────────
setInterval(() => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  for (const [key, s] of sessions.entries()) {
    if (s.lastActivity < cutoff) sessions.delete(key);
  }
}, 60 * 60 * 1000);

module.exports = { handleWhatsappMessage, getLeads };
