import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentationId, format } = await request.json();

    if (!documentationId || !format) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("documentations")
      .select("*, project:projects(name)")
      .eq("id", documentationId)
      .eq("user_id", user.id)
      .single();

    if (!doc) return NextResponse.json({ error: "Documentation not found" }, { status: 404 });

    let content: string;
    let mimeType: string;
    let filename: string;
    const projectName = (doc.project as { name: string } | null)?.name || "documentation";

    switch (format) {
      case "markdown":
        content = doc.content;
        mimeType = "text/markdown";
        filename = `${projectName}-docs.md`;
        break;

      case "readme":
        content = (doc.content_json as { readme?: string })?.readme || doc.content;
        mimeType = "text/markdown";
        filename = "README.md";
        break;

      case "pdf":
        // For PDF, return the markdown content and let client handle conversion
        // In production, you'd use puppeteer or a PDF service
        content = doc.content;
        mimeType = "text/markdown";
        filename = `${projectName}-docs.md`;
        break;

      default:
        content = doc.content;
        mimeType = "text/plain";
        filename = `${projectName}-docs.txt`;
    }

    // Log download
    await supabase.from("downloads").insert({
      user_id: user.id,
      documentation_id: documentationId,
      project_id: doc.project_id,
      format,
      file_name: filename,
    });

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      type: "doc_exported",
      title: `Exported as ${format.toUpperCase()}`,
      description: doc.title,
      project_id: doc.project_id,
      documentation_id: documentationId,
    });

    return new NextResponse(content, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
