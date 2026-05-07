require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const { handleWhatsappMessage } = require('./handlers/messageHandler');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Nivra WhatsApp Bot is running! 🤖');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/whatsapp/webhook', async (req, res) => {
  try {
    const incomingMessage = req.body.Body;
    const senderNumber = req.body.From;
    const messageId = req.body.MessageSid;

    console.log(`📨 New message from ${senderNumber}: ${incomingMessage}`);

    const response = await handleWhatsappMessage(incomingMessage, senderNumber);

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(response);

    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error('Error handling message:', error);
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Lo siento, ocurrió un error. Por favor intenta de nuevo.');
    res.type('text/xml').send(twiml.toString());
  }
});

app.listen(port, () => {
  console.log(`✅ Nivra WhatsApp Bot listening on port ${port}`);
  console.log(`📱 Webhook URL: ${process.env.WEBHOOK_URL || 'http://localhost:' + port}/whatsapp/webhook`);
});
