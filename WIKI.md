# Yori's House — Wiki

## Overview

**Yori's House** is a portfolio website designed as an interactive house metaphor. Each "room" represents a different category of creative work (music, art, game assets, software, etc.). The site emphasizes organization, atmosphere, and direct creator-to-buyer transactions.

---

## Site Structure

```
/workspace
├── index.html              # Main homepage
├── rooms/                  # Individual room pages
│   ├── 01-songs.html
│   ├── 02-illustration.html
│   ├── 03-game-assets.html
│   ├── 04-yori-os.html
│   └── 05-everything-else.html
├── assets/
│   ├── css/
│   │   └── main.css        # All stylesheets
│   ├── js/
│   │   ├── view-detect.js  # Device view detection
│   │   ├── home.js         # Homepage interactions
│   │   ├── site.js         # Room page interactions
│   │   └── copy-usdt.js    # Copy-to-clipboard utility
│   └── img/                # Images and graphics
├── archive/                # Archived content
├── LICENSE-MUSIC.md        # Music licensing terms
└── WIKI.md                 # This file
```

---

## Features

### Visual Design
- **Atmospheric UI**: Starfield canvas background, film grain overlay, cursor glow effect
- **Responsive Layout**: Adapts to desktop and mobile views with a toggle preview
- **Typography**: Uses Fraunces (serif) and Space Grotesk (sans-serif) fonts
- **Color Palette**: Deep violets, warm ambers, and soft pastels for room accents

### Interactive Elements
- **Room Cards**: Hover effects with light bulbs that illuminate on interaction
- **Audio Player**: Embedded player for previewing the latest track
- **Marquee Banner**: Scrolling text showcasing content categories
- **Mobile Menu**: Collapsible navigation for smaller screens

### Navigation
- **Header Nav**: Links to Rooms, Music, About, Buy, and Socials sections
- **Smooth Scrolling**: Anchor links scroll smoothly to sections
- **Device Toggle**: Switch between desktop/mobile layout previews

---

## Rooms

| Room | Content | Description |
|------|---------|-------------|
| 01 | Original Songs | 14 tracks available for streaming and download |
| 02 | Illustration & Anime Art | Character sheets, prints, and art packs |
| 03 | Game Assets | Sprites, tilesets, and UI kits for game developers |
| 04 | Yori OS | Documentation about the agent system |
| 05 | Everything Else | Experiments, one-offs, and drafts |

---

## How to Use

### For Visitors
1. **Browse Rooms**: Click "Walk through the house" or scroll to the Rooms section
2. **Preview Content**: Hover over room cards to see details
3. **Listen to Music**: Use the audio player in the Music section
4. **Purchase Items**: 
   - Select a piece from any room
   - Contact Yori via social media or YouTube
   - Pay via USDT (TRC-20 network)
   - Receive files directly after payment confirmation

### For Developers
1. **Customize Styles**: Edit `assets/css/main.css`
2. **Add Interactions**: Modify JavaScript files in `assets/js/`
3. **Add Rooms**: Create new HTML files in the `rooms/` directory following the existing template
4. **Update Content**: Edit `index.html` for homepage content

---

## Technical Details

### Dependencies
- **Fontsource**: Fraunces and Space Grotesk fonts via CDN
- **No Framework**: Pure HTML, CSS, and vanilla JavaScript

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design tested on iOS and Android

### Performance
- Minimal external dependencies
- Optimized asset loading with preconnect hints
- No tracking scripts or analytics by default

---

## Purchase Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Pick Item  │ →   │ Message Yori │ →   │ Pay (USDT)  │
└─────────────┘     └──────────────┘     └─────────────┘
                                              ↓
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Receive Files│ ←   │ Confirmation │ ←   │  Receipt    │
└─────────────┘     └──────────────┘     └─────────────┘
```

**Payment Method**: USDT on Tron (TRC-20) network  
**Contact**: Social media links or YouTube channel

---

## Licensing

See `LICENSE-MUSIC.md` for detailed terms regarding music usage, redistribution, and commercial rights.

---

## Contributing

This is a personal portfolio site. For questions or collaboration inquiries, contact through the social links provided on the site.

---

## Changelog

- **v1.0**: Initial release with 5 rooms, audio player, and purchase flow
- **v1.1**: Separated JavaScript into modular files for maintainability

---

*Last updated: July 2025*
