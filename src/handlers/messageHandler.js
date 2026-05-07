const { getClaudeResponse } = require('../utils/claude');

const systemPrompt = `Eres un asistente de soporte para Nivra Consulting, una empresa de consultoría especializada en transformación digital y estrategia empresarial.

Tu rol es:
- Responder preguntas sobre servicios de Nivra (consultoría, estrategia digital, implementación)
- Ser amable, profesional y conciso
- Responder en español preferentemente
- Máximo 2-3 párrafos por respuesta (es WhatsApp, no un email)
- Si el usuario pide agendar una cita o hablar con un ejecutivo, sugiere que escriba a: contacto@nivra.local o llame al +57 1 XXX XXXX

Servicios principales de Nivra:
- Consultoría Estratégica
- Transformación Digital
- Implementación de Sistemas
- Capacitación Empresarial
- Optimización de Procesos`;

const conversationHistory = new Map();

async function handleWhatsappMessage(message, senderNumber) {
  try {
    if (!conversationHistory.has(senderNumber)) {
      conversationHistory.set(senderNumber, []);
    }

    const history = conversationHistory.get(senderNumber);
    history.push({
      role: 'user',
      content: message
    });

    // Mantener solo últimos 10 mensajes para ahorrar tokens
    if (history.length > 20) {
      history.splice(0, 2);
    }

    const response = await getClaudeResponse(message, history, systemPrompt);

    history.push({
      role: 'assistant',
      content: response
    });

    return response;
  } catch (error) {
    console.error('Error in handleWhatsappMessage:', error);
    throw error;
  }
}

module.exports = { handleWhatsappMessage };
