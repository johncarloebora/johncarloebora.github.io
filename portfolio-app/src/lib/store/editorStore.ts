'use client';

import { create } from 'zustand';

type PanelView = 'sections' | 'settings' | 'media';
type PreviewViewport = 'mobile' | 'tablet' | 'desktop';

interface EditorState {
  activeSection: string | null;
  panelView: PanelView;
  rightPanelOpen: boolean;
  leftPanelOpen: boolean;
  previewViewport: PreviewViewport;
  isSaving: boolean;
  isPublishing: boolean;

  setActiveSection: (id: string | null) => void;
  setPanelView: (view: PanelView) => void;
  setRightPanelOpen: (open: boolean) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setPreviewViewport: (v: PreviewViewport) => void;
  setIsSaving: (v: boolean) => void;
  setIsPublishing: (v: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeSection: null,
  panelView: 'sections',
  rightPanelOpen: true,
  leftPanelOpen: true,
  previewViewport: 'desktop',
  isSaving: false,
  isPublishing: false,

  setActiveSection: (id) => set({ activeSection: id }),
  setPanelView: (view) => set({ panelView: view }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setPreviewViewport: (v) => set({ previewViewport: v }),
  setIsSaving: (v) => set({ isSaving: v }),
  setIsPublishing: (v) => set({ isPublishing: v }),
}));
