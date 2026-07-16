import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, BookOpen, File, Calendar } from "lucide-react";
import { formatDate, formatBytes } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Downloads" };

export default async function DownloadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: downloads } = await supabase
    .from("downloads")
    .select(`
      *,
      documentation:documentations(title),
      project:projects(name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const formatIcons: Record<string, React.ReactNode> = {
    readme: <BookOpen className="w-4 h-4 text-blue-500" />,
    markdown: <FileText className="w-4 h-4 text-purple-500" />,
    pdf: <File className="w-4 h-4 text-red-500" />,
    docx: <File className="w-4 h-4 text-blue-600" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Downloads</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {downloads?.length || 0} download{(downloads?.length || 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {!downloads || downloads.length === 0 ? (
        <EmptyState
          icon={<Download className="w-8 h-8 text-muted-foreground" />}
          title="No downloads yet"
          description="Export documentation as Markdown, README, or PDF to see your download history here."
          action={
            <Button asChild size="sm">
              <Link href="/projects">Browse Projects</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {downloads.map((dl) => (
              <div key={dl.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-lg bg-muted">
                  {formatIcons[dl.format] || <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {(dl.documentation as { title: string } | null)?.title || "Documentation"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(dl.project as { name: string } | null)?.name || "Unknown project"}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {dl.format?.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Calendar className="w-3 h-3" />
                  {formatDate(dl.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
