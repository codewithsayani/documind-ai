import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function generateBadges(
  framework: string,
  language: string,
  techStack: string[]
): string {
  const shields: string[] = [];

  if (language) {
    const langColor: Record<string, string> = {
      TypeScript: "blue",
      JavaScript: "yellow",
      Python: "green",
      Go: "cyan",
      Rust: "orange",
      Java: "red",
    };
    const color = langColor[language] || "lightgrey";
    shields.push(
      `![${language}](https://img.shields.io/badge/${encodeURIComponent(language)}-${color}?style=for-the-badge&logo=${language.toLowerCase()})`
    );
  }

  if (framework) {
    shields.push(
      `![${framework}](https://img.shields.io/badge/${encodeURIComponent(framework)}-black?style=for-the-badge&logo=${framework.toLowerCase()})`
    );
  }

  techStack.slice(0, 5).forEach((tech) => {
    shields.push(
      `![${tech}](https://img.shields.io/badge/${encodeURIComponent(tech)}-informational?style=for-the-badge)`
    );
  });

  return shields.join("\n");
}

export function extractRepoInfo(githubUrl: string): {
  owner: string;
  repo: string;
  branch: string;
} | null {
  try {
    const url = new URL(githubUrl);
    if (!url.hostname.includes("github.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return {
      owner: parts[0],
      repo: parts[1].replace(".git", ""),
      branch: parts[3] || "main",
    };
  } catch {
    return null;
  }
}

export function getLanguageFromExtension(ext: string): string {
  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    py: "Python",
    go: "Go",
    rs: "Rust",
    java: "Java",
    kt: "Kotlin",
    swift: "Swift",
    cs: "C#",
    cpp: "C++",
    c: "C",
    php: "PHP",
    rb: "Ruby",
    dart: "Dart",
    vue: "Vue",
    svelte: "Svelte",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sql: "SQL",
    sh: "Shell",
    yaml: "YAML",
    yml: "YAML",
    json: "JSON",
    md: "Markdown",
    toml: "TOML",
    env: "Environment",
  };
  return map[ext.toLowerCase()] || "Unknown";
}
