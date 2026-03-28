# Course Design Prompt for CertPath Platform

You are designing 4 comprehensive, Duolingo-style courses for an ed-tech platform called CertPath. Your output will be transformed into SQL migrations, so you must follow the exact data structures specified below.

## YOUR TASK

Design 4 courses with **real, educationally accurate content**. Each course needs:
- 5 modules with 3-4 lessons each (60-80 lessons total across all 4 courses)
- Each lesson has 5-10 ordered steps (Duolingo-style: teach -> reinforce -> test)
- Every question needs correct answers, explanations, and distractors
- All physics equations must be correct LaTeX
- All CS algorithms must be accurate
- All AWS content must reflect the real SAA-C03 exam
- Music theory must be musically correct

---

## OUTPUT FORMAT

For each course, output a JSON object. Here is the exact schema:

```json
{
  "course": {
    "title": "Course Title",
    "slug": "course-slug-here",
    "description": "2-3 sentence description",
    "category": "Physics",
    "difficulty": "advanced",
    "is_free": true,
    "price_cents": 0,
    "card_color": "#hex",
    "tags": ["Physics", "Academic"],
    "estimated_duration": "40 hours",
    "prerequisites": "Calculus I, basic trigonometry",
    "learning_objectives": [
      "Objective 1",
      "Objective 2"
    ],
    "exam_fee_cents": null,
    "passing_score": null,
    "max_score": null,
    "exam_duration_minutes": null,
    "total_questions_on_exam": null,
    "provider_name": null,
    "provider_url": null
  },
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "weight_percent": 20,
      "display_order": 0,
      "lessons": [
        {
          "title": "Lesson Title",
          "display_order": 0,
          "steps": [
            // See step schemas below
          ]
        }
      ]
    }
  ]
}
```

---

## STEP SCHEMAS

Each step in a lesson has a `step_type` and `content` object. Here are ALL supported types:

### 1. Read Step
```json
{
  "step_type": "read",
  "content": {
    "markdown": "## Heading\n\nGitHub-flavored markdown. Supports:\n- **bold**, *italic*\n- LaTeX: inline $F = ma$ and display $$E = mc^2$$\n- Tables, code blocks, blockquotes\n- Lists (ordered and unordered)\n\n> Blockquotes for examples\n\n| Column | Column |\n|--------|--------|\n| data | data |"
  }
}
```

### 2. Watch Step
```json
{
  "step_type": "watch",
  "content": {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
}
```
Note: Only YouTube and Vimeo URLs work. Use real, publicly available educational video URLs.

### 3. Answer Step (Question)
There are 8 question types. Each answer step wraps a question:

#### 3a. Multiple Choice (single correct)
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "Question with $LaTeX$ support?",
    "question_type": "multiple_choice",
    "options": [
      {"id": "a", "text": "Option A with $math$"},
      {"id": "b", "text": "Option B"},
      {"id": "c", "text": "Option C"},
      {"id": "d", "text": "Option D"}
    ],
    "correct_ids": ["b"],
    "explanation": "Why B is correct. Supports $LaTeX$.",
    "option_explanations": {
      "a": "Why A is wrong",
      "b": "Why B is right",
      "c": "Why C is wrong",
      "d": "Why D is wrong"
    },
    "difficulty": 3,
    "tags": ["tag1", "tag2"]
  }
}
```

#### 3b. Multiple Select (multiple correct)
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "Select ALL that apply:",
    "question_type": "multiple_select",
    "options": [
      {"id": "a", "text": "Correct option 1"},
      {"id": "b", "text": "Wrong option"},
      {"id": "c", "text": "Correct option 2"},
      {"id": "d", "text": "Wrong option 2"}
    ],
    "correct_ids": ["a", "c"],
    "explanation": "A and C are correct because...",
    "difficulty": 3,
    "tags": []
  }
}
```

#### 3c. True/False
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "Statement to evaluate as true or false.",
    "question_type": "true_false",
    "options": [
      {"id": "a", "text": "True"},
      {"id": "b", "text": "False"}
    ],
    "correct_ids": ["b"],
    "explanation": "This is false because...",
    "difficulty": 2,
    "tags": []
  }
}
```

#### 3d. Fill in the Blank
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "The force of gravity is $F = m \\cdot$ ___.",
    "question_type": "fill_blank",
    "options": [],
    "correct_ids": [],
    "acceptable_answers": ["g", "9.8", "9.81", "9.8 m/s^2"],
    "match_mode": "exact",
    "explanation": "Gravity acceleration g is approximately 9.8 m/s^2.",
    "difficulty": 2,
    "tags": []
  }
}
```
- `match_mode`: "exact" (case-insensitive exact match) or "contains" (substring match)
- `acceptable_answers`: array of all accepted text answers

#### 3e. Ordering (drag to reorder)
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "Order these sorting algorithms from worst to best average-case complexity:",
    "question_type": "ordering",
    "options": [
      {"id": "a", "text": "Bubble Sort $O(n^2)$"},
      {"id": "b", "text": "Merge Sort $O(n \\log n)$"},
      {"id": "c", "text": "Selection Sort $O(n^2)$"},
      {"id": "d", "text": "Quick Sort $O(n \\log n)$"}
    ],
    "correct_ids": [],
    "correct_order": ["a", "c", "b", "d"],
    "explanation": "Bubble and Selection are O(n^2), Merge and Quick are O(n log n)...",
    "difficulty": 3,
    "tags": []
  }
}
```
- `correct_order`: array of option IDs in the correct sequence
- Minimum 3 items required
- `options` defines the display items (shown shuffled to user)

#### 3f. Matching (pair left to right)
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "Match each data structure to its primary use case:",
    "question_type": "matching",
    "options": [],
    "correct_ids": [],
    "matching_pairs": [
      {"left": "Stack", "right": "LIFO operations"},
      {"left": "Queue", "right": "FIFO operations"},
      {"left": "Hash Map", "right": "O(1) key lookup"},
      {"left": "Heap", "right": "Priority scheduling"}
    ],
    "explanation": "Stacks are LIFO, Queues are FIFO...",
    "difficulty": 3,
    "tags": []
  }
}
```
- `matching_pairs`: array of {left, right} objects
- Minimum 3 pairs required
- User sees left items fixed, right items shuffled as dropdown options

#### 3g. Diagram (MC question with coordinate graph displayed)
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "Which equation matches the curve shown?",
    "question_type": "diagram",
    "options": [
      {"id": "a", "text": "$y = x^2$"},
      {"id": "b", "text": "$y = 2x + 1$"},
      {"id": "c", "text": "$y = \\sin(x)$"},
      {"id": "d", "text": "$y = e^x$"}
    ],
    "correct_ids": ["a"],
    "explanation": "The parabola shape indicates a quadratic function.",
    "diagram_data": {
      "x_range": [-4, 4],
      "y_range": [-2, 8],
      "step": 1,
      "x_label": "x",
      "y_label": "y",
      "functions": [
        {
          "points": [[-3,9],[-2,4],[-1,1],[0,0],[1,1],[2,4],[3,9]],
          "color": "#2563eb",
          "label": "f(x)"
        }
      ],
      "points": [
        {"x": 0, "y": 0, "label": "origin", "color": "#2563eb"}
      ]
    },
    "difficulty": 3,
    "tags": []
  }
}
```

#### 3h. Plot Point (tap on coordinate plane)
```json
{
  "step_type": "answer",
  "content": {
    "question_text": "Tap to plot the equilibrium point of the system.",
    "question_type": "plot_point",
    "options": [],
    "correct_ids": [],
    "explanation": "The equilibrium is at (2, 0) where the restoring force is zero.",
    "diagram_data": {
      "x_range": [-4, 4],
      "y_range": [-4, 4],
      "step": 1,
      "x_label": "Position (m)",
      "y_label": "Force (N)",
      "functions": [
        {
          "points": [[-3,3],[-2,2],[-1,1],[0,0],[1,-1],[2,-2],[3,-3]],
          "color": "#2563eb",
          "label": "F(x)"
        }
      ]
    },
    "correct_point": {"x": 0, "y": 0, "tolerance": 0.5},
    "difficulty": 3,
    "tags": []
  }
}
```

### 4. Embed Step
Three subtypes:

#### 4a. Image
```json
{
  "step_type": "embed",
  "content": {
    "sub_type": "image",
    "url": "https://images.unsplash.com/photo-XXXX?w=800",
    "caption": "Description of what the image shows",
    "alt": "Alt text for accessibility"
  }
}
```
Use real Unsplash URLs or other publicly accessible image URLs.

#### 4b. Mermaid Diagram
```json
{
  "step_type": "embed",
  "content": {
    "sub_type": "diagram",
    "mermaid": "graph TD;\n  A[Start] --> B{Decision};\n  B -->|Yes| C[Result 1];\n  B -->|No| D[Result 2];"
  }
}
```
Supports: flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, pie charts. Use valid Mermaid syntax.

#### 4c. Math Graph (Coordinate Plane)
```json
{
  "step_type": "embed",
  "content": {
    "sub_type": "math_graph",
    "graph_data": {
      "x_range": [0, 10],
      "y_range": [0, 100],
      "step": 1,
      "x_label": "Time (s)",
      "y_label": "Velocity (m/s)",
      "title": "Velocity vs Time",
      "functions": [
        {
          "points": [[0,0],[1,10],[2,20],[3,30],[4,40],[5,50]],
          "color": "#2563eb",
          "label": "v(t) = 10t",
          "dashed": false
        }
      ],
      "points": [
        {"x": 3, "y": 30, "label": "t=3s", "color": "#16a34a"}
      ]
    }
  }
}
```

### 5. Callout Step
```json
{
  "step_type": "callout",
  "content": {
    "callout_style": "key_concept",
    "title": "Key Concept",
    "markdown": "**Newton's Third Law:** For every action, there is an equal and opposite reaction. This applies to *all* forces, not just contact forces."
  }
}
```
Styles: `"tip"`, `"warning"`, `"key_concept"`, `"exam_note"`

---

## THE 4 COURSES TO DESIGN

### Course 1: Advanced Physics - "Classical Mechanics & Beyond"
- **Category:** "Physics"
- **Difficulty:** "advanced"
- **Card color:** "#f97316" (orange)
- **Tags:** ["Physics", "Academic", "STEM"]
- **is_free:** true

**Modules:**
1. **Newtonian Mechanics** (weight: 25%) - 4 lessons
   - Newton's Laws of Motion (read + callout + answer steps covering all 3 laws)
   - Free Body Diagrams (read + embed diagram + ordering question on FBD steps)
   - Friction and Inclined Planes (read with LaTeX + diagram questions with inclined plane graphs + fill_blank for calculations)
   - Circular Motion and Centripetal Force (read + math_graph showing circular motion + plot_point for centripetal acceleration)

2. **Energy & Momentum** (weight: 20%) - 3 lessons
   - Work-Energy Theorem (read + math_graph of KE vs velocity + MC/fill_blank)
   - Conservation of Energy (read + callout + diagram showing energy bar charts + matching energy types)
   - Collisions and Momentum (read + mermaid showing elastic vs inelastic + ordering + MC)

3. **Rotational Dynamics** (weight: 20%) - 3 lessons
   - Torque and Angular Acceleration (read with LaTeX + math_graph + fill_blank)
   - Moment of Inertia (read + matching shapes to I formulas + MC)
   - Angular Momentum Conservation (read + callout + diagram + MC)

4. **Oscillations & Waves** (weight: 20%) - 3 lessons
   - Simple Harmonic Motion (read + math_graph of sinusoidal motion + plot_point for amplitude/period + fill_blank)
   - Damped and Driven Oscillations (read + math_graph comparing damped curves + MC)
   - Wave Mechanics (read + mermaid for wave types + matching + MC)

5. **Special Relativity** (weight: 15%) - 3 lessons
   - Postulates and Time Dilation (read + callout + math_graph of gamma factor + fill_blank)
   - Length Contraction (read + diagram + MC)
   - Mass-Energy Equivalence (read + callout + fill_blank + MC)

**Physics content requirements:**
- All equations in LaTeX: $F = ma$, $W = Fd\cos\theta$, $KE = \frac{1}{2}mv^2$, $\tau = r \times F$, $T = 2\pi\sqrt{\frac{l}{g}}$, $\gamma = \frac{1}{\sqrt{1 - v^2/c^2}}$, etc.
- Coordinate diagrams: plot force vs displacement, velocity vs time, SHM curves, gamma factor vs v/c
- Plot point questions: identify equilibrium points, maximum displacement, zero-velocity points on graphs

---

### Course 2: Data Structures & Algorithms
- **Category:** "Computer Science"
- **Difficulty:** "advanced"
- **Card color:** "#2563eb" (blue)
- **Tags:** ["Computer Science", "Academic", "STEM"]
- **is_free:** true

**Modules:**
1. **Complexity Analysis** (weight: 20%) - 3 lessons
   - Big-O Notation (read + math_graph comparing O(1), O(log n), O(n), O(n log n), O(n^2) + ordering by complexity + MC)
   - Space Complexity (read + callout + matching + MC)
   - Amortized Analysis (read + callout + diagram of dynamic array growth + MC)

2. **Linear Structures** (weight: 20%) - 4 lessons
   - Arrays and Dynamic Arrays (read with code + mermaid showing memory layout + MC)
   - Linked Lists (read with code + mermaid showing node linkage + ordering for insertion steps + MC)
   - Stacks (read + mermaid showing LIFO + matching operations to use cases + fill_blank)
   - Queues and Deques (read + mermaid showing FIFO + MC + true_false)

3. **Trees & Graphs** (weight: 25%) - 4 lessons
   - Binary Search Trees (read + mermaid for BST structure + ordering for insertion + MC)
   - Balanced Trees: AVL (read + callout + mermaid showing rotations + MC)
   - Heaps and Priority Queues (read + mermaid showing heap + ordering for heapify + fill_blank)
   - Graph Traversals: BFS/DFS (read + mermaid + ordering traversal output + matching)

4. **Sorting & Searching** (weight: 20%) - 3 lessons
   - Comparison Sorts (read + math_graph comparing sort performance + ordering by efficiency + matching)
   - Linear-Time Sorts (read + callout + mermaid showing counting sort buckets + MC)
   - Binary Search Variants (read with code + diagram + fill_blank for complexity)

5. **Dynamic Programming & Greedy** (weight: 15%) - 3 lessons
   - Memoization and Tabulation (read + mermaid showing call tree + callout + MC)
   - Classic DP Problems (read + callout + ordering for DP steps + fill_blank)
   - Greedy Algorithms (read + mermaid for greedy choice + matching problems to approaches + MC)

**CS content requirements:**
- Code snippets in markdown code blocks (```python or ```typescript)
- Mermaid diagrams for: BST structure, linked list nodes, graph traversals, heap trees, sorting flow
- Math graphs: O(n) growth curves plotted on coordinate plane (x=input size, y=operations)
- Ordering questions: algorithm steps, traversal orders, complexity rankings

---

### Course 3: AWS Solutions Architect Associate (SAA-C03)
- **Category:** "Cloud Computing"
- **Difficulty:** "intermediate"
- **Card color:** "#f59e0b" (AWS amber)
- **Tags:** ["Cloud Computing", "Certification Prep", "AWS"]
- **is_free:** false
- **price_cents:** 2999
- **exam_fee_cents:** 30000
- **passing_score:** 720
- **max_score:** 1000
- **exam_duration_minutes:** 130
- **total_questions_on_exam:** 65
- **provider_name:** "Amazon Web Services"
- **provider_url:** "https://aws.amazon.com/certification/certified-solutions-architect-associate/"

**Modules:**
1. **Cloud Architecture & Design** (weight: 30%) - 4 lessons
   - Well-Architected Framework (read + mermaid showing 6 pillars + matching pillars to descriptions + MC)
   - High Availability & Fault Tolerance (read + mermaid showing multi-AZ + callout exam_note + MC + multiple_select)
   - Disaster Recovery Strategies (read + callout + ordering DR strategies by RTO + matching + MC)
   - Decoupling & Microservices (read + mermaid showing SQS/SNS patterns + MC)

2. **Compute & Networking** (weight: 25%) - 4 lessons
   - EC2 Instance Types & Pricing (read + matching instance families to use cases + MC + callout)
   - Lambda & Serverless (read + mermaid showing event-driven + callout + MC + true_false)
   - VPC Deep Dive (read + mermaid showing VPC layout + ordering VPC setup steps + MC)
   - Load Balancing & Route 53 (read + matching LB types to use cases + MC + callout)

3. **Storage & Databases** (weight: 25%) - 4 lessons
   - S3 Storage Classes (read + ordering by cost + matching classes to use cases + MC + callout)
   - EBS, EFS, and FSx (read + matching storage types + MC + true_false)
   - RDS & Aurora (read + mermaid showing read replicas + callout + MC + multiple_select)
   - DynamoDB & ElastiCache (read + callout + MC + matching + true_false)

4. **Security & Identity** (weight: 15%) - 3 lessons
   - IAM Deep Dive (read + mermaid showing IAM structure + ordering policy evaluation + MC + callout)
   - Encryption: KMS & CloudHSM (read + callout + matching + MC + fill_blank)
   - Security Services (read + matching services to threats + multiple_select + MC)

5. **Monitoring & Cost Optimization** (weight: 5%) - 3 lessons
   - CloudWatch & CloudTrail (read + mermaid + matching + MC)
   - Infrastructure as Code (read + callout + MC + true_false)
   - Cost Management (read + ordering cost optimization steps + matching tools to functions + MC)

**AWS content requirements:**
- Real service names, real exam scenarios
- Multiple select questions (the real SAA-C03 has many "select TWO" or "select THREE")
- Exam notes as callouts with actual exam patterns
- Architecture diagrams via Mermaid (multi-AZ, multi-region, VPC, serverless)
- Matching: AWS service -> use case (very common exam pattern)

---

### Course 4: Music Theory Fundamentals (Wildcard)
- **Category:** "Music"
- **Difficulty:** "beginner"
- **Card color:** "#a855f7" (purple)
- **Tags:** ["Music", "Creative Arts"]
- **is_free:** true

**Modules:**
1. **Rhythm & Notation** (weight: 20%) - 3 lessons
   - Note Values and Rests (read using text/ASCII notation + matching note names to durations + ordering notes by duration + MC)
   - Time Signatures (read + callout + MC + fill_blank)
   - Tempo and Dynamics (read + matching + MC)

2. **Scales & Keys** (weight: 25%) - 3 lessons
   - Major Scales (read + ordering notes in a scale + fill_blank for scale degrees + MC)
   - Minor Scales (read + callout + matching scale types + MC + ordering)
   - Key Signatures and Circle of Fifths (read + mermaid diagram for circle of fifths + matching keys to sharps/flats + MC)

3. **Intervals & Chords** (weight: 25%) - 3 lessons
   - Intervals (read + matching interval names to semitone counts + ordering by size + MC)
   - Triads (read + callout + matching triad types to formulas + MC + fill_blank)
   - Seventh Chords and Inversions (read + callout + MC + matching)

4. **Harmony & Progressions** (weight: 20%) - 3 lessons
   - Chord Functions (read + mermaid showing tonic/subdominant/dominant + matching + MC)
   - Common Progressions (read + ordering chords in I-IV-V-I + callout + MC + matching)
   - Cadences (read + matching cadence types + MC + true_false)

5. **Form & Analysis** (weight: 10%) - 3 lessons
   - Binary and Ternary Form (read + mermaid showing ABA structure + MC + matching)
   - Sonata and Rondo (read + ordering sonata form sections + MC)
   - Blues and Popular Forms (read + callout + ordering 12-bar blues chords + MC + fill_blank)

**Music theory content requirements:**
- Use text-based notation since there is NO staff notation renderer
- Represent notes as text: C4, D4, E4, etc. or C-D-E-F-G-A-B
- Use tables for scale patterns: W-W-H-W-W-W-H
- Mermaid diagrams for: Circle of Fifths (as flowchart), chord progression maps, form structure
- Creative use of math_graph: plot frequency ratios, visualize interval relationships numerically

---

## IMPORTANT CONSTRAINTS

1. **No audio playback** - You cannot play sound. For music theory, describe sounds textually.
2. **No code execution** - For CS, you can show code but cannot run it.
3. **No animations** - Physics simulations must be represented as static graphs.
4. **No staff notation** - Music must use text, tables, or ASCII art.
5. **No 3D graphics** - Only 2D coordinate planes and Mermaid diagrams.
6. **No interactive simulations** - Only static content + questions.
7. **Coordinate diagrams** are 2D only with functions plotted as discrete points connected by lines.
8. **LaTeX** uses KaTeX subset (no tikz, no pgfplots, no custom packages).
9. **Mermaid** must be valid syntax - test mentally that it would render.
10. **Single quotes in markdown must be escaped as two single quotes** (`''`) because these go into SQL strings.

## CONTENT QUALITY REQUIREMENTS

- Every read step should be 100-300 words (bite-sized, not a textbook)
- Every question must have a meaningful explanation (not just "correct" / "incorrect")
- MC questions need 4 options with plausible distractors
- Fill-blank should have 2-4 acceptable answers covering common formats
- LaTeX must be syntactically correct
- Mermaid must be syntactically valid
- Each lesson should follow: teach (read/callout) -> visualize (embed) -> test (answer) pattern
- Mix question types within lessons - don't use only MC

## SYSTEM LIMITATIONS TO DOCUMENT

After designing all 4 courses, add a final section documenting every limitation you encountered:
- What concepts were impossible or very difficult to teach with available tools?
- What step types or question types are missing that would have helped?
- Where did you have to compromise educational quality due to system constraints?
- Rate each limitation as: CRITICAL / MAJOR / MINOR / WORKAROUND_AVAILABLE

---

Output each course as a separate JSON object. Make the content REAL and COMPREHENSIVE - this is meant to stress-test the platform with production-quality educational content.
