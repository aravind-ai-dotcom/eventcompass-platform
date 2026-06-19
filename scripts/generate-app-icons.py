#!/usr/bin/env python3
"""Generate Compass PWA / home-screen icons from public/compass-mark-black.png."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public"
ICONS = ROOT / "icons"
IBM_BLUE = (0, 45, 156)  # IBM Blue 70 — deeper, more premium than #0f62fe
IBM_DARK = (22, 22, 22)
MARK_SCALE = 0.66
MASKABLE_SCALE = 0.48


def mark_from_black_png(path: Path) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    px = src.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, _ = px[x, y]
            if r > 220 and g > 220 and b > 220:
                px[x, y] = (0, 0, 0, 0)
            else:
                px[x, y] = (255, 255, 255, 255)
    return src


def compose_icon(mark: Image.Image, bg: tuple[int, int, int], size: int, mark_scale: float) -> Image.Image:
    canvas = Image.new("RGB", (size, size), bg)
    target_w = int(size * mark_scale)
    target_h = int(target_w * mark.height / mark.width)
    resized = mark.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def main() -> None:
    ICONS.mkdir(exist_ok=True)
    mark = mark_from_black_png(ROOT / "compass-mark-black.png")

    blue_master = compose_icon(mark, IBM_BLUE, 1024, MARK_SCALE)
    dark_master = compose_icon(mark, IBM_DARK, 1024, MARK_SCALE)
    blue_master.save(ICONS / "icon-1024-blue.png", optimize=True)
    dark_master.save(ICONS / "icon-1024-dark.png", optimize=True)

    primary = blue_master
    for name, dim in [("icon-512.png", 512), ("icon-192.png", 192), ("icon-180.png", 180)]:
        primary.resize((dim, dim), Image.Resampling.LANCZOS).save(ICONS / name, optimize=True)

    primary.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "apple-touch-icon.png", optimize=True)
    primary.resize((32, 32), Image.Resampling.LANCZOS).save(ROOT / "favicon.png", optimize=True)
    compose_icon(mark, IBM_BLUE, 512, MASKABLE_SCALE).save(ICONS / "icon-512-maskable.png", optimize=True)

    print("Icons written to", ICONS)


if __name__ == "__main__":
    main()
