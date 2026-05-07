const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function getClaudeResponse(userMessage, conversationHistory, systemPrompt) {
  try {
    // Construir messages array con historial
    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500, // Mantener respuestas cortas para WhatsApp
      system: systemPrompt,
      messages: messages
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('Unexpected response type from Claude');
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

module.exports = { getClaudeResponse };
