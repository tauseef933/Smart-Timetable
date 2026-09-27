# SKILL.md — Build Rules for This Project

These rules apply to every response and every file you generate for this
project. Follow them exactly, without exception, for the entire build.

## Identity
You are building a production-quality college management system that will
be demoed to real college management. Treat this as professional client
work, not a demo/toy project. Code quality, UI polish, and error handling
are as important as functionality.

## Tech stack lock-in (never change without being asked)
- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth)
- Nodemailer + Gmail SMTP for email
- Deployment: Vercel

Never introduce a new library, framework, or service that isn't already
listed above. If you genuinely believe one is needed, ask in one short
sentence before adding it — do not add it silently.

## Token efficiency rules (strict — the user has a limited budget)
- Do not re-explain the whole plan before each step. Just build.
- Do not regenerate files that haven't changed.
- Do not output large blocks of prose/commentary — a one or two line
  summary per step is enough, then show the code/diff.
- When editing an existing file, make a targeted edit — do not rewrite the
  entire file unless the change truly touches most of it.
- Do not ask multiple clarifying questions — ask at most one, only if truly
  blocking, and proceed with a sensible default otherwise.
- Avoid speculative/future-proofing code (no unused abstractions, no
  features not in the spec).

## Code quality rules
- TypeScript strict mode, no `any` unless unavoidable
- Every database call wrapped in proper error handling — never let a raw
  error reach the UI; always show a friendly message
- Every form: client-side validation + server-side validation
- Every list view: loading state, empty state, and error state must all be
  handled — no blank screens
- Keep components under ~150 lines; split into smaller components when
  larger
- Use meaningful names for variables, functions, and files — no `data1`,
  `temp`, `handleClick2`, etc.
- Add short comments only where logic is non-obvious (e.g. the
  substitute-ranking algorithm) — don't over-comment simple code

## UI/UX rules (this system must look impressive, not generic)
- Consistent spacing and alignment across all pages (use Tailwind's spacing
  scale consistently, don't eyeball it)
- One consistent color palette across the whole app — no page should look
  visually disconnected from another
- All buttons/actions have hover and active states
- All destructive actions (delete teacher, remove class) require a
  confirmation dialog
- All async actions show a loading indicator (button spinner or skeleton)
- Use toast notifications for success/error feedback — never use raw
  `alert()`
- Mobile responsiveness is mandatory, not optional — test every page
  mentally at a narrow width before considering it done

## Substitute-finder logic rules
- Always prioritize same-subject match first, then fairness (fewest
  substitutions this month) as the tiebreaker
- Never assign a teacher who is already absent, already teaching, or
  already assigned elsewhere in that exact time slot
- Always let the admin see and confirm the suggestion before it's final —
  never auto-send without a confirm step

## Communication style while building
- Be direct and concise. Skip filler like "Great question!" or long
  preambles.
- When you finish a step, state in one line what was built and what's next
  — don't wait to be asked "what's next."
- If something in the spec is ambiguous, make the most professional,
  sensible choice yourself and mention the assumption in one line — don't
  stop to ask unless it's truly a blocking decision.

## Definition of done (for the whole project)
- All pages from PROJECT_PROMPT.md exist and work end-to-end
- No console errors, no broken links, no untyped `any` left in
- App builds and deploys successfully on Vercel with Supabase connected
- README.md and .env.example are complete and accurate
- UI looks clean and professional enough to present to college management
  without further changes
