# Evo Wellness Studio - Digital Home

Welcome to the official repository for the **Evo Wellness Studio** website. This project aims to create a modern, community-focused digital extension of the physical studio—a welcoming, energetic, and seamless platform designed to attract and engage the wellness community.

## 🌟 Vision
Evo Wellness Studio is more than just a yoga studio; it's a movement. Our digital presence is built to be an effective sales tool and a central hub for this growing community, starting with the launch in Hamburg and designed to scale beyond.

## 🚀 Key Features
- **Multi-lingual Support:** A seamless language switch to cater to a diverse, international audience.
- **Eversports Integration:** Full integration with [Eversports.de](https://www.eversports.de) for frictionless class bookings and event scheduling.
- **Conversion-Oriented Design:** Strategically guided user journeys from discovery to booking.
- **Email Marketing Integration:** Built-in capture forms (Mailchimp/Constant Contact) to build early traction and maintain community engagement.
- **Mobile-First Experience:** Flawless performance and aesthetics across all devices.

## 🛠 Tech Stack
This project leverages modern, high-performance technologies to ensure a future-proof and secure asset:

- **[AstroJS](https://astro.build/):** A modern web framework for building fast, content-focused websites.
- **[TinaCMS](https://tina.io/):** A headless, Git-backed CMS that allows for real-time visual editing and content management directly via GitHub.
- **Tailwind CSS:** For a utility-first, highly customizable design system.
- **GitHub:** Centralized version control and collaborative development.

## 🏗 Project Structure
The site is built with an "Island Architecture" approach provided by Astro, ensuring minimal JavaScript overhead and maximum performance.

- `src/pages/`: Contains the routes for the multi-lingual site.
- `src/components/`: Reusable UI components.
- `content/`: Markdown/MDX files managed by TinaCMS.
- `tina/`: Configuration for the TinaCMS schema and visual editor.

## 📋 Development Roadmap
1.  **Phase 1: Strategy & Infrastructure:** Setting up GitHub, TinaCMS, and project scaffolding.
2.  **Phase 2: Design & Core Dev:** Implementing the mobile-first UI and multi-lingual routing.
3.  **Phase 3: Integrations:** Connecting Eversports booking and email marketing services.
4.  **Phase 4: Launch & Handover:** UAT, deployment, and client training.

## 🤝 Collaboration
We believe in transparency and agility.
- **Communication:** Centralized via Telegram for real-time feedback.
- **Updates:** Daily progress reports to ensure alignment with the project timeline.

---
*Built with ❤️ by Khanyi Media*

---

## EOS Club — pre-launch landing page

Open [`index.html`](index.html) in your browser for the primary landing page.

If you prefer serving it locally:

```bash
python3 -m http.server 5173
```

Then visit:

```text
http://localhost:5173/index.html
```

### 🎯 Favicon & Icon Support

The landing page includes comprehensive favicon and app icon support across all devices:

| Device / Platform | Asset | Support |
|---|---|---|
| **Browser Tabs** | `favicon.ico` + `favicon.svg` | ✅ All browsers |
| **iOS Home Screen** | `apple-touch-icon.png` (180×180) | ✅ iOS Safari |
| **Android/PWA** | Manifest icons (192×192, 512×512) | ✅ Android + Progressive Web App |
| **macOS Safari Tabs** | `favicon.svg` | ✅ Safari pinned tabs |
| **Windows Tiles** | `favicon.ico` | ✅ Windows 11 taskbar |
| **Status Bar Theming** | Meta theme color (`#050505`) | ✅ Mobile browsers |
| **App Installation** | Web App Manifest (`site.webmanifest`) | ✅ PWA-capable devices |

**Implementation Details:**
- Link tags added to `<head>` for all favicon formats
- Web manifest configured for PWA with maskable icons
- Colors aligned to design system (infrared void `#050505`, charcoal `#141414`)
- Apple web app meta tags enable full-screen mode on iOS
- Black translucent status bar for immersive mobile experience

**Files Involved:**
- [`index.html`](index.html) — Favicon link declarations
- [`favicon.ico`](favicon.ico) — Standard favicon (16×16, 32×32)
- [`assets/favicon.svg`](assets/favicon.svg) — Scalable vector favicon
- [`assets/apple-touch-icon.png`](assets/apple-touch-icon.png) — iOS home screen icon
- [`assets/site.webmanifest`](assets/site.webmanifest) — PWA manifest with branding
- [`assets/web-app-manifest-192x192.png`](assets/web-app-manifest-192x192.png) — Android maskable icon
- [`assets/web-app-manifest-512x512.png`](assets/web-app-manifest-512x512.png) — Android maskable icon (large)
