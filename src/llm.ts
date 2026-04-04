import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Options as ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";

export async function ask(
    message: string,
    onChunk?: (chunk: string) => void,
    options?: Partial<ClaudeAgentOptions>
): Promise<string> {
    const defaultOptions: ClaudeAgentOptions = {
        model: "opus",                    // or "sonnet", "haiku"
        maxTurns: 1,                      // 1 query → 1 response (no multi-turn agent loop)
        allowedTools: [],                 // disable tools for simple chat
        ...options,
    };

    let fullResponse = "";

    // query() returns an async iterator of messages
    for await (const msg of query({
        prompt: message,
        options: defaultOptions,
    })) {
        // We only care about assistant text blocks
        if (msg.type === "assistant") {
            for (const block of msg.message.content || []) {
                if ("text" in block && typeof block.text === "string") {
                    const textChunk = block.text;
                    fullResponse += textChunk;

                    // Stream to callback if provided (for real-time UI)
                    if (onChunk) {
                        onChunk(textChunk);
                    }
                }
            }
        }
    }

    return fullResponse.trim();
}

