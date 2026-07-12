import { ProjectAnalysis, DocumentationContent, GenerateDocResponse, QualityScoreBreakdown } from "@/types";
import { generateWithGemini } from "@/lib/gemini";
import { chunkFiles, summarizeChunk, mergeSummaries } from "./chunker";
import {
  buildMainDocumentationPrompt,
  buildReadmePrompt,
  buildQualityScorePrompt,
  buildFolderStructureSection,
  buildReadmeBadges,
} from "./prompt-builder";
import { countWords } from "@/lib/utils";
import { GEMINI_MODEL } from "@/lib/constants";

// =============================================================================
// Main Documentation Generator
// =============================================================================

export async function generateDocumentation(
  analysis: ProjectAnalysis
): Promise<GenerateDocResponse> {
  const startTime = Date.now();

  // Step 1: Chunk the project files
  const chunks = chunkFiles(analysis.files);

  // Step 2: Summarize each chunk
  const summaries: string[] = [];
  for (const chunk of chunks) {
    const summary = await summarizeChunk(chunk);
    summaries.push(summary);
  }

  // Step 3: Merge summaries
  const mergedSummary = mergeSummaries(summaries, analysis.name);

  // Step 4: Generate comprehensive documentation
  const mainPrompt = buildMainDocumentationPrompt(analysis, mergedSummary);

  let docContent: DocumentationContent = {};
  let rawResponse = "";

  try {
    rawResponse = await generateWithGemini(mainPrompt);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch =
      rawResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
      rawResponse.match(/\{[\s\S]*\}/);

    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawResponse;
    docContent = JSON.parse(jsonStr.trim());
  } catch {
    // Fallback: use raw response as overview
    docContent = {
      overview: rawResponse || "Documentation generation encountered an issue. Please try regenerating.",
    };
  }

  // Step 5: Generate folder structure section
  docContent.folder_structure = buildFolderStructureSection(analysis);

  // Step 6: Generate README
  const badges = buildReadmeBadges(analysis);
  try {
    const readmePrompt = buildReadmePrompt(analysis, docContent.overview || "", badges);
    docContent.readme = await generateWithGemini(readmePrompt);
  } catch {
    docContent.readme = generateFallbackReadme(analysis, badges);
  }

  // Step 7: Add badges
  docContent.readme_badges = badges;

  // Step 8: Calculate quality score
  let qualityScore: QualityScoreBreakdown = {
    overall: 75,
    completeness: 75,
    readability: 75,
    structure: 75,
    technical_depth: 75,
    best_practices: 75,
  };

  try {
    const fullContent = Object.values(docContent).join("\n\n");
    const scorePrompt = buildQualityScorePrompt(fullContent, Object.keys(docContent));
    const scoreResponse = await generateWithGemini(scorePrompt);
    const scoreMatch = scoreResponse.match(/\{[\s\S]*\}/);
    if (scoreMatch) {
      const parsed = JSON.parse(scoreMatch[0]);
      qualityScore = {
        overall: clamp(parsed.overall || 75, 0, 100),
        completeness: clamp(parsed.completeness || 75, 0, 100),
        readability: clamp(parsed.readability || 75, 0, 100),
        structure: clamp(parsed.structure || 75, 0, 100),
        technical_depth: clamp(parsed.technical_depth || 75, 0, 100),
        best_practices: clamp(parsed.best_practices || 75, 0, 100),
      };
    }
  } catch {
    // Use default score on failure
  }

  docContent.quality_score_breakdown = qualityScore;

  // Assemble full markdown content
  const fullMarkdown = assembleFullMarkdown(docContent, analysis);
  const wordCount = countWords(fullMarkdown);

  return {
    documentation: docContent,
    qualityScore: qualityScore.overall,
    wordCount,
    metadata: {
      model: GEMINI_MODEL,
      generation_time_ms: Date.now() - startTime,
      files_analyzed: analysis.fileCount,
      chunks_processed: chunks.length,
      framework_detected: analysis.framework,
      language_detected: analysis.language,
    },
  };
}

// =============================================================================
// Full Markdown Assembler
// =============================================================================

export function assembleFullMarkdown(
  content: DocumentationContent,
  analysis: ProjectAnalysis
): string {
  const sections: string[] = [];

  const add = (key: keyof DocumentationContent) => {
    if (content[key] && typeof content[key] === "string") {
      sections.push(content[key] as string);
    }
  };

  add("overview");
  add("executive_summary");
  add("features");
  add("tech_stack");
  add("architecture");
  add("folder_structure");
  add("installation");
  add("usage");
  add("configuration");
  add("environment_variables");
  add("database");
  add("api_docs");
  add("auth_flow");
  add("code_organization");
  add("major_components");
  add("reusable_modules");
  add("design_patterns");
  add("security_suggestions");
  add("performance_suggestions");
  add("code_quality");
  add("future_improvements");
  add("known_limitations");
  add("deployment");
  add("contributing");
  add("license");
  add("complexity_analysis");
  add("dependency_analysis");
  add("project_summary");

  return sections.join("\n\n---\n\n");
}

// =============================================================================
// Fallback README Generator
// =============================================================================

function generateFallbackReadme(
  analysis: ProjectAnalysis,
  badges: string
): string {
  return `# ${analysis.name}

${badges}

> ${analysis.description || "A modern software project"}

## Tech Stack

${analysis.techStack.map((t) => `- ${t}`).join("\n")}

## Getting Started

### Prerequisites
- ${analysis.language}
- ${analysis.packageManager}

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>

# Install dependencies
${analysis.packageManager === "npm" ? "npm install" : analysis.packageManager === "yarn" ? "yarn" : "pnpm install"}

# Start development server
${analysis.framework === "Next.js" ? "npm run dev" : "npm start"}
\`\`\`

## Contributing

Contributions are welcome! Please read our contributing guide.

## License

MIT License
`;
}

// =============================================================================
// Helpers
// =============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
