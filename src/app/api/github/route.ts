import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processGitHubUrl } from "@/lib/ai/file-processor";
import { extractRepoInfo } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "GitHub URL required" }, { status: 400 });
    }

    const info = extractRepoInfo(url);
    if (!info) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }

    // Validate repo is accessible
    const repoResponse = await fetch(
      `https://api.github.com/repos/${info.owner}/${info.repo}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DocuMind-AI/1.0",
        },
      }
    );

    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or is private" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to access repository" },
        { status: repoResponse.status }
      );
    }

    const repoData = await repoResponse.json();

    return NextResponse.json({
      valid: true,
      name: repoData.name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      defaultBranch: repoData.default_branch,
      isPrivate: repoData.private,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate GitHub URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
