"use client";

import { useState } from "react";
import { DocumentationVersion } from "@/types";
import { formatDate, formatRelativeTime, countWords } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { restoreVersion, deleteVersion } from "@/actions/documentation";
import { toast } from "sonner";
import { RotateCcw, Trash2, GitBranch, ChevronDown, ChevronUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { motion, AnimatePresence } from "framer-motion";

interface VersionsListProps {
  documentationId: string;
  versions: DocumentationVersion[];
}

export function VersionsList({ documentationId, versions: initialVersions }: VersionsListProps) {
  const [versions, setVersions] = useState(initialVersions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRestore = async (versionId: string) => {
    setLoading(versionId);
    const { error } = await restoreVersion(documentationId, versionId);
    setLoading(null);
    if (error) toast.error(error);
    else toast.success("Version restored successfully!");
  };

  const handleDelete = async (versionId: string) => {
    setLoading(versionId);
    const { error } = await deleteVersion(versionId);
    setLoading(null);
    if (error) {
      toast.error(error);
    } else {
      setVersions((v) => v.filter((ver) => ver.id !== versionId));
      toast.success("Version deleted");
    }
  };

  if (versions.length === 0) {
    return (
      <EmptyState
        icon={<GitBranch className="w-8 h-8 text-muted-foreground" />}
        title="No version history"
        description="Versions are created automatically when you save or regenerate documentation."
      />
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((version, i) => (
        <div
          key={version.id}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <GitBranch className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">v{version.version_number}</span>
                {i === 0 && <Badge variant="secondary" className="text-xs">Latest</Badge>}
                {version.change_summary && (
                  <span className="text-xs text-muted-foreground">{version.change_summary}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{formatDate(version.created_at)}</span>
                <span>{formatRelativeTime(version.created_at)}</span>
                <span>{countWords(version.content).toLocaleString()} words</span>
                {version.quality_score > 0 && (
                  <span>Score: {version.quality_score}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
              >
                {expandedId === version.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(version.id)}
                disabled={loading === version.id || i === 0}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Restore
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(version.id)}
                disabled={loading === version.id}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {expandedId === version.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border overflow-hidden"
              >
                <pre className="p-4 text-xs text-muted-foreground font-mono overflow-x-auto max-h-48 scrollbar-thin">
                  {version.content.slice(0, 2000)}
                  {version.content.length > 2000 && "\n\n... (truncated)"}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
