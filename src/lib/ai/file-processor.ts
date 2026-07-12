import JSZip from "jszip";
import {
  IGNORE_PATTERNS,
  SUPPORTED_EXTENSIONS,
  MAX_FILES_PER_CHUNK,
} from "@/lib/constants";
import { AnalyzedFile, FolderNode } from "@/types";
import { getLanguageFromExtension } from "@/lib/utils";
import { extractRepoInfo } from "@/lib/utils";

// =============================================================================
// File Filtering
// =============================================================================

function shouldIgnore(path: string): boolean {
  const normalizedPath = path.replace(/\\/g, "/");
  return IGNORE_PATTERNS.some((pattern) => {
    if (pattern.startsWith("*.")) {
      return normalizedPath.endsWith(pattern.slice(1));
    }
    return normalizedPath.includes("/" + pattern + "/") ||
      normalizedPath.startsWith(pattern + "/") ||
      normalizedPath === pattern ||
      normalizedPath.endsWith("/" + pattern);
  });
}

function isSupported(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  // Always include important config files by name
  const importantFiles = [
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "next.config.js",
    "vite.config.ts",
    "webpack.config.js",
    "requirements.txt",
    "go.mod",
    "cargo.toml",
    "pom.xml",
    "dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    ".env.example",
    "readme.md",
    "makefile",
  ];
  if (importantFiles.includes(lower)) return true;

  const ext = lower.split(".").pop() || "";
  return SUPPORTED_EXTENSIONS.includes(ext);
}

// =============================================================================
// ZIP Processor
// =============================================================================

export async function processZipBuffer(
  buffer: ArrayBuffer
): Promise<AnalyzedFile[]> {
  const zip = await JSZip.loadAsync(buffer);
  const files: AnalyzedFile[] = [];
  const processPromises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (shouldIgnore(relativePath)) return;
    if (!isSupported(relativePath.split("/").pop() || "")) return;

    const promise = zipEntry.async("string").then((content) => {
      if (!content || content.length === 0) return;
      // Skip binary-like content
      if (content.includes("\x00")) return;

      const name = relativePath.split("/").pop() || relativePath;
      const ext = name.split(".").pop() || "";
      files.push({
        path: relativePath,
        name,
        extension: ext,
        content: content.slice(0, 100_000), // Cap per-file content
        size: content.length,
        language: getLanguageFromExtension(ext),
        isConfig: isConfigFile(name),
        isEntryPoint: isEntryPoint(relativePath, name),
      });
    }).catch(() => {
      // Skip files that can't be read as text
    });

    processPromises.push(promise);
  });

  await Promise.all(processPromises);
  return files.sort((a, b) => {
    // Prioritize important files
    if (a.isConfig && !b.isConfig) return -1;
    if (!a.isConfig && b.isConfig) return 1;
    if (a.isEntryPoint && !b.isEntryPoint) return -1;
    if (!a.isEntryPoint && b.isEntryPoint) return 1;
    return a.path.localeCompare(b.path);
  });
}

// =============================================================================
// Individual Files Processor
// =============================================================================

export async function processIndividualFiles(
  fileBuffers: Array<{ name: string; buffer: ArrayBuffer; mimeType?: string }>
): Promise<AnalyzedFile[]> {
  const files: AnalyzedFile[] = [];

  for (const { name, buffer } of fileBuffers) {
    if (!isSupported(name)) continue;

    try {
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(buffer);
      if (!content || content.includes("\x00")) continue;

      const ext = name.split(".").pop() || "";
      files.push({
        path: name,
        name,
        extension: ext,
        content: content.slice(0, 100_000),
        size: content.length,
        language: getLanguageFromExtension(ext),
        isConfig: isConfigFile(name),
        isEntryPoint: isEntryPoint(name, name),
      });
    } catch {
      continue;
    }
  }

  return files;
}

// =============================================================================
// GitHub Repository Processor
// =============================================================================

export async function processGitHubUrl(
  url: string
): Promise<AnalyzedFile[]> {
  const info = extractRepoInfo(url);
  if (!info) throw new Error("Invalid GitHub URL");

  const { owner, repo, branch } = info;

  // Fetch the repository tree via GitHub API
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const treeResponse = await fetch(treeUrl, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DocuMind-AI/1.0",
    },
  });

  if (!treeResponse.ok) {
    if (treeResponse.status === 404) {
      // Try 'master' branch
      const masterUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
      const masterResponse = await fetch(masterUrl, {
        headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "DocuMind-AI/1.0" },
      });
      if (!masterResponse.ok) throw new Error("Repository not found or is private");
      const data = await masterResponse.json();
      return fetchGitHubFiles(data.tree, owner, repo, "master");
    }
    throw new Error(`GitHub API error: ${treeResponse.statusText}`);
  }

  const data = await treeResponse.json();
  return fetchGitHubFiles(data.tree, owner, repo, branch);
}

async function fetchGitHubFiles(
  tree: Array<{ path: string; type: string; size?: number }>,
  owner: string,
  repo: string,
  branch: string
): Promise<AnalyzedFile[]> {
  // Filter to supported files
  const filePaths = tree
    .filter((item) => item.type === "blob")
    .filter((item) => !shouldIgnore(item.path))
    .filter((item) => isSupported(item.path.split("/").pop() || ""))
    .filter((item) => (item.size || 0) < 100_000) // Skip large files
    .slice(0, MAX_FILES_PER_CHUNK * 5); // Limit total files

  const files: AnalyzedFile[] = [];
  const batchSize = 10;

  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
          const response = await fetch(rawUrl, {
            headers: { "User-Agent": "DocuMind-AI/1.0" },
          });
          if (!response.ok) return null;
          const content = await response.text();
          if (!content || content.includes("\x00")) return null;

          const name = item.path.split("/").pop() || item.path;
          const ext = name.split(".").pop() || "";
          return {
            path: item.path,
            name,
            extension: ext,
            content: content.slice(0, 100_000),
            size: content.length,
            language: getLanguageFromExtension(ext),
            isConfig: isConfigFile(name),
            isEntryPoint: isEntryPoint(item.path, name),
          } as AnalyzedFile;
        } catch {
          return null;
        }
      })
    );
    files.push(...batchResults.filter((f): f is AnalyzedFile => f !== null));
    // Rate limiting
    if (i + batchSize < filePaths.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return files;
}

// =============================================================================
// Folder Structure Builder
// =============================================================================

export function buildFolderStructure(files: AnalyzedFile[]): FolderNode {
  const root: FolderNode = { name: "root", type: "directory", children: [] };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current.children = current.children || [];
        current.children.push({
          name: part,
          type: "file",
          size: file.size,
        });
      } else {
        current.children = current.children || [];
        let dir = current.children.find(
          (c) => c.name === part && c.type === "directory"
        );
        if (!dir) {
          dir = { name: part, type: "directory", children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  return root;
}

export function folderStructureToString(
  node: FolderNode,
  indent = 0,
  isLast = true
): string {
  const prefix = indent === 0 ? "" : "  ".repeat(indent - 1) + (isLast ? "└── " : "├── ");
  let result = prefix + node.name + (node.type === "directory" ? "/" : "") + "\n";

  if (node.children) {
    const dirs = node.children.filter((c) => c.type === "directory");
    const files = node.children.filter((c) => c.type === "file");
    const sorted = [...dirs, ...files];

    sorted.forEach((child, i) => {
      result += folderStructureToString(child, indent + 1, i === sorted.length - 1);
    });
  }

  return result;
}

// =============================================================================
// Helpers
// =============================================================================

function isConfigFile(name: string): boolean {
  const lower = name.toLowerCase();
  return [
    "package.json", "tsconfig.json", "next.config", "vite.config",
    "webpack.config", "babel.config", ".babelrc", "tailwind.config",
    "requirements.txt", "go.mod", "cargo.toml", "pom.xml", "gemfile",
    ".env.example", "docker-compose", "dockerfile", "makefile",
    "jest.config", "vitest.config", ".eslintrc", "prettier.config",
    "prisma", "drizzle.config",
  ].some((c) => lower.includes(c));
}

function isEntryPoint(path: string, name: string): boolean {
  const lower = name.toLowerCase();
  const lowerPath = path.toLowerCase();
  return (
    lower === "main.ts" || lower === "main.tsx" ||
    lower === "index.ts" || lower === "index.tsx" ||
    lower === "app.ts" || lower === "app.tsx" ||
    lower === "server.ts" || lower === "server.js" ||
    lowerPath.includes("pages/_app") || lowerPath.includes("app/layout") ||
    lower === "manage.py" || lower === "main.py" ||
    lower === "app.py" || lower === "main.go" || lower === "main.rs"
  );
}
