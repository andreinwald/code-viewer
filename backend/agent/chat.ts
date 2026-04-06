import type { SessionNotification } from '@agentclientprotocol/sdk';
import { listenUpdates, stopListeningUpdates } from './acpClient';
import { getAcpConnection } from './acpConnection';

export type ChatEvent =
  | { type: 'agent_text_chunk'; messageId: string; text: string }
  | { type: 'agent_thought_chunk'; messageId: string; text: string }
  | { type: 'tool_call'; toolCallId: string; title: string; kind?: string; status: string }
  | { type: 'tool_call_update'; toolCallId: string; title?: string; status?: string; kind?: string };

export type ModelInfo = { modelId: string; name: string };
export type ModelState = { availableModels: ModelInfo[]; currentModelId: string };

let chatSessionId: string | null = null;
let isRunning = false;
let modelState: ModelState | null = null;

async function getOrCreateSession(): Promise<string> {
  if (!chatSessionId) {
    const conn = await getAcpConnection();
    const result = await conn.newSession({ cwd: process.cwd(), mcpServers: [] });
    chatSessionId = result.sessionId;
    if (result.models) {
      modelState = {
        availableModels: result.models.availableModels.map(m => ({ modelId: m.modelId, name: m.name })),
        currentModelId: result.models.currentModelId,
      };
    }
  }
  return chatSessionId;
}

export async function chatGetModels(): Promise<ModelState | null> {
  await getOrCreateSession();
  return modelState;
}

export async function chatSetModel(modelId: string): Promise<void> {
  const sessionId = await getOrCreateSession();
  const conn = await getAcpConnection();
  await conn.unstable_setSessionModel({ sessionId, modelId });
  if (modelState) modelState = { ...modelState, currentModelId: modelId };
}

export async function chatSend(
  message: string,
  onEvent: (event: ChatEvent) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  if (isRunning) return;
  try {
    const conn = await getAcpConnection();
    const sessionId = await getOrCreateSession();
    isRunning = true;

    listenUpdates(sessionId, (notification: SessionNotification) => {
      const { update } = notification;
      const messageId = ('messageId' in update ? (update as { messageId?: string }).messageId : undefined) ?? sessionId;

      if (update.sessionUpdate === 'agent_message_chunk' && update.content.type === 'text') {
        onEvent({ type: 'agent_text_chunk', messageId, text: update.content.text });
      } else if (update.sessionUpdate === 'agent_thought_chunk' && update.content.type === 'text') {
        onEvent({ type: 'agent_thought_chunk', messageId, text: update.content.text });
      } else if (update.sessionUpdate === 'tool_call') {
        onEvent({ type: 'tool_call', toolCallId: update.toolCallId, title: update.title, kind: update.kind, status: update.status ?? 'pending' });
      } else if (update.sessionUpdate === 'tool_call_update') {
        onEvent({ type: 'tool_call_update', toolCallId: update.toolCallId, title: update.title, status: update.status, kind: update.kind });
      }
    });

    await conn.prompt({
      sessionId,
      prompt: [{ type: 'text', text: message }],
    });

    stopListeningUpdates(sessionId);
    isRunning = false;
    onDone();
  } catch (err) {
    if (chatSessionId) stopListeningUpdates(chatSessionId);
    isRunning = false;
    onError(String(err));
  }
}

export async function chatStop(): Promise<void> {
  if (!chatSessionId || !isRunning) return;
  try {
    const conn = await getAcpConnection();
    await conn.cancel({ sessionId: chatSessionId });
  } catch { /* ignore */ } finally {
    stopListeningUpdates(chatSessionId);
    isRunning = false;
  }
}
