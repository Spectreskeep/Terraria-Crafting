"""
update_recipes.py  -  adds the missing CRAFTING RECIPES for the newer items (ID 5456 and up).

Why: update_data.py added the new 1.4.5 items with a description only. Recipes were left empty,
so those items show no crafting tree and no "what this crafts into".
This script asks the wiki's recipe table for exactly those items and adds them to data/recipes.json.

HOW TO USE (from the project folder, the one that contains the "data" folder):

    python update_recipes.py            # DRY RUN: shows what it would add, writes NOTHING
    python update_recipes.py --apply    # does it for real (makes a backup first)

Then publish:   git add . && git commit -m "recipes update" && git push origin main

Options:
    --min-id 5456     only look at items with this ID or higher (default 5456)
    --all-missing     look at EVERY item that has no recipe yet (slower, usually not needed)

SAFETY
  * Existing recipes are never edited or removed. Only items that have no recipe yet get one.
  * Before writing, a backup goes into data/backups/<date-time>/
  * After building the new file the script checks every old recipe is still there and unchanged.
    If anything is off, it stops and writes nothing.
  * Written to a temp file first and swapped in, so a crash can't leave a half-written file.
  * Git is a second safety net:  git checkout data   puts the old files back.
"""
import argparse
import copy
import datetime
import json
import os
import re
import shutil
import sys
import time

import requests

API = "https://terraria.wiki.gg/api.php"
HEADERS = {"User-Agent": "TerrariaCraftingSiteUpdater/1.0 (personal project)"}
DATA_DIR = "data"
ITEMS_FILE = os.path.join(DATA_DIR, "items.json")
RECIPES_FILE = os.path.join(DATA_DIR, "recipes.json")


# ---------------------------------------------------------------- wiki access
def api_get(params, tries=4):
    params = dict(params, format="json")
    for attempt in range(tries):
        try:
            r = requests.get(API, params=params, headers=HEADERS, timeout=40)
            if r.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"  rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            r.raise_for_status()
            data = r.json()
            if "error" in data:
                print("  the wiki answered with an error:", data["error"].get("info", data["error"]))
                return None
            return data
        except (requests.RequestException, ValueError) as e:
            print(f"  network problem ({e}), retrying...")
            time.sleep(2 * (attempt + 1))
    return None


def fetch_recipe_rows(names):
    """Raw recipe rows from the wiki's Recipes table for the given result names (None if the wiki failed)."""
    rows = []
    for i in range(0, len(names), 30):
        chunk = names[i:i + 30]
        where = "result IN (" + ",".join('"' + n.replace('"', '""') + '"' for n in chunk) + ")"
        offset = 0
        while True:
            data = api_get({
                "action": "cargoquery", "tables": "Recipes",
                "fields": "result,amount,station,ingredients,ings,args,version",
                "where": where, "limit": 500, "offset": offset,
            })
            if data is None:
                return None
            got = [row.get("title", {}) for row in data.get("cargoquery", [])]
            rows.extend(got)
            if len(got) < 500:
                break
            offset += 500
        print(f"  recipes looked up for {min(i + 30, len(names))}/{len(names)} items")
        time.sleep(0.5)
    return rows


# ---------------------------------------------------------------- turning wiki rows into the site's format
def parse_ingredients(text, args=""):
    """'Wood¦10^Iron Bar¦5' (or names wrapped like '¦Wood¦') -> [{'item': 'Wood', 'qty': 10}, ...]
    Quantities are taken from the ingredient text, or, if they are not there, from the wiki's 'args' text."""
    qty_from_args = {}
    for name, qty in re.findall(r"([^^¦|]+?)[¦|]\s*(\d+)", args or ""):
        qty_from_args.setdefault(name.strip(), int(qty))
    out = []
    for part in (text or "").split("^"):
        fields = [f.strip() for f in re.split(r"[¦|]", part)]
        fields = [f for f in fields if f]
        if not fields:
            continue
        qty = None
        if len(fields) > 1 and fields[-1].isdigit():
            qty = int(fields[-1])
            fields = fields[:-1]
        name = fields[0]
        if qty is None:
            qty = qty_from_args.get(name)   # None = the wiki row did not say how many
        out.append({"item": name, "qty": qty})
    return out


def parse_station(text):
    text = (text or "").strip()
    if not text:
        return "By Hand"
    parts = [p.strip() for p in text.replace(" / ", "^").split("^") if p.strip()]
    return " / ".join(parts) if parts else "By Hand"


def rows_to_recipes(rows):
    """{result name: [recipe, ...]} in the same shape recipes.json already uses."""
    out = {}
    for row in rows:
        version = (row.get("version") or "").lower()
        if version and "desktop" not in version:
            continue                      # skip old-console / 3DS only recipes
        name = (row.get("result") or "").strip()
        ings = parse_ingredients(row.get("ingredients"), row.get("args"))
        if not name or not ings:
            continue
        try:
            qty = int(row.get("amount") or 1)
        except ValueError:
            qty = 1
        recipe = {"station": parse_station(row.get("station")), "result_qty": qty, "ingredients": ings}
        bucket = out.setdefault(name, [])
        if recipe not in bucket:
            bucket.append(recipe)
    return out


# ---------------------------------------------------------------- file helpers
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump_json(path, data):
    text = json.dumps(data, indent=2, ensure_ascii=False)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    json.load(open(tmp, encoding="utf-8"))   # must re-read cleanly
    os.replace(tmp, path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="really write the file (default is a dry run)")
    ap.add_argument("--min-id", type=int, default=5456)
    ap.add_argument("--all-missing", action="store_true")
    ap.add_argument("--debug", action="store_true", help="show the wiki's raw answer for a few items and stop")
    ap.add_argument("--force", action="store_true", help="write even if some ingredient names look wrong (not recommended)")
    args = ap.parse_args()

    if not (os.path.exists(ITEMS_FILE) and os.path.exists(RECIPES_FILE)):
        sys.exit("Run this from the project folder (the one that contains the 'data' folder).")

    if args.debug:
        rows = fetch_recipe_rows(["Mushroom Staff", "Portable Kiln", "Item Flask", "Cow Bell", "Zenith"]) or []
        print("\nRAW ROWS FROM THE WIKI (copy everything below this line):\n")
        for r in rows:
            print(json.dumps(r, ensure_ascii=False))
        return

    items = load_json(ITEMS_FILE)
    old = load_json(RECIPES_FILE)
    item_names = {it["name"] for it in items}

    todo = [it["name"] for it in items
            if it["name"] not in old and (args.all_missing or it["id"] >= args.min_id)
            and not it["name"].lower().startswith("n/a")]
    print(f"{len(todo)} items have no recipe yet. Asking the wiki...")
    rows = fetch_recipe_rows(todo)
    if rows is None:
        sys.exit("Could not get recipes from the wiki. Nothing was changed. Try again in a few minutes.")
    found = rows_to_recipes(rows)
    # only keep results we actually asked for, and never touch an existing recipe
    found = {n: r for n, r in found.items() if n in todo and n not in old}
    print(f"\nThe wiki has recipes for {len(found)} of those items.")
    if not found:
        print("Nothing to add.")
        return

    known_stations = {r["station"] for v in old.values() for r in v}
    pair = {}
    for st in known_stations:
        if " / " in st:
            for part in st.split(" / "):
                pair.setdefault(part, st)
    for recipes in found.values():
        for r in recipes:
            r["station"] = pair.get(r["station"], r["station"])
    known_names = item_names | set(old.keys())
    odd_stations, odd_ings, no_qty = set(), set(), set()
    for name, recipes in found.items():
        for r in recipes:
            if r["station"] not in known_stations:
                odd_stations.add(r["station"])
            for ing in r["ingredients"]:
                if ing["qty"] is None:
                    no_qty.add(name)
                if ing["item"] not in known_names and not ing["item"].startswith("Any "):
                    odd_ings.add(ing["item"])

    print("\nExamples:")
    for name in list(found)[:8]:
        r = found[name][0]
        ing = ", ".join(f"{i['item']} x{i['qty'] if i['qty'] is not None else '?'}" for i in r["ingredients"])
        print(f"  {name}  <-  {ing}   [{r['station']}]")
    if odd_stations:
        print("\nStations the site has not seen before (they still work, just without a picture):")
        for s in sorted(odd_stations):
            print("  -", s)
    if odd_ings:
        print("\nIngredient names that are not in items.json (check these spellings):")
        for s in sorted(odd_ings):
            print("  -", s)

    for recipes in found.values():
        for r in recipes:
            for ing in r["ingredients"]:
                if ing["qty"] is None:
                    ing["qty"] = 1
    new = copy.deepcopy(old)
    new.update(found)
    # safety check: nothing old was changed or lost
    for k, v in old.items():
        if new.get(k) != v:
            sys.exit(f"Safety check failed for '{k}'. Nothing was written.")

    if (odd_ings or no_qty) and not args.force:
        if no_qty:
            print(f"\nThe wiki did not say how many of each ingredient for {len(no_qty)} items (for example {sorted(no_qty)[0]}).")
        print("\nSTOPPED: the recipe data does not look right yet, so nothing was (or will be) written.")
        print("Run  python update_recipes.py --debug  and send me what it prints.")
        return

    if not args.apply:
        print(f"\nDRY RUN: nothing was written. Run again with --apply to add {len(found)} recipes.")
        return

    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup_dir = os.path.join(DATA_DIR, "backups", stamp)
    os.makedirs(backup_dir, exist_ok=True)
    shutil.copy2(RECIPES_FILE, backup_dir)
    dump_json(RECIPES_FILE, new)
    print(f"\nDone. Added {len(found)} recipes. Backup is in {backup_dir}")
    print('Now publish:  git add . && git commit -m "recipes update" && git push origin main')


if __name__ == "__main__":
    main()