"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Documentation, DocumentationVersion } from "@/types";
import { countWords } from "@/lib/utils";

export async function getDocumentation(
  projectId: string
): Promise<Documentation | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("documentations")
    .select(`*, project:projects(*)`)
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function getDocumentationById(
  id: string
): Promise<Documentation | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("documentations")
    .select(`*, project:projects(*)`)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function saveDocumentation(data: {
  projectId: string;
  title: string;
  content: string;
  contentJson: object;
  qualityScore: number;
  wordCount: number;
  generationMetadata: object;
}): Promise<{ data?: Documentation; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check if documentation already exists
  const { data: existing } = await supabase
    .from("documentations")
    .select("id, current_version")
    .eq("project_id", data.projectId)
    .eq("user_id", user.id)
    .single();

  let doc: Documentation;

  if (existing) {
    // Save current as version before updating
    await supabase.from("documentation_versions").insert({
      documentation_id: existing.id,
      project_id: data.projectId,
      user_id: user.id,
      version_number: existing.current_version,
      title: data.title,
      content: data.content,
      content_json: data.contentJson,
      quality_score: data.qualityScore,
      word_count: data.wordCount,
      change_summary: "Regenerated",
    });

    const { data: updated, error } = await supabase
      .from("documentations")
      .update({
        title: data.title,
        content: data.content,
        content_json: data.contentJson,
        quality_score: data.qualityScore,
        word_count: data.wordCount,
        generation_metadata: data.generationMetadata,
        current_version: existing.current_version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return { error: error.message };
    doc = updated;
  } else {
    const { data: created, error } = await supabase
      .from("documentations")
      .insert({
        project_id: data.projectId,
        user_id: user.id,
        title: data.title,
        content: data.content,
        content_json: data.contentJson,
        quality_score: data.qualityScore,
        word_count: data.wordCount,
        generation_metadata: data.generationMetadata,
        current_version: 1,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    doc = created;

    // Save initial version
    await supabase.from("documentation_versions").insert({
      documentation_id: doc.id,
      project_id: data.projectId,
      user_id: user.id,
      version_number: 1,
      title: data.title,
      content: data.content,
      content_json: data.contentJson,
      quality_score: data.qualityScore,
      word_count: data.wordCount,
      change_summary: "Initial generation",
    });
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    type: "doc_generated",
    title: `Documentation generated`,
    description: data.title,
    project_id: data.projectId,
    documentation_id: doc.id,
  });

  revalidatePath(`/projects/${data.projectId}`);
  return { data: doc };
}

export async function updateDocumentation(
  id: string,
  content: string,
  changeSummary?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("documentations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) return { error: "Documentation not found" };

  const wordCount = countWords(content);

  // Save version before editing
  await supabase.from("documentation_versions").insert({
    documentation_id: id,
    project_id: existing.project_id,
    user_id: user.id,
    version_number: existing.current_version,
    title: existing.title,
    content: existing.content,
    content_json: existing.content_json,
    quality_score: existing.quality_score,
    word_count: existing.word_count,
    change_summary: changeSummary || "Manual edit",
  });

  const { error } = await supabase
    .from("documentations")
    .update({
      content,
      word_count: wordCount,
      current_version: existing.current_version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    type: "doc_edited",
    title: "Documentation edited",
    description: existing.title,
    project_id: existing.project_id,
    documentation_id: id,
  });

  revalidatePath(`/documentation/${id}`);
  return {};
}

export async function getVersions(
  documentationId: string
): Promise<DocumentationVersion[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("documentation_versions")
    .select("*")
    .eq("documentation_id", documentationId)
    .eq("user_id", user.id)
    .order("version_number", { ascending: false });

  return data || [];
}

export async function restoreVersion(
  documentationId: string,
  versionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: version } = await supabase
    .from("documentation_versions")
    .select("*")
    .eq("id", versionId)
    .eq("user_id", user.id)
    .single();

  if (!version) return { error: "Version not found" };

  const { data: existing } = await supabase
    .from("documentations")
    .select("current_version")
    .eq("id", documentationId)
    .single();

  const { error } = await supabase
    .from("documentations")
    .update({
      content: version.content,
      content_json: version.content_json,
      word_count: version.word_count,
      current_version: (existing?.current_version || 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/documentation/${documentationId}`);
  return {};
}

export async function deleteVersion(
  versionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("documentation_versions")
    .delete()
    .eq("id", versionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}
