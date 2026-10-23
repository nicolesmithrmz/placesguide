#!/usr/bin/env python3
"""Check data/places.json before publishing. Usage: python3 scripts/validate.py"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATEGORIES = {"restaurant", "coffee", "bar", "special"}
STATUSES = {"been", "want_to_try"}
REQUIRED = ["id", "name", "category", "status", "lat", "lng", "city", "country"]


def main():
    path = os.path.join(ROOT, "data", "places.json")
    try:
        with open(path, encoding="utf-8") as f:
            places = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"ERROR: cannot read {path}: {e}")
        return 1

    errors = []
    seen = set()
    for i, p in enumerate(places):
        label = p.get("name", f"entry {i}")
        for key in REQUIRED:
            if p.get(key) in (None, ""):
                errors.append(f"{label}: missing '{key}'")
        if p.get("id") in seen:
            errors.append(f"{label}: duplicate id '{p.get('id')}'")
        seen.add(p.get("id"))
        if p.get("category") not in CATEGORIES:
            errors.append(f"{label}: category must be one of {sorted(CATEGORIES)}")
        if p.get("status") not in STATUSES:
            errors.append(f"{label}: status must be one of {sorted(STATUSES)}")
        lat, lng = p.get("lat"), p.get("lng")
        if not isinstance(lat, (int, float)) or not -90 <= lat <= 90:
            errors.append(f"{label}: lat must be a number from -90 to 90")
        if not isinstance(lng, (int, float)) or not -180 <= lng <= 180:
            errors.append(f"{label}: lng must be a number from -180 to 180")
        rating = p.get("rating")
        if rating is not None and rating not in (1, 2, 3, 4, 5):
            errors.append(f"{label}: rating must be 1-5 or null")
        for photo in p.get("photos") or []:
            if not os.path.isfile(os.path.join(ROOT, photo)):
                errors.append(f"{label}: photo not found: {photo}")

    for e in errors:
        print("ERROR:", e)
    if errors:
        return 1
    print(f"OK: {len(places)} places look good.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
