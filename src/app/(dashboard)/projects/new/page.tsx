import { Metadata } from "next";
import { UploadZone } from "@/components/projects/upload-zone";
import { Zap, Shield, Clock } from "lucide-react";

export const metadata: Metadata = { title: "New Project" };

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Generate Documentation</h1>
        <p className="text-muted-foreground">
          Upload your codebase and AI will generate comprehensive documentation in seconds.
        </p>
      </div>

      {/* Features row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Zap, title: "AI-Powered", desc: "Gemini 2.5 Flash analyzes your code" },
          { icon: Shield, title: "Secure", desc: "Files processed locally, never stored" },
          { icon: Clock, title: "Fast", desc: "Documentation in under 60 seconds" },
        ].map((f) => (
          <div key={f.title} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-muted/20 text-center">
            <f.icon className="w-5 h-5 text-primary" />
            <p className="text-xs font-semibold">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <UploadZone />
    </div>
  );
}
