require('dotenv').config({ override: true });
const express = require('express');
const twilio = require('twilio');
const { handleWhatsappMessage } = require('./handlers/messageHandler');
const { validateTwilioSignature } = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    name: 'Nivra WhatsApp Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/whatsapp/webhook', validateTwilioSignature, async (req, res) => {
  const incomingMessage = req.body.Body;
  const senderNumber = req.body.From;
  const messageType = req.body.MediaContentType0 ? 'media' : 'text';

  logger.info(`📨 [${messageType}] From: ${senderNumber} → "${incomingMessage}"`);

  const twiml = new twilio.twiml.MessagingResponse();

  if (!incomingMessage && messageType === 'media') {
    twiml.message('Por el momento solo puedo responder mensajes de texto. ¡Escríbeme tu pregunta! 😊');
    return res.type('text/xml').send(twiml.toString());
  }

  try {
    const response = await handleWhatsappMessage(incomingMessage, senderNumber);
    logger.info(`📤 Response to ${senderNumber}: "${response.substring(0, 60)}..."`);
    twiml.message(response);
  } catch (error) {
    logger.error(`❌ Error handling message from ${senderNumber}:`, error.message);
    twiml.message('Lo siento, ocurrió un error. Por favor intenta de nuevo en un momento. 🙏');
  }

  res.type('text/xml').send(twiml.toString());
});

app.listen(port, () => {
  logger.info(`✅ Nivra WhatsApp Bot running on port ${port}`);
  logger.info(`🔗 Webhook: ${process.env.WEBHOOK_URL || 'http://localhost:' + port}/whatsapp/webhook`);
});
