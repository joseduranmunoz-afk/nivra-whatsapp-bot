const twilio = require('twilio');

function validateTwilioSignature(req, res, next) {
  // En desarrollo saltamos la validación
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const twilioSignature = req.headers['x-twilio-signature'];

  // Build URL from the actual incoming request so it always matches what Twilio signed
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host  = req.headers['x-forwarded-host']  || req.get('host');
  const webhookUrl = `${proto}://${host}${req.originalUrl}`;

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
