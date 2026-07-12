import { AnalyzedFile, GenerationChunk } from "@/types";
import { MAX_CHUNK_SIZE, MAX_FILES_PER_CHUNK } from "@/lib/constants";
import { generateWithGemini } from "@/lib/gemini";

// =============================================================================
// Intelligent Project Chunker
// =============================================================================

export function chunkFiles(files: AnalyzedFile[]): GenerationChunk[] {
  const chunks: GenerationChunk[] = [];
  let currentChunk: AnalyzedFile[] = [];
  let currentSize = 0;

  // Sort: configs first, then entry points, then the rest
  const sorted = [...files].sort((a, b) => {
    if (a.isConfig && !b.isConfig) return -1;
    if (!a.isConfig && b.isConfig) return 1;
    if (a.isEntryPoint && !b.isEntryPoint) return -1;
    if (!a.isEntryPoint && b.isEntryPoint) return 1;
    return a.path.localeCompare(b.path);
  });

  for (const file of sorted) {
    const fileSize = file.content.length;

    const wouldExceedSize = currentSize + fileSize > MAX_CHUNK_SIZE;
    const wouldExceedCount = currentChunk.length >= MAX_FILES_PER_CHUNK;

    if ((wouldExceedSize || wouldExceedCount) && currentChunk.length > 0) {
      chunks.push({
        index: chunks.length,
        files: currentChunk,
      });
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(file);
    currentSize += fileSize;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      index: chunks.length,
      files: currentChunk,
    });
  }

  return chunks;
}

// =============================================================================
// Chunk Summarizer
// =============================================================================

export async function summarizeChunk(chunk: GenerationChunk): Promise<string> {
  const filesSummary = chunk.files
    .map((f) => {
      const preview = f.content.slice(0, 2000);
      return `### ${f.path}\n\`\`\`${f.language.toLowerCase()}\n${preview}${f.content.length > 2000 ? "\n... (truncated)" : ""}\n\`\`\``;
    })
    .join("\n\n");

  const prompt = `Analyze the following ${chunk.files.length} source code files and provide a concise technical summary covering:
- Purpose of each file
- Key functions/classes/components
- Important patterns and architecture decisions
- Dependencies used
- Any notable configurations

Be concise but thorough. Return plain text, no markdown headers needed.

Files:
${filesSummary}`;

  try {
    return await generateWithGemini(prompt);
  } catch {
    // Fallback to simple summary
    return chunk.files
      .map((f) => `${f.path}: ${f.language} file (${f.size} chars)`)
      .join("\n");
  }
}

// =============================================================================
// Merge Summaries
// =============================================================================

export function mergeSummaries(
  summaries: string[],
  projectName: string
): string {
  return `# Project: ${projectName}

## Analysis from ${summaries.length} code sections:

${summaries
    .map((s, i) => `### Section ${i + 1}:\n${s}`)
    .join("\n\n---\n\n")}`;
}
