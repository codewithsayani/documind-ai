import { create } from "zustand";
import { Project, UploadProgress } from "@/types";

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  uploadProgress: UploadProgress | null;
  isGenerating: boolean;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setSelectedProject: (project: Project | null) => void;
  setUploadProgress: (progress: UploadProgress | null) => void;
  setIsGenerating: (generating: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  uploadProgress: null,
  isGenerating: false,
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
