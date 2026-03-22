// ============================================================
// Preset System — Layout variants for each section type
// ============================================================

export type HeroPreset = 'centered' | 'split' | 'minimal' | 'fullscreen' | 'video';
export type AboutPreset = 'cards-grid' | 'cards-masonry' | 'timeline' | 'stats-focus' | 'biography';
export type ProjectsPreset = 'grid' | 'masonry' | 'carousel' | 'featured' | 'case-study' | 'list';
export type ContactPreset = 'simple' | 'split-map' | 'minimal-info' | 'full';
export type FooterPreset = 'simple' | 'multi-column' | 'social-focused' | 'enterprise';
export type NavPreset = 'top-navbar' | 'sticky-header' | 'transparent-header' | 'sidebar';

export interface PresetDefinition {
  id: string;
  label: string;
  description: string;
  thumbnail: string;   // SVG data URI for preview
  sectionType: string;
}

export const HERO_PRESETS: PresetDefinition[] = [
  {
    id: 'centered',
    label: 'Centered',
    description: 'Text centered with background image',
    thumbnail: 'hero-centered',
    sectionType: 'hero',
  },
  {
    id: 'split',
    label: 'Split',
    description: 'Image left, text right layout',
    thumbnail: 'hero-split',
    sectionType: 'hero',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean text-only hero',
    thumbnail: 'hero-minimal',
    sectionType: 'hero',
  },
  {
    id: 'fullscreen',
    label: 'Fullscreen',
    description: 'Full viewport with large CTA',
    thumbnail: 'hero-fullscreen',
    sectionType: 'hero',
  },
  {
    id: 'video',
    label: 'Video BG',
    description: 'Video background with overlay text',
    thumbnail: 'hero-video',
    sectionType: 'hero',
  },
];

export const ABOUT_PRESETS: PresetDefinition[] = [
  { id: 'cards-grid', label: 'Cards Grid', description: 'Info cards in a grid', thumbnail: 'about-grid', sectionType: 'about' },
  { id: 'cards-masonry', label: 'Masonry', description: 'Masonry card layout', thumbnail: 'about-masonry', sectionType: 'about' },
  { id: 'timeline', label: 'Timeline', description: 'Vertical timeline story', thumbnail: 'about-timeline', sectionType: 'about' },
  { id: 'stats-focus', label: 'Stats Focus', description: 'Numbers and stats highlighted', thumbnail: 'about-stats', sectionType: 'about' },
  { id: 'biography', label: 'Biography', description: 'Long-form biography block', thumbnail: 'about-bio', sectionType: 'about' },
];

export const PROJECTS_PRESETS: PresetDefinition[] = [
  { id: 'grid', label: 'Grid Cards', description: 'Uniform card grid', thumbnail: 'proj-grid', sectionType: 'projects' },
  { id: 'masonry', label: 'Masonry', description: 'Pinterest-style masonry', thumbnail: 'proj-masonry', sectionType: 'projects' },
  { id: 'carousel', label: 'Carousel', description: 'Horizontal scroll carousel', thumbnail: 'proj-carousel', sectionType: 'projects' },
  { id: 'featured', label: 'Featured', description: 'One featured + grid', thumbnail: 'proj-featured', sectionType: 'projects' },
  { id: 'case-study', label: 'Case Study', description: 'Rich case study layout', thumbnail: 'proj-case', sectionType: 'projects' },
  { id: 'list', label: 'List', description: 'Horizontal list rows', thumbnail: 'proj-list', sectionType: 'projects' },
];

export const ALL_PRESETS = [
  ...HERO_PRESETS,
  ...ABOUT_PRESETS,
  ...PROJECTS_PRESETS,
];
