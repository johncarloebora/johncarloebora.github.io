// ============================================================
// SiteConfig — matches the actual shape returned by the Worker
// GET /api/config
// ============================================================

// ── Settings (camelCase from Worker) ─────────────────────────
export interface SiteSettings {
  navLogo: string;
  heroEyebrow: string;
  heroName: string;
  heroGlitchText: string;
  heroSubtitle: string;
  heroDesc: string;
  typewriterPhrases: string[];
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  profileShape: string;
  footerText: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
  recaptchaSiteKey: string;
  profileImageUrl?: string;
  contactEmail?: string;
  themeDefault?: 'dark' | 'light';
}

// ── Section ───────────────────────────────────────────────────
export interface Section {
  id: string;           // 'home' | 'about' | 'skills' etc.
  title: string;
  nav_icon: string;
  nav_label: string;
  sort_order: number;
  visible: number | boolean;
  type: string;         // 'builtin'
  config: Record<string, unknown> | null;
}

// ── About ─────────────────────────────────────────────────────
export interface InfoListItem {
  icon: string;
  text: string;
}

export interface AboutCard {
  id: number;
  title: string;
  icon: string;
  content: string | InfoListItem[];
  type: string;
  expanded: number | boolean;
  sort_order: number;
  visible?: boolean;
  card_type?: string;
}

export interface Stat {
  id: number;
  value: string;
  label: string;
  icon: string;
  sort_order: number;
}

// ── Skills ────────────────────────────────────────────────────
export interface Skill {
  id: number;
  category_id: number;
  name: string;
  description: string;
  icon: string;
  proficiency: number;
  sort_order: number;
}

export interface SkillCategory {
  id: number;
  skill_card_id: number;
  title: string;
  icon: string;
  sort_order: number;
  skills: Skill[];
}

export interface SkillCard {
  id: number;
  title: string;
  icon: string;
  sort_order: number;
  expanded: number | boolean;
  categories: SkillCategory[];
  visible?: boolean;
  color?: string;
}

// ── Experience ────────────────────────────────────────────────
export interface Experience {
  id: number;
  date_range: string;
  title: string;
  badge?: string;
  company: string;
  description?: string | null;
  bullets: string[];
  sort_order: number;
  expanded: number | boolean;
}

// ── Education ─────────────────────────────────────────────────
export interface EducationEntry {
  title: string;
  date: string;
  lines: string[];
}

export interface Education {
  id: number;
  card_title: string;
  card_icon: string;
  entries: EducationEntry[];
  sort_order: number;
}

// ── Projects ──────────────────────────────────────────────────
export interface Project {
  id: number;
  title: string;
  description: string;
  thumbnail_path: string;
  thumbnail_url: string;
  gallery_type: string;
  gallery_folder: string;
  tags: string[];
  skills: string[];
  sort_order: number;
  visible?: boolean;
  link_url?: string;
  link_label?: string;
}

// ── Socials ───────────────────────────────────────────────────
export interface Social {
  id: number;
  platform: string;
  url: string;
  icon: string;
  label: string;
  sort_order: number;
  visible?: boolean;
  color?: string;
}

// ── Media ─────────────────────────────────────────────────────
export interface MediaItem {
  key: string;
  url: string;
  size: number;
  uploaded: string;
}

export type MediaByFolder = Record<string, MediaItem[]>;

// ── Root SiteConfig ───────────────────────────────────────────
export interface SiteConfig {
  publishedAt?: string;
  r2Base?: string;
  settings: SiteSettings;
  sections: Section[];
  about: {
    cards: AboutCard[];
    stats: Stat[];
  };
  skills: SkillCard[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  socials: Social[];
  media: MediaByFolder;
}
