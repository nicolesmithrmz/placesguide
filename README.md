# Nicole's Guide

A personal map of restaurants, coffee shops, bars and special places: the ones I've been to (with reviews and photos) and the ones I want to try.

- **Home tab:** why the project exists, plus highlights (stats, favourites, recently added, want to try).
- **Map tab:** a world map you can filter by city and type of place, with swipeable cards for each pin.

It is a plain website (HTML, CSS, JavaScript) with no database and no cost. All places live in one file: `data/places.json`.

## Adding or changing a place

The easiest way: tell Claude, for example

> Add Blue Bottle Coffee in Shibuya, Tokyo. I've been, 5 stars. Review: "…"

Claude looks up the address and map position, updates `data/places.json`, and pushes. The site refreshes in about a minute.

Tips:
- Include the city so Claude picks the right branch of a chain.
- For "want to try" places, no rating or review is needed.
- To edit or remove a place, just say so.

## Adding photos

Either:
1. Attach the photos when you message Claude and say which place they belong to, or
2. On github.com open the `images` folder, choose **Add file → Upload files**, then tell Claude which place they go with.

Smaller photos load faster. Around 200 KB each is plenty.

## Each place in `data/places.json`

| Field | Meaning |
|---|---|
| `id` | Short unique name, lowercase with dashes (`blue-bottle-ebisu`) |
| `name` | Name of the place |
| `category` | `restaurant`, `coffee`, `bar` or `special` |
| `status` | `been` or `want_to_try` |
| `lat`, `lng` | Map position |
| `address`, `city`, `country` | Where it is |
| `rating` | 1 to 5, or `null` if not rated |
| `review` | Your words |
| `visited_on` | `YYYY-MM-DD`, or `null` |
| `added` | `YYYY-MM-DD` the date it was added (used for "Recently added") |
| `tags` | Short labels like `"brunch"` |
| `photos` | List of paths such as `"images/blue-bottle-1.jpg"` |

The five places in there now are **samples**. Their reviews start with `SAMPLE:`; replace them with real ones.

## Putting the site online (one time)

1. Merge this work into the `main` branch.
2. On github.com open the repo, then **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab and wait for "Publish site" to turn green. The link appears in Settings → Pages.

## Trying it on your computer

```
python3 -m http.server 8000
```

then open http://localhost:8000. Check the data before publishing with `python3 scripts/validate.py`.

## Credits

Map by [Leaflet](https://leafletjs.com) with [OpenStreetMap](https://www.openstreetmap.org/copyright) data. Swipe cards by [Swiper](https://swiperjs.com).
