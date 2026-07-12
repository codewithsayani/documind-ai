"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Project } from "@/types";

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      documentations(id, quality_score, current_version, updated_at)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      documentations(*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return null;
  return data;
}

export async function createProject(data: {
  name: string;
  sourceType: "zip" | "files" | "github";
  sourceUrl?: string;
  framework?: string;
  language?: string;
  packageManager?: string;
  techStack?: string[];
  fileCount?: number;
  totalSizeBytes?: number;
  description?: string;
}): Promise<{ data?: Project; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: data.name,
      source_type: data.sourceType,
      source_url: data.sourceUrl,
      framework: data.framework,
      language: data.language,
      package_manager: data.packageManager,
      tech_stack: data.techStack || [],
      file_count: data.fileCount || 0,
      total_size_bytes: data.totalSizeBytes || 0,
      description: data.description,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    type: "project_created",
    title: `Created project: ${data.name}`,
    description: `New ${data.framework || data.language || "code"} project uploaded`,
    project_id: project.id,
  });

  revalidatePath("/projects");
  return { data: project };
}

export async function renameProject(
  id: string,
  name: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("projects")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return {};
}

export async function toggleFavorite(
  projectId: string,
  isFavorite: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (isFavorite) {
    await supabase
      .from("favorites")
      .insert({ user_id: user.id, project_id: projectId });
  } else {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", projectId);
  }

  await supabase
    .from("projects")
    .update({ is_favorite: isFavorite })
    .eq("id", projectId)
    .eq("user_id", user.id);

  revalidatePath("/projects");
  return {};
}

export async function duplicateProject(
  id: string
): Promise<{ data?: Project; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: original } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!original) return { error: "Project not found" };

  const { data: copy, error } = await supabase
    .from("projects")
    .insert({
      ...original,
      id: undefined,
      name: `${original.name} (Copy)`,
      is_favorite: false,
      created_at: undefined,
      updated_at: undefined,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { data: copy };
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().split("T")[0];

  const [projectsRes, docsRes, downloadsRes, limitsRes] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact" }).eq("user_id", user.id),
    supabase.from("documentations").select("id", { count: "exact" }).eq("user_id", user.id),
    supabase.from("downloads").select("id", { count: "exact" }).eq("user_id", user.id),
    supabase.from("daily_limits").select("*").eq("user_id", user.id).eq("date", today).single(),
  ]);

  return {
    totalProjects: projectsRes.count || 0,
    totalDocumentations: docsRes.count || 0,
    totalDownloads: downloadsRes.count || 0,
    generationsToday: limitsRes.data?.generation_count || 0,
    generationsLimit: 5,
    storageUsed: 0,
  };
}

export async function getRecentActivity() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return data || [];
}
