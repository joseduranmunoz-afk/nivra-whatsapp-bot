/**
 * Script para desarrollo local con ngrok.
 * Levanta el servidor y crea un túnel público.
 * Uso: node scripts/dev-tunnel.js
 */
require('dotenv').config();
const ngrok = require('ngrok');
const { execSync, spawn } = require('child_process');

const PORT = process.env.PORT || 3000;

(async () => {
  console.log('\n🚀 Starting Nivra WhatsApp Bot with ngrok tunnel...\n');

  // Iniciar servidor en segundo plano
  const server = spawn('node', ['src/server.js'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'inherit'
  });

  // Esperar un segundo a que el server arranque
  await new Promise(r => setTimeout(r, 1500));

  // Crear túnel ngrok
  const url = await ngrok.connect(PORT);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Tunnel activo:`);
  console.log(`   ${url}/whatsapp/webhook`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Copia esta URL en Twilio Sandbox:');
  console.log(`   Twilio Console → WhatsApp Sandbox → Webhook URL`);
  console.log(`   ${url}/whatsapp/webhook`);
  console.log('\n⚠️  Presiona Ctrl+C para detener\n');

  // Cleanup
  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping...');
    await ngrok.disconnect();
    server.kill();
    process.exit(0);
  });
})().catch(err => {
  console.error('Error starting dev tunnel:', err);
  process.exit(1);
});
