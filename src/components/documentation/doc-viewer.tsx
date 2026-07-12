"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Documentation, DocumentationContent } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExportMenu } from "./export-menu";
import {
  ArrowLeft,
  Edit3,
  GitBranch,
  Star,
  LayoutList,
} from "lucide-react";

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "executive_summary", label: "Executive Summary" },
  { key: "features", label: "Features" },
  { key: "tech_stack", label: "Tech Stack" },
  { key: "architecture", label: "Architecture" },
  { key: "folder_structure", label: "Folder Structure" },
  { key: "installation", label: "Installation" },
  { key: "usage", label: "Usage" },
  { key: "configuration", label: "Configuration" },
  { key: "environment_variables", label: "Environment Variables" },
  { key: "database", label: "Database" },
  { key: "api_docs", label: "API Docs" },
  { key: "auth_flow", label: "Auth Flow" },
  { key: "code_organization", label: "Code Organization" },
  { key: "major_components", label: "Major Components" },
  { key: "reusable_modules", label: "Reusable Modules" },
  { key: "design_patterns", label: "Design Patterns" },
  { key: "security_suggestions", label: "Security" },
  { key: "performance_suggestions", label: "Performance" },
  { key: "code_quality", label: "Code Quality" },
  { key: "future_improvements", label: "Future Improvements" },
  { key: "known_limitations", label: "Known Limitations" },
  { key: "deployment", label: "Deployment" },
  { key: "contributing", label: "Contributing" },
  { key: "license", label: "License" },
  { key: "complexity_analysis", label: "Complexity" },
  { key: "dependency_analysis", label: "Dependencies" },
  { key: "project_summary", label: "Summary" },
  { key: "readme", label: "README" },
] as const;

interface DocViewerProps {
  documentation: Documentation;
}

export function DocViewer({ documentation }: DocViewerProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const content = documentation.content_json as DocumentationContent;
  const availableSections = SECTIONS.filter(
    (s) => content[s.key as keyof DocumentationContent]
  );
  const currentContent = content[activeSection as keyof DocumentationContent] as string | undefined;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden -m-6">
      {/* Sidebar TOC */}
      {sidebarOpen && (
        <div className="w-56 border-r border-border bg-[hsl(var(--sidebar-bg))] flex flex-col shrink-0">
          <div className="p-3 border-b border-border">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground px-0">
              <Link href={`/projects/${documentation.project_id}`}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Project
              </Link>
            </Button>
          </div>
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-muted-foreground">DOCUMENTATION</span>
              <Badge className={cn(
                "text-xs border-0",
                documentation.quality_score >= 80 ? "bg-green-500/10 text-green-600" :
                documentation.quality_score >= 60 ? "bg-yellow-500/10 text-yellow-600" :
                "bg-red-500/10 text-red-600"
              )}>
                {documentation.quality_score}
              </Badge>
            </div>
            <p className="text-xs font-medium truncate">{documentation.title}</p>
          </div>
          <ScrollArea className="flex-1">
            <nav className="p-2 space-y-0.5">
              {availableSections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors",
                    activeSection === section.key
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              v{documentation.current_version}
            </Badge>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href={`/documentation/${documentation.id}/versions`}>
                <GitBranch className="w-4 h-4 mr-1" /> History
              </Link>
            </Button>
            <ExportMenu documentationId={documentation.id} />
            <Button size="sm" asChild className="gradient-primary text-white border-0 hover:opacity-90">
              <Link href={`/documentation/${documentation.id}/edit`}>
                <Edit3 className="w-4 h-4 mr-1.5" /> Edit
              </Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {currentContent ? (
              <div className="markdown-content">
                <ReactMarkdown>{currentContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>Select a section from the sidebar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
