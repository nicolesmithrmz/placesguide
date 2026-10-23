# Nicole's Guide

A personal map of restaurants, coffee shops, bars and special places: the ones I've been to (with reviews and photos) and the ones I want to try.

- **Home tab:** why the project exists, plus highlights (stats, favourites, recently added, want to try).
- **Map tab:** a world map you can filter by city and type of place, with swipeable cards for each pin.

It is a plain website (HTML, CSS, JavaScript) with no database and no cost. All places live in one file: `data/places.json`.

## Adding or changing a place

The easiest way: tell Claude, for example

> Add Casa Lucio in Madrid. I went on 12 March with Sara and Maya. We tried the huevos rotos. 5 stars. Review: "…"

Claude looks up the address and map position, updates `data/places.json`, and pushes. The site refreshes in about a minute.

Tips:
- Include the city so Claude picks the right branch of a chain.
- For "want to try" places, a short note on why is enough.
- To edit or remove a place, just say so.

## Going back to a place (visit threads)

Every place you've been to keeps a thread of visits, oldest first, like an X thread. Each visit has its own:

- date
- rating (the place shows the average across visits)
- review
- who you were with
- what you tried
- up to 5 photos, shown as a swipeable carousel

To add another visit, tell Claude, for example:

> New visit to Casa Lucio on 3 June. With my cousin Layla. We tried the croquetas. 4 stars. Review: "…"

The old visits stay exactly as they are. A "want to try" place becomes "been" the first time you tell Claude you went.

## Adding photos

Either:
1. Attach the photos when you message Claude and say which place and which visit they belong to, or
2. On github.com open the `images` folder, choose **Add file → Upload files**, then tell Claude which visit they go with.

Each visit can have up to 5 photos. Smaller photos load faster. Around 200 KB each is plenty.

## How a place looks in `data/places.json`

```json
{
  "id": "casa-lucio",
  "name": "Casa Lucio",
  "category": "restaurant",
  "status": "been",
  "lat": 40.4129, "lng": -3.7083,
  "address": "Calle Cava Baja, 35, Madrid",
  "city": "Madrid", "country": "Spain",
  "added": "2026-10-23",
  "tags": ["classic"],
  "visits": [
    {
      "date": "2026-03-12",
      "rating": 5,
      "text": "Your words.",
      "with": ["Sara", "Maya"],
      "tried": ["Huevos rotos"],
      "photos": ["images/casa-lucio-1.jpg"]
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `id` | Short unique name, lowercase with dashes |
| `category` | `restaurant`, `coffee`, `bar` or `special` |
| `status` | `been` or `want_to_try` |
| `lat`, `lng` | Map position |
| `added` | `YYYY-MM-DD` the place was added (used for "Recently added") |
| `note` | For want-to-try places, why it's on the list |
| `visits` | The thread. Each visit needs a `date` (`YYYY-MM-DD`); everything else is optional |

Check the file any time with `python3 scripts/validate.py`.

The places in there now are **samples or suggestions**. New York, Paris, Barcelona and San Francisco are samples. The Madrid and Milan places are suggestions to edit or delete.

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
