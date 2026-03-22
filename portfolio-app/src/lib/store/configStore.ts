'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import type { SiteConfig, Section, AboutCard, Stat, SkillCard, Skill, Experience, Education, Project, Social, SiteSettings } from '@/types/config';

interface ConfigState {
  config: SiteConfig | null;
  isDirty: boolean;

  // Setters
  setConfig: (config: SiteConfig) => void;
  updateSettings: (settings: Partial<SiteSettings>) => void;
  updateHero: (hero: Partial<SiteSettings>) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  reorderSections: (sections: Section[]) => void;
  updateAboutCard: (id: number, updates: Partial<AboutCard>) => void;
  addAboutCard: (card: AboutCard) => void;
  removeAboutCard: (id: number) => void;
  updateStat: (id: number, updates: Partial<Stat>) => void;
  updateSkillCard: (id: number, updates: Partial<SkillCard>) => void;
  updateSkill: (skillId: number, updates: Partial<Skill>) => void;
  updateExperience: (id: number, updates: Partial<Experience>) => void;
  updateEducation: (id: number, updates: Partial<Education>) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  addProject: (project: Project) => void;
  removeProject: (id: number) => void;
  updateSocial: (id: number, updates: Partial<Social>) => void;
  markClean: () => void;
}

export const useConfigStore = create<ConfigState>()(
  temporal(
    (set) => ({
      config: null,
      isDirty: false,

      setConfig: (config) => set({ config, isDirty: false }),
      markClean: () => set({ isDirty: false }),

      updateSettings: (settings) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: { ...s.config, settings: { ...s.config.settings, ...settings } },
        }) : s),

      updateHero: (hero) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: { ...s.config, settings: { ...s.config.settings, ...hero } },
        }) : s),

      updateSection: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            sections: s.config.sections.map((sec) => sec.id === id ? { ...sec, ...updates } : sec),
          },
        }) : s),

      reorderSections: (sections) =>
        set((s) => s.config ? ({ isDirty: true, config: { ...s.config, sections } }) : s),

      updateAboutCard: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            about: {
              ...s.config.about,
              cards: s.config.about.cards.map((c) => c.id === id ? { ...c, ...updates } : c),
            },
          },
        }) : s),

      addAboutCard: (card) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: { ...s.config, about: { ...s.config.about, cards: [...s.config.about.cards, card] } },
        }) : s),

      removeAboutCard: (id) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: { ...s.config, about: { ...s.config.about, cards: s.config.about.cards.filter((c) => c.id !== id) } },
        }) : s),

      updateStat: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            about: {
              ...s.config.about,
              stats: s.config.about.stats.map((st) => st.id === id ? { ...st, ...updates } : st),
            },
          },
        }) : s),

      updateSkillCard: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            skills: s.config.skills.map((sk) => sk.id === id ? { ...sk, ...updates } : sk),
          },
        }) : s),

      updateSkill: (skillId, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            skills: s.config.skills.map((card) => ({
              ...card,
              categories: card.categories.map((cat) => ({
                ...cat,
                skills: cat.skills.map((sk) => sk.id === skillId ? { ...sk, ...updates } : sk),
              })),
            })),
          },
        }) : s),

      updateExperience: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            experiences: s.config.experiences.map((e) => e.id === id ? { ...e, ...updates } : e),
          },
        }) : s),

      updateEducation: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            education: s.config.education.map((e) => e.id === id ? { ...e, ...updates } : e),
          },
        }) : s),

      updateProject: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            projects: s.config.projects.map((p) => p.id === id ? { ...p, ...updates } : p),
          },
        }) : s),

      addProject: (project) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: { ...s.config, projects: [...s.config.projects, project] },
        }) : s),

      removeProject: (id) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: { ...s.config, projects: s.config.projects.filter((p) => p.id !== id) },
        }) : s),

      updateSocial: (id, updates) =>
        set((s) => s.config ? ({
          isDirty: true,
          config: {
            ...s.config,
            socials: s.config.socials.map((so) => so.id === id ? { ...so, ...updates } : so),
          },
        }) : s),
    }),
    { limit: 50 }
  )
);
