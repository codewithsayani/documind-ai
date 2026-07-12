import { getDashboardStats, getRecentActivity } from "@/actions/projects";
import { getProjects } from "@/actions/projects";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FolderOpen,
  FileText,
  Download,
  Zap,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const [stats, projects, activity] = await Promise.all([
    getDashboardStats(),
    getProjects(),
    getRecentActivity(),
  ]);

  const recentProjects = projects.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back! Here&apos;s what&apos;s happening with your projects.
          </p>
        </div>
        <Button asChild className="gradient-primary text-white border-0 hover:opacity-90">
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          icon={FolderOpen}
          description="Projects uploaded"
          trend={12}
        />
        <StatsCard
          title="Documentations"
          value={stats?.totalDocumentations || 0}
          icon={FileText}
          description="Docs generated"
          trend={8}
        />
        <StatsCard
          title="Downloads"
          value={stats?.totalDownloads || 0}
          icon={Download}
          description="Files exported"
          trend={5}
        />
        <StatsCard
          title="Daily Usage"
          value={`${stats?.generationsToday || 0}/${stats?.generationsLimit || 5}`}
          icon={Zap}
          description="Generations today"
          isLimit
          limitPercent={
            ((stats?.generationsToday || 0) / (stats?.generationsLimit || 5)) * 100
          }
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Projects</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects" className="text-muted-foreground hover:text-foreground gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              description="Upload your first codebase to get AI-powered documentation in seconds."
              action={
                <Button asChild size="sm">
                  <Link href="/projects/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Project
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} compact />
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <ActivityFeed activities={activity} />
        </div>
      </div>
    </div>
  );
}
