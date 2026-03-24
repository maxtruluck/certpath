-- Seed: College Algebra course with math + diagram questions
-- Uses existing creator (c0000000-...-0001) and new UUID prefix cb for algebra

-- Course (reuse existing creator)
INSERT INTO courses (id, creator_id, title, slug, description, category, difficulty, status, published_at, tags)
VALUES (
  'cb000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'College Algebra',
  'college-algebra',
  'Master the fundamentals of college algebra: functions, graphs, equations, and more. Interactive diagrams help you visualize key concepts.',
  'Mathematics',
  'intermediate',
  'published',
  now(),
  ARRAY['Mathematics', 'Academic']
) ON CONFLICT (id) DO NOTHING;

-- Modules
INSERT INTO modules (id, course_id, title, description, display_order, weight_percent) VALUES
  ('cb000000-0000-0000-0001-000000000001', 'cb000000-0000-0000-0000-000000000001', 'Linear Functions & Graphs',       'Slope, intercept, graphing lines',                    1, 30),
  ('cb000000-0000-0000-0001-000000000002', 'cb000000-0000-0000-0000-000000000001', 'Quadratic Functions',             'Parabolas, vertex form, factoring',                   2, 35),
  ('cb000000-0000-0000-0001-000000000003', 'cb000000-0000-0000-0000-000000000001', 'Systems of Equations',            'Solving systems by substitution and elimination',     3, 35)
ON CONFLICT (id) DO NOTHING;

-- Lessons
INSERT INTO lessons (id, course_id, module_id, title, body, display_order) VALUES
(
  'cb000000-0000-0000-0002-000000000001',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000001',
  'Understanding Slope and Intercept',
  '## What is Slope?

The **slope** of a line measures how steep it is. Given two points $(x_1, y_1)$ and $(x_2, y_2)$, the slope $m$ is:

$$m = \frac{y_2 - y_1}{x_2 - x_1}$$

A positive slope means the line goes up from left to right. A negative slope means it goes down.

## Slope-Intercept Form

Every line can be written as $y = mx + b$ where:
- $m$ is the slope
- $b$ is the y-intercept (where the line crosses the y-axis)

> **Example:** The line $y = 2x + 3$ has slope $2$ and y-intercept $3$.

## Graphing a Line

To graph $y = mx + b$:
1. Plot the y-intercept $(0, b)$
2. From that point, use the slope to find another point: go right 1, up $m$
3. Draw a straight line through both points',
  1
),
(
  'cb000000-0000-0000-0002-000000000002',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000002',
  'Parabolas and Vertex Form',
  '## The Standard Quadratic

A quadratic function has the form $f(x) = ax^2 + bx + c$. Its graph is a **parabola**.

- If $a > 0$, the parabola opens **upward**
- If $a < 0$, the parabola opens **downward**

## Vertex Form

The vertex form is $f(x) = a(x - h)^2 + k$, where $(h, k)$ is the vertex.

> **Example:** $f(x) = 2(x - 1)^2 - 3$ has vertex at $(1, -3)$ and opens upward.

## Finding the Vertex from Standard Form

Given $f(x) = ax^2 + bx + c$:

$$h = -\frac{b}{2a}, \quad k = f(h)$$

## The Discriminant

For $ax^2 + bx + c = 0$, the discriminant $\Delta = b^2 - 4ac$ tells us:
- $\Delta > 0$: two real roots
- $\Delta = 0$: one repeated root
- $\Delta < 0$: no real roots',
  1
),
(
  'cb000000-0000-0000-0002-000000000003',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000003',
  'Solving Systems of Equations',
  '## What is a System of Equations?

A system of equations is two or more equations with the same variables. The **solution** is the point(s) where all equations are satisfied simultaneously.

## Graphical Interpretation

Each linear equation represents a line. The solution is where the lines **intersect**.

- **One solution:** lines cross at exactly one point
- **No solution:** lines are parallel (same slope, different intercepts)
- **Infinite solutions:** lines are identical

## Substitution Method

1. Solve one equation for one variable
2. Substitute into the other equation
3. Solve and back-substitute

> **Example:** Solve $y = 2x + 1$ and $y = -x + 4$
> Set equal: $2x + 1 = -x + 4$, so $3x = 3$, $x = 1$, $y = 3$.
> Solution: $(1, 3)$

## Elimination Method

1. Multiply equations so one variable has opposite coefficients
2. Add equations to eliminate that variable
3. Solve and back-substitute',
  1
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Questions for Module 1: Linear Functions & Graphs
-- ============================================================

-- Q1: Standard MC with math in text
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active)
VALUES (
  'cb000000-0000-0000-0004-000000000001',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000001',
  'cb000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'What is the slope of the line $y = -3x + 7$?',
  'multiple_choice',
  '[{"id":"a","text":"$7$"},{"id":"b","text":"$-3$"},{"id":"c","text":"$3$"},{"id":"d","text":"$-7$"}]',
  '{"b"}',
  'In slope-intercept form $y = mx + b$, the coefficient of $x$ is the slope. Here $m = -3$.',
  2,
  true
) ON CONFLICT (id) DO NOTHING;

-- Q2: Diagram question - identify the line
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active, diagram_data)
VALUES (
  'cb000000-0000-0000-0004-000000000002',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000001',
  'cb000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Which equation matches the line shown in the diagram?',
  'diagram',
  '[{"id":"a","text":"$y = x + 1$"},{"id":"b","text":"$y = 2x + 1$"},{"id":"c","text":"$y = -x + 1$"},{"id":"d","text":"$y = 2x - 1$"}]',
  '{"b"}',
  'The line crosses the y-axis at $1$ (so $b = 1$) and rises 2 units for every 1 unit right (so $m = 2$). The equation is $y = 2x + 1$.',
  2,
  true,
  '{"x_range":[-4,4],"y_range":[-4,6],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-2,-3],[-1,-1],[0,1],[1,3],[2,5]],"color":"#2563eb","label":"?"}],"points":[{"x":0,"y":1,"label":"(0,1)","color":"#2563eb"},{"x":1,"y":3,"label":"(1,3)","color":"#2563eb"}]}'
) ON CONFLICT (id) DO NOTHING;

-- Q3: Fill blank with math
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, acceptable_answers, match_mode, explanation, difficulty, is_active)
VALUES (
  'cb000000-0000-0000-0004-000000000003',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000001',
  'cb000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Find the slope of the line passing through $(2, 5)$ and $(4, 11)$.',
  'fill_blank',
  '{"3"}',
  'exact',
  'Slope $m = \frac{11 - 5}{4 - 2} = \frac{6}{2} = 3$.',
  2,
  true
) ON CONFLICT (id) DO NOTHING;

-- Q4: Diagram - identify y-intercept from graph
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active, diagram_data)
VALUES (
  'cb000000-0000-0000-0004-000000000004',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000001',
  'cb000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'What is the y-intercept of the line shown?',
  'diagram',
  '[{"id":"a","text":"$-2$"},{"id":"b","text":"$0$"},{"id":"c","text":"$2$"},{"id":"d","text":"$-1$"}]',
  '{"a"}',
  'The y-intercept is where the line crosses the y-axis. Reading the graph, the line passes through $(0, -2)$, so the y-intercept is $-2$.',
  1,
  true,
  '{"x_range":[-4,4],"y_range":[-4,4],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-3,-3.5],[-2,-3],[-1,-2.5],[0,-2],[1,-1.5],[2,-1],[3,-0.5]],"color":"#dc2626"}],"points":[{"x":0,"y":-2,"label":"(0,?)","color":"#dc2626"}]}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Questions for Module 2: Quadratic Functions
-- ============================================================

-- Q5: Diagram - identify the parabola
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active, diagram_data)
VALUES (
  'cb000000-0000-0000-0004-000000000005',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000002',
  'cb000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'Which equation matches the parabola shown in the diagram?',
  'diagram',
  '[{"id":"a","text":"$f(x) = x^2 - 1$"},{"id":"b","text":"$f(x) = -x^2 + 1$"},{"id":"c","text":"$f(x) = x^2 + 1$"},{"id":"d","text":"$f(x) = (x-1)^2$"}]',
  '{"a"}',
  'The parabola opens upward ($a > 0$), has vertex at $(0, -1)$, and passes through $(-1, 0)$ and $(1, 0)$. This matches $f(x) = x^2 - 1$.',
  3,
  true,
  '{"x_range":[-4,4],"y_range":[-3,5],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-3,8],[-2.5,5.25],[-2,3],[-1.5,1.25],[-1,0],[-0.5,-0.75],[0,-1],[0.5,-0.75],[1,0],[1.5,1.25],[2,3],[2.5,5.25],[3,8]],"color":"#9333ea","label":"f(x)"}],"points":[{"x":0,"y":-1,"label":"vertex","color":"#9333ea"},{"x":-1,"y":0,"color":"#9333ea"},{"x":1,"y":0,"color":"#9333ea"}]}'
) ON CONFLICT (id) DO NOTHING;

-- Q6: MC about discriminant
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active)
VALUES (
  'cb000000-0000-0000-0004-000000000006',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000002',
  'cb000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'How many real roots does $2x^2 + 3x + 5 = 0$ have?',
  'multiple_choice',
  '[{"id":"a","text":"Two real roots"},{"id":"b","text":"One repeated root"},{"id":"c","text":"No real roots"},{"id":"d","text":"Cannot be determined"}]',
  '{"c"}',
  'The discriminant is $\Delta = b^2 - 4ac = 9 - 40 = -31$. Since $\Delta < 0$, there are no real roots.',
  3,
  true
) ON CONFLICT (id) DO NOTHING;

-- Q7: Find vertex (fill blank)
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, acceptable_answers, match_mode, explanation, difficulty, is_active)
VALUES (
  'cb000000-0000-0000-0004-000000000007',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000002',
  'cb000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'What is the x-coordinate of the vertex of $f(x) = x^2 - 6x + 8$?',
  'fill_blank',
  '{"3"}',
  'exact',
  'Using $h = -b/(2a) = -(-6)/(2 \cdot 1) = 6/2 = 3$. The vertex x-coordinate is $3$.',
  2,
  true
) ON CONFLICT (id) DO NOTHING;

-- Q8: Diagram - two parabolas comparison
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active, diagram_data)
VALUES (
  'cb000000-0000-0000-0004-000000000008',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000002',
  'cb000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'The diagram shows two functions. The blue curve is $f(x) = x^2$. What is the red dashed curve?',
  'diagram',
  '[{"id":"a","text":"$g(x) = x^2 + 2$"},{"id":"b","text":"$g(x) = (x-2)^2$"},{"id":"c","text":"$g(x) = 2x^2$"},{"id":"d","text":"$g(x) = x^2 - 2$"}]',
  '{"a"}',
  'The red curve has the same shape as $f(x) = x^2$ but is shifted up by 2 units. This is a vertical translation: $g(x) = x^2 + 2$.',
  3,
  true,
  '{"x_range":[-4,4],"y_range":[-2,8],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-3,9],[-2,4],[-1.5,2.25],[-1,1],[-0.5,0.25],[0,0],[0.5,0.25],[1,1],[1.5,2.25],[2,4],[3,9]],"color":"#2563eb","label":"f(x)"},{"points":[[-2,6],[-1.5,4.25],[-1,3],[-0.5,2.25],[0,2],[0.5,2.25],[1,3],[1.5,4.25],[2,6]],"color":"#dc2626","label":"g(x)","dashed":true}],"points":[{"x":0,"y":0,"label":"(0,0)","color":"#2563eb"},{"x":0,"y":2,"label":"(0,2)","color":"#dc2626"}]}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Questions for Module 3: Systems of Equations
-- ============================================================

-- Q9: Diagram - intersection of two lines
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active, diagram_data)
VALUES (
  'cb000000-0000-0000-0004-000000000009',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000003',
  'cb000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'The diagram shows two lines. What is the solution to this system of equations?',
  'diagram',
  '[{"id":"a","text":"$(1, 3)$"},{"id":"b","text":"$(2, 1)$"},{"id":"c","text":"$(3, 1)$"},{"id":"d","text":"$(0, 4)$"}]',
  '{"a"}',
  'The solution is the intersection point of the two lines. Reading the graph, both lines pass through $(1, 3)$.',
  2,
  true,
  '{"x_range":[-2,5],"y_range":[-2,6],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-1,-1],[0,1],[1,3],[2,5]],"color":"#2563eb","label":"y=2x+1"},{"points":[[-1,5],[0,4],[1,3],[2,2],[3,1]],"color":"#dc2626","label":"y=-x+4"}],"points":[{"x":1,"y":3,"label":"(1,3)","color":"#16a34a"}]}'
) ON CONFLICT (id) DO NOTHING;

-- Q10: MC about parallel lines
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active)
VALUES (
  'cb000000-0000-0000-0004-000000000010',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000003',
  'cb000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'The system $y = 3x + 2$ and $y = 3x - 1$ has:',
  'multiple_choice',
  '[{"id":"a","text":"One solution"},{"id":"b","text":"No solution (parallel lines)"},{"id":"c","text":"Infinitely many solutions"},{"id":"d","text":"Two solutions"}]',
  '{"b"}',
  'Both lines have slope $m = 3$ but different y-intercepts ($2$ and $-1$). Parallel lines never intersect, so there is no solution.',
  2,
  true
) ON CONFLICT (id) DO NOTHING;

-- Q11: Fill blank - solve system
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, acceptable_answers, match_mode, explanation, difficulty, is_active)
VALUES (
  'cb000000-0000-0000-0004-000000000011',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000003',
  'cb000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'Solve the system: $x + y = 5$ and $x - y = 1$. What is $x$?',
  'fill_blank',
  '{"3"}',
  'exact',
  'Adding the two equations: $2x = 6$, so $x = 3$. Then $y = 5 - 3 = 2$.',
  2,
  true
) ON CONFLICT (id) DO NOTHING;

-- Q12: Diagram - no solution visualization
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, is_active, diagram_data)
VALUES (
  'cb000000-0000-0000-0004-000000000012',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000003',
  'cb000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'How many solutions does the system shown in the diagram have?',
  'diagram',
  '[{"id":"a","text":"No solution"},{"id":"b","text":"One solution"},{"id":"c","text":"Two solutions"},{"id":"d","text":"Infinitely many"}]',
  '{"a"}',
  'The two lines are parallel -- they have the same slope but different y-intercepts. Parallel lines never intersect, so there is no solution.',
  2,
  true,
  '{"x_range":[-3,4],"y_range":[-2,6],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-2,-2],[-1,0],[0,2],[1,4],[2,6]],"color":"#2563eb","label":"y=2x+2"},{"points":[[-2,-3],[-1,-1],[0,1],[1,3],[2,5]],"color":"#dc2626","label":"y=2x+1","dashed":true}]}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Interactive Plot Point Questions
-- ============================================================

-- Q13: Plot the y-intercept of a line
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, explanation, difficulty, is_active, diagram_data, correct_point)
VALUES (
  'cb000000-0000-0000-0004-000000000013',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000001',
  'cb000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'The line $y = 2x - 3$ is shown. Tap on the graph to plot its y-intercept.',
  'plot_point',
  'The y-intercept is where $x = 0$. Substituting: $y = 2(0) - 3 = -3$. The y-intercept is $(0, -3)$.',
  2,
  true,
  '{"x_range":[-4,4],"y_range":[-5,5],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-1,-5],[0,-3],[1,-1],[2,1],[3,3],[4,5]],"color":"#2563eb","label":"y=2x-3"}]}',
  '{"x": 0, "y": -3, "tolerance": 0.5}'
) ON CONFLICT (id) DO NOTHING;

-- Q14: Plot the intersection of two lines
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, explanation, difficulty, is_active, diagram_data, correct_point)
VALUES (
  'cb000000-0000-0000-0004-000000000014',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000003',
  'cb000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'Two lines are shown: $y = x + 1$ (blue) and $y = -x + 3$ (red). Tap on the graph to plot where they intersect.',
  'plot_point',
  'Setting equal: $x + 1 = -x + 3$, so $2x = 2$, $x = 1$, $y = 2$. The intersection is $(1, 2)$.',
  2,
  true,
  '{"x_range":[-3,5],"y_range":[-2,5],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-2,-1],[-1,0],[0,1],[1,2],[2,3],[3,4]],"color":"#2563eb","label":"y=x+1"},{"points":[[-1,4],[0,3],[1,2],[2,1],[3,0],[4,-1]],"color":"#dc2626","label":"y=-x+3"}]}',
  '{"x": 1, "y": 2, "tolerance": 0.5}'
) ON CONFLICT (id) DO NOTHING;

-- Q15: Plot the vertex of a parabola
INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, explanation, difficulty, is_active, diagram_data, correct_point)
VALUES (
  'cb000000-0000-0000-0004-000000000015',
  'cb000000-0000-0000-0000-000000000001',
  'cb000000-0000-0000-0001-000000000002',
  'cb000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'The parabola $f(x) = (x - 2)^2 - 1$ is shown. Tap on the graph to plot its vertex.',
  'plot_point',
  'In vertex form $f(x) = a(x - h)^2 + k$, the vertex is $(h, k)$. Here $h = 2$ and $k = -1$, so the vertex is $(2, -1)$.',
  2,
  true,
  '{"x_range":[-2,6],"y_range":[-3,6],"step":1,"x_label":"x","y_label":"y","functions":[{"points":[[-1,8],[0,3],[0.5,1.25],[1,0],[1.5,-0.75],[2,-1],[2.5,-0.75],[3,0],[3.5,1.25],[4,3],[5,8]],"color":"#9333ea","label":"f(x)"}]}',
  '{"x": 2, "y": -1, "tolerance": 0.5}'
) ON CONFLICT (id) DO NOTHING;
