# Compass — Mobile App Icon & Home Screen Brief

## Purpose

Premium home-screen icon for **Add to Home Screen** (iOS Safari) and **Install app** (Android Chrome) for EventCompass TechXchange.

## Brand mark

- **Source asset:** `public/compass-mark-black.png` / `compass-mark-white.jpeg`
- **Symbol:** Hub-and-spoke compass (network / navigation / intelligence)
- **Do not include:** “TechXchange”, “IBM”, or “Compass” wordmarks in the icon

## Primary icon (shipped)

| Property | Value |
|----------|--------|
| Background | IBM Blue 70 `#002d9c` |
| Mark | White compass, ~66% of canvas width |
| Master | `icons/icon-1024-blue.png` |
| Alternate | `icons/icon-1024-dark.png` (`#161616` background) |

## Safe area

- **iOS:** System applies squircle mask; keep mark centered with ~20% margin
- **Android maskable:** `icon-512-maskable.png` uses ~42% mark width for adaptive icon safe zone

## Exported sizes

| File | Size | Use |
|------|------|-----|
| `apple-touch-icon.png` | 180×180 | iPhone home screen |
| `icons/icon-192.png` | 192×192 | Android |
| `icons/icon-512.png` | 512×512 | Android install / splash |
| `icons/icon-512-maskable.png` | 512×512 | Android adaptive |
| `favicon.png` | 32×32 | Browser tab |

## Regenerating icons

From repo root (requires Python Pillow):

```bash
python3 scripts/generate-app-icons.py
```

## PWA metadata

- Manifest: `public/manifest.webmanifest`
- `start_url`: `/txc`
- Home screen title: **Compass**
- `theme_color`: `#002d9c`

## Design principles (Carbon-aligned)

1. **One idea** — compass mark only  
2. **Solid plate** — no transparent or photographic backgrounds  
3. **High contrast** — white on IBM blue or dark  
4. **No fine text** — illegible below 60px  
5. **Premium, calm** — avoid gradients, shadows, or event photography in the icon  

## Optional future refinements

- Vector SVG master for sharper 1024 export  
- SF Symbol–style weight tuning for iOS parity  
- Separate SKO icon variant (`Compass SKO`) if standalone SKO PWA is needed  

## QA checklist

- [ ] iPhone: Safari → Share → Add to Home Screen → shows blue Compass icon  
- [ ] Android: Chrome → Install app → correct icon  
- [ ] Icon readable at 60px and 120px  
- [ ] Opens to `/txc` in standalone mode  
