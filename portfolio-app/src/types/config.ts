// ============================================================
// SiteConfig — matches the shape published to R2 by the Worker
// POST /api/publish assembles this from D1 tables
// ============================================================

export type ProfileShape = 'hexagon' | 'circle' | 'square' | 'rounded' | 'diamond' | 'shield';
export type GalleryType = 'images' | 'videos';
export type SectionType =
  | 'hero' | 'about' | 'skills' | 'experience'
  | 'education' | 'projects' | 'socials' | 'contact';

// ── Settings ─────────────────────────────────────────────────
export interface SiteSettings {
  nav_logo: string;
  hero_eyebrow: string;
  footer_text: string;
  profile_shape: ProfileShape;
  theme_default: 'dark' | 'light';
  contact_email: string;
  recaptcha_site_key: string;
  emailjs_service_id: string;
  emailjs_template_id: string;
  emailjs_public_key: string;
}

// ── Sections ─────────────────────────────────────────────────
export interface Section {
  id: number;
  type: SectionType;
  nav_label: string;
  nav_icon: string;
  visible: boolean;
  sort_order: number;
  config: Record<string, unknown>;
}

// ── Hero ─────────────────────────────────────────────────────
export interface HeroConfig {
  preset: 'centered' | 'split' | 'minimal' | 'fullscreen' | 'video';
  name: string;
  glitch_text: string;
  subtitle: string[];          // typewriter phrases
  description: string;
  cta_primary_text: string;
  cta_primary_href: string;
  cta_secondary_text: string;
  cta_secondary_href: string;
  profile_image: string;
}

// ── About ─────────────────────────────────────────────────────
export interface AboutCard {
  id: number;
  title: string;
  content: string;
  icon: string;
  card_type: 'text' | 'info_list';
  sort_order: number;
  visible: boolean;
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
  name: string;
  icon: string;
  proficiency: number;       // 0-100
  sort_order: number;
}

export interface SkillCategory {
  id: number;
  name: string;
  sort_order: number;
  skills: Skill[];
}

export interface SkillCard {
  id: number;
  title: string;
  icon: string;
  color: string;
  sort_order: number;
  visible: boolean;
  categories: SkillCategory[];
}

// ── Experience ────────────────────────────────────────────────
export interface Experience {
  id: number;
  title: string;
  company: string;
  date_range: string;
  location: string;
  type: string;
  bullets: string[];
  sort_order: number;
}

// ── Education ─────────────────────────────────────────────────
export interface EducationEntry {
  id: number;
  line: string;
  sort_order: number;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  date_range: string;
  icon: string;
  color: string;
  entries: EducationEntry[];
  sort_order: number;
}

// ── Projects ──────────────────────────────────────────────────
export interface Project {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  gallery_folder: string;
  gallery_type: GalleryType;
  tags: string[];
  skills: string[];
  link_url: string;
  link_label: string;
  sort_order: number;
  visible: boolean;
}

// ── Socials ───────────────────────────────────────────────────
export interface Social {
  id: number;
  platform: string;
  url: string;
  icon: string;
  label: string;
  color: string;
  sort_order: number;
  visible: boolean;
}

// ── Media ─────────────────────────────────────────────────────
export interface MediaItem {
  id: number;
  folder: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
  alt_text: string;
  uploaded_at: string;
}

export type MediaByFolder = Record<string, MediaItem[]>;

// ── Root SiteConfig ───────────────────────────────────────────
export interface SiteConfig {
  settings: SiteSettings;
  sections: Section[];
  hero: HeroConfig;
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
  published_at: string;
}
