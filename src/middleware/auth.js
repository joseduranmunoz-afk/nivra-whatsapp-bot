const twilio = require('twilio');

function validateTwilioSignature(req, res, next) {
  // En desarrollo saltamos la validación
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const twilioSignature = req.headers['x-twilio-signature'];
  const webhookUrl = `${process.env.WEBHOOK_URL}/whatsapp/webhook`;

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    webhookUrl,
    req.body
  );

  if (!isValid) {
    console.warn('⚠️  Invalid Twilio signature - rejected request');
    return res.status(403).send('Forbidden');
  }

  next();
}

module.exports = { validateTwilioSignature };
