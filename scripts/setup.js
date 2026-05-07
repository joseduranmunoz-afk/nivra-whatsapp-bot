/**
 * Script de verificación de setup.
 * Uso: node scripts/setup.js
 */
require('dotenv').config();

const checks = [
  {
    name: 'ANTHROPIC_API_KEY',
    value: process.env.ANTHROPIC_API_KEY,
    hint: 'Obtener en: https://console.anthropic.com/'
  },
  {
    name: 'TWILIO_ACCOUNT_SID',
    value: process.env.TWILIO_ACCOUNT_SID,
    hint: 'Obtener en: https://console.twilio.com/'
  },
  {
    name: 'TWILIO_AUTH_TOKEN',
    value: process.env.TWILIO_AUTH_TOKEN,
    hint: 'Obtener en: https://console.twilio.com/'
  },
  {
    name: 'TWILIO_WHATSAPP_NUMBER',
    value: process.env.TWILIO_WHATSAPP_NUMBER,
    hint: 'Formato: whatsapp:+1415XXXXXXX (número del sandbox Twilio)'
  }
];

console.log('\n🔍 Verificando configuración del bot...\n');

let allOk = true;

for (const check of checks) {
  if (check.value && check.value !== `your_${check.name.toLowerCase()}_here`) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name} → falta configurar`);
    console.log(`   💡 ${check.hint}`);
    allOk = false;
  }
}

console.log('');

if (allOk) {
  console.log('🎉 Todo configurado. Ejecuta: npm run dev\n');
} else {
  console.log('📝 Copia .env.example → .env y completa los valores faltantes.\n');
  process.exit(1);
}
