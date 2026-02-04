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

### 🌐 Bilingual Support (German/English)

The landing page includes fully accessible bilingual support with automatic language detection:

**Features:**
- ✅ Language toggle in top-right corner: "Deutsch || English"
- ✅ Automatic browser language detection on first visit
- ✅ Persistent language preference via `localStorage`
- ✅ Instant language switching without page reload
- ✅ Preserves all animations and state during switch
- ✅ Full WCAG 2.1 AA accessibility compliance

**Technical Implementation:**
- `<html lang="de|en">` attribute updated dynamically
- Semantic `<button>` elements with `aria-label` and `aria-pressed` states
- Screen reader announcements when language changes
- Data-i18n attributes for content translation
- Keyboard navigation (Tab, Enter, Space keys)

**Languages Supported:**
- **German (de):** Default language; Cologne-focused copy with regional messaging
- **English (en):** Full English translations with matching messaging

**Files:**
- [`index.html`](index.html) — Language toggle UI and i18n JavaScript module

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

### 📧 Email Collection (Google Apps Script)

The landing page uses **Google Apps Script** to capture email signups directly to a Google Spreadsheet.

**Setup Required:**
1. Create a Google Spreadsheet for collecting emails
2. Add the script from [`google-apps-script.js`](google-apps-script.js) via Extensions > Apps Script
3. Deploy as Web App with "Anyone" access permissions
4. Update the Web App URL in [`index.html`](index.html) line 748

**Files:**
- [`google-apps-script.js`](google-apps-script.js) — Server-side email capture script
- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) — Complete deployment instructions
- [`TROUBLESHOOTING_403_ERROR.md`](TROUBLESHOOTING_403_ERROR.md) — Fix common permission issues

**Features:**
- ✅ CORS-free email submissions
- ✅ Server-side validation
- ✅ Automatic timestamps
- ✅ localStorage backup
- ✅ Tracks user agent data

See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for full setup instructions.


### The following is related to phase #1 for the temporary landing page


 # 🎨 Landing Page Design & Visual Hierarchy

**Maintained the stunning neural glow background** with WebGL shader animation that responds to mouse movement, using the infrared color palette from [`design_system_v2.html`](design_system_v2.html)

**Clean, centered layout** with:
- Large, prominent red EOS logo with glow effect
- "EOS CLUB" in gradient text with fade-in animations
- Clear tagline: "A Wellness Community. Sweat in a new light."
- Engaging description about activities (Pilates, Barre, etc.)
- Launch info badge with pulsing animation
- Prominent email signup form

## ♿ Accessibility Features

- **Semantic HTML5**: `<main>`, `<article>`, proper heading hierarchy
- **ARIA labels**: Form inputs, buttons, live regions for status updates
- **Screen reader support**: `.sr-only` class for hidden but accessible labels
- **Keyboard navigation**: Proper focus states with visible outlines
- **Form validation**: Client-side email validation with clear error feedback
- **Reduced motion support**: Respects `prefers-reduced-motion` preference
- **High contrast mode**: Enhanced borders for better visibility

## 📱 Responsive Design

- Fluid typography using `clamp()` for perfect scaling
- Mobile-first approach with breakpoints at 640px and 420px
- Stacked form layout on mobile devices
- Touch-friendly button sizes (minimum 44x44px)
- Flexible spacing with viewport-relative units

## 🎯 Information Architecture

1. **Visual anchor**: Logo establishes brand identity
2. **Primary message**: Brand name and tagline
3. **Value proposition**: Description of offerings
4. **Urgency/incentive**: Launch date and discount
5. **Call-to-action**: Email signup form
6. **Feedback**: Success message after submission

## ✨ Interactive Features

- Smooth fade-in animations for all content
- Pulsing launch badge to draw attention
- Hover effects on logo and button
- Live email validation with visual feedback
- Success message replaces form after submission
- Touch and pointer event support for all devices

## 🚀 Performance

- Efficient WebGL rendering with reduced pixel ratio
- CSS animations using `transform` and `opacity` for GPU acceleration
- Lazy animation start (animations begin after load)
- Fallback for browsers without WebGL support

## 📊 Standards Compliance

- Valid HTML5 semantic markup
- WCAG 2.1 AA compliant contrast ratios
- Proper meta tags for SEO and social sharing
- Progressive enhancement (works without JavaScript)
- Cross-browser compatible (modern browsers)

The form currently logs submissions to console. Replace the commented API endpoint with your actual backend to capture email addresses.
