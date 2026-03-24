-- Seed: Classical Mechanics & Beyond (Advanced Physics)
-- UUID prefix: e1
-- 5 modules, 16 lessons, 76 steps, 45 questions

-- ============================================================
-- COURSE
-- ============================================================
INSERT INTO courses (
  id, creator_id, title, slug, description, category, difficulty,
  status, published_at, is_free, price_cents, card_color, tags,
  estimated_duration, prerequisites, learning_objectives
) VALUES (
  'e1000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Classical Mechanics & Beyond',
  'classical-mechanics-and-beyond',
  'A rigorous exploration of classical mechanics from Newtonian foundations through special relativity. Master the physics of motion, energy, rotation, waves, and Einstein''s revolutionary insights with interactive problem-solving.',
  'Physics',
  'advanced',
  'published',
  now(),
  true,
  0,
  '#f97316',
  ARRAY['Physics', 'Academic', 'STEM'],
  '40 hours',
  'Calculus I, basic trigonometry, familiarity with vectors',
  ARRAY['Apply Newton''s laws to solve complex multi-body problems', 'Use energy and momentum conservation to analyze collisions and systems', 'Analyze rotational dynamics including torque, moment of inertia, and angular momentum', 'Describe oscillatory and wave phenomena mathematically', 'Apply the postulates of special relativity to derive time dilation, length contraction, and mass-energy equivalence']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULES
-- ============================================================
INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES (
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'Newtonian Mechanics',
  'The foundation of classical physics: Newton''s three laws, free body diagrams, friction on inclined planes, and uniform circular motion.',
  0,
  25
) ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES (
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0000-000000000001',
  'Energy & Momentum',
  'Conservation laws that simplify complex problems: work-energy theorem, potential and kinetic energy, and the physics of collisions.',
  1,
  20
) ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES (
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0000-000000000001',
  'Rotational Dynamics',
  'Extending Newtonian mechanics to rotating bodies: torque, moment of inertia, angular momentum, and their conservation laws.',
  2,
  20
) ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES (
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0000-000000000001',
  'Oscillations & Waves',
  'Periodic motion from simple harmonic oscillation to wave propagation, including damped systems and mechanical wave types.',
  3,
  20
) ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES (
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0000-000000000001',
  'Special Relativity',
  'Einstein''s revolutionary framework: the constancy of the speed of light, time dilation, length contraction, and the famous equation E = mc².',
  4,
  15
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULE 1: Newtonian Mechanics
-- ============================================================

-- ============================================================
-- LESSON 1: Newton's Laws of Motion
-- Steps: read, callout, answer, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'Newton''s Laws of Motion',
  '',
  0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'A 5 kg box sits on a frictionless table. You push it with a 20 N horizontal force. What is its acceleration?',
  'multiple_choice',
  '[{"id": "a", "text": "$2\\;\\text{m/s}^2$"}, {"id": "b", "text": "$4\\;\\text{m/s}^2$"}, {"id": "c", "text": "$10\\;\\text{m/s}^2$"}, {"id": "d", "text": "$100\\;\\text{m/s}^2$"}]'::jsonb,
  ARRAY['b'],
  'Using Newton''s second law: $a = F/m = 20/5 = 4\;\text{m/s}^2$.',
  1,
  'creator_original',
  '{"a": "This would require $F = 10$ N, not 20 N.", "b": "Correct: $a = F/m = 20\\;\\text{N} / 5\\;\\text{kg} = 4\\;\\text{m/s}^2$.", "c": "You may have confused this with $g \\approx 10\\;\\text{m/s}^2$.", "d": "This would be $F \\times m$, not $F / m$."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES (
  'e1000000-0000-0000-0003-000000000002',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Newton''s Third Law states that action-reaction force pairs act on the same object.',
  'true_false',
  '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
  ARRAY['b'],
  'Action-reaction pairs always act on **different** objects. When you push a wall, the wall pushes you back — the two forces act on different bodies. If they acted on the same object, nothing could ever accelerate!',
  2,
  'creator_original'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e1000000-0000-0000-0003-000000000003',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Match each of Newton''s Laws to its core concept:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'The First Law defines inertia, the Second Law quantifies the relationship between force and acceleration ($F = ma$), and the Third Law ensures forces are always mutual interactions between two bodies.',
  1,
  'creator_original',
  '[{"left": "First Law", "right": "An object''s velocity is constant unless a net force acts"}, {"left": "Second Law", "right": "Net force equals mass times acceleration"}, {"left": "Third Law", "right": "Forces always come in equal and opposite pairs"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000004',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'A 1000 kg car accelerates from 0 to 20 m/s in 10 seconds. What net force acts on the car? $F =$ ___ N',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'First find acceleration: $a = \Delta v / \Delta t = 20/10 = 2\;\text{m/s}^2$. Then $F = ma = 1000 \times 2 = 2000\;\text{N}$.',
  2,
  'creator_original',
  ARRAY['2000', '2000 N', '2,000', '2000N'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000001', 0, 'read', '{"markdown": "## Newton''s Three Laws of Motion\n\nIsaac Newton''s *Principia Mathematica* (1687) laid the foundation for all of classical mechanics with three deceptively simple laws.\n\n**First Law (Inertia):** An object at rest stays at rest, and an object in motion stays in uniform motion, unless acted upon by a net external force.\n\n$$\\sum \\vec{F} = 0 \\implies \\vec{v} = \\text{constant}$$\n\n**Second Law (F = ma):** The net force on an object equals its mass times its acceleration:\n\n$$\\sum \\vec{F} = m\\vec{a}$$\n\nThis is actually a vector equation — it applies independently in each direction ($x$, $y$, $z$).\n\n**Third Law (Action-Reaction):** For every force that object A exerts on object B, object B exerts an equal and opposite force on object A:\n\n$$\\vec{F}_{A \\to B} = -\\vec{F}_{B \\to A}$$\n\nThese laws hold in **inertial reference frames** — frames that are not accelerating. A car turning a corner is *not* inertial; the ground beneath your feet approximately is."}'::jsonb),
('e1000000-0000-0000-0002-000000000001', 1, 'callout', '{"callout_style": "key_concept", "title": "Mass vs Weight", "markdown": "**Mass** ($m$) is an intrinsic property measured in kilograms. **Weight** ($W$) is a force: $W = mg$, where $g \\approx 9.8\\;\\text{m/s}^2$ on Earth''s surface. Your mass is the same on the Moon; your weight is about $\\frac{1}{6}$ of its Earth value because $g_{\\text{Moon}} \\approx 1.6\\;\\text{m/s}^2$."}'::jsonb),
('e1000000-0000-0000-0002-000000000001', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000001", "question_text": "A 5 kg box sits on a frictionless table. You push it with a 20 N horizontal force. What is its acceleration?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$2\\;\\text{m/s}^2$"}, {"id": "b", "text": "$4\\;\\text{m/s}^2$"}, {"id": "c", "text": "$10\\;\\text{m/s}^2$"}, {"id": "d", "text": "$100\\;\\text{m/s}^2$"}], "correct_ids": ["b"], "explanation": "Using Newton''s second law: $a = F/m = 20/5 = 4\\;\\text{m/s}^2$.", "option_explanations": {"a": "This would require $F = 10$ N, not 20 N.", "b": "Correct: $a = F/m = 20\\;\\text{N} / 5\\;\\text{kg} = 4\\;\\text{m/s}^2$.", "c": "You may have confused this with $g \\approx 10\\;\\text{m/s}^2$.", "d": "This would be $F \\times m$, not $F / m$."}, "difficulty": 1, "tags": ["Newton''s Second Law", "F=ma"]}')::jsonb),
('e1000000-0000-0000-0002-000000000001', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000002", "question_text": "Newton''s Third Law states that action-reaction force pairs act on the same object.", "question_type": "true_false", "options": [{"id": "a", "text": "True"}, {"id": "b", "text": "False"}], "correct_ids": ["b"], "explanation": "Action-reaction pairs always act on **different** objects. When you push a wall, the wall pushes you back — the two forces act on different bodies. If they acted on the same object, nothing could ever accelerate!", "difficulty": 2, "tags": ["Newton''s Third Law"]}')::jsonb),
('e1000000-0000-0000-0002-000000000001', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000003", "question_text": "Match each of Newton''s Laws to its core concept:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "The First Law defines inertia, the Second Law quantifies the relationship between force and acceleration ($F = ma$), and the Third Law ensures forces are always mutual interactions between two bodies.", "matching_pairs": [{"left": "First Law", "right": "An object''s velocity is constant unless a net force acts"}, {"left": "Second Law", "right": "Net force equals mass times acceleration"}, {"left": "Third Law", "right": "Forces always come in equal and opposite pairs"}], "difficulty": 1, "tags": ["Newton''s Laws"]}')::jsonb),
('e1000000-0000-0000-0002-000000000001', 5, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000004", "question_text": "A 1000 kg car accelerates from 0 to 20 m/s in 10 seconds. What net force acts on the car? $F =$ ___ N", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "First find acceleration: $a = \\Delta v / \\Delta t = 20/10 = 2\\;\\text{m/s}^2$. Then $F = ma = 1000 \\times 2 = 2000\\;\\text{N}$.", "acceptable_answers": ["2000", "2000 N", "2,000", "2000N"], "match_mode": "exact", "difficulty": 2, "tags": ["Newton''s Second Law", "kinematics"]}')::jsonb);


-- ============================================================
-- LESSON 2: Free Body Diagrams
-- Steps: read, embed, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000002',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'Free Body Diagrams',
  '',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e1000000-0000-0000-0003-000000000005',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'Put the steps for drawing a free body diagram in the correct order:',
  'ordering',
  '[{"id": "a", "text": "Draw the weight vector $m\\vec{g}$ pointing downward"}, {"id": "b", "text": "Identify and isolate the object of interest"}, {"id": "c", "text": "Add applied forces, tensions, and other external forces"}, {"id": "d", "text": "Draw normal forces perpendicular to contact surfaces"}, {"id": "e", "text": "Draw friction forces parallel to surfaces, opposing motion"}]'::jsonb,
  ARRAY[]::text[],
  'Always start by isolating the object (b), then add gravitational weight (a), normal forces from surfaces (d), friction along those surfaces (e), and finally any other external forces like applied pushes or tension (c).',
  2,
  'creator_original',
  ARRAY['b', 'a', 'd', 'e', 'c']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000006',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'A book rests on a table. How many forces act on the book in a correct FBD?',
  'multiple_choice',
  '[{"id": "a", "text": "1 — only gravity"}, {"id": "b", "text": "2 — gravity and normal force"}, {"id": "c", "text": "3 — gravity, normal force, and the force the book exerts on the table"}, {"id": "d", "text": "0 — the book is not accelerating so no forces act"}]'::jsonb,
  ARRAY['b'],
  'Two forces act on the book: gravity pulling it down ($W = mg$) and the normal force from the table pushing it up ($N$). These are equal in magnitude since the book is in equilibrium. Option C is wrong because the force the book exerts on the table acts on *the table*, not on the book. Option D confuses zero net force with zero forces.',
  2,
  'creator_original',
  '{"a": "If only gravity acted, the book would accelerate downward.", "b": "Correct. Gravity down, normal force up, and they balance because $a = 0$.", "c": "The book''s force on the table is a Third Law pair — it acts on the table, not on the book.", "d": "Zero *net* force does not mean zero forces. It means forces balance."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES (
  'e1000000-0000-0000-0003-000000000007',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'On a free body diagram, the quantity $ma$ should be drawn as one of the force arrows.',
  'true_false',
  '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
  ARRAY['b'],
  '$ma$ is **not** a force — it is the *result* of all real forces combined. Newton''s second law says $\sum F = ma$: the left side is the sum of real forces (gravity, normal, friction, tension, etc.), and the right side is mass times acceleration. Including $ma$ as a force would be double-counting.',
  2,
  'creator_original'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000002', 0, 'read', '{"markdown": "## Free Body Diagrams (FBDs)\n\nA **free body diagram** isolates a single object and draws **all** forces acting on it as arrows originating from the object''s center of mass. FBDs are the single most important problem-solving tool in mechanics.\n\n**Rules for drawing FBDs:**\n1. Identify the object of interest and draw it as a dot or simple shape\n2. Draw the gravitational force $\\vec{W} = m\\vec{g}$ pointing straight down\n3. Identify every surface in contact — each contributes a **normal force** $\\vec{N}$ perpendicular to the surface\n4. If there is friction, draw $\\vec{f}$ parallel to the surface, opposing the direction of (impending) motion\n5. Include any applied forces, tensions, or other external forces\n6. **Never** include internal forces or forces the object exerts on other things\n\n**Common mistakes:**\n- Including \"$ma$\" as a force (it is the *result* of forces, not a force itself)\n- Forgetting the normal force\n- Drawing friction in the wrong direction\n- Including reaction forces that act on *other* objects"}'::jsonb),
('e1000000-0000-0000-0002-000000000002', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  A[\"1. Isolate the object\"] --> B[\"2. Draw weight W = mg downward\"]\n  B --> C[\"3. Draw normal force N perpendicular to each surface\"]\n  C --> D[\"4. Draw friction f opposing motion along surface\"]\n  D --> E[\"5. Add applied forces and tension\"]\n  E --> F[\"6. Verify: only external forces on THIS object\"]"}'::jsonb),
('e1000000-0000-0000-0002-000000000002', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000005", "question_text": "Put the steps for drawing a free body diagram in the correct order:", "question_type": "ordering", "options": [{"id": "a", "text": "Draw the weight vector $m\\vec{g}$ pointing downward"}, {"id": "b", "text": "Identify and isolate the object of interest"}, {"id": "c", "text": "Add applied forces, tensions, and other external forces"}, {"id": "d", "text": "Draw normal forces perpendicular to contact surfaces"}, {"id": "e", "text": "Draw friction forces parallel to surfaces, opposing motion"}], "correct_ids": [], "explanation": "Always start by isolating the object (b), then add gravitational weight (a), normal forces from surfaces (d), friction along those surfaces (e), and finally any other external forces like applied pushes or tension (c).", "correct_order": ["b", "a", "d", "e", "c"], "difficulty": 2, "tags": ["Free Body Diagram"]}')::jsonb),
('e1000000-0000-0000-0002-000000000002', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000006", "question_text": "A book rests on a table. How many forces act on the book in a correct FBD?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "1 — only gravity"}, {"id": "b", "text": "2 — gravity and normal force"}, {"id": "c", "text": "3 — gravity, normal force, and the force the book exerts on the table"}, {"id": "d", "text": "0 — the book is not accelerating so no forces act"}], "correct_ids": ["b"], "explanation": "Two forces act on the book: gravity pulling it down ($W = mg$) and the normal force from the table pushing it up ($N$). These are equal in magnitude since the book is in equilibrium. Option C is wrong because the force the book exerts on the table acts on *the table*, not on the book. Option D confuses zero net force with zero forces.", "option_explanations": {"a": "If only gravity acted, the book would accelerate downward.", "b": "Correct. Gravity down, normal force up, and they balance because $a = 0$.", "c": "The book''s force on the table is a Third Law pair — it acts on the table, not on the book.", "d": "Zero *net* force does not mean zero forces. It means forces balance."}, "difficulty": 2, "tags": ["Free Body Diagram", "equilibrium"]}')::jsonb),
('e1000000-0000-0000-0002-000000000002', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000007", "question_text": "On a free body diagram, the quantity $ma$ should be drawn as one of the force arrows.", "question_type": "true_false", "options": [{"id": "a", "text": "True"}, {"id": "b", "text": "False"}], "correct_ids": ["b"], "explanation": "$ma$ is **not** a force — it is the *result* of all real forces combined. Newton''s second law says $\\sum F = ma$: the left side is the sum of real forces (gravity, normal, friction, tension, etc.), and the right side is mass times acceleration. Including $ma$ as a force would be double-counting.", "difficulty": 2, "tags": ["Free Body Diagram", "common mistakes"]}')::jsonb);


-- ============================================================
-- LESSON 3: Friction and Inclined Planes
-- Steps: read, embed, answer, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000003',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'Friction and Inclined Planes',
  '',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000008',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'A 10 kg block sits on a frictionless inclined plane at $\theta = 30°$. What is the acceleration down the slope?

Use $g = 9.8\;\text{m/s}^2$.',
  'multiple_choice',
  '[{"id": "a", "text": "$4.9\\;\\text{m/s}^2$"}, {"id": "b", "text": "$8.5\\;\\text{m/s}^2$"}, {"id": "c", "text": "$9.8\\;\\text{m/s}^2$"}, {"id": "d", "text": "$5.7\\;\\text{m/s}^2$"}]'::jsonb,
  ARRAY['a'],
  'On a frictionless incline, the only force along the plane is $mg\sin\theta$, so $a = g\sin\theta = 9.8 \times \sin 30° = 9.8 \times 0.5 = 4.9\;\text{m/s}^2$. The mass cancels out.',
  2,
  'creator_original',
  '{"a": "Correct: $a = g\\sin 30° = 9.8 \\times 0.5 = 4.9\\;\\text{m/s}^2$.", "b": "This is $g\\cos 30°$, which is the normal force per unit mass, not the acceleration.", "c": "This would be free fall — the incline reduces the effective gravitational acceleration.", "d": "Check your trigonometry. $\\sin 30° = 0.5$, not $0.58$."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000009',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'The normal force on an inclined plane equals $N = mg\cos\theta$. If $\theta = 0°$ (flat surface), $N =$ ___.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'When $\theta = 0°$, $\cos 0° = 1$, so $N = mg \cdot 1 = mg$. On a flat surface, the normal force equals the full weight — as expected.',
  1,
  'creator_original',
  ARRAY['mg', 'm*g', 'm g', 'm·g'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, diagram_data)
VALUES (
  'e1000000-0000-0000-0003-000000000010',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'Looking at the graph above, at approximately what angle do the down-slope force ($mg\sin\theta$) and the normal component ($mg\cos\theta$) become equal?',
  'diagram',
  '[{"id": "a", "text": "$\\theta = 30°$"}, {"id": "b", "text": "$\\theta = 45°$"}, {"id": "c", "text": "$\\theta = 60°$"}, {"id": "d", "text": "$\\theta = 90°$"}]'::jsonb,
  ARRAY['b'],
  'The two components are equal when $mg\sin\theta = mg\cos\theta$, which means $\tan\theta = 1$, so $\theta = 45°$. At this angle, both components equal $mg/\sqrt{2} \approx 6.93\;\text{N/kg}$.',
  2,
  'creator_original',
  '{"x_range": [0, 60], "y_range": [0, 12], "step": 10, "x_label": "Incline angle θ (degrees)", "y_label": "Force (N) per kg", "functions": [{"points": [[0, 0], [10, 1.7], [20, 3.4], [30, 4.9], [40, 6.3], [45, 6.93], [50, 7.5], [60, 8.5]], "color": "#dc2626", "label": "mg sin θ"}, {"points": [[0, 9.8], [10, 9.65], [20, 9.21], [30, 8.49], [40, 7.51], [45, 6.93], [50, 6.3], [60, 4.9]], "color": "#2563eb", "label": "mg cos θ"}], "points": [{"x": 45, "y": 6.93, "label": "Equal point", "color": "#16a34a"}]}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000011',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'A block on an incline will start sliding when $\tan\theta$ exceeds what value?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Sliding begins when $mg\sin\theta > \mu_s mg\cos\theta$. Dividing both sides by $mg\cos\theta$ gives $\tan\theta > \mu_s$. The critical angle is $\theta_c = \arctan(\mu_s)$.',
  3,
  'creator_original',
  ARRAY['μs', 'μ_s', 'mu_s', 'the coefficient of static friction', 'coefficient of static friction'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000003', 0, 'read', '{"markdown": "## Friction on Inclined Planes\n\nWhen an object rests on or slides along a surface, **friction** opposes the relative motion (or tendency of motion) between the surfaces.\n\n**Static friction** prevents motion up to a maximum:\n$$f_s \\leq \\mu_s N$$\n\n**Kinetic friction** acts during sliding:\n$$f_k = \\mu_k N$$\n\nwhere $\\mu_s$ and $\\mu_k$ are the coefficients of static and kinetic friction, and $N$ is the normal force. Typically $\\mu_s > \\mu_k$.\n\n### Inclined Plane Setup\n\nFor an object on a plane tilted at angle $\\theta$, use a coordinate system aligned with the surface:\n\n| Direction | Forces |\n|-----------|--------|\n| Along the plane ($x$) | $mg\\sin\\theta$ (down-slope), friction (up-slope if sliding down) |\n| Perpendicular ($y$) | $N$ (away from surface), $mg\\cos\\theta$ (into surface) |\n\nSince there''s no acceleration perpendicular to the surface:\n$$N = mg\\cos\\theta$$\n\nThe object slides when the gravitational component along the plane exceeds maximum static friction:\n$$mg\\sin\\theta > \\mu_s mg\\cos\\theta \\implies \\tan\\theta > \\mu_s$$"}'::jsonb),
('e1000000-0000-0000-0002-000000000003', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 60], "y_range": [0, 12], "step": 10, "x_label": "Incline angle θ (degrees)", "y_label": "Force (N) per kg", "title": "Forces on a 1 kg Mass vs Incline Angle", "functions": [{"points": [[0, 0], [10, 1.7], [20, 3.4], [30, 4.9], [40, 6.3], [45, 6.9], [50, 7.5], [60, 8.5]], "color": "#dc2626", "label": "mg sin θ (down-slope)", "dashed": false}, {"points": [[0, 9.8], [10, 9.65], [20, 9.21], [30, 8.49], [40, 7.51], [45, 6.93], [50, 6.3], [60, 4.9]], "color": "#2563eb", "label": "mg cos θ (normal)", "dashed": false}], "points": [{"x": 45, "y": 6.93, "label": "θ = 45°", "color": "#16a34a"}]}}'::jsonb),
('e1000000-0000-0000-0002-000000000003', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000008", "question_text": "A 10 kg block sits on a frictionless inclined plane at $\\theta = 30°$. What is the acceleration down the slope?\n\nUse $g = 9.8\\;\\text{m/s}^2$.", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$4.9\\;\\text{m/s}^2$"}, {"id": "b", "text": "$8.5\\;\\text{m/s}^2$"}, {"id": "c", "text": "$9.8\\;\\text{m/s}^2$"}, {"id": "d", "text": "$5.7\\;\\text{m/s}^2$"}], "correct_ids": ["a"], "explanation": "On a frictionless incline, the only force along the plane is $mg\\sin\\theta$, so $a = g\\sin\\theta = 9.8 \\times \\sin 30° = 9.8 \\times 0.5 = 4.9\\;\\text{m/s}^2$. The mass cancels out.", "option_explanations": {"a": "Correct: $a = g\\sin 30° = 9.8 \\times 0.5 = 4.9\\;\\text{m/s}^2$.", "b": "This is $g\\cos 30°$, which is the normal force per unit mass, not the acceleration.", "c": "This would be free fall — the incline reduces the effective gravitational acceleration.", "d": "Check your trigonometry. $\\sin 30° = 0.5$, not $0.58$."}, "difficulty": 2, "tags": ["inclined plane", "friction"]}')::jsonb),
('e1000000-0000-0000-0002-000000000003', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000009", "question_text": "The normal force on an inclined plane equals $N = mg\\cos\\theta$. If $\\theta = 0°$ (flat surface), $N =$ ___.", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "When $\\theta = 0°$, $\\cos 0° = 1$, so $N = mg \\cdot 1 = mg$. On a flat surface, the normal force equals the full weight — as expected.", "acceptable_answers": ["mg", "m*g", "m g", "m·g"], "match_mode": "exact", "difficulty": 1, "tags": ["normal force", "inclined plane"]}')::jsonb),
('e1000000-0000-0000-0002-000000000003', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000010", "question_text": "Looking at the graph above, at approximately what angle do the down-slope force ($mg\\sin\\theta$) and the normal component ($mg\\cos\\theta$) become equal?", "question_type": "diagram", "options": [{"id": "a", "text": "$\\theta = 30°$"}, {"id": "b", "text": "$\\theta = 45°$"}, {"id": "c", "text": "$\\theta = 60°$"}, {"id": "d", "text": "$\\theta = 90°$"}], "correct_ids": ["b"], "explanation": "The two components are equal when $mg\\sin\\theta = mg\\cos\\theta$, which means $\\tan\\theta = 1$, so $\\theta = 45°$. At this angle, both components equal $mg/\\sqrt{2} \\approx 6.93\\;\\text{N/kg}$.", "diagram_data": {"x_range": [0, 60], "y_range": [0, 12], "step": 10, "x_label": "Incline angle θ (degrees)", "y_label": "Force (N) per kg", "functions": [{"points": [[0, 0], [10, 1.7], [20, 3.4], [30, 4.9], [40, 6.3], [45, 6.93], [50, 7.5], [60, 8.5]], "color": "#dc2626", "label": "mg sin θ"}, {"points": [[0, 9.8], [10, 9.65], [20, 9.21], [30, 8.49], [40, 7.51], [45, 6.93], [50, 6.3], [60, 4.9]], "color": "#2563eb", "label": "mg cos θ"}], "points": [{"x": 45, "y": 6.93, "label": "Equal point", "color": "#16a34a"}]}, "difficulty": 2, "tags": ["inclined plane", "graph reading"]}')::jsonb),
('e1000000-0000-0000-0002-000000000003', 5, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000011", "question_text": "A block on an incline will start sliding when $\\tan\\theta$ exceeds what value?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Sliding begins when $mg\\sin\\theta > \\mu_s mg\\cos\\theta$. Dividing both sides by $mg\\cos\\theta$ gives $\\tan\\theta > \\mu_s$. The critical angle is $\\theta_c = \\arctan(\\mu_s)$.", "acceptable_answers": ["μs", "μ_s", "mu_s", "the coefficient of static friction", "coefficient of static friction"], "match_mode": "contains", "difficulty": 3, "tags": ["friction", "inclined plane"]}')::jsonb);


-- ============================================================
-- LESSON 4: Circular Motion and Centripetal Force
-- Steps: read, embed, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000004',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'Circular Motion and Centripetal Force',
  '',
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000012',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'A 2 kg ball on a string moves in a horizontal circle of radius 0.5 m at 3 m/s. What is the tension in the string?',
  'multiple_choice',
  '[{"id": "a", "text": "$6\\;\\text{N}$"}, {"id": "b", "text": "$9\\;\\text{N}$"}, {"id": "c", "text": "$36\\;\\text{N}$"}, {"id": "d", "text": "$18\\;\\text{N}$"}]'::jsonb,
  ARRAY['c'],
  'The tension provides the centripetal force: $T = mv^2/r = 2 \times 3^2 / 0.5 = 2 \times 9 / 0.5 = 36\;\text{N}$.',
  3,
  'creator_original',
  '{"a": "This is $mv$, which is momentum, not centripetal force.", "b": "This is $mv^2/r$ with $r = 2$ instead of 0.5.", "c": "Correct: $T = mv^2/r = 2(9)/0.5 = 36\\;\\text{N}$.", "d": "This is $mv^2$ without dividing by $r$."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, diagram_data, correct_point)
VALUES (
  'e1000000-0000-0000-0003-000000000013',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'Looking at the graph of centripetal acceleration vs speed (with $r = 5$ m), tap the point where $v = 10$ m/s to identify the centripetal acceleration.',
  'plot_point',
  '[]'::jsonb,
  ARRAY[]::text[],
  'At $v = 10$ m/s with $r = 5$ m: $a_c = v^2/r = 100/5 = 20\;\text{m/s}^2$. The correct point is $(10, 20)$.',
  2,
  'creator_original',
  '{"x_range": [0, 20], "y_range": [0, 100], "step": 5, "x_label": "Speed v (m/s)", "y_label": "Centripetal acceleration (m/s²)", "functions": [{"points": [[0, 0], [2, 0.8], [4, 3.2], [6, 7.2], [8, 12.8], [10, 20], [12, 28.8], [14, 39.2], [16, 51.2], [18, 64.8], [20, 80]], "color": "#2563eb", "label": "a = v²/r"}]}'::jsonb,
  '{"x": 10, "y": 20, "tolerance": 2}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000014',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000001',
  'e1000000-0000-0000-0002-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'The angular velocity $\omega$ of an object in uniform circular motion is related to the period $T$ by $\omega =$ ___.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'One full revolution covers $2\pi$ radians in time $T$, so $\omega = 2\pi / T$. Equivalently, $\omega = 2\pi f$ where $f = 1/T$.',
  2,
  'creator_original',
  ARRAY['2π/T', '2pi/T', '2*pi/T', '2π / T'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000004', 0, 'read', '{"markdown": "## Uniform Circular Motion\n\nAn object moving in a circle at constant speed is still **accelerating** because its velocity *direction* changes continuously. This acceleration always points toward the center of the circle and is called **centripetal acceleration**:\n\n$$a_c = \\frac{v^2}{r}$$\n\nwhere $v$ is the speed and $r$ is the radius. By Newton''s second law, the net inward force is:\n\n$$F_c = ma_c = \\frac{mv^2}{r}$$\n\nThis is not a new type of force — centripetal force is just the *label* for whatever real force(s) point inward: gravity (for orbits), tension (for a ball on a string), normal force (for a car on a banked curve), or friction (for a car on a flat curve).\n\n**Period and frequency:**\n\n$$T = \\frac{2\\pi r}{v}, \\qquad f = \\frac{1}{T}, \\qquad \\omega = \\frac{2\\pi}{T} = \\frac{v}{r}$$\n\nwhere $T$ is the period (time for one revolution), $f$ is frequency, and $\\omega$ is angular velocity in rad/s."}'::jsonb),
('e1000000-0000-0000-0002-000000000004', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 20], "y_range": [0, 100], "step": 5, "x_label": "Speed v (m/s)", "y_label": "Centripetal acceleration (m/s²)", "title": "Centripetal Acceleration vs Speed (r = 5 m)", "functions": [{"points": [[0, 0], [2, 0.8], [4, 3.2], [6, 7.2], [8, 12.8], [10, 20], [12, 28.8], [14, 39.2], [16, 51.2], [18, 64.8], [20, 80]], "color": "#2563eb", "label": "a = v²/r", "dashed": false}], "points": [{"x": 10, "y": 20, "label": "v=10, a=20", "color": "#dc2626"}]}}'::jsonb),
('e1000000-0000-0000-0002-000000000004', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000012", "question_text": "A 2 kg ball on a string moves in a horizontal circle of radius 0.5 m at 3 m/s. What is the tension in the string?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$6\\;\\text{N}$"}, {"id": "b", "text": "$9\\;\\text{N}$"}, {"id": "c", "text": "$36\\;\\text{N}$"}, {"id": "d", "text": "$18\\;\\text{N}$"}], "correct_ids": ["c"], "explanation": "The tension provides the centripetal force: $T = mv^2/r = 2 \\times 3^2 / 0.5 = 2 \\times 9 / 0.5 = 36\\;\\text{N}$.", "option_explanations": {"a": "This is $mv$, which is momentum, not centripetal force.", "b": "This is $mv^2/r$ with $r = 2$ instead of 0.5.", "c": "Correct: $T = mv^2/r = 2(9)/0.5 = 36\\;\\text{N}$.", "d": "This is $mv^2$ without dividing by $r$."}, "difficulty": 3, "tags": ["circular motion", "centripetal force"]}')::jsonb),
('e1000000-0000-0000-0002-000000000004', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000013", "question_text": "Looking at the graph of centripetal acceleration vs speed (with $r = 5$ m), tap the point where $v = 10$ m/s to identify the centripetal acceleration.", "question_type": "plot_point", "options": [], "correct_ids": [], "explanation": "At $v = 10$ m/s with $r = 5$ m: $a_c = v^2/r = 100/5 = 20\\;\\text{m/s}^2$. The correct point is $(10, 20)$.", "diagram_data": {"x_range": [0, 20], "y_range": [0, 100], "step": 5, "x_label": "Speed v (m/s)", "y_label": "Centripetal acceleration (m/s²)", "functions": [{"points": [[0, 0], [2, 0.8], [4, 3.2], [6, 7.2], [8, 12.8], [10, 20], [12, 28.8], [14, 39.2], [16, 51.2], [18, 64.8], [20, 80]], "color": "#2563eb", "label": "a = v²/r"}]}, "correct_point": {"x": 10, "y": 20, "tolerance": 2}, "difficulty": 2, "tags": ["circular motion", "graph reading"]}')::jsonb),
('e1000000-0000-0000-0002-000000000004', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000014", "question_text": "The angular velocity $\\omega$ of an object in uniform circular motion is related to the period $T$ by $\\omega =$ ___.", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "One full revolution covers $2\\pi$ radians in time $T$, so $\\omega = 2\\pi / T$. Equivalently, $\\omega = 2\\pi f$ where $f = 1/T$.", "acceptable_answers": ["2π/T", "2pi/T", "2*pi/T", "2π / T"], "match_mode": "exact", "difficulty": 2, "tags": ["circular motion", "angular velocity"]}')::jsonb);


-- ============================================================
-- MODULE 2: Energy & Momentum
-- ============================================================

-- ============================================================
-- LESSON 5: Work-Energy Theorem
-- Steps: read, embed, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000005',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'Work-Energy Theorem',
  '',
  0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000015',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000005',
  'c0000000-0000-0000-0000-000000000001',
  'A 3 kg object moving at 4 m/s is brought to rest by friction. How much work did friction do?',
  'multiple_choice',
  '[{"id": "a", "text": "$-24\\;\\text{J}$"}, {"id": "b", "text": "$24\\;\\text{J}$"}, {"id": "c", "text": "$-12\\;\\text{J}$"}, {"id": "d", "text": "$48\\;\\text{J}$"}]'::jsonb,
  ARRAY['a'],
  'By the work-energy theorem: $W = \Delta KE = \frac{1}{2}(3)(0)^2 - \frac{1}{2}(3)(4)^2 = 0 - 24 = -24\;\text{J}$. The negative sign means friction removed kinetic energy from the object.',
  2,
  'creator_original',
  '{"a": "Correct. $W = 0 - \\frac{1}{2}(3)(16) = -24\\;\\text{J}$. Friction does negative work.", "b": "The magnitude is correct but the sign is wrong — friction opposes motion, so its work is negative.", "c": "You may have forgotten to square the velocity: $KE = \\frac{1}{2}mv^2$, not $\\frac{1}{2}mv$.", "d": "Check your calculation: $\\frac{1}{2}(3)(4^2) = 24$, not 48."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000016',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000005',
  'c0000000-0000-0000-0000-000000000001',
  'A force is applied perpendicular to an object''s displacement. How much work does it do?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  '$W = Fd\cos 90° = Fd \times 0 = 0$. A perpendicular force does no work. This is why the normal force on a flat surface and the centripetal force in circular motion do no work.',
  1,
  'creator_original',
  ARRAY['0', 'zero', '0 J', '0J', 'none'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000005', 0, 'read', '{"markdown": "## Work and Kinetic Energy\n\n**Work** done by a constant force $\\vec{F}$ over a displacement $\\vec{d}$ is:\n\n$$W = Fd\\cos\\theta$$\n\nwhere $\\theta$ is the angle between the force and displacement vectors. Key cases:\n- Force parallel to motion ($\\theta = 0°$): $W = Fd$ (positive work)\n- Force perpendicular ($\\theta = 90°$): $W = 0$ (no work — like the normal force on a flat surface)\n- Force opposing motion ($\\theta = 180°$): $W = -Fd$ (negative work — like friction)\n\n**Kinetic energy** is the energy of motion:\n$$KE = \\frac{1}{2}mv^2$$\n\n**The Work-Energy Theorem** states that the net work done on an object equals its change in kinetic energy:\n\n$$W_{\\text{net}} = \\Delta KE = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$$\n\nThis is extremely powerful: instead of tracking forces and accelerations over time, you can jump directly from initial to final states using energy."}'::jsonb),
('e1000000-0000-0000-0002-000000000005', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 20], "y_range": [0, 2000], "step": 5, "x_label": "Velocity (m/s)", "y_label": "Kinetic Energy (J)", "title": "KE vs Velocity for Different Masses", "functions": [{"points": [[0, 0], [4, 16], [8, 64], [12, 144], [16, 256], [20, 400]], "color": "#2563eb", "label": "m = 2 kg", "dashed": false}, {"points": [[0, 0], [4, 40], [8, 160], [12, 360], [16, 640], [20, 1000]], "color": "#dc2626", "label": "m = 5 kg", "dashed": false}, {"points": [[0, 0], [4, 80], [8, 320], [12, 720], [16, 1280], [20, 2000]], "color": "#16a34a", "label": "m = 10 kg", "dashed": false}], "points": []}}'::jsonb),
('e1000000-0000-0000-0002-000000000005', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000015", "question_text": "A 3 kg object moving at 4 m/s is brought to rest by friction. How much work did friction do?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$-24\\;\\text{J}$"}, {"id": "b", "text": "$24\\;\\text{J}$"}, {"id": "c", "text": "$-12\\;\\text{J}$"}, {"id": "d", "text": "$48\\;\\text{J}$"}], "correct_ids": ["a"], "explanation": "By the work-energy theorem: $W = \\Delta KE = \\frac{1}{2}(3)(0)^2 - \\frac{1}{2}(3)(4)^2 = 0 - 24 = -24\\;\\text{J}$. The negative sign means friction removed kinetic energy from the object.", "option_explanations": {"a": "Correct. $W = 0 - \\frac{1}{2}(3)(16) = -24\\;\\text{J}$. Friction does negative work.", "b": "The magnitude is correct but the sign is wrong — friction opposes motion, so its work is negative.", "c": "You may have forgotten to square the velocity: $KE = \\frac{1}{2}mv^2$, not $\\frac{1}{2}mv$.", "d": "Check your calculation: $\\frac{1}{2}(3)(4^2) = 24$, not 48."}, "difficulty": 2, "tags": ["work-energy theorem", "kinetic energy"]}')::jsonb),
('e1000000-0000-0000-0002-000000000005', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000016", "question_text": "A force is applied perpendicular to an object''s displacement. How much work does it do?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "$W = Fd\\cos 90° = Fd \\times 0 = 0$. A perpendicular force does no work. This is why the normal force on a flat surface and the centripetal force in circular motion do no work.", "acceptable_answers": ["0", "zero", "0 J", "0J", "none"], "match_mode": "exact", "difficulty": 1, "tags": ["work", "dot product"]}')::jsonb);


-- ============================================================
-- LESSON 6: Conservation of Energy
-- Steps: read, callout, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000006',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'Conservation of Energy',
  '',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e1000000-0000-0000-0003-000000000017',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000006',
  'c0000000-0000-0000-0000-000000000001',
  'Match each energy type to its formula:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Kinetic energy depends on speed squared, gravitational PE on height, elastic PE on spring displacement squared, and friction work is negative (removes energy) with magnitude $\mu_k N d$.',
  2,
  'creator_original',
  '[{"left": "Kinetic energy", "right": "½mv²"}, {"left": "Gravitational PE", "right": "mgh"}, {"left": "Elastic PE (spring)", "right": "½kx²"}, {"left": "Work by friction", "right": "−μₖNd"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000018',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000006',
  'c0000000-0000-0000-0000-000000000001',
  'A ball is dropped from a height of 20 m (from rest). What is its speed just before hitting the ground? Use $g = 10\;\text{m/s}^2$.',
  'multiple_choice',
  '[{"id": "a", "text": "$10\\;\\text{m/s}$"}, {"id": "b", "text": "$14.1\\;\\text{m/s}$"}, {"id": "c", "text": "$20\\;\\text{m/s}$"}, {"id": "d", "text": "$200\\;\\text{m/s}$"}]'::jsonb,
  ARRAY['c'],
  'Using energy conservation with $h = 0$ at the ground: $mgh = \frac{1}{2}mv^2$, so $v = \sqrt{2gh} = \sqrt{2 \times 10 \times 20} = \sqrt{400} = 20\;\text{m/s}$.',
  2,
  'creator_original',
  '{"a": "This is just $g$, not $\\sqrt{2gh}$.", "b": "This would be $\\sqrt{2g \\times 10}$ — check your height value.", "c": "Correct: $v = \\sqrt{2(10)(20)} = 20\\;\\text{m/s}$.", "d": "This is $2gh$, but you need $\\sqrt{2gh}$."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000019',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000006',
  'c0000000-0000-0000-0000-000000000001',
  'A roller coaster car starts from rest at height $h$ and slides down a frictionless track. At the bottom, it enters a loop of radius $r$. For the car to just barely make it around the loop, which condition must be satisfied?',
  'multiple_choice',
  '[{"id": "a", "text": "$h \\geq r$"}, {"id": "b", "text": "$h \\geq 2r$"}, {"id": "c", "text": "$h \\geq \\frac{5r}{2}$"}, {"id": "d", "text": "$h \\geq 3r$"}]'::jsonb,
  ARRAY['c'],
  'At the top of the loop, the minimum speed requires $mg = mv^2/r$, giving $v^2 = gr$. Using energy conservation from height $h$ to the loop top at height $2r$: $mgh = \frac{1}{2}m(gr) + mg(2r)$, which gives $h = \frac{r}{2} + 2r = \frac{5r}{2}$.',
  4,
  'creator_original',
  '{"a": "Not nearly enough — the car must reach height $2r$ at the loop top and still have speed.", "b": "This gives the car zero speed at the top of the loop — it would fall.", "c": "Correct. The car needs $h = 5r/2$ to have exactly the minimum speed at the top of the loop.", "d": "This would work, but it''s more than the minimum required."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000006', 0, 'read', '{"markdown": "## Conservation of Mechanical Energy\n\n**Potential energy** stores energy based on position:\n- Gravitational: $PE = mgh$\n- Elastic (spring): $PE = \\frac{1}{2}kx^2$\n\n**Total mechanical energy** is:\n$$E = KE + PE = \\frac{1}{2}mv^2 + mgh$$\n\nIf only conservative forces (gravity, springs) do work, total mechanical energy is conserved:\n\n$$KE_i + PE_i = KE_f + PE_f$$\n\nOr equivalently:\n$$\\frac{1}{2}mv_i^2 + mgh_i = \\frac{1}{2}mv_f^2 + mgh_f$$\n\n**When is energy NOT conserved?**\nWhen non-conservative forces (like friction or air resistance) do work, mechanical energy decreases:\n$$E_f = E_i + W_{\\text{non-conservative}}$$\n\nFriction converts kinetic energy to thermal energy — the total energy of the universe is still conserved, but mechanical energy is not."}'::jsonb),
('e1000000-0000-0000-0002-000000000006', 1, 'callout', '{"callout_style": "tip", "title": "Energy Problem Strategy", "markdown": "**Step 1:** Choose your reference height ($h = 0$) — usually the lowest point in the problem.\n\n**Step 2:** Write $KE_i + PE_i = KE_f + PE_f$ (add $W_{\\text{friction}}$ if friction is present).\n\n**Step 3:** Substitute known values and solve for the unknown.\n\nEnergy methods often replace complicated force/acceleration calculations with a single equation!"}'::jsonb),
('e1000000-0000-0000-0002-000000000006', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000017", "question_text": "Match each energy type to its formula:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "Kinetic energy depends on speed squared, gravitational PE on height, elastic PE on spring displacement squared, and friction work is negative (removes energy) with magnitude $\\mu_k N d$.", "matching_pairs": [{"left": "Kinetic energy", "right": "½mv²"}, {"left": "Gravitational PE", "right": "mgh"}, {"left": "Elastic PE (spring)", "right": "½kx²"}, {"left": "Work by friction", "right": "−μₖNd"}], "difficulty": 2, "tags": ["energy", "formulas"]}')::jsonb),
('e1000000-0000-0000-0002-000000000006', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000018", "question_text": "A ball is dropped from a height of 20 m (from rest). What is its speed just before hitting the ground? Use $g = 10\\;\\text{m/s}^2$.", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$10\\;\\text{m/s}$"}, {"id": "b", "text": "$14.1\\;\\text{m/s}$"}, {"id": "c", "text": "$20\\;\\text{m/s}$"}, {"id": "d", "text": "$200\\;\\text{m/s}$"}], "correct_ids": ["c"], "explanation": "Using energy conservation with $h = 0$ at the ground: $mgh = \\frac{1}{2}mv^2$, so $v = \\sqrt{2gh} = \\sqrt{2 \\times 10 \\times 20} = \\sqrt{400} = 20\\;\\text{m/s}$.", "option_explanations": {"a": "This is just $g$, not $\\sqrt{2gh}$.", "b": "This would be $\\sqrt{2g \\times 10}$ — check your height value.", "c": "Correct: $v = \\sqrt{2(10)(20)} = 20\\;\\text{m/s}$.", "d": "This is $2gh$, but you need $\\sqrt{2gh}$."}, "difficulty": 2, "tags": ["conservation of energy", "free fall"]}')::jsonb),
('e1000000-0000-0000-0002-000000000006', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000019", "question_text": "A roller coaster car starts from rest at height $h$ and slides down a frictionless track. At the bottom, it enters a loop of radius $r$. For the car to just barely make it around the loop, which condition must be satisfied?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$h \\geq r$"}, {"id": "b", "text": "$h \\geq 2r$"}, {"id": "c", "text": "$h \\geq \\frac{5r}{2}$"}, {"id": "d", "text": "$h \\geq 3r$"}], "correct_ids": ["c"], "explanation": "At the top of the loop, the minimum speed requires $mg = mv^2/r$, giving $v^2 = gr$. Using energy conservation from height $h$ to the loop top at height $2r$: $mgh = \\frac{1}{2}m(gr) + mg(2r)$, which gives $h = \\frac{r}{2} + 2r = \\frac{5r}{2}$.", "option_explanations": {"a": "Not nearly enough — the car must reach height $2r$ at the loop top and still have speed.", "b": "This gives the car zero speed at the top of the loop — it would fall.", "c": "Correct. The car needs $h = 5r/2$ to have exactly the minimum speed at the top of the loop.", "d": "This would work, but it''s more than the minimum required."}, "difficulty": 4, "tags": ["conservation of energy", "circular motion", "loop"]}')::jsonb);


-- ============================================================
-- LESSON 7: Collisions and Momentum
-- Steps: read, embed, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000007',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'Collisions and Momentum',
  '',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e1000000-0000-0000-0003-000000000020',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000007',
  'c0000000-0000-0000-0000-000000000001',
  'Order these collision types from MOST kinetic energy lost to LEAST kinetic energy lost:',
  'ordering',
  '[{"id": "a", "text": "Perfectly elastic collision"}, {"id": "b", "text": "Inelastic collision"}, {"id": "c", "text": "Perfectly inelastic collision"}]'::jsonb,
  ARRAY[]::text[],
  'Perfectly inelastic collisions lose the maximum possible kinetic energy (objects stick together). Regular inelastic collisions lose some KE. Perfectly elastic collisions lose zero KE — kinetic energy is fully conserved.',
  2,
  'creator_original',
  ARRAY['c', 'b', 'a']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000021',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000007',
  'c0000000-0000-0000-0000-000000000001',
  'A 2 kg cart moving at 6 m/s collides with and sticks to a 4 kg cart at rest. What is the final velocity?',
  'multiple_choice',
  '[{"id": "a", "text": "$2\\;\\text{m/s}$"}, {"id": "b", "text": "$3\\;\\text{m/s}$"}, {"id": "c", "text": "$6\\;\\text{m/s}$"}, {"id": "d", "text": "$1\\;\\text{m/s}$"}]'::jsonb,
  ARRAY['a'],
  'Perfectly inelastic: $m_1 v_{1i} + m_2 v_{2i} = (m_1 + m_2)v_f$. So $2(6) + 4(0) = (2+4)v_f$, giving $12 = 6v_f$, so $v_f = 2\;\text{m/s}$.',
  2,
  'creator_original',
  '{"a": "Correct: $v_f = (2 \\times 6)/(2 + 4) = 12/6 = 2\\;\\text{m/s}$.", "b": "This would be correct if both carts had equal mass.", "c": "The velocity doesn''t remain unchanged — the combined mass is larger.", "d": "Check your arithmetic: $12/6 = 2$, not 1."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000022',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000002',
  'e1000000-0000-0000-0002-000000000007',
  'c0000000-0000-0000-0000-000000000001',
  'In ALL types of collisions (elastic, inelastic, perfectly inelastic), which quantity is always conserved (assuming no external forces)?',
  'multiple_choice',
  '[{"id": "a", "text": "Kinetic energy"}, {"id": "b", "text": "Momentum"}, {"id": "c", "text": "Both kinetic energy and momentum"}, {"id": "d", "text": "Neither — it depends on the situation"}]'::jsonb,
  ARRAY['b'],
  '**Momentum is always conserved** in all collisions when no external forces act. Kinetic energy is only conserved in perfectly elastic collisions.',
  2,
  'creator_original',
  '{"a": "KE is only conserved in elastic collisions.", "b": "Correct — momentum conservation holds for all collision types.", "c": "Only true for elastic collisions.", "d": "Momentum conservation is not conditional — it always holds for isolated systems."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000007', 0, 'read', '{"markdown": "## Linear Momentum and Collisions\n\n**Momentum** is defined as:\n$$\\vec{p} = m\\vec{v}$$\n\nNewton''s second law in momentum form: $\\vec{F}_{\\text{net}} = \\frac{d\\vec{p}}{dt}$.\n\n**Conservation of momentum:** If no external forces act on a system, total momentum is conserved:\n$$m_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}$$\n\n### Types of Collisions\n\n| Type | Momentum | Kinetic Energy | Example |\n|------|----------|----------------|---------|\n| Perfectly elastic | Conserved | Conserved | Billiard balls (approximately) |\n| Inelastic | Conserved | **Not** conserved | Car crash with deformation |\n| Perfectly inelastic | Conserved | Maximum KE loss | Objects stick together |\n\nIn a **perfectly inelastic** collision, objects stick together:\n$$m_1 v_{1i} + m_2 v_{2i} = (m_1 + m_2)v_f$$\n\nIn a **perfectly elastic** collision, both momentum and KE are conserved. For a 1D elastic collision:\n$$v_{1f} = \\frac{m_1 - m_2}{m_1 + m_2}v_{1i} + \\frac{2m_2}{m_1 + m_2}v_{2i}$$"}'::jsonb),
('e1000000-0000-0000-0002-000000000007', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph LR\n  A[\"Collision Types\"] --> B[\"Elastic\"]\n  A --> C[\"Inelastic\"]\n  A --> D[\"Perfectly Inelastic\"]\n  B --> B1[\"KE conserved<br>Objects bounce\"]\n  C --> C1[\"KE lost to heat/sound<br>Objects deform\"]\n  D --> D1[\"Maximum KE loss<br>Objects stick together\"]"}'::jsonb),
('e1000000-0000-0000-0002-000000000007', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000020", "question_text": "Order these collision types from MOST kinetic energy lost to LEAST kinetic energy lost:", "question_type": "ordering", "options": [{"id": "a", "text": "Perfectly elastic collision"}, {"id": "b", "text": "Inelastic collision"}, {"id": "c", "text": "Perfectly inelastic collision"}], "correct_ids": [], "explanation": "Perfectly inelastic collisions lose the maximum possible kinetic energy (objects stick together). Regular inelastic collisions lose some KE. Perfectly elastic collisions lose zero KE — kinetic energy is fully conserved.", "correct_order": ["c", "b", "a"], "difficulty": 2, "tags": ["collisions", "kinetic energy"]}')::jsonb),
('e1000000-0000-0000-0002-000000000007', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000021", "question_text": "A 2 kg cart moving at 6 m/s collides with and sticks to a 4 kg cart at rest. What is the final velocity?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$2\\;\\text{m/s}$"}, {"id": "b", "text": "$3\\;\\text{m/s}$"}, {"id": "c", "text": "$6\\;\\text{m/s}$"}, {"id": "d", "text": "$1\\;\\text{m/s}$"}], "correct_ids": ["a"], "explanation": "Perfectly inelastic: $m_1 v_{1i} + m_2 v_{2i} = (m_1 + m_2)v_f$. So $2(6) + 4(0) = (2+4)v_f$, giving $12 = 6v_f$, so $v_f = 2\\;\\text{m/s}$.", "option_explanations": {"a": "Correct: $v_f = (2 \\times 6)/(2 + 4) = 12/6 = 2\\;\\text{m/s}$.", "b": "This would be correct if both carts had equal mass.", "c": "The velocity doesn''t remain unchanged — the combined mass is larger.", "d": "Check your arithmetic: $12/6 = 2$, not 1."}, "difficulty": 2, "tags": ["perfectly inelastic collision", "conservation of momentum"]}')::jsonb),
('e1000000-0000-0000-0002-000000000007', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000022", "question_text": "In ALL types of collisions (elastic, inelastic, perfectly inelastic), which quantity is always conserved (assuming no external forces)?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "Kinetic energy"}, {"id": "b", "text": "Momentum"}, {"id": "c", "text": "Both kinetic energy and momentum"}, {"id": "d", "text": "Neither — it depends on the situation"}], "correct_ids": ["b"], "explanation": "**Momentum is always conserved** in all collisions when no external forces act. Kinetic energy is only conserved in perfectly elastic collisions.", "option_explanations": {"a": "KE is only conserved in elastic collisions.", "b": "Correct — momentum conservation holds for all collision types.", "c": "Only true for elastic collisions.", "d": "Momentum conservation is not conditional — it always holds for isolated systems."}, "difficulty": 2, "tags": ["conservation of momentum", "collisions"]}')::jsonb);


-- ============================================================
-- MODULE 3: Rotational Dynamics
-- ============================================================

-- ============================================================
-- LESSON 8: Torque and Angular Acceleration
-- Steps: read, embed, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000008',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'Torque and Angular Acceleration',
  '',
  0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000023',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0002-000000000008',
  'c0000000-0000-0000-0000-000000000001',
  'A wrench is 0.3 m long. You apply 50 N of force perpendicular to the wrench. What is the torque on the bolt?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  '$\tau = rF\sin 90° = 0.3 \times 50 \times 1 = 15\;\text{N·m}$. When the force is perpendicular, $\sin\theta = 1$.',
  1,
  'creator_original',
  ARRAY['15', '15 N·m', '15 Nm', '15 N*m'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000024',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0002-000000000008',
  'c0000000-0000-0000-0000-000000000001',
  'A solid disk with moment of inertia $I = 2\;\text{kg·m}^2$ experiences a net torque of $10\;\text{N·m}$. What is its angular acceleration?',
  'multiple_choice',
  '[{"id": "a", "text": "$5\\;\\text{rad/s}^2$"}, {"id": "b", "text": "$20\\;\\text{rad/s}^2$"}, {"id": "c", "text": "$0.2\\;\\text{rad/s}^2$"}, {"id": "d", "text": "$12\\;\\text{rad/s}^2$"}]'::jsonb,
  ARRAY['a'],
  '$\alpha = \tau / I = 10 / 2 = 5\;\text{rad/s}^2$. This is the rotational version of $a = F/m$.',
  2,
  'creator_original',
  '{"a": "Correct: $\\alpha = \\tau/I = 10/2 = 5\\;\\text{rad/s}^2$.", "b": "This is $\\tau \\times I$, not $\\tau / I$.", "c": "This is $I/\\tau$ — you have the fraction inverted.", "d": "This is $\\tau + I$ — you should divide, not add."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000008', 0, 'read', '{"markdown": "## Torque: The Rotational Analog of Force\n\nJust as force causes linear acceleration, **torque** ($\\tau$) causes angular acceleration ($\\alpha$).\n\n$$\\tau = rF\\sin\\theta$$\n\nwhere $r$ is the distance from the pivot, $F$ is the applied force, and $\\theta$ is the angle between $\\vec{r}$ and $\\vec{F}$. Maximum torque occurs when the force is perpendicular to the lever arm ($\\theta = 90°$).\n\nThe vector form uses the cross product:\n$$\\vec{\\tau} = \\vec{r} \\times \\vec{F}$$\n\n**Newton''s second law for rotation:**\n$$\\sum \\tau = I\\alpha$$\n\nwhere $I$ is the **moment of inertia** (rotational analog of mass) and $\\alpha$ is the angular acceleration in rad/s².\n\n**Units:**\n- Torque: N·m (newton-meters) — *not* joules, even though the units are dimensionally the same\n- Moment of inertia: kg·m²\n- Angular acceleration: rad/s²"}'::jsonb),
('e1000000-0000-0000-0002-000000000008', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 180], "y_range": [0, 12], "step": 30, "x_label": "Angle θ (degrees)", "y_label": "Torque (N·m)", "title": "Torque vs Angle (r = 1 m, F = 10 N)", "functions": [{"points": [[0, 0], [30, 5], [60, 8.66], [90, 10], [120, 8.66], [150, 5], [180, 0]], "color": "#2563eb", "label": "τ = rF sin θ", "dashed": false}], "points": [{"x": 90, "y": 10, "label": "Maximum torque", "color": "#dc2626"}]}}'::jsonb),
('e1000000-0000-0000-0002-000000000008', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000023", "question_text": "A wrench is 0.3 m long. You apply 50 N of force perpendicular to the wrench. What is the torque on the bolt?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "$\\tau = rF\\sin 90° = 0.3 \\times 50 \\times 1 = 15\\;\\text{N·m}$. When the force is perpendicular, $\\sin\\theta = 1$.", "acceptable_answers": ["15", "15 N·m", "15 Nm", "15 N*m"], "match_mode": "exact", "difficulty": 1, "tags": ["torque"]}')::jsonb),
('e1000000-0000-0000-0002-000000000008', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000024", "question_text": "A solid disk with moment of inertia $I = 2\\;\\text{kg·m}^2$ experiences a net torque of $10\\;\\text{N·m}$. What is its angular acceleration?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$5\\;\\text{rad/s}^2$"}, {"id": "b", "text": "$20\\;\\text{rad/s}^2$"}, {"id": "c", "text": "$0.2\\;\\text{rad/s}^2$"}, {"id": "d", "text": "$12\\;\\text{rad/s}^2$"}], "correct_ids": ["a"], "explanation": "$\\alpha = \\tau / I = 10 / 2 = 5\\;\\text{rad/s}^2$. This is the rotational version of $a = F/m$.", "option_explanations": {"a": "Correct: $\\alpha = \\tau/I = 10/2 = 5\\;\\text{rad/s}^2$.", "b": "This is $\\tau \\times I$, not $\\tau / I$.", "c": "This is $I/\\tau$ — you have the fraction inverted.", "d": "This is $\\tau + I$ — you should divide, not add."}, "difficulty": 2, "tags": ["torque", "angular acceleration"]}')::jsonb);


-- ============================================================
-- LESSON 9: Moment of Inertia
-- Steps: read, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000009',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'Moment of Inertia',
  '',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e1000000-0000-0000-0003-000000000025',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0002-000000000009',
  'c0000000-0000-0000-0000-000000000001',
  'Match each shape to its moment of inertia about its central axis:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'The distribution of mass matters: a hollow cylinder has all mass at radius $R$, giving $I = MR^2$. A solid disk distributes mass from $r = 0$ to $r = R$, giving $\frac{1}{2}MR^2$ — less than the hollow cylinder of the same total mass.',
  3,
  'creator_original',
  '[{"left": "Solid disk (mass M, radius R)", "right": "½MR²"}, {"left": "Hollow cylinder (thin wall)", "right": "MR²"}, {"left": "Solid sphere", "right": "⅖MR²"}, {"left": "Thin rod about center (length L)", "right": "1/12 ML²"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000026',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0002-000000000009',
  'c0000000-0000-0000-0000-000000000001',
  'Two wheels have the same mass $M$ and radius $R$. One is a solid disk, the other is a thin hoop (hollow cylinder). Both start from rest and roll down the same hill. Which reaches the bottom first?',
  'multiple_choice',
  '[{"id": "a", "text": "The solid disk"}, {"id": "b", "text": "The thin hoop"}, {"id": "c", "text": "They arrive at the same time"}, {"id": "d", "text": "It depends on the mass"}]'::jsonb,
  ARRAY['a'],
  'The solid disk has a smaller moment of inertia ($\frac{1}{2}MR^2$ vs $MR^2$), so less energy goes into rotation and more into translation. It accelerates faster and reaches the bottom first. Remarkably, the result is independent of mass and radius.',
  3,
  'creator_original',
  '{"a": "Correct. Lower $I$ means more gravitational PE converts to translational KE, so it rolls faster.", "b": "The hoop has *more* rotational inertia, so it''s slower.", "c": "Their different moments of inertia lead to different accelerations.", "d": "Mass cancels out — the result depends only on the shape (the coefficient in $I = cMR^2$)."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000027',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0002-000000000009',
  'c0000000-0000-0000-0000-000000000001',
  'Using the parallel axis theorem, the moment of inertia of a thin rod of mass $M$ and length $L$ about one end is $I = \frac{1}{12}ML^2 + M\left(\frac{L}{2}\right)^2$. Simplify this to $I =$ ___$ML^2$.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  '$I = \frac{1}{12}ML^2 + M \cdot \frac{L^2}{4} = \frac{1}{12}ML^2 + \frac{3}{12}ML^2 = \frac{4}{12}ML^2 = \frac{1}{3}ML^2$. This matches the standard formula for a rod about its end.',
  3,
  'creator_original',
  ARRAY['1/3', '⅓', '0.333'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000009', 0, 'read', '{"markdown": "## Moment of Inertia\n\nThe **moment of inertia** $I$ quantifies an object''s resistance to angular acceleration, just as mass resists linear acceleration. It depends on both the mass and how that mass is distributed relative to the axis of rotation.\n\nFor a collection of point masses:\n$$I = \\sum m_i r_i^2$$\n\nFor continuous objects, the moment of inertia must be calculated via integration. Here are the most important results:\n\n| Shape | Axis | Moment of Inertia |\n|-------|------|-------------------|\n| Point mass $m$ at distance $r$ | Through center | $mr^2$ |\n| Solid cylinder/disk (mass $M$, radius $R$) | Central axis | $\\frac{1}{2}MR^2$ |\n| Hollow cylinder (thin wall) | Central axis | $MR^2$ |\n| Solid sphere | Through center | $\\frac{2}{5}MR^2$ |\n| Hollow sphere (thin shell) | Through center | $\\frac{2}{3}MR^2$ |\n| Thin rod (length $L$) | Through center | $\\frac{1}{12}ML^2$ |\n| Thin rod (length $L$) | Through end | $\\frac{1}{3}ML^2$ |\n\n**Parallel Axis Theorem:** If you know $I_{\\text{cm}}$ about the center of mass, the moment about any parallel axis a distance $d$ away is:\n$$I = I_{\\text{cm}} + Md^2$$"}'::jsonb),
('e1000000-0000-0000-0002-000000000009', 1, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000025", "question_text": "Match each shape to its moment of inertia about its central axis:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "The distribution of mass matters: a hollow cylinder has all mass at radius $R$, giving $I = MR^2$. A solid disk distributes mass from $r = 0$ to $r = R$, giving $\\frac{1}{2}MR^2$ — less than the hollow cylinder of the same total mass.", "matching_pairs": [{"left": "Solid disk (mass M, radius R)", "right": "½MR²"}, {"left": "Hollow cylinder (thin wall)", "right": "MR²"}, {"left": "Solid sphere", "right": "⅖MR²"}, {"left": "Thin rod about center (length L)", "right": "1/12 ML²"}], "difficulty": 3, "tags": ["moment of inertia"]}')::jsonb),
('e1000000-0000-0000-0002-000000000009', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000026", "question_text": "Two wheels have the same mass $M$ and radius $R$. One is a solid disk, the other is a thin hoop (hollow cylinder). Both start from rest and roll down the same hill. Which reaches the bottom first?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "The solid disk"}, {"id": "b", "text": "The thin hoop"}, {"id": "c", "text": "They arrive at the same time"}, {"id": "d", "text": "It depends on the mass"}], "correct_ids": ["a"], "explanation": "The solid disk has a smaller moment of inertia ($\\frac{1}{2}MR^2$ vs $MR^2$), so less energy goes into rotation and more into translation. It accelerates faster and reaches the bottom first. Remarkably, the result is independent of mass and radius.", "option_explanations": {"a": "Correct. Lower $I$ means more gravitational PE converts to translational KE, so it rolls faster.", "b": "The hoop has *more* rotational inertia, so it''s slower.", "c": "Their different moments of inertia lead to different accelerations.", "d": "Mass cancels out — the result depends only on the shape (the coefficient in $I = cMR^2$)."}, "difficulty": 3, "tags": ["moment of inertia", "rolling motion"]}')::jsonb),
('e1000000-0000-0000-0002-000000000009', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000027", "question_text": "Using the parallel axis theorem, the moment of inertia of a thin rod of mass $M$ and length $L$ about one end is $I = \\frac{1}{12}ML^2 + M\\left(\\frac{L}{2}\\right)^2$. Simplify this to $I =$ ___$ML^2$.", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "$I = \\frac{1}{12}ML^2 + M \\cdot \\frac{L^2}{4} = \\frac{1}{12}ML^2 + \\frac{3}{12}ML^2 = \\frac{4}{12}ML^2 = \\frac{1}{3}ML^2$. This matches the standard formula for a rod about its end.", "acceptable_answers": ["1/3", "⅓", "0.333"], "match_mode": "exact", "difficulty": 3, "tags": ["parallel axis theorem", "moment of inertia"]}')::jsonb);


-- ============================================================
-- LESSON 10: Angular Momentum Conservation
-- Steps: read, callout, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000010',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'Angular Momentum Conservation',
  '',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000028',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0002-000000000010',
  'c0000000-0000-0000-0000-000000000001',
  'A merry-go-round ($I = 500\;\text{kg·m}^2$) spins at $2\;\text{rad/s}$. A 50 kg child ($I_{\text{child}} \approx 50 \times 2^2 = 200\;\text{kg·m}^2$ at the edge) jumps on. What is the new angular velocity?',
  'multiple_choice',
  '[{"id": "a", "text": "$1.0\\;\\text{rad/s}$"}, {"id": "b", "text": "$1.43\\;\\text{rad/s}$"}, {"id": "c", "text": "$2.0\\;\\text{rad/s}$"}, {"id": "d", "text": "$0.71\\;\\text{rad/s}$"}]'::jsonb,
  ARRAY['b'],
  '$L_i = L_f$: $500 \times 2 = (500 + 200)\omega_f$, so $\omega_f = 1000/700 \approx 1.43\;\text{rad/s}$. The system slows down because the moment of inertia increased.',
  3,
  'creator_original',
  '{"a": "This assumes $I_{\\text{child}} = 500\\;\\text{kg·m}^2$, doubling the total I.", "b": "Correct: $\\omega_f = (500 \\times 2)/(500 + 200) = 1000/700 \\approx 1.43\\;\\text{rad/s}$.", "c": "The angular velocity must decrease — adding mass increases $I$.", "d": "Check your calculation of $I_{\\text{child}}$."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000029',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000003',
  'e1000000-0000-0000-0002-000000000010',
  'c0000000-0000-0000-0000-000000000001',
  'A skater''s moment of inertia decreases by half when she pulls in her arms. Her angular velocity will:',
  'multiple_choice',
  '[{"id": "a", "text": "Double"}, {"id": "b", "text": "Halve"}, {"id": "c", "text": "Stay the same"}, {"id": "d", "text": "Quadruple"}]'::jsonb,
  ARRAY['a'],
  '$L = I\omega$ is conserved. If $I$ is halved, $\omega$ must double to keep $L$ constant: $I\omega = (I/2)(2\omega)$.',
  2,
  'creator_original',
  '{"a": "Correct: $I_i \\omega_i = I_f \\omega_f \\implies \\omega_f = (I_i/I_f)\\omega_i = 2\\omega_i$.", "b": "This would happen if $I$ doubled, not halved.", "c": "Angular momentum is conserved, not angular velocity.", "d": "This would require $I$ to decrease to one-quarter."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000010', 0, 'read', '{"markdown": "## Angular Momentum\n\n**Angular momentum** is the rotational analog of linear momentum:\n\n$$L = I\\omega$$\n\nFor a point particle:\n$$\\vec{L} = \\vec{r} \\times \\vec{p} = \\vec{r} \\times m\\vec{v}$$\n\n**Conservation of Angular Momentum:** If no net external torque acts on a system:\n\n$$L_i = L_f \\implies I_i \\omega_i = I_f \\omega_f$$\n\nThis has spectacular consequences:\n- An ice skater pulls in her arms, decreasing $I$ → $\\omega$ increases (she spins faster)\n- A diver tucks into a ball mid-air → spins faster, then extends to slow the spin before entering the water\n- Earth''s rotation is slowly decreasing because the Moon''s tidal forces exert a torque\n\n**The rotational analogy is complete:**\n\n| Linear | Rotational |\n|--------|------------|\n| Mass $m$ | Moment of inertia $I$ |\n| Velocity $v$ | Angular velocity $\\omega$ |\n| Momentum $p = mv$ | Angular momentum $L = I\\omega$ |\n| Force $F = ma$ | Torque $\\tau = I\\alpha$ |\n| KE = $\\frac{1}{2}mv^2$ | KE = $\\frac{1}{2}I\\omega^2$ |"}'::jsonb),
('e1000000-0000-0000-0002-000000000010', 1, 'callout', '{"callout_style": "key_concept", "title": "Spinning Skater", "markdown": "When a figure skater pulls their arms in during a spin, no external torque acts (friction is minimal). So $I_i \\omega_i = I_f \\omega_f$. Since $I_f < I_i$ (arms closer to rotation axis), $\\omega_f > \\omega_i$ — the spin speeds up. This is conservation of angular momentum in action."}'::jsonb),
('e1000000-0000-0000-0002-000000000010', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000028", "question_text": "A merry-go-round ($I = 500\\;\\text{kg·m}^2$) spins at $2\\;\\text{rad/s}$. A 50 kg child ($I_{\\text{child}} \\approx 50 \\times 2^2 = 200\\;\\text{kg·m}^2$ at the edge) jumps on. What is the new angular velocity?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$1.0\\;\\text{rad/s}$"}, {"id": "b", "text": "$1.43\\;\\text{rad/s}$"}, {"id": "c", "text": "$2.0\\;\\text{rad/s}$"}, {"id": "d", "text": "$0.71\\;\\text{rad/s}$"}], "correct_ids": ["b"], "explanation": "$L_i = L_f$: $500 \\times 2 = (500 + 200)\\omega_f$, so $\\omega_f = 1000/700 \\approx 1.43\\;\\text{rad/s}$. The system slows down because the moment of inertia increased.", "option_explanations": {"a": "This assumes $I_{\\text{child}} = 500\\;\\text{kg·m}^2$, doubling the total I.", "b": "Correct: $\\omega_f = (500 \\times 2)/(500 + 200) = 1000/700 \\approx 1.43\\;\\text{rad/s}$.", "c": "The angular velocity must decrease — adding mass increases $I$.", "d": "Check your calculation of $I_{\\text{child}}$."}, "difficulty": 3, "tags": ["angular momentum conservation"]}')::jsonb),
('e1000000-0000-0000-0002-000000000010', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000029", "question_text": "A skater''s moment of inertia decreases by half when she pulls in her arms. Her angular velocity will:", "question_type": "multiple_choice", "options": [{"id": "a", "text": "Double"}, {"id": "b", "text": "Halve"}, {"id": "c", "text": "Stay the same"}, {"id": "d", "text": "Quadruple"}], "correct_ids": ["a"], "explanation": "$L = I\\omega$ is conserved. If $I$ is halved, $\\omega$ must double to keep $L$ constant: $I\\omega = (I/2)(2\\omega)$.", "option_explanations": {"a": "Correct: $I_i \\omega_i = I_f \\omega_f \\implies \\omega_f = (I_i/I_f)\\omega_i = 2\\omega_i$.", "b": "This would happen if $I$ doubled, not halved.", "c": "Angular momentum is conserved, not angular velocity.", "d": "This would require $I$ to decrease to one-quarter."}, "difficulty": 2, "tags": ["angular momentum conservation"]}')::jsonb);


-- ============================================================
-- MODULE 4: Oscillations & Waves
-- ============================================================

-- ============================================================
-- LESSON 11: Simple Harmonic Motion
-- Steps: read, embed, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000011',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'Simple Harmonic Motion',
  '',
  0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, diagram_data, correct_point)
VALUES (
  'e1000000-0000-0000-0003-000000000030',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000011',
  'c0000000-0000-0000-0000-000000000001',
  'From the graph of $x(t) = 2\cos(\pi t)$, identify the period by tapping the point where the first full cycle completes.',
  'plot_point',
  '[]'::jsonb,
  ARRAY[]::text[],
  'The function starts at $x = 2$ at $t = 0$ and returns to $x = 2$ at $t = 2$ s. So the period is $T = 2$ s. You can verify: $\omega = \pi$, so $T = 2\pi/\omega = 2\pi/\pi = 2$ s.',
  2,
  'creator_original',
  '{"x_range": [0, 8], "y_range": [-3, 3], "step": 1, "x_label": "Time (s)", "y_label": "Displacement (m)", "functions": [{"points": [[0, 2], [0.5, 0], [1, -2], [1.5, 0], [2, 2], [2.5, 0], [3, -2], [3.5, 0], [4, 2], [4.5, 0], [5, -2], [5.5, 0], [6, 2], [6.5, 0], [7, -2], [7.5, 0], [8, 2]], "color": "#2563eb", "label": "x(t)"}]}'::jsonb,
  '{"x": 2, "y": 2, "tolerance": 0.5}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000031',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000011',
  'c0000000-0000-0000-0000-000000000001',
  'A pendulum has length $l = 1$ m. What is its period on Earth ($g = 9.8\;\text{m/s}^2$)? $T \approx$ ___ seconds.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  '$T = 2\pi\sqrt{l/g} = 2\pi\sqrt{1/9.8} = 2\pi \times 0.3194 \approx 2.007$ s $\approx 2.0$ s.',
  2,
  'creator_original',
  ARRAY['2.0', '2.01', '2', '2.0 s'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000032',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000011',
  'c0000000-0000-0000-0000-000000000001',
  'In SHM, at what displacement is the speed of the oscillator maximum?',
  'multiple_choice',
  '[{"id": "a", "text": "At maximum displacement ($x = A$)"}, {"id": "b", "text": "At equilibrium ($x = 0$)"}, {"id": "c", "text": "At half the amplitude ($x = A/2$)"}, {"id": "d", "text": "Speed is constant in SHM"}]'::jsonb,
  ARRAY['b'],
  'At equilibrium ($x = 0$), all energy is kinetic, giving maximum speed $v_{\max} = A\omega$. At the endpoints ($x = \pm A$), all energy is potential and the speed is momentarily zero.',
  2,
  'creator_original',
  '{"a": "At maximum displacement, the velocity is zero — the object momentarily stops before reversing.", "b": "Correct. At equilibrium, PE = 0 and all energy is kinetic: $v_{\\max} = A\\omega$.", "c": "The speed is not zero or maximum here — it''s an intermediate value.", "d": "Speed varies continuously in SHM — it''s a cosine/sine function of time."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000011', 0, 'read', '{"markdown": "## Simple Harmonic Motion (SHM)\n\nSHM occurs when a restoring force is proportional to displacement:\n$$F = -kx$$\n\nThis produces sinusoidal oscillation:\n$$x(t) = A\\cos(\\omega t + \\phi)$$\n\nwhere:\n- $A$ = amplitude (maximum displacement)\n- $\\omega = \\sqrt{k/m}$ = angular frequency (rad/s)\n- $\\phi$ = phase constant (determined by initial conditions)\n\n**Period and frequency:**\n$$T = \\frac{2\\pi}{\\omega} = 2\\pi\\sqrt{\\frac{m}{k}}, \\qquad f = \\frac{1}{T}$$\n\n**Velocity and acceleration:**\n$$v(t) = -A\\omega\\sin(\\omega t + \\phi)$$\n$$a(t) = -A\\omega^2\\cos(\\omega t + \\phi) = -\\omega^2 x(t)$$\n\nMaximum speed $v_{\\max} = A\\omega$ occurs at $x = 0$ (equilibrium). Maximum acceleration $a_{\\max} = A\\omega^2$ occurs at $x = \\pm A$ (endpoints).\n\n**For a simple pendulum** (small angle approximation):\n$$T = 2\\pi\\sqrt{\\frac{l}{g}}$$\n\nNotice: the period depends on length and gravity, but **not** on mass or amplitude (for small angles)."}'::jsonb),
('e1000000-0000-0000-0002-000000000011', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 8], "y_range": [-3, 3], "step": 1, "x_label": "Time (s)", "y_label": "Displacement (m)", "title": "SHM: x(t) = 2cos(πt)", "functions": [{"points": [[0, 2], [0.5, 0], [1, -2], [1.5, 0], [2, 2], [2.5, 0], [3, -2], [3.5, 0], [4, 2], [4.5, 0], [5, -2], [5.5, 0], [6, 2], [6.5, 0], [7, -2], [7.5, 0], [8, 2]], "color": "#2563eb", "label": "x(t)", "dashed": false}], "points": [{"x": 0, "y": 2, "label": "A = 2m", "color": "#dc2626"}, {"x": 2, "y": 2, "label": "T = 2s", "color": "#16a34a"}]}}'::jsonb),
('e1000000-0000-0000-0002-000000000011', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000030", "question_text": "From the graph of $x(t) = 2\\cos(\\pi t)$, identify the period by tapping the point where the first full cycle completes.", "question_type": "plot_point", "options": [], "correct_ids": [], "explanation": "The function starts at $x = 2$ at $t = 0$ and returns to $x = 2$ at $t = 2$ s. So the period is $T = 2$ s. You can verify: $\\omega = \\pi$, so $T = 2\\pi/\\omega = 2\\pi/\\pi = 2$ s.", "diagram_data": {"x_range": [0, 8], "y_range": [-3, 3], "step": 1, "x_label": "Time (s)", "y_label": "Displacement (m)", "functions": [{"points": [[0, 2], [0.5, 0], [1, -2], [1.5, 0], [2, 2], [2.5, 0], [3, -2], [3.5, 0], [4, 2], [4.5, 0], [5, -2], [5.5, 0], [6, 2], [6.5, 0], [7, -2], [7.5, 0], [8, 2]], "color": "#2563eb", "label": "x(t)"}]}, "correct_point": {"x": 2, "y": 2, "tolerance": 0.5}, "difficulty": 2, "tags": ["SHM", "period"]}')::jsonb),
('e1000000-0000-0000-0002-000000000011', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000031", "question_text": "A pendulum has length $l = 1$ m. What is its period on Earth ($g = 9.8\\;\\text{m/s}^2$)? $T \\approx$ ___ seconds.", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "$T = 2\\pi\\sqrt{l/g} = 2\\pi\\sqrt{1/9.8} = 2\\pi \\times 0.3194 \\approx 2.007$ s $\\approx 2.0$ s.", "acceptable_answers": ["2.0", "2.01", "2", "2.0 s"], "match_mode": "exact", "difficulty": 2, "tags": ["pendulum", "SHM"]}')::jsonb),
('e1000000-0000-0000-0002-000000000011', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000032", "question_text": "In SHM, at what displacement is the speed of the oscillator maximum?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "At maximum displacement ($x = A$)"}, {"id": "b", "text": "At equilibrium ($x = 0$)"}, {"id": "c", "text": "At half the amplitude ($x = A/2$)"}, {"id": "d", "text": "Speed is constant in SHM"}], "correct_ids": ["b"], "explanation": "At equilibrium ($x = 0$), all energy is kinetic, giving maximum speed $v_{\\max} = A\\omega$. At the endpoints ($x = \\pm A$), all energy is potential and the speed is momentarily zero.", "option_explanations": {"a": "At maximum displacement, the velocity is zero — the object momentarily stops before reversing.", "b": "Correct. At equilibrium, PE = 0 and all energy is kinetic: $v_{\\max} = A\\omega$.", "c": "The speed is not zero or maximum here — it''s an intermediate value.", "d": "Speed varies continuously in SHM — it''s a cosine/sine function of time."}, "difficulty": 2, "tags": ["SHM", "energy"]}')::jsonb);


-- ============================================================
-- LESSON 12: Damped and Driven Oscillations
-- Steps: read, embed, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000012',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'Damped and Driven Oscillations',
  '',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000033',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000012',
  'c0000000-0000-0000-0000-000000000001',
  'In the graph above, the underdamped oscillation shows decreasing amplitude over time. The envelope of this decay follows what mathematical function?',
  'multiple_choice',
  '[{"id": "a", "text": "Linear: $A(t) = A_0 - ct$"}, {"id": "b", "text": "Exponential: $A(t) = A_0 e^{-\\gamma t}$"}, {"id": "c", "text": "Quadratic: $A(t) = A_0/(1+t^2)$"}, {"id": "d", "text": "Logarithmic: $A(t) = A_0 \\ln(t)$"}]'::jsonb,
  ARRAY['b'],
  'The amplitude envelope of a damped oscillator decays exponentially: $A(t) = A_0 e^{-\gamma t}$, where $\gamma = b/(2m)$. This comes from solving the differential equation $m\ddot{x} + b\dot{x} + kx = 0$.',
  3,
  'creator_original',
  '{"a": "Linear decay would reach zero in finite time and go negative — physically wrong.", "b": "Correct. Exponential decay is the signature of damping proportional to velocity.", "c": "This type of decay (Lorentzian) doesn''t arise from linear damping.", "d": "Logarithmic functions diverge at $t = 0$ and grow at large $t$ — opposite of what we need."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000034',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000012',
  'c0000000-0000-0000-0000-000000000001',
  'Resonance occurs when the driving frequency is approximately equal to the system''s ___.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Resonance occurs when $\omega_d \approx \omega_0$, where $\omega_0$ is the natural (or resonant) frequency of the system. At resonance, the amplitude of oscillation reaches its maximum.',
  2,
  'creator_original',
  ARRAY['natural frequency', 'resonant frequency', 'ω₀', 'omega_0', 'ω0'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000012', 0, 'read', '{"markdown": "## Damped Oscillations\n\nReal oscillators lose energy to friction or air resistance. A **damped oscillator** has a drag force proportional to velocity:\n\n$$F = -kx - b\\dot{x}$$\n\nwhere $b$ is the damping coefficient. The solution is:\n\n$$x(t) = A_0 e^{-\\gamma t}\\cos(\\omega'' t + \\phi)$$\n\nwhere $\\gamma = b/(2m)$ is the damping rate and $\\omega'' = \\sqrt{\\omega_0^2 - \\gamma^2}$ is the damped frequency.\n\n**Three damping regimes:**\n- **Underdamped** ($\\gamma < \\omega_0$): oscillates with exponentially decaying amplitude\n- **Critically damped** ($\\gamma = \\omega_0$): returns to equilibrium fastest without oscillating\n- **Overdamped** ($\\gamma > \\omega_0$): returns to equilibrium slowly without oscillating\n\n## Driven Oscillations and Resonance\n\nApplying a periodic driving force $F_0\\cos(\\omega_d t)$ produces steady-state oscillation at the driving frequency. The amplitude peaks dramatically when $\\omega_d \\approx \\omega_0$ — this is **resonance**.\n\nAt resonance, even small driving forces produce large amplitudes. Famous example: the Tacoma Narrows Bridge collapse."}'::jsonb),
('e1000000-0000-0000-0002-000000000012', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 10], "y_range": [-3, 3], "step": 1, "x_label": "Time (s)", "y_label": "Displacement (m)", "title": "Damped vs Undamped Oscillation", "functions": [{"points": [[0, 2], [0.5, 0], [1, -2], [1.5, 0], [2, 2], [2.5, 0], [3, -2], [3.5, 0], [4, 2], [4.5, 0], [5, -2], [5.5, 0], [6, 2], [6.5, 0], [7, -2], [7.5, 0], [8, 2], [8.5, 0], [9, -2], [9.5, 0], [10, 2]], "color": "#94a3b8", "label": "Undamped", "dashed": true}, {"points": [[0, 2], [0.5, 0], [1, -1.64], [1.5, 0], [2, 1.35], [2.5, 0], [3, -1.1], [3.5, 0], [4, 0.9], [4.5, 0], [5, -0.74], [5.5, 0], [6, 0.6], [6.5, 0], [7, -0.49], [7.5, 0], [8, 0.41], [8.5, 0], [9, -0.33], [9.5, 0], [10, 0.27]], "color": "#2563eb", "label": "Underdamped", "dashed": false}], "points": []}}'::jsonb),
('e1000000-0000-0000-0002-000000000012', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000033", "question_text": "In the graph above, the underdamped oscillation shows decreasing amplitude over time. The envelope of this decay follows what mathematical function?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "Linear: $A(t) = A_0 - ct$"}, {"id": "b", "text": "Exponential: $A(t) = A_0 e^{-\\gamma t}$"}, {"id": "c", "text": "Quadratic: $A(t) = A_0/(1+t^2)$"}, {"id": "d", "text": "Logarithmic: $A(t) = A_0 \\ln(t)$"}], "correct_ids": ["b"], "explanation": "The amplitude envelope of a damped oscillator decays exponentially: $A(t) = A_0 e^{-\\gamma t}$, where $\\gamma = b/(2m)$. This comes from solving the differential equation $m\\ddot{x} + b\\dot{x} + kx = 0$.", "option_explanations": {"a": "Linear decay would reach zero in finite time and go negative — physically wrong.", "b": "Correct. Exponential decay is the signature of damping proportional to velocity.", "c": "This type of decay (Lorentzian) doesn''t arise from linear damping.", "d": "Logarithmic functions diverge at $t = 0$ and grow at large $t$ — opposite of what we need."}, "difficulty": 3, "tags": ["damped oscillation"]}')::jsonb),
('e1000000-0000-0000-0002-000000000012', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000034", "question_text": "Resonance occurs when the driving frequency is approximately equal to the system''s ___.", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Resonance occurs when $\\omega_d \\approx \\omega_0$, where $\\omega_0$ is the natural (or resonant) frequency of the system. At resonance, the amplitude of oscillation reaches its maximum.", "acceptable_answers": ["natural frequency", "resonant frequency", "ω₀", "omega_0", "ω0"], "match_mode": "contains", "difficulty": 2, "tags": ["resonance", "driven oscillation"]}')::jsonb);


-- ============================================================
-- LESSON 13: Wave Mechanics
-- Steps: read, embed, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000013',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'Wave Mechanics',
  '',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e1000000-0000-0000-0003-000000000035',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000013',
  'c0000000-0000-0000-0000-000000000001',
  'Match each wave property to its definition:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Wavelength is the spatial period, frequency is the temporal rate of oscillation (measured in hertz), amplitude is the peak displacement, and wave number $k = 2\pi/\lambda$ converts wavelength to angular units.',
  2,
  'creator_original',
  '[{"left": "Wavelength (λ)", "right": "Distance between consecutive identical points on the wave"}, {"left": "Frequency (f)", "right": "Number of complete cycles per second"}, {"left": "Amplitude (A)", "right": "Maximum displacement from equilibrium"}, {"left": "Wave number (k)", "right": "2π divided by the wavelength"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000036',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000013',
  'c0000000-0000-0000-0000-000000000001',
  'A sound wave in air has a frequency of 440 Hz (concert A) and travels at 343 m/s. What is its wavelength?',
  'multiple_choice',
  '[{"id": "a", "text": "$0.78\\;\\text{m}$"}, {"id": "b", "text": "$1.28\\;\\text{m}$"}, {"id": "c", "text": "$150,920\\;\\text{m}$"}, {"id": "d", "text": "$7.8\\;\\text{m}$"}]'::jsonb,
  ARRAY['a'],
  '$\lambda = v/f = 343/440 \approx 0.78\;\text{m}$, or about 78 cm. This is roughly the size of a violin.',
  2,
  'creator_original',
  '{"a": "Correct: $\\lambda = 343/440 \\approx 0.78\\;\\text{m}$.", "b": "Check your division — $343/440 \\neq 1.28$.", "c": "This is $v \\times f$, not $v/f$.", "d": "Off by a factor of 10 — double-check your calculation."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000037',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000004',
  'e1000000-0000-0000-0002-000000000013',
  'c0000000-0000-0000-0000-000000000001',
  'When two identical waves traveling in opposite directions create a standing wave, the points of zero displacement are called:',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Nodes are points on a standing wave where destructive interference always produces zero displacement. The points of maximum displacement are called antinodes. On a guitar string, the fixed ends are always nodes.',
  1,
  'creator_original',
  ARRAY['nodes', 'node', 'Nodes'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000013', 0, 'read', '{"markdown": "## Mechanical Waves\n\nA **wave** is a disturbance that propagates through a medium (or through space for electromagnetic waves) carrying energy without transporting matter.\n\n**Wave equation:**\n$$v = f\\lambda$$\n\nwhere $v$ is the wave speed, $f$ is frequency, and $\\lambda$ is wavelength.\n\n**Transverse waves:** the displacement is perpendicular to the direction of propagation (e.g., waves on a string, light waves).\n\n**Longitudinal waves:** the displacement is parallel to the propagation direction (e.g., sound waves, compression springs).\n\n**A sinusoidal traveling wave:**\n$$y(x,t) = A\\sin(kx - \\omega t)$$\n\nwhere $k = 2\\pi/\\lambda$ is the wave number and $\\omega = 2\\pi f$ is the angular frequency.\n\n**Superposition:** When two waves overlap, their displacements add:\n- **Constructive interference:** waves in phase → larger amplitude\n- **Destructive interference:** waves out of phase → smaller amplitude\n\n**Standing waves** form when two identical waves travel in opposite directions. Nodes (zero displacement) and antinodes (maximum displacement) appear at fixed positions."}'::jsonb),
('e1000000-0000-0000-0002-000000000013', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  A[\"Mechanical Waves\"] --> B[\"Transverse\"]\n  A --> C[\"Longitudinal\"]\n  B --> B1[\"Displacement ⊥ propagation\"]\n  B --> B2[\"Examples: string, light, water surface\"]\n  C --> C1[\"Displacement ∥ propagation\"]\n  C --> C2[\"Examples: sound, compression spring\"]\n  A --> D[\"Key relation: v = fλ\"]"}'::jsonb),
('e1000000-0000-0000-0002-000000000013', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000035", "question_text": "Match each wave property to its definition:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "Wavelength is the spatial period, frequency is the temporal rate of oscillation (measured in hertz), amplitude is the peak displacement, and wave number $k = 2\\pi/\\lambda$ converts wavelength to angular units.", "matching_pairs": [{"left": "Wavelength (λ)", "right": "Distance between consecutive identical points on the wave"}, {"left": "Frequency (f)", "right": "Number of complete cycles per second"}, {"left": "Amplitude (A)", "right": "Maximum displacement from equilibrium"}, {"left": "Wave number (k)", "right": "2π divided by the wavelength"}], "difficulty": 2, "tags": ["wave properties"]}')::jsonb),
('e1000000-0000-0000-0002-000000000013', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000036", "question_text": "A sound wave in air has a frequency of 440 Hz (concert A) and travels at 343 m/s. What is its wavelength?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$0.78\\;\\text{m}$"}, {"id": "b", "text": "$1.28\\;\\text{m}$"}, {"id": "c", "text": "$150,920\\;\\text{m}$"}, {"id": "d", "text": "$7.8\\;\\text{m}$"}], "correct_ids": ["a"], "explanation": "$\\lambda = v/f = 343/440 \\approx 0.78\\;\\text{m}$, or about 78 cm. This is roughly the size of a violin.", "option_explanations": {"a": "Correct: $\\lambda = 343/440 \\approx 0.78\\;\\text{m}$.", "b": "Check your division — $343/440 \\neq 1.28$.", "c": "This is $v \\times f$, not $v/f$.", "d": "Off by a factor of 10 — double-check your calculation."}, "difficulty": 2, "tags": ["wave equation", "sound"]}')::jsonb),
('e1000000-0000-0000-0002-000000000013', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000037", "question_text": "When two identical waves traveling in opposite directions create a standing wave, the points of zero displacement are called:", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Nodes are points on a standing wave where destructive interference always produces zero displacement. The points of maximum displacement are called antinodes. On a guitar string, the fixed ends are always nodes.", "acceptable_answers": ["nodes", "node", "Nodes"], "match_mode": "exact", "difficulty": 1, "tags": ["standing waves", "nodes"]}')::jsonb);


-- ============================================================
-- MODULE 5: Special Relativity
-- ============================================================

-- ============================================================
-- LESSON 14: Postulates and Time Dilation
-- Steps: read, callout, embed, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000014',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'Postulates and Time Dilation',
  '',
  0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000038',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000014',
  'c0000000-0000-0000-0000-000000000001',
  'A spaceship travels at $v = 0.6c$ relative to Earth. On the ship, a process takes 10 seconds (proper time). How long does it take as measured from Earth?',
  'multiple_choice',
  '[{"id": "a", "text": "$8\\;\\text{s}$"}, {"id": "b", "text": "$10\\;\\text{s}$"}, {"id": "c", "text": "$12.5\\;\\text{s}$"}, {"id": "d", "text": "$16.7\\;\\text{s}$"}]'::jsonb,
  ARRAY['c'],
  '$\gamma = 1/\sqrt{1 - 0.36} = 1/\sqrt{0.64} = 1/0.8 = 1.25$. So $\Delta t = \gamma \Delta t_0 = 1.25 \times 10 = 12.5\;\text{s}$. The Earth observer sees the process taking longer.',
  3,
  'creator_original',
  '{"a": "This would be $\\Delta t_0 / \\gamma$ — time dilation makes the time *longer*, not shorter, for the external observer.", "b": "The times are only equal if $v = 0$.", "c": "Correct: $\\gamma = 1.25$, so $\\Delta t = 1.25 \\times 10 = 12.5$ s.", "d": "This would be $\\gamma \\approx 1.67$, which corresponds to $v \\approx 0.8c$."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000039',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000014',
  'c0000000-0000-0000-0000-000000000001',
  'At what fraction of the speed of light does $\gamma = 2$? $v/c \approx$ ___',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Setting $\gamma = 2$: $2 = 1/\sqrt{1 - v^2/c^2}$, so $\sqrt{1 - v^2/c^2} = 0.5$, giving $1 - v^2/c^2 = 0.25$, thus $v^2/c^2 = 0.75$ and $v/c = \sqrt{0.75} \approx 0.866$.',
  3,
  'creator_original',
  ARRAY['0.87', '0.866', '0.87c', '87%'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000014', 0, 'read', '{"markdown": "## Einstein''s Special Relativity\n\nIn 1905, Albert Einstein proposed two postulates that revolutionized physics:\n\n1. **The Principle of Relativity:** The laws of physics are the same in all inertial reference frames.\n2. **The Constancy of the Speed of Light:** The speed of light in vacuum, $c = 3 \\times 10^8\\;\\text{m/s}$, is the same for all observers, regardless of their relative motion.\n\nThese seemingly simple statements have radical consequences.\n\n## Time Dilation\n\nA clock moving relative to an observer ticks more slowly. If a clock at rest measures a time interval $\\Delta t_0$ (called the **proper time**), a moving observer measures:\n\n$$\\Delta t = \\gamma \\Delta t_0$$\n\nwhere the **Lorentz factor** is:\n\n$$\\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$$\n\nAt everyday speeds, $\\gamma \\approx 1$ and the effect is negligible. But at $v = 0.87c$, $\\gamma = 2$ — the moving clock runs at half speed! As $v \\to c$, $\\gamma \\to \\infty$.\n\nThis is not an illusion — time dilation is real and experimentally verified. Muons created in the upper atmosphere live long enough to reach Earth''s surface *only because* time dilation extends their lifetime in our frame."}'::jsonb),
('e1000000-0000-0000-0002-000000000014', 1, 'callout', '{"callout_style": "key_concept", "title": "Proper Time", "markdown": "**Proper time** ($\\Delta t_0$) is the time interval measured by a clock that is present at both events (start and end) — i.e., the clock is in the same location as the events. It is always the **shortest** measured time interval. All other observers measure a *longer* (dilated) time."}'::jsonb),
('e1000000-0000-0000-0002-000000000014', 2, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 100], "y_range": [0, 10], "step": 10, "x_label": "Speed (% of c)", "y_label": "Lorentz factor γ", "title": "Lorentz Factor vs Speed", "functions": [{"points": [[0, 1], [10, 1.005], [20, 1.02], [30, 1.048], [40, 1.091], [50, 1.155], [60, 1.25], [70, 1.4], [80, 1.667], [85, 1.898], [90, 2.294], [95, 3.203], [99, 7.089]], "color": "#2563eb", "label": "γ = 1/√(1−v²/c²)", "dashed": false}], "points": [{"x": 87, "y": 2, "label": "γ = 2 at 0.87c", "color": "#dc2626"}]}}'::jsonb),
('e1000000-0000-0000-0002-000000000014', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000038", "question_text": "A spaceship travels at $v = 0.6c$ relative to Earth. On the ship, a process takes 10 seconds (proper time). How long does it take as measured from Earth?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$8\\;\\text{s}$"}, {"id": "b", "text": "$10\\;\\text{s}$"}, {"id": "c", "text": "$12.5\\;\\text{s}$"}, {"id": "d", "text": "$16.7\\;\\text{s}$"}], "correct_ids": ["c"], "explanation": "$\\gamma = 1/\\sqrt{1 - 0.36} = 1/\\sqrt{0.64} = 1/0.8 = 1.25$. So $\\Delta t = \\gamma \\Delta t_0 = 1.25 \\times 10 = 12.5\\;\\text{s}$. The Earth observer sees the process taking longer.", "option_explanations": {"a": "This would be $\\Delta t_0 / \\gamma$ — time dilation makes the time *longer*, not shorter, for the external observer.", "b": "The times are only equal if $v = 0$.", "c": "Correct: $\\gamma = 1.25$, so $\\Delta t = 1.25 \\times 10 = 12.5$ s.", "d": "This would be $\\gamma \\approx 1.67$, which corresponds to $v \\approx 0.8c$."}, "difficulty": 3, "tags": ["time dilation", "Lorentz factor"]}')::jsonb),
('e1000000-0000-0000-0002-000000000014', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000039", "question_text": "At what fraction of the speed of light does $\\gamma = 2$? $v/c \\approx$ ___", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Setting $\\gamma = 2$: $2 = 1/\\sqrt{1 - v^2/c^2}$, so $\\sqrt{1 - v^2/c^2} = 0.5$, giving $1 - v^2/c^2 = 0.25$, thus $v^2/c^2 = 0.75$ and $v/c = \\sqrt{0.75} \\approx 0.866$.", "acceptable_answers": ["0.87", "0.866", "0.87c", "87%"], "match_mode": "exact", "difficulty": 3, "tags": ["Lorentz factor"]}')::jsonb);


-- ============================================================
-- LESSON 15: Length Contraction
-- Steps: read, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000015',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'Length Contraction',
  '',
  1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, diagram_data)
VALUES (
  'e1000000-0000-0000-0003-000000000040',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000015',
  'c0000000-0000-0000-0000-000000000001',
  'Which quantity represents the longest measured length of an object?',
  'diagram',
  '[{"id": "a", "text": "Proper length $L_0$ (measured at rest)"}, {"id": "b", "text": "Contracted length $L = L_0/\\gamma$"}, {"id": "c", "text": "They are always equal"}, {"id": "d", "text": "It depends on the observer''s velocity"}]'::jsonb,
  ARRAY['a'],
  'The proper length (rest length) is always the longest. All observers moving relative to the object measure a shorter length due to length contraction.',
  2,
  'creator_original',
  '{"x_range": [0, 100], "y_range": [0, 110], "step": 10, "x_label": "Speed (% of c)", "y_label": "Observed Length (m)", "functions": [{"points": [[0, 100], [20, 98], [40, 92], [60, 80], [70, 71], [80, 60], [90, 44], [95, 31], [99, 14]], "color": "#2563eb", "label": "L = L₀√(1−v²/c²)"}], "points": [{"x": 0, "y": 100, "label": "Proper length L₀", "color": "#16a34a"}]}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000041',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000015',
  'c0000000-0000-0000-0000-000000000001',
  'A meter stick moves past you at $0.6c$. What length do you measure?',
  'multiple_choice',
  '[{"id": "a", "text": "$0.6\\;\\text{m}$"}, {"id": "b", "text": "$0.8\\;\\text{m}$"}, {"id": "c", "text": "$1.0\\;\\text{m}$"}, {"id": "d", "text": "$1.25\\;\\text{m}$"}]'::jsonb,
  ARRAY['b'],
  '$L = L_0\sqrt{1 - v^2/c^2} = 1.0 \times \sqrt{1 - 0.36} = \sqrt{0.64} = 0.8\;\text{m}$.',
  2,
  'creator_original',
  '{"a": "This is $L_0 \\times v/c$, not $L_0\\sqrt{1 - v^2/c^2}$.", "b": "Correct: $L = 1.0 \\times \\sqrt{0.64} = 0.8\\;\\text{m}$.", "c": "This would mean no contraction — only true at $v = 0$.", "d": "Length contracts (gets shorter), it doesn''t expand."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES (
  'e1000000-0000-0000-0003-000000000042',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000015',
  'c0000000-0000-0000-0000-000000000001',
  'Length contraction occurs in all three spatial dimensions.',
  'true_false',
  '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
  ARRAY['b'],
  'Length contraction occurs **only** along the direction of motion. Dimensions perpendicular to the motion are unaffected. A sphere moving at high speed would appear flattened into an ellipsoid (though visual appearance is more complex due to light travel time effects).',
  2,
  'creator_original'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000015', 0, 'read', '{"markdown": "## Length Contraction\n\nJust as time dilates, **lengths contract** in the direction of motion. An object of proper length $L_0$ (measured at rest) appears shorter to an observer who sees it moving:\n\n$$L = \\frac{L_0}{\\gamma} = L_0\\sqrt{1 - \\frac{v^2}{c^2}}$$\n\n**Key points:**\n- Contraction occurs **only** along the direction of motion — perpendicular dimensions are unchanged\n- The **proper length** $L_0$ is measured in the frame where the object is at rest\n- $L < L_0$ always (moving objects are shorter)\n- At $v = 0.87c$, $L = L_0/2$ — the object appears half its rest length\n\n**Example:** A spaceship has a rest length of 100 m and travels at $0.8c$.\n$$\\gamma = 1/\\sqrt{1 - 0.64} = 1/0.6 = 5/3$$\n$$L = 100/\\gamma = 100 \\times 0.6 = 60\\;\\text{m}$$\n\nAn Earth observer sees the spaceship as only 60 m long.\n\n**Muon example revisited:** In the muon''s frame, the muon lives its normal lifetime but the atmosphere is length-contracted — so the ground reaches the muon in time. Both frames agree on the outcome!"}'::jsonb),
('e1000000-0000-0000-0002-000000000015', 1, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000040", "question_text": "Which quantity represents the longest measured length of an object?", "question_type": "diagram", "options": [{"id": "a", "text": "Proper length $L_0$ (measured at rest)"}, {"id": "b", "text": "Contracted length $L = L_0/\\gamma$"}, {"id": "c", "text": "They are always equal"}, {"id": "d", "text": "It depends on the observer''s velocity"}], "correct_ids": ["a"], "explanation": "The proper length (rest length) is always the longest. All observers moving relative to the object measure a shorter length due to length contraction.", "diagram_data": {"x_range": [0, 100], "y_range": [0, 110], "step": 10, "x_label": "Speed (% of c)", "y_label": "Observed Length (m)", "functions": [{"points": [[0, 100], [20, 98], [40, 92], [60, 80], [70, 71], [80, 60], [90, 44], [95, 31], [99, 14]], "color": "#2563eb", "label": "L = L₀√(1−v²/c²)"}], "points": [{"x": 0, "y": 100, "label": "Proper length L₀", "color": "#16a34a"}]}, "difficulty": 2, "tags": ["length contraction"]}')::jsonb),
('e1000000-0000-0000-0002-000000000015', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000041", "question_text": "A meter stick moves past you at $0.6c$. What length do you measure?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$0.6\\;\\text{m}$"}, {"id": "b", "text": "$0.8\\;\\text{m}$"}, {"id": "c", "text": "$1.0\\;\\text{m}$"}, {"id": "d", "text": "$1.25\\;\\text{m}$"}], "correct_ids": ["b"], "explanation": "$L = L_0\\sqrt{1 - v^2/c^2} = 1.0 \\times \\sqrt{1 - 0.36} = \\sqrt{0.64} = 0.8\\;\\text{m}$.", "option_explanations": {"a": "This is $L_0 \\times v/c$, not $L_0\\sqrt{1 - v^2/c^2}$.", "b": "Correct: $L = 1.0 \\times \\sqrt{0.64} = 0.8\\;\\text{m}$.", "c": "This would mean no contraction — only true at $v = 0$.", "d": "Length contracts (gets shorter), it doesn''t expand."}, "difficulty": 2, "tags": ["length contraction"]}')::jsonb),
('e1000000-0000-0000-0002-000000000015', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000042", "question_text": "Length contraction occurs in all three spatial dimensions.", "question_type": "true_false", "options": [{"id": "a", "text": "True"}, {"id": "b", "text": "False"}], "correct_ids": ["b"], "explanation": "Length contraction occurs **only** along the direction of motion. Dimensions perpendicular to the motion are unaffected. A sphere moving at high speed would appear flattened into an ellipsoid (though visual appearance is more complex due to light travel time effects).", "difficulty": 2, "tags": ["length contraction"]}')::jsonb);


-- ============================================================
-- LESSON 16: Mass-Energy Equivalence
-- Steps: read, callout, answer, answer, answer
-- ============================================================
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES (
  'e1000000-0000-0000-0002-000000000016',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'Mass-Energy Equivalence',
  '',
  2
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e1000000-0000-0000-0003-000000000043',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000016',
  'c0000000-0000-0000-0000-000000000001',
  'How much rest energy is contained in 1 gram (0.001 kg) of matter?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  '$E = mc^2 = 0.001 \times (3 \times 10^8)^2 = 0.001 \times 9 \times 10^{16} = 9 \times 10^{13}\;\text{J} = 90\;\text{TJ}$. This is approximately the energy released by the atomic bomb dropped on Hiroshima.',
  2,
  'creator_original',
  ARRAY['9 × 10^13 J', '9e13 J', '9 × 10^13', '90 TJ', '9e13'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e1000000-0000-0000-0003-000000000044',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000016',
  'c0000000-0000-0000-0000-000000000001',
  'For a photon (massless particle), the energy-momentum relation simplifies to:',
  'multiple_choice',
  '[{"id": "a", "text": "$E = mc^2$"}, {"id": "b", "text": "$E = pc$"}, {"id": "c", "text": "$E = \\frac{1}{2}mv^2$"}, {"id": "d", "text": "$E = \\gamma mc^2$"}]'::jsonb,
  ARRAY['b'],
  'For a massless particle, $m = 0$, so $E^2 = (pc)^2 + (mc^2)^2$ becomes $E^2 = (pc)^2$, giving $E = pc$. Photons have energy and momentum despite having no mass.',
  3,
  'creator_original',
  '{"a": "This gives $E = 0$ for a massless particle, which is wrong — photons carry energy.", "b": "Correct. $E = pc$ for any massless particle traveling at $c$.", "c": "This is the classical KE formula and gives zero for massless particles.", "d": "$\\gamma$ is undefined for $v = c$ (division by zero)."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES (
  'e1000000-0000-0000-0003-000000000045',
  'e1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0001-000000000005',
  'e1000000-0000-0000-0002-000000000016',
  'c0000000-0000-0000-0000-000000000001',
  'At low velocities ($v \ll c$), the relativistic kinetic energy $(\gamma - 1)mc^2$ approximately reduces to the classical expression $\frac{1}{2}mv^2$.',
  'true_false',
  '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
  ARRAY['a'],
  'Using the binomial approximation for $v \ll c$: $\gamma \approx 1 + \frac{v^2}{2c^2}$, so $(\gamma - 1)mc^2 \approx \frac{v^2}{2c^2} \cdot mc^2 = \frac{1}{2}mv^2$. Special relativity correctly reduces to Newtonian mechanics at low speeds.',
  3,
  'creator_original'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e1000000-0000-0000-0002-000000000016', 0, 'read', '{"markdown": "## $E = mc^2$: Mass-Energy Equivalence\n\nPerhaps the most famous equation in physics, Einstein showed that mass and energy are interchangeable:\n\n$$E_0 = mc^2$$\n\nThis is the **rest energy** — the energy contained in an object''s mass even when it''s not moving. Because $c^2 \\approx 9 \\times 10^{16}\\;\\text{m}^2/\\text{s}^2$ is enormous, a small amount of mass contains a vast amount of energy.\n\n**Example:** 1 kg of matter, if fully converted to energy:\n$$E = 1 \\times (3 \\times 10^8)^2 = 9 \\times 10^{16}\\;\\text{J}$$\n\nThat''s roughly the energy output of a large power plant running for 3 years!\n\n**Relativistic total energy:**\n$$E = \\gamma mc^2$$\n\n**Relativistic kinetic energy:**\n$$KE = E - E_0 = (\\gamma - 1)mc^2$$\n\nAt low speeds, this reduces to the classical $KE = \\frac{1}{2}mv^2$.\n\n**The full energy-momentum relation:**\n$$E^2 = (pc)^2 + (mc^2)^2$$\n\nFor massless particles (photons): $E = pc$."}'::jsonb),
('e1000000-0000-0000-0002-000000000016', 1, 'callout', '{"callout_style": "key_concept", "title": "Why You Can''t Reach the Speed of Light", "markdown": "As $v \\to c$, $\\gamma \\to \\infty$, so the kinetic energy $(\\gamma - 1)mc^2 \\to \\infty$. You would need **infinite energy** to accelerate any massive object to the speed of light. This is why $c$ is the universal speed limit for objects with mass."}'::jsonb),
('e1000000-0000-0000-0002-000000000016', 2, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000043", "question_text": "How much rest energy is contained in 1 gram (0.001 kg) of matter?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "$E = mc^2 = 0.001 \\times (3 \\times 10^8)^2 = 0.001 \\times 9 \\times 10^{16} = 9 \\times 10^{13}\\;\\text{J} = 90\\;\\text{TJ}$. This is approximately the energy released by the atomic bomb dropped on Hiroshima.", "acceptable_answers": ["9 × 10^13 J", "9e13 J", "9 × 10^13", "90 TJ", "9e13"], "match_mode": "contains", "difficulty": 2, "tags": ["mass-energy equivalence"]}')::jsonb),
('e1000000-0000-0000-0002-000000000016', 3, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000044", "question_text": "For a photon (massless particle), the energy-momentum relation simplifies to:", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$E = mc^2$"}, {"id": "b", "text": "$E = pc$"}, {"id": "c", "text": "$E = \\frac{1}{2}mv^2$"}, {"id": "d", "text": "$E = \\gamma mc^2$"}], "correct_ids": ["b"], "explanation": "For a massless particle, $m = 0$, so $E^2 = (pc)^2 + (mc^2)^2$ becomes $E^2 = (pc)^2$, giving $E = pc$. Photons have energy and momentum despite having no mass.", "option_explanations": {"a": "This gives $E = 0$ for a massless particle, which is wrong — photons carry energy.", "b": "Correct. $E = pc$ for any massless particle traveling at $c$.", "c": "This is the classical KE formula and gives zero for massless particles.", "d": "$\\gamma$ is undefined for $v = c$ (division by zero)."}, "difficulty": 3, "tags": ["mass-energy equivalence", "photons"]}')::jsonb),
('e1000000-0000-0000-0002-000000000016', 4, 'answer', ('{"question_id": "e1000000-0000-0000-0003-000000000045", "question_text": "At low velocities ($v \\ll c$), the relativistic kinetic energy $(\\gamma - 1)mc^2$ approximately reduces to the classical expression $\\frac{1}{2}mv^2$.", "question_type": "true_false", "options": [{"id": "a", "text": "True"}, {"id": "b", "text": "False"}], "correct_ids": ["a"], "explanation": "Using the binomial approximation for $v \\ll c$: $\\gamma \\approx 1 + \\frac{v^2}{2c^2}$, so $(\\gamma - 1)mc^2 \\approx \\frac{v^2}{2c^2} \\cdot mc^2 = \\frac{1}{2}mv^2$. Special relativity correctly reduces to Newtonian mechanics at low speeds.", "difficulty": 3, "tags": ["mass-energy equivalence", "classical limit"]}')::jsonb);

