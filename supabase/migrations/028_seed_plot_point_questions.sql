-- Seed interactive plot_point questions for College Algebra

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
