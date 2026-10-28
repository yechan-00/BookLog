This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Git Rules (team-wide · apply to both humans and AI agents)

This repository is developed by a two-person team (한인웅, 한예찬), split by feature according to the PRD. Always follow the rules below before doing any git work.

### 1. Branches

- Keep `main` in a runnable state at all times. Never commit or push directly to `main`; merge only through PRs.
- Working branch name: `<type>/<requirement-ID>-<short-description>` (lowercase English, hyphen-separated)
  - Examples: `feat/READ-01-timer`, `fix/BOOK-02-isbn-duplicate`, `chore/setup-supabase`
  - Requirement IDs follow the PRD: `AUTH`, `GOAL`, `BOOK`, `READ`, `INDEX`, `VIEW`, `NOTI`, `ADMIN` + number. Omit the ID if none applies.
- One branch carries one feature (1–2 requirements). Open a PR within 2–3 days.
- Sync with `git pull --rebase origin main` before starting work and before opening a PR.

### 2. Commit messages

Format: `<type>(<scope>): <summary>`

| type | Purpose |
| --- | --- |
| feat | New feature |
| fix | Bug fix |
| refactor | Structural improvement with no behavior change |
| style | UI/style-only changes |
| docs | Documentation |
| chore | Config, dependencies, build |
| test | Tests |

- scope: one of `auth`, `goal`, `book`, `read`, `index`, `view`, `noti`, `admin`, `common`.
- Summary: English, imperative mood, 50 characters or fewer, no trailing period, describing what was done.
- Body (optional): leave one blank line, then explain why the change was made.
- Examples: `feat(read): implement start-time-based reading timer`, `fix(book): reuse existing book on duplicate ISBN`
- Split commits into small logical units. Do not mix formatting or renames with functional changes.
- Leave any `Co-authored-by` trailer added by AI tools as is.

### 3. Pull requests

- The PR title uses the same format as commit messages.
- The PR description must include:
  - Related requirement ID(s)
  - Summary of changes
  - How to verify (which screen, what to do)
  - Screenshots for UI changes
- Make `npx tsc --noEmit` and `npx expo lint` pass before opening the PR.
- Once one teammate approves, merge with **Squash and merge**, then delete the working branch.

### 4. Ownership and avoiding conflicts

- The owner listed in the role-assignment table owns the files for that feature. If you edit files owned by the other teammate, say so in the PR description.
- Shared files must be changed in a small, separate PR that is merged first: `types/`, `constants/`, `components/common/`, `package.json`, `app.json`.
- Add packages only with `npx expo install <package>`, and commit `package.json` and `package-lock.json` together.

### 5. Prohibited

- Do not commit secrets. Keep API keys and Supabase keys only in `.env.local` (already in `.gitignore`).
- In app code, use only variables prefixed with `EXPO_PUBLIC_`. **Never put the Supabase service role key in the app or anywhere in the repository.**
- Never `git push --force` to `main`. `--force-with-lease` is allowed only on your own working branch.
- Do not commit `node_modules/`, `.expo/`, `ios/`, or `android/`.
- Line endings are fixed to LF (`.gitattributes`). Do not commit files whose only change is line endings.

### 6. Additional rules for AI agents

- Do not commit, push, merge, or rebase unless the user explicitly asks.
- Before committing, show the list of changed files and the commit message, and get confirmation.
- If the current branch is `main`, create a working branch named per rule 1 before editing any code.
- Do not modify files outside the requested scope (no bulk reformatting or mass renames).
- Do not add features outside the PRD's MVP (P0) scope (P1/P2) on your own.

## Coding Rules

### 1. Changing existing code

- Follow the conventions of the surrounding code (naming, formatting, file layout, comment density) over personal preference.
- Make the smallest change that solves the task. Do not refactor, rename, reformat, or "clean up" code unrelated to the request; propose it separately instead.
- Do not change the signature, props, return shape, or behavior of an existing function, component, hook, or type without finding every usage first (search the repo) and updating them in the same change.
- Prefer extending over rewriting. Do not delete code you do not understand; check usages and git history first.
- Remove only what your own change made unused (imports, variables, dead branches). Leave pre-existing dead code alone and mention it.
- Do not edit generated or lock files by hand (`package-lock.json`, `.expo/`, `expo-env.d.ts`).

### 2. TypeScript

- `strict` mode stays on. Do not weaken it or add `// @ts-ignore` / `// @ts-expect-error` to silence errors; fix the types.
- Avoid `any`. Use `unknown` and narrow it, or define a proper type. Shared domain types live in `types/`.
- Prefer `interface` for object shapes and `type` for unions and aliases.
- Use the `@/` path alias for cross-folder imports; use relative imports only within the same feature folder.
- No non-null assertions (`!`) unless the invariant is guaranteed and commented.

### 3. Naming and structure

- Components, types, and interfaces: `PascalCase`. Variables, functions, hooks: `camelCase`. Constants: `UPPER_SNAKE_CASE`. Booleans read as questions (`isLoading`, `hasError`).
- Hooks start with `use`. Event handler props start with `on`, handlers with `handle`.
- One component per file, named after the file. Match the casing already used in each folder (check neighbors before creating a file).
- Keep screens in `app/` thin: compose components and call hooks. Put UI in `components/<feature>/`, pure logic in `utils/`, shared types in `types/`, shared values in `constants/`.
- Keep functions small and single-purpose. Extract when a component or function grows hard to read, not preemptively.
- No default magic values: hoist repeated strings and numbers to `constants/`.
- Do not duplicate logic; reuse existing helpers in `utils/` and `components/common/` before writing new ones.

### 4. React / React Native

- Function components and hooks only. No class components.
- Style with `StyleSheet.create` and the tokens in `constants/colors.ts` and `constants/theme.ts`. No hard-coded colors, font sizes, or spacing in components.
- Respect safe areas, keyboard avoidance, and both light/dark themes if the project supports them.
- Use `FlatList` / `SectionList` for long or dynamic lists, with a stable `keyExtractor`. Do not map large lists inside `ScrollView`.
- Keep effects minimal: include correct dependency arrays, clean up subscriptions and timers, and do not derive state in effects when it can be computed during render.
- Use `useMemo` / `useCallback` / `React.memo` only to fix a measured or obvious re-render problem, not by default.
- Use `expo-router` for navigation (`Link`, `router`); no other navigation library.
- Make interactive elements accessible: set `accessibilityLabel` / `accessibilityRole` on icon-only buttons and give touch targets at least 44x44 pt.
- Code must work on iOS, Android, and web; use `Platform.select` / platform files only when behavior truly differs.

### 5. Data and errors

- Treat all external data (API, storage, route params) as untrusted: validate or narrow it before use.
- Handle loading, empty, and error states for every data-driven screen.
- Never swallow errors silently (`catch {}`). Handle them, surface them to the user where relevant, or rethrow.
- Keep dates as ISO 8601 strings or `Date` consistently with `utils/date.ts`; do not parse or format dates ad hoc.
- Keep mock data in `data/` only and do not import it from production code paths once a real data source exists.

### 6. Comments, logging, and quality

- Write self-explanatory code; comment the *why*, not the *what*. No commented-out code and no leftover `console.log`.
- Track unfinished work as `TODO(<requirement-ID>): ...` with a reason; do not leave bare `TODO`s.
- Do not add dependencies for something a few lines of code or an existing Expo module can do (see Rules above).
- Run `npx expo lint` and `npx tsc --noEmit` and fix the issues your change introduced before declaring work done.
- Verify UI changes by running the app (or state clearly that you could not) rather than assuming they work.

## Documentation Rules

Documentation is part of the work: a requirement is not done until its documentation is updated in the same PR.

### 1. PRD status

- When a PR implements (fully or partly) a requirement from `docs/PRD.md`, update that requirement's status in the same PR (for example, mark it done or in progress).
- If the implementation changes or clarifies the requirement or its acceptance criteria, edit the PRD to match what was actually built. Do not leave the PRD out of date.
- Do not add, remove, or reprioritize requirements (P0/P1/P2) on your own; raise it with the team first.

### 2. Decision records

- Record hard-to-reverse or cross-cutting decisions in `docs/decisions/NNN-short-title.md`, numbered sequentially (`001-...`). Examples: choosing a library or backend service, data model changes, state management or folder structure conventions.
- Keep each record short, with these sections: Context, Decision, Alternatives considered, Consequences.
- Do not edit an accepted record to change history. Add a new record that supersedes it and link the two.

### 3. PR checklist

Every PR description includes this checklist (mark items not applicable as N/A):

- [ ] Related requirement ID(s) listed
- [ ] `docs/PRD.md` status updated
- [ ] Decision record added for any significant decision
- [ ] Screenshots attached for UI changes
- [ ] `npx tsc --noEmit` and `npx expo lint` pass
