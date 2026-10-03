import json
import re
import urllib.parse
import requests
import time
import os

INPUT_FILE = "my_test.json"
OUTPUT_FILE = "test_list_updated.json"

API_ENDPOINT = "https://terraria.wiki.gg/api.php"
headers = {"User-Agent": "TerrariaWikiTool/1.0"}

def get_wiki_summary(wiki_url):
    if wiki_url.startswith("http"):
        path = urllib.parse.urlparse(wiki_url).path
        title = urllib.parse.unquote(path.split("/wiki/")[-1])
    else:
        title = wiki_url

    params = {
        "action": "query",
        "format": "json",
        "prop": "extracts",
        "titles": title,
        "exintro": True,
        "explaintext": True,
        "redirects": True,
    }

    # Try up to 3 times if there is a network error
    for attempt in range(3):
        try:
            response = requests.get(API_ENDPOINT, params=params, headers=headers, timeout=10)
            
            # If rate-limited by the server, wait 5 seconds and retry
            if response.status_code == 429:
                print(f"Rate limited! Pausing 5 seconds... (Attempt {attempt+1}/3)")
                time.sleep(5)
                continue
                
            response.raise_for_status()
            json_data = response.json()

            pages = json_data.get("query", {}).get("pages", {})
            for page_id, page_info in pages.items():
                if page_id != "-1" and "extract" in page_info:
                    text = page_info["extract"].strip()
                    return re.sub(r"\n+", " ", text)
            
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"Network issue: {e}. Retrying... (Attempt {attempt+1}/3)")
            time.sleep(2)

    return None

# Load existing progress from test output if available, otherwise load original test file
if os.path.exists(OUTPUT_FILE) and os.path.getsize(OUTPUT_FILE) > 0:
    print(f"Found existing '{OUTPUT_FILE}'. Resuming progress...")
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
else:
    print(f"Starting fresh from '{INPUT_FILE}'...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

total_items = len(data)
processed_count = 0

for item_name, item_info in data.items():
    processed_count += 1
    
    # Skip if already fetched in a previous run
    if item_info.get("updated_from_wiki") == True:
        continue

    wiki_url = item_info.get("wiki_url")
    if wiki_url:
        print(f"[{processed_count}/{total_items}] Fetching: {item_name}...")
        summary = get_wiki_summary(wiki_url)
        
        if summary:
            item_info["tooltip"] = summary
        
        # Tag it so the script knows to skip it if restarted
        item_info["updated_from_wiki"] = True
        
        time.sleep(0.5)

    # Save progress every 50 items
    if processed_count % 50 == 0:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"--> Progress saved! ({processed_count}/{total_items})")

# Final save when 100% complete
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nAll done! Check '{OUTPUT_FILE}' to inspect the updated test results.")