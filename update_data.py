"""
update_data.py  -  adds NEW Terraria items to the site's data files, and changes nothing else.

HOW TO USE (from the project folder, the one that contains the "data" folder):

    python update_data.py            # DRY RUN: shows what it would add, writes NOTHING
    python update_data.py --apply    # does it for real (makes a backup first)
    python update_data.py --fix-images [--apply]   # repair guessed picture links of earlier additions

Then publish:   git add . && git commit -m "data update" && git push origin main

SAFETY
  * Existing items are never edited or removed. Only items that are missing get added.
  * Before writing, a full backup of the data files goes into data/backups/<date-time>/
  * After building the new files, the script checks that every old entry is still there and
    unchanged. If anything is off, it stops and writes nothing.
  * Files are written to a temp file first and swapped in, so a crash can't leave a half-written file.
  * An item is only added if its description could be fetched, so a failed download is simply
    picked up on the next run.
  * Git is a second safety net:  git checkout data   puts the old files back.

WHAT IT ADDS FOR EACH NEW ITEM: id, name, image, wiki link and the wiki description (this is what the
site uses to put it in the right category). Drops, shop info and recipes for brand new items start
empty, because those need a closer look at each wiki page.
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
import urllib.parse

import requests
from bs4 import BeautifulSoup

API = "https://terraria.wiki.gg/api.php"
HEADERS = {"User-Agent": "TerrariaCraftingSiteUpdater/1.0 (personal project)"}
DATA_DIR = "data"
ITEMS_FILE = os.path.join(DATA_DIR, "items.json")
DETAILS_FILE = os.path.join(DATA_DIR, "complete_list.json")


# ---------------------------------------------------------------- wiki access
def api_get(params, tries=4):
    params = dict(params, format="json")
    for attempt in range(tries):
        try:
            r = requests.get(API, params=params, headers=HEADERS, timeout=30)
            if r.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"  rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except (requests.RequestException, ValueError) as e:
            print(f"  network problem ({e}), retrying...")
            time.sleep(2 * (attempt + 1))
    return None


def fetch_wiki_item_list():
    """Returns [(id, name), ...] from the wiki's 'Item IDs' page."""
    data = api_get({"action": "parse", "page": "Item_IDs", "prop": "text", "redirects": 1})
    html = ((data or {}).get("parse") or {}).get("text", {}).get("*")
    if not html:  # fall back to the normal web page
        try:
            html = requests.get("https://terraria.wiki.gg/wiki/Item_IDs", headers=HEADERS, timeout=60).text
        except requests.RequestException:
            html = None
    if not html:
        return None
    return parse_item_ids_html(html)


def parse_item_ids_html(html):
    soup = BeautifulSoup(html, "html.parser")
    found = {}
    for tr in soup.find_all("tr"):
        cells = tr.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        id_text = cells[0].get_text(strip=True)
        if not id_text.isdigit():
            continue
        link = cells[1].find("a")
        name = (link.get("title") if link and link.get("title") else cells[1].get_text(strip=True)).strip()
        if name:
            found.setdefault(int(id_text), name)
    return sorted(found.items())


def fetch_descriptions(names):
    """{name: description} for as many of `names` as the wiki returns (20 per request)."""
    out = {}
    for i in range(0, len(names), 20):
        chunk = names[i:i + 20]
        data = api_get({
            "action": "query", "prop": "extracts", "exintro": 1, "explaintext": 1,
            "exlimit": "max", "redirects": 1, "titles": "|".join(chunk),
        })
        if not data:
            continue
        q = data.get("query") or {}
        # map redirects / normalisations back to the names we asked for
        back = {}
        for key in ("normalized", "redirects"):
            for m in q.get(key, []):
                back[m["to"]] = back.get(m["from"], m["from"])
        for page in (q.get("pages") or {}).values():
            text = (page.get("extract") or "").strip()
            if not text:
                continue
            title = page.get("title", "")
            asked = back.get(title, title)
            out[asked] = re.sub(r"\n+", " ", text)
        print(f"  descriptions {min(i + 20, len(names))}/{len(names)}")
        time.sleep(0.4)
    return out


def _exists(url):
    try:
        r = requests.head(url, headers=HEADERS, timeout=20, allow_redirects=True)
        return r.status_code == 200 and r.headers.get("content-type", "").startswith("image")
    except requests.RequestException:
        return False


def fetch_images(names):
    """{name: picture url}. Uses the wiki's own item-sprite file names and checks which one really exists
    (.png first, then .gif for animated items). Items where none exist are left out, and keep the guess."""
    out = {}
    for n, name in enumerate(names, 1):
        base = urllib.parse.quote(name.replace(" ", "_"), safe="_()',!:-")
        for ext_name in (base + ".png", base + ".gif", base + "_(item).png", base + "_(item).gif"):
            url = "https://terraria.wiki.gg/images/" + ext_name
            if _exists(url):
                out[name] = url
                break
        if n % 50 == 0:
            print(f"  images {n}/{len(names)}")
        time.sleep(0.1)
    return out


def wiki_url(name):
    return "https://terraria.wiki.gg/wiki/" + urllib.parse.quote(name.replace(" ", "_"), safe="_()',!:-")


def image_url(name):
    return "https://terraria.wiki.gg/images/" + urllib.parse.quote(name.replace(" ", "_"), safe="_()',!:-") + ".png"


# ---------------------------------------------------------------- file helpers
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump_json(path, data, like_path):
    """Write in the same style as the existing file so git diffs stay small."""
    with open(like_path, "r", encoding="utf-8") as f:
        sample = f.read()
    ascii_only = not any(ord(c) > 127 for c in sample) and "\\u" in sample
    text = json.dumps(data, indent=2, ensure_ascii=ascii_only)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    json.load(open(tmp, encoding="utf-8"))  # must re-read cleanly
    os.replace(tmp, path)


# ---------------------------------------------------------------- main logic
def build_additions(old_items, old_details, wiki_list, describe=fetch_descriptions, images=fetch_images):
    have_ids = {it["id"] for it in old_items}
    have_names = {it["name"] for it in old_items} | set(old_details.keys())
    new = []
    for item_id, name in wiki_list:
        if item_id in have_ids or name in have_names:
            continue
        if name.lower().startswith("n/a") or "no official name" in name.lower():
            continue
        new.append((item_id, name))
    new_names = [n for _, n in new]
    desc = describe(new_names) if new_names else {}
    real_img = images(new_names) if new_names else {}
    added_items, added_details, skipped = [], {}, []
    for item_id, name in new:
        text = desc.get(name)
        if not text:
            skipped.append(name)
            continue
        added_items.append({"id": item_id, "name": name, "img": real_img.get(name) or image_url(name)})
        added_details[name] = {
            "name": name, "wiki_url": wiki_url(name), "tooltip": text,
            "crafting_station": None, "drops": [], "drops_summary": "", "sold_by": [],
            "quality_issues": [], "updated_from_wiki": True,
        }
    return added_items, added_details, skipped


def fix_images(items, apply):
    """Items added by this script start with a guessed picture link. Look up the real one. Only 'img' can change."""
    guessed = [it for it in items if it.get("img", "").startswith("https://terraria.wiki.gg/images/")]  # the older items use other servers and are left alone
    print(f"{len(guessed)} items have a picture hosted on terraria.wiki.gg (the ones added by this script).")
    if not guessed:
        return
    found = fetch_images([it["name"] for it in guessed])
    changes = [(it, found[it["name"]]) for it in guessed if found.get(it["name"]) and found[it["name"]] != it["img"]]
    print(f"Real picture found for {len(changes)} of them.")
    for it, url in changes[:15]:
        print(f"   {it['name']}: {url}")
    if not apply:
        print("\nDRY RUN: nothing was written. Run  python update_data.py --fix-images --apply  to save.")
        return
    new_items = copy.deepcopy(items)
    by_id = {it["id"]: it for it in new_items}
    for it, url in changes:
        by_id[it["id"]]["img"] = url
    for a, b in zip(items, new_items):  # nothing but img may differ
        if {k: v for k, v in a.items() if k != "img"} != {k: v for k, v in b.items() if k != "img"}:
            raise RuntimeError("something other than img changed")
    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup = os.path.join(DATA_DIR, "backups", stamp)
    os.makedirs(backup, exist_ok=True)
    shutil.copy2(ITEMS_FILE, backup)
    dump_json(ITEMS_FILE, new_items, ITEMS_FILE)
    print(f"Done. Backup in {backup}")


def verify(old_items, old_details, new_items, new_details, n_added):
    """Every old entry must still be there, unchanged. Raises if not."""
    if len(new_items) != len(old_items) + n_added:
        raise RuntimeError("item count does not add up")
    if new_items[:len(old_items)] != old_items:
        raise RuntimeError("an existing item changed")
    for k, v in old_details.items():
        if new_details.get(k) != v:
            raise RuntimeError(f"existing entry changed: {k}")
    ids = [it["id"] for it in new_items]
    if len(ids) != len(set(ids)):
        raise RuntimeError("duplicate ids")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="actually write the files (default is a dry run)")
    ap.add_argument("--fix-images", action="store_true", help="re-look-up pictures for items whose picture link was only guessed")
    args = ap.parse_args()

    if not os.path.exists(ITEMS_FILE) or not os.path.exists(DETAILS_FILE):
        sys.exit("Run this from the project folder (the one that contains the 'data' folder).")

    old_items = load_json(ITEMS_FILE)
    old_details = load_json(DETAILS_FILE)
    print(f"Site currently has {len(old_items)} items.")

    if args.fix_images:
        fix_images(old_items, args.apply)
        return

    print("Asking the wiki for its item list...")
    wiki_list = fetch_wiki_item_list()
    if not wiki_list:
        sys.exit("Could not read the wiki's item list. Nothing was changed. Try again in a minute.")
    print(f"The wiki lists {len(wiki_list)} items.")

    items_before, details_before = copy.deepcopy(old_items), copy.deepcopy(old_details)
    added_items, added_details, skipped = build_additions(old_items, old_details, wiki_list)

    print(f"\nNEW items found: {len(added_items)}")
    for it in added_items[:40]:
        print(f"   + {it['id']}: {it['name']}")
    if len(added_items) > 40:
        print(f"   ... and {len(added_items) - 40} more")
    if skipped:
        print(f"\n{len(skipped)} items had no description yet and were skipped (they'll be added next run):")
        for n in skipped[:20]:
            print(f"   - {n}")

    if not added_items:
        print("\nNothing to add. You're up to date.")
        return
    if not args.apply:
        print("\nDRY RUN: nothing was written. Run  python update_data.py --apply  to add these.")
        return

    new_items = items_before + added_items
    new_details = dict(details_before)
    new_details.update(added_details)
    verify(items_before, details_before, new_items, new_details, len(added_items))

    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    backup = os.path.join(DATA_DIR, "backups", stamp)
    os.makedirs(backup, exist_ok=True)
    for f in (ITEMS_FILE, DETAILS_FILE):
        shutil.copy2(f, backup)
    print(f"\nBackup saved to {backup}")

    dump_json(ITEMS_FILE, new_items, ITEMS_FILE)
    dump_json(DETAILS_FILE, new_details, DETAILS_FILE)
    print(f"Done. The site now has {len(new_items)} items ({len(added_items)} added).")
    print("Next:  git add . && git commit -m \"data update\" && git push origin main")


if __name__ == "__main__":
    main()