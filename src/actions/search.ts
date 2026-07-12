"use server";

import { createClient } from "@/lib/supabase/server";
import { SearchResult } from "@/types";

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const trimmed = query.trim();

  const [projectsRes, docsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, framework, language, created_at")
      .eq("user_id", user.id)
      .or(`name.ilike.%${trimmed}%,description.ilike.%${trimmed}%,framework.ilike.%${trimmed}%,language.ilike.%${trimmed}%`)
      .limit(10),

    supabase
      .from("documentations")
      .select("id, title, project_id, created_at")
      .eq("user_id", user.id)
      .or(`title.ilike.%${trimmed}%,content.ilike.%${trimmed}%`)
      .limit(10),
  ]);

  const results: SearchResult[] = [];

  (projectsRes.data || []).forEach((p) => {
    results.push({
      type: "project",
      id: p.id,
      title: p.name,
      description: p.description || undefined,
      framework: p.framework || undefined,
      language: p.language || undefined,
      created_at: p.created_at,
    });
  });

  (docsRes.data || []).forEach((d) => {
    results.push({
      type: "documentation",
      id: d.id,
      title: d.title,
      project_id: d.project_id,
      created_at: d.created_at,
    });
  });

  return results;
}

export async function checkDailyLimit(): Promise<{
  canGenerate: boolean;
  remaining: number;
  limit: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { canGenerate: false, remaining: 0, limit: 5 };

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_limits")
    .select("generation_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const count = data?.generation_count || 0;
  const limit = 5;
  return {
    canGenerate: count < limit,
    remaining: Math.max(0, limit - count),
    limit,
  };
}

export async function incrementDailyLimit(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("daily_limits")
    .select("id, generation_count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_limits")
      .update({ generation_count: existing.generation_count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("daily_limits").insert({
      user_id: user.id,
      date: today,
      generation_count: 1,
    });
  }
}

export async function getUsageHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("daily_limits")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(30);

  return data || [];
}

export async function saveUserSettings(settings: {
  theme?: string;
  emailNotifications?: boolean;
  generationNotifications?: boolean;
  weeklyDigest?: boolean;
  defaultExportFormat?: string;
  editorFontSize?: number;
  editorWordWrap?: boolean;
  compactView?: boolean;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = {};
  if (settings.theme !== undefined) updates.theme = settings.theme;
  if (settings.emailNotifications !== undefined) updates.email_notifications = settings.emailNotifications;
  if (settings.generationNotifications !== undefined) updates.generation_notifications = settings.generationNotifications;
  if (settings.weeklyDigest !== undefined) updates.weekly_digest = settings.weeklyDigest;
  if (settings.defaultExportFormat !== undefined) updates.default_export_format = settings.defaultExportFormat;
  if (settings.editorFontSize !== undefined) updates.editor_font_size = settings.editorFontSize;
  if (settings.editorWordWrap !== undefined) updates.editor_word_wrap = settings.editorWordWrap;
  if (settings.compactView !== undefined) updates.compact_view = settings.compactView;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("settings")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function getUserSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}
