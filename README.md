# 🤖 Nivra WhatsApp Bot

Bot de WhatsApp potenciado por Claude AI para Nivra Consulting. Responde automáticamente preguntas sobre servicios, agenda citas y proporciona soporte al cliente.

## 🚀 Quick Start

### Requisitos
- Node.js 16+ 
- Cuenta de Twilio (gratis: https://www.twilio.com/try-twilio)
- API Key de Anthropic Claude (https://console.anthropic.com)

### 1. Setup Local

```bash
# Clonar/descargar el proyecto
cd nivra-whatsapp-bot

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales
nano .env  # o tu editor favorito
```

### 2. Obtener Credenciales

#### Twilio
1. Crear cuenta en https://www.twilio.com/try-twilio
2. Ir a **Console > Account Info** → copiar `Account SID` y `Auth Token`
3. Ir a **Develop > Messaging > Services > Sandbox** → activar WhatsApp
4. Enviar mensaje `join <code>` al número de Twilio para activar sandbox
5. Copiar el número de Twilio en `.env` como `TWILIO_WHATSAPP_NUMBER`

#### Anthropic Claude
1. Ir a https://console.anthropic.com/
2. Crear API Key
3. Copiar en `.env` como `ANTHROPIC_API_KEY`

### 3. Ejecutar Localmente

```bash
npm run dev
```

El servidor estará en `http://localhost:3000`

### 4. Deploy a Producción

#### Opción A: Render (Recomendado - Gratis)
1. Crear cuenta en https://render.com
2. Conectar repositorio GitHub
3. Crear **New Web Service**
4. Seleccionar rama y build command: `npm install`
5. Start command: `npm start`
6. Agregar variables de entorno (.env)
7. Deploy

#### Opción B: Railway
1. Conectar a Railway.app
2. Agregar variables de entorno
3. Auto deploy en cada push

#### Opción C: Heroku (Alternativa)
```bash
heroku login
heroku create nivra-whatsapp-bot
git push heroku main
heroku config:set TWILIO_ACCOUNT_SID=xxx
# ... otras variables
```

### 5. Configurar Webhook en Twilio

1. Ir a **Twilio Console > Phone Numbers > Active Numbers**
2. Seleccionar tu número de WhatsApp
3. En **Messaging** → **When a message comes in**: 
   - Webhook URL: `https://your-domain.com/whatsapp/webhook` (POST)
4. Guardar

## 📊 Arquitectura

```
WhatsApp User
     ↓ (envía mensaje)
Twilio Webhook
     ↓
Express.js Server
     ↓
Claude Haiku API
     ↓
Respuesta generada
     ↓
Twilio envía respuesta
     ↓
Usuario recibe en WhatsApp
```

## 💰 Costos Mensuales

| Servicio | Costo Estimado |
|----------|--------------|
| Twilio | $0.01 - 0.05/msg |
| Claude Haiku | $0.00005/msg |
| Hosting (Render Free) | $0 |
| **Total** | ~$1-5/mes (10k msgs) |

## 📝 Customización

### Cambiar System Prompt
Editar en `src/handlers/messageHandler.js` la variable `systemPrompt`

### Agregar Funcionalidades
- Base de datos: Agregar SQLite o Supabase
- Contexto: Guardar datos del usuario
- Flujos: Agregar lógica condicional para casos específicos

## 🔧 Variables de Entorno

```env
TWILIO_ACCOUNT_SID        # Identificador de cuenta Twilio
TWILIO_AUTH_TOKEN         # Token de autenticación Twilio
TWILIO_WHATSAPP_NUMBER    # Número WhatsApp (formato: whatsapp:+1234567890)
ANTHROPIC_API_KEY         # Clave API de Anthropic
PORT                      # Puerto servidor (default: 3000)
NODE_ENV                  # development/production
WEBHOOK_URL               # URL pública del webhook (prod)
```

## 📱 Comandos de Prueba

Desde WhatsApp (en Sandbox):
- `Hola` → Saludo automático
- `¿Qué servicios ofrecen?` → Info de servicios
- `Quiero agendar una cita` → Instrucciones de contacto
- Cualquier pregunta → Claude responde

## 🐛 Troubleshooting

**"Error: ANTHROPIC_API_KEY not found"**
- Verificar `.env` tiene la key correcta
- No incluir comillas en la key

**"Twilio webhook no recibe mensajes"**
- Verificar que el servidor está corriendo
- Probar con `ngrok http 3000` en desarrollo
- Confirmar webhook URL en consola Twilio

**"No reconoce comando 'join'"**
- En Twilio Sandbox, primero escribir `join [código]`
- El código está en la página de Sandbox

## 📚 Recursos

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Claude API Docs](https://docs.anthropic.com/)
- [Render Deployment](https://render.com/docs)

## 📄 Licencia

MIT

---

**Próximos pasos:**
1. [ ] Configurar credenciales en `.env`
2. [ ] Probar localmente con `npm run dev`
3. [ ] Deploy a Render
4. [ ] Configurar webhook en Twilio
5. [ ] Probar con mensaje de prueba

¿Necesitas ayuda con algún paso?
