"""Extract the photography, avatar and logo from the supplied ShareUp design.

The design is a single flattened PNG (1213x1297). We crop the photographic
regions (hero group shot, opportunity covers, mobile hero portrait, social
proof portraits, header avatar) straight from the canvas, remove any baked-in
"Funding %" badge with a feathered clone, upscale with Lanczos and write
optimised WebP files into public/images.

The property cover only exists at ~280x86 inside the phone mock, which is too
small for a card. It is generated at 2x and cropped to the card aspect ratio
here instead; drop a replacement at /tmp/property-source.jpg to re-run.

Coordinates are pixels in the 1213x1297 design canvas.
"""
from PIL import Image, ImageFilter
import os

SRC = "/Users/theoneglobal/Downloads/ShareUp_ Own More Together.png"
PROPERTY_SRC = "/tmp/property-source.jpg"
OUT = "public/images"
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert("RGB")
print("source", im.size)


def save(crop, name, scale=1.0, quality=84, sharpen=1.1):
    if scale != 1.0:
        crop = crop.resize(
            (round(crop.width * scale), round(crop.height * scale)), Image.LANCZOS
        )
    crop = crop.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=3))
    crop.save(os.path.join(OUT, name), "WEBP", quality=quality, method=6)
    print(name, crop.size)


def clone(crop, rect, dy, feather=4):
    """Cover rect (l, t, r, b) with pixels taken dy below it."""
    l, t, r, b = rect
    patch = crop.crop((l, t + dy, r, b + dy))
    mask = Image.new("L", (r - l, b - t), 255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    crop.paste(patch, (l, t), mask)


# ------------------------------------------------------------------- hero
# Four-person group shot. The phone mock covers the canvas below y=455 on the
# right, so the frame stops just above it.
save(im.crop((430, 106, 1196, 458)), "hero-community.webp", 1.9)

# ------------------------------------------------------- opportunity covers
# Bulk Rice Purchase — erase the baked-in badge, then trim its top edge.
rice = im.crop((51, 742, 356, 892))
clone(rice, (2, 0, 138, 44), dy=42)
save(rice.crop((0, 12, rice.width, rice.height)), "cover-rice-bags.webp", 2.4)

# Farmland Investment already ships clean from the earlier extraction.
farmland = Image.open(os.path.join(OUT, "cover-farmland.webp")).convert("RGB")
farmland.save(os.path.join(OUT, "cover-farmland.webp"), "WEBP", quality=84)
print("cover-farmland.webp", farmland.size)

# Residential Property — 2:1 card crop of the generated source.
if os.path.exists(PROPERTY_SRC):
    prop = Image.open(PROPERTY_SRC).convert("RGB")
    w, h = prop.size
    target_h = round(w / 2)
    top = max(0, (h - target_h) // 2)
    prop = prop.crop((0, top, w, top + target_h)).resize((1200, 600), Image.LANCZOS)
    save(prop, "cover-property.webp", 1.0)

# --------------------------------------------------------- mobile hero photo
save(im.crop((1080, 642, 1172, 786)), "mobile-people.webp", 4.0)

# ------------------------------------------------------------- social proof
save(im.crop((43, 1163, 177, 1213)), "proof-avatars.webp", 4.5)

# ------------------------------------------------------------- header avatar
save(im.crop((1127, 57, 1169, 99)), "avatar-member.webp", 4.0)

# -------------------------------------------------------------------- logo
# The wordmark + people mark on the design's white header, trimmed.
logo = im.crop((34, 24, 315, 104))
bg = Image.new("RGB", logo.size, logo.getpixel((2, 2)))
from PIL import ImageChops

diff = ImageChops.difference(logo, bg).convert("L").point(lambda p: 255 if p > 24 else 0)
bbox = diff.getbbox()
logo = logo.crop(bbox)
logo = logo.resize((logo.width * 4, logo.height * 4), Image.LANCZOS)
logo.save(os.path.join(OUT, "logo-shareup.png"))
print("logo-shareup.png", logo.size)
