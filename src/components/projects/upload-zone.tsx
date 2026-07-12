"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerationProgress } from "@/components/ai/generation-progress";
import { GithubIcon } from "@/components/icons/github-icon";
import { toast } from "sonner";
import {
  Upload,
  FileArchive,
  Files,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { UploadProgress } from "@/types";

type UploadTab = "zip" | "files" | "github";

export function UploadZone() {
  const router = useRouter();
  const [tab, setTab] = useState<UploadTab>("zip");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [githubInfo, setGithubInfo] = useState<{ name: string; language: string; stars: number } | null>(null);
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (tab === "zip") {
      const zip = files.find((f) => f.name.endsWith(".zip"));
      if (zip) setSelectedFile(zip);
      else toast.error("Please drop a ZIP file");
    } else {
      setSelectedFiles(files);
    }
  }, [tab]);

  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".zip")) {
        toast.error("Please select a ZIP file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const validateGithubUrl = async () => {
    if (!githubUrl.includes("github.com")) {
      toast.error("Please enter a valid GitHub URL");
      return;
    }
    setIsValidatingGithub(true);
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setGithubInfo(null);
      } else {
        setGithubInfo(data);
        if (!projectName) setProjectName(data.name);
        toast.success("Repository found!");
      }
    } catch {
      toast.error("Failed to validate GitHub URL");
    } finally {
      setIsValidatingGithub(false);
    }
  };

  const handleGenerate = async () => {
    if (tab === "zip" && !selectedFile) {
      toast.error("Please select a ZIP file");
      return;
    }
    if (tab === "files" && selectedFiles.length === 0) {
      toast.error("Please select files");
      return;
    }
    if (tab === "github" && !githubUrl) {
      toast.error("Please enter a GitHub URL");
      return;
    }

    const formData = new FormData();
    formData.append("sourceType", tab);
    if (projectName) formData.append("projectName", projectName);

    if (tab === "zip" && selectedFile) {
      formData.append("file", selectedFile);
    } else if (tab === "files") {
      selectedFiles.forEach((f) => formData.append("files", f));
    } else if (tab === "github") {
      formData.append("githubUrl", githubUrl);
    }

    setProgress({ stage: "uploading", progress: 10, message: "Uploading files..." });

    try {
      setProgress({ stage: "extracting", progress: 25, message: "Extracting and reading files..." });

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      setProgress({ stage: "analyzing", progress: 45, message: "Analyzing project structure..." });
      await new Promise((r) => setTimeout(r, 500));

      setProgress({ stage: "generating", progress: 65, message: "AI is generating documentation..." });
      await new Promise((r) => setTimeout(r, 500));

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setProgress({ stage: "saving", progress: 90, message: "Saving documentation..." });
      await new Promise((r) => setTimeout(r, 300));

      setProgress({
        stage: "done",
        progress: 100,
        message: "Documentation generated!",
        details: `${data.filesAnalyzed} files analyzed • Quality score: ${data.qualityScore}`,
      });

      setTimeout(() => {
        router.push(`/documentation/${data.documentationId}`);
      }, 1500);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      setProgress({
        stage: "error",
        progress: 0,
        message: "Generation failed",
        details: message,
      });
      toast.error(message);
    }
  };

  const canGenerate =
    (tab === "zip" && !!selectedFile) ||
    (tab === "files" && selectedFiles.length > 0) ||
    (tab === "github" && !!githubUrl);

  if (progress) {
    return <GenerationProgress progress={progress} onReset={() => setProgress(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Project Name */}
      <div className="space-y-1.5">
        <Label htmlFor="project-name">Project Name <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          id="project-name"
          placeholder="Auto-detected from your project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* Upload Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as UploadTab)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="zip" className="gap-2">
            <FileArchive className="w-4 h-4" /> ZIP File
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <Files className="w-4 h-4" /> Files
          </TabsTrigger>
          <TabsTrigger value="github" className="gap-2">
            <GithubIcon className="w-4 h-4" /> GitHub
          </TabsTrigger>
        </TabsList>

        {/* ZIP Upload */}
        <TabsContent value="zip" className="mt-4">
          <label
            htmlFor="zip-upload"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center w-full h-52 rounded-xl border-2 border-dashed transition-all cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : selectedFile
                ? "border-green-500 bg-green-500/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <input
              id="zip-upload"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleZipSelect}
            />
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2 text-green-600"
                >
                  <CheckCircle2 className="w-10 h-10" />
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 text-muted-foreground"
                >
                  <div className="p-4 rounded-full bg-muted">
                    <FileArchive className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm text-foreground">Drop your ZIP file here</p>
                    <p className="text-xs mt-1">or click to browse • Max 50MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </label>
        </TabsContent>

        {/* Files Upload */}
        <TabsContent value="files" className="mt-4">
          <label
            htmlFor="files-upload"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center w-full h-52 rounded-xl border-2 border-dashed transition-all cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : selectedFiles.length > 0
                ? "border-green-500 bg-green-500/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <input
              id="files-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesSelect}
            />
            {selectedFiles.length > 0 ? (
              <div className="flex flex-col items-center gap-2 text-green-600">
                <CheckCircle2 className="w-10 h-10" />
                <p className="font-medium text-sm">{selectedFiles.length} files selected</p>
                <button
                  onClick={(e) => { e.preventDefault(); setSelectedFiles([]); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted">
                  <Files className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-foreground">Drop files here</p>
                  <p className="text-xs mt-1">or click to browse • Multiple files supported</p>
                </div>
              </div>
            )}
          </label>
        </TabsContent>

        {/* GitHub */}
        <TabsContent value="github" className="mt-4">
          <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-foreground/5">
                <GithubIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Import from GitHub</p>
                <p className="text-xs text-muted-foreground">Public repositories only</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={(e) => { setGithubUrl(e.target.value); setGithubInfo(null); }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={validateGithubUrl}
                  disabled={!githubUrl || isValidatingGithub}
                  size="sm"
                >
                  {isValidatingGithub ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Validate"
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {githubInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <div className="text-xs">
                      <span className="font-medium">{githubInfo.name}</span>
                      {githubInfo.language && <span className="text-muted-foreground ml-2">{githubInfo.language}</span>}
                      <span className="text-muted-foreground ml-2">⭐ {githubInfo.stars}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate}
        size="lg"
        className="w-full gradient-primary text-white border-0 hover:opacity-90 gap-2 text-base"
        id="generate-docs-btn"
      >
        <Sparkles className="w-5 h-5" />
        Generate Documentation
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Free plan: 5 generations/day • Files are processed securely and never stored permanently
      </p>
    </div>
  );
}
