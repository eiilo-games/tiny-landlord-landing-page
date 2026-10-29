#!/usr/bin/env bash
# Builds the site's game images from the three game repos next to this one:
#   img/<game>-icon-512.png, -180.png, -32.png   each game's Play listing icon
#                                                (store/general/icon_512.png)
#   img/tycoon-shot-N.webp      the Tycoon's Play screenshots, 1080x1920
#                               (the screenshot viewer opens these)
#   img/tycoon-shot-N-sm.webp   the same at 360x640 (the strip on the page)
#   img/social-tycoon.png       the Tycoon's 1200x630 share card, cropped from
#                               its Play feature graphic (smooth art)
#
# Needs ImageMagick 7. With --capture it first re-renders the Tycoon's store
# images from the current game (Godot 4.7 and a display needed): the Play
# screenshots and the feature graphic. The capture uses a throwaway save and
# trophy store, so the player's user:// files are never touched.
#
#   tools/build-art.sh [--capture]
set -euo pipefail

SITE="$(cd "$(dirname "$0")/.." && pwd)"
TYCOON="$(cd "$SITE/../tiny-landlord-tycoon" && pwd)"

if [ "${1:-}" = "--capture" ]; then
	# --disable-vsync: a capture window hidden behind others gets no frames
	# from the compositor and would stall (playbook §14).
	godot --audio-driver Dummy --disable-vsync --path "$TYCOON" -s store/screenshots/capture.gd -- --no-ads \
		| grep -E '\.png' || true
	"$TYCOON/store/general/feature_graphic.sh"
fi

# --- Icons -------------------------------------------------------------------
for pair in classic:tiny-landlord tycoon:tiny-landlord-tycoon idle:tiny-landlord-idle; do
	name=${pair%%:*}
	src="$SITE/../${pair#*:}/store/general/icon_512.png"
	magick "$src" -strip "$SITE/img/$name-icon-512.png"                    # JSON-LD image
	magick "$src" -resize 180x180 -strip "$SITE/img/$name-icon-180.png"    # apple-touch-icon, hero, games bar, family list
	magick "$src" -resize 32x32 -strip "$SITE/img/$name-icon-32.png"       # favicon
done

# --- Tycoon screenshots, in the Play listing's order -------------------------
# Remove the old ones first, so a shot dropped from the listing goes too.
rm -f "$SITE"/img/tycoon-shot-*.webp
n=0
for f in "$TYCOON"/store/screenshots/[1-9]_*.png; do
	n=$((n + 1))
	magick "$f" -strip -quality 85 "$SITE/img/tycoon-shot-$n.webp"
	magick "$f" -resize 360x640 -strip -quality 82 "$SITE/img/tycoon-shot-$n-sm.webp"
done

# --- Tycoon share card -------------------------------------------------------
magick "$TYCOON/store/general/feature_graphic.png" -resize x630 -gravity center -crop 1200x630+0+0 +repage -strip \
	"$SITE/img/social-tycoon.png"

echo "site art built ($n Tycoon screenshots)"
