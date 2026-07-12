import { ProjectAnalysis } from "@/types";
import { folderStructureToString } from "./file-processor";
import { generateBadges } from "@/lib/utils";

// =============================================================================
// Prompt Builder for each documentation section
// =============================================================================

export function buildMainDocumentationPrompt(
  analysis: ProjectAnalysis,
  mergedSummary: string
): string {
  const depsPreview = Object.keys(analysis.dependencies).slice(0, 20).join(", ");
  const devDepsPreview = Object.keys(analysis.devDependencies).slice(0, 10).join(", ");
  const folderStr = folderStructureToString(analysis.folderStructure);

  return `You are an expert software architect and technical writer. Generate comprehensive, professional documentation for the following project.

## Project Information
- **Name**: ${analysis.name}
- **Language**: ${analysis.language}
- **Framework**: ${analysis.framework}
- **Package Manager**: ${analysis.packageManager}
- **Files Analyzed**: ${analysis.fileCount}
- **Tech Stack**: ${analysis.techStack.join(", ")}
- **Has Tests**: ${analysis.hasTests ? "Yes" : "No"}
- **Has Docker**: ${analysis.hasDocker ? "Yes" : "No"}
- **Has CI/CD**: ${analysis.hasCI ? "Yes" : "No"}
- **Database**: ${analysis.dbType || "Not detected"}
- **API Style**: ${analysis.apiStyle || "Not detected"}
- **Auth Method**: ${analysis.authMethod || "Not detected"}
- **Dependencies**: ${depsPreview}
- **Dev Dependencies**: ${devDepsPreview}

## Project Description
${analysis.description || "No description provided."}

## Folder Structure
\`\`\`
${folderStr}
\`\`\`

## Code Analysis Summary
${mergedSummary}

---

Generate ALL of the following documentation sections. Return a valid JSON object with EXACTLY these keys. Each value should be a well-written markdown string.

{
  "overview": "## Project Overview\\n[2-3 paragraphs describing what the project is, its purpose, and who it's for]",
  "executive_summary": "## Executive Summary\\n[Concise professional summary suitable for stakeholders]",
  "features": "## Features\\n[Detailed bullet list of all major features and capabilities]",
  "tech_stack": "## Technology Stack\\n[Detailed breakdown of all technologies, frameworks, and tools used]",
  "architecture": "## Architecture\\n[Detailed explanation of the system architecture, patterns used, data flow]",
  "installation": "## Installation\\n[Step-by-step installation guide with code blocks]",
  "usage": "## Usage Guide\\n[Detailed usage instructions with examples and code snippets]",
  "configuration": "## Configuration\\n[How to configure the application, available options]",
  "environment_variables": "## Environment Variables\\n[Table of all environment variables with descriptions and examples]",
  "database": "## Database\\n[Database schema explanation, models, relationships]",
  "api_docs": "## API Documentation\\n[All API endpoints with methods, params, request/response examples]",
  "auth_flow": "## Authentication Flow\\n[Detailed authentication implementation explanation]",
  "code_organization": "## Code Organization\\n[How the code is organized, conventions used, naming patterns]",
  "major_components": "## Major Components\\n[Key components/modules with their purposes and interactions]",
  "reusable_modules": "## Reusable Modules\\n[Shared utilities, hooks, helpers that can be reused]",
  "design_patterns": "## Design Patterns\\n[Design patterns and architectural patterns used in the codebase]",
  "security_suggestions": "## Security Recommendations\\n[Security best practices and improvements needed]",
  "performance_suggestions": "## Performance Recommendations\\n[Performance optimizations and improvements]",
  "code_quality": "## Code Quality\\n[Code quality analysis, linting, testing coverage, improvements]",
  "future_improvements": "## Future Improvements\\n[Suggested features and improvements for future versions]",
  "known_limitations": "## Known Limitations\\n[Current limitations and constraints of the project]",
  "deployment": "## Deployment Guide\\n[Step-by-step deployment instructions for production]",
  "contributing": "## Contributing Guide\\n[How to contribute to the project, development workflow, PR process]",
  "license": "## License\\n[License information and usage terms]",
  "complexity_analysis": "## Project Complexity Analysis\\n[Analysis of codebase complexity, maintainability score, technical debt]",
  "dependency_analysis": "## Dependency Analysis\\n[Analysis of dependencies, potential issues, outdated packages, security vulnerabilities]",
  "project_summary": "## Project Summary\\n[Final comprehensive summary of the entire project]"
}

Rules:
- Each section must be detailed and professional
- Use proper markdown formatting
- Include code examples where appropriate
- Be specific to THIS project, not generic
- If you cannot determine something from the code, note it appropriately
- Make it production-quality documentation
- ONLY return valid JSON, nothing else`;
}

export function buildReadmePrompt(
  analysis: ProjectAnalysis,
  overview: string,
  badges: string
): string {
  return `Generate a beautiful, comprehensive README.md for the following project.

Project: ${analysis.name}
Framework: ${analysis.framework}
Language: ${analysis.language}
Tech Stack: ${analysis.techStack.join(", ")}

Overview:
${overview}

Include:
1. A hero section with the project name and tagline
2. Badges section with these pre-generated badges:
${badges}
3. Table of contents
4. About/Overview section
5. Features section with emoji bullets
6. Tech stack section
7. Getting started / prerequisites
8. Installation steps with code blocks
9. Usage examples
10. Project structure (condensed)
11. API overview (if applicable)
12. Contributing section
13. License section
14. Acknowledgements

Make it visually appealing with proper markdown, emoji, and formatting.
Return ONLY the markdown content, no code fences around the entire thing.`;
}

export function buildQualityScorePrompt(
  content: string,
  sections: string[]
): string {
  return `Evaluate the following technical documentation and return a JSON quality score.

Documentation sections present: ${sections.join(", ")}
Total documentation length: ${content.length} characters

Rate the documentation on a scale of 0-100 based on:
- Completeness (are all major sections covered?)
- Technical accuracy (does it seem accurate and specific?)
- Clarity and readability
- Code examples (are there sufficient examples?)
- Structure and organization

Return ONLY this JSON:
{
  "overall": 85,
  "completeness": 90,
  "readability": 85,
  "structure": 88,
  "technical_depth": 80,
  "best_practices": 82
}`;
}

export function buildFolderStructureSection(analysis: ProjectAnalysis): string {
  const folderStr = folderStructureToString(analysis.folderStructure);
  return `## Folder Structure\n\n\`\`\`\n${folderStr}\`\`\`\n\n**Key Directories:**\n${describeTopLevelDirs(analysis)}`;
}

function describeTopLevelDirs(analysis: ProjectAnalysis): string {
  const dirs = analysis.folderStructure.children
    ?.filter((c) => c.type === "directory")
    .slice(0, 10) || [];

  return dirs
    .map((d) => `- \`${d.name}/\` — ${guessDirPurpose(d.name)}`)
    .join("\n");
}

function guessDirPurpose(name: string): string {
  const purposes: Record<string, string> = {
    src: "Source code",
    app: "Next.js App Router pages and layouts",
    pages: "Next.js pages (Page Router)",
    components: "Reusable UI components",
    lib: "Shared utilities and library code",
    hooks: "Custom React hooks",
    utils: "Utility functions",
    types: "TypeScript type definitions",
    styles: "CSS and styling files",
    public: "Static assets served directly",
    api: "API routes and handlers",
    server: "Server-side code",
    client: "Client-side code",
    models: "Database models",
    services: "Business logic services",
    store: "State management",
    config: "Configuration files",
    tests: "Test files",
    __tests__: "Test files",
    docs: "Documentation",
    scripts: "Build and utility scripts",
    prisma: "Prisma schema and migrations",
    migrations: "Database migrations",
    middleware: "Express/Next.js middleware",
    actions: "Server actions",
    contexts: "React context providers",
    providers: "Context providers",
  };
  return purposes[name.toLowerCase()] || "Project files";
}

export function buildReadmeBadges(analysis: ProjectAnalysis): string {
  return generateBadges(analysis.framework, analysis.language, analysis.techStack);
}
