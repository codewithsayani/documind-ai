import { create } from "zustand";
import { Documentation } from "@/types";

interface EditorState {
  content: string;
  originalContent: string;
  isDirty: boolean;
  isSaving: boolean;
  isPreview: boolean;
  wordCount: number;
  documentation: Documentation | null;
  setContent: (content: string) => void;
  setOriginalContent: (content: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setIsPreview: (preview: boolean) => void;
  setWordCount: (count: number) => void;
  setDocumentation: (doc: Documentation | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: "",
  originalContent: "",
  isDirty: false,
  isSaving: false,
  isPreview: false,
  wordCount: 0,
  documentation: null,
  setContent: (content) =>
    set((state) => ({
      content,
      isDirty: content !== state.originalContent,
    })),
  setOriginalContent: (originalContent) => set({ originalContent }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsPreview: (isPreview) => set({ isPreview }),
  setWordCount: (wordCount) => set({ wordCount }),
  setDocumentation: (documentation) => set({ documentation }),
  reset: () =>
    set({
      content: "",
      originalContent: "",
      isDirty: false,
      isSaving: false,
      isPreview: false,
      wordCount: 0,
      documentation: null,
    }),
}));
