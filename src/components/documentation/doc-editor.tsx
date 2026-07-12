"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Documentation } from "@/types";
import { useEditorStore } from "@/store/editor-store";
import { updateDocumentation } from "@/actions/documentation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { cn, countWords } from "@/lib/utils";
import { toast } from "sonner";
import {
  Save,
  Eye,
  Code2,
  ArrowLeft,
  RotateCcw,
  GitBranch,
  Download,
} from "lucide-react";
import Link from "next/link";
import { ExportMenu } from "./export-menu";

interface DocEditorProps {
  documentation: Documentation;
}

export function DocEditor({ documentation }: DocEditorProps) {
  const router = useRouter();
  const {
    content,
    originalContent,
    isDirty,
    isSaving,
    isPreview,
    wordCount,
    setContent,
    setOriginalContent,
    setIsSaving,
    setIsPreview,
    setWordCount,
    setDocumentation,
    reset,
  } = useEditorStore();

  useEffect(() => {
    setDocumentation(documentation);
    setContent(documentation.content);
    setOriginalContent(documentation.content);
    setWordCount(countWords(documentation.content));
    return () => reset();
  }, [documentation, setContent, setOriginalContent, setDocumentation, setWordCount, reset]);

  useEffect(() => {
    setWordCount(countWords(content));
  }, [content, setWordCount]);

  // Auto-save with debounce
  useEffect(() => {
    if (!isDirty) return;
    const timeout = setTimeout(() => {
      handleSave(true);
    }, 10000); // Auto-save after 10s of inactivity
    return () => clearTimeout(timeout);
  }, [content, isDirty]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    setIsSaving(true);
    try {
      const { error } = await updateDocumentation(
        documentation.id,
        content,
        isAutoSave ? "Auto-saved" : "Manual save"
      );
      if (error) {
        toast.error(error);
      } else {
        setOriginalContent(content);
        if (!isAutoSave) toast.success("Documentation saved!");
        else toast.info("Auto-saved", { duration: 2000 });
      }
    } finally {
      setIsSaving(false);
    }
  }, [content, documentation.id, setIsSaving, setOriginalContent]);

  // Keyboard shortcut: Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, handleSave]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={`/documentation/${documentation.id}`}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium truncate">{documentation.title}</span>
          {isDirty && (
            <Badge variant="secondary" className="text-xs">Unsaved</Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {wordCount.toLocaleString()} words
          </span>

          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setIsPreview(false)}
              className={cn(
                "px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors",
                !isPreview ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Code2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={cn(
                "px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors",
                isPreview ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>

          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link href={`/documentation/${documentation.id}/versions`}>
              <GitBranch className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">History</span>
            </Link>
          </Button>

          <ExportMenu documentationId={documentation.id} />

          <Button
            size="sm"
            onClick={() => handleSave()}
            disabled={!isDirty || isSaving}
            className="gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="max-w-4xl mx-auto px-8 py-8 markdown-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-8 font-mono text-sm bg-background text-foreground resize-none outline-none scrollbar-thin leading-7"
            spellCheck
            id="doc-editor-textarea"
          />
        )}
      </div>
    </div>
  );
}
