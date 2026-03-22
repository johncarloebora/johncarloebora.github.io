import type { SiteConfig, Section } from '@/types/config';
import NavBar from '@/components/sections/NavBar';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import SkillsSection from '@/components/sections/SkillsSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import EducationSection from '@/components/sections/EducationSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import SocialsSection from '@/components/sections/SocialsSection';
import ContactSection from '@/components/sections/ContactSection';
import Footer from '@/components/sections/Footer';
import BgShapes from '@/components/portfolio/BgShapes';
import CustomCursor from '@/components/portfolio/CustomCursor';
import ScrollReveal from '@/components/portfolio/ScrollReveal';

interface Props {
  config: SiteConfig;
  preview?: boolean;
}

function renderSection(section: Section, config: SiteConfig, preview: boolean) {
  if (!section.visible) return null;
  const key = section.id;

  switch (section.id) {
    case 'home':
      return <HeroSection key={key} settings={config.settings} preview={preview} />;
    case 'about':
      return <AboutSection key={key} cards={config.about?.cards ?? []} stats={config.about?.stats ?? []} preview={preview} />;
    case 'skills':
      return <SkillsSection key={key} skills={config.skills ?? []} preview={preview} />;
    case 'experience':
      return <ExperienceSection key={key} experiences={config.experiences ?? []} preview={preview} />;
    case 'education':
      return <EducationSection key={key} education={config.education ?? []} preview={preview} />;
    case 'projects':
      return <ProjectsSection key={key} projects={config.projects ?? []} preview={preview} />;
    case 'socials':
      return <SocialsSection key={key} socials={config.socials ?? []} preview={preview} />;
    case 'contact':
      return <ContactSection key={key} settings={config.settings} preview={preview} />;
    default:
      return null;
  }
}

export default function PortfolioPage({ config, preview = false }: Props) {
  const visibleSections = config.sections
    .filter((s) => s.visible === 1 || s.visible === true)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      {!preview && <BgShapes />}
      {!preview && <CustomCursor />}
      {!preview && <ScrollReveal />}
      <NavBar sections={visibleSections} settings={config.settings} preview={preview} />
      <main id="main-content">
        {visibleSections.map((section) => renderSection(section, config, preview))}
      </main>
      <Footer settings={config.settings} socials={config.socials} preview={preview} />
    </>
  );
}
