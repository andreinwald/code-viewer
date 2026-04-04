import * as fs from 'node:fs/promises';
import { ask } from '../llm';

export async function explainer(
  filePath: string,
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

    await ask(
      `Explain me this file briefly (${filePath}):\n\n${fileContent}`,
      onChunk,
    );
    onDone();
  } catch (err) {
    onError(String(err));
  }
}
