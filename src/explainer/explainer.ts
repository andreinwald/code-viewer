import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ask } from '../llm';

let promptTemplate: string | null = null;

async function getPromptTemplate(): Promise<string> {
  if (!promptTemplate) {
    promptTemplate = await fs.readFile(path.join(__dirname, 'prompt.md'), 'utf8');
  }
  return promptTemplate;
}

export async function explainer(
  filePath: string,
  fileStructure: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error('Requested path is not a file');
    }

    const fileContent = await fs.readFile(filePath, 'utf8');
    const template = await getPromptTemplate();

    const prompt = template
      .replace('{{filePath}}', filePath)
      .replace('{{fileStructure}}', fileStructure)
      .replace('{{fileContent}}', fileContent);

    await ask(prompt, onChunk);
    onDone();
  } catch (err) {
    onError(String(err));
  }
}
