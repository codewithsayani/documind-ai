import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDocumentation } from "@/lib/ai/doc-generator";
import { detectProject } from "@/lib/ai/project-detector";
import { processZipBuffer, processIndividualFiles, processGitHubUrl } from "@/lib/ai/file-processor";
import { saveDocumentation } from "@/actions/documentation";
import { createProject } from "@/actions/projects";
import { checkDailyLimit, incrementDailyLimit } from "@/actions/search";

export const maxDuration = 300; // 5 minutes for Vercel

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check daily limit
    const limit = await checkDailyLimit();
    if (!limit.canGenerate) {
      return NextResponse.json(
        { error: `Daily generation limit reached (${limit.limit}/day). Resets at midnight.` },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const sourceType = formData.get("sourceType") as "zip" | "files" | "github";
    const projectName = formData.get("projectName") as string;
    const githubUrl = formData.get("githubUrl") as string;

    let files;

    if (sourceType === "zip") {
      const zipFile = formData.get("file") as File;
      if (!zipFile) {
        return NextResponse.json({ error: "No ZIP file provided" }, { status: 400 });
      }
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (zipFile.size > maxSize) {
        return NextResponse.json({ error: "ZIP file too large (max 50MB)" }, { status: 400 });
      }
      const buffer = await zipFile.arrayBuffer();
      files = await processZipBuffer(buffer);

    } else if (sourceType === "files") {
      const uploadedFiles = formData.getAll("files") as File[];
      if (!uploadedFiles.length) {
        return NextResponse.json({ error: "No files provided" }, { status: 400 });
      }
      const fileBuffers = await Promise.all(
        uploadedFiles.map(async (f) => ({
          name: f.name,
          buffer: await f.arrayBuffer(),
          mimeType: f.type,
        }))
      );
      files = await processIndividualFiles(fileBuffers);

    } else if (sourceType === "github") {
      if (!githubUrl) {
        return NextResponse.json({ error: "GitHub URL required" }, { status: 400 });
      }
      files = await processGitHubUrl(githubUrl);

    } else {
      return NextResponse.json({ error: "Invalid source type" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No supported files found in the upload" },
        { status: 400 }
      );
    }

    // Analyze project
    const analysis = detectProject(files);
    if (projectName) analysis.name = projectName;

    // Create project record
    const projectResult = await createProject({
      name: analysis.name,
      sourceType,
      sourceUrl: githubUrl || undefined,
      framework: analysis.framework,
      language: analysis.language,
      packageManager: analysis.packageManager,
      techStack: analysis.techStack,
      fileCount: analysis.fileCount,
      totalSizeBytes: analysis.totalSizeBytes,
      description: analysis.description,
    });

    if (projectResult.error || !projectResult.data) {
      return NextResponse.json({ error: projectResult.error }, { status: 500 });
    }

    const project = projectResult.data;

    // Generate documentation
    const result = await generateDocumentation(analysis);

    // Assemble full content
    const fullContent = Object.values(result.documentation)
      .filter((v): v is string => typeof v === "string")
      .join("\n\n---\n\n");

    // Save documentation
    const docResult = await saveDocumentation({
      projectId: project.id,
      title: `${analysis.name} Documentation`,
      content: fullContent,
      contentJson: result.documentation,
      qualityScore: result.qualityScore,
      wordCount: result.wordCount,
      generationMetadata: result.metadata,
    });

    if (docResult.error) {
      return NextResponse.json({ error: docResult.error }, { status: 500 });
    }

    // Increment daily limit
    await incrementDailyLimit();

    return NextResponse.json({
      success: true,
      projectId: project.id,
      documentationId: docResult.data?.id,
      qualityScore: result.qualityScore,
      wordCount: result.wordCount,
      filesAnalyzed: analysis.fileCount,
      framework: analysis.framework,
      language: analysis.language,
    });

  } catch (error) {
    console.error("[Generate API Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
