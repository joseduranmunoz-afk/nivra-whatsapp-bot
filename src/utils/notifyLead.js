const twilio = require('twilio');
const logger = require('./logger');

const NOTIFY_TAGS = ['✅ DEMO-AGENDADA', 'lead-parcial'];

function formatMessage(lead) {
  return [
    `🎯 *Nuevo lead — Nivra ISPI*`,
    ``,
    `Tag: ${lead.tag}`,
    `Nombre: ${lead.name || '—'}`,
    `Empresa: ${lead.company || '—'}`,
    `Email: ${lead.email || '—'}`,
    `Rol: ${lead.contact_role || '—'}`,
    `Tamaño: ${lead.company_size || '—'}`,
    `Interés: ${lead.main_interest || '—'}`,
    `Tel: ${lead.phone}`,
    `Hora: ${lead.captured_at}`,
  ].join('\n');
}

async function notifySellerWhatsApp(lead) {
  const sellerNumber = process.env.SELLER_WHATSAPP_NUMBER;
  if (!sellerNumber) return;

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${sellerNumber}`,
      body: formatMessage(lead),
    });
    logger.info(`📲 Notificación enviada a ${sellerNumber}`);
  } catch (err) {
    logger.error(`⚠️ Error notificando vendedor: ${err.message}`);
  }
}

async function notifyLead(lead) {
  if (!NOTIFY_TAGS.includes(lead.tag)) return;
  await notifySellerWhatsApp(lead);
}

module.exports = { notifyLead };
