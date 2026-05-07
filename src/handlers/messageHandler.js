const { getClaudeResponse } = require('../utils/claude');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `Eres un asistente virtual profesional de Nivra Consulting, empresa especializada en consultoría empresarial y transformación digital.

ROL: Asistente de primer contacto por WhatsApp

PERSONALIDAD:
- Profesional pero cálido y accesible
- Conciso (WhatsApp, no email)
- Siempre en español
- Usa emojis ocasionalmente para ser más amigable

SERVICIOS PRINCIPALES DE NIVRA:
1. Consultoría Estratégica - Diagnóstico y plan de crecimiento empresarial
2. Transformación Digital - Implementación de sistemas y automatización
3. Gestión de Procesos - Optimización operacional con metodologías ágiles
4. Capacitación Empresarial - Training para equipos directivos y operativos
5. Implementación de ERP/CRM - Salesforce, SAP, HubSpot, etc.

REGLAS:
- Respuestas de máximo 3-4 párrafos cortos
- Si piden precios, di que un consultor les contactará con propuesta personalizada
- Para citas o demos: invitar a escribir a hola@nivra.co o al WhatsApp ejecutivo: +57 310 XXX XXXX
- Si es una queja, ser empático y escalar al equipo humano
- No inventar precios ni compromisos específicos
- Si preguntan algo que no sabes, ofrecer conectarlos con un consultor

FLUJO DE CALIFICACIÓN:
Cuando el usuario llegue por primera vez, pregunta:
1. ¿En qué tipo de negocio trabaja?
2. ¿Cuál es el principal desafío que busca resolver?

Con esa info, personaliza el siguiente mensaje.`;

// Almacenamiento en memoria (reemplazar por DB en producción)
const sessions = new Map();

const COMMANDS = {
  '/start': '¡Hola! 👋 Soy el asistente virtual de *Nivra Consulting*. Estoy aquí para ayudarte con información sobre nuestros servicios de consultoría y transformación digital.\n\n¿En qué puedo ayudarte hoy?',
  '/servicios': '*Servicios de Nivra Consulting:*\n\n1️⃣ Consultoría Estratégica\n2️⃣ Transformación Digital\n3️⃣ Gestión de Procesos\n4️⃣ Capacitación Empresarial\n5️⃣ Implementación ERP/CRM\n\n¿Sobre cuál te gustaría saber más?',
  '/contacto': '*Contáctanos directamente:*\n\n📧 hola@nivra.co\n📞 +57 310 XXX XXXX\n🌐 www.nivra.co\n\nO escribe "quiero una cita" y te coordinaremos una demo gratuita 🗓️',
  '/ayuda': '*Comandos disponibles:*\n\n/start - Inicio\n/servicios - Ver servicios\n/contacto - Datos de contacto\n/ayuda - Esta ayuda\n\nO simplemente escríbeme tu pregunta y te respondo de inmediato 😊'
};

async function handleWhatsappMessage(message, senderNumber) {
  if (!message || message.trim() === '') {
    return '¡Hola! Parece que tu mensaje llegó vacío. ¿En qué puedo ayudarte? 😊';
  }

  const trimmedMessage = message.trim();

  // Comandos predefinidos
  const command = trimmedMessage.toLowerCase();
  if (COMMANDS[command]) {
    return COMMANDS[command];
  }

  // Obtener o crear sesión
  if (!sessions.has(senderNumber)) {
    sessions.set(senderNumber, {
      history: [],
      createdAt: new Date(),
      messageCount: 0
    });
  }

  const session = sessions.get(senderNumber);
  session.messageCount++;
  session.lastActivity = new Date();

  session.history.push({ role: 'user', content: trimmedMessage });

  // Mantener máximo 10 turnos (20 mensajes)
  if (session.history.length > 20) {
    session.history.splice(0, 2);
  }

  const response = await getClaudeResponse(session.history, SYSTEM_PROMPT);

  session.history.push({ role: 'assistant', content: response });

  logger.debug(`Session ${senderNumber}: ${session.messageCount} messages, ${session.history.length} in history`);

  return response;
}

// Limpiar sesiones inactivas cada hora
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  let cleaned = 0;
  for (const [key, session] of sessions.entries()) {
    if (session.lastActivity < oneHourAgo) {
      sessions.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) logger.info(`🧹 Cleaned ${cleaned} inactive sessions`);
}, 60 * 60 * 1000);

module.exports = { handleWhatsappMessage };
