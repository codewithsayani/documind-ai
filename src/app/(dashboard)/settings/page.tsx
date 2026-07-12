"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import { saveUserSettings } from "@/actions/search";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sun, Moon, Monitor, Bell, FileText } from "lucide-react";

export default function SettingsPage() {
  const { settings, setSettings } = useAuthStore();
  const { setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    theme: settings?.theme || "system",
    email_notifications: settings?.email_notifications ?? true,
    generation_notifications: settings?.generation_notifications ?? true,
    weekly_digest: settings?.weekly_digest ?? false,
    default_export_format: settings?.default_export_format || "markdown",
    editor_font_size: settings?.editor_font_size || 14,
    editor_word_wrap: settings?.editor_word_wrap ?? true,
    compact_view: settings?.compact_view ?? false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveUserSettings({
      theme: localSettings.theme,
      emailNotifications: localSettings.email_notifications,
      generationNotifications: localSettings.generation_notifications,
      weeklyDigest: localSettings.weekly_digest,
      defaultExportFormat: localSettings.default_export_format,
      editorFontSize: localSettings.editor_font_size,
      editorWordWrap: localSettings.editor_word_wrap,
      compactView: localSettings.compact_view,
    });
    setIsSaving(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved!");
      setTheme(localSettings.theme);
      if (settings) setSettings({ ...settings, ...localSettings });
    }
  };

  const update = (key: string, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const SettingRow = ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{title}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Customize your DocuMind AI experience</p>
      </div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 space-y-1"
      >
        <h2 className="text-sm font-semibold mb-3">Appearance</h2>
        <SettingRow title="Theme" description="Choose your preferred color scheme">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            {(["light", "dark", "system"] as const).map((t) => {
              const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
              return (
                <button
                  key={t}
                  onClick={() => update("theme", t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                    localSettings.theme === t
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              );
            })}
          </div>
        </SettingRow>
        <Separator />
        <SettingRow title="Compact View" description="Reduce spacing in project lists">
          <Switch
            checked={localSettings.compact_view}
            onCheckedChange={(v) => update("compact_view", v)}
          />
        </SettingRow>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border bg-card p-6 space-y-1"
      >
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Notifications</h2>
        </div>
        <SettingRow title="Email Notifications" description="Receive email updates about your account">
          <Switch
            checked={localSettings.email_notifications}
            onCheckedChange={(v) => update("email_notifications", v)}
          />
        </SettingRow>
        <Separator />
        <SettingRow title="Generation Complete" description="Get notified when documentation is ready">
          <Switch
            checked={localSettings.generation_notifications}
            onCheckedChange={(v) => update("generation_notifications", v)}
          />
        </SettingRow>
        <Separator />
        <SettingRow title="Weekly Digest" description="Weekly summary of your documentation activity">
          <Switch
            checked={localSettings.weekly_digest}
            onCheckedChange={(v) => update("weekly_digest", v)}
          />
        </SettingRow>
      </motion.div>

      {/* Editor */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6 space-y-1"
      >
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Editor</h2>
        </div>
        <SettingRow title="Font Size" description="Editor font size in pixels">
          <Select
            value={String(localSettings.editor_font_size)}
            onValueChange={(v) => update("editor_font_size", Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[12, 13, 14, 15, 16, 18, 20].map((s) => (
                <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <Separator />
        <SettingRow title="Word Wrap" description="Wrap long lines in the editor">
          <Switch
            checked={localSettings.editor_word_wrap}
            onCheckedChange={(v) => update("editor_word_wrap", v)}
          />
        </SettingRow>
        <Separator />
        <SettingRow title="Default Export Format" description="Default format when exporting documentation">
          <Select
            value={localSettings.default_export_format}
            onValueChange={(v) => update("default_export_format", v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="readme">README.md</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </motion.div>

      <Button onClick={handleSave} disabled={isSaving} className="gap-2">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Save Settings
      </Button>
    </div>
  );
}
