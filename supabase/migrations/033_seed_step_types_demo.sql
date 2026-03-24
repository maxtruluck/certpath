-- Seed: Step Types Demo Course
-- Showcases all lesson step types: Read, Watch, Answer, Embed, Callout
-- UUID prefix: dd for demo

-- Course
INSERT INTO courses (id, creator_id, title, slug, description, category, difficulty, status, published_at, is_free, card_color, tags)
VALUES (
  'dd000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Step Types Demo Course',
  'step-types-demo',
  'A demo course showcasing every lesson step type: Read, Watch, Answer, Embed (Image, Diagram, Math Graph), and Callout (Tip, Warning, Key Concept, Exam Note).',
  'Cybersecurity',
  'beginner',
  'published',
  now(),
  true,
  '#6366f1',
  ARRAY['Cybersecurity', 'Demo']
) ON CONFLICT (id) DO NOTHING;

-- Module
INSERT INTO modules (id, course_id, title, description, display_order)
VALUES (
  'dd000000-0000-0000-0001-000000000001',
  'dd000000-0000-0000-0000-000000000001',
  'Security Fundamentals',
  'Core concepts every security professional must know',
  0
) ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- LESSON 1: The CIA Triad
-- Steps: Read, Callout(exam_note), Read, Callout(key_concept),
--         Embed(diagram), Answer(MC), Callout(warning)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'dd000000-0000-0000-0002-000000000001',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'The CIA Triad',
  '',
  0
) ON CONFLICT (id) DO NOTHING;

-- Question for Answer step
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id,
  question_text, question_type, options, correct_option_ids, explanation, difficulty, source,
  option_explanations)
VALUES (
  'dd000000-0000-0000-0003-000000000001',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'dd000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Which CIA Triad principle is most directly violated by a ransomware attack that encrypts all company files?',
  'multiple_choice',
  '[{"id":"a","text":"Confidentiality"},{"id":"b","text":"Integrity"},{"id":"c","text":"Availability"},{"id":"d","text":"Authentication"}]'::jsonb,
  ARRAY['c'],
  'Ransomware prevents legitimate users from accessing their data by encrypting it, directly violating the Availability principle.',
  2,
  'creator_original',
  '{"a":"While unauthorized encryption touches confidentiality, the primary impact is users being locked out.","b":"Integrity would be violated if data was modified or corrupted, not encrypted.","d":"Authentication verifies identity. Ransomware does not target authentication mechanisms directly."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Lesson 1 Steps
INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
-- Step 1: Read - Introduction
('dd000000-0000-0000-0002-000000000001', 0, 'read', '{
  "markdown": "## What is the CIA Triad?\n\nThe CIA Triad is the foundational model for information security. It defines three core principles that every security professional must understand:\n\n- **Confidentiality** — Ensuring data is only accessible to authorized users\n- **Integrity** — Ensuring data hasn''t been tampered with or altered\n- **Availability** — Ensuring systems and data are accessible when needed\n\nThese three pillars guide the design of security policies, controls, and architectures across every organization."
}'::jsonb),

-- Step 2: Callout - Exam Note
('dd000000-0000-0000-0002-000000000001', 1, 'callout', '{
  "callout_style": "exam_note",
  "title": "Exam Tip",
  "markdown": "The CIA Triad appears on approximately **15% of Security+ exam questions**. You need to know specific real-world examples of each principle — not just the definitions. Practice identifying which principle is violated in scenario-based questions."
}'::jsonb),

-- Step 3: Read - Confidentiality
('dd000000-0000-0000-0002-000000000001', 2, 'read', '{
  "markdown": "## Confidentiality in Practice\n\nConfidentiality controls prevent unauthorized disclosure of information. Common implementations include:\n\n1. **Encryption** — AES-256 for data at rest, TLS for data in transit\n2. **Access controls** — Role-based access control (RBAC), mandatory access control (MAC)\n3. **Data classification** — Public, Internal, Confidential, Restricted\n4. **Physical security** — Locked server rooms, badge access\n\n> A hospital encrypting patient records so only treating physicians can read them is a classic example of confidentiality."
}'::jsonb),

-- Step 4: Callout - Key Concept
('dd000000-0000-0000-0002-000000000001', 3, 'callout', '{
  "callout_style": "key_concept",
  "title": "Key Concept",
  "markdown": "**Confidentiality is not the same as privacy.** Confidentiality protects data from unauthorized disclosure within a system. Privacy is about an individual''s right to control their personal information. A system can be confidential (encrypted, access-controlled) but still violate privacy if it collects data users didn''t consent to."
}'::jsonb),

-- Step 5: Embed - Diagram
('dd000000-0000-0000-0002-000000000001', 4, 'embed', '{
  "sub_type": "diagram",
  "mermaid": "graph TD;\n  A[Security Threat] --> B{CIA Impact?};\n  B -->|Data Leaked| C[Confidentiality];\n  B -->|Data Modified| D[Integrity];\n  B -->|System Down| E[Availability];\n  C --> F[Encryption / Access Control];\n  D --> G[Hashing / Digital Signatures];\n  E --> H[Redundancy / Backups];"
}'::jsonb),

-- Step 6: Answer - MC
('dd000000-0000-0000-0002-000000000001', 5, 'answer', ('{
  "question_id": "dd000000-0000-0000-0003-000000000001",
  "question_text": "Which CIA Triad principle is most directly violated by a ransomware attack that encrypts all company files?",
  "question_type": "multiple_choice",
  "options": [{"id":"a","text":"Confidentiality"},{"id":"b","text":"Integrity"},{"id":"c","text":"Availability"},{"id":"d","text":"Authentication"}],
  "correct_ids": ["c"],
  "explanation": "Ransomware prevents legitimate users from accessing their data by encrypting it, directly violating the Availability principle.",
  "option_explanations": {"a":"While unauthorized encryption touches confidentiality, the primary impact is users being locked out.","b":"Integrity would be violated if data was modified or corrupted.","d":"Authentication verifies identity, not related to ransomware directly."}
}')::jsonb),

-- Step 7: Callout - Warning
('dd000000-0000-0000-0002-000000000001', 6, 'callout', '{
  "callout_style": "warning",
  "title": "Common Mistake",
  "markdown": "Don''t confuse **integrity** with **authentication**. Integrity ensures data hasn''t changed; authentication verifies *who* is accessing it. They''re related but distinct concepts. A file with a valid hash has integrity. A user with valid credentials has been authenticated."
}'::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- LESSON 2: Network Security Basics
-- Steps: Watch, Read, Callout(tip), Embed(image), Answer(MC), Answer(MS)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'dd000000-0000-0000-0002-000000000002',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'Network Security Basics',
  '',
  1
) ON CONFLICT (id) DO NOTHING;

-- Questions for Lesson 2
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id,
  question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES
(
  'dd000000-0000-0000-0003-000000000002',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'dd000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'What is the primary purpose of placing a web server in a DMZ?',
  'multiple_choice',
  '[{"id":"a","text":"To improve web server performance"},{"id":"b","text":"To isolate public-facing services from the internal network"},{"id":"c","text":"To allow unrestricted internet access"},{"id":"d","text":"To bypass firewall rules"}]'::jsonb,
  ARRAY['b'],
  'A DMZ (Demilitarized Zone) isolates public-facing servers from the internal network. If a web server in the DMZ is compromised, the attacker still cannot directly access internal systems.',
  2,
  'creator_original'
),
(
  'dd000000-0000-0000-0003-000000000003',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'dd000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'Which of the following are types of firewalls? (Select all that apply)',
  'multiple_select',
  '[{"id":"a","text":"Packet filter"},{"id":"b","text":"Stateful inspection"},{"id":"c","text":"Blockchain filter"},{"id":"d","text":"Next-generation (NGFW)"}]'::jsonb,
  ARRAY['a','b','d'],
  'Packet filter, stateful inspection, and NGFW are all real firewall types. Blockchain filter is not a firewall type.',
  2,
  'creator_original'
)
ON CONFLICT (id) DO NOTHING;

-- Lesson 2 Steps
INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
-- Step 1: Watch
('dd000000-0000-0000-0002-000000000002', 0, 'watch', '{
  "url": "https://www.youtube.com/watch?v=i-uvtDKeFgE"
}'::jsonb),

-- Step 2: Read - Firewalls
('dd000000-0000-0000-0002-000000000002', 1, 'read', '{
  "markdown": "## Firewalls and Network Segmentation\n\nA **firewall** is a network security device that monitors and filters incoming and outgoing traffic based on predefined rules.\n\n### Types of Firewalls\n\n| Type | Description | Use Case |\n|------|-------------|----------|\n| Packet filter | Examines headers only | Basic perimeter defense |\n| Stateful | Tracks connection state | Enterprise networks |\n| Application layer | Inspects payload content | Web application security |\n| Next-gen (NGFW) | Combines all + IPS/DPI | Modern enterprise |\n\n### Network Segmentation\n\nDividing a network into isolated segments limits the blast radius of a breach. Key segments include:\n\n- **DMZ** — Public-facing servers (web, email, DNS)\n- **Internal LAN** — Employee workstations\n- **Server VLAN** — Backend databases and application servers\n- **Management network** — Admin access to infrastructure"
}'::jsonb),

-- Step 3: Callout - Tip
('dd000000-0000-0000-0002-000000000002', 2, 'callout', '{
  "callout_style": "tip",
  "title": "Tip",
  "markdown": "When studying firewall rules for the exam, remember the **implicit deny** principle: if no rule explicitly allows traffic, it should be blocked by default. This is the most secure baseline configuration."
}'::jsonb),

-- Step 4: Embed - Image
('dd000000-0000-0000-0002-000000000002', 3, 'embed', '{
  "sub_type": "image",
  "url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
  "caption": "A modern data center with network segmentation implemented across server racks",
  "alt": "Server racks in a data center with network cables"
}'::jsonb),

-- Step 5: Answer - MC (DMZ)
('dd000000-0000-0000-0002-000000000002', 4, 'answer', ('{
  "question_id": "dd000000-0000-0000-0003-000000000002",
  "question_text": "What is the primary purpose of placing a web server in a DMZ?",
  "question_type": "multiple_choice",
  "options": [{"id":"a","text":"To improve web server performance"},{"id":"b","text":"To isolate public-facing services from the internal network"},{"id":"c","text":"To allow unrestricted internet access"},{"id":"d","text":"To bypass firewall rules"}],
  "correct_ids": ["b"],
  "explanation": "A DMZ isolates public-facing servers from the internal network. If compromised, the attacker cannot directly access internal systems."
}')::jsonb),

-- Step 6: Answer - Multi Select (firewall types)
('dd000000-0000-0000-0002-000000000002', 5, 'answer', ('{
  "question_id": "dd000000-0000-0000-0003-000000000003",
  "question_text": "Which of the following are types of firewalls? (Select all that apply)",
  "question_type": "multiple_select",
  "options": [{"id":"a","text":"Packet filter"},{"id":"b","text":"Stateful inspection"},{"id":"c","text":"Blockchain filter"},{"id":"d","text":"Next-generation (NGFW)"}],
  "correct_ids": ["a","b","d"],
  "explanation": "Packet filter, stateful inspection, and NGFW are all real firewall types. Blockchain filter is not a firewall type."
}')::jsonb);


-- ═══════════════════════════════════════════════════════════════
-- LESSON 3: Cryptography Essentials
-- Steps: Read, Callout(key), Embed(diagram), Read, Embed(math_graph),
--         Callout(warning), Answer(fill_blank), Answer(T/F), Callout(exam)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'dd000000-0000-0000-0002-000000000003',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'Cryptography Essentials',
  '',
  2
) ON CONFLICT (id) DO NOTHING;

-- Questions for Lesson 3
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id,
  question_text, question_type, options, correct_option_ids, explanation, difficulty, source,
  acceptable_answers, match_mode)
VALUES (
  'dd000000-0000-0000-0003-000000000004',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'dd000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'The encryption standard approved by NIST that uses 128, 192, or 256-bit keys is called ___.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'AES (Advanced Encryption Standard) is the NIST-approved symmetric encryption standard. It replaced DES and supports key sizes of 128, 192, and 256 bits.',
  2,
  'creator_original',
  ARRAY['AES', 'Advanced Encryption Standard'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id,
  question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES (
  'dd000000-0000-0000-0003-000000000005',
  'dd000000-0000-0000-0000-000000000001',
  'dd000000-0000-0000-0001-000000000001',
  'dd000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'SHA-256 is a symmetric encryption algorithm.',
  'true_false',
  '[{"id":"a","text":"True"},{"id":"b","text":"False"}]'::jsonb,
  ARRAY['b'],
  'SHA-256 is a hashing algorithm, not an encryption algorithm. Hashing is one-way and cannot be reversed, while encryption can be decrypted with the proper key.',
  2,
  'creator_original'
) ON CONFLICT (id) DO NOTHING;

-- Lesson 3 Steps
INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
-- Step 1: Read - Symmetric vs Asymmetric
('dd000000-0000-0000-0002-000000000003', 0, 'read', '{
  "markdown": "## Symmetric vs Asymmetric Encryption\n\n### Symmetric Encryption\nUses the **same key** for both encryption and decryption. It''s fast but has a key distribution problem — how do you securely share the key?\n\n**Examples:** AES, DES, 3DES, Blowfish, RC4\n\n### Asymmetric Encryption\nUses a **key pair** — a public key for encryption and a private key for decryption. Solves the key distribution problem but is much slower.\n\n**Examples:** RSA, ECC, Diffie-Hellman, ElGamal\n\n### Hybrid Approach\nModern protocols like **TLS** use asymmetric encryption to exchange a symmetric session key, then switch to symmetric encryption for the actual data transfer. This combines the security of asymmetric with the speed of symmetric."
}'::jsonb),

-- Step 2: Callout - Key Concept
('dd000000-0000-0000-0002-000000000003', 1, 'callout', '{
  "callout_style": "key_concept",
  "title": "Key Concept",
  "markdown": "**AES-256** is the current gold standard for symmetric encryption. It''s approved by NIST, used by the US government for classified data, and considered unbreakable with current computing technology. The \"256\" refers to the key size in bits."
}'::jsonb),

-- Step 3: Embed - Sequence Diagram
('dd000000-0000-0000-0002-000000000003', 2, 'embed', '{
  "sub_type": "diagram",
  "mermaid": "sequenceDiagram\n  participant Alice\n  participant Bob\n  Alice->>Bob: 1. Send public key\n  Bob->>Bob: 2. Encrypt message with Alice''s public key\n  Bob->>Alice: 3. Send encrypted message\n  Alice->>Alice: 4. Decrypt with private key"
}'::jsonb),

-- Step 4: Read - Hashing
('dd000000-0000-0000-0002-000000000003', 3, 'read', '{
  "markdown": "## Hashing\n\nA **hash function** takes input of any size and produces a fixed-size output (the hash or digest). Key properties:\n\n1. **Deterministic** — Same input always produces the same hash\n2. **One-way** — Cannot reverse-engineer the input from the hash\n3. **Collision-resistant** — Extremely unlikely that two different inputs produce the same hash\n4. **Avalanche effect** — A tiny change in input produces a completely different hash\n\n### Common Hash Algorithms\n\n- **MD5** (128-bit) — Broken, do not use for security\n- **SHA-1** (160-bit) — Deprecated, avoid\n- **SHA-256** (256-bit) — Current standard, part of SHA-2 family\n- **SHA-3** (variable) — Newest standard, different internal design"
}'::jsonb),

-- Step 5: Embed - Math Graph (speed vs security)
('dd000000-0000-0000-0002-000000000003', 4, 'embed', '{
  "sub_type": "math_graph",
  "graph_data": {
    "x_range": [0, 10],
    "y_range": [0, 100],
    "step": 1,
    "points": [
      {"x": 1, "y": 12, "label": "DES", "color": "#ef4444"},
      {"x": 3, "y": 28, "label": "3DES", "color": "#f97316"},
      {"x": 5, "y": 55, "label": "AES-128", "color": "#22c55e"},
      {"x": 7, "y": 78, "label": "AES-256", "color": "#3b82f6"},
      {"x": 9, "y": 95, "label": "RSA-4096", "color": "#8b5cf6"}
    ],
    "x_label": "Relative Speed (higher = slower)",
    "y_label": "Security Strength",
    "title": "Encryption: Speed vs Security"
  }
}'::jsonb),

-- Step 6: Callout - Warning
('dd000000-0000-0000-0002-000000000003', 5, 'callout', '{
  "callout_style": "warning",
  "title": "Warning",
  "markdown": "**Never use MD5 or SHA-1 for password hashing or digital signatures.** Both have known collision vulnerabilities. For password storage, use purpose-built algorithms like **bcrypt**, **scrypt**, or **Argon2** that include salting and are intentionally slow to resist brute-force attacks."
}'::jsonb),

-- Step 7: Answer - Fill Blank
('dd000000-0000-0000-0002-000000000003', 6, 'answer', ('{
  "question_id": "dd000000-0000-0000-0003-000000000004",
  "question_text": "The encryption standard approved by NIST that uses 128, 192, or 256-bit keys is called ___.",
  "question_type": "fill_blank",
  "options": [],
  "correct_ids": [],
  "explanation": "AES (Advanced Encryption Standard) is the NIST-approved symmetric encryption standard.",
  "acceptable_answers": ["AES", "Advanced Encryption Standard"],
  "match_mode": "exact"
}')::jsonb),

-- Step 8: Answer - True/False
('dd000000-0000-0000-0002-000000000003', 7, 'answer', ('{
  "question_id": "dd000000-0000-0000-0003-000000000005",
  "question_text": "SHA-256 is a symmetric encryption algorithm.",
  "question_type": "true_false",
  "options": [{"id":"a","text":"True"},{"id":"b","text":"False"}],
  "correct_ids": ["b"],
  "explanation": "SHA-256 is a hashing algorithm, not an encryption algorithm. Hashing is one-way and cannot be reversed."
}')::jsonb),

-- Step 9: Callout - Exam Note
('dd000000-0000-0000-0002-000000000003', 8, 'callout', '{
  "callout_style": "exam_note",
  "title": "Exam Note",
  "markdown": "The Security+ exam loves to test whether you can distinguish between **hashing** (one-way, fixed output, used for integrity verification) and **encryption** (two-way, reversible with key, used for confidentiality). If a question asks about verifying data hasn''t changed, think hashing. If it asks about protecting data from being read, think encryption."
}'::jsonb);
