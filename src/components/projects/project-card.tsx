"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Project } from "@/types";
import { cn, formatRelativeTime, formatBytes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreVertical,
  Star,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Code2,
  Calendar,
  Weight,
} from "lucide-react";
import { toast } from "sonner";
import { deleteProject, toggleFavorite, duplicateProject } from "@/actions/projects";
import { useProjectStore } from "@/store/project-store";

const frameworkColors: Record<string, string> = {
  "Next.js": "bg-black text-white",
  "React": "bg-cyan-500/10 text-cyan-600",
  "Vue": "bg-green-500/10 text-green-600",
  "Angular": "bg-red-500/10 text-red-600",
  "Svelte": "bg-orange-500/10 text-orange-600",
  "Express": "bg-gray-500/10 text-gray-600",
  "NestJS": "bg-red-500/10 text-red-500",
  "Django": "bg-green-500/10 text-green-700",
  "FastAPI": "bg-teal-500/10 text-teal-600",
  "Flask": "bg-gray-500/10 text-gray-600",
};

interface ProjectCardProps {
  project: Project;
  compact?: boolean;
}

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(project.is_favorite);
  const { removeProject } = useProjectStore();

  const frameworkColor = project.framework
    ? frameworkColors[project.framework] || "bg-primary/10 text-primary"
    : "bg-muted text-muted-foreground";

  const handleDelete = async () => {
    const { error } = await deleteProject(project.id);
    if (error) {
      toast.error(error);
    } else {
      removeProject(project.id);
      toast.success("Project deleted");
    }
  };

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newFav = !isFav;
    setIsFav(newFav);
    await toggleFavorite(project.id, newFav);
    toast.success(newFav ? "Added to favorites" : "Removed from favorites");
  };

  const handleDuplicate = async () => {
    const { error } = await duplicateProject(project.id);
    if (error) toast.error(error);
    else toast.success("Project duplicated");
  };

  const docs = (project.documentations as Array<{id: string, quality_score: number, current_version: number}> | undefined);
  const hasDoc = docs && docs.length > 0;
  const qualityScore = docs?.[0]?.quality_score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/projects/${project.id}`}
              className="text-sm font-semibold hover:text-primary transition-colors truncate block"
            >
              {project.name}
            </Link>
            {!compact && project.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggleFav}
            className={cn(
              "p-1 rounded hover:bg-muted transition-colors",
              isFav ? "text-yellow-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", isFav && "fill-yellow-500")} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8 opacity-0 group-hover:opacity-100" })}>
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                <ExternalLink className="w-3.5 h-3.5 mr-2" /> Open
              </DropdownMenuItem>
              {hasDoc && (
                <DropdownMenuItem onClick={() => router.push(`/documentation/${docs![0].id}`)}>
                  <FileText className="w-3.5 h-3.5 mr-2" /> View Docs
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {project.framework && (
          <Badge className={cn("text-xs px-1.5 py-0 font-normal border-0", frameworkColor)}>
            {project.framework}
          </Badge>
        )}
        {project.language && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 font-normal">
            {project.language}
          </Badge>
        )}
        {hasDoc && qualityScore !== undefined && (
          <Badge
            className={cn(
              "text-xs px-1.5 py-0 font-normal border-0 ml-auto",
              qualityScore >= 80
                ? "bg-green-500/10 text-green-600"
                : qualityScore >= 60
                ? "bg-yellow-500/10 text-yellow-600"
                : "bg-red-500/10 text-red-600"
            )}
          >
            Score: {qualityScore}
          </Badge>
        )}
      </div>

      {/* Meta */}
      {!compact && (
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatRelativeTime(project.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <Weight className="w-3 h-3" />
            {formatBytes(project.total_size_bytes)}
          </span>
          <span className="ml-auto">
            {project.file_count} files
          </span>
        </div>
      )}

      {compact && (
        <p className="text-xs text-muted-foreground mt-2">
          {formatRelativeTime(project.created_at)}
        </p>
      )}
    </motion.div>
  );
}
