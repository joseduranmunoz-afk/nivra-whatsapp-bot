const { getClaudeResponse } = require('../utils/claude');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `Eres un asistente virtual de Nivra Consulting especializado en CAPTURAR LEADS y calificar prospectos por WhatsApp.

OBJETIVO PRINCIPAL: Convertir cada conversación en un lead calificado con: nombre, empresa, cargo, necesidad principal y disponibilidad para una llamada.

FLUJO DE CONVERSACIÓN:
1. Saludo cálido y presentación breve de Nivra
2. Preguntar nombre y empresa (de forma natural, no como formulario)
3. Identificar necesidad/problema principal
4. Mostrar cómo Nivra puede ayudar (brevemente)
5. Proponer demo o llamada de 20 min: "¿Tienes 20 minutos esta semana para una demo gratuita?"
6. Si acepta → confirmar día y hora, decir que un consultor les contactará
7. Si no acepta → dejar puerta abierta y dar info de contacto

PERSONALIDAD:
- Profesional, cálido y directo
- Respuestas cortas (máximo 3 líneas en WhatsApp)
- Nunca presiones — acompaña y genera confianza
- Usa el nombre del prospecto una vez que lo sepas

SERVICIOS NIVRA:
- Consultoría Estratégica (diagnóstico y plan de crecimiento)
- Transformación Digital (automatización y sistemas)
- Optimización de Procesos (eficiencia operacional)
- Implementación ERP/CRM (Salesforce, HubSpot, SAP)
- Capacitación Directiva

CUANDO TENGAS EL LEAD CALIFICADO:
Al final del mensaje incluye en formato oculto:
[LEAD: nombre=X, empresa=Y, cargo=Z, necesidad=W, cita=V]

COMANDOS:
/start → Saludo inicial
/servicios → Lista de servicios
/contacto → Info de contacto
/demo → Proponer demo directamente

CONTACTO DIRECTO:
📧 hola@nivra.co | 📞 +57 310 XXX XXXX`;

const sessions = new Map();

const COMMANDS = {
  '/start': '¡Hola! 👋 Soy el asistente de *Nivra Consulting*.\n\nAyudamos a empresas a crecer con consultoría estratégica y transformación digital.\n\n¿En qué tipo de negocio trabajas? Me gustaría entender tu situación 😊',
  '/servicios': '*Servicios de Nivra:*\n\n1️⃣ Consultoría Estratégica\n2️⃣ Transformación Digital\n3️⃣ Optimización de Procesos\n4️⃣ Implementación ERP/CRM\n5️⃣ Capacitación Directiva\n\n¿Cuál es el mayor desafío de tu negocio ahora mismo?',
  '/contacto': '📧 hola@nivra.co\n📞 +57 310 XXX XXXX\n🌐 www.nivra.co\n\n¿O prefieres que agendemos una *demo gratuita de 20 min*? 🗓️',
  '/demo': '¡Excelente decisión! 🚀\n\nTenemos disponibilidad esta semana.\n¿Cuál es tu nombre y el de tu empresa? Así coordino con el equipo.',
  '/ayuda': '*Comandos:*\n/start /servicios /contacto /demo'
};

async function handleWhatsappMessage(message, senderNumber) {
  if (!message?.trim()) return '¡Hola! Escríbeme tu pregunta 😊';

  const trimmed = message.trim();

  if (COMMANDS[trimmed.toLowerCase()]) return COMMANDS[trimmed.toLowerCase()];

  if (!sessions.has(senderNumber)) {
    sessions.set(senderNumber, {
      history: [],
      createdAt: new Date(),
      messageCount: 0,
      leadCaptured: false
    });
  }

  const session = sessions.get(senderNumber);
  session.messageCount++;
  session.lastActivity = new Date();
  session.history.push({ role: 'user', content: trimmed });

  if (session.history.length > 20) session.history.splice(0, 2);

  const response = await getClaudeResponse(session.history, SYSTEM_PROMPT);

  // Detectar si Claude capturó un lead
  if (response.includes('[LEAD:') && !session.leadCaptured) {
    session.leadCaptured = true;
    const leadMatch = response.match(/\[LEAD:([^\]]+)\]/);
    if (leadMatch) {
      logger.info(`🎯 NEW LEAD from ${senderNumber}: ${leadMatch[1]}`);
    }
  }

  // Retornar respuesta limpia sin el tag interno
  const cleanResponse = response.replace(/\[LEAD:[^\]]+\]/g, '').trim();

  session.history.push({ role: 'assistant', content: cleanResponse });

  return cleanResponse;
}

setInterval(() => {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  for (const [key, s] of sessions.entries()) {
    if (s.lastActivity < cutoff) sessions.delete(key);
  }
}, 60 * 60 * 1000);

module.exports = { handleWhatsappMessage };
