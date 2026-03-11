-- ══════════════════════════════════════
-- Certification Expansion
-- ══════════════════════════════════════

-- CompTIA A+ (220-1101 & 220-1102)
INSERT INTO certifications (id, name, short_name, slug, description, icon_emoji, color_hex, exam_fee_usd, avg_salary_bump_usd, exam_duration_minutes, passing_score, max_score, total_questions_on_exam, provider_name, provider_url, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'CompTIA A+ Core Series',
  'A+',
  'comptia-a-plus',
  'The CompTIA A+ certification validates foundational IT skills across hardware, software, networking, and troubleshooting. It is the industry standard for establishing an IT career.',
  '🖥️',
  '#3498db',
  25200,
  800000,
  90,
  675,
  900,
  90,
  'CompTIA',
  'https://www.comptia.org/certifications/a',
  2
);

-- CompTIA Network+ (N10-009)
INSERT INTO certifications (id, name, short_name, slug, description, icon_emoji, color_hex, exam_fee_usd, avg_salary_bump_usd, exam_duration_minutes, passing_score, max_score, total_questions_on_exam, provider_name, provider_url, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'CompTIA Network+ N10-009',
  'Network+',
  'comptia-network-plus',
  'CompTIA Network+ validates the essential skills needed to confidently design, configure, manage, and troubleshoot wired and wireless networks.',
  '🌐',
  '#2ecc71',
  39200,
  1000000,
  90,
  720,
  900,
  85,
  'CompTIA',
  'https://www.comptia.org/certifications/network',
  3
);

-- AWS Cloud Practitioner (CLF-C02)
INSERT INTO certifications (id, name, short_name, slug, description, icon_emoji, color_hex, exam_fee_usd, avg_salary_bump_usd, exam_duration_minutes, passing_score, max_score, total_questions_on_exam, provider_name, provider_url, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'AWS Certified Cloud Practitioner CLF-C02',
  'AWS Cloud Practitioner',
  'aws-cloud-practitioner',
  'AWS Cloud Practitioner validates cloud fluency and foundational AWS knowledge. Ideal for anyone in a technical, managerial, sales, purchasing, or financial role working with the AWS Cloud.',
  '☁️',
  '#ff9900',
  10000,
  1200000,
  90,
  700,
  1000,
  65,
  'Amazon Web Services',
  'https://aws.amazon.com/certification/certified-cloud-practitioner',
  4
);

-- AWS Solutions Architect Associate (SAA-C03)
INSERT INTO certifications (id, name, short_name, slug, description, icon_emoji, color_hex, exam_fee_usd, avg_salary_bump_usd, exam_duration_minutes, passing_score, max_score, total_questions_on_exam, provider_name, provider_url, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'AWS Solutions Architect Associate SAA-C03',
  'AWS SA Associate',
  'aws-solutions-architect-associate',
  'AWS Solutions Architect Associate validates the ability to design distributed systems on AWS. Covers compute, networking, storage, databases, and cost optimization for scalable architectures.',
  '🏗️',
  '#ff6600',
  15000,
  2500000,
  130,
  720,
  1000,
  65,
  'Amazon Web Services',
  'https://aws.amazon.com/certification/certified-solutions-architect-associate',
  5
);

-- CompTIA CySA+ (CS0-003)
INSERT INTO certifications (id, name, short_name, slug, description, icon_emoji, color_hex, exam_fee_usd, avg_salary_bump_usd, exam_duration_minutes, passing_score, max_score, total_questions_on_exam, provider_name, provider_url, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'CompTIA CySA+ CS0-003',
  'CySA+',
  'comptia-cysa-plus',
  'CompTIA CySA+ is a cybersecurity analyst certification that applies behavioral analytics to networks and devices to prevent, detect, and combat cybersecurity threats.',
  '🛡️',
  '#9b59b6',
  39200,
  1800000,
  165,
  750,
  900,
  85,
  'CompTIA',
  'https://www.comptia.org/certifications/cybersecurity-analyst',
  6
);

-- CompTIA Linux+ (XK0-005)
INSERT INTO certifications (id, name, short_name, slug, description, icon_emoji, color_hex, exam_fee_usd, avg_salary_bump_usd, exam_duration_minutes, passing_score, max_score, total_questions_on_exam, provider_name, provider_url, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'CompTIA Linux+ XK0-005',
  'Linux+',
  'comptia-linux-plus',
  'CompTIA Linux+ validates the competencies required of an early-career Linux system administrator. Covers system management, security, scripting, containers, automation, and troubleshooting.',
  '🐧',
  '#f39c12',
  39200,
  1100000,
  90,
  720,
  900,
  90,
  'CompTIA',
  'https://www.comptia.org/certifications/linux',
  7
);

-- ══════════════════════════════════════
-- Domains for each new certification
-- ══════════════════════════════════════

-- CompTIA A+ Domains (Core 1 + Core 2 combined)
INSERT INTO domains (id, certification_id, name, slug, description, weight_percent, display_order) VALUES
('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'Mobile Devices', 'mobile-devices', 'Install, configure, and troubleshoot mobile devices and peripherals', 15, 1),
('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Networking', 'a-plus-networking', 'Networking concepts, TCP/IP, wireless, and connectivity troubleshooting', 20, 2),
('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'Hardware', 'hardware', 'Identify, use, and connect hardware components and devices', 25, 3),
('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000002', 'Virtualization & Cloud', 'virtualization-cloud', 'Cloud computing concepts and virtualization technologies', 11, 4),
('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'Troubleshooting', 'troubleshooting', 'Troubleshoot hardware, networking, and software issues', 29, 5);

-- CompTIA Network+ Domains
INSERT INTO domains (id, certification_id, name, slug, description, weight_percent, display_order) VALUES
('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000003', 'Networking Fundamentals', 'networking-fundamentals', 'OSI model, topologies, ports, protocols, and network types', 24, 1),
('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000003', 'Network Implementation', 'network-implementation', 'Routing, switching, wireless, and network device configuration', 19, 2),
('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000003', 'Network Operations', 'network-operations', 'Monitoring, optimization, high availability, and documentation', 16, 3),
('d0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000003', 'Network Security', 'net-plus-security', 'Common attacks, hardening, remote access, and physical security', 19, 4),
('d0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000003', 'Network Troubleshooting', 'network-troubleshooting', 'Network troubleshooting methodology, tools, and common issues', 22, 5);

-- AWS Cloud Practitioner Domains
INSERT INTO domains (id, certification_id, name, slug, description, weight_percent, display_order) VALUES
('d0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000004', 'Cloud Concepts', 'cloud-concepts', 'Cloud value proposition, AWS infrastructure, and design principles', 24, 1),
('d0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000004', 'Security & Compliance', 'aws-security-compliance', 'AWS shared responsibility model, IAM, and compliance programs', 30, 2),
('d0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000004', 'Cloud Technology & Services', 'cloud-technology-services', 'AWS core services: compute, storage, networking, and databases', 34, 3),
('d0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000004', 'Billing, Pricing & Support', 'billing-pricing-support', 'AWS pricing models, billing tools, and support plans', 12, 4);

-- AWS Solutions Architect Associate Domains
INSERT INTO domains (id, certification_id, name, slug, description, weight_percent, display_order) VALUES
('d0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000005', 'Secure Architectures', 'secure-architectures', 'Design secure access, application tiers, and data security', 30, 1),
('d0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000005', 'Resilient Architectures', 'resilient-architectures', 'Multi-tier architectures, high availability, and decoupling', 26, 2),
('d0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000005', 'High-Performing Architectures', 'high-performing-architectures', 'Elastic compute, storage, networking, and database solutions', 24, 3),
('d0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000005', 'Cost-Optimized Architectures', 'cost-optimized-architectures', 'Cost-effective storage, compute, database, and network solutions', 20, 4);

-- CompTIA CySA+ Domains
INSERT INTO domains (id, certification_id, name, slug, description, weight_percent, display_order) VALUES
('d0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000006', 'Security Operations', 'cysa-security-operations', 'System and network architecture, identity management, tools', 33, 1),
('d0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000006', 'Vulnerability Management', 'cysa-vulnerability-management', 'Vulnerability scanning, analysis, and remediation', 30, 2),
('d0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000006', 'Incident Response', 'cysa-incident-response', 'Incident response process, indicators, and digital forensics', 20, 3),
('d0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000006', 'Reporting & Communication', 'cysa-reporting-communication', 'Vulnerability reporting, metrics, and stakeholder communication', 17, 4);

-- CompTIA Linux+ Domains
INSERT INTO domains (id, certification_id, name, slug, description, weight_percent, display_order) VALUES
('d0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000007', 'System Management', 'linux-system-management', 'Manage software, storage, processes, and services in Linux', 32, 1),
('d0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000007', 'Security', 'linux-security', 'Linux security best practices, permissions, firewall, and SELinux', 21, 2),
('d0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000007', 'Scripting, Containers & Automation', 'scripting-containers-automation', 'Shell scripting, container basics, version control, and orchestration', 19, 3),
('d0000000-0000-0000-0000-000000000063', 'a0000000-0000-0000-0000-000000000007', 'Troubleshooting', 'linux-troubleshooting', 'Analyze and troubleshoot Linux storage, network, CPU, and memory', 28, 4);

-- ══════════════════════════════════════
-- Expand Career Path Milestones
-- ══════════════════════════════════════

-- Path 1: IT Helpdesk → Security Engineer (A+, Network+, Security+, CySA+)
INSERT INTO career_path_milestones (career_path_id, certification_id, milestone_order, projected_salary_usd, salary_bump_usd) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 0, 4500000, 300000),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 2, 6800000, 1300000),
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 3, 9500000, 2700000);

-- Path 2: Career Changer → Cloud Engineer (A+, AWS CP, AWS SAA, Network+)
INSERT INTO career_path_milestones (career_path_id, certification_id, milestone_order, projected_salary_usd, salary_bump_usd) VALUES
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 1, 4200000, 400000),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 3, 6500000, 1500000),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 4, 9000000, 2500000),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 5, 10500000, 1500000);

-- Path 3: Junior IT → Cybersecurity Analyst (A+, Network+, Security+, CySA+)
INSERT INTO career_path_milestones (career_path_id, certification_id, milestone_order, projected_salary_usd, salary_bump_usd) VALUES
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 0, 4300000, 300000),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 2, 6000000, 800000),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006', 3, 8500000, 2500000);

-- ══════════════════════════════════════
-- Seed questions for new certifications (10 per cert)
-- ══════════════════════════════════════

-- CompTIA A+ Questions
INSERT INTO questions (certification_id, domain_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, tags, source) VALUES
('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000012',
 'Which component stores the BIOS/UEFI settings and is powered by a small battery on the motherboard?',
 'multiple_choice',
 '[{"id":"a","text":"RAM"},{"id":"b","text":"CMOS"},{"id":"c","text":"CPU cache"},{"id":"d","text":"SSD controller"}]',
 ARRAY['b'],
 'The CMOS (Complementary Metal-Oxide Semiconductor) chip stores BIOS/UEFI settings. It is powered by a small CR2032 battery on the motherboard to retain settings when the computer is off.',
 1, ARRAY['hardware', 'cmos', 'bios'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000012',
 'A user reports their desktop display is flickering. Which of the following should a technician check FIRST?',
 'multiple_choice',
 '[{"id":"a","text":"Replace the motherboard"},{"id":"b","text":"Check the video cable connection"},{"id":"c","text":"Reinstall the operating system"},{"id":"d","text":"Replace the power supply"}]',
 ARRAY['b'],
 'When troubleshooting display issues, always start with the simplest solution. A loose or damaged video cable is the most common cause of display flickering and should be checked first before replacing components.',
 1, ARRAY['troubleshooting', 'display', 'hardware'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000011',
 'Which protocol is used to automatically assign IP addresses to devices on a network?',
 'multiple_choice',
 '[{"id":"a","text":"DNS"},{"id":"b","text":"DHCP"},{"id":"c","text":"SMTP"},{"id":"d","text":"FTP"}]',
 ARRAY['b'],
 'DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses and other network configuration parameters to devices. This eliminates the need for manual IP configuration on each device.',
 1, ARRAY['networking', 'dhcp', 'protocols'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000011',
 'Which of the following uses port 443 by default?',
 'multiple_choice',
 '[{"id":"a","text":"HTTP"},{"id":"b","text":"FTP"},{"id":"c","text":"HTTPS"},{"id":"d","text":"Telnet"}]',
 ARRAY['c'],
 'HTTPS (HTTP Secure) uses port 443 by default. It encrypts web traffic using TLS/SSL. HTTP uses port 80, FTP uses ports 20/21, and Telnet uses port 23.',
 1, ARRAY['networking', 'ports', 'https'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000010',
 'A user''s smartphone battery is draining rapidly. Which of the following is the MOST likely cause?',
 'multiple_choice',
 '[{"id":"a","text":"The screen resolution is too high"},{"id":"b","text":"Multiple background apps and location services are running"},{"id":"c","text":"The phone case is too thick"},{"id":"d","text":"The SIM card is outdated"}]',
 ARRAY['b'],
 'Background apps and location services are the most common cause of rapid battery drain on mobile devices. Closing unnecessary apps and disabling location services when not needed can significantly improve battery life.',
 2, ARRAY['mobile', 'battery', 'troubleshooting'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000013',
 'Which of the following cloud service models provides virtual machines and infrastructure?',
 'multiple_choice',
 '[{"id":"a","text":"SaaS"},{"id":"b","text":"PaaS"},{"id":"c","text":"IaaS"},{"id":"d","text":"DaaS"}]',
 ARRAY['c'],
 'IaaS (Infrastructure as a Service) provides virtualized computing resources including VMs, storage, and networking. Examples include AWS EC2 and Azure Virtual Machines. The customer manages the OS and applications.',
 2, ARRAY['cloud', 'iaas', 'virtualization'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000014',
 'A laptop will not power on. The power LED does not illuminate. Which should be checked FIRST?',
 'multiple_choice',
 '[{"id":"a","text":"Replace the hard drive"},{"id":"b","text":"Verify the AC adapter is connected and working"},{"id":"c","text":"Reseat the RAM modules"},{"id":"d","text":"Update the BIOS"}]',
 ARRAY['b'],
 'When a laptop shows no sign of power (no LED), the AC adapter and power source should be verified first. This follows the troubleshooting principle of checking the simplest, most likely cause before investigating hardware.',
 1, ARRAY['troubleshooting', 'power', 'laptop'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000012',
 'What is the maximum data transfer speed of USB 3.0?',
 'multiple_choice',
 '[{"id":"a","text":"480 Mbps"},{"id":"b","text":"5 Gbps"},{"id":"c","text":"10 Gbps"},{"id":"d","text":"1 Gbps"}]',
 ARRAY['b'],
 'USB 3.0 (SuperSpeed) supports up to 5 Gbps. USB 2.0 supports 480 Mbps, USB 3.1 Gen 2 supports 10 Gbps, and USB 3.2 Gen 2x2 supports 20 Gbps.',
 2, ARRAY['hardware', 'usb', 'connectors'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000014',
 'A user is getting a "No boot device found" error. Which of the following is the MOST likely cause?',
 'multiple_choice',
 '[{"id":"a","text":"The display driver is outdated"},{"id":"b","text":"The boot order in BIOS is incorrect or the drive has failed"},{"id":"c","text":"The network cable is disconnected"},{"id":"d","text":"The CPU is overheating"}]',
 ARRAY['b'],
 'A "No boot device found" error typically means the BIOS cannot find a bootable drive. This is usually caused by an incorrect boot order in BIOS settings or a failed/disconnected storage drive.',
 2, ARRAY['troubleshooting', 'boot', 'bios'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000013',
 'Which of the following hypervisors runs directly on the hardware without a host OS?',
 'multiple_choice',
 '[{"id":"a","text":"Type 2 hypervisor"},{"id":"b","text":"Type 1 hypervisor"},{"id":"c","text":"Container engine"},{"id":"d","text":"Application sandbox"}]',
 ARRAY['b'],
 'A Type 1 (bare-metal) hypervisor runs directly on the hardware without a host OS. Examples include VMware ESXi and Microsoft Hyper-V. Type 2 hypervisors like VirtualBox run on top of a host OS.',
 2, ARRAY['virtualization', 'hypervisor', 'cloud'], 'ai_generated');

-- CompTIA Network+ Questions
INSERT INTO questions (certification_id, domain_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, tags, source) VALUES
('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000020',
 'At which layer of the OSI model do routers operate?',
 'multiple_choice',
 '[{"id":"a","text":"Layer 1 - Physical"},{"id":"b","text":"Layer 2 - Data Link"},{"id":"c","text":"Layer 3 - Network"},{"id":"d","text":"Layer 4 - Transport"}]',
 ARRAY['c'],
 'Routers operate at Layer 3 (Network layer) of the OSI model. They make forwarding decisions based on IP addresses. Switches operate at Layer 2, and hubs at Layer 1.',
 1, ARRAY['osi-model', 'routers', 'networking-fundamentals'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000020',
 'Which subnet mask would create 4 subnets from a Class C network?',
 'multiple_choice',
 '[{"id":"a","text":"255.255.255.128"},{"id":"b","text":"255.255.255.192"},{"id":"c","text":"255.255.255.224"},{"id":"d","text":"255.255.255.240"}]',
 ARRAY['b'],
 'To create 4 subnets, you need 2 additional bits (2^2 = 4). Adding 2 bits to the default /24 gives /26, which is 255.255.255.192. This creates 4 subnets with 62 usable hosts each.',
 3, ARRAY['subnetting', 'ip-addressing', 'networking'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000021',
 'Which wireless standard operates exclusively on the 5 GHz band and supports up to 1.3 Gbps?',
 'multiple_choice',
 '[{"id":"a","text":"802.11n"},{"id":"b","text":"802.11ac"},{"id":"c","text":"802.11g"},{"id":"d","text":"802.11b"}]',
 ARRAY['b'],
 '802.11ac (Wi-Fi 5) operates exclusively on the 5 GHz band and supports speeds up to 1.3 Gbps with MIMO. 802.11n operates on both 2.4 and 5 GHz. 802.11g and 802.11b only use 2.4 GHz.',
 2, ARRAY['wireless', '802.11', 'wifi'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000022',
 'Which network monitoring tool captures and analyzes packets on a network?',
 'multiple_choice',
 '[{"id":"a","text":"Wireshark"},{"id":"b","text":"nslookup"},{"id":"c","text":"ipconfig"},{"id":"d","text":"traceroute"}]',
 ARRAY['a'],
 'Wireshark is a packet analyzer that captures and inspects network packets in real-time. nslookup queries DNS, ipconfig shows IP configuration, and traceroute traces the path to a destination.',
 1, ARRAY['monitoring', 'wireshark', 'tools'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000023',
 'Which network security device inspects traffic at the application layer and can block specific URLs?',
 'multiple_choice',
 '[{"id":"a","text":"Packet-filtering firewall"},{"id":"b","text":"Next-generation firewall (NGFW)"},{"id":"c","text":"Network switch"},{"id":"d","text":"Hub"}]',
 ARRAY['b'],
 'A next-generation firewall (NGFW) can inspect traffic at the application layer (Layer 7), performing deep packet inspection, URL filtering, and application awareness. Traditional packet-filtering firewalls only operate at Layers 3-4.',
 2, ARRAY['firewall', 'ngfw', 'security'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000024',
 'A user reports intermittent connectivity. The technician pings the default gateway and sees 30% packet loss. What should be checked FIRST?',
 'multiple_choice',
 '[{"id":"a","text":"DNS server configuration"},{"id":"b","text":"Physical cable connections and switch port"},{"id":"c","text":"DHCP lease time"},{"id":"d","text":"Firewall rules"}]',
 ARRAY['b'],
 'Intermittent connectivity with packet loss to the default gateway typically indicates a physical layer problem. Checking cables, connectors, and switch ports should be the first step, as physical issues are the most common cause.',
 2, ARRAY['troubleshooting', 'connectivity', 'physical-layer'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000020',
 'Which protocol provides reliable, connection-oriented data delivery?',
 'multiple_choice',
 '[{"id":"a","text":"UDP"},{"id":"b","text":"TCP"},{"id":"c","text":"ICMP"},{"id":"d","text":"ARP"}]',
 ARRAY['b'],
 'TCP (Transmission Control Protocol) is connection-oriented and provides reliable delivery through acknowledgments, sequencing, and retransmission. UDP is connectionless and does not guarantee delivery.',
 1, ARRAY['tcp', 'protocols', 'transport-layer'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000021',
 'What is the purpose of a DHCP relay agent?',
 'multiple_choice',
 '[{"id":"a","text":"To assign static IP addresses"},{"id":"b","text":"To forward DHCP requests across different subnets"},{"id":"c","text":"To cache DNS records"},{"id":"d","text":"To encrypt DHCP traffic"}]',
 ARRAY['b'],
 'A DHCP relay agent forwards DHCP broadcast requests from clients to a DHCP server on a different subnet. Since broadcasts don''t cross routers by default, the relay agent enables centralized DHCP management.',
 3, ARRAY['dhcp', 'relay', 'network-services'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000022',
 'Which SNMP version adds encryption and authentication for secure management?',
 'multiple_choice',
 '[{"id":"a","text":"SNMPv1"},{"id":"b","text":"SNMPv2c"},{"id":"c","text":"SNMPv3"},{"id":"d","text":"SNMPv2"}]',
 ARRAY['c'],
 'SNMPv3 adds authentication and encryption (privacy) to SNMP, making it the most secure version. SNMPv1 and v2c use community strings transmitted in cleartext, which is insecure.',
 2, ARRAY['snmp', 'network-management', 'security'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000024',
 'A network technician needs to find the MAC address associated with an IP address. Which command should be used?',
 'multiple_choice',
 '[{"id":"a","text":"nslookup"},{"id":"b","text":"arp -a"},{"id":"c","text":"netstat"},{"id":"d","text":"ping"}]',
 ARRAY['b'],
 'The arp -a command displays the ARP cache, which maps IP addresses to MAC addresses. nslookup resolves DNS, netstat shows network connections, and ping tests connectivity.',
 1, ARRAY['arp', 'troubleshooting', 'commands'], 'ai_generated');

-- AWS Cloud Practitioner Questions
INSERT INTO questions (certification_id, domain_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, tags, source) VALUES
('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000030',
 'Which of the following is an advantage of cloud computing over on-premises?',
 'multiple_choice',
 '[{"id":"a","text":"Complete control over physical hardware"},{"id":"b","text":"Trade capital expense (CapEx) for operational expense (OpEx)"},{"id":"c","text":"No need for any security measures"},{"id":"d","text":"Unlimited free storage"}]',
 ARRAY['b'],
 'Cloud computing allows organizations to trade upfront capital expenses (buying hardware) for variable operational expenses (paying for what you use). This provides financial flexibility and eliminates large upfront investments.',
 1, ARRAY['cloud-concepts', 'capex-opex', 'benefits'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000031',
 'Under the AWS Shared Responsibility Model, who is responsible for patching the guest operating system on EC2 instances?',
 'multiple_choice',
 '[{"id":"a","text":"AWS"},{"id":"b","text":"The customer"},{"id":"c","text":"Both AWS and the customer"},{"id":"d","text":"The internet service provider"}]',
 ARRAY['b'],
 'Under the Shared Responsibility Model, the customer is responsible for "security IN the cloud," which includes patching guest operating systems, configuring firewalls, and managing application security. AWS manages the underlying infrastructure.',
 2, ARRAY['shared-responsibility', 'security', 'ec2'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000032',
 'Which AWS service provides scalable object storage?',
 'multiple_choice',
 '[{"id":"a","text":"Amazon EBS"},{"id":"b","text":"Amazon S3"},{"id":"c","text":"Amazon RDS"},{"id":"d","text":"Amazon EC2"}]',
 ARRAY['b'],
 'Amazon S3 (Simple Storage Service) provides scalable object storage with high durability and availability. EBS provides block storage for EC2, RDS is a managed database service, and EC2 provides compute instances.',
 1, ARRAY['s3', 'storage', 'core-services'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000032',
 'Which AWS compute service runs code without provisioning or managing servers?',
 'multiple_choice',
 '[{"id":"a","text":"Amazon EC2"},{"id":"b","text":"AWS Lambda"},{"id":"c","text":"Amazon ECS"},{"id":"d","text":"AWS Elastic Beanstalk"}]',
 ARRAY['b'],
 'AWS Lambda is a serverless compute service that runs code in response to events without provisioning or managing servers. You only pay for the compute time consumed. EC2 requires managing server instances.',
 1, ARRAY['lambda', 'serverless', 'compute'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000033',
 'Which AWS tool allows you to estimate the cost of running workloads on AWS?',
 'multiple_choice',
 '[{"id":"a","text":"AWS CloudTrail"},{"id":"b","text":"AWS Pricing Calculator"},{"id":"c","text":"Amazon Inspector"},{"id":"d","text":"AWS Config"}]',
 ARRAY['b'],
 'The AWS Pricing Calculator helps estimate costs for AWS services based on your expected usage. CloudTrail logs API calls, Inspector assesses security, and Config tracks resource configurations.',
 1, ARRAY['pricing', 'billing', 'tools'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000030',
 'Which pillar of the AWS Well-Architected Framework focuses on running workloads efficiently?',
 'multiple_choice',
 '[{"id":"a","text":"Security"},{"id":"b","text":"Performance Efficiency"},{"id":"c","text":"Cost Optimization"},{"id":"d","text":"Reliability"}]',
 ARRAY['b'],
 'The Performance Efficiency pillar focuses on using computing resources efficiently to meet system requirements and maintaining that efficiency as demand changes and technologies evolve.',
 2, ARRAY['well-architected', 'performance', 'design-principles'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000031',
 'Which AWS service provides managed DDoS protection?',
 'multiple_choice',
 '[{"id":"a","text":"AWS WAF"},{"id":"b","text":"AWS Shield"},{"id":"c","text":"Amazon GuardDuty"},{"id":"d","text":"AWS KMS"}]',
 ARRAY['b'],
 'AWS Shield provides managed DDoS protection. Shield Standard is automatically included at no cost, while Shield Advanced provides enhanced protection with 24/7 DDoS response team support.',
 2, ARRAY['shield', 'ddos', 'security'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000032',
 'What does an Amazon VPC allow you to do?',
 'multiple_choice',
 '[{"id":"a","text":"Store objects in the cloud"},{"id":"b","text":"Launch AWS resources in a logically isolated virtual network"},{"id":"c","text":"Manage DNS records"},{"id":"d","text":"Monitor API calls"}]',
 ARRAY['b'],
 'Amazon VPC (Virtual Private Cloud) lets you launch AWS resources in a logically isolated virtual network that you define. You have full control over IP addressing, subnets, route tables, and network gateways.',
 1, ARRAY['vpc', 'networking', 'core-services'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000033',
 'Which AWS support plan provides access to a Technical Account Manager (TAM)?',
 'multiple_choice',
 '[{"id":"a","text":"Basic"},{"id":"b","text":"Developer"},{"id":"c","text":"Business"},{"id":"d","text":"Enterprise"}]',
 ARRAY['d'],
 'Only the Enterprise support plan includes a designated Technical Account Manager (TAM) who provides proactive guidance and advocacy. Basic and Developer plans have limited support, and Business adds 24/7 support.',
 2, ARRAY['support-plans', 'tam', 'pricing'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000030',
 'Which concept describes AWS''s ability to quickly scale resources up or down based on demand?',
 'multiple_choice',
 '[{"id":"a","text":"High availability"},{"id":"b","text":"Elasticity"},{"id":"c","text":"Fault tolerance"},{"id":"d","text":"Durability"}]',
 ARRAY['b'],
 'Elasticity is the ability to automatically scale computing resources up or down based on demand. This is a core benefit of cloud computing, ensuring you have the right amount of resources at any time.',
 1, ARRAY['elasticity', 'scaling', 'cloud-concepts'], 'ai_generated');

-- AWS Solutions Architect Associate Questions
INSERT INTO questions (certification_id, domain_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, tags, source) VALUES
('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000040',
 'A company needs to allow temporary access to an S3 bucket for a third-party auditor without creating IAM credentials. Which approach is MOST appropriate?',
 'multiple_choice',
 '[{"id":"a","text":"Create an IAM user with read-only access"},{"id":"b","text":"Generate a pre-signed URL with an expiration time"},{"id":"c","text":"Make the bucket publicly accessible temporarily"},{"id":"d","text":"Share the root account credentials"}]',
 ARRAY['b'],
 'Pre-signed URLs provide temporary, time-limited access to S3 objects without requiring IAM credentials or changing bucket policies. They expire after the specified time, making them ideal for temporary third-party access.',
 2, ARRAY['s3', 'pre-signed-url', 'security'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000040',
 'Which AWS service provides managed encryption keys and integrates with most AWS services for data encryption at rest?',
 'multiple_choice',
 '[{"id":"a","text":"AWS Shield"},{"id":"b","text":"AWS WAF"},{"id":"c","text":"AWS KMS"},{"id":"d","text":"Amazon Macie"}]',
 ARRAY['c'],
 'AWS Key Management Service (KMS) lets you create and manage encryption keys used to encrypt data across AWS services. It integrates with S3, EBS, RDS, and many other services for encryption at rest.',
 2, ARRAY['kms', 'encryption', 'security'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000040',
 'A web application needs to authenticate users and control access to API Gateway endpoints. Which service should be used?',
 'multiple_choice',
 '[{"id":"a","text":"Amazon Inspector"},{"id":"b","text":"Amazon Cognito"},{"id":"c","text":"AWS CloudTrail"},{"id":"d","text":"Amazon GuardDuty"}]',
 ARRAY['b'],
 'Amazon Cognito provides user authentication, authorization, and user management for web and mobile apps. It integrates with API Gateway to control access to API endpoints using user pools and identity pools.',
 2, ARRAY['cognito', 'authentication', 'api-gateway'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000041',
 'An application requires automatic failover across AWS Regions with minimal data loss. Which database solution BEST meets this requirement?',
 'multiple_choice',
 '[{"id":"a","text":"Amazon RDS Multi-AZ"},{"id":"b","text":"Amazon Aurora Global Database"},{"id":"c","text":"Amazon DynamoDB single-region"},{"id":"d","text":"Amazon ElastiCache"}]',
 ARRAY['b'],
 'Amazon Aurora Global Database spans multiple AWS Regions with typically less than 1 second of replication lag and supports cross-Region disaster recovery with an RPO of 1 second and RTO of less than 1 minute.',
 3, ARRAY['aurora', 'global-database', 'high-availability'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000041',
 'A company wants to decouple components of a microservices application and ensure messages are processed exactly once in order. Which service should they use?',
 'multiple_choice',
 '[{"id":"a","text":"Amazon SNS"},{"id":"b","text":"Amazon SQS Standard queue"},{"id":"c","text":"Amazon SQS FIFO queue"},{"id":"d","text":"Amazon Kinesis Data Streams"}]',
 ARRAY['c'],
 'Amazon SQS FIFO (First-In-First-Out) queues preserve the exact order of messages and guarantee exactly-once processing. Standard queues offer best-effort ordering and at-least-once delivery.',
 2, ARRAY['sqs', 'fifo', 'decoupling', 'microservices'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000041',
 'Which strategy provides the LOWEST RTO and RPO for a disaster recovery architecture?',
 'multiple_choice',
 '[{"id":"a","text":"Backup and restore"},{"id":"b","text":"Pilot light"},{"id":"c","text":"Warm standby"},{"id":"d","text":"Multi-site active/active"}]',
 ARRAY['d'],
 'Multi-site active/active runs full production workloads in multiple Regions simultaneously, providing near-zero RTO and RPO. It is the most expensive DR strategy but offers the fastest recovery.',
 3, ARRAY['disaster-recovery', 'rto', 'rpo', 'multi-site'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000042',
 'A company needs to serve static website content globally with low latency. Which combination of services should they use?',
 'multiple_choice',
 '[{"id":"a","text":"EC2 with Elastic Load Balancer"},{"id":"b","text":"S3 with CloudFront"},{"id":"c","text":"ECS with Application Load Balancer"},{"id":"d","text":"Lambda with API Gateway"}]',
 ARRAY['b'],
 'Amazon S3 hosts static website content and CloudFront is a CDN that caches content at edge locations worldwide. Together, they provide low-latency, high-performance static content delivery globally.',
 1, ARRAY['s3', 'cloudfront', 'cdn', 'static-hosting'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000042',
 'An application has unpredictable traffic patterns with sudden spikes. Which compute option will BEST handle this with minimal management?',
 'multiple_choice',
 '[{"id":"a","text":"A single large EC2 instance"},{"id":"b","text":"EC2 instances behind an Auto Scaling group"},{"id":"c","text":"AWS Lambda functions"},{"id":"d","text":"EC2 Reserved Instances"}]',
 ARRAY['c'],
 'AWS Lambda automatically scales to handle any number of concurrent requests without provisioning or managing servers. It is ideal for unpredictable workloads since you pay only for what you use with no idle costs.',
 2, ARRAY['lambda', 'serverless', 'auto-scaling'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000043',
 'A company runs a non-critical batch processing workload that can tolerate interruptions. Which EC2 purchasing option provides the GREATEST cost savings?',
 'multiple_choice',
 '[{"id":"a","text":"On-Demand Instances"},{"id":"b","text":"Reserved Instances"},{"id":"c","text":"Spot Instances"},{"id":"d","text":"Dedicated Hosts"}]',
 ARRAY['c'],
 'EC2 Spot Instances offer up to 90% discount compared to On-Demand prices. They are ideal for fault-tolerant workloads like batch processing that can handle interruptions when AWS needs the capacity back.',
 1, ARRAY['spot-instances', 'cost-optimization', 'ec2'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000043',
 'Which S3 storage class is MOST cost-effective for data that is accessed once or twice per quarter but requires millisecond retrieval?',
 'multiple_choice',
 '[{"id":"a","text":"S3 Standard"},{"id":"b","text":"S3 Standard-Infrequent Access"},{"id":"c","text":"S3 Glacier Flexible Retrieval"},{"id":"d","text":"S3 Glacier Deep Archive"}]',
 ARRAY['b'],
 'S3 Standard-Infrequent Access (S3 Standard-IA) is designed for data accessed less frequently but requires rapid access when needed. It offers millisecond retrieval at a lower storage cost than S3 Standard, with a per-GB retrieval fee.',
 2, ARRAY['s3', 'storage-classes', 'cost-optimization'], 'ai_generated');

-- CySA+ Questions
INSERT INTO questions (certification_id, domain_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, tags, source) VALUES
('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000050',
 'Which tool is used to correlate security events from multiple sources and provide centralized alerting?',
 'multiple_choice',
 '[{"id":"a","text":"Vulnerability scanner"},{"id":"b","text":"SIEM"},{"id":"c","text":"Port scanner"},{"id":"d","text":"Packet sniffer"}]',
 ARRAY['b'],
 'A SIEM (Security Information and Event Management) system collects, normalizes, and correlates log data from multiple sources to detect threats and provide centralized security monitoring and alerting.',
 2, ARRAY['siem', 'security-operations', 'monitoring'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000050',
 'An analyst notices unusual outbound traffic to a known C2 server. What type of indicator is this?',
 'multiple_choice',
 '[{"id":"a","text":"Indicator of vulnerability"},{"id":"b","text":"Indicator of compromise (IoC)"},{"id":"c","text":"Indicator of risk"},{"id":"d","text":"Indicator of compliance"}]',
 ARRAY['b'],
 'Traffic to a known command-and-control (C2) server is an Indicator of Compromise (IoC). IoCs are forensic artifacts that indicate a system has been breached, such as known malicious IPs, file hashes, or domain names.',
 2, ARRAY['ioc', 'c2', 'threat-detection'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000051',
 'Which vulnerability scanning approach uses credentials to log in to systems for deeper assessment?',
 'multiple_choice',
 '[{"id":"a","text":"Passive scanning"},{"id":"b","text":"Credentialed scanning"},{"id":"c","text":"Non-credentialed scanning"},{"id":"d","text":"Network scanning"}]',
 ARRAY['b'],
 'Credentialed (authenticated) scanning logs into systems with valid credentials to perform deeper assessments, checking installed software, configurations, and missing patches that non-credentialed scans cannot detect.',
 2, ARRAY['vulnerability-scanning', 'credentialed', 'assessment'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000051',
 'A CVSS score of 9.8 indicates:',
 'multiple_choice',
 '[{"id":"a","text":"Low severity vulnerability"},{"id":"b","text":"Medium severity vulnerability"},{"id":"c","text":"High severity vulnerability"},{"id":"d","text":"Critical severity vulnerability"}]',
 ARRAY['d'],
 'CVSS scores range from 0-10. A score of 9.8 falls in the Critical range (9.0-10.0). Critical vulnerabilities should be remediated immediately as they pose the highest risk to the organization.',
 1, ARRAY['cvss', 'vulnerability-management', 'scoring'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000052',
 'During incident response, what is the PRIMARY purpose of the containment phase?',
 'multiple_choice',
 '[{"id":"a","text":"To identify the root cause"},{"id":"b","text":"To prevent the incident from spreading while preserving evidence"},{"id":"c","text":"To restore systems to normal operation"},{"id":"d","text":"To document lessons learned"}]',
 ARRAY['b'],
 'The containment phase aims to stop the incident from spreading and causing further damage while preserving forensic evidence. This may include isolating affected systems, blocking malicious IPs, or disabling compromised accounts.',
 2, ARRAY['incident-response', 'containment', 'ir-phases'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000052',
 'Which forensic technique creates an exact bit-for-bit copy of a storage device?',
 'multiple_choice',
 '[{"id":"a","text":"File backup"},{"id":"b","text":"Disk imaging"},{"id":"c","text":"File carving"},{"id":"d","text":"Log analysis"}]',
 ARRAY['b'],
 'Disk imaging creates an exact bit-for-bit copy (forensic image) of a storage device, preserving all data including deleted files and slack space. This is essential for forensic analysis while maintaining evidence integrity.',
 2, ARRAY['forensics', 'disk-imaging', 'evidence'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000053',
 'When reporting vulnerabilities to executives, which metric is MOST important to communicate?',
 'multiple_choice',
 '[{"id":"a","text":"Total number of open ports"},{"id":"b","text":"Business risk and potential financial impact"},{"id":"c","text":"Technical CVSS scores only"},{"id":"d","text":"Number of hosts scanned"}]',
 ARRAY['b'],
 'Executives need to understand business risk and financial impact rather than technical details. Translating technical findings into business context helps leadership make informed decisions about remediation priorities.',
 3, ARRAY['reporting', 'communication', 'risk'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000053',
 'What is the purpose of a vulnerability remediation SLA?',
 'multiple_choice',
 '[{"id":"a","text":"To define how long scanning takes"},{"id":"b","text":"To set maximum timeframes for fixing vulnerabilities by severity"},{"id":"c","text":"To determine how many scanners to use"},{"id":"d","text":"To classify vulnerability types"}]',
 ARRAY['b'],
 'A remediation SLA defines the maximum acceptable timeframe for patching or mitigating vulnerabilities based on their severity. For example: Critical = 48 hours, High = 7 days, Medium = 30 days.',
 2, ARRAY['remediation', 'sla', 'vulnerability-management'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000050',
 'Which threat intelligence sharing standard uses a structured format with objects like indicators, campaigns, and threat actors?',
 'multiple_choice',
 '[{"id":"a","text":"STIX"},{"id":"b","text":"CSV"},{"id":"c","text":"PDF"},{"id":"d","text":"JSON-LD"}]',
 ARRAY['a'],
 'STIX (Structured Threat Information eXpression) is a standardized language for describing cyber threat information using structured objects like indicators, campaigns, threat actors, and attack patterns.',
 3, ARRAY['stix', 'threat-intelligence', 'standards'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000051',
 'A vulnerability scan reports a critical finding, but upon investigation, the system is not actually vulnerable. This is called:',
 'multiple_choice',
 '[{"id":"a","text":"True positive"},{"id":"b","text":"False positive"},{"id":"c","text":"True negative"},{"id":"d","text":"False negative"}]',
 ARRAY['b'],
 'A false positive occurs when a scan incorrectly reports a vulnerability that does not actually exist. Analysts must validate findings to avoid wasting remediation effort on non-issues.',
 1, ARRAY['false-positive', 'scanning', 'validation'], 'ai_generated');

-- Linux+ Questions
INSERT INTO questions (certification_id, domain_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, tags, source) VALUES
('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000060',
 'Which command displays currently running processes with their resource usage?',
 'multiple_choice',
 '[{"id":"a","text":"ls -la"},{"id":"b","text":"top"},{"id":"c","text":"df -h"},{"id":"d","text":"cat /etc/passwd"}]',
 ARRAY['b'],
 'The top command provides a dynamic, real-time view of running processes including CPU and memory usage. It is one of the most commonly used tools for monitoring system performance in Linux.',
 1, ARRAY['processes', 'top', 'system-management'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000060',
 'Which command is used to install packages on a Debian-based system?',
 'multiple_choice',
 '[{"id":"a","text":"yum install"},{"id":"b","text":"apt install"},{"id":"c","text":"rpm -i"},{"id":"d","text":"pacman -S"}]',
 ARRAY['b'],
 'apt (Advanced Package Tool) is the package manager for Debian-based distributions like Ubuntu. yum/dnf is for Red Hat-based systems, rpm is a lower-level package tool, and pacman is for Arch Linux.',
 1, ARRAY['apt', 'package-management', 'debian'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000061',
 'What does the chmod 755 command set as permissions?',
 'multiple_choice',
 '[{"id":"a","text":"Owner: read/write, Group: read, Others: none"},{"id":"b","text":"Owner: read/write/execute, Group: read/execute, Others: read/execute"},{"id":"c","text":"Owner: all, Group: all, Others: all"},{"id":"d","text":"Owner: read only, Group: read only, Others: none"}]',
 ARRAY['b'],
 'chmod 755 sets: Owner = rwx (7), Group = r-x (5), Others = r-x (5). Each digit represents read(4) + write(2) + execute(1). This is commonly used for scripts and directories.',
 2, ARRAY['chmod', 'permissions', 'security'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000061',
 'Which firewall tool is the default on most modern Linux distributions?',
 'multiple_choice',
 '[{"id":"a","text":"iptables"},{"id":"b","text":"nftables"},{"id":"c","text":"firewalld"},{"id":"d","text":"ufw"}]',
 ARRAY['b'],
 'nftables is the modern replacement for iptables and is the default packet filtering framework in current Linux kernels. firewalld and ufw are frontends that can use nftables as a backend.',
 2, ARRAY['nftables', 'firewall', 'security'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000062',
 'Which command is used to build and run multi-container Docker applications?',
 'multiple_choice',
 '[{"id":"a","text":"docker build"},{"id":"b","text":"docker-compose"},{"id":"c","text":"docker run"},{"id":"d","text":"docker pull"}]',
 ARRAY['b'],
 'docker-compose (or docker compose) is used to define and run multi-container applications using a YAML file. It manages the lifecycle of all containers defined in the compose file.',
 2, ARRAY['docker', 'containers', 'compose'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000062',
 'In a bash script, what does "#!/bin/bash" at the top of the file indicate?',
 'multiple_choice',
 '[{"id":"a","text":"A comment line"},{"id":"b","text":"The shebang line specifying the interpreter"},{"id":"c","text":"A variable assignment"},{"id":"d","text":"An error handling directive"}]',
 ARRAY['b'],
 'The shebang (#!/bin/bash) tells the system which interpreter to use to execute the script. It must be the first line of the file and specifies the absolute path to the interpreter.',
 1, ARRAY['bash', 'scripting', 'shebang'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000063',
 'A Linux server is running slowly. Which command helps identify if the disk I/O is the bottleneck?',
 'multiple_choice',
 '[{"id":"a","text":"free -m"},{"id":"b","text":"iostat"},{"id":"c","text":"whoami"},{"id":"d","text":"hostname"}]',
 ARRAY['b'],
 'iostat reports CPU and I/O statistics for devices and partitions. It shows disk read/write rates, wait times, and utilization, making it essential for diagnosing disk I/O bottlenecks.',
 2, ARRAY['iostat', 'troubleshooting', 'performance'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000063',
 'Which log file typically contains authentication-related messages on a Red Hat-based system?',
 'multiple_choice',
 '[{"id":"a","text":"/var/log/messages"},{"id":"b","text":"/var/log/secure"},{"id":"c","text":"/var/log/kern.log"},{"id":"d","text":"/var/log/boot.log"}]',
 ARRAY['b'],
 '/var/log/secure contains authentication messages on Red Hat-based systems (CentOS, RHEL, Fedora). On Debian-based systems, the equivalent is /var/log/auth.log.',
 2, ARRAY['logs', 'authentication', 'troubleshooting'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000060',
 'Which command creates a logical volume from a volume group?',
 'multiple_choice',
 '[{"id":"a","text":"pvcreate"},{"id":"b","text":"vgcreate"},{"id":"c","text":"lvcreate"},{"id":"d","text":"mkfs"}]',
 ARRAY['c'],
 'lvcreate creates a logical volume from an existing volume group. The LVM workflow is: pvcreate (physical volume) → vgcreate (volume group) → lvcreate (logical volume) → mkfs (filesystem).',
 3, ARRAY['lvm', 'storage', 'system-management'], 'ai_generated'),

('a0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000062',
 'Which git command creates a new branch and switches to it?',
 'multiple_choice',
 '[{"id":"a","text":"git branch new-branch"},{"id":"b","text":"git checkout -b new-branch"},{"id":"c","text":"git merge new-branch"},{"id":"d","text":"git clone new-branch"}]',
 ARRAY['b'],
 'git checkout -b creates a new branch and immediately switches to it. This combines git branch (create) and git checkout (switch) into a single command. The modern equivalent is git switch -c.',
 1, ARRAY['git', 'version-control', 'automation'], 'ai_generated');
