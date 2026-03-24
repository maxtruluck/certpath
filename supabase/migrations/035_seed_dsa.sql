-- Seed: Data Structures & Algorithms
-- UUID prefix: e2
-- 5 modules, 17 lessons, 70 steps, 34 questions

-- ============================================================
-- COURSE
-- ============================================================
INSERT INTO courses (
  id, creator_id, title, slug, description, category, difficulty,
  status, published_at, is_free, price_cents, card_color, tags,
  estimated_duration, prerequisites, learning_objectives
) VALUES (
  'e2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Data Structures & Algorithms', 'data-structures-and-algorithms',
  'Master the building blocks of computer science: from arrays and linked lists through trees, graphs, and advanced algorithm design. Build the problem-solving skills needed for technical interviews and real-world software engineering.', 'Computer Science', 'advanced',
  'published', now(), true, 0, '#2563eb',
  ARRAY['Computer Science', 'Academic', 'STEM'], '45 hours',
  'Programming proficiency in at least one language (Python or JavaScript preferred), basic discrete math', ARRAY['Analyze time and space complexity using Big-O notation', 'Implement and apply fundamental data structures: arrays, linked lists, stacks, queues, trees, heaps, and graphs', 'Implement and analyze comparison and linear-time sorting algorithms', 'Apply dynamic programming and greedy strategies to optimization problems', 'Select appropriate data structures for specific problem requirements']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULES
-- ============================================================
INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES ('e2000000-0000-0000-0001-000000000001', 'e2000000-0000-0000-0000-000000000001', 'Complexity Analysis', 'The language of algorithm efficiency: Big-O notation, space complexity, and amortized analysis for understanding performance at scale.', 0, 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES ('e2000000-0000-0000-0001-000000000002', 'e2000000-0000-0000-0000-000000000001', 'Linear Structures', 'Arrays, linked lists, stacks, and queues — the fundamental building blocks of data organization with their operations and trade-offs.', 1, 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES ('e2000000-0000-0000-0001-000000000003', 'e2000000-0000-0000-0000-000000000001', 'Trees & Graphs', 'Hierarchical and network structures: binary search trees, balanced trees, heaps, and graph traversal algorithms.', 2, 25)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES ('e2000000-0000-0000-0001-000000000004', 'e2000000-0000-0000-0000-000000000001', 'Sorting & Searching', 'The classic algorithms: comparison sorts, linear-time sorts, and variations of binary search that power real-world systems.', 3, 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (id, course_id, title, description, display_order, weight_percent)
VALUES ('e2000000-0000-0000-0001-000000000005', 'e2000000-0000-0000-0000-000000000001', 'Dynamic Programming & Greedy', 'Advanced algorithm design: breaking problems into overlapping subproblems with DP, and making locally optimal choices with greedy strategies.', 4, 15)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MODULE 1: Complexity Analysis
-- ============================================================

-- LESSON 1: Big-O Notation
-- Steps: read, embed, answer, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000001', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000001', 'Big-O Notation', '', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e2000000-0000-0000-0003-000000000001',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000001',
  'e2000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'Order these complexity classes from FASTEST (best) to SLOWEST (worst):',
  'ordering',
  '[{"id": "a", "text": "$O(n \\log n)$"}, {"id": "b", "text": "$O(1)$"}, {"id": "c", "text": "$O(n^2)$"}, {"id": "d", "text": "$O(n)$"}, {"id": "e", "text": "$O(\\log n)$"}]'::jsonb,
  ARRAY[]::text[],
  'From fastest to slowest: $O(1) < O(\log n) < O(n) < O(n \log n) < O(n^2)$. Each step represents a significant increase in growth rate as input size increases.',
  2,
  'creator_original',
  ARRAY['b', 'e', 'd', 'a', 'c']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000002',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000001',
  'e2000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'What is the time complexity of this code?

```python
def find_pair(arr, target):
    for i in range(len(arr)):
        for j in range(len(arr)):
            if arr[i] + arr[j] == target:
                return (i, j)
    return None
```',
  'multiple_choice',
  '[{"id": "a", "text": "$O(n)$"}, {"id": "b", "text": "$O(n \\log n)$"}, {"id": "c", "text": "$O(n^2)$"}, {"id": "d", "text": "$O(2n)$"}]'::jsonb,
  ARRAY['c'],
  'Two nested loops, each iterating $n$ times, gives $n \times n = n^2$ iterations in the worst case. The early return doesn''t change the worst case (when no pair is found).',
  2,
  'creator_original',
  '{"a": "This would require a single pass — we have two nested loops.", "b": "$O(n \\log n)$ typically involves sorting or divide-and-conquer, not nested iteration.", "c": "Correct: two nested loops over $n$ elements = $O(n^2)$.", "d": "$O(2n) = O(n)$ — constants are dropped. And this isn''t $O(n)$ anyway."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000003',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000001',
  'e2000000-0000-0000-0002-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'What is the Big-O complexity of binary search on a sorted array of $n$ elements?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Binary search halves the search space at each step. After $k$ comparisons, the remaining space is $n/2^k$. We stop when $n/2^k = 1$, giving $k = \log_2 n$. Therefore binary search is $O(\log n)$.',
  2,
  'creator_original',
  ARRAY['O(log n)', 'O(logn)', 'O(log(n))', 'log n', 'logarithmic'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000001', 0, 'read', '{"markdown": "## Big-O Notation\n\nBig-O describes the **upper bound** on an algorithm''s growth rate as the input size $n$ increases. We care about the *asymptotic* behavior — what happens as $n \\to \\infty$.\n\n**Common complexity classes (fastest to slowest):**\n\n| Big-O | Name | Example |\n|-------|------|--------|\n| $O(1)$ | Constant | Array index access |\n| $O(\\log n)$ | Logarithmic | Binary search |\n| $O(n)$ | Linear | Single loop through array |\n| $O(n \\log n)$ | Linearithmic | Merge sort, heap sort |\n| $O(n^2)$ | Quadratic | Nested loops (bubble sort) |\n| $O(2^n)$ | Exponential | Brute-force subset enumeration |\n| $O(n!)$ | Factorial | Brute-force permutations |\n\n**Rules for determining Big-O:**\n1. Drop constants: $O(3n) = O(n)$\n2. Drop lower-order terms: $O(n^2 + n) = O(n^2)$\n3. Different inputs use different variables: searching two arrays of sizes $n$ and $m$ is $O(n + m)$, not $O(n)$\n\n**Formal definition:** $f(n) = O(g(n))$ means there exist constants $c > 0$ and $n_0$ such that $f(n) \\leq c \\cdot g(n)$ for all $n \\geq n_0$."}'::jsonb),
('e2000000-0000-0000-0002-000000000001', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 20], "y_range": [0, 400], "step": 5, "x_label": "Input size n", "y_label": "Operations", "title": "Growth Rate Comparison", "functions": [{"points": [[1, 1], [2, 1], [4, 1], [8, 1], [12, 1], [16, 1], [20, 1]], "color": "#16a34a", "label": "O(1)", "dashed": false}, {"points": [[1, 0], [2, 1], [4, 2], [8, 3], [12, 3.58], [16, 4], [20, 4.32]], "color": "#2563eb", "label": "O(log n)", "dashed": false}, {"points": [[1, 1], [2, 2], [4, 4], [8, 8], [12, 12], [16, 16], [20, 20]], "color": "#f59e0b", "label": "O(n)", "dashed": false}, {"points": [[1, 0], [2, 2], [4, 8], [8, 24], [12, 43], [16, 64], [20, 86]], "color": "#f97316", "label": "O(n log n)", "dashed": false}, {"points": [[1, 1], [2, 4], [4, 16], [8, 64], [12, 144], [16, 256], [20, 400]], "color": "#dc2626", "label": "O(n²)", "dashed": false}], "points": []}}'::jsonb),
('e2000000-0000-0000-0002-000000000001', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000001", "question_text": "Order these complexity classes from FASTEST (best) to SLOWEST (worst):", "question_type": "ordering", "options": [{"id": "a", "text": "$O(n \\log n)$"}, {"id": "b", "text": "$O(1)$"}, {"id": "c", "text": "$O(n^2)$"}, {"id": "d", "text": "$O(n)$"}, {"id": "e", "text": "$O(\\log n)$"}], "correct_ids": [], "explanation": "From fastest to slowest: $O(1) < O(\\log n) < O(n) < O(n \\log n) < O(n^2)$. Each step represents a significant increase in growth rate as input size increases.", "correct_order": ["b", "e", "d", "a", "c"], "difficulty": 2, "tags": ["Big-O", "complexity"]}')::jsonb),
('e2000000-0000-0000-0002-000000000001', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000002", "question_text": "What is the time complexity of this code?\n\n```python\ndef find_pair(arr, target):\n    for i in range(len(arr)):\n        for j in range(len(arr)):\n            if arr[i] + arr[j] == target:\n                return (i, j)\n    return None\n```", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$O(n)$"}, {"id": "b", "text": "$O(n \\log n)$"}, {"id": "c", "text": "$O(n^2)$"}, {"id": "d", "text": "$O(2n)$"}], "correct_ids": ["c"], "explanation": "Two nested loops, each iterating $n$ times, gives $n \\times n = n^2$ iterations in the worst case. The early return doesn''t change the worst case (when no pair is found).", "option_explanations": {"a": "This would require a single pass — we have two nested loops.", "b": "$O(n \\log n)$ typically involves sorting or divide-and-conquer, not nested iteration.", "c": "Correct: two nested loops over $n$ elements = $O(n^2)$.", "d": "$O(2n) = O(n)$ — constants are dropped. And this isn''t $O(n)$ anyway."}, "difficulty": 2, "tags": ["Big-O", "code analysis"]}')::jsonb),
('e2000000-0000-0000-0002-000000000001', 4, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000003", "question_text": "What is the Big-O complexity of binary search on a sorted array of $n$ elements?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Binary search halves the search space at each step. After $k$ comparisons, the remaining space is $n/2^k$. We stop when $n/2^k = 1$, giving $k = \\log_2 n$. Therefore binary search is $O(\\log n)$.", "acceptable_answers": ["O(log n)", "O(logn)", "O(log(n))", "log n", "logarithmic"], "match_mode": "contains", "difficulty": 2, "tags": ["binary search", "Big-O"]}')::jsonb);


-- LESSON 2: Space Complexity
-- Steps: read, callout, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000002', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000001', 'Space Complexity', '', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e2000000-0000-0000-0003-000000000004',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000001',
  'e2000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'Match each algorithm to its typical auxiliary space complexity:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Merge sort needs $O(n)$ for the temporary merge arrays. Heap sort is in-place. Iterative binary search uses only a few pointers. BFS maintains a queue that can hold up to $V$ vertices (all vertices in the worst case for a wide graph).',
  3,
  'creator_original',
  '[{"left": "Merge sort", "right": "O(n)"}, {"left": "Heap sort", "right": "O(1)"}, {"left": "Binary search (iterative)", "right": "O(1)"}, {"left": "BFS on a graph", "right": "O(V)"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000005',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000001',
  'e2000000-0000-0000-0002-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'A function creates a hash map with up to $n$ key-value pairs and also uses 5 temporary integer variables. What is its space complexity?',
  'multiple_choice',
  '[{"id": "a", "text": "$O(1)$"}, {"id": "b", "text": "$O(5)$"}, {"id": "c", "text": "$O(n)$"}, {"id": "d", "text": "$O(n + 5)$"}]'::jsonb,
  ARRAY['c'],
  'The hash map dominates at $O(n)$. The 5 integer variables are $O(1)$. By Big-O rules, $O(n + 5) = O(n + 1) = O(n)$. Constants and lower-order terms are always dropped.',
  2,
  'creator_original',
  '{"a": "The hash map grows with $n$ — this isn''t constant space.", "b": "$O(5) = O(1)$, and this ignores the hash map entirely.", "c": "Correct. The $O(n)$ hash map dominates the $O(1)$ variables.", "d": "Technically correct but not simplified. $O(n + 5) = O(n)$."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000002', 0, 'read', '{"markdown": "## Space Complexity\n\nSpace complexity measures the **additional memory** an algorithm uses relative to the input size. Like time complexity, we express it in Big-O notation.\n\n**What counts as space?**\n- Variables and data structures created during execution\n- Call stack depth for recursive algorithms\n- We typically analyze **auxiliary space** — extra memory beyond the input itself\n\n**Common patterns:**\n\n| Pattern | Space | Example |\n|---------|-------|---------|\n| Fixed variables | $O(1)$ | Swap two elements using a temp variable |\n| Copy of input | $O(n)$ | Creating a new sorted array |\n| 2D matrix | $O(n^2)$ | DP table for edit distance |\n| Recursive calls | $O(\\text{depth})$ | Each call adds a stack frame |\n\n**In-place algorithms** use $O(1)$ auxiliary space — they modify the input directly without allocating significant extra memory. Examples include insertion sort, heap sort, and partitioning in quicksort.\n\n**Space-time tradeoffs** are common: hash tables use $O(n)$ extra space to achieve $O(1)$ average lookup (vs. $O(n)$ lookup with $O(1)$ space using a simple list)."}'::jsonb),
('e2000000-0000-0000-0002-000000000002', 1, 'callout', '{"callout_style": "tip", "title": "Recursion and Stack Space", "markdown": "Every recursive call adds a frame to the call stack. A recursive function that makes $n$ nested calls uses $O(n)$ stack space, even if no arrays or objects are created. This is why a recursive Fibonacci implementation uses $O(n)$ space (stack depth) despite its $O(2^n)$ time complexity.\n\n**Tail recursion** can be optimized by some compilers to use $O(1)$ stack space, but many languages (Python, Java) don''t guarantee this optimization."}'::jsonb),
('e2000000-0000-0000-0002-000000000002', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000004", "question_text": "Match each algorithm to its typical auxiliary space complexity:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "Merge sort needs $O(n)$ for the temporary merge arrays. Heap sort is in-place. Iterative binary search uses only a few pointers. BFS maintains a queue that can hold up to $V$ vertices (all vertices in the worst case for a wide graph).", "matching_pairs": [{"left": "Merge sort", "right": "O(n)"}, {"left": "Heap sort", "right": "O(1)"}, {"left": "Binary search (iterative)", "right": "O(1)"}, {"left": "BFS on a graph", "right": "O(V)"}], "difficulty": 3, "tags": ["space complexity"]}')::jsonb),
('e2000000-0000-0000-0002-000000000002', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000005", "question_text": "A function creates a hash map with up to $n$ key-value pairs and also uses 5 temporary integer variables. What is its space complexity?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$O(1)$"}, {"id": "b", "text": "$O(5)$"}, {"id": "c", "text": "$O(n)$"}, {"id": "d", "text": "$O(n + 5)$"}], "correct_ids": ["c"], "explanation": "The hash map dominates at $O(n)$. The 5 integer variables are $O(1)$. By Big-O rules, $O(n + 5) = O(n + 1) = O(n)$. Constants and lower-order terms are always dropped.", "option_explanations": {"a": "The hash map grows with $n$ — this isn''t constant space.", "b": "$O(5) = O(1)$, and this ignores the hash map entirely.", "c": "Correct. The $O(n)$ hash map dominates the $O(1)$ variables.", "d": "Technically correct but not simplified. $O(n + 5) = O(n)$."}, "difficulty": 2, "tags": ["space complexity", "Big-O rules"]}')::jsonb);


-- LESSON 3: Amortized Analysis
-- Steps: read, callout, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000003', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000001', 'Amortized Analysis', '', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000006',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000001',
  'e2000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'A dynamic array starts with capacity 1 and doubles on overflow. After 8 appends, how many total element copies occurred during resizes?',
  'multiple_choice',
  '[{"id": "a", "text": "8"}, {"id": "b", "text": "7"}, {"id": "c", "text": "15"}, {"id": "d", "text": "4"}]'::jsonb,
  ARRAY['b'],
  'Resizes occur when inserting elements 2, 3, 5 (overflow at capacity 1→2→4→8). Copies: 1 + 2 + 4 = 7 total copies. The resize at element 2 copies 1 element, at element 3 copies 2, at element 5 copies 4.',
  3,
  'creator_original',
  '{"a": "This counts appends, not copies during resizes.", "b": "Correct: resizes copy 1 + 2 + 4 = 7 elements total.", "c": "This is $2^4 - 1$, which would be the sum if we resized one more time.", "d": "This counts the number of resizes, not the total copies."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000007',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000001',
  'e2000000-0000-0000-0002-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'The amortized time complexity of appending to a dynamic array that doubles capacity on resize is:',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Although individual resizes cost $O(n)$, the total cost over $n$ appends is $O(n)$, giving an amortized cost of $O(n)/n = O(1)$ per append. This is why `ArrayList.add()` in Java and `list.append()` in Python are considered $O(1)$ operations.',
  2,
  'creator_original',
  ARRAY['O(1)', 'constant', 'amortized O(1)'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000003', 0, 'read', '{"markdown": "## Amortized Analysis\n\n**Amortized analysis** finds the **average cost per operation** over a sequence of operations, even when individual operations have different costs. It gives a tighter bound than worst-case analysis when expensive operations are rare.\n\n### Example: Dynamic Array (ArrayList)\n\nA dynamic array doubles its capacity when full. Most `append()` operations are $O(1)$ — just write to the next slot. But occasionally the array is full, triggering a resize that copies all $n$ elements: $O(n)$.\n\n**Amortized cost of `append()`:**\n\nStarting with capacity 1, after $n$ appends, resizes happen at sizes 1, 2, 4, 8, ..., $n$. Total copy cost:\n$$1 + 2 + 4 + 8 + \\cdots + n = 2n - 1$$\n\nSo $n$ appends cost $O(n + (2n-1)) = O(3n) = O(n)$ total, giving an **amortized cost of $O(1)$ per append**.\n\n### Techniques\n\n**Aggregate method:** Total cost of $n$ operations divided by $n$.\n\n**Banker''s method:** Each cheap operation \"deposits\" extra credit that pays for future expensive operations.\n\n**Physicist''s method:** Define a potential function $\\Phi$ that tracks stored energy in the data structure."}'::jsonb),
('e2000000-0000-0000-0002-000000000003', 1, 'callout', '{"callout_style": "key_concept", "title": "Amortized ≠ Average Case", "markdown": "**Amortized** analysis guarantees that $n$ operations together cost at most $O(n \\cdot \\text{amortized cost})$ — no probability is involved. **Average case** analysis assumes a probability distribution over inputs. Amortized $O(1)$ per operation is a deterministic guarantee; average-case $O(1)$ depends on input distribution."}'::jsonb),
('e2000000-0000-0000-0002-000000000003', 2, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 16], "y_range": [0, 10], "step": 2, "x_label": "Append operation number", "y_label": "Cost of operation", "title": "Dynamic Array Append Costs", "functions": [{"points": [[1, 1], [2, 2], [3, 1], [4, 4], [5, 1], [6, 1], [7, 1], [8, 8], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 8]], "color": "#2563eb", "label": "Per-operation cost", "dashed": false}], "points": []}}'::jsonb),
('e2000000-0000-0000-0002-000000000003', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000006", "question_text": "A dynamic array starts with capacity 1 and doubles on overflow. After 8 appends, how many total element copies occurred during resizes?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "8"}, {"id": "b", "text": "7"}, {"id": "c", "text": "15"}, {"id": "d", "text": "4"}], "correct_ids": ["b"], "explanation": "Resizes occur when inserting elements 2, 3, 5 (overflow at capacity 1→2→4→8). Copies: 1 + 2 + 4 = 7 total copies. The resize at element 2 copies 1 element, at element 3 copies 2, at element 5 copies 4.", "option_explanations": {"a": "This counts appends, not copies during resizes.", "b": "Correct: resizes copy 1 + 2 + 4 = 7 elements total.", "c": "This is $2^4 - 1$, which would be the sum if we resized one more time.", "d": "This counts the number of resizes, not the total copies."}, "difficulty": 3, "tags": ["amortized analysis", "dynamic array"]}')::jsonb),
('e2000000-0000-0000-0002-000000000003', 4, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000007", "question_text": "The amortized time complexity of appending to a dynamic array that doubles capacity on resize is:", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Although individual resizes cost $O(n)$, the total cost over $n$ appends is $O(n)$, giving an amortized cost of $O(n)/n = O(1)$ per append. This is why `ArrayList.add()` in Java and `list.append()` in Python are considered $O(1)$ operations.", "acceptable_answers": ["O(1)", "constant", "amortized O(1)"], "match_mode": "contains", "difficulty": 2, "tags": ["amortized analysis", "dynamic array"]}')::jsonb);


-- ============================================================
-- MODULE 2: Linear Structures
-- ============================================================

-- LESSON 4: Arrays and Dynamic Arrays
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000004', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000002', 'Arrays and Dynamic Arrays', '', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000008',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'What is the time complexity of inserting an element at position 0 of a dynamic array of size $n$?',
  'multiple_choice',
  '[{"id": "a", "text": "$O(1)$"}, {"id": "b", "text": "$O(\\log n)$"}, {"id": "c", "text": "$O(n)$"}, {"id": "d", "text": "$O(n^2)$"}]'::jsonb,
  ARRAY['c'],
  'Inserting at position 0 requires shifting every existing element one position to the right, which takes $O(n)$ time. This is why inserting at the beginning of an array is expensive compared to appending at the end.',
  2,
  'creator_original',
  '{"a": "$O(1)$ insertion only applies to the end of a dynamic array (amortized).", "b": "No halving or doubling is involved in shifting elements.", "c": "Correct. All $n$ elements must shift right by one position.", "d": "Only one shift pass is needed — not nested operations."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000009',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'The primary advantage of arrays over linked lists is:',
  'multiple_choice',
  '[{"id": "a", "text": "Faster insertion at any position"}, {"id": "b", "text": "$O(1)$ random access by index"}, {"id": "c", "text": "Less memory usage per element"}, {"id": "d", "text": "Easier to resize"}]'::jsonb,
  ARRAY['b'],
  'Arrays support $O(1)$ random access because elements are stored contiguously and we can compute any address from the index. Linked lists require $O(n)$ traversal to reach element $i$.',
  1,
  'creator_original',
  '{"a": "Linked lists are actually faster for insertion when you have a pointer to the insertion point.", "b": "Correct. Direct index calculation gives $O(1)$ access — the defining advantage of arrays.", "c": "Actually, linked lists use more memory per element (due to pointers), so arrays *do* use less, but this isn''t the primary advantage.", "d": "Linked lists are generally easier to resize since they don''t need contiguous memory."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000004', 0, 'read', '{"markdown": "## Arrays\n\nAn **array** is a contiguous block of memory storing elements of the same type. Each element is accessed by its index in $O(1)$ time using pointer arithmetic:\n\n```\naddress(arr[i]) = base_address + i × element_size\n```\n\n**Static arrays** have fixed size determined at creation. **Dynamic arrays** (Python''s `list`, Java''s `ArrayList`, C++''s `vector`) automatically resize.\n\n**Time complexities:**\n\n| Operation | Static Array | Dynamic Array |\n|-----------|-------------|---------------|\n| Access by index | $O(1)$ | $O(1)$ |\n| Search (unsorted) | $O(n)$ | $O(n)$ |\n| Insert at end | N/A | $O(1)$ amortized |\n| Insert at index $i$ | N/A | $O(n)$ — shift elements |\n| Delete at index $i$ | N/A | $O(n)$ — shift elements |\n\n```python\n# Dynamic array operations in Python\narr = [10, 20, 30, 40, 50]\narr[2]          # O(1) access → 30\narr.append(60)  # O(1) amortized → [10, 20, 30, 40, 50, 60]\narr.insert(1, 15)  # O(n) → [10, 15, 20, 30, 40, 50, 60]\narr.pop()       # O(1) → removes 60\narr.pop(0)      # O(n) → removes 10, shifts everything\n```"}'::jsonb),
('e2000000-0000-0000-0002-000000000004', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph LR\n  subgraph \"Array Memory Layout\"\n    A[\"arr[0]<br>10\"] --- B[\"arr[1]<br>20\"] --- C[\"arr[2]<br>30\"] --- D[\"arr[3]<br>40\"] --- E[\"arr[4]<br>50\"]\n  end\n  F[\"Contiguous memory: O(1) access via index\"] -.-> A"}'::jsonb),
('e2000000-0000-0000-0002-000000000004', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000008", "question_text": "What is the time complexity of inserting an element at position 0 of a dynamic array of size $n$?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$O(1)$"}, {"id": "b", "text": "$O(\\log n)$"}, {"id": "c", "text": "$O(n)$"}, {"id": "d", "text": "$O(n^2)$"}], "correct_ids": ["c"], "explanation": "Inserting at position 0 requires shifting every existing element one position to the right, which takes $O(n)$ time. This is why inserting at the beginning of an array is expensive compared to appending at the end.", "option_explanations": {"a": "$O(1)$ insertion only applies to the end of a dynamic array (amortized).", "b": "No halving or doubling is involved in shifting elements.", "c": "Correct. All $n$ elements must shift right by one position.", "d": "Only one shift pass is needed — not nested operations."}, "difficulty": 2, "tags": ["arrays", "time complexity"]}')::jsonb),
('e2000000-0000-0000-0002-000000000004', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000009", "question_text": "The primary advantage of arrays over linked lists is:", "question_type": "multiple_choice", "options": [{"id": "a", "text": "Faster insertion at any position"}, {"id": "b", "text": "$O(1)$ random access by index"}, {"id": "c", "text": "Less memory usage per element"}, {"id": "d", "text": "Easier to resize"}], "correct_ids": ["b"], "explanation": "Arrays support $O(1)$ random access because elements are stored contiguously and we can compute any address from the index. Linked lists require $O(n)$ traversal to reach element $i$.", "option_explanations": {"a": "Linked lists are actually faster for insertion when you have a pointer to the insertion point.", "b": "Correct. Direct index calculation gives $O(1)$ access — the defining advantage of arrays.", "c": "Actually, linked lists use more memory per element (due to pointers), so arrays *do* use less, but this isn''t the primary advantage.", "d": "Linked lists are generally easier to resize since they don''t need contiguous memory."}, "difficulty": 1, "tags": ["arrays", "data structures comparison"]}')::jsonb);


-- LESSON 5: Linked Lists
-- Steps: read, embed, answer, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000005', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000002', 'Linked Lists', '', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e2000000-0000-0000-0003-000000000010',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000005',
  'c0000000-0000-0000-0000-000000000001',
  'Put the steps for inserting a new node after a given node `prev` in a singly linked list in the correct order:',
  'ordering',
  '[{"id": "a", "text": "Create the new node with the desired data"}, {"id": "b", "text": "Set new_node.next = prev.next"}, {"id": "c", "text": "Set prev.next = new_node"}]'::jsonb,
  ARRAY[]::text[],
  'Order matters! You must first create the node (a), then link it to the rest of the list (b), and finally update the previous node''s pointer (c). If you did (c) before (b), you would lose the reference to the rest of the list.',
  2,
  'creator_original',
  ARRAY['a', 'b', 'c']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000011',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000005',
  'c0000000-0000-0000-0000-000000000001',
  'What is the time complexity of accessing the $k$-th element in a singly linked list of $n$ nodes?',
  'multiple_choice',
  '[{"id": "a", "text": "$O(1)$"}, {"id": "b", "text": "$O(k)$"}, {"id": "c", "text": "$O(n)$"}, {"id": "d", "text": "$O(\\log n)$"}]'::jsonb,
  ARRAY['b'],
  'You must traverse from the head through $k$ nodes, following `next` pointers. This takes $O(k)$ time. In the worst case ($k = n$), this is $O(n)$. There is no random access — you can''t jump directly to index $k$.',
  2,
  'creator_original',
  '{"a": "Only arrays support $O(1)$ random access.", "b": "Correct. Traversing $k$ nodes requires $k$ pointer follows.", "c": "This is the worst case. The precise answer is $O(k)$, which is $O(n)$ only when $k = n$.", "d": "There''s no halving mechanism — we traverse one node at a time."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000012',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000005',
  'c0000000-0000-0000-0000-000000000001',
  'In a doubly linked list, each node has pointers to both its ___ and ___ neighbors.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'A doubly linked list node has two pointers: `next` (pointing to the following node) and `prev` or `previous` (pointing to the preceding node). This allows $O(1)$ traversal in both directions and $O(1)$ deletion when you have a reference to the node.',
  1,
  'creator_original',
  ARRAY['next and previous', 'previous and next', 'next and prev', 'prev and next'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000005', 0, 'read', '{"markdown": "## Linked Lists\n\nA **linked list** is a sequence of nodes, each containing data and a pointer (reference) to the next node. Unlike arrays, nodes are **not stored contiguously** in memory.\n\n```python\nclass Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None  # pointer to next node\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n```\n\n**Types:**\n- **Singly linked:** each node points to the next\n- **Doubly linked:** each node points to both next and previous\n- **Circular:** the last node points back to the first\n\n**Time complexities:**\n\n| Operation | Time |\n|-----------|------|\n| Access by index | $O(n)$ — must traverse |\n| Insert/delete at head | $O(1)$ |\n| Insert/delete at tail (singly) | $O(n)$ — must find tail |\n| Insert/delete at tail (doubly) | $O(1)$ — tail pointer |\n| Search | $O(n)$ |\n\n**Key advantage:** Insertion and deletion at known positions are $O(1)$ — no shifting required. This makes linked lists ideal for queues, LRU caches, and undo histories."}'::jsonb),
('e2000000-0000-0000-0002-000000000005', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph LR\n  H[\"head\"] --> A[\"Node A<br>data: 10\"]\n  A -->|next| B[\"Node B<br>data: 20\"]\n  B -->|next| C[\"Node C<br>data: 30\"]\n  C -->|next| D[\"null\"]\n  style H fill:#f59e0b,color:#000\n  style D fill:#94a3b8,color:#000"}'::jsonb),
('e2000000-0000-0000-0002-000000000005', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000010", "question_text": "Put the steps for inserting a new node after a given node `prev` in a singly linked list in the correct order:", "question_type": "ordering", "options": [{"id": "a", "text": "Create the new node with the desired data"}, {"id": "b", "text": "Set new_node.next = prev.next"}, {"id": "c", "text": "Set prev.next = new_node"}], "correct_ids": [], "explanation": "Order matters! You must first create the node (a), then link it to the rest of the list (b), and finally update the previous node''s pointer (c). If you did (c) before (b), you would lose the reference to the rest of the list.", "correct_order": ["a", "b", "c"], "difficulty": 2, "tags": ["linked list", "insertion"]}')::jsonb),
('e2000000-0000-0000-0002-000000000005', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000011", "question_text": "What is the time complexity of accessing the $k$-th element in a singly linked list of $n$ nodes?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$O(1)$"}, {"id": "b", "text": "$O(k)$"}, {"id": "c", "text": "$O(n)$"}, {"id": "d", "text": "$O(\\log n)$"}], "correct_ids": ["b"], "explanation": "You must traverse from the head through $k$ nodes, following `next` pointers. This takes $O(k)$ time. In the worst case ($k = n$), this is $O(n)$. There is no random access — you can''t jump directly to index $k$.", "option_explanations": {"a": "Only arrays support $O(1)$ random access.", "b": "Correct. Traversing $k$ nodes requires $k$ pointer follows.", "c": "This is the worst case. The precise answer is $O(k)$, which is $O(n)$ only when $k = n$.", "d": "There''s no halving mechanism — we traverse one node at a time."}, "difficulty": 2, "tags": ["linked list", "time complexity"]}')::jsonb),
('e2000000-0000-0000-0002-000000000005', 4, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000012", "question_text": "In a doubly linked list, each node has pointers to both its ___ and ___ neighbors.", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "A doubly linked list node has two pointers: `next` (pointing to the following node) and `prev` or `previous` (pointing to the preceding node). This allows $O(1)$ traversal in both directions and $O(1)$ deletion when you have a reference to the node.", "acceptable_answers": ["next and previous", "previous and next", "next and prev", "prev and next"], "match_mode": "contains", "difficulty": 1, "tags": ["doubly linked list"]}')::jsonb);


-- LESSON 6: Stacks
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000006', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000002', 'Stacks', '', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e2000000-0000-0000-0003-000000000013',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000006',
  'c0000000-0000-0000-0000-000000000001',
  'Match each stack application to its description:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Stacks naturally model any situation where you need to reverse order or backtrack: matching brackets requires checking the most recent opening bracket, undo reverses the most recent action, and DFS explores the most recently discovered path.',
  2,
  'creator_original',
  '[{"left": "Balanced brackets", "right": "Push opening brackets, pop and match on closing"}, {"left": "Undo feature", "right": "Push each action, pop to reverse the last one"}, {"left": "DFS traversal", "right": "Push unvisited neighbors, pop to backtrack"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000014',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000006',
  'c0000000-0000-0000-0000-000000000001',
  'You push the following elements onto a stack in order: A, B, C, D. You then pop twice. What element is now on top?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'After pushing A, B, C, D, the stack from bottom to top is: [A, B, C, D]. First pop removes D, second pop removes C. The top is now B.',
  1,
  'creator_original',
  ARRAY['B', 'b'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000006', 0, 'read', '{"markdown": "## Stacks: Last In, First Out (LIFO)\n\nA **stack** is an abstract data type where elements are added and removed from the same end, called the **top**. Think of a stack of plates: the last plate placed on top is the first one you remove.\n\n**Core operations (all $O(1)$):**\n- `push(item)` — add item to the top\n- `pop()` — remove and return the top item\n- `peek()` / `top()` — view the top item without removing it\n- `isEmpty()` — check if the stack is empty\n\n```python\n# Stack using Python list\nstack = []\nstack.append(10)   # push\nstack.append(20)   # push\nstack.append(30)   # push\ntop = stack.pop()  # pop → 30 (LIFO)\n```\n\n**Common applications:**\n- **Function call stack** — the runtime uses a stack to track function calls and local variables\n- **Undo/Redo** — push actions onto the stack, pop to undo\n- **Balanced parentheses checking** — push opening brackets, pop and match when closing brackets appear\n- **Expression evaluation** — converting infix to postfix notation\n- **DFS (depth-first search)** — explicitly or via recursion (implicit stack)"}'::jsonb),
('e2000000-0000-0000-0002-000000000006', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TB\n  subgraph \"Stack (LIFO)\"\n    direction TB\n    T[\"TOP → 30\"] --> M[\"20\"] --> B[\"10\"]\n  end\n  P1[\"push(30)\"] -.-> T\n  P2[\"pop() → 30\"] -.-> T"}'::jsonb),
('e2000000-0000-0000-0002-000000000006', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000013", "question_text": "Match each stack application to its description:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "Stacks naturally model any situation where you need to reverse order or backtrack: matching brackets requires checking the most recent opening bracket, undo reverses the most recent action, and DFS explores the most recently discovered path.", "matching_pairs": [{"left": "Balanced brackets", "right": "Push opening brackets, pop and match on closing"}, {"left": "Undo feature", "right": "Push each action, pop to reverse the last one"}, {"left": "DFS traversal", "right": "Push unvisited neighbors, pop to backtrack"}], "difficulty": 2, "tags": ["stack", "applications"]}')::jsonb),
('e2000000-0000-0000-0002-000000000006', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000014", "question_text": "You push the following elements onto a stack in order: A, B, C, D. You then pop twice. What element is now on top?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "After pushing A, B, C, D, the stack from bottom to top is: [A, B, C, D]. First pop removes D, second pop removes C. The top is now B.", "acceptable_answers": ["B", "b"], "match_mode": "exact", "difficulty": 1, "tags": ["stack", "LIFO"]}')::jsonb);


-- LESSON 7: Queues and Deques
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000007', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000002', 'Queues and Deques', '', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000015',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000007',
  'c0000000-0000-0000-0000-000000000001',
  'You enqueue A, B, C, D into a queue. After two dequeue operations, what is at the front?',
  'multiple_choice',
  '[{"id": "a", "text": "A"}, {"id": "b", "text": "B"}, {"id": "c", "text": "C"}, {"id": "d", "text": "D"}]'::jsonb,
  ARRAY['c'],
  'FIFO: first dequeue returns A, second returns B. The front is now C.',
  1,
  'creator_original',
  '{"a": "A was the first to be dequeued (first in, first out).", "b": "B was the second to be dequeued.", "c": "Correct. After removing A and B, C is at the front.", "d": "D is at the rear — it was the last to be enqueued."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES (
  'e2000000-0000-0000-0003-000000000016',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000002',
  'e2000000-0000-0000-0002-000000000007',
  'c0000000-0000-0000-0000-000000000001',
  'A deque can efficiently function as both a stack and a queue because it supports $O(1)$ insertion and removal at both ends.',
  'true_false',
  '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
  ARRAY['a'],
  'True. A deque supports `addFirst`, `addLast`, `removeFirst`, and `removeLast`, all in $O(1)$. Using one end for both add and remove gives stack behavior (LIFO). Using different ends gives queue behavior (FIFO).',
  2,
  'creator_original'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000007', 0, 'read', '{"markdown": "## Queues: First In, First Out (FIFO)\n\nA **queue** models a line: elements are added at the **rear** and removed from the **front**.\n\n**Core operations (all $O(1)$):**\n- `enqueue(item)` — add item to the rear\n- `dequeue()` — remove and return the front item\n- `front()` / `peek()` — view the front without removing\n\n```python\nfrom collections import deque\nq = deque()\nq.append(10)    # enqueue\nq.append(20)    # enqueue\nq.append(30)    # enqueue\nfront = q.popleft()  # dequeue → 10 (FIFO)\n```\n\n**Common applications:** BFS graph traversal, task scheduling, print queues, message buffers.\n\n## Deque (Double-Ended Queue)\n\nA **deque** supports insertion and removal from **both** ends in $O(1)$:\n- `addFirst()` / `addLast()`\n- `removeFirst()` / `removeLast()`\n\nA deque can function as both a stack and a queue. Python''s `collections.deque` is implemented as a doubly-linked list of fixed-size blocks, giving $O(1)$ operations at both ends.\n\n**Priority Queue** (bonus): elements are dequeued by priority, not insertion order. Typically implemented with a **heap** — covered in the Trees module."}'::jsonb),
('e2000000-0000-0000-0002-000000000007', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph LR\n  subgraph \"Queue (FIFO)\"\n    F[\"FRONT\"] --> A[\"10\"] --> B[\"20\"] --> C[\"30\"] --> R[\"REAR\"]\n  end\n  D[\"dequeue() → 10\"] -.-> F\n  E[\"enqueue(40)\"] -.-> R"}'::jsonb),
('e2000000-0000-0000-0002-000000000007', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000015", "question_text": "You enqueue A, B, C, D into a queue. After two dequeue operations, what is at the front?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "A"}, {"id": "b", "text": "B"}, {"id": "c", "text": "C"}, {"id": "d", "text": "D"}], "correct_ids": ["c"], "explanation": "FIFO: first dequeue returns A, second returns B. The front is now C.", "option_explanations": {"a": "A was the first to be dequeued (first in, first out).", "b": "B was the second to be dequeued.", "c": "Correct. After removing A and B, C is at the front.", "d": "D is at the rear — it was the last to be enqueued."}, "difficulty": 1, "tags": ["queue", "FIFO"]}')::jsonb),
('e2000000-0000-0000-0002-000000000007', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000016", "question_text": "A deque can efficiently function as both a stack and a queue because it supports $O(1)$ insertion and removal at both ends.", "question_type": "true_false", "options": [{"id": "a", "text": "True"}, {"id": "b", "text": "False"}], "correct_ids": ["a"], "explanation": "True. A deque supports `addFirst`, `addLast`, `removeFirst`, and `removeLast`, all in $O(1)$. Using one end for both add and remove gives stack behavior (LIFO). Using different ends gives queue behavior (FIFO).", "difficulty": 2, "tags": ["deque"]}')::jsonb);


-- ============================================================
-- MODULE 3: Trees & Graphs
-- ============================================================

-- LESSON 8: Binary Search Trees
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000008', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000003', 'Binary Search Trees', '', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e2000000-0000-0000-0003-000000000017',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000003',
  'e2000000-0000-0000-0002-000000000008',
  'c0000000-0000-0000-0000-000000000001',
  'Put the steps of inserting value 5 into the BST shown above (rooted at 8) in the correct order:',
  'ordering',
  '[{"id": "a", "text": "5 < 8, go left to node 3"}, {"id": "b", "text": "5 > 3, go right to node 6"}, {"id": "c", "text": "5 < 6, go left to node 4"}, {"id": "d", "text": "4 has no right child, insert 5 as right child of 4"}]'::jsonb,
  ARRAY[]::text[],
  'BST insertion follows the search path: compare with root (8), go left (3), right (6), left (4). Since 5 > 4 and 4 has no right child, 5 becomes 4''s right child.',
  2,
  'creator_original',
  ARRAY['a', 'b', 'c', 'd']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000018',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000003',
  'e2000000-0000-0000-0002-000000000008',
  'c0000000-0000-0000-0000-000000000001',
  'What is the in-order traversal output of a BST containing values 3, 1, 4, 1, 5, 9, 2, 6?',
  'multiple_choice',
  '[{"id": "a", "text": "3, 1, 4, 1, 5, 9, 2, 6 (insertion order)"}, {"id": "b", "text": "1, 1, 2, 3, 4, 5, 6, 9 (sorted order)"}, {"id": "c", "text": "9, 6, 5, 4, 3, 2, 1, 1 (reverse sorted)"}, {"id": "d", "text": "1, 2, 3, 4, 5, 6, 9 (duplicates removed)"}]'::jsonb,
  ARRAY['b'],
  'In-order traversal of a BST always produces elements in sorted (ascending) order. This is a fundamental property: left subtree (smaller values) is visited first, then root, then right subtree (larger values).',
  2,
  'creator_original',
  '{"a": "Insertion order is not what in-order traversal produces.", "b": "Correct. In-order traversal of a BST yields sorted output.", "c": "This would be reverse in-order (right → root → left).", "d": "BSTs can store duplicates (typically in the left or right subtree by convention)."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000008', 0, 'read', '{"markdown": "## Binary Search Trees (BSTs)\n\nA **binary search tree** is a binary tree where each node satisfies the **BST property:**\n- All values in the left subtree < node''s value\n- All values in the right subtree > node''s value\n\nThis ordering enables efficient search, insertion, and deletion.\n\n```python\nclass TreeNode:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n```\n\n**Operations and complexities:**\n\n| Operation | Average | Worst Case |\n|-----------|---------|------------|\n| Search | $O(\\log n)$ | $O(n)$ |\n| Insert | $O(\\log n)$ | $O(n)$ |\n| Delete | $O(\\log n)$ | $O(n)$ |\n| Find min/max | $O(\\log n)$ | $O(n)$ |\n\nThe worst case ($O(n)$) occurs when the tree degenerates into a linked list — for example, inserting sorted data: 1, 2, 3, 4, 5 creates a right-skewed tree with height $n$.\n\n**In-order traversal** of a BST visits nodes in sorted order: left subtree → root → right subtree."}'::jsonb),
('e2000000-0000-0000-0002-000000000008', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  A((8)) --> B((3))\n  A --> C((10))\n  B --> D((1))\n  B --> E((6))\n  C --> F((9))\n  C --> G((14))\n  E --> H((4))\n  E --> I((7))"}'::jsonb),
('e2000000-0000-0000-0002-000000000008', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000017", "question_text": "Put the steps of inserting value 5 into the BST shown above (rooted at 8) in the correct order:", "question_type": "ordering", "options": [{"id": "a", "text": "5 < 8, go left to node 3"}, {"id": "b", "text": "5 > 3, go right to node 6"}, {"id": "c", "text": "5 < 6, go left to node 4"}, {"id": "d", "text": "4 has no right child, insert 5 as right child of 4"}], "correct_ids": [], "explanation": "BST insertion follows the search path: compare with root (8), go left (3), right (6), left (4). Since 5 > 4 and 4 has no right child, 5 becomes 4''s right child.", "correct_order": ["a", "b", "c", "d"], "difficulty": 2, "tags": ["BST", "insertion"]}')::jsonb),
('e2000000-0000-0000-0002-000000000008', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000018", "question_text": "What is the in-order traversal output of a BST containing values 3, 1, 4, 1, 5, 9, 2, 6?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "3, 1, 4, 1, 5, 9, 2, 6 (insertion order)"}, {"id": "b", "text": "1, 1, 2, 3, 4, 5, 6, 9 (sorted order)"}, {"id": "c", "text": "9, 6, 5, 4, 3, 2, 1, 1 (reverse sorted)"}, {"id": "d", "text": "1, 2, 3, 4, 5, 6, 9 (duplicates removed)"}], "correct_ids": ["b"], "explanation": "In-order traversal of a BST always produces elements in sorted (ascending) order. This is a fundamental property: left subtree (smaller values) is visited first, then root, then right subtree (larger values).", "option_explanations": {"a": "Insertion order is not what in-order traversal produces.", "b": "Correct. In-order traversal of a BST yields sorted output.", "c": "This would be reverse in-order (right → root → left).", "d": "BSTs can store duplicates (typically in the left or right subtree by convention)."}, "difficulty": 2, "tags": ["BST", "in-order traversal"]}')::jsonb);


-- LESSON 9: Balanced Trees: AVL
-- Steps: read, callout, embed, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000009', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000003', 'Balanced Trees: AVL', '', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000019',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000003',
  'e2000000-0000-0000-0002-000000000009',
  'c0000000-0000-0000-0000-000000000001',
  'After inserting into an AVL tree, a node has a balance factor of +2 and its left child has a balance factor of +1. What rotation is needed?',
  'multiple_choice',
  '[{"id": "a", "text": "Single right rotation"}, {"id": "b", "text": "Single left rotation"}, {"id": "c", "text": "Left-right double rotation"}, {"id": "d", "text": "Right-left double rotation"}]'::jsonb,
  ARRAY['a'],
  'BF = +2 means left-heavy. Left child BF = +1 means also left-heavy. This is the Left-Left (LL) case, fixed by a single right rotation around the unbalanced node.',
  3,
  'creator_original',
  '{"a": "Correct. LL case (left-heavy node, left-heavy child) → single right rotation.", "b": "Left rotation fixes the RR case (BF = -2, child BF = -1).", "c": "LR double rotation applies when BF = +2 but left child BF = -1.", "d": "RL double rotation applies when BF = -2 but right child BF = +1."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000009', 0, 'read', '{"markdown": "## AVL Trees\n\nAn **AVL tree** (Adelson-Velsky and Landis, 1962) is a self-balancing BST. It maintains the **AVL property:** for every node, the heights of the left and right subtrees differ by at most 1.\n\n**Balance factor:** $BF(node) = height(left) - height(right)$\n\nValid balance factors: $\\{-1, 0, +1\\}$\n\nWhen an insertion or deletion violates this property, the tree performs **rotations** to restore balance.\n\n**Four rotation cases:**\n\n1. **Left-Left (LL):** Node is left-heavy, left child is left-heavy → **Right rotation**\n2. **Right-Right (RR):** Node is right-heavy, right child is right-heavy → **Left rotation**\n3. **Left-Right (LR):** Node is left-heavy, left child is right-heavy → **Left rotation on child, then right rotation on node**\n4. **Right-Left (RL):** Node is right-heavy, right child is left-heavy → **Right rotation on child, then left rotation on node**\n\n**Guaranteed complexities:**\n\n| Operation | Time |\n|-----------|------|\n| Search | $O(\\log n)$ |\n| Insert | $O(\\log n)$ |\n| Delete | $O(\\log n)$ |\n\nThe height of an AVL tree with $n$ nodes is always $O(\\log n)$, so the worst case equals the average case."}'::jsonb),
('e2000000-0000-0000-0002-000000000009', 1, 'callout', '{"callout_style": "key_concept", "title": "Why Balance Matters", "markdown": "An unbalanced BST can degenerate to $O(n)$ height. AVL trees guarantee $O(\\log n)$ height by rebalancing after every modification. The cost: insertions and deletions are slightly slower (constant-factor overhead for rotation checks), but the guarantee of logarithmic operations is invaluable for large datasets."}'::jsonb),
('e2000000-0000-0000-0002-000000000009', 2, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  subgraph \"Before: Right-Right case\"\n    A1((3<br>BF=-2)) --> B1((\" \"))\n    A1 --> C1((5<br>BF=-1))\n    C1 --> D1((\" \"))\n    C1 --> E1((7))\n  end\n  subgraph \"After: Left rotation\"\n    A2((5<br>BF=0)) --> B2((3))\n    A2 --> C2((7))\n  end"}'::jsonb),
('e2000000-0000-0000-0002-000000000009', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000019", "question_text": "After inserting into an AVL tree, a node has a balance factor of +2 and its left child has a balance factor of +1. What rotation is needed?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "Single right rotation"}, {"id": "b", "text": "Single left rotation"}, {"id": "c", "text": "Left-right double rotation"}, {"id": "d", "text": "Right-left double rotation"}], "correct_ids": ["a"], "explanation": "BF = +2 means left-heavy. Left child BF = +1 means also left-heavy. This is the Left-Left (LL) case, fixed by a single right rotation around the unbalanced node.", "option_explanations": {"a": "Correct. LL case (left-heavy node, left-heavy child) → single right rotation.", "b": "Left rotation fixes the RR case (BF = -2, child BF = -1).", "c": "LR double rotation applies when BF = +2 but left child BF = -1.", "d": "RL double rotation applies when BF = -2 but right child BF = +1."}, "difficulty": 3, "tags": ["AVL", "rotations"]}')::jsonb);


-- LESSON 10: Heaps and Priority Queues
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000010', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000003', 'Heaps and Priority Queues', '', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e2000000-0000-0000-0003-000000000020',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000003',
  'e2000000-0000-0000-0002-000000000010',
  'c0000000-0000-0000-0000-000000000001',
  'Put the steps of inserting a value into a min-heap in the correct order:',
  'ordering',
  '[{"id": "a", "text": "Add the new element at the end of the array (last position)"}, {"id": "b", "text": "Compare the element with its parent"}, {"id": "c", "text": "If the element is smaller than its parent, swap them"}, {"id": "d", "text": "Repeat comparing and swapping until the heap property is restored or the root is reached"}]'::jsonb,
  ARRAY[]::text[],
  'Heap insertion always adds at the bottom (maintaining completeness) and then "bubbles up" — swapping with the parent as long as the heap property is violated. This takes at most $O(\log n)$ swaps (the height of the tree).',
  2,
  'creator_original',
  ARRAY['a', 'b', 'c', 'd']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000021',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000003',
  'e2000000-0000-0000-0002-000000000010',
  'c0000000-0000-0000-0000-000000000001',
  'In a min-heap stored as an array, the left child of the element at index 3 (0-indexed) is at index:',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Left child of index $i$ is at $2i + 1 = 2(3) + 1 = 7$. The right child would be at index $2i + 2 = 8$.',
  2,
  'creator_original',
  ARRAY['7'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000010', 0, 'read', '{"markdown": "## Binary Heaps\n\nA **binary heap** is a complete binary tree satisfying the **heap property:**\n- **Min-heap:** every parent ≤ its children (smallest element at root)\n- **Max-heap:** every parent ≥ its children (largest element at root)\n\n**Array representation:** A heap is typically stored as an array. For a node at index $i$ (0-indexed):\n- Left child: $2i + 1$\n- Right child: $2i + 2$\n- Parent: $\\lfloor(i-1)/2\\rfloor$\n\n**Operations:**\n\n| Operation | Time |\n|-----------|------|\n| Find min/max | $O(1)$ |\n| Insert (push) | $O(\\log n)$ — insert at bottom, bubble up |\n| Extract min/max (pop) | $O(\\log n)$ — swap root with last, bubble down |\n| Build heap from array | $O(n)$ — not $O(n \\log n)$! |\n\n```python\nimport heapq\nh = []\nheapq.heappush(h, 5)   # insert\nheapq.heappush(h, 2)\nheapq.heappush(h, 8)\nmin_val = heapq.heappop(h)  # extract min → 2\n```\n\n**Priority Queue:** An abstract data type where each element has a priority. Implemented with a heap for $O(\\log n)$ insert and $O(\\log n)$ extract-min. Used in: Dijkstra''s algorithm, task scheduling, event-driven simulation."}'::jsonb),
('e2000000-0000-0000-0002-000000000010', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  A((2)) --> B((5))\n  A --> C((3))\n  B --> D((7))\n  B --> E((9))\n  C --> F((6))\n  C --> G((8))\n  H[\"Array: [2, 5, 3, 7, 9, 6, 8]\"] -.-> A"}'::jsonb),
('e2000000-0000-0000-0002-000000000010', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000020", "question_text": "Put the steps of inserting a value into a min-heap in the correct order:", "question_type": "ordering", "options": [{"id": "a", "text": "Add the new element at the end of the array (last position)"}, {"id": "b", "text": "Compare the element with its parent"}, {"id": "c", "text": "If the element is smaller than its parent, swap them"}, {"id": "d", "text": "Repeat comparing and swapping until the heap property is restored or the root is reached"}], "correct_ids": [], "explanation": "Heap insertion always adds at the bottom (maintaining completeness) and then \"bubbles up\" — swapping with the parent as long as the heap property is violated. This takes at most $O(\\log n)$ swaps (the height of the tree).", "correct_order": ["a", "b", "c", "d"], "difficulty": 2, "tags": ["heap", "insertion"]}')::jsonb),
('e2000000-0000-0000-0002-000000000010', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000021", "question_text": "In a min-heap stored as an array, the left child of the element at index 3 (0-indexed) is at index:", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Left child of index $i$ is at $2i + 1 = 2(3) + 1 = 7$. The right child would be at index $2i + 2 = 8$.", "acceptable_answers": ["7"], "match_mode": "exact", "difficulty": 2, "tags": ["heap", "array representation"]}')::jsonb);


-- LESSON 11: Graph Traversals: BFS/DFS
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000011', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000003', 'Graph Traversals: BFS/DFS', '', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e2000000-0000-0000-0003-000000000022',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000003',
  'e2000000-0000-0000-0002-000000000011',
  'c0000000-0000-0000-0000-000000000001',
  'Starting from node A in the graph above, put the BFS visit order in sequence (processing neighbors alphabetically):',
  'ordering',
  '[{"id": "a", "text": "A"}, {"id": "b", "text": "B, C"}, {"id": "c", "text": "D, E, F"}, {"id": "d", "text": "G"}]'::jsonb,
  ARRAY[]::text[],
  'BFS visits level by level: Level 0 = A, Level 1 = B and C (neighbors of A), Level 2 = D, E, F (neighbors of B and C), Level 3 = G (neighbor of D). Full order: A, B, C, D, E, F, G.',
  2,
  'creator_original',
  ARRAY['a', 'b', 'c', 'd']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e2000000-0000-0000-0003-000000000023',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000003',
  'e2000000-0000-0000-0002-000000000011',
  'c0000000-0000-0000-0000-000000000001',
  'Match each traversal to its key property:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'BFS''s level-by-level exploration guarantees shortest paths in unweighted graphs and uses a queue. DFS''s deep exploration is ideal for problems like topological sorting, detecting cycles, and finding connected components, and uses a stack (explicitly or via the call stack in recursion).',
  2,
  'creator_original',
  '[{"left": "BFS", "right": "Finds shortest path in unweighted graphs"}, {"left": "DFS", "right": "Natural for topological sort and cycle detection"}, {"left": "BFS data structure", "right": "Queue (FIFO)"}, {"left": "DFS data structure", "right": "Stack (LIFO) or recursion"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000011', 0, 'read', '{"markdown": "## Graph Traversals\n\nGraphs consist of **vertices** (nodes) and **edges** (connections). Two fundamental traversal strategies:\n\n### BFS (Breadth-First Search)\nExplores vertices **level by level**, using a **queue**.\n\n```python\nfrom collections import deque\n\ndef bfs(graph, start):\n    visited = {start}\n    queue = deque([start])\n    order = []\n    while queue:\n        node = queue.popleft()\n        order.append(node)\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n    return order\n```\n\n**Properties:** Finds shortest path (unweighted graphs), explores nearest vertices first.\n\n### DFS (Depth-First Search)\nExplores as **deep as possible** before backtracking, using a **stack** (or recursion).\n\n```python\ndef dfs(graph, start, visited=None):\n    if visited is None:\n        visited = set()\n    visited.add(start)\n    for neighbor in graph[start]:\n        if neighbor not in visited:\n            dfs(graph, neighbor, visited)\n    return visited\n```\n\n**Properties:** Uses less memory for deep graphs, natural for topological sort, cycle detection, and path-finding.\n\n**Complexity for both:** Time $O(V + E)$, Space $O(V)$."}'::jsonb),
('e2000000-0000-0000-0002-000000000011', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  A((A)) --- B((B))\n  A --- C((C))\n  B --- D((D))\n  B --- E((E))\n  C --- F((F))\n  D --- G((G))"}'::jsonb),
('e2000000-0000-0000-0002-000000000011', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000022", "question_text": "Starting from node A in the graph above, put the BFS visit order in sequence (processing neighbors alphabetically):", "question_type": "ordering", "options": [{"id": "a", "text": "A"}, {"id": "b", "text": "B, C"}, {"id": "c", "text": "D, E, F"}, {"id": "d", "text": "G"}], "correct_ids": [], "explanation": "BFS visits level by level: Level 0 = A, Level 1 = B and C (neighbors of A), Level 2 = D, E, F (neighbors of B and C), Level 3 = G (neighbor of D). Full order: A, B, C, D, E, F, G.", "correct_order": ["a", "b", "c", "d"], "difficulty": 2, "tags": ["BFS", "graph traversal"]}')::jsonb),
('e2000000-0000-0000-0002-000000000011', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000023", "question_text": "Match each traversal to its key property:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "BFS''s level-by-level exploration guarantees shortest paths in unweighted graphs and uses a queue. DFS''s deep exploration is ideal for problems like topological sorting, detecting cycles, and finding connected components, and uses a stack (explicitly or via the call stack in recursion).", "matching_pairs": [{"left": "BFS", "right": "Finds shortest path in unweighted graphs"}, {"left": "DFS", "right": "Natural for topological sort and cycle detection"}, {"left": "BFS data structure", "right": "Queue (FIFO)"}, {"left": "DFS data structure", "right": "Stack (LIFO) or recursion"}], "difficulty": 2, "tags": ["BFS", "DFS", "comparison"]}')::jsonb);


-- ============================================================
-- MODULE 4: Sorting & Searching
-- ============================================================

-- LESSON 12: Comparison Sorts
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000012', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000004', 'Comparison Sorts', '', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e2000000-0000-0000-0003-000000000024',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000004',
  'e2000000-0000-0000-0002-000000000012',
  'c0000000-0000-0000-0000-000000000001',
  'Order these sorting algorithms from best to worst average-case time complexity:',
  'ordering',
  '[{"id": "a", "text": "Bubble Sort — $O(n^2)$"}, {"id": "b", "text": "Merge Sort — $O(n \\log n)$"}, {"id": "c", "text": "Quick Sort — $O(n \\log n)$"}, {"id": "d", "text": "Selection Sort — $O(n^2)$"}]'::jsonb,
  ARRAY[]::text[],
  'Merge Sort and Quick Sort are both $O(n \log n)$ average, but Merge Sort is listed first because it guarantees $O(n \log n)$ worst-case too. Bubble Sort and Selection Sort are both $O(n^2)$, but Bubble Sort can terminate early on sorted input ($O(n)$ best case).',
  3,
  'creator_original',
  ARRAY['b', 'c', 'a', 'd']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e2000000-0000-0000-0003-000000000025',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000004',
  'e2000000-0000-0000-0002-000000000012',
  'c0000000-0000-0000-0000-000000000001',
  'Match each sorting algorithm to its key characteristic:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Each sort has distinct trade-offs. Merge Sort guarantees $O(n \log n)$ but needs extra memory. Quick Sort is fastest on average due to cache locality but has a bad worst case. Heap Sort has ideal complexity bounds but poor cache performance. Insertion Sort excels on small/sorted inputs.',
  3,
  'creator_original',
  '[{"left": "Merge Sort", "right": "Guaranteed O(n log n) but uses O(n) extra space"}, {"left": "Quick Sort", "right": "Fastest in practice but O(n²) worst case"}, {"left": "Heap Sort", "right": "O(n log n) worst case and O(1) extra space"}, {"left": "Insertion Sort", "right": "Best for small or nearly-sorted arrays"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000012', 0, 'read', '{"markdown": "## Comparison-Based Sorting Algorithms\n\n**Comparison sorts** determine order by comparing pairs of elements. The theoretical lower bound for comparison sorts is $\\Omega(n \\log n)$ — no comparison sort can do better in the worst case.\n\n### Key Algorithms\n\n**Merge Sort** — Divide and conquer:\n1. Split array in half recursively\n2. Merge sorted halves\n- Time: $O(n \\log n)$ always\n- Space: $O(n)$\n- Stable: Yes\n\n**Quick Sort** — Partition around a pivot:\n1. Choose pivot, partition: elements < pivot go left, > pivot go right\n2. Recursively sort left and right\n- Time: $O(n \\log n)$ average, $O(n^2)$ worst (bad pivot)\n- Space: $O(\\log n)$ (stack)\n- Stable: No (in-place version)\n\n**Heap Sort** — Build a max-heap, repeatedly extract max:\n- Time: $O(n \\log n)$ always\n- Space: $O(1)$\n- Stable: No\n\n**Insertion Sort** — Insert each element into its correct position:\n- Time: $O(n)$ best (already sorted), $O(n^2)$ average/worst\n- Space: $O(1)$\n- Stable: Yes\n- Great for small or nearly-sorted arrays"}'::jsonb),
('e2000000-0000-0000-0002-000000000012', 1, 'embed', '{"sub_type": "math_graph", "graph_data": {"x_range": [0, 1000], "y_range": [0, 1000000], "step": 200, "x_label": "Input size n", "y_label": "Comparisons (worst case)", "title": "Sorting Algorithm Performance", "functions": [{"points": [[10, 100], [50, 2500], [100, 10000], [200, 40000], [500, 250000], [1000, 1000000]], "color": "#dc2626", "label": "O(n²) — Bubble/Selection", "dashed": false}, {"points": [[10, 33], [50, 282], [100, 664], [200, 1529], [500, 4482], [1000, 9965]], "color": "#2563eb", "label": "O(n log n) — Merge/Heap", "dashed": false}], "points": []}}'::jsonb),
('e2000000-0000-0000-0002-000000000012', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000024", "question_text": "Order these sorting algorithms from best to worst average-case time complexity:", "question_type": "ordering", "options": [{"id": "a", "text": "Bubble Sort — $O(n^2)$"}, {"id": "b", "text": "Merge Sort — $O(n \\log n)$"}, {"id": "c", "text": "Quick Sort — $O(n \\log n)$"}, {"id": "d", "text": "Selection Sort — $O(n^2)$"}], "correct_ids": [], "explanation": "Merge Sort and Quick Sort are both $O(n \\log n)$ average, but Merge Sort is listed first because it guarantees $O(n \\log n)$ worst-case too. Bubble Sort and Selection Sort are both $O(n^2)$, but Bubble Sort can terminate early on sorted input ($O(n)$ best case).", "correct_order": ["b", "c", "a", "d"], "difficulty": 3, "tags": ["sorting", "complexity comparison"]}')::jsonb),
('e2000000-0000-0000-0002-000000000012', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000025", "question_text": "Match each sorting algorithm to its key characteristic:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "Each sort has distinct trade-offs. Merge Sort guarantees $O(n \\log n)$ but needs extra memory. Quick Sort is fastest on average due to cache locality but has a bad worst case. Heap Sort has ideal complexity bounds but poor cache performance. Insertion Sort excels on small/sorted inputs.", "matching_pairs": [{"left": "Merge Sort", "right": "Guaranteed O(n log n) but uses O(n) extra space"}, {"left": "Quick Sort", "right": "Fastest in practice but O(n²) worst case"}, {"left": "Heap Sort", "right": "O(n log n) worst case and O(1) extra space"}, {"left": "Insertion Sort", "right": "Best for small or nearly-sorted arrays"}], "difficulty": 3, "tags": ["sorting", "trade-offs"]}')::jsonb);


-- LESSON 13: Linear-Time Sorts
-- Steps: read, callout, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000013', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000004', 'Linear-Time Sorts', '', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000026',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000004',
  'e2000000-0000-0000-0002-000000000013',
  'c0000000-0000-0000-0000-000000000001',
  'Counting Sort has time complexity $O(n + k)$. What does $k$ represent?',
  'multiple_choice',
  '[{"id": "a", "text": "The number of elements in the array"}, {"id": "b", "text": "The range of possible values (max value)"}, {"id": "c", "text": "The number of digits per element"}, {"id": "d", "text": "The number of buckets used"}]'::jsonb,
  ARRAY['b'],
  '$k$ is the range of values (the maximum value in the input). Counting Sort creates a count array of size $k + 1$. When $k$ is much larger than $n$ (e.g., sorting 10 numbers in the range 0 to 1,000,000), Counting Sort becomes inefficient.',
  2,
  'creator_original',
  '{"a": "That''s $n$, which is already accounted for separately.", "b": "Correct. $k$ is the range of input values — determines the size of the count array.", "c": "This is the $d$ parameter in Radix Sort, not Counting Sort.", "d": "This applies to Bucket Sort. Counting Sort uses a count array sized by the value range."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000027',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000004',
  'e2000000-0000-0000-0002-000000000013',
  'c0000000-0000-0000-0000-000000000001',
  'Which linear-time sort works by processing digits from least significant to most significant?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Radix Sort (LSD variant) processes digits from least significant to most significant, using a stable sort (typically Counting Sort) at each digit position. Processing right-to-left ensures that when we sort by a more significant digit, the relative order from less significant digits is preserved (due to stability).',
  2,
  'creator_original',
  ARRAY['Radix Sort', 'radix sort', 'radix', 'Radix'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000013', 0, 'read', '{"markdown": "## Linear-Time Sorting Algorithms\n\nBy exploiting structure in the data (not just comparisons), we can sort in $O(n)$ time. These algorithms bypass the $\\Omega(n \\log n)$ comparison sort lower bound.\n\n### Counting Sort\n**Requirement:** elements are integers in a known range $[0, k]$.\n\n1. Count occurrences of each value\n2. Compute prefix sums (cumulative counts)\n3. Place elements in correct output positions\n\n- Time: $O(n + k)$\n- Space: $O(n + k)$\n- Stable: Yes\n\n```python\ndef counting_sort(arr, k):\n    count = [0] * (k + 1)\n    for x in arr:\n        count[x] += 1\n    output = []\n    for val in range(k + 1):\n        output.extend([val] * count[val])\n    return output\n```\n\n### Radix Sort\nSorts by individual digits, from least significant to most significant, using a stable sort (usually counting sort) as a subroutine.\n\n- Time: $O(d \\cdot (n + k))$ where $d$ = number of digits, $k$ = base\n- For $n$ integers up to value $n^c$: $O(n)$ if $d$ and $k$ are constant\n\n### Bucket Sort\nDistributes elements into buckets, sorts each bucket, then concatenates.\n- Time: $O(n)$ average (with uniform distribution), $O(n^2)$ worst case\n- Space: $O(n + k)$"}'::jsonb),
('e2000000-0000-0000-0002-000000000013', 1, 'callout', '{"callout_style": "key_concept", "title": "Why Not Always Use Linear-Time Sorts?", "markdown": "Linear-time sorts have **restrictions**: Counting Sort needs a bounded integer range. Radix Sort needs fixed-length keys. Bucket Sort assumes roughly uniform distribution. When these assumptions hold, they''re fantastic. When they don''t, comparison sorts are more general."}'::jsonb),
('e2000000-0000-0000-0002-000000000013', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000026", "question_text": "Counting Sort has time complexity $O(n + k)$. What does $k$ represent?", "question_type": "multiple_choice", "options": [{"id": "a", "text": "The number of elements in the array"}, {"id": "b", "text": "The range of possible values (max value)"}, {"id": "c", "text": "The number of digits per element"}, {"id": "d", "text": "The number of buckets used"}], "correct_ids": ["b"], "explanation": "$k$ is the range of values (the maximum value in the input). Counting Sort creates a count array of size $k + 1$. When $k$ is much larger than $n$ (e.g., sorting 10 numbers in the range 0 to 1,000,000), Counting Sort becomes inefficient.", "option_explanations": {"a": "That''s $n$, which is already accounted for separately.", "b": "Correct. $k$ is the range of input values — determines the size of the count array.", "c": "This is the $d$ parameter in Radix Sort, not Counting Sort.", "d": "This applies to Bucket Sort. Counting Sort uses a count array sized by the value range."}, "difficulty": 2, "tags": ["counting sort", "linear-time sorting"]}')::jsonb),
('e2000000-0000-0000-0002-000000000013', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000027", "question_text": "Which linear-time sort works by processing digits from least significant to most significant?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "Radix Sort (LSD variant) processes digits from least significant to most significant, using a stable sort (typically Counting Sort) at each digit position. Processing right-to-left ensures that when we sort by a more significant digit, the relative order from less significant digits is preserved (due to stability).", "acceptable_answers": ["Radix Sort", "radix sort", "radix", "Radix"], "match_mode": "contains", "difficulty": 2, "tags": ["radix sort"]}')::jsonb);


-- LESSON 14: Binary Search Variants
-- Steps: read, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000014', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000004', 'Binary Search Variants', '', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, diagram_data)
VALUES (
  'e2000000-0000-0000-0003-000000000028',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000004',
  'e2000000-0000-0000-0002-000000000014',
  'c0000000-0000-0000-0000-000000000001',
  'In the sorted array [1, 3, 3, 3, 5, 7, 9], what index does `find_first(arr, 3)` return?',
  'diagram',
  '[{"id": "a", "text": "Index 1"}, {"id": "b", "text": "Index 2"}, {"id": "c", "text": "Index 3"}, {"id": "d", "text": "Index 0"}]'::jsonb,
  ARRAY['a'],
  'The first occurrence of 3 is at index 1. The `find_first` variant continues searching left even after finding a match, ensuring it finds the leftmost occurrence.',
  2,
  'creator_original',
  '{"x_range": [0, 6], "y_range": [0, 10], "step": 1, "x_label": "Index", "y_label": "Value", "functions": [{"points": [[0, 1], [1, 3], [2, 3], [3, 3], [4, 5], [5, 7], [6, 9]], "color": "#2563eb", "label": "Array values"}], "points": [{"x": 1, "y": 3, "label": "First 3", "color": "#dc2626"}]}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000029',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000004',
  'e2000000-0000-0000-0002-000000000014',
  'c0000000-0000-0000-0000-000000000001',
  'The time complexity of binary search is $O(\log n)$ because at each step it ___ the search space.',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'At each iteration, binary search compares with the middle element and eliminates half the remaining elements. After $k$ steps, only $n/2^k$ elements remain. When $n/2^k = 1$, we get $k = \log_2 n$ steps.',
  1,
  'creator_original',
  ARRAY['halves', 'halfs', 'divides in half', 'cuts in half', 'reduces by half'],
  'contains'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000014', 0, 'read', '{"markdown": "## Binary Search and Its Variants\n\nClassic binary search finds a target value in a **sorted** array in $O(\\log n)$ time.\n\n```python\ndef binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = lo + (hi - lo) // 2  # avoids overflow\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1  # not found\n```\n\n### Important Variants\n\n**Find first occurrence** (leftmost match):\n```python\ndef find_first(arr, target):\n    lo, hi, result = 0, len(arr) - 1, -1\n    while lo <= hi:\n        mid = lo + (hi - lo) // 2\n        if arr[mid] == target:\n            result = mid\n            hi = mid - 1  # keep searching left\n        elif arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return result\n```\n\n**Find last occurrence:** similar, but when `arr[mid] == target`, set `lo = mid + 1`.\n\n**Search in rotated sorted array:** find the pivot first, then binary search the appropriate half.\n\n**Binary search on answer:** when you can''t search an array but can check \"is $x$ feasible?\" — binary search on the answer space."}'::jsonb),
('e2000000-0000-0000-0002-000000000014', 1, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000028", "question_text": "In the sorted array [1, 3, 3, 3, 5, 7, 9], what index does `find_first(arr, 3)` return?", "question_type": "diagram", "options": [{"id": "a", "text": "Index 1"}, {"id": "b", "text": "Index 2"}, {"id": "c", "text": "Index 3"}, {"id": "d", "text": "Index 0"}], "correct_ids": ["a"], "explanation": "The first occurrence of 3 is at index 1. The `find_first` variant continues searching left even after finding a match, ensuring it finds the leftmost occurrence.", "diagram_data": {"x_range": [0, 6], "y_range": [0, 10], "step": 1, "x_label": "Index", "y_label": "Value", "functions": [{"points": [[0, 1], [1, 3], [2, 3], [3, 3], [4, 5], [5, 7], [6, 9]], "color": "#2563eb", "label": "Array values"}], "points": [{"x": 1, "y": 3, "label": "First 3", "color": "#dc2626"}]}, "difficulty": 2, "tags": ["binary search", "first occurrence"]}')::jsonb),
('e2000000-0000-0000-0002-000000000014', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000029", "question_text": "The time complexity of binary search is $O(\\log n)$ because at each step it ___ the search space.", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "At each iteration, binary search compares with the middle element and eliminates half the remaining elements. After $k$ steps, only $n/2^k$ elements remain. When $n/2^k = 1$, we get $k = \\log_2 n$ steps.", "acceptable_answers": ["halves", "halfs", "divides in half", "cuts in half", "reduces by half"], "match_mode": "contains", "difficulty": 1, "tags": ["binary search", "complexity"]}')::jsonb);


-- ============================================================
-- MODULE 5: Dynamic Programming & Greedy
-- ============================================================

-- LESSON 15: Memoization and Tabulation
-- Steps: read, embed, callout, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000015', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000005', 'Memoization and Tabulation', '', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, option_explanations)
VALUES (
  'e2000000-0000-0000-0003-000000000030',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000005',
  'e2000000-0000-0000-0002-000000000015',
  'c0000000-0000-0000-0000-000000000001',
  'Without memoization, computing `fib(n)` recursively has time complexity:',
  'multiple_choice',
  '[{"id": "a", "text": "$O(n)$"}, {"id": "b", "text": "$O(n \\log n)$"}, {"id": "c", "text": "$O(2^n)$"}, {"id": "d", "text": "$O(n^2)$"}]'::jsonb,
  ARRAY['c'],
  'Each call branches into two subcalls, creating a binary tree of depth $n$. The total number of nodes is approximately $2^n$, giving $O(2^n)$ time. More precisely, it''s $O(\phi^n)$ where $\phi \approx 1.618$ is the golden ratio, but $O(2^n)$ is the standard upper bound.',
  2,
  'creator_original',
  '{"a": "This is the complexity *with* memoization, not without.", "b": "This complexity class doesn''t arise from the recursive structure.", "c": "Correct. The call tree is approximately a full binary tree of depth $n$.", "d": "There''s exponential branching, not polynomial."}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000015', 0, 'read', '{"markdown": "## Dynamic Programming: Two Approaches\n\n**Dynamic Programming (DP)** solves optimization problems by breaking them into **overlapping subproblems** and storing results to avoid redundant computation.\n\n### Top-Down: Memoization\nStart with the original problem and recursively solve subproblems, caching results:\n\n```python\ndef fib_memo(n, cache={}):\n    if n <= 1:\n        return n\n    if n not in cache:\n        cache[n] = fib_memo(n-1) + fib_memo(n-2)\n    return cache[n]\n```\n\nWithout memoization, `fib(n)` is $O(2^n)$. With memoization: $O(n)$.\n\n### Bottom-Up: Tabulation\nBuild solutions from the smallest subproblems up:\n\n```python\ndef fib_tab(n):\n    if n <= 1:\n        return n\n    dp = [0] * (n + 1)\n    dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i-1] + dp[i-2]\n    return dp[n]\n```\n\n**When to use DP:**\n1. **Optimal substructure:** optimal solution contains optimal solutions to subproblems\n2. **Overlapping subproblems:** same subproblems are solved repeatedly\n\nIf only condition 1 holds (no overlap), use **divide and conquer** instead (like merge sort)."}'::jsonb),
('e2000000-0000-0000-0002-000000000015', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  F5[\"fib(5)\"] --> F4[\"fib(4)\"]\n  F5 --> F3a[\"fib(3)\"]\n  F4 --> F3b[\"fib(3)\"]\n  F4 --> F2a[\"fib(2)\"]\n  F3a --> F2b[\"fib(2)\"]\n  F3a --> F1a[\"fib(1)\"]\n  F3b --> F2c[\"fib(2)\"]\n  F3b --> F1b[\"fib(1)\"]\n  style F3a fill:#f59e0b,color:#000\n  style F3b fill:#f59e0b,color:#000\n  style F2a fill:#dc2626,color:#fff\n  style F2b fill:#dc2626,color:#fff\n  style F2c fill:#dc2626,color:#fff"}'::jsonb),
('e2000000-0000-0000-0002-000000000015', 2, 'callout', '{"callout_style": "key_concept", "title": "Overlapping Subproblems", "markdown": "In the Fibonacci call tree above, `fib(3)` is computed twice (yellow) and `fib(2)` is computed three times (red). Memoization stores each result the first time, reducing all duplicate calls to $O(1)$ lookups. This transforms exponential time to linear time."}'::jsonb),
('e2000000-0000-0000-0002-000000000015', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000030", "question_text": "Without memoization, computing `fib(n)` recursively has time complexity:", "question_type": "multiple_choice", "options": [{"id": "a", "text": "$O(n)$"}, {"id": "b", "text": "$O(n \\log n)$"}, {"id": "c", "text": "$O(2^n)$"}, {"id": "d", "text": "$O(n^2)$"}], "correct_ids": ["c"], "explanation": "Each call branches into two subcalls, creating a binary tree of depth $n$. The total number of nodes is approximately $2^n$, giving $O(2^n)$ time. More precisely, it''s $O(\\phi^n)$ where $\\phi \\approx 1.618$ is the golden ratio, but $O(2^n)$ is the standard upper bound.", "option_explanations": {"a": "This is the complexity *with* memoization, not without.", "b": "This complexity class doesn''t arise from the recursive structure.", "c": "Correct. The call tree is approximately a full binary tree of depth $n$.", "d": "There''s exponential branching, not polynomial."}, "difficulty": 2, "tags": ["dynamic programming", "Fibonacci", "complexity"]}')::jsonb);


-- LESSON 16: Classic DP Problems
-- Steps: read, callout, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000016', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000005', 'Classic DP Problems', '', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, correct_order)
VALUES (
  'e2000000-0000-0000-0003-000000000031',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000005',
  'e2000000-0000-0000-0002-000000000016',
  'c0000000-0000-0000-0000-000000000001',
  'Put the steps of the DP problem-solving framework in the correct order:',
  'ordering',
  '[{"id": "a", "text": "Write the recurrence relation"}, {"id": "b", "text": "Define the state (what dp[i] represents)"}, {"id": "c", "text": "Determine the computation order"}, {"id": "d", "text": "Identify base cases"}, {"id": "e", "text": "Extract the final answer"}]'::jsonb,
  ARRAY[]::text[],
  'Start by defining what each entry represents (b), then express how entries relate (a), set up initial conditions (d), ensure you compute in the right order (c), and finally read off the answer (e).',
  2,
  'creator_original',
  ARRAY['b', 'a', 'd', 'c', 'e']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, acceptable_answers, match_mode)
VALUES (
  'e2000000-0000-0000-0003-000000000032',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000005',
  'e2000000-0000-0000-0002-000000000016',
  'c0000000-0000-0000-0000-000000000001',
  'In the coin change problem with coins [1, 5, 10] and amount 15, what is the minimum number of coins needed?',
  'fill_blank',
  '[]'::jsonb,
  ARRAY[]::text[],
  'The optimal solution uses two coins: 10 + 5 = 15. The greedy approach (always pick the largest coin that fits) works here, but greedy doesn''t always work for coin change (e.g., coins [1, 3, 4] and amount 6: greedy gives 4+1+1=3 coins, but optimal is 3+3=2 coins).',
  2,
  'creator_original',
  ARRAY['2', 'two'],
  'exact'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000016', 0, 'read', '{"markdown": "## Classic Dynamic Programming Problems\n\n### 1. Longest Common Subsequence (LCS)\nGiven two strings, find the longest subsequence common to both.\n\n**Recurrence:** For strings $X[1..m]$ and $Y[1..n]$:\n$$dp[i][j] = \\begin{cases} dp[i-1][j-1] + 1 & \\text{if } X[i] = Y[j] \\\\ \\max(dp[i-1][j], dp[i][j-1]) & \\text{otherwise} \\end{cases}$$\n\nTime: $O(mn)$, Space: $O(mn)$ (reducible to $O(\\min(m,n))$)\n\n### 2. 0/1 Knapsack\nGiven items with weights and values, maximize total value within capacity $W$.\n\n$$dp[i][w] = \\max(dp[i-1][w], \\; dp[i-1][w - w_i] + v_i)$$\n\nTime: $O(nW)$, Space: $O(nW)$\n\n### 3. Coin Change\nFind minimum coins to make amount $A$ using denominations $d_1, d_2, \\ldots, d_k$.\n\n$$dp[a] = \\min_{j} (dp[a - d_j] + 1)$$\n\nTime: $O(Ak)$, Space: $O(A)$\n\n### DP Problem-Solving Framework\n1. **Define the state** — what does $dp[i]$ or $dp[i][j]$ represent?\n2. **Write the recurrence** — how does the current state relate to smaller states?\n3. **Identify base cases** — what are $dp[0]$, $dp[0][0]$, etc.?\n4. **Determine computation order** — ensure dependencies are computed first\n5. **Extract the answer** — which cell contains the final result?"}'::jsonb),
('e2000000-0000-0000-0002-000000000016', 1, 'callout', '{"callout_style": "tip", "title": "The DP Mindset", "markdown": "When faced with an optimization problem, ask: \"Can I express the answer in terms of answers to *smaller* versions of the same problem?\" If yes, and the subproblems overlap, DP applies. The hardest part is defining the right state — once you have the recurrence, the code almost writes itself."}'::jsonb),
('e2000000-0000-0000-0002-000000000016', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000031", "question_text": "Put the steps of the DP problem-solving framework in the correct order:", "question_type": "ordering", "options": [{"id": "a", "text": "Write the recurrence relation"}, {"id": "b", "text": "Define the state (what dp[i] represents)"}, {"id": "c", "text": "Determine the computation order"}, {"id": "d", "text": "Identify base cases"}, {"id": "e", "text": "Extract the final answer"}], "correct_ids": [], "explanation": "Start by defining what each entry represents (b), then express how entries relate (a), set up initial conditions (d), ensure you compute in the right order (c), and finally read off the answer (e).", "correct_order": ["b", "a", "d", "c", "e"], "difficulty": 2, "tags": ["dynamic programming", "framework"]}')::jsonb),
('e2000000-0000-0000-0002-000000000016', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000032", "question_text": "In the coin change problem with coins [1, 5, 10] and amount 15, what is the minimum number of coins needed?", "question_type": "fill_blank", "options": [], "correct_ids": [], "explanation": "The optimal solution uses two coins: 10 + 5 = 15. The greedy approach (always pick the largest coin that fits) works here, but greedy doesn''t always work for coin change (e.g., coins [1, 3, 4] and amount 6: greedy gives 4+1+1=3 coins, but optimal is 3+3=2 coins).", "acceptable_answers": ["2", "two"], "match_mode": "exact", "difficulty": 2, "tags": ["coin change", "dynamic programming"]}')::jsonb);


-- LESSON 17: Greedy Algorithms
-- Steps: read, embed, answer, answer
INSERT INTO lessons (id, course_id, module_id, title, body, display_order)
VALUES ('e2000000-0000-0000-0002-000000000017', 'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0001-000000000005', 'Greedy Algorithms', '', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source, matching_pairs)
VALUES (
  'e2000000-0000-0000-0003-000000000033',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000005',
  'e2000000-0000-0000-0002-000000000017',
  'c0000000-0000-0000-0000-000000000001',
  'Match each problem to the correct algorithmic approach:',
  'matching',
  '[]'::jsonb,
  ARRAY[]::text[],
  'Activity Selection and Fractional Knapsack have the greedy choice property. 0/1 Knapsack does not (greedy fails), so DP is needed. Merge Sort has optimal substructure but non-overlapping subproblems, making it divide and conquer.',
  3,
  'creator_original',
  '[{"left": "Activity Selection", "right": "Greedy (pick earliest finish time)"}, {"left": "0/1 Knapsack", "right": "Dynamic Programming"}, {"left": "Fractional Knapsack", "right": "Greedy (sort by value/weight ratio)"}, {"left": "Merge Sort", "right": "Divide and Conquer"}]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, course_id, module_id, lesson_id, creator_id, question_text, question_type, options, correct_option_ids, explanation, difficulty, source)
VALUES (
  'e2000000-0000-0000-0003-000000000034',
  'e2000000-0000-0000-0000-000000000001',
  'e2000000-0000-0000-0001-000000000005',
  'e2000000-0000-0000-0002-000000000017',
  'c0000000-0000-0000-0000-000000000001',
  'The greedy algorithm for the 0/1 Knapsack problem (always picking the highest value-to-weight ratio item) is guaranteed to give the optimal solution.',
  'true_false',
  '[{"id": "a", "text": "True"}, {"id": "b", "text": "False"}]'::jsonb,
  ARRAY['b'],
  'False. The greedy approach fails for 0/1 Knapsack. Counterexample: items with (weight, value) = (10, 60), (20, 100), (30, 120) and capacity 50. Greedy by ratio takes items 1 and 2 (value = 160), but the optimal solution is items 2 and 3 (value = 220). Greedy works for the *fractional* knapsack but not the 0/1 version.',
  3,
  'creator_original'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO lesson_steps (lesson_id, sort_order, step_type, content) VALUES
('e2000000-0000-0000-0002-000000000017', 0, 'read', '{"markdown": "## Greedy Algorithms\n\nA **greedy algorithm** makes the **locally optimal choice** at each step, hoping this leads to a globally optimal solution. Unlike DP, greedy algorithms don''t reconsider past choices.\n\n**When greedy works:**\nA problem has the **greedy choice property** if a locally optimal choice always leads to a globally optimal solution. It must also have **optimal substructure**.\n\n### Classic Greedy Problems\n\n**Activity Selection:** Given activities with start/end times, find the maximum number of non-overlapping activities.\n- **Greedy strategy:** Always pick the activity that finishes earliest.\n- This works because choosing the earliest-finishing activity leaves the most room for remaining activities.\n\n**Huffman Coding:** Build a minimum-cost prefix-free binary code.\n- **Greedy strategy:** Always merge the two lowest-frequency nodes.\n\n**Dijkstra''s Algorithm:** Find shortest paths from a source in a weighted graph.\n- **Greedy strategy:** Always expand the unvisited vertex with the smallest tentative distance.\n\n**Fractional Knapsack:** Unlike 0/1 knapsack, you can take fractions of items.\n- **Greedy strategy:** Sort by value/weight ratio, take highest-ratio items first.\n\n**Greedy vs DP:** Greedy is simpler and faster when it works, but it doesn''t always produce optimal results. Always prove the greedy choice property before assuming it works!"}'::jsonb),
('e2000000-0000-0000-0002-000000000017', 1, 'embed', '{"sub_type": "diagram", "mermaid": "graph TD\n  A{\"Does the problem have optimal substructure?\"}\n  A -->|Yes| B{\"Does the greedy choice property hold?\"}\n  A -->|No| C[\"Try other approaches\"]\n  B -->|Yes| D[\"Use Greedy Algorithm\"]\n  B -->|No| E{\"Are there overlapping subproblems?\"}\n  E -->|Yes| F[\"Use Dynamic Programming\"]\n  E -->|No| G[\"Use Divide and Conquer\"]"}'::jsonb),
('e2000000-0000-0000-0002-000000000017', 2, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000033", "question_text": "Match each problem to the correct algorithmic approach:", "question_type": "matching", "options": [], "correct_ids": [], "explanation": "Activity Selection and Fractional Knapsack have the greedy choice property. 0/1 Knapsack does not (greedy fails), so DP is needed. Merge Sort has optimal substructure but non-overlapping subproblems, making it divide and conquer.", "matching_pairs": [{"left": "Activity Selection", "right": "Greedy (pick earliest finish time)"}, {"left": "0/1 Knapsack", "right": "Dynamic Programming"}, {"left": "Fractional Knapsack", "right": "Greedy (sort by value/weight ratio)"}, {"left": "Merge Sort", "right": "Divide and Conquer"}], "difficulty": 3, "tags": ["greedy", "DP", "algorithm design"]}')::jsonb),
('e2000000-0000-0000-0002-000000000017', 3, 'answer', ('{"question_id": "e2000000-0000-0000-0003-000000000034", "question_text": "The greedy algorithm for the 0/1 Knapsack problem (always picking the highest value-to-weight ratio item) is guaranteed to give the optimal solution.", "question_type": "true_false", "options": [{"id": "a", "text": "True"}, {"id": "b", "text": "False"}], "correct_ids": ["b"], "explanation": "False. The greedy approach fails for 0/1 Knapsack. Counterexample: items with (weight, value) = (10, 60), (20, 100), (30, 120) and capacity 50. Greedy by ratio takes items 1 and 2 (value = 160), but the optimal solution is items 2 and 3 (value = 220). Greedy works for the *fractional* knapsack but not the 0/1 version.", "difficulty": 3, "tags": ["greedy", "knapsack"]}')::jsonb);

