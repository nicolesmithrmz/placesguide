#!/usr/bin/env python3
"""Check data/places.json before publishing. Usage: python3 scripts/validate.py"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATEGORIES = {"restaurant", "coffee", "bar", "special"}
STATUSES = {"been", "want_to_try"}
REQUIRED = ["id", "name", "category", "status", "lat", "lng", "city", "country"]
MAX_PHOTOS = 5
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def check_visit(label, n, v, errors):
    where = f"{label}, visit {n}"
    if not DATE.match(str(v.get("date") or "")):
        errors.append(f"{where}: 'date' must look like 2025-04-12")
    rating = v.get("rating")
    if rating is not None and rating not in (1, 2, 3, 4, 5):
        errors.append(f"{where}: rating must be 1-5 or null")
    for key in ("with", "tried"):
        value = v.get(key, [])
        if not isinstance(value, list) or not all(isinstance(x, str) for x in value):
            errors.append(f"{where}: '{key}' must be a list of names")
    photos = v.get("photos") or []
    if len(photos) > MAX_PHOTOS:
        errors.append(f"{where}: {len(photos)} photos, the limit is {MAX_PHOTOS}")
    for photo in photos:
        if not os.path.isfile(os.path.join(ROOT, photo)):
            errors.append(f"{where}: photo not found: {photo}")


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
        visits = p.get("visits") or []
        if p.get("status") == "want_to_try" and visits:
            errors.append(f"{label}: has visits but status is want_to_try; change status to been")
        for n, v in enumerate(visits, start=1):
            check_visit(label, n, v, errors)

    for e in errors:
        print("ERROR:", e)
    if errors:
        return 1
    visits = sum(len(p.get("visits") or []) for p in places)
    print(f"OK: {len(places)} places, {visits} visits look good.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
