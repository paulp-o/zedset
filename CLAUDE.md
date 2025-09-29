# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Zed Settings Editor - a client-only SvelteKit web application that provides a GUI for editing Zed editor settings. The app imports Zed settings JSON/JSONC files, allows editing through a friendly interface, and exports clean JSON containing only changes from defaults.

## Common Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run all tests (unit + e2e)
pnpm test

# Run unit tests only
pnpm test:unit

# Run e2e tests only
pnpm test:e2e

# Watch unit tests during development
pnpm test:unit --watch

# Type checking
pnpm check

# Continuous type checking
pnpm check:watch

# Lint and format
pnpm lint
pnpm format
```

## Architecture Overview

### Core Data Flow

The application operates on three authoritative input sources:

1. **Default Settings** - **FETCHED LIVE** from Zed GitHub repo: `https://raw.githubusercontent.com/zed-industries/zed/refs/heads/main/assets/settings/default.json` - Provides default values and human-readable descriptions from comments
2. **Schema** (`schema.json`) - JSON Schema for validation and widget hints
3. **UI Meta** (`ui.json`) - Defines grouping, labels, ordering, and widget overrides

### Key Data Objects

- **Defaults**: Parsed value tree from Default Settings
- **User**: User-supplied settings (imported or edited)
- **Effective**: `merge(Defaults, User)` - what the editor displays
- **Delta**: Pruned difference between Effective and Defaults (exported)

### Directory Structure

```
src/
├── lib/
│   ├── parsers/     # JSONC parsing, defaults + docs map extraction
│   ├── core/        # merge, diff, prune, JSON pointer utilities
│   ├── ui/          # grouping, widget registry, field ordering
│   ├── stores/      # minimal app state using Svelte 5 runes
│   └── components/  # UI components (Sidebar, Field, Toolbar, dialogs)
└── routes/
    ├── +layout.svelte
    ├── +layout.ts    # prerender=true, csr=true
    └── +page.svelte  # main editor view
```

## Framework & Technology Stack

- **Framework**: SvelteKit with Svelte 5 (use runes, NOT legacy reactive statements)
- **Styling**: Tailwind CSS + shadcn-svelte components
- **Icons**: Lucide via `lucide-svelte`
- **Validation**: `ajv` for JSON Schema validation
- **JSONC Parsing**: `jsonc-parser` for handling comments
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Type System**: TypeScript with strict settings

## Important Implementation Notes

### Svelte 5 Usage

- **ALWAYS use Svelte 5 syntax with runes** (`$state`, `$derived`, `$effect`)
- Never use legacy Svelte 4 reactive statements (`$:`)
- Component props use the `let { prop = $bindable() }` syntax for two-way binding

### Testing Setup

- **NO UNIT TESTS** - We do not implement unit tests in this project
- E2E tests may be considered for critical workflows if needed

### Data Processing Pipeline

1. **Fetch live default settings** from Zed GitHub repo at startup
2. Parse JSONC to extract defaults and description mappings
3. Validate with JSON Schema to provide field-level errors
4. Apply UI metadata for grouping and widget selection
5. Render fields with appropriate controls (switch, select, number, text, etc.)
6. Export delta-only JSON on save

### Live Data Sources

- **Default Settings URL**: `https://raw.githubusercontent.com/zed-industries/zed/refs/heads/main/assets/settings/default.json`
- **Must be fetched at application startup** - no local copy
- **Handle network failures gracefully** with appropriate error messages

### Key Features to Maintain

- **Changed-Only Filter**: Hide fields where Effective equals Defaults
- **Reset Controls**: Per-field, per-section, and global reset functionality
- **Search**: Filters by path, label, and description text
- **Validation**: Real-time field-level validation with export blocking
- **No Persistence**: All data remains in browser memory only

## Quality Standards

- Run `pnpm lint` before committing - uses ESLint + Prettier
- Type checking with `pnpm check` must pass
- All tests must pass with `pnpm test`
- Follow existing component patterns and Tailwind usage
- Maintain accessibility with proper ARIA labels and keyboard navigation
- don't run devserver unless prompted.
- **DON'T RUN `pnpm build` unless the user reports an error** - assume changes work
- everytime before working on a task, read the related .md file tasks/. Also, after working, check the checkbox in each task md file.
