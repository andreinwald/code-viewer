import { ask } from '../llm/llm';
import promptTemplate from './repoPrompt.md';

export async function repoExplainer(
  fileStructure: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  try {
    const prompt = promptTemplate.replace('{{fileStructure}}', fileStructure);
    await ask(prompt, onChunk);
    onDone();
  } catch (err) {
    onError(String(err));
  }
}
