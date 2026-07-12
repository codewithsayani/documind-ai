"use client";

import { motion } from "framer-motion";
import { UploadProgress } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileSearch,
  Cpu,
  Sparkles,
  Save,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

const stages = [
  { key: "uploading", label: "Uploading", icon: Upload },
  { key: "extracting", label: "Extracting", icon: FileSearch },
  { key: "analyzing", label: "Analyzing", icon: Cpu },
  { key: "generating", label: "Generating", icon: Sparkles },
  { key: "saving", label: "Saving", icon: Save },
  { key: "done", label: "Complete", icon: CheckCircle2 },
] as const;

const stageIndex: Record<string, number> = {
  uploading: 0,
  extracting: 1,
  analyzing: 2,
  generating: 3,
  saving: 4,
  done: 5,
  error: -1,
};

interface GenerationProgressProps {
  progress: UploadProgress;
  onReset: () => void;
}

export function GenerationProgress({ progress, onReset }: GenerationProgressProps) {
  const currentIndex = stageIndex[progress.stage];
  const isError = progress.stage === "error";
  const isDone = progress.stage === "done";

  return (
    <div className="max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8 text-center space-y-6"
      >
        {/* Icon */}
        <motion.div
          animate={isDone ? { scale: [1, 1.1, 1] } : { rotate: isError ? 0 : 360 }}
          transition={
            isDone
              ? { duration: 0.5 }
              : isError
              ? {}
              : { duration: 2, repeat: Infinity, ease: "linear" }
          }
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
            isDone
              ? "bg-green-500/10"
              : isError
              ? "bg-red-500/10"
              : "bg-primary/10"
          )}
        >
          {isDone ? (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          ) : isError ? (
            <XCircle className="w-8 h-8 text-red-500" />
          ) : (
            <Sparkles className="w-8 h-8 text-primary" />
          )}
        </motion.div>

        {/* Message */}
        <div>
          <h3 className="text-lg font-semibold">{progress.message}</h3>
          {progress.details && (
            <p className="text-sm text-muted-foreground mt-1">{progress.details}</p>
          )}
        </div>

        {/* Progress bar */}
        {!isError && (
          <div className="space-y-2">
            <Progress value={progress.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress.progress}%</p>
          </div>
        )}

        {/* Stage indicators */}
        {!isError && (
          <div className="flex items-center justify-center gap-1">
            {stages.map((stage, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="flex items-center gap-1">
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
                      done
                        ? "bg-green-500/10 text-green-600"
                        : active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{stage.label}</span>
                  </div>
                  {i < stages.length - 1 && (
                    <div className={cn("w-3 h-px", done ? "bg-green-500/50" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        {(isError) && (
          <Button onClick={onReset} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        )}

        {!isError && (
          <p className="text-xs text-muted-foreground">
            {isDone
              ? "Redirecting to your documentation..."
              : "This may take 30-60 seconds for large projects"}
          </p>
        )}
      </motion.div>
    </div>
  );
}
