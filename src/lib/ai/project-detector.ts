import { AnalyzedFile, ProjectAnalysis, FolderNode } from "@/types";
import { FRAMEWORK_PATTERNS, LANGUAGE_EXTENSIONS } from "@/lib/constants";
import { buildFolderStructure } from "./file-processor";

// =============================================================================
// Project Detector
// =============================================================================

export function detectProject(files: AnalyzedFile[]): ProjectAnalysis {
  const packageJson = findFile(files, "package.json");
  const parsedPackage = packageJson ? safeJsonParse(packageJson.content) : null;

  const language = detectLanguage(files);
  const framework = detectFramework(files, parsedPackage);
  const packageManager = detectPackageManager(files);
  const dependencies = (parsedPackage?.dependencies as Record<string, string>) || {};
  const devDependencies = (parsedPackage?.devDependencies as Record<string, string>) || {};
  const techStack = detectTechStack(files, parsedPackage);

  const folderStructure = buildFolderStructure(files);
  const projectName = detectProjectName(files, parsedPackage, folderStructure);

  return {
    name: projectName,
    description: (parsedPackage?.description as string) || "",
    framework,
    language,
    packageManager,
    techStack,
    fileCount: files.length,
    totalSizeBytes: files.reduce((sum, f) => sum + f.size, 0),
    files,
    dependencies,
    devDependencies,
    hasTests: hasTests(files),
    hasDocker: hasDocker(files),
    hasCI: hasCI(files),
    hasDotenv: hasDotenv(files),
    hasDatabase: hasDatabase(files, parsedPackage),
    dbType: detectDatabaseType(files, parsedPackage),
    apiStyle: detectApiStyle(files, parsedPackage),
    authMethod: detectAuthMethod(files, parsedPackage),
    folderStructure,
  };
}

// =============================================================================
// Language Detection
// =============================================================================

function detectLanguage(files: AnalyzedFile[]): string {
  const counts: Record<string, number> = {};

  for (const file of files) {
    if (file.language && file.language !== "Unknown") {
      counts[file.language] = (counts[file.language] || 0) + 1;
    }
  }

  // Weighted priority
  const priority = [
    "TypeScript", "Python", "Go", "Rust", "Java", "Kotlin",
    "Swift", "C#", "C++", "C", "PHP", "Ruby", "Dart", "JavaScript",
  ];

  for (const lang of priority) {
    if (counts[lang] && counts[lang] > 0) return lang;
  }

  // Fall back to most common
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || "Unknown";
}

// =============================================================================
// Framework Detection
// =============================================================================

function detectFramework(
  files: AnalyzedFile[],
  packageJson: Record<string, unknown> | null
): string {
  const allDeps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };

  const allPaths = files.map((f) => f.path.toLowerCase()).join("\n");
  const allContent = files
    .filter((f) => f.isConfig)
    .map((f) => f.content)
    .join("\n")
    .toLowerCase();

  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    const matches = patterns.some((pattern) => {
      return (
        allDeps[pattern] !== undefined ||
        allPaths.includes(pattern.toLowerCase()) ||
        allContent.includes(pattern.toLowerCase())
      );
    });
    if (matches) return framework;
  }

  // Python frameworks
  const requirementsTxt = findFile(files, "requirements.txt");
  if (requirementsTxt) {
    const content = requirementsTxt.content.toLowerCase();
    if (content.includes("fastapi")) return "FastAPI";
    if (content.includes("django")) return "Django";
    if (content.includes("flask")) return "Flask";
  }

  // Go
  if (findFile(files, "go.mod")) return "Go";

  // Rust
  if (findFile(files, "Cargo.toml")) return "Rust";

  return "Unknown";
}

// =============================================================================
// Package Manager Detection
// =============================================================================

function detectPackageManager(files: AnalyzedFile[]): string {
  const names = files.map((f) => f.name.toLowerCase());
  if (names.includes("pnpm-lock.yaml")) return "pnpm";
  if (names.includes("yarn.lock")) return "yarn";
  if (names.includes("package-lock.json")) return "npm";
  if (names.includes("bun.lockb")) return "bun";
  if (findFile(files, "requirements.txt") || findFile(files, "pyproject.toml")) return "pip/uv";
  if (findFile(files, "go.mod")) return "go mod";
  if (findFile(files, "Cargo.toml")) return "cargo";
  return "npm";
}

// =============================================================================
// Tech Stack Detection
// =============================================================================

function detectTechStack(
  files: AnalyzedFile[],
  packageJson: Record<string, unknown> | null
): string[] {
  const stack = new Set<string>();
  const allDeps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };

  // Check key dependencies
  const depMappings: Record<string, string> = {
    react: "React",
    "react-dom": "React",
    next: "Next.js",
    vue: "Vue.js",
    "@angular/core": "Angular",
    svelte: "Svelte",
    express: "Express.js",
    fastify: "Fastify",
    "@nestjs/core": "NestJS",
    prisma: "Prisma",
    "@prisma/client": "Prisma",
    drizzle: "Drizzle ORM",
    "drizzle-orm": "Drizzle ORM",
    "@supabase/supabase-js": "Supabase",
    firebase: "Firebase",
    mongoose: "MongoDB",
    pg: "PostgreSQL",
    mysql2: "MySQL",
    redis: "Redis",
    "@vercel/analytics": "Vercel Analytics",
    tailwindcss: "Tailwind CSS",
    "@mui/material": "Material UI",
    "antd": "Ant Design",
    "@chakra-ui/react": "Chakra UI",
    "framer-motion": "Framer Motion",
    zustand: "Zustand",
    "react-query": "React Query",
    "@tanstack/react-query": "TanStack Query",
    "next-auth": "NextAuth.js",
    "passport": "Passport.js",
    jest: "Jest",
    vitest: "Vitest",
    playwright: "Playwright",
    cypress: "Cypress",
    graphql: "GraphQL",
    "apollo-server": "Apollo",
    "@apollo/client": "Apollo Client",
    stripe: "Stripe",
    zod: "Zod",
    "react-hook-form": "React Hook Form",
    "socket.io": "Socket.IO",
  };

  for (const [dep, label] of Object.entries(depMappings)) {
    if (allDeps[dep]) stack.add(label);
  }

  // Docker
  if (hasDocker(files)) stack.add("Docker");
  // CI/CD
  if (hasCI(files)) stack.add("GitHub Actions");

  return Array.from(stack).slice(0, 20);
}

// =============================================================================
// Detection Helpers
// =============================================================================

function detectProjectName(
  files: AnalyzedFile[],
  packageJson: Record<string, unknown> | null,
  folderStructure: FolderNode
): string {
  if (packageJson?.name && typeof packageJson.name === "string") {
    return packageJson.name;
  }
  // Use first folder name
  const firstDir = folderStructure.children?.find((c) => c.type === "directory");
  if (firstDir) return firstDir.name;
  return "Project";
}

function hasTests(files: AnalyzedFile[]): boolean {
  return files.some(
    (f) =>
      f.path.includes("__tests__") ||
      f.path.includes(".test.") ||
      f.path.includes(".spec.") ||
      f.name.includes("test") ||
      f.name.includes("spec")
  );
}

function hasDocker(files: AnalyzedFile[]): boolean {
  return files.some(
    (f) =>
      f.name.toLowerCase() === "dockerfile" ||
      f.name.toLowerCase().includes("docker-compose")
  );
}

function hasCI(files: AnalyzedFile[]): boolean {
  return files.some(
    (f) =>
      f.path.includes(".github/workflows") ||
      f.path.includes(".gitlab-ci") ||
      f.path.includes("circle") ||
      f.name.includes("jenkinsfile")
  );
}

function hasDotenv(files: AnalyzedFile[]): boolean {
  return files.some(
    (f) => f.name === ".env.example" || f.name === ".env.local" || f.extension === "env"
  );
}

function hasDatabase(
  files: AnalyzedFile[],
  packageJson: Record<string, unknown> | null
): boolean {
  const allDeps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };
  const dbDeps = ["prisma", "@prisma/client", "mongoose", "pg", "mysql2", "drizzle-orm", "typeorm", "sequelize"];
  return dbDeps.some((dep) => allDeps[dep]) || files.some((f) => f.extension === "prisma" || f.path.includes("migrations"));
}

function detectDatabaseType(
  files: AnalyzedFile[],
  packageJson: Record<string, unknown> | null
): string | undefined {
  const allDeps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };

  if (allDeps["@supabase/supabase-js"]) return "PostgreSQL (Supabase)";
  if (allDeps["firebase"]) return "Firebase (Firestore)";
  if (allDeps["mongoose"]) return "MongoDB";
  if (allDeps["pg"]) return "PostgreSQL";
  if (allDeps["mysql2"]) return "MySQL";
  if (allDeps["redis"]) return "Redis";
  if (files.some((f) => f.extension === "prisma")) return "Prisma (PostgreSQL)";
  return undefined;
}

function detectApiStyle(
  files: AnalyzedFile[],
  packageJson: Record<string, unknown> | null
): string | undefined {
  const allDeps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };

  if (allDeps["graphql"] || allDeps["apollo-server"]) return "GraphQL";
  if (allDeps["@trpc/server"]) return "tRPC";
  if (files.some((f) => f.path.includes("api/") || f.path.includes("routes/"))) return "REST";
  return undefined;
}

function detectAuthMethod(
  files: AnalyzedFile[],
  packageJson: Record<string, unknown> | null
): string | undefined {
  const allDeps = {
    ...(packageJson?.dependencies as Record<string, string> || {}),
    ...(packageJson?.devDependencies as Record<string, string> || {}),
  };

  if (allDeps["next-auth"]) return "NextAuth.js";
  if (allDeps["@supabase/supabase-js"]) return "Supabase Auth";
  if (allDeps["firebase"]) return "Firebase Auth";
  if (allDeps["passport"]) return "Passport.js";
  if (allDeps["jsonwebtoken"]) return "JWT";
  if (allDeps["clerk"]) return "Clerk";
  if (allDeps["auth0"]) return "Auth0";
  return undefined;
}

function findFile(files: AnalyzedFile[], name: string): AnalyzedFile | undefined {
  return files.find((f) => f.name.toLowerCase() === name.toLowerCase());
}

function safeJsonParse(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
