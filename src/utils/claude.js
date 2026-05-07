const Anthropic = require('@anthropic-ai/sdk');
const logger = require('./logger');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function getClaudeResponse(conversationHistory, systemPrompt) {
  const startTime = Date.now();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt,
    messages: conversationHistory
  });

  const elapsed = Date.now() - startTime;
  const inputTokens = response.usage?.input_tokens || 0;
  const outputTokens = response.usage?.output_tokens || 0;

  // Costo estimado: $0.00025/1k input + $0.00125/1k output (Haiku)
  const cost = ((inputTokens * 0.00025) + (outputTokens * 0.00125)) / 1000;
  logger.debug(`🧠 Claude: ${inputTokens} in / ${outputTokens} out tokens | ${elapsed}ms | ~$${cost.toFixed(6)}`);

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response type from Claude');
}

module.exports = { getClaudeResponse };
