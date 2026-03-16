# Feature Development — Workflow Template

*Created: March 12, 2026*
*Adapted from: Technical Issue Investigation Template (Feb 3, 2026)*

---

## When to Use This

When you say "I want to build X" or "I need a new feature" — follow this workflow. It turns a vague idea into an implementation-ready Claude Code document.

**The core principle:** Don't start coding. Understand the system the feature touches, define exactly what it does, design the data model and API, then build it all at once with proper test coverage.

---

## Phase 1: Define the Feature (Claude.ai — 15-30 min)

### Step 1: Describe the Feature

Tell me:
- **What does it do?** (The user-visible behavior, in plain language)
- **Who uses it?** (Guest? Logged-in user? Admin? Affiliate?)
- **Where does it live?** (New page? Existing page? Backend-only?)
- **What triggers it?** (User action? Cron job? Webhook? API call?)
- **What's the MVP?** (Smallest useful version — not the dream version)

### Step 2: Map the System It Touches

Before writing any code, map every part of the existing system the feature interacts with:
- Which existing files will need changes (frontend → backend → DB → external APIs)?
- What existing data does it read from or write to?
- What existing flows does it intersect with (checkout, auth, search, etc.)?
- What external dependencies does it need (Stripe, TicketNetwork, Supabase, Redis)?

**Output:** A diagram or ordered list showing how the new feature fits into the existing architecture. This prevents you from building something that conflicts with what's already there.

*Example: Building a discount code system touches checkout flow, Stripe PaymentIntents, order creation, the orders table, and email confirmations. Missing any of these means the feature is half-built.*

### Step 3: Identify What We Don't Know

After mapping, list explicit unknowns:
- Existing code we haven't read yet that the feature touches
- Data model questions (new tables? new columns? migrations?)
- Third-party API capabilities we need to verify
- UX decisions that aren't settled yet
- Edge cases we haven't thought through

**These become the audit tasks for Claude Code.**

---

## Phase 2: Design the Feature (Claude.ai — 30-60 min)

### Step 4: Define the Data Model

For any feature that stores or reads data:

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| existing_table | new_column | varchar | What it stores |
| new_table | id | uuid | Primary key |
| new_table | field | type | What it stores |

Include:
- New tables and columns
- Indexes needed
- Relationships to existing tables
- Migration strategy (additive? breaking?)

### Step 5: Define the API Contract

For any feature with backend logic:

| Method | Route | Input | Output | Auth? |
|--------|-------|-------|--------|-------|
| GET | /api/thing | query params | response shape | Yes/No |
| POST | /api/thing | request body | response shape | Yes/No |

Include:
- Request/response shapes (actual JSON, not descriptions)
- Error responses and status codes
- Rate limiting considerations
- Validation rules

### Step 6: Define the User Flow

Walk through every path a user can take:

| # | Path | User Action | System Response | Expected Result |
|---|------|-------------|-----------------|-----------------|
| 1 | Happy path | Standard use | Normal response | Success |
| 2 | Variation | Different input | Adapted response | Success |
| 3 | Edge case | Missing/invalid input | Validation error | Graceful failure |
| 4 | Error case | External service down | Fallback behavior | Handled failure |

**Key:** Design for failure paths, not just the happy path. Every external call can fail. Every user input can be wrong.

### Step 7: Identify Acceptance Criteria

Before building, define "done" with specific, testable statements:

- [ ] User can [action] and sees [result]
- [ ] When [edge case], [expected behavior]
- [ ] Database contains [expected state] after [action]
- [ ] API returns [status code] when [condition]
- [ ] Feature works on mobile
- [ ] Feature works for guest users (if applicable)
- [ ] Existing flows (checkout, search, etc.) are unaffected

---

## Phase 3: Assess Scope (Claude.ai — 15-30 min)

### Step 8: Ask "What Else?"

Now that you've designed the feature, ask:
- **Existing tests:** Will any existing tests break? Do they need updating?
- **New test coverage:** What automated tests does this feature need?
- **Migration safety:** Can the DB changes be deployed without downtime?
- **Rollback plan:** If this breaks production, how do we revert?
- **Related cleanup:** Is there dead code or tech debt in the files we're touching that's worth fixing now?
- **Performance:** Will this add load? Need caching? Need rate limiting?

**This is where "build a feature" becomes "build it right."** Same principle as the issue template — the marginal cost of doing it properly while you're already in the code is much lower than coming back later.

### Step 9: Scope the Work

Decide what ships together vs. what's tracked separately:

**Ships together (same Claude Code task):**
- The feature itself (frontend + backend + DB)
- Automated tests for the new code
- Updates to existing tests that break
- Cleanup in files you're modifying
- Migration scripts

**Track separately (future tasks):**
- Nice-to-have enhancements beyond MVP
- Broader refactors triggered by what you saw
- Features that depend on this one but aren't part of it
- Documentation updates

---

## Phase 4: Build the Implementation Doc (Claude.ai — 30-60 min)

### Step 10: Write the Claude Code Document

Structure it exactly like this:

```markdown
# [Feature Name] — Claude Code Task

## Why This Exists
[1-2 paragraphs: what this feature does, why we're building it, what it enables]

## System Reference
[Architecture diagram from Phase 1, Step 2]
[Key files table — every file that will be created or modified]

## Part 1: Audit & Discovery (pre-filled where possible)
[Anything Claude Code needs to verify that we couldn't from Claude.ai]
[Pre-fill everything we already know from Phase 1-3]

## Part 2: Database Changes
[New tables, new columns, migrations, indexes]
[SQL examples for the migration]
["Do NOT" section — what existing tables/columns to leave alone]

## Part 3: Backend Implementation
[New routes, controllers, services]
[Request/response contracts from Step 5]
[Error handling for each endpoint]
[Validation rules]
["Do NOT" section]

## Part 4: Frontend Implementation
[New components, pages, modifications to existing components]
[User flow from Step 6]
[Mobile considerations]
["Do NOT" section]

## Part 5: Test Infrastructure (if needed)
[New mock utilities, fixtures, test data]

## Part 6: Automated Tests
[Test cases matching acceptance criteria from Step 7]
[Organized by P0 (must pass) / P1 (should pass) / P2 (nice to have)]

## Part 7: Verification & Deployment
[Branch strategy]
[Manual verification checklist — walk each user flow on staging]
[Migration deployment order (DB first? Backend first?)]

## Summary Table
[Every change: category, description, files affected]

## Time Estimates
[Ordered list of parts with estimated durations]
```

### Key Principles for the Doc

1. **Pre-fill everything you can.** Data model, API contracts, component structure, file paths. Claude Code shouldn't be making design decisions — it should be executing yours.

2. **Be specific about files and locations.** "Create `src/routes/discount.js`" beats "add a discount route somewhere."

3. **Include "Do NOT" sections.** Claude Code will try to refactor adjacent code, add extra features, or "improve" things you didn't ask for. Constrain it.

4. **Order matters.** DB → backend → frontend → tests → cleanup → verification. Each step builds on the previous.

5. **Include the architecture diagram.** Claude Code needs to understand where the feature fits in the system.

6. **Acceptance criteria become test cases.** Every checkmark from Step 7 should map to an automated test in Part 6.

---

## Phase 5: Execute (Claude Code — 2-6 hours)

### Step 11: Paste and Go

1. Paste the full implementation doc into Claude Code
2. Let it work through sequentially
3. When it's done: deploy to staging, walk every user flow manually, confirm tests pass
4. Merge to main

---

## Quick Reference: What Happens Where

| Activity | Tool | Why |
|----------|------|-----|
| Define feature, map system, design | **Claude.ai** | Needs business context + project knowledge |
| Read existing code, verify assumptions | **Claude Code** | Needs filesystem access |
| Paste investigation results back | **Claude.ai** | Build into implementation doc |
| Design data model, API, user flows | **Claude.ai** | Strategy + design decisions |
| Build implementation doc | **Claude.ai** | Comprehensive planning |
| Implement feature, tests, migrations | **Claude Code** | Code changes |
| Walk user flows on staging | **Browser + DB** | Manual verification |
| Verify, deploy, merge | **You** | Final judgment |

---

## Checklist: Is the Implementation Doc Ready?

Before pasting into Claude Code, verify:

- [ ] Architecture diagram showing where feature fits in existing system
- [ ] All audit/discovery results pre-filled (no unnecessary re-discovery)
- [ ] Data model fully specified (tables, columns, types, indexes, migrations)
- [ ] API contracts fully specified (routes, methods, request/response shapes, errors)
- [ ] User flow covers happy path, variations, edge cases, and error cases
- [ ] Acceptance criteria are specific and testable
- [ ] Each implementation part has a "Do NOT" section
- [ ] Test cases map to acceptance criteria
- [ ] Verification checklist with specific pass criteria
- [ ] Summary table of all changes
- [ ] Clear ordering (what depends on what)
- [ ] Mobile considered

---

## Anti-Patterns to Avoid

**Don't jump to coding.** The temptation is to start building immediately. Resist. Design the data model, API, and user flows first. Changing code is 10x more expensive than changing a spec.

**Don't let Claude Code make design decisions.** It will happily pick a data model, choose API shapes, and name things. Those are your decisions. The implementation doc should leave zero ambiguity.

**Don't build the dream version.** Ship the MVP. Track enhancements separately. You can always add features — you can't easily un-ship a bad architecture.

**Don't skip the user flow matrix.** If you haven't walked through every path on paper, you'll discover missing paths in production.

**Don't forget mobile.** If you don't specify mobile behavior, Claude Code will build desktop-only and you'll be back next week.

**Don't skip the "Do NOT" sections.** Claude Code's greatest strength (helpfulness) is also its greatest risk. Without explicit constraints, it will refactor things you didn't ask it to touch, add features you didn't spec, and "improve" working code.

---

*This template was adapted from the Technical Issue Investigation Template, applying the same core insight: comprehensive upfront planning with Claude.ai produces dramatically better Claude Code output than iterating on vague prompts.*
