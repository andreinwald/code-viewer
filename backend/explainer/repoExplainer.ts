import { ask } from '../llm/llm';
import promptTemplate from './repoPrompt.md';

let repoExplanation: string | null = null;

export function getRepoExplanation(): string | null {
  return repoExplanation;
}

export async function repoExplainer(
  fileStructure: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<void> {
  try {
    repoExplanation = null;
    const prompt = promptTemplate.replace('{{fileStructure}}', fileStructure);
    let summary = '';
    await ask(prompt, (chunk) => {
      summary += chunk;
      onChunk(chunk);
    });
    repoExplanation = summary;
    onDone();
  } catch (err) {
    onError(String(err));
  }
}
