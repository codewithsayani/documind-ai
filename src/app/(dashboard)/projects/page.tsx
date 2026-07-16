import { Metadata } from "next";
import { getProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FolderOpen, Plus, Grid3X3, List } from "lucide-react";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="gradient-primary text-white border-0 hover:opacity-90">
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8 text-muted-foreground" />}
          title="No projects found"
          description="You haven't uploaded any projects yet. Upload your first codebase to get started."
          action={
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
