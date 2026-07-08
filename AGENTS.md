# ABoard — Agent Instructions

## Dev Commands
- `npm run tauri dev` — full-stack dev (Vite + Rust). Vite on port 5173.
- `npm run test` — Vitest (happy-dom). Tests live in `src/**/*.test.{ts,tsx}`.
- `npm run build:macos` — production build + ad-hoc codesign for macOS.
- Rust tests: no test framework configured (only `tempfile` dev-dep). Run via `cargo test` in `src-tauri/`.

## Architecture
- **Two Tauri windows**: `"main"` (1000×640, resizable) and `"floating"` (280×520, alwaysOnTop, skipTaskbar).
- **Entrypoint dual-route** (`src/App.tsx`): checks `getCurrentWindow().label` — if `"floating"`, renders `<FloatingPopup />` only; otherwise renders the full app.
- **Window lifecycle**: close → hide (not quit). Both windows intercept `CloseRequested`, call `event.preventDefault()` then `hide()`. App runs in tray until explicit quit.
- **macOS**: `"Overlay"` titleBarStyle (native traffic lights, no title bar), `macOSPrivateApi: true`, ad-hoc signing via `entitlements.plist`.
- **Windows**: decorations disabled at runtime via `set_decorations(false)` to avoid double title bar (macOS handles this via `tauri.conf.json`).

## AI Providers (4)
| Provider | Type | Rust module |
|----------|------|-------------|
| Built-in (Candle) | Embedded GGUF | `src-tauri/src/ai/embedded.rs` |
| Ollama | Local | `src-tauri/src/ai/local.rs` |
| OpenAI | Cloud | `src-tauri/src/ai/cloud.rs` |
| Anthropic | Cloud | `src-tauri/src/ai/cloud.rs` |

AI processing is async via `ai::processor::start_processor()` in `setup()`.

## Clipboard Monitor
- Polling every **200ms**, SHA256 dedup, max 10 MB content / 15 MB raw image.
- Content types: Text, HTML, Image, Video, File, RichText. Auto-classified.
- SQLite + FTS5 for storage/search. Semantic search via AI keyword expansion.

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+V` | Toggle floating quick-paste popup |
| `Cmd/Ctrl+Shift+J` | Cycle through history + paste (2s inactivity resets) |
| `Cmd/Ctrl+K` | Focus search bar |

All registered globally via `tauri-plugin-global-shortcut` in `lib.rs:setup()`.

## Frontend Conventions
- **SolidJS** with reactive stores in `src/stores/` (signals-based).
- **Tailwind CSS v4** (via `@tailwindcss/vite`). Custom CSS in `src/styles/`.
- **Phosphor Icons**: three weight sets imported in `src/index.tsx` (`regular`, `fill`, `bold`). Use `<i class="ph ph-..." />` syntax.
- **i18n**: signal-based store at `src/stores/i18n.ts`, call `t("key")`.
- **Format tools**: `turndown` (HTML→Markdown), `markdown-it` (Markdown→HTML).
- **CSP allows**: `connect-src 'self' https://api.github.com` (for GitHub release checks).

## Rust Backend
- Crate name: `aboard_lib` (staticlib + cdylib + rlib). Entry: `main.rs` calls `aboard_lib::run()`.
- SQLite via `rusqlite` (bundled), managed as `DbState { conn: Mutex<Connection> }` Tauri state.
- Platform deps: `core-graphics` (macOS), `windows 0.61` (Win32 input).
- Commands registered in `lib.rs` via `generate_handler![]` — always add new commands there.

## Constraints (from CLAUDE.md)
- Tauri v2, no cloud dependency by default, app <20MB (excl. AI model).
- GSD workflow enforcement applies before editing files — use `/gsd-quick` for ad-hoc tasks.
