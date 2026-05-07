const logger = require('../utils/logger');
const { getClient: getSupabase } = require('../utils/supabase');
const { notifyLead } = require('../utils/notifyLead');

// ─── Mensajes ─────────────────────────────────────────────────────────────────

const MSG = {

  WELCOME:
    `Hola. Soy el asistente de *Nivra ISPI*.\n\n` +
    `Somos una plataforma SaaS que mide cómo se percibe el servicio entre áreas internas de tu organización — ` +
    `para identificar fricciones operativas y tomar decisiones basadas en datos reales.\n\n` +
    `¿Cómo prefieres continuar?\n\n` +
    `*1* — Ver una demo (30 min)\n` +
    `*2* — Cuéntame más primero`,

  // ── Fast Track ──────────────────────────────────────────────────────────────

  FAST_1:
    `Perfecto.\n\n` +
    `¿Cuál es tu nombre y empresa?\n` +
    `Escríbelo así: _Nombre / Empresa_`,

  FAST_2: (name) =>
    `Gracias, ${name}.\n\n` +
    `¿Cuál es tu correo electrónico?\n` +
    `_(Te enviamos la confirmación y el material previo a la demo)_`,

  FAST_3:
    `Un último dato para enfocar la demo:\n\n` +
    `¿Cuántas personas trabajan en tu empresa y cuál es tu área?\n\n` +
    `*1* Menos de 200 — cualquier área\n` +
    `*2* 200–1000 — RRHH o Personas\n` +
    `*3* 200–1000 — Operaciones, Calidad o DO\n` +
    `*4* Más de 1000 personas`,

  DEMO_CALENDLY: (name, url) =>
    `Listo, ${name}.\n\n` +
    `Agenda tu espacio de demo aquí — son 30 minutos, sin presión de venta, ` +
    `para que veas el producto aplicado a tu contexto:\n\n` +
    `${url}\n\n` +
    `Te llega confirmación por email. Cualquier pregunta, escríbeme aquí.`,

  DEMO_MANUAL: (name) =>
    `Listo, ${name}.\n\n` +
    `¿Qué días tienes disponibles?\n\n` +
    `*1* Lunes o martes\n` +
    `*2* Miércoles o jueves\n` +
    `*3* Viernes\n\n` +
    `Un ejecutivo te confirma el link en menos de 2 horas.`,

  DEMO_CONFIRM:
    `Confirmado.\n\n` +
    `Te escribimos en breve con el enlace de la reunión.\n` +
    `🌐 *nivraconsulting.com*`,

  // ── Info Track ──────────────────────────────────────────────────────────────

  INFO_1:
    `Con gusto.\n\n` +
    `¿Cuál de estas situaciones se parece más a tu empresa?\n\n` +
    `*1* Tenemos áreas que se quejan entre sí, pero no hay datos objetivos\n` +
    `*2* Queremos medir si RRHH, TI, Finanzas u Operaciones están cumpliendo sus compromisos internos\n` +
    `*3* Estamos en un proceso de transformación y necesitamos un diagnóstico cuantitativo`,

  INFO_RESP_1:
    `*Fricciones entre áreas sin datos objetivos*\n\n` +
    `Eso es el "silencio operativo" que mide Nivra ISPI.\n\n` +
    `La plataforma pregunta a cada área cómo percibe el servicio que recibe de las demás — ` +
    `y genera un i-NPS interno con dimensiones de calidad: tiempo de respuesta, calidad del entregable, comunicación.\n\n` +
    `En 2–3 semanas tienes un mapa de brechas por área, no percepciones anecdóticas.`,

  INFO_RESP_2:
    `*ISPI vs. encuestas de clima o NPS*\n\n` +
    `• Clima laboral mide cómo se *sienten* los empleados en general.\n` +
    `• NPS mide lealtad del cliente externo.\n` +
    `• ISPI mide si las áreas internas cumplen sus SLAs — comparando el servicio *declarado* con el *percibido*.\n\n` +
    `El resultado: sabes exactamente qué área genera fricciones y en qué dimensión.`,

  INFO_RESP_3:
    `*Diagnóstico cuantitativo en menos de 4 semanas*\n\n` +
    `Empresas en procesos de transformación usan Nivra ISPI para:\n\n` +
    `📊 Identificar 2–4 cuellos de botella críticos en la primera medición\n` +
    `🔄 Medir la brecha entre SLA declarado y SLA percibido por área\n` +
    `📈 Tomar decisiones de mejora con datos, no con intuición\n\n` +
    `En la demo te mostramos un caso real de tu industria.`,

  INFO_CTA:
    `Eso es exactamente lo que resuelve Nivra ISPI.\n\n` +
    `La demo de 30 minutos muestra el producto con datos reales de una empresa similar — sin compromisos.\n\n` +
    `*1* Agendar la demo\n` +
    `*2* Tengo más preguntas\n` +
    `*3* Por ahora no, pero guarda mis datos`,

  INFO_MORE:
    `Claro, pregúntame lo que quieras.\n\n` +
    `_(Cuando estés listo para agendar, escribe *demo*)_`,

  INFO_SAVE:
    `Anotado.\n\n` +
    `Cuando estés listo, escribe *demo* aquí y arrancamos.\n` +
    `🌐 *nivraconsulting.com*`,

  // ── Nurturing ───────────────────────────────────────────────────────────────

  COLD_LEAD:
    `Sin problema.\n\n` +
    `Si en algún momento quieres ver el producto, escribe *demo* aquí.\n\n` +
    `🌐 *nivraconsulting.com*`,

  RESUME_DEMO:
    `Bienvenido de nuevo.\n\n` +
    `¿Cuál es tu nombre y empresa?\n` +
    `Escríbelo así: _Nombre / Empresa_`,

  // ── Errores ─────────────────────────────────────────────────────────────────

  INVALID_OPTION: (valid) => `Por favor responde con ${valid}.`,

  INVALID_EMAIL:
    `Por favor escribe un correo válido.\nEjemplo: *nombre@empresa.com*`,

  INVALID_EMAIL_SKIP:
    `Sin problema, guardamos tu contacto sin correo.\n\n` +
    `_(Puedes compartírnoslo después en cualquier momento)_`,

  FLOW_CLOSED:
    `Gracias por escribirnos. Si tienes más preguntas, estamos aquí.`,
};

// ─── Mapeos ───────────────────────────────────────────────────────────────────

const FAST3_MAP = {
  '1': { contact_role: 'Cualquier área',          company_size: '<200' },
  '2': { contact_role: 'RRHH/Personas',           company_size: '200-1000' },
  '3': { contact_role: 'Operaciones/Calidad/DO',  company_size: '200-1000' },
  '4': { contact_role: 'Cualquier área',          company_size: '>1000' },
};

const INFO_INTEREST_MAP = {
  '1': 'fricciones-sin-datos',
  '2': 'medir-cumplimiento-areas',
  '3': 'diagnostico-transformacion',
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

  // 1. Persistencia en Supabase (duradera entre deploys)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: row, error } = await supabase
        .from('leads')
        .insert([{ phone, tag, ...data }])
        .select()
        .single();
      if (!error && row) lead.id = row.id;
    } catch (err) {
      logger.error(`⚠️ Supabase insert error: ${err.message}`);
    }
  }

  // 2. Caché en memoria (para /admin/leads sin latencia)
  leadsStore.push(lead);

  const summary = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
  logger.info(`🎯 LEAD [${tag}] ${phone}: ${summary}`);

  // 3. Notificación WhatsApp al vendedor
  notifyLead(lead).catch(() => {});

  // 4. Webhook externo opcional
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
  // Actualizar en memoria
  const lead = leadsStore.find(l => l.id === leadId);
  if (lead) Object.assign(lead, patch);

  // Actualizar en Supabase
  const supabase = getSupabase();
  if (supabase && leadId) {
    try {
      await supabase
        .from('leads')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', leadId);
    } catch (err) {
      logger.error(`⚠️ Supabase update error: ${err.message}`);
    }
  }
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
    return MSG.INVALID_OPTION('1 o 2');
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
