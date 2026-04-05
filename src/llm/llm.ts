import type { Options } from '@anthropic-ai/claude-agent-sdk';

export async function ask(
  message: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const { query } = await import('@anthropic-ai/claude-agent-sdk');

  const options: Options = {
    model: 'sonnet',
    allowedTools: [],
    includePartialMessages: true,
  };

  const stream = query({ prompt: message, options });
  let fullResponse = '';

  for await (const msg of stream) {
    if (msg.type === 'stream_event') {
      const event = msg.event;
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullResponse += event.delta.text;
        onChunk?.(event.delta.text);
      }
    }
    if (msg.type === 'result') break;
  }

  return fullResponse.trim();
}
