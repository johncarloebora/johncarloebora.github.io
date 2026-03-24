-- ============================================================
-- Carlo Portfolio Admin - Seed Data
-- Extracted from current hardcoded index.html
-- ============================================================

-- Site Settings
INSERT OR REPLACE INTO site_settings (key, value) VALUES
('heroEyebrow', '"Hello, I''m"'),
('heroName', '"Carlo"'),
('heroGlitchText', '"Carlo"'),
('heroSubtitle', '"Computer Engineer"'),
('heroDesc', '"Multidisciplinary Creative — Design, Data & Automation"'),
('typewriterPhrases', '["Computer Engineer","Service Delivery Associate","Layout Artist","Tech Support Specialist","Automation Enthusiast"]'),
('ctaPrimaryText', '"View My Work"'),
('ctaPrimaryLink', '"#projects"'),
('ctaSecondaryText', '"About Me"'),
('ctaSecondaryLink', '"#about"'),
('profileShape', '"hexagon"'),
('footerText', '"© 2025 John Carlo Ebora. All rights reserved."'),
('emailjsServiceId', '"service_ansc2g4"'),
('emailjsTemplateId', '"template_g5u73sh"'),
('emailjsPublicKey', '"l9FengsYbeILidGxh"'),
('recaptchaSiteKey', '"6LddatMqAAAAAO7DrLyWHzQ8DQ1U5Vv5Okvf9_8d"'),
('navLogo', '"CE"');

-- Sections
INSERT OR REPLACE INTO sections (id, title, nav_icon, nav_label, sort_order, visible, type) VALUES
('home',       'Home',                        'fas fa-home',           'Home',       0, 1, 'builtin'),
('about',      'About Me',                    'fas fa-user',           'About',      1, 1, 'builtin'),
('skills',     'Skills & Expertise',          'fas fa-code',           'Skills',     2, 1, 'builtin'),
('experience', 'Professional Experience',     'fas fa-briefcase',      'Experience', 3, 1, 'builtin'),
('education',  'Education & Certifications',  'fas fa-graduation-cap', 'Education',  4, 1, 'builtin'),
('projects',   'Projects',                    'fas fa-folder-open',    'Projects',   5, 1, 'builtin'),
('socials',    'Connect with Me',             'fas fa-share-alt',      'Socials',    6, 1, 'builtin'),
('contact',    'Get In Touch',                'fas fa-envelope',       'Contact',    7, 1, 'builtin'),
('minigame',   'Quick Challenges',            'fas fa-gamepad',        'Fun Zone',   8, 0, 'builtin');

-- About Cards
INSERT INTO about_cards (title, icon, content, type, expanded, sort_order) VALUES
('Professional Summary', 'fas fa-briefcase',
 '"A driven Computer Engineering graduate with academic distinction (GWA: 1.21) currently working as a Service Delivery Associate specialising in insurance operations and document compliance. Experienced in technical support, VBA automation, network configuration, and software development with a strong foundation in customer service and data integrity."',
 'text', 1, 0),
('Personal Information', 'fas fa-user',
 '[{"icon":"fas fa-birthday-cake","text":"Age: 25"},{"icon":"fas fa-flag","text":"Nationality: Filipino"},{"icon":"fas fa-map-marker-alt","text":"Caloocan City, Metro Manila"},{"icon":"fas fa-language","text":"English & Filipino"}]',
 'info_list', 1, 1);

-- Stats
INSERT INTO stats (target, suffix, label, sort_order) VALUES
('1.21', '', 'GWA (Academic Distinction)', 0),
('3', '+', 'Years Experience', 1),
('10', '+', 'Certifications', 2);

-- Skill Cards
INSERT INTO skill_cards (id, title, icon, sort_order, expanded) VALUES
(1, 'Software Skills',            'fas fa-laptop-code',    0, 1),
(2, 'System Admin & Remote Tools','fas fa-server',         1, 0),
(3, 'Programming & Development',  'fas fa-code',           2, 0),
(4, 'Hardware & Networking',      'fas fa-network-wired',  3, 0),
(5, 'Personal Skills',            'fas fa-user-tie',       4, 0);

-- Skill Categories
INSERT INTO skill_categories (id, skill_card_id, title, icon, sort_order) VALUES
(1,  1, 'Design & Multimedia',       'fas fa-palette',       0),
(2,  1, 'Office & Productivity',     'fas fa-briefcase',     1),
(3,  2, 'Operating System Expertise', 'fas fa-desktop',       0),
(4,  2, 'Remote & Enterprise Tools', 'fas fa-globe',         1),
(5,  3, 'Languages & Scripting',     'fas fa-code',          0),
(6,  4, 'Networking',                'fas fa-network-wired', 0),
(7,  4, 'Hardware',                  'fas fa-microchip',     1),
(8,  5, 'Professional Attributes',   'fas fa-user-tie',      0);

-- Skills (Design & Multimedia)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(1, 'Adobe Photoshop',     'Advanced photo manipulation, visual design, and digital art creation.',     'fas fa-brush',        100, 0),
(1, 'Adobe Audition',      'Professional audio engineering, mixing, and multitrack editing.',           'fas fa-volume-up',     85, 1),
(1, 'Adobe Illustrator',   'Vector graphics and illustration with pen tool mastery.',                   'fas fa-bezier-curve',  80, 2),
(1, 'Adobe Premiere Pro',  'Video editing, colour grading, and timeline composition.',                  'fas fa-film',          60, 3),
(1, 'Adobe Lightroom',     'Photo organisation, colour correction, and batch processing.',              'fas fa-image',         80, 4);

-- Skills (Office & Productivity)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(2, 'Microsoft 365 Suite', 'Expert in documentation, spreadsheets, and presentation tools including advanced VBA/Macros.', 'fab fa-microsoft', 95, 0),
(2, 'Advanced Excel & VBA','Automated compliance tracking, macros, and complex formula engineering.',   'fas fa-file-excel',    90, 1),
(2, 'VS Code',             'Code editing, debugging, and development environment customisation.',       'fas fa-code',          65, 2);

-- Skills (OS Expertise)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(3, 'Windows Administration', 'System optimisation, troubleshooting, and maintenance.',               'fas fa-cogs',          95, 0),
(3, 'macOS Administration',   'Apple ecosystem management and configuration.',                         'fab fa-apple',         70, 1),
(3, 'Linux Administration',   'Command-line operations and system management.',                        'fas fa-terminal',      80, 2);

-- Skills (Remote & Enterprise)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(4, 'RustDesk / AnyDesk / TeamViewer', 'Cross-platform remote desktop access and enterprise support.',                                         'fas fa-laptop-house', 90, 0),
(4, 'ImageRight DMS',                  'Enterprise document management — indexing 1,500+ insurance policies monthly with 99% accuracy.',        'fas fa-file-alt',     88, 1),
(4, 'SharePoint',                      'Document triage, routing, and automated file management workflows.',                                    'fab fa-microsoft',    82, 2);

-- Skills (Languages & Scripting)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(5, 'HTML / CSS',         'Structured semantic markup and responsive styling.',                       'fab fa-html5',   70, 0),
(5, 'JavaScript',         'Interactive web functionality and DOM manipulation.',                      'fab fa-js',      55, 1),
(5, 'Python',             'Scripting, automation, and fundamental programming concepts.',             'fab fa-python',  60, 2),
(5, 'C++',                'Fundamental programming concepts and algorithms.',                         'fas fa-code',    60, 3),
(5, 'SQL / VBA Macros',   'Database queries and Excel automation for compliance workflows.',          'fas fa-table',   75, 4);

-- Skills (Networking)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(6, 'Network Administration', 'IPv4 configuration, DNS management, and troubleshooting.',            'fas fa-network-wired', 75, 0),
(6, 'Network Hardware',       'Configuration of modems, routers, and switches.',                      'fas fa-plug',          60, 1);

-- Skills (Hardware)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(7, 'Computer Assembly & Maintenance', 'Building, upgrading, and troubleshooting at component level.', 'fas fa-tools',      90, 0),
(7, 'Microcontrollers',                'Arduino and Raspberry Pi programming and implementation.',      'fas fa-microchip',  80, 1);

-- Skills (Personal)
INSERT INTO skills (category_id, name, description, icon, proficiency, sort_order) VALUES
(8, 'Problem Solving',               'Analytical thinking and systematic approach to complex challenges.',                           'fas fa-tasks',      95, 0),
(8, 'Team Collaboration',            'Effective communication and coordination in group projects.',                                  'fas fa-users',      90, 1),
(8, 'AI Integration',                'Efficient prompt engineering and AI tool utilisation.',                                        'fas fa-robot',      85, 2),
(8, 'Documentation & Compliance',    'Insurance policy processing, regulatory documentation, and quality assurance.',                'fas fa-shield-alt', 88, 3);

-- Experiences
INSERT INTO experiences (date_range, title, badge, company, bullets, sort_order, expanded) VALUES
('June 2025 – March 2026', 'Service Delivery Associate', 'Current',
 'ResourcePro Philippines — Insurance Operations Analyst · Senior Specialist',
 '["Specialised in surplus lines insurance documentation and compliance workflows, ensuring adherence to multi-state regulatory requirements","Managed end-to-end document lifecycle using ImageRight DMS — indexing 1,500+ insurance policies monthly with 99% accuracy","Executed complex tax filing operations: extracting insured data from broker-processed documents, performing surplus lines tax calculations and reconciliations","Administered automated document triage across ImageRight, Email MSG, and SharePoint — validating and routing 90+ files daily with zero misclassification errors","Engineered Excel-based compliance tracking solution using VBA, reducing manual processing time by 40%","Earned Senior Specialist certification ahead of schedule, processing 50% above standard volume benchmarks"]',
 0, 1),
('April 2022 – October 2022', 'Customer Service Advisor I', NULL,
 'Concentrix Ortigas Megamall — Technical Support / Sales (AT&T)',
 '["Provided comprehensive technical support for AT&T mobility accounts, resolving smartphone, GSM network, and billing queries with 90% first-contact resolution","Increased postpaid plan sales by 10% through personalised customer needs assessment and product expertise","Reduced billing errors by implementing systematic verification protocols, improving invoice accuracy by 15%"]',
 1, 0),
('July 2023 – September 2023', 'IT Assistant (Internship)', NULL,
 'AMA Computer College Caloocan — 240 Hours',
 '["Led technical software and hardware support for staff, reducing system downtime by 25%","Built and configured local network infrastructure for campus-wide internet access","Deployed Windows 10 and macOS on 20+ workstations; developed systematic printer troubleshooting, reducing repair time by 30%"]',
 2, 0);

-- Education
INSERT INTO education (card_title, card_icon, entries, sort_order) VALUES
('Academic Background', 'fas fa-graduation-cap',
 '[{"title":"AMA Computer College Caloocan","date":"2019 – 2024","lines":["Bachelor of Science in Computer Engineering","Academic Distinction — GWA: 1.21"]},{"title":"AMA Computer College Caloocan","date":"2017 – 2019","lines":["Senior High School — ICT","Major in Animation Visual Graphics Design NC III","Graduated With Honors"]}]',
 0),
('Certifications', 'fas fa-certificate',
 '[{"title":"Cisco Certifications","lines":["Introduction to Packet Tracer","CPP: Advanced Programming in C++","CCNAv7: Introduction to Networks","Network Security","CPA: Programming Essentials in C++"]},{"title":"Other Certifications","lines":["Great Learning Academy: Azure Course","DataCamp: Introduction to SQL","DataCamp: Introduction to Python"]}]',
 1);

-- Projects
INSERT INTO projects (title, description, thumbnail_path, gallery_type, gallery_folder, tags, sort_order) VALUES
('Layout Gallery',
 'Series of layout and photography showcasing talent and skills in compositions.',
 'layout/Compiled Album Art Taylor Swift.jpg',
 'image', 'layout',
 '["Layouts","Thumbnails","Album Arts"]',
 0),
('Video Compositions',
 'Video composition projects currently in production. Click to check the gallery.',
 'thumbnail/Coming Soon.gif',
 'video', 'videos',
 '["Video Compositions"]',
 1);

-- Socials
INSERT INTO socials (platform, url, icon, label, sort_order) VALUES
('Facebook',  'https://www.facebook.com/johncarlomendozaebora',          'fab fa-facebook',  'Facebook',     0),
('Instagram', 'https://www.instagram.com/carlo.ebora',                    'fab fa-instagram', 'Instagram',    1),
('GitHub',    'https://github.com/johncarloebora',                        'fab fa-github',    'GitHub',       2),
('X',         'https://x.com/a_crl_o',                                    'fab fa-twitter',   'X (Twitter)',  3),
('LinkedIn',  'https://www.linkedin.com/in/john-carlo-ebora-370216232/',  'fab fa-linkedin',  'LinkedIn',     4);

-- Media (existing files in git — will be migrated to R2)
INSERT OR IGNORE INTO media (folder, filename, alt_text, mime_type) VALUES
('layout', '0001.jpg',                                    '0001',                                    'image/jpeg'),
('layout', '0002.jpg',                                    '0002',                                    'image/jpeg'),
('layout', 'Back - Yosemite.jpg',                         'Back Yosemite',                           'image/jpeg'),
('layout', 'Chest - Limitless Japanese (Mugen).png',      'Chest Limitless Japanese (Mugen)',         'image/png'),
('layout', 'Compiled Album Art Taylor Swift.jpg',         'Compiled Album Art Taylor Swift',          'image/jpeg'),
('layout', 'Compiled Album Art Taylor Swift (2).jpg',     'Compiled Album Art Taylor Swift (2)',       'image/jpeg'),
('layout', 'Compiled Album Art Taylor Swift (3).jpg',     'Compiled Album Art Taylor Swift (3)',       'image/jpeg'),
('layout', 'Day to Night Copy.jpg',                       'Day to Night Copy',                        'image/jpeg'),
('layout', 'Deans Lister certificate sample.jpg',         'Deans Lister Certificate Sample',          'image/jpeg'),
('layout', 'Jacket Mock Up Design.png',                   'Jacket Mock Up Design',                    'image/png'),
('layout', 'Judales Menu.jpg',                            'Judales Menu',                             'image/jpeg'),
('layout', 'RIDERS_CHOICE_EATERY.jpg',                    'Riders Choice Eatery',                     'image/jpeg'),
('layout', 'RIDERS_CHOICE_EATERY_MENU.jpg',              'Riders Choice Eatery Menu',                'image/jpeg'),
('layout', 'Sleeves - Limitless English.png',             'Sleeves Limitless English',                'image/png'),
('layout', 'building-city-construction-1130297.jpg',      'Building City Construction',                'image/jpeg'),
('profile', 'profile.png',                                'John Carlo Ebora',                         'image/png'),
('thumbnail', 'Coming Soon.gif',                          'Coming Soon',                              'image/gif');
