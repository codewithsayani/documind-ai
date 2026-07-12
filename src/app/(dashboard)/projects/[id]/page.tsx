import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { getDocumentation } from "@/actions/documentation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FileText,
  Download,
  RefreshCcw,
  Calendar,
  HardDrive,
  Files,
  ArrowLeft,
  ExternalLink,
  Code2,
} from "lucide-react";
import { formatBytes, formatDate, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Project Detail" };

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const [project, documentation] = await Promise.all([
    getProject(id),
    getDocumentation(id),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
        <Link href="/projects">
          <ArrowLeft className="w-4 h-4 mr-1" /> Projects
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground text-sm mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {documentation ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/documentation/${documentation.id}/edit`}>
                  Edit Docs
                </Link>
              </Button>
              <Button asChild size="sm" className="gradient-primary text-white border-0 hover:opacity-90">
                <Link href={`/documentation/${documentation.id}`}>
                  <FileText className="w-4 h-4 mr-2" /> View Docs
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="gradient-primary text-white border-0 hover:opacity-90">
              <Link href="/projects/new">
                <RefreshCcw className="w-4 h-4 mr-2" /> Generate Docs
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Files", value: project.file_count, icon: Files },
          { label: "Size", value: formatBytes(project.total_size_bytes), icon: HardDrive },
          { label: "Created", value: formatDate(project.created_at), icon: Calendar },
          { label: "Updated", value: formatRelativeTime(project.updated_at), icon: RefreshCcw },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-sm font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tech Stack */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Technology Stack</h2>
        <div className="flex flex-wrap gap-2">
          {project.framework && (
            <Badge variant="default" className="text-xs">
              {project.framework}
            </Badge>
          )}
          {project.language && (
            <Badge variant="outline" className="text-xs">
              {project.language}
            </Badge>
          )}
          {project.package_manager && (
            <Badge variant="outline" className="text-xs">
              {project.package_manager}
            </Badge>
          )}
          {project.tech_stack?.map((tech: string) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>
      </div>

      {/* Documentation */}
      {documentation && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Documentation</h2>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  documentation.quality_score >= 80
                    ? "bg-green-500/10 text-green-600 border-0"
                    : documentation.quality_score >= 60
                    ? "bg-yellow-500/10 text-yellow-600 border-0"
                    : "bg-red-500/10 text-red-600 border-0"
                }
              >
                Score: {documentation.quality_score}/100
              </Badge>
              <Badge variant="outline" className="text-xs">
                v{documentation.current_version}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-lg font-bold">{documentation.word_count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Words</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-lg font-bold">v{documentation.current_version}</p>
              <p className="text-xs text-muted-foreground">Version</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-lg font-bold">{documentation.quality_score}</p>
              <p className="text-xs text-muted-foreground">Quality</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/documentation/${documentation.id}/versions`}>
                <ExternalLink className="w-4 h-4 mr-2" /> Version History
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/documentation/${documentation.id}`}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
