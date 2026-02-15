# Talha Khalil — Portfolio & Knowledge Website

A static portfolio and knowledge base website featuring System Design interview prep topics, project showcase, and resume.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)

### Install & Build

```bash
bun install
bun run build
```

### Local Development

```bash
bun run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
├── build.ts                 # Build script (markdown → HTML)
├── serve.ts                 # Local dev server
├── content/                 # Markdown content files
│   └── system-design/
│       ├── _meta.json       # Topic ordering & metadata
│       └── *.md             # Individual topic files
├── templates/               # HTML templates
│   ├── base.html            # Shared layout
│   ├── home.html            # Homepage template
│   └── topic.html           # Topic page template
├── assets/                  # Static assets
│   ├── css/style.css        # Design system
│   └── js/main.js           # Client-side JS
└── docs/                    # Built output (GitHub Pages)
```

## 🌐 Deploy to GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Set Source to **Deploy from a branch**
4. Set Branch to `main` and folder to `/docs`
5. Save — your site will be live at `https://<username>.github.io/<repo>`

## ✏️ Adding New Topics

1. Create a new `.md` file in `content/system-design/`
2. Add the topic to `content/system-design/_meta.json`
3. Run `bun run build`

## 📝 Adding New Sections (OS, Networks, etc.)

1. Create a new directory under `content/` (e.g., `content/operating-systems/`)
2. Create a `_meta.json` with the section structure
3. Add markdown files for each topic
4. Run `bun run build`
