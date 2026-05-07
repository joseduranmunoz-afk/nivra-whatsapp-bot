const logger = require('../utils/logger');

// ─── Mensajes ─────────────────────────────────────────────────────────────────

const MSG = {

  WELCOME:
    `Hola 👋 Soy el asistente de *Nivra Consulting*.\n\n` +
    `Ayudamos a empresas a medir y mejorar la coordinación entre áreas — ` +
    `para que los equipos entreguen mejor servicio interno y eso se refleje en resultados.\n\n` +
    `¿Qué te trae por aquí?\n` +
    `1️⃣ Quiero agendar una demo de 20 min\n` +
    `2️⃣ Quiero saber más antes de decidir\n` +
    `3️⃣ Solo estoy explorando por ahora`,

  // ── Fast Track ──────────────────────────────────────────────────────────────

  FAST_1:
    `Perfecto, en un par de pasos coordinamos tu demo.\n\n` +
    `¿Cuál es tu nombre y empresa?\n` +
    `Escríbelo así: 👉 *Nombre / Empresa*`,

  FAST_2: (name) =>
    `Gracias ${name} 😊\n\n` +
    `¿Cuál es tu correo electrónico?\n` +
    `_(Te enviamos la confirmación y material previo a la demo)_`,

  FAST_3:
    `Último paso. ¿Cuál es tu rol y el tamaño de tu empresa?\n\n` +
    `1️⃣ RRHH / Personas — menos de 100 personas\n` +
    `2️⃣ RRHH / Personas — más de 100 personas\n` +
    `3️⃣ Operaciones, Calidad o DO — menos de 100 personas\n` +
    `4️⃣ Operaciones, Calidad o DO — más de 100 personas`,

  DEMO_CALENDLY: (name, url) =>
    `Todo listo, ${name} 🙌\n\n` +
    `Elige el horario que mejor te acomode:\n` +
    `📅 ${url}\n\n` +
    `La demo dura 20 min. Revisaremos si Nivra aplica a tu situación.`,

  DEMO_MANUAL: (name) =>
    `Todo listo, ${name} 🙌\n\n` +
    `¿Qué días tienes disponibles?\n` +
    `1️⃣ Lunes o martes\n` +
    `2️⃣ Miércoles o jueves\n` +
    `3️⃣ Viernes\n\n` +
    `Un ejecutivo te confirma el link en menos de 2 horas.`,

  DEMO_CONFIRM:
    `Confirmado 🎉\n\n` +
    `Te escribimos en breve con el enlace de la reunión.\n` +
    `Mientras tanto: 🌐 *nivraconsulting.com*`,

  // ── Info Track ──────────────────────────────────────────────────────────────

  INFO_1:
    `Con gusto 😊 ¿Qué es lo que más te interesa entender?\n\n` +
    `1️⃣ Qué es el ICSI y cómo funciona el diagnóstico\n` +
    `2️⃣ Cómo se compara con una encuesta de clima o NPS\n` +
    `3️⃣ Qué resultados obtienen empresas como la mía`,

  INFO_RESP_1:
    `*¿Qué es el ICSI?*\n\n` +
    `El Índice de Calidad del Servicio Interno mide qué tan bien se sirven las áreas entre sí.\n\n` +
    `Nivra corre el diagnóstico en 2–3 semanas, entrega un mapa de brechas por área y propone acciones concretas.\n\n` +
    `No es una encuesta de clima. Es una herramienta de gestión con resultado accionable.`,

  INFO_RESP_2:
    `*ICSI vs. clima vs. NPS*\n\n` +
    `• Clima mide cómo se *sienten* los empleados.\n` +
    `• NPS mide lealtad del cliente externo.\n` +
    `• ICSI mide qué tan bien *funciona* la cadena interna de servicio.\n\n` +
    `Son complementarios. El ICSI responde: *¿dónde se rompe la coordinación?*`,

  INFO_RESP_3:
    `*Resultados típicos*\n\n` +
    `Empresas de 80–500 personas identifican 2–4 cuellos de botella críticos en la primera medición.\n\n` +
    `Con foco en esos puntos, ven mejoras en tiempos de respuesta entre áreas en 60–90 días.\n\n` +
    `En la demo te mostramos un caso real de tu industria.`,

  INFO_CTA:
    `¿Quieres ver cómo aplicaría esto en tu empresa?\n\n` +
    `1️⃣ Sí, agendemos la demo\n` +
    `2️⃣ Tengo más preguntas\n` +
    `3️⃣ Por ahora no, pero guarda mis datos`,

  INFO_MORE:
    `Claro, pregúntame lo que quieras 😊\n\n` +
    `_(Cuando estés listo para agendar, escribe *demo*)_`,

  INFO_SAVE:
    `Anotado 🙏\n\n` +
    `Cuando estés listo, escribe *demo* aquí y arrancamos.\n` +
    `🌐 *nivraconsulting.com*`,

  // ── Nurturing ───────────────────────────────────────────────────────────────

  COLD_LEAD:
    `Perfecto, sin presión 🙂\n\n` +
    `Si en algún momento quieres ver cómo funciona el diagnóstico, escribe *demo* aquí.\n\n` +
    `🌐 *nivraconsulting.com*`,

  RESUME_DEMO:
    `¡Bienvenido de nuevo! 🙌\n\n` +
    `¿Cuál es tu nombre y empresa?\n` +
    `Escríbelo así: 👉 *Nombre / Empresa*`,

  // ── Errores ─────────────────────────────────────────────────────────────────

  INVALID_OPTION: (valid) => `Por favor responde con ${valid} 👆`,

  INVALID_EMAIL:
    `Por favor escribe un correo válido.\nEjemplo: *nombre@empresa.com*`,

  INVALID_EMAIL_SKIP:
    `No hay problema, guardamos tu contacto sin correo.\n\n` +
    `_(Puedes compartírnoslo después en cualquier momento)_`,

  FLOW_CLOSED:
    `Gracias por escribirnos 🙏\nSi tienes más preguntas, estamos aquí.`,
};

// ─── Mapeos ───────────────────────────────────────────────────────────────────

const FAST3_MAP = {
  '1': { contact_role: 'RRHH/Personas',          company_size: '<100' },
  '2': { contact_role: 'RRHH/Personas',          company_size: '>100' },
  '3': { contact_role: 'Operaciones/Calidad/DO', company_size: '<100' },
  '4': { contact_role: 'Operaciones/Calidad/DO', company_size: '>100' },
};

const INFO_INTEREST_MAP = {
  '1': 'icsi-diagnostico',
  '2': 'comparacion-clima-nps',
  '3': 'resultados-casos',
};

const INFO_RESP_MAP = {
  '1': MSG.INFO_RESP_1,
  '2': MSG.INFO_RESP_2,
  '3': MSG.INFO_RESP_3,
};

const SCHEDULE_MAP = {
  '1': 'Lunes-Martes',
  '2': 'Miercoles-Jueves',
  '3': 'Viernes',
};

// ─── Leads ────────────────────────────────────────────────────────────────────

const leadsStore = [];

async function saveLead(phone, data, tag) {
  const lead = { id: Date.now(), phone, tag, ...data, captured_at: new Date().toISOString() };
  leadsStore.push(lead);

  const summary = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
  logger.info(`🎯 LEAD [${tag}] ${phone}: ${summary}`);

  const webhookUrl = process.env.LEADS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const lib  = webhookUrl.startsWith('https') ? require('https') : require('http');
      const body = JSON.stringify(lead);
      await new Promise((resolve, reject) => {
        const req = lib.request(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, (res) => { res.resume(); resolve(); });
        req.on('error', reject);
        req.write(body);
        req.end();
      });
    } catch (err) {
      logger.error(`⚠️ Webhook error: ${err.message}`);
    }
  }

  return lead;
}

async function updateLead(leadId, patch) {
  const lead = leadsStore.find(l => l.id === leadId);
  if (lead) Object.assign(lead, patch);
}

function getLeads() { return leadsStore; }

// ─── Sesiones ─────────────────────────────────────────────────────────────────

const sessions = new Map();

function newSession() {
  return {
    step: 'WELCOME_SENT',
    data: {},
    lastActivity: new Date(),
    leadId: null,
    emailAttempts: 0,
    infoRound: 0,
  };
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

const DEMO_KEYWORD = /^(demo|agendar|quiero agendar|agenda|ver demo|quiero demo)$/i;
const GREETING     = /^(hola|hi|hello|inicio|empezar|start|buenas|buenos días|buenos dias)$/i;

// ─── Handler ──────────────────────────────────────────────────────────────────
// Retorna string o array de strings (para múltiples mensajes en TwiML)

async function handleWhatsappMessage(message, senderNumber) {
  if (!message?.trim()) return MSG.WELCOME;

  const text = message.trim();

  // Reset en saludo
  if (GREETING.test(text) || text === '/start') {
    const s = newSession();
    sessions.set(senderNumber, s);
    return MSG.WELCOME;
  }

  // Primera vez que escribe (sin sesión)
  if (!sessions.has(senderNumber)) {
    const s = newSession();
    sessions.set(senderNumber, s);
    return MSG.WELCOME;
  }

  const session = sessions.get(senderNumber);
  session.lastActivity = new Date();
  const step = session.step;
  const opt  = parseOption(text);

  // Keyword global "demo" — retoma desde cualquier estado pasivo
  if (DEMO_KEYWORD.test(text) && !['FAST_1','FAST_2','FAST_3','DEMO_SCHEDULE','DEMO_DONE'].includes(step)) {
    session.step = 'FAST_1';
    return MSG.RESUME_DEMO;
  }

  // ── WELCOME_SENT ────────────────────────────────────────────────────────────
  if (step === 'WELCOME_SENT') {
    if (opt === '1') {
      session.step = 'FAST_1';
      return MSG.FAST_1;
    }
    if (opt === '2') {
      session.step = 'INFO_1';
      return MSG.INFO_1;
    }
    if (opt === '3') {
      session.data.intent = 'cold';
      session.step = 'COLD';
      await saveLead(senderNumber, session.data, 'cold-lead');
      return MSG.COLD_LEAD;
    }
    return MSG.INVALID_OPTION('1, 2 o 3');
  }

  // ── FAST_1: nombre / empresa ─────────────────────────────────────────────
  if (step === 'FAST_1') {
    if (!text) return MSG.INVALID_OPTION('tu nombre y empresa');
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
    session.step = 'FAST_2';
    return MSG.FAST_2(name);
  }

  // ── FAST_2: email ────────────────────────────────────────────────────────
  if (step === 'FAST_2') {
    if (isValidEmail(text)) {
      session.data.email = text.trim().toLowerCase();
      session.emailAttempts = 0;
      const lead = await saveLead(senderNumber, { ...session.data, lead_status: 'lead-parcial' }, 'lead-parcial');
      session.leadId = lead.id;
      session.step = 'FAST_3';
      return MSG.FAST_3;
    }

    session.emailAttempts++;
    if (session.emailAttempts >= 2) {
      session.data.email = '';
      session.emailAttempts = 0;
      const lead = await saveLead(senderNumber, { ...session.data, lead_status: 'lead-sin-email' }, 'lead-sin-email');
      session.leadId = lead.id;
      session.step = 'FAST_3';
      return [MSG.INVALID_EMAIL_SKIP, MSG.FAST_3];
    }
    return MSG.INVALID_EMAIL;
  }

  // ── FAST_3: rol + tamaño ─────────────────────────────────────────────────
  if (step === 'FAST_3') {
    if (opt === '1' || opt === '2' || opt === '3' || opt === '4') {
      const { contact_role, company_size } = FAST3_MAP[opt];
      session.data.contact_role = contact_role;
      session.data.company_size = company_size;
      session.data.lead_status  = 'demo-agendada';
      if (session.leadId) {
        await updateLead(session.leadId, { contact_role, company_size, lead_status: 'demo-agendada' });
      } else {
        await saveLead(senderNumber, session.data, '✅ DEMO-AGENDADA');
      }

      const calendlyUrl = process.env.CALENDLY_URL;
      if (calendlyUrl) {
        session.step = 'DEMO_DONE';
        return MSG.DEMO_CALENDLY(session.data.name, calendlyUrl);
      }
      session.step = 'DEMO_SCHEDULE';
      return MSG.DEMO_MANUAL(session.data.name);
    }
    return MSG.INVALID_OPTION('1, 2, 3 o 4');
  }

  // ── DEMO_SCHEDULE: disponibilidad manual ─────────────────────────────────
  if (step === 'DEMO_SCHEDULE') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.preferred_schedule = SCHEDULE_MAP[opt];
      if (session.leadId) {
        await updateLead(session.leadId, { preferred_schedule: session.data.preferred_schedule });
      }
      session.step = 'DEMO_DONE';
      return MSG.DEMO_CONFIRM;
    }
    return MSG.INVALID_OPTION('1, 2 o 3');
  }

  // ── DEMO_DONE ────────────────────────────────────────────────────────────
  if (step === 'DEMO_DONE') {
    return MSG.FLOW_CLOSED;
  }

  // ── INFO_1: elegir tema ──────────────────────────────────────────────────
  if (step === 'INFO_1') {
    if (opt === '1' || opt === '2' || opt === '3') {
      session.data.main_interest = INFO_INTEREST_MAP[opt];
      session.step = 'INFO_CTA';
      // Dos mensajes: contenido + CTA
      return [INFO_RESP_MAP[opt], MSG.INFO_CTA];
    }
    return MSG.INVALID_OPTION('1, 2 o 3');
  }

  // ── INFO_CTA ─────────────────────────────────────────────────────────────
  if (step === 'INFO_CTA') {
    if (opt === '1') {
      session.step = 'FAST_1';
      return MSG.FAST_1;
    }
    if (opt === '2') {
      session.infoRound++;
      session.step = 'INFO_MORE';
      return MSG.INFO_MORE;
    }
    if (opt === '3') {
      session.data.intent = 'info-guardado';
      session.step = 'INFO_SAVED';
      await saveLead(senderNumber, session.data, 'info-saved');
      return MSG.INFO_SAVE;
    }
    return MSG.INVALID_OPTION('1, 2 o 3');
  }

  // ── INFO_MORE: texto libre ───────────────────────────────────────────────
  if (step === 'INFO_MORE') {
    session.infoRound++;
    if (session.infoRound >= 3) {
      session.step = 'INFO_CTA';
      return [MSG.INFO_MORE, MSG.INFO_CTA];
    }
    return MSG.INFO_MORE;
  }

  // ── INFO_SAVED / COLD ────────────────────────────────────────────────────
  if (step === 'INFO_SAVED') return MSG.INFO_SAVE;
  if (step === 'COLD')       return MSG.COLD_LEAD;

  // ── Fallback ─────────────────────────────────────────────────────────────
  session.step = 'WELCOME_SENT';
  return MSG.WELCOME;
}

// ─── Limpieza de sesiones > 48h ───────────────────────────────────────────────
setInterval(() => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  for (const [k, s] of sessions.entries()) {
    if (s.lastActivity < cutoff) sessions.delete(k);
  }
}, 60 * 60 * 1000);

module.exports = { handleWhatsappMessage, getLeads };
