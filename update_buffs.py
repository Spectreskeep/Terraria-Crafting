import json
import os
import time
import requests
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# Points directly to test_list_updated.json in your project root
FILE_PATH = "test_list_updated.json"

def scrape_entity_details(item_name):
    """Fetches immunities, buffs, and inflicted debuffs from terraria.wiki.gg."""
    url = f"https://terraria.wiki.gg/wiki/{item_name.replace(' ', '_')}"
    
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code != 200:
            return None

        soup = BeautifulSoup(res.text, 'html.parser')
        infobox = soup.find('table', class_='infobox')

        immunities = []
        buffs = []
        debuffs_inflicted = []

        if infobox:
            for row in infobox.find_all('tr'):
                header = row.find(['th', 'td'])
                if not header:
                    continue

                header_text = header.get_text(strip=True).lower()
                cells = row.find_all('td')
                data_cell = cells[-1] if cells else row

                # Parse Immunities
                if 'immunity' in header_text or 'immunities' in header_text:
                    for link in data_cell.find_all('a'):
                        name = link.get('title') or link.get_text(strip=True)
                        if name and not name.startswith('Category:') and name not in immunities:
                            immunities.append(name.strip())

                # Parse Debuffs Inflicted (e.g. Hornet stinger -> Poison)
                elif 'debuff' in header_text or 'inflicts' in header_text:
                    for link in data_cell.find_all('a'):
                        name = link.get('title') or link.get_text(strip=True)
                        if name and not name.startswith('Category:') and name not in debuffs_inflicted:
                            debuffs_inflicted.append(name.strip())

                # Parse Buffs
                elif 'buff' in header_text:
                    for link in data_cell.find_all('a'):
                        name = link.get('title') or link.get_text(strip=True)
                        if name and not name.startswith('Category:') and name not in buffs:
                            buffs.append(name.strip())

        return {
            "immunities": immunities,
            "buffs": buffs,
            "debuffs_inflicted": debuffs_inflicted
        }

    except Exception as e:
        print(f"Error scraping {item_name}: {e}")
        return None


def main():
    if not os.path.exists(FILE_PATH):
        print(f"❌ Error: Could not find '{FILE_PATH}' in your project root!")
        return

    # 1. Load existing test_list_updated.json
    print(f"Loading {FILE_PATH}...")
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Keywords used to filter down from 5,436 items to only relevant ones
    keywords = [
        "immunity", "immune", "debuff", "buff", "shield", "charm", 
        "bezoar", "bandage", "mirror", "polish", "vitamins", "map", 
        "hornet", "poison", "curse", "fire", "bleed", "emblem", "stinger"
    ]

    items_to_scrape = []
    for item_name, item_info in data.items():
        category = str(item_info.get("category", "")).lower()
        tooltip = str(item_info.get("tooltip", "")).lower()
        name_lower = item_name.lower()

        # Only queue items matching categories or keywords
        if (
            category in ["accessory", "armor", "npc", "enemy"] or
            any(kw in tooltip for kw in keywords) or
            any(kw in name_lower for kw in keywords)
        ):
            items_to_scrape.append(item_name)

    print(f"Found {len(items_to_scrape)} relevant items to update out of {len(data)} total.\n")

    # 3. Incrementally update only the matched entries
    updated_count = 0
    for idx, item_name in enumerate(items_to_scrape, 1):
        print(f"[{idx}/{len(items_to_scrape)}] Fetching: {item_name}...")
        scraped_data = scrape_entity_details(item_name)

        if scraped_data:
            # Safely merge fields into existing item dictionary
            data[item_name]["immunities"] = scraped_data["immunities"]
            data[item_name]["buffs"] = scraped_data["buffs"]
            data[item_name]["debuffs_inflicted"] = scraped_data["debuffs_inflicted"]
            updated_count += 1

        time.sleep(0.3)

    # 4. Overwrite test_list_updated.json with merged data
    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ All done! Successfully updated {updated_count} entries in '{FILE_PATH}'.")


if __name__ == "__main__":
    main()