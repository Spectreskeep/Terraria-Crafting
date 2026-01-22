let ITEMS = [];
let FILTERED = [];
let visibleCount = 100;
const PAGE_SIZE = 100;
let currentCategory = "all";
let currentSubcategory = null;

let darkMode = localStorage.getItem('darkMode') === 'true';

let RECIPES = {};
let USES_INDEX = {};
let ITEM_BY_NAME = {};
let ITEM_DETAILS = {};
let NPC_BY_NAME = {};
let OBJECTS_BY_NAME = {};
let STATION_IMAGES = {};

const NODE_W = 180;
const NODE_H = 60;
const CRAFT_X_GAP = 200;
const CRAFT_Y_GAP = 85;
const USES_X_GAP = 200;
const USES_Y_GAP = 100;

let TREE_SVG = null;
let zoomLevel = 1;
let currentMode = "craft";
let CRAFT_EXPANDED = new Set();
let CRAFT_ROOT_ITEM = null;

// Crimson/Corruption alternative items
const CRIMSON_ITEMS = new Set([
  "Blood Butcherer",
  "Crimtane Ore",
  "Crimtane Bar",
  "Crimson Helmet",
  "Crimson Scalemail", 
  "Crimson Greaves",
  "Vertebrae",
  "Ichor",
  "Bloody Spine",
  "Crimson Rod",
  "Panic Necklace",
  "Flesh Knuckles",
  "Brain of Confusion"
]);

const CORRUPTION_ITEMS = new Set([
  "Light's Bane",
  "Demonite Ore",
  "Demonite Bar",
  "Shadow Helmet",
  "Shadow Scalemail",
  "Shadow Greaves",
  "Rotten Chunk",
  "Cursed Flame",
  "Worm Food",
  "Ball O' Hurt",
  "Band of Starpower",
  "Worm Scarf"
]);

const SUBCATEGORIES = {
  weapon: {
    name: "Weapons",
    icon: "⚔️",
    subs: {
      broadswords: { name: "Broadswords", keywords: ["broadsword"] },
      shortswords: { name: "Shortswords", keywords: ["shortsword"] },
      spears: { name: "Spears", keywords: ["spear", "lance", "trident", "pike"] },
      yoyos: { name: "Yoyos", keywords: ["yoyo", "yo-yo"] },
      flails: { name: "Flails", keywords: ["flail"] },
      boomerangs: { name: "Boomerangs", keywords: ["boomerang", "chakram"] },
      whips: { name: "Whips", keywords: ["whip"] },
      bows: { name: "Bows", keywords: ["bow"] },
      repeaters: { name: "Repeaters", keywords: ["repeater"] },
      guns: { name: "Guns", keywords: ["gun", "pistol", "rifle", "musket", "revolver", "shotgun"] },
      launchers: { name: "Launchers", keywords: ["launcher", "grenade launcher", "rocket launcher"] },
      wands: { name: "Magic Wands", keywords: ["wand"] },
      rods: { name: "Magic Rods", keywords: [" rod"] }, // space before "rod" to avoid "broadsword"
      tomes: { name: "Spell Tomes", keywords: ["tome", "spell tome"] },
      summon_minions: { name: "Summon Staffs", keywords: ["summon weapon that summons"] },
      other_magic: { name: "Other Magic", keywords: ["magic weapon"] }
    }
  },
  tool: {
    name: "Tools",
    icon: "🔨",
    subs: {
      pickaxes: { name: "Pickaxes", keywords: ["pickaxe"] },
      drills: { name: "Drills", keywords: ["drill"] },
      axes: { name: "Axes", keywords: [" axe", "chainsaw"] }, // space to avoid "pickaxe"
      hammers: { name: "Hammers", keywords: ["hammer"] },
      multitools: { name: "Multi-tools", keywords: ["hamaxe", "pickaxe axe", "drax", "picksaw"] },
      fishing: { name: "Fishing Poles", keywords: ["fishing pole", "fishing rod"] },
      nets: { name: "Bug Nets", keywords: ["bug net"] }
    }
  },
  armor: {
    name: "Armor",
    icon: "🛡️",
    subs: {
      helmets: { name: "Helmets", keywords: ["helmet", " hat", " hood", " mask", " cap", "headgear", "headdress", "visor"] },
      chestplates: { name: "Chestplates", keywords: ["breastplate", " shirt", "chainmail", " robe", "scalemail", "plate mail", "platebody"] },
      leggings: { name: "Leggings", keywords: ["greaves", " pants", "leggings"] }
    }
  },
  accessory: {
    name: "Accessories",
    icon: "💍",
    subs: {
      wings: { name: "Wings", keywords: ["wings"] },
      boots: { name: "Boots", keywords: ["boots"] },
      balloons: { name: "Balloons & Jump", keywords: ["balloon", "bottle", "fart in a jar", "frog leg", "bundle of balloons"] },
      hooks: { name: "Hooks", keywords: ["hook", "grappling"] },
      shields: { name: "Shields", keywords: ["shield"] },
      emblems: { name: "Emblems", keywords: ["emblem"] },
      charms: { name: "Charms", keywords: ["charm"] },
      info: { name: "Informational", keywords: ["watch", "compass", "depth meter", "gps", "cell phone", "pda", "radar", "lifeform analyzer", "dps meter", "stopwatch", "metal detector", "tally counter", "sextant", "fish finder", "weather radio"] }
    }
  },
  potion: {
    name: "Potions",
    icon: "🧪",
    subs: {
      healing: { name: "Healing", keywords: ["healing potion"] },
      mana: { name: "Mana", keywords: ["mana potion"] },
      buff: { name: "Buff Potions", keywords: ["potion"], exclude: ["healing potion", "mana potion", "restoration potion"] },
      food: { name: "Food & Drink", keywords: ["bowl", " pie", " cake", " ale", "sake", "smoothie", "sushi", "burger", "taco", "fries", "pad thai"] }
    }
  },
  material: {
    name: "Materials",
    icon: "📦",
    subs: {
      ores: { name: "Ores", keywords: [" ore"] },
      bars: { name: "Bars", keywords: [" bar"] },
      gems: { name: "Gems", keywords: ["amethyst", "topaz", "sapphire", "emerald", " ruby", "diamond", "amber"] },
      souls: { name: "Souls", keywords: ["soul of"] },
      plants: { name: "Plants & Herbs", keywords: ["daybloom", "moonglow", "blinkroot", "deathweed", "waterleaf", "fireblossom", "shiverthorn"] }
    }
  },
  furniture: {
    name: "Furniture",
    icon: "🪑",
    subs: {
      crafting: { name: "Crafting Stations", keywords: ["work bench", " anvil", "furnace", "forge", " loom", "sawmill", "heavy work bench", "tinkerer's workshop", "imbuing station", "dye vat"] },
      storage: { name: "Storage", keywords: ["chest", "piggy bank", "safe", "barrel", "trash can", "void vault", "defender's forge"] },
      lighting: { name: "Lighting", keywords: ["torch", "lantern", "candle", "chandelier", " lamp", "candelabra"] },
      comfort: { name: "Comfort", keywords: ["chair", " bed", "bench", "sofa", "throne", "toilet", "bathtub"] },
      decorative: { name: "Decorative", keywords: ["painting", "statue", "banner", "trophy", "relic"] }
    }
  },
  block: {
    name: "Blocks",
    icon: "🧱",
    subs: {
      natural: { name: "Natural", keywords: ["dirt block", "stone block", "sand block", " mud", " clay", "silt", "snow block", "ice block"] },
      bricks: { name: "Bricks", keywords: ["brick"] },
      wood: { name: "Wood", keywords: [" wood"] },
      glass: { name: "Glass", keywords: ["glass"] }
    }
  },
  ammo: {
    name: "Ammo",
    icon: "🏹",
    subs: {
      arrows: { name: "Arrows", keywords: ["arrow"] },
      bullets: { name: "Bullets", keywords: ["bullet"] },
      rockets: { name: "Rockets", keywords: ["rocket"] },
      darts: { name: "Darts", keywords: ["dart", " seed"] }
    }
  }
};

function getAlternativeType(itemName) {
  if (CRIMSON_ITEMS.has(itemName)) return "crimson";
  if (CORRUPTION_ITEMS.has(itemName)) return "corruption";
  return null;
}

function getItemSubcategory(item, mainCategory) {
  if (!SUBCATEGORIES[mainCategory]) return null;
  
  const subs = SUBCATEGORIES[mainCategory].subs;
  const itemName = item.name.toLowerCase();
  
  // Get tooltip from ITEM_DETAILS
  const details = ITEM_DETAILS[item.name] || {};
  const tooltip = (details.tooltip || '').toLowerCase();
  
  // Get first sentence of tooltip (most reliable indicator)
  const firstSentence = tooltip.split('.')[0] || '';
  
  // Special handling for each main category
  if (mainCategory === 'weapon') {
    // For weapons, check if the item is actually a weapon (not an accessory)
    // Exclude yoyo accessories (strings, counterweights, bags, gloves)
    if (itemName.includes('string') || itemName.includes('counterweight') || 
        itemName.includes('yoyo bag') || itemName.includes('yoyo glove')) {
      return null; // These are accessories, not weapons
    }
    
    // Check first sentence for weapon type
    for (const [subKey, subData] of Object.entries(subs)) {
      if (subData.keywords) {
        for (const keyword of subData.keywords) {
          const keywordLower = keyword.toLowerCase().trim();
          
          // Look for "is a [modifiers] <weapon_type>" pattern
          if (firstSentence.includes(' ' + keywordLower)) {
            return subKey;
          }
        }
      }
    }
  }
  
  else if (mainCategory === 'tool') {
    // For tools, be specific about what we're looking for
    for (const [subKey, subData] of Object.entries(subs)) {
      if (subData.keywords) {
        for (const keyword of subData.keywords) {
          const keywordLower = keyword.toLowerCase().trim();
          
          // Fishing poles: must have "fishing" in name or "fishing pole/rod" in tooltip
          if (subKey === 'fishing') {
            if ((itemName.includes('fishing') && (itemName.includes('pole') || itemName.includes('rod'))) ||
                (firstSentence.includes('fishing pole') || firstSentence.includes('fishing rod'))) {
              // Exclude bobbers and bait
              if (!itemName.includes('bobber') && !itemName.includes('bait')) {
                return subKey;
              }
            }
          }
          // Bug nets: must actually BE a bug net, not just mention it
          else if (subKey === 'nets') {
            if ((itemName.includes('bug net') || firstSentence.includes('bug net is')) &&
                !itemName.includes('cage') && !itemName.includes('jar')) {
              return subKey;
            }
          }
          // Other tools: check normally
          else if (firstSentence.includes(' ' + keywordLower) || itemName.includes(keywordLower)) {
            return subKey;
          }
        }
      }
    }
  }
  
  else if (mainCategory === 'accessory') {
    // Special case for wings first (they don't always say "accessory" in tooltip)
    if (itemName.includes('wings')) {
      // Check it's not a painting or material
      if (!firstSentence.includes('painting') && !firstSentence.includes('material') && 
          !firstSentence.includes('crafting') && !itemName.includes('twig') && !itemName.includes('feather') && !itemName.includes('dust')) {
        return 'wings';
      }
    }
    
    // For other accessories, check tooltip explicitly says "accessory"
    if (!tooltip.includes('accessory')) {
      return null;
    }
    
    // Now check specific accessory types
    for (const [subKey, subData] of Object.entries(subs)) {
      if (subData.keywords) {
        for (const keyword of subData.keywords) {
          const keywordLower = keyword.toLowerCase().trim();
          
          // Skip wings as we already handled it
          if (subKey === 'wings') continue;
          
          // Other accessories: check name or tooltip
          if (itemName.includes(keywordLower) || tooltip.includes(keywordLower)) {
            return subKey;
          }
        }
      }
    }
  }
  
  else {
    // For other categories (potions, materials, furniture, blocks, ammo)
    // Use the original simpler logic
    const textToCheck = tooltip + ' ' + itemName;
    
    for (const [subKey, subData] of Object.entries(subs)) {
      if (subData.keywords) {
        for (const keyword of subData.keywords) {
          const keywordLower = keyword.toLowerCase().trim();
          
          if (textToCheck.includes(keywordLower)) {
            // Check exclude list if present
            if (subData.exclude) {
              let shouldExclude = false;
              for (const excludeWord of subData.exclude) {
                if (textToCheck.includes(excludeWord.toLowerCase())) {
                  shouldExclude = true;
                  break;
                }
              }
              if (shouldExclude) continue;
            }
            return subKey;
          }
        }
      }
    }
  }
  
  return null;
}

function debounce(fn, delay = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function detectCategory(itemName) {
  const name = itemName.toLowerCase();
  
  if (name.includes('block') || name.includes('brick') || name.includes('wall') ||
      name.includes('platform') || name.includes('glass') || name.includes('fence')) {
    return 'block';
  }
  
  if (name.includes('chair') || name.includes('table') || name.includes('bed') ||
      name.includes('door') || name.includes('torch') || name.includes('lantern') ||
      name.includes('chandelier') || name.includes('statue') || name.includes('banner') ||
      name.includes('candle') || name.includes('lamp') || name.includes('bowl') ||
      name.includes('painting') || name.includes('picture') || name.includes('trophy') ||
      name.includes('book') || name.includes('chronicles')) {
    return 'furniture';
  }
  
  if (name.includes('helmet') || name.includes('breastplate') || name.includes('greaves') ||
      name.includes('hat') || name.includes('shirt') || name.includes('pants') ||
      name.includes('hood') || name.includes('mask') || name.includes('robe') ||
      (name.includes('armor') && !name.includes('polish'))) {
    return 'armor';
  }
  
  if (name.includes('ring') || name.includes('necklace') || name.includes('charm') ||
      name.includes('emblem') || name.includes('wings') || name.includes('boots') ||
      name.includes('balloon') || name.includes('hook') || name.includes('frog leg') ||
      name.includes('horseshoe') || name.includes('cloud in') || name.includes('shield') ||
      name.includes('band of') || name.includes('pendant') || name.includes('cursor')) {
    return 'accessory';
  }
  
  if (name.includes('potion') || name.includes('elixir') || name.includes('flask')) {
    return 'potion';
  }
  
  if (name.includes('arrow') || name.includes('bullet') || name.includes('rocket') ||
      name.includes('dart') || name.includes('coin') || name.includes('gel') ||
      name.includes('stake') || name.includes('seed') && name.includes('(') ||
      name.includes('sand') && name.includes('(')) {
    return 'ammo';
  }
  
  if (name.includes('pickaxe') || name.includes('axe') && !name.includes('battle axe') ||
      name.includes('drill') || name.includes('chainsaw') ||
      name.includes('hammer') && (name.includes('pwnhammer') || name.includes('hamaxe') || 
                                   name.includes('pick') || name.includes('drill'))) {
    return 'tool';
  }
  
  if ((name.includes('sword') && !name.includes('picture') && !name.includes('cat sword')) || 
      name.includes('blade') && !name.includes('chronicles') || 
      name.includes('saber') || 
      (name.includes('bow') && !name.includes('bowl') && !name.includes('rainbow')) || 
      name.includes('gun') || 
      (name.includes('staff') && !name.includes('flag')) ||
      name.includes('spear') || name.includes('yoyo') || name.includes('boomerang') ||
      name.includes('flail') || name.includes('whip') && !name.includes('leather') || 
      name.includes('katana') ||
      name.includes('lance') || 
      name.includes('hammer') && !name.includes('hamaxe') ||
      name.includes('repeater') || name.includes('launcher') || name.includes('rifle') ||
      name.includes('shotgun') || name.includes('pistol') || name.includes('minishark') ||
      name.includes('megashark') || name.includes('phoenix') || name.includes('blaster')) {
    return 'weapon';
  }
  
  if (name.includes('bar') || name.includes('ore') || name.includes('ingot') ||
      name.includes('fragment') || name.includes('essence') || name.includes('crystal') ||
      name.includes('scale') || name.includes('tissue') || name.includes('vertebrae') ||
      name.includes('chunk')) {
    return 'material';
  }
  
  return 'material';
}

async function loadItems() {
  const res = await fetch("./data/items.json");
  if (!res.ok) throw new Error("Failed to load data/items.json");
  return await res.json();
}

async function loadRecipes() {
  const res = await fetch("./data/recipes.json");
  if (!res.ok) throw new Error("Failed to load data/recipes.json");
  return await res.json();
}

async function loadItemDetails() {
  try {
    const res = await fetch("./data/complete_list.json");
    if (!res.ok) {
      console.warn("complete_list.json not found");
      return {};
    }
    const data = await res.json();
    
    const transformed = {};
    for (const [itemName, itemData] of Object.entries(data)) {
      transformed[itemName] = {
        wiki: itemData.wiki_url || `https://terraria.wiki.gg/wiki/${itemName.replace(/ /g, '_')}`,
        station: itemData.crafting_station || null,
        drops: itemData.drops || [],
        drops_summary: itemData.drops_summary || "",
        sold_by: itemData.sold_by || [],
        tooltip: itemData.tooltip || ""
      };
    }
    
    return transformed;
  } catch (e) {
    console.warn("Failed to load complete_list.json:", e);
    return {};
  }
}

async function loadNPCs() {
  try {
    const res = await fetch("./data/npc.json");
    if (!res.ok) {
      console.warn("npc.json not found");
      return {};
    }
    const npcs = await res.json();
    
    const npcByName = {};
    for (const npc of npcs) {
      npcByName[npc.Name] = npc;
    }
    
    console.log(`Loaded ${npcs.length} NPCs`);
    return npcByName;
  } catch (e) {
    console.warn("Failed to load npc.json:", e);
    return {};
  }
}

async function loadObjects() {
  try {
    const res = await fetch("./data/objects.json");
    if (!res.ok) {
      console.warn("objects.json not found");
      return {};
    }
    const objects = await res.json();
    
    const objByName = {};
    for (const obj of objects) {
      objByName[obj.name] = obj;
    }
    
    console.log(`Loaded ${objects.length} objects`);
    return objByName;
  } catch (e) {
    console.warn("Failed to load objects.json:", e);
    return {};
  }
}

async function loadStationImages() {
  try {
    const res = await fetch("./data/crafting_stations.json");
    if (!res.ok) {
      console.warn("crafting_stations.json not found");
      return {};
    }
    return await res.json();
  } catch (e) {
    console.warn("Failed to load crafting_stations.json:", e);
    return {};
  }
}

function buildIndexes() {
  ITEM_BY_NAME = {};
  for (const it of ITEMS) ITEM_BY_NAME[it.name] = it;
  
  // Add special "Any" items that are used in recipes but don't exist as standalone items
  const anyItems = [
    { name: "Any Wood", img: "https://terraria.wiki.gg/images/Any_Wood.gif?952c00", id: -1 },
    { name: "Any Iron Bar", img: "https://terraria.wiki.gg/images/Any_Iron_Bar.gif", id: -2 },
    { name: "Any Sand", img: "https://terraria.wiki.gg/images/Sand.gif?af5b00", id: -3 },
    { name: "Any Balloon", img: "https://terraria.wiki.gg/images/Any_Balloon.gif", id: -4 }
  ];
  
  for (const anyItem of anyItems) {
    if (!ITEM_BY_NAME[anyItem.name]) {
      ITEM_BY_NAME[anyItem.name] = anyItem;
      ITEMS.push(anyItem);
    }
  }

  USES_INDEX = {};
  for (const [outName, recipeVariants] of Object.entries(RECIPES)) {
    for (const variant of (recipeVariants || [])) {
      for (const ing of (variant.ingredients || [])) {
        if (!USES_INDEX[ing.item]) USES_INDEX[ing.item] = [];
        
        const alreadyExists = USES_INDEX[ing.item].some(use => use.output === outName);
        
        if (!alreadyExists) {
          USES_INDEX[ing.item].push({ 
            output: outName, 
            station: variant.station,
            qty: variant.result_qty || 1
          });
        }
      }
    }
  }
}

// FIXED: No info icon in grid cards
function renderItems(list) {
  const el = document.getElementById("results");
  el.innerHTML = "";

  if (!list.length) {
    el.textContent = "No matches.";
    return;
  }

  for (const item of list) {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    // Special handling for "Any" items - use animated cycling GIF
    if (item.name && (item.name.startsWith("Any ") || item.name === "Any Wood" || item.name === "Any Sand" || item.name === "Any Iron Bar" || item.name === "Any Balloon")) {
      img.src = item.img;
      img.style.imageRendering = "auto"; // Smooth rendering for animated GIF
    } else {
      img.src = item.img;
      img.style.imageRendering = "pixelated";
    }
    img.alt = item.name;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";

    const text = document.createElement("div");
    text.innerHTML = `
      <div class="name">${item.name}</div>
      <div class="small">ID: ${item.id}</div>
    `;

    card.appendChild(img);
    card.appendChild(text);
    el.appendChild(card);

    card.style.cursor = "pointer";
    card.addEventListener("click", () => openChoiceModal(item));
  }
}

function normalizeText(text) {
  return text.toLowerCase()
    .replace(/[']/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function applyFilter() {
  const q = document.getElementById("q").value.trim();
  const normalizedQuery = normalizeText(q);

  let filtered = ITEMS;
  
  if (currentCategory !== "all") {
    filtered = filtered.filter(x => {
      const itemCat = detectCategory(x.name);
      if (itemCat !== currentCategory) return false;
      
      // Apply subcategory filter if set
      if (currentSubcategory) {
        const itemSubcat = getItemSubcategory(x, currentCategory);
        if (itemSubcat !== currentSubcategory) return false;
      }
      
      return true;
    });
  }
  
  if (normalizedQuery) {
    filtered = filtered.filter(x => normalizeText(x.name).includes(normalizedQuery));
  }
  
  FILTERED = filtered;

  visibleCount = PAGE_SIZE;
  renderItems(FILTERED.slice(0, visibleCount));
  updateCategoryCounts();
}

function loadMoreIfNeeded() {
  const container = document.getElementById("results");
  if (!container) return;
  
  const nearBottom =
    container.scrollTop + container.clientHeight >=
    container.scrollHeight - 300;

  if (!nearBottom) return;

  if (visibleCount < FILTERED.length) {
    visibleCount = Math.min(
      visibleCount + PAGE_SIZE,
      FILTERED.length
    );
    renderItems(FILTERED.slice(0, visibleCount));
  }
}

let selectedItem = null;

// FIXED: Added modal info button handler
function openChoiceModal(item) {
  selectedItem = item;

  document.getElementById("modalTitle").textContent = item.name;

  const mImg = document.getElementById("modalImg");
  mImg.src = item.img;
  mImg.alt = item.name;
  mImg.referrerPolicy = "no-referrer";
  
  // Handle "Any" items with animated GIFs - use smooth rendering
  if (item.name && (item.name.startsWith("Any ") || item.name === "Any Wood" || item.name === "Any Sand" || item.name === "Any Iron Bar" || item.name === "Any Balloon")) {
    mImg.style.imageRendering = "auto";
  } else {
    mImg.style.imageRendering = "pixelated";
  }

  // Set up modal info button click handler
  const modalInfoBtn = document.getElementById("btnModalInfo");
  if (modalInfoBtn) {
    modalInfoBtn.onclick = (e) => {
      e.stopPropagation();
      closeChoiceModal();
      openItemInfoModal(item.name);
    };
  }

  document.getElementById("modalBackdrop").classList.remove("hidden");
}

function closeChoiceModal() {
  document.getElementById("modalBackdrop").classList.add("hidden");
  selectedItem = null;
}

function openTreeView(item, mode) {
  if (mode === "craft" && !RECIPES[item.name]) {
    alert(`Cannot craft "${item.name}" - this item has no crafting recipe!`);
    return;
  }

  if (mode === "uses" && !USES_INDEX[item.name]) {
    alert(`"${item.name}" is not used in any recipes!`);
    return;
  }

  document.getElementById("treeOverlay").classList.remove("hidden");
  document.body.classList.add("no-scroll");

  document.getElementById("treeTitle").textContent =
    mode === "craft"
      ? `Crafting tree: ${item.name}`
      : `Uses of: ${item.name}`;

  if (mode === "uses") {
    renderUsesTree(item);
  } else {
    renderRealTree(item, mode);
  }
}

const USES_TREE_STATE = {
  expandedNodes: new Set(),
  loadedPages: {},
  nodeData: new Map(),
  nodeCounter: 0,
  rootItem: null,
};

function resetUsesTreeState() {
  USES_TREE_STATE.expandedNodes.clear();
  USES_TREE_STATE.loadedPages = {};
  USES_TREE_STATE.nodeData.clear();
  USES_TREE_STATE.nodeCounter = 0;
  USES_TREE_STATE.rootItem = null;
}

function getUniqueNodeId(prefix) {
  return `${prefix}_${USES_TREE_STATE.nodeCounter++}`;
}

function renderUsesTree(item) {
  const world = document.getElementById("treeWorld");
  world.innerHTML = "";
  
  resetUsesTreeState();
  
  USES_TREE_STATE.rootItem = item;
  
  const viewport = document.getElementById("treeViewport");
  panX = viewport.clientWidth / 2 - NODE_W / 2;
  panY = viewport.clientHeight - 150;
  zoomLevel = 0.8;
  setWorldTransform();

  ensureTreeSvg(world);
  
  const rootNode = {
    id: getUniqueNodeId(`item_${item.name}`),
    type: 'item',
    name: item.name,
    itemName: item.name,
    depth: 0,
    parent: null,
    x: 0,
    y: 0
  };
  
  USES_TREE_STATE.nodeData.set(rootNode.id, rootNode);
  USES_TREE_STATE.expandedNodes.add(rootNode.id);
  
  buildUsesTreeChildren(rootNode);
  layoutUsesTree(rootNode);
  renderUsesTreeNodes(world);
}

function buildUsesTreeChildren(parentNode) {
  parentNode.children = [];
  
  if (!USES_TREE_STATE.expandedNodes.has(parentNode.id)) {
    return;
  }
  
  if (!parentNode.itemName) {
    console.warn("Node has no itemName:", parentNode);
    return;
  }
  
  const ancestry = new Set();
  let current = parentNode;
  while (current) {
    if (current.itemName) {
      ancestry.add(current.itemName);
    }
    current = current.parent;
  }
  
  const uses = USES_INDEX[parentNode.itemName] || [];
  const outputs = uses
    .filter(use => use.station !== "Shimmer")
    .map(use => ({
      name: use.output,
      station: use.station,
      qty: use.qty,
      isCycle: ancestry.has(use.output)
    }));
  
  if (outputs.length === 0) {
    return;
  }
  
  if (outputs.length <= 30) {
    for (const output of outputs) {
      const childId = getUniqueNodeId(`item_${output.name}`);
      
      const childNode = {
        id: childId,
        type: 'item',
        name: output.name,
        itemName: output.name,
        qty: output.qty,
        station: output.station,
        depth: parentNode.depth + 1,
        parent: parentNode,
        children: [],
        isCycle: output.isCycle
      };
      
      USES_TREE_STATE.nodeData.set(childId, childNode);
      parentNode.children.push(childNode);
      
      if (!output.isCycle && USES_TREE_STATE.expandedNodes.has(childId)) {
        buildUsesTreeChildren(childNode);
      }
    }
  } else {
    const groupNodes = createGroupNodes(outputs, parentNode);
    parentNode.children = groupNodes;
  }
}

function createGroupNodes(outputs, parentNode) {
  const groups = [];
  
  const ancestry = new Set();
  let current = parentNode;
  while (current) {
    if (current.itemName) {
      ancestry.add(current.itemName);
    }
    current = current.parent;
  }
  
  const stationGroups = {};
  for (const output of outputs) {
    const station = output.station || "Hand";
    if (!stationGroups[station]) {
      stationGroups[station] = [];
    }
    stationGroups[station].push(output);
  }
  
  for (const [station, items] of Object.entries(stationGroups)) {
    if (items.length >= 5) {
      const groupId = getUniqueNodeId(`group_${station}`);
      const groupNode = {
        id: groupId,
        type: 'group',
        name: `📍 ${station}`,
        groupType: 'station',
        items: items,
        depth: parentNode.depth + 1,
        parent: parentNode,
        children: [],
        pageSize: 24
      };
      
      USES_TREE_STATE.nodeData.set(groupId, groupNode);
      groups.push(groupNode);
      
      if (USES_TREE_STATE.expandedNodes.has(groupId)) {
        expandGroupNode(groupNode);
      }
    } else {
      for (const item of items) {
        const isCycle = ancestry.has(item.name);
        const itemId = getUniqueNodeId(`item_${item.name}`);
        const itemNode = {
          id: itemId,
          type: 'item',
          name: item.name,
          itemName: item.name,
          qty: item.qty,
          station: item.station,
          depth: parentNode.depth + 1,
          parent: parentNode,
          children: [],
          isCycle: isCycle
        };
        USES_TREE_STATE.nodeData.set(itemId, itemNode);
        groups.push(itemNode);
        
        if (!isCycle && USES_TREE_STATE.expandedNodes.has(itemId)) {
          buildUsesTreeChildren(itemNode);
        }
      }
    }
  }
  
  if (groups.length > 20) {
    return createCategoryGroups(outputs, parentNode);
  }
  
  return groups;
}

function createCategoryGroups(outputs, parentNode) {
  const categoryGroups = {};
  
  for (const output of outputs) {
    const category = detectCategory(output.name);
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(output);
  }
  
  const groups = [];
  const categoryNames = {
    weapon: "⚔️ Weapons",
    tool: "🔨 Tools",
    armor: "🛡️ Armor",
    potion: "🧪 Potions",
    material: "💎 Materials",
    furniture: "🪑 Furniture",
    accessory: "💍 Accessories",
    ammo: "🎯 Ammo",
    block: "🧱 Blocks"
  };
  
  for (const [category, items] of Object.entries(categoryGroups)) {
    const groupId = getUniqueNodeId(`group_${category}`);
    const groupNode = {
      id: groupId,
      type: 'group',
      name: categoryNames[category] || category,
      groupType: 'category',
      items: items,
      depth: parentNode.depth + 1,
      parent: parentNode,
      children: [],
      pageSize: 24
    };
    
    USES_TREE_STATE.nodeData.set(groupId, groupNode);
    groups.push(groupNode);
    
    if (USES_TREE_STATE.expandedNodes.has(groupId)) {
      expandGroupNode(groupNode);
    }
  }
  
  return groups;
}

function expandGroupNode(groupNode) {
  if (!USES_TREE_STATE.loadedPages[groupNode.id]) {
    USES_TREE_STATE.loadedPages[groupNode.id] = new Set([0]);
  }
  
  const ancestry = new Set();
  let current = groupNode.parent;
  while (current) {
    if (current.itemName) {
      ancestry.add(current.itemName);
    }
    current = current.parent;
  }
  
  const loadedPages = USES_TREE_STATE.loadedPages[groupNode.id];
  groupNode.children = [];
  
  const totalPages = Math.ceil(groupNode.items.length / groupNode.pageSize);
  
  for (const pageNum of loadedPages) {
    const startIdx = pageNum * groupNode.pageSize;
    const endIdx = Math.min(startIdx + groupNode.pageSize, groupNode.items.length);
    
    for (let i = startIdx; i < endIdx; i++) {
      const item = groupNode.items[i];
      
      const isCycle = ancestry.has(item.name);
      const itemId = getUniqueNodeId(`item_${item.name}`);
      
      const itemNode = {
        id: itemId,
        type: 'item',
        name: item.name,
        itemName: item.name,
        qty: item.qty,
        station: item.station,
        depth: groupNode.depth + 1,
        parent: groupNode,
        children: [],
        isCycle: isCycle
      };
      
      USES_TREE_STATE.nodeData.set(itemId, itemNode);
      groupNode.children.push(itemNode);
      
      if (!isCycle && USES_TREE_STATE.expandedNodes.has(itemId)) {
        buildUsesTreeChildren(itemNode);
      }
    }
  }
  
  const maxLoadedPage = Math.max(...loadedPages);
  if (maxLoadedPage < totalPages - 1) {
    const remaining = groupNode.items.length - (maxLoadedPage + 1) * groupNode.pageSize;
    const loadMoreId = `loadmore_${groupNode.id}_${maxLoadedPage}`;
    const loadMoreNode = {
      id: loadMoreId,
      type: 'loadmore',
      name: `+ ${remaining} more...`,
      parentGroup: groupNode,
      nextPage: maxLoadedPage + 1,
      depth: groupNode.depth + 1,
      parent: groupNode,
      children: []
    };
    
    USES_TREE_STATE.nodeData.set(loadMoreId, loadMoreNode);
    groupNode.children.push(loadMoreNode);
  }
}

function layoutUsesTree(rootNode) {
  assignDepths(rootNode, 0);
  
  const totalWidth = assignXPositions(rootNode, 0);
  
  const centerOffset = -(totalWidth / 2);
  shiftTreeX(rootNode, centerOffset);
}

function shiftTreeX(node, offset) {
  node.x += offset;
  if (node.children) {
    for (const child of node.children) {
      shiftTreeX(child, offset);
    }
  }
}

function assignDepths(node, depth) {
  node.depth = depth;
  if (node.children) {
    for (const child of node.children) {
      assignDepths(child, depth + 1);
    }
  }
}

function assignXPositions(node, offset = 0) {
  if (!node.children || node.children.length === 0) {
    node.x = offset;
    node.width = 1;
    return 1;
  }
  
  let totalWidth = 0;
  for (const child of node.children) {
    const childWidth = assignXPositions(child, offset + totalWidth);
    totalWidth += childWidth;
  }
  
  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  node.x = (firstChild.x + lastChild.x) / 2;
  node.width = totalWidth;
  
  return totalWidth;
}

function renderUsesTreeNodes(world) {
  const allNodes = Array.from(USES_TREE_STATE.nodeData.values());
  
  const X_SPACING = 210;
  const Y_SPACING = 100;
  
  let maxDepth = 0;
  for (const node of allNodes) {
    if (node.depth > maxDepth) maxDepth = node.depth;
  }
  
  for (const node of allNodes) {
    node.pixelX = node.x * X_SPACING;
    node.pixelY = -(node.depth * Y_SPACING);
  }
  
  for (const node of allNodes) {
    if (node.parent && node.parent.children && node.parent.children.includes(node)) {
      drawUsesTreeEdge(node.parent, node);
    }
  }
  
  for (const node of allNodes) {
    drawUsesTreeNode(world, node);
  }
}

function drawUsesTreeEdge(parent, child) {
  if (!TREE_SVG) return;
  
  const x1 = parent.pixelX + NODE_W / 2;
  const y1 = parent.pixelY;
  const x2 = child.pixelX + NODE_W / 2;
  const y2 = child.pixelY + NODE_H;
  
  const midY = (y1 + y2) / 2;
  
  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", x1);
  line1.setAttribute("y1", y1);
  line1.setAttribute("x2", x1);
  line1.setAttribute("y2", midY);
  line1.setAttribute("stroke", "#999");
  line1.setAttribute("stroke-width", "2");
  TREE_SVG.appendChild(line1);
  
  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", x1);
  line2.setAttribute("y1", midY);
  line2.setAttribute("x2", x2);
  line2.setAttribute("y2", midY);
  line2.setAttribute("stroke", "#999");
  line2.setAttribute("stroke-width", "2");
  TREE_SVG.appendChild(line2);
  
  const line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line3.setAttribute("x1", x2);
  line3.setAttribute("y1", midY);
  line3.setAttribute("x2", x2);
  line3.setAttribute("y2", y2);
  line3.setAttribute("stroke", "#999");
  line3.setAttribute("stroke-width", "2");
  TREE_SVG.appendChild(line3);
}

function drawUsesTreeNode(world, node) {
  const d = document.createElement("div");
  d.className = "treeNode";
  d.style.left = `${node.pixelX}px`;
  d.style.top = `${node.pixelY}px`;
  d.dataset.nodeId = node.id;
  d.title = node.name;
  
  if (node.type === 'group') {
    d.style.background = "#ffffff";
    d.style.border = "2px solid #ddd";
    d.style.cursor = "pointer";
    
    const icon = document.createElement("span");
    icon.textContent = USES_TREE_STATE.expandedNodes.has(node.id) ? "📂" : "📁";
    icon.style.fontSize = "24px";
    
    const text = document.createElement("div");
    text.innerHTML = `
      <div style="font-weight:800">${node.name}</div>
      <div style="font-size:12px;opacity:0.6">${node.items.length} items</div>
    `;
    
    d.appendChild(icon);
    d.appendChild(text);
    
    d.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleGroupNode(node.id);
    });
  } else if (node.type === 'loadmore') {
    d.style.background = "#f0f0f0";
    d.style.border = "2px dashed #999";
    d.style.cursor = "pointer";
    d.style.fontStyle = "italic";
    d.style.justifyContent = "center";
    
    const text = document.createElement("div");
    text.textContent = node.name;
    text.style.fontWeight = "600";
    d.appendChild(text);
    
    d.addEventListener("click", (e) => {
      e.stopPropagation();
      loadMoreItems(node);
    });
  } else {
    const itemObj = ITEM_BY_NAME[node.itemName] || { img: "" };
    
    const img = document.createElement("img");
    // Special handling for "Any" items - use animated cycling GIF  
    if (node.name && (node.name.startsWith("Any ") || node.name === "Any Wood" || node.name === "Any Sand" || node.name === "Any Iron Bar" || node.name === "Any Balloon")) {
      const anyItem = ITEM_BY_NAME[node.name];
      img.src = anyItem?.img || "";
      img.style.imageRendering = "auto"; // Smooth rendering for animated GIF
    } else {
      img.src = itemObj.img || "";
      img.style.imageRendering = "pixelated";
    }
    img.alt = node.name;
    img.referrerPolicy = "no-referrer";
    img.style.width = "40px";
    img.style.height = "40px";
    
    const text = document.createElement("div");
    const displayName = node.qty ? `${node.name} x${node.qty}` : node.name;
    
    let stationHTML = "";
    if (node.station) {
      // First check STATION_IMAGES for direct match
      let stationImgSrc = null;
      
      // Handle Demon Altar / Crimson Altar
      if (node.station.includes("Demon Altar") || node.station.includes("Crimson Altar")) {
        const parts = node.station.split('/').map(s => s.trim());
        stationImgSrc = STATION_IMAGES[parts[0]] || null;
      } else {
        stationImgSrc = STATION_IMAGES[node.station] || null;
      }
      
      // If not in STATION_IMAGES, try to find as item
      if (!stationImgSrc) {
        const stationToItemMap = {
          "Placed Bottle": "Bottle",
          "By Hand": null
        };
        const itemNameForStation = stationToItemMap[node.station] || node.station;
        let stationItem = ITEM_BY_NAME[itemNameForStation];
        
        // If not found, try to extract the main station name
        if (!stationItem && node.station.includes('/')) {
          const parts = node.station.split('/').map(s => s.trim());
          for (const part of parts) {
            stationItem = ITEM_BY_NAME[part];
            if (stationItem) break;
          }
        }
        
        if (stationItem && stationItem.img) {
          stationImgSrc = stationItem.img;
        }
      }
      
      if (stationImgSrc) {
        stationHTML = `<div style="font-size:11px;opacity:.6;display:flex;align-items:center;gap:4px;">
          <img src="${stationImgSrc}" referrerpolicy="no-referrer" style="width:14px;height:14px;image-rendering:pixelated;" onerror="this.style.display='none'" />
          <span>${node.station}</span>
        </div>`;
      } else {
        stationHTML = node.station === "By Hand"
        ? `<div style="font-size:11px;opacity:.6">✋ Hand</div>`
        : `<div style="font-size:11px;opacity:.6">📍 ${node.station}</div>`;
      }
    }
    
    text.innerHTML = `
      <div style="font-weight:800">${displayName}</div>
      ${stationHTML}
    `;
    
    d.appendChild(img);
    d.appendChild(text);
    
    addInfoIconToNode(d, node.itemName);
    
    if (!node.isCycle) {
      const uses = USES_INDEX[node.itemName] || [];
      const actualUses = uses.filter(use => use.station !== "Shimmer");
      
      if (actualUses.length > 0) {
        d.style.cursor = "pointer";
        d.style.borderColor = USES_TREE_STATE.expandedNodes.has(node.id) ? "#667eea" : "#ddd";
        d.style.borderWidth = "2px";
        
        const expandIcon = document.createElement("div");
        expandIcon.textContent = USES_TREE_STATE.expandedNodes.has(node.id) ? "−" : "+";
        expandIcon.style.position = "absolute";
        expandIcon.style.right = "8px";
        expandIcon.style.top = "50%";
        expandIcon.style.transform = "translateY(-50%)";
        expandIcon.style.fontSize = "20px";
        expandIcon.style.fontWeight = "bold";
        expandIcon.style.color = "#667eea";
        d.appendChild(expandIcon);
        
        d.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleItemNode(node.id);
        });
      }
    } else {
      d.style.opacity = "0.7";
      d.style.borderColor = "#999";
    }
  }
  
  world.appendChild(d);
}

function toggleGroupNode(nodeId) {
  const node = USES_TREE_STATE.nodeData.get(nodeId);
  if (!node) return;
  
  if (USES_TREE_STATE.expandedNodes.has(nodeId)) {
    USES_TREE_STATE.expandedNodes.delete(nodeId);
  } else {
    USES_TREE_STATE.expandedNodes.add(nodeId);
    if (!USES_TREE_STATE.loadedPages[nodeId]) {
      USES_TREE_STATE.loadedPages[nodeId] = new Set([0]);
    }
  }
  
  rebuildAndRerenderUsesTree();
}

function toggleItemNode(nodeId) {
  const node = USES_TREE_STATE.nodeData.get(nodeId);
  if (!node) return;
  
  if (USES_TREE_STATE.expandedNodes.has(nodeId)) {
    USES_TREE_STATE.expandedNodes.delete(nodeId);
  } else {
    USES_TREE_STATE.expandedNodes.add(nodeId);
  }
  
  rebuildAndRerenderUsesTree();
}

function loadMoreItems(loadMoreNode) {
  const groupNode = loadMoreNode.parentGroup;
  
  if (!USES_TREE_STATE.loadedPages[groupNode.id]) {
    USES_TREE_STATE.loadedPages[groupNode.id] = new Set();
  }
  
  USES_TREE_STATE.loadedPages[groupNode.id].add(loadMoreNode.nextPage);
  
  rebuildAndRerenderUsesTree();
}

function rebuildAndRerenderUsesTree() {
  if (!USES_TREE_STATE.rootItem) {
    console.error("No root item stored!");
    return;
  }
  
  const item = USES_TREE_STATE.rootItem;
  
  const expandedNodes = new Set(USES_TREE_STATE.expandedNodes);
  const loadedPages = { ...USES_TREE_STATE.loadedPages };
  
  USES_TREE_STATE.nodeData.clear();
  
  USES_TREE_STATE.nodeCounter = 0;
  
  const newRootNode = {
    id: getUniqueNodeId(`item_${item.name}`),
    type: 'item',
    name: item.name,
    itemName: item.name,
    depth: 0,
    parent: null,
    x: 0,
    y: 0
  };
  
  USES_TREE_STATE.nodeData.set(newRootNode.id, newRootNode);
  USES_TREE_STATE.expandedNodes = expandedNodes;
  USES_TREE_STATE.loadedPages = loadedPages;
  
  USES_TREE_STATE.expandedNodes.add(newRootNode.id);
  
  buildUsesTreeChildren(newRootNode);
  layoutUsesTree(newRootNode);
  
  const world = document.getElementById("treeWorld");
  world.innerHTML = "";
  ensureTreeSvg(world);
  renderUsesTreeNodes(world);
}

function closeTreeView() {
  document.getElementById("treeOverlay").classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

let panX = 0, panY = 0;
let isPanning = false;
let startX = 0, startY = 0;

function setWorldTransform() {
  const world = document.getElementById("treeWorld");
  world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  world.style.transformOrigin = "0 0";
}

function setupPanning() {
  const viewport = document.getElementById("treeViewport");

  viewport.addEventListener("mousedown", (e) => {
    if (e.target.closest(".treeNode")) return;
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    setWorldTransform();
  });

  window.addEventListener("mouseup", () => {
    isPanning = false;
  });

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel * delta));
    
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - panX) / zoomLevel;
    const worldY = (mouseY - panY) / zoomLevel;
    
    panX = mouseX - worldX * newZoom;
    panY = mouseY - worldY * newZoom;
    
    zoomLevel = newZoom;
    setWorldTransform();
  });
}

function renderRealTree(item, mode) {
  const world = document.getElementById("treeWorld");
  world.innerHTML = "";

  currentMode = mode;

  if (mode === "craft") {
    CRAFT_ROOT_ITEM = item;
    
    CRAFT_EXPANDED.clear();
    autoExpandAllCraftNodes(item.name, new Set(), true);
  }

  const viewport = document.getElementById("treeViewport");
  panX = viewport.clientWidth / 2 - NODE_W / 2;
  
  panY = mode === "uses" ? viewport.clientHeight - 150 : 80;
  
  zoomLevel = mode === "uses" ? 0.5 : 1;
  setWorldTransform();

  ensureTreeSvg(world);

  const startX = 0;
  const startY = 0;
  
  let MAX_DEPTH = 10;
  if (mode === "uses") {
    const uses = USES_INDEX[item.name] || [];
    if (uses.length > 20) {
      MAX_DEPTH = 3;
    } else if (uses.length > 10) {
      MAX_DEPTH = 5;
    }
  }

  renderTreeRecursive(item.name, mode, startX, startY, MAX_DEPTH);
  
  // Check if tree contains Crimson/Corruption alternatives and show legend
  checkAndShowAlternativesLegend(item.name, mode);
}

function checkAndShowAlternativesLegend(itemName, mode) {
  const legend = document.getElementById("treeLegend");
  if (!legend) return;
  
  // Check if the tree contains recipes with BOTH Crimson AND Corruption alternatives
  let showLegend = false;
  
  function checkRecipeForBothAlternatives(name, depth = 0) {
    if (depth > 10 || showLegend) return; // Stop if found or too deep
    
    if (mode === "craft" && RECIPES[name]) {
      const recipeVariants = RECIPES[name];
      if (recipeVariants && recipeVariants.length > 0) {
        const ingredients = recipeVariants[0].ingredients || [];
        const ingredientNames = ingredients.map(ing => ing.item);
        
        let hasCrimson = false;
        let hasCorruption = false;
        
        for (const ingName of ingredientNames) {
          if (CRIMSON_ITEMS.has(ingName)) hasCrimson = true;
          if (CORRUPTION_ITEMS.has(ingName)) hasCorruption = true;
        }
        
        // If this recipe has BOTH, show legend
        if (hasCrimson && hasCorruption) {
          showLegend = true;
          return;
        }
        
        // Check children
        for (const ing of ingredients) {
          checkRecipeForBothAlternatives(ing.item, depth + 1);
          if (showLegend) return;
        }
      }
    }
  }
  
  checkRecipeForBothAlternatives(itemName);
  
  // Show legend only if there's a recipe with BOTH alternatives (pick one scenario)
  if (showLegend) {
    legend.style.display = "flex";
  } else {
    legend.style.display = "none";
  }
}

function autoExpandAllCraftNodes(itemName, seen, isRoot = false) {
  if (seen.has(itemName)) return;
  seen.add(itemName);
  
  CRAFT_EXPANDED.add(itemName);
  
  const recipeVariants = RECIPES[itemName];
  if (!recipeVariants || !recipeVariants.length) return;
  
  const conversionStations = ["Shimmer", "Chlorophyte Extractinator", "Extractinator"];
  
  let properRecipes;
  // Special case: for root ores, ONLY use conversion recipes
  if (isRoot && itemName.includes("Ore") && !itemName.includes("Meteorite")) {
    properRecipes = recipeVariants.filter(r => {
      return conversionStations.some(station => r.station && r.station.includes(station));
    });
  }
  // Special case: for root bars, prioritize Furnace recipes
  else if (isRoot && itemName.includes("Bar") && !itemName.includes("Sandstone")) {
    const furnaceRecipes = recipeVariants.filter(r => r.station === "Furnace");
    if (furnaceRecipes.length > 0) {
      properRecipes = furnaceRecipes;
    } else {
      // If no Furnace recipe, filter out conversion stations
      properRecipes = recipeVariants.filter(r => {
        if (conversionStations.some(station => r.station && r.station.includes(station))) {
          return false;
        }
        if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          const output = itemName;
          const isWallConversion = 
            (ingredient.includes("Wall") && !output.includes("Wall")) ||
            (!ingredient.includes("Wall") && output.includes("Wall"));
          if (isWallConversion) {
            return false;
          }
        }
        return true;
      });
    }
  } else {
    // For non-root or non-ores/bars, filter out conversion stations
    properRecipes = recipeVariants.filter(r => {
      if (conversionStations.some(station => r.station && r.station.includes(station))) {
        return false;
      }
      
      if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
        const ingredient = r.ingredients[0].item;
        const output = itemName;
        
        const isWallConversion = 
          (ingredient.includes("Wall") && !output.includes("Wall")) ||
          (!ingredient.includes("Wall") && output.includes("Wall"));
        
        if (isWallConversion) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  if (!properRecipes.length) return;
  
  const firstRecipe = properRecipes[0];
  const ingredients = firstRecipe.ingredients || [];
  
  for (const ing of ingredients) {
    autoExpandAllCraftNodes(ing.item, seen, false);
  }
}

function ensureTreeSvg(world) {
  TREE_SVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  TREE_SVG.setAttribute("width", "3000");
  TREE_SVG.setAttribute("height", "3000");
  TREE_SVG.style.position = "absolute";
  TREE_SVG.style.left = "0";
  TREE_SVG.style.top = "0";
  TREE_SVG.style.pointerEvents = "none";
  TREE_SVG.style.overflow = "visible";
  world.appendChild(TREE_SVG);
}

function drawSvgLine(x1, y1, x2, y2, color = null, itemName = null, parentItemName = null) {
  if (!TREE_SVG) return;
  const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  
  // Use colored lines for Crimson/Corruption alternatives ONLY when the parent recipe has BOTH
  let lineColor = "#333";
  let lineWidth = "3";
  
  if (color) {
    lineColor = color;
    lineWidth = "4";
  } else if (itemName && parentItemName) {
    // Check if parent recipe contains BOTH Crimson and Corruption alternatives
    const parentRecipes = RECIPES[parentItemName];
    if (parentRecipes && parentRecipes.length > 0) {
      const ingredients = parentRecipes[0].ingredients || [];
      const ingredientNames = ingredients.map(ing => ing.item);
      
      let hasCrimson = false;
      let hasCorruption = false;
      
      for (const ingName of ingredientNames) {
        if (CRIMSON_ITEMS.has(ingName)) hasCrimson = true;
        if (CORRUPTION_ITEMS.has(ingName)) hasCorruption = true;
      }
      
      // Only color if parent has BOTH alternatives (meaning pick one)
      if (hasCrimson && hasCorruption) {
        const altType = getAlternativeType(itemName);
        if (altType === "crimson") {
          lineColor = "#dc2626"; // Red for Crimson
          lineWidth = "4";
        } else if (altType === "corruption") {
          lineColor = "#9333ea"; // Purple for Corruption
          lineWidth = "4";
        }
      }
    }
  }
  
  l.setAttribute("stroke", lineColor);
  l.setAttribute("stroke-width", lineWidth);
  TREE_SVG.appendChild(l);
}

function makeTreeNode(item, label, sub, x, y, station) {
  const world = document.getElementById("treeWorld");

  const d = document.createElement("div");
  d.className = "treeNode";
  d.style.left = `${x}px`;
  d.style.top = `${y}px`;
  d.dataset.itemName = label;
  d.title = label;

  const img = document.createElement("img");
  // Special handling for "Any" items - use animated cycling GIF
  if (label && (label.startsWith("Any ") || label === "Any Wood" || label === "Any Sand" || label === "Any Iron Bar" || label === "Any Balloon")) {
    const anyItem = ITEM_BY_NAME[label.replace(/ x\d+$/, '')];
    img.src = anyItem?.img || "";
    img.style.imageRendering = "auto"; // Smooth rendering for animated GIF
  } else {
    img.src = item?.img || "";
    img.style.imageRendering = "pixelated";
  }
  img.alt = label;
  img.referrerPolicy = "no-referrer";

  const t = document.createElement("div");
  
  let stationHTML = "";
  if (station) {
    // First check STATION_IMAGES for direct match
    let stationImgSrc = null;
    
    // Handle Demon Altar / Crimson Altar
    if (station.includes("Demon Altar") || station.includes("Crimson Altar")) {
      const parts = station.split('/').map(s => s.trim());
      stationImgSrc = STATION_IMAGES[parts[0]] || null;
    } else {
      stationImgSrc = STATION_IMAGES[station] || null;
    }
    
    // If not in STATION_IMAGES, try to find as item
    if (!stationImgSrc) {
      const stationToItemMap = {
        "Placed Bottle": "Bottle",
        "By Hand": null
      };
      const itemNameForStation = stationToItemMap[station] || station;
      let stationItem = ITEM_BY_NAME[itemNameForStation];
      
      // If not found, try to extract the main station name
      if (!stationItem && station.includes('/')) {
        const parts = station.split('/').map(s => s.trim());
        for (const part of parts) {
          stationItem = ITEM_BY_NAME[part];
          if (stationItem) break;
        }
      }
      
      if (stationItem && stationItem.img) {
        stationImgSrc = stationItem.img;
      }
    }
    
    if (stationImgSrc) {
      stationHTML = `<div style="font-size:11px;opacity:.6;margin-top:2px;display:flex;align-items:center;gap:4px;">
        <img src="${stationImgSrc}" referrerpolicy="no-referrer" style="width:14px;height:14px;image-rendering:pixelated;" onerror="this.style.display='none'" />
        <span>${station}</span>
      </div>`;
    } else {
      stationHTML = station === "By Hand" 
        ? `<div style="font-size:11px;opacity:.6;margin-top:2px">✋ Hand</div>`
        : `<div style="font-size:11px;opacity:.6;margin-top:2px">📍 ${station}</div>`;
    }
  }
  
  t.innerHTML = `
    <div style="font-weight:800">${label}</div>
    ${stationHTML}
    ${sub ? `<div style="font-size:12px;opacity:.7;margin-top:2px">${sub}</div>` : ""}
  `;

  d.appendChild(img);
  d.appendChild(t);
  
  const itemName = label.replace(/ x\d+$/, '');
  addInfoIconToNode(d, itemName);
  
  if (currentMode === "craft") {
    const itemName = label.replace(/ x\d+$/, '');
    
    const recipeVariants = RECIPES[itemName];
    let hasProperRecipe = false;
    
    if (recipeVariants && recipeVariants.length > 0) {
      const conversionStations = ["Shimmer", "Chlorophyte Extractinator", "Extractinator"];
      
      const properRecipes = recipeVariants.filter(r => {
        if (conversionStations.some(station => r.station && r.station.includes(station))) {
          return false;
        }
        
        if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          const output = itemName;
          
          const isWallConversion = 
            (ingredient.includes("Wall") && !output.includes("Wall")) ||
            (!ingredient.includes("Wall") && output.includes("Wall"));
          
          if (isWallConversion) {
            return false;
          }
        }
        
        return true;
      });
      
      hasProperRecipe = properRecipes.length > 0;
    }
    
    if (hasProperRecipe) {
      d.style.cursor = "pointer";
      
      const expandIcon = document.createElement("div");
      const isExpanded = CRAFT_EXPANDED.has(itemName);
      expandIcon.textContent = isExpanded ? "−" : "+";
      expandIcon.style.position = "absolute";
      expandIcon.style.right = "8px";
      expandIcon.style.top = "50%";
      expandIcon.style.transform = "translateY(-50%)";
      expandIcon.style.fontSize = "20px";
      expandIcon.style.fontWeight = "bold";
      expandIcon.style.color = "#667eea";
      d.appendChild(expandIcon);
      
      d.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleCraftNode(itemName);
      });
    }
  }
  
  world.appendChild(d);

  return { x, y, el: d };
}

function toggleCraftNode(itemName) {
  if (CRAFT_EXPANDED.has(itemName)) {
    CRAFT_EXPANDED.delete(itemName);
  } else {
    CRAFT_EXPANDED.add(itemName);
  }
  
  const savedPanX = panX;
  const savedPanY = panY;
  const savedZoom = zoomLevel;
  
  if (CRAFT_ROOT_ITEM) {
    const world = document.getElementById("treeWorld");
    world.innerHTML = "";
    
    currentMode = "craft";
    
    panX = savedPanX;
    panY = savedPanY;
    zoomLevel = savedZoom;
    setWorldTransform();
    
    ensureTreeSvg(world);
    renderTreeRecursive(CRAFT_ROOT_ITEM.name, "craft", 0, 0, 10);
  }
}

function getChildren(name, mode) {
  if (mode === "craft") {
    const recipeVariants = RECIPES[name];
    if (!recipeVariants || !recipeVariants.length) return [];
    
    const isRootItem = (CRAFT_ROOT_ITEM && CRAFT_ROOT_ITEM.name === name);
    
    // Define filters
    const conversionStations = ["Shimmer", "Chlorophyte Extractinator", "Extractinator"];
    const weirdStations = ["Bone Welder", "Flesh Cloning Vat", "Glass Kiln", "Living Loom"];
    
    // Check if this is an ore or bar that has ONLY conversion recipes
    const isConversionOnlyItem = name.includes("Ore") || (name.includes("Bar") && recipeVariants.every(r => 
      conversionStations.some(s => r.station && r.station.includes(s)) || r.station === "Furnace"
    ));
    
    let properRecipes;
    if (isRootItem) {
      // Special case: for ores at root level, ONLY show conversion recipes
      if (name.includes("Ore") && !name.includes("Meteorite")) {
        properRecipes = recipeVariants.filter(r => {
          // ONLY include conversion station recipes for ores
          return conversionStations.some(s => r.station && r.station.includes(s));
        });
      }
      // Special case: for bars at root level, prioritize Furnace over conversion stations
      else if (name.includes("Bar") && !name.includes("Sandstone")) {
        // First try to find a Furnace recipe
        const furnaceRecipes = recipeVariants.filter(r => r.station === "Furnace");
        if (furnaceRecipes.length > 0) {
          properRecipes = furnaceRecipes;
        } else {
          // If no Furnace recipe, exclude conversion stations
          properRecipes = recipeVariants.filter(r => {
            if (conversionStations.some(s => r.station && r.station.includes(s))) {
              return false;
            }
            // Filter wall conversions
            if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
              const ingredient = r.ingredients[0].item;
              const output = name;
              const isWallConversion = 
                (ingredient.includes("Wall") && !output.includes("Wall")) ||
                (!ingredient.includes("Wall") && output.includes("Wall"));
              if (isWallConversion) return false;
            }
            // Filter reverse crafting
            if (r.station === "By Hand" && r.ingredients && r.ingredients.length === 1) {
              const ingredient = r.ingredients[0].item;
              if (ingredient.includes(name) && ingredient !== name) return false;
            }
            return true;
          });
        }
      } else {
        // Root: only filter REVERSE wall conversions and reverse crafting
        properRecipes = recipeVariants.filter(r => {
          // Filter REVERSE wall conversions (Wall → Block, not Block → Wall)
          // Block → Wall is normal crafting and should be allowed!
          if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
            const ingredient = r.ingredients[0].item;
            const output = name;
            // Only filter if ingredient has "Wall" but output doesn't (reverse crafting)
            const isReverseWallConversion = (ingredient.includes("Wall") && !output.includes("Wall"));
            if (isReverseWallConversion) return false;
          }
          
          // Filter reverse crafting (e.g., Glass Platform -> Glass)
          if (r.station === "By Hand" && r.ingredients && r.ingredients.length === 1) {
            const ingredient = r.ingredients[0].item;
            // Check if ingredient is derived from output (reverse recipe)
            if (ingredient.includes(name) && ingredient !== name) return false;
          }
          
          return true;
        });
      }
    } else {
      // Ingredient: filter extractinator, weird stations, and REVERSE wall recipes
      properRecipes = recipeVariants.filter(r => {
        // Filter REVERSE wall conversions only (Wall → Block, not Block → Wall)
        if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          const output = name;
          // Only filter if ingredient has "Wall" but output doesn't (reverse crafting)
          const isReverseWallConversion = (ingredient.includes("Wall") && !output.includes("Wall"));
          if (isReverseWallConversion) return false;
        }
        
        // Filter conversion stations
        if (conversionStations.some(s => r.station && r.station.includes(s))) return false;
        
        // Filter weird stations
        if (weirdStations.some(s => r.station && r.station.includes(s))) return false;
        
        // Filter reverse crafting
        if (r.station === "By Hand" && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          if (ingredient.includes(name) && ingredient !== name) return false;
        }
        
        // Also filter Bone Welder reverse recipes
        if (r.station === "Bone Welder" && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          if (ingredient.includes(name) && ingredient !== name) return false;
        }
        
        return true;
      });
    }
    
    if (!properRecipes.length) return [];
    
    const firstRecipe = properRecipes[0];
    const ingredients = firstRecipe.ingredients || [];
    
    const seen = new Set();
    const unique = [];
    
    for (const ing of ingredients) {
      if (!seen.has(ing.item)) {
        seen.add(ing.item);
        unique.push(ing);
      }
    }
    
    return unique.map(ing => ({
      name: ing.item,
      qty: ing.qty,
      isGroup: false
    }));
  } else {
    const allUses = USES_INDEX[name] || [];
    const uses = allUses
      .filter(use => use.station !== "Shimmer")
      .map(use => ({
        name: use.output,
        qty: use.qty
      }));
    
    if (uses.length > 20) {
      return groupItemsByCategory(uses);
    }
    
    return uses.map(u => ({ ...u, isGroup: false }));
  }
}

function groupItemsByCategory(items) {
  const categoryGroups = {};
  
  for (const item of items) {
    const category = detectCategory(item.name);
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(item);
  }
  
  const groups = [];
  const categoryNames = {
    weapon: "⚔️ Weapons",
    tool: "🔨 Tools", 
    armor: "🛡️ Armor",
    potion: "🧪 Potions",
    material: "💎 Materials",
    furniture: "🪑 Furniture",
    accessory: "💍 Accessories",
    ammo: "🎯 Ammo",
    block: "🧱 Blocks"
  };
  
  for (const [category, groupItems] of Object.entries(categoryGroups)) {
    groups.push({
      name: `${categoryNames[category] || category}`,
      isGroup: true,
      category: category,
      items: groupItems,
      qty: groupItems.length
    });
  }
  
  return groups;
}

function measureWidth(name, mode, depthLeft, seen) {
  const key = `${mode}|${name}|${depthLeft}`;
  if (seen[key]) return 1;
  seen[key] = true;

  if (depthLeft <= 0) return 1;

  const kids = getChildren(name, mode);
  if (!kids.length) return 1;

  let sum = 0;
  for (const k of kids) {
    if (k.isGroup) {
      sum += 1;
    } else {
      sum += measureWidth(k.name, mode, depthLeft - 1, { ...seen });
    }
  }
  return Math.max(sum, 1);
}

function renderTreeRecursive(name, mode, x, y, depthLeft, seen = {}, parentStation = null, label = null) {
  const key = `${mode}|${name}`;
  if (seen[key]) return null;
  seen[key] = true;

  const itemObj = ITEM_BY_NAME[name] || { img: "" };
  
  let station = null;
  if (mode === "craft" && RECIPES[name]) {
    const conversionStations = ["Shimmer", "Chlorophyte Extractinator", "Extractinator"];
    const isRootItem = (CRAFT_ROOT_ITEM && CRAFT_ROOT_ITEM.name === name);
    
    let properRecipes;
    // Special case: for root ores, show conversion station recipes
    if (isRootItem && name.includes("Ore") && !name.includes("Meteorite")) {
      properRecipes = RECIPES[name].filter(r => {
        return conversionStations.some(s => r.station && r.station.includes(s));
      });
    }
    // Special case: for root bars, prioritize Furnace
    else if (isRootItem && name.includes("Bar") && !name.includes("Sandstone")) {
      const furnaceRecipes = RECIPES[name].filter(r => r.station === "Furnace");
      if (furnaceRecipes.length > 0) {
        properRecipes = furnaceRecipes;
      } else {
        // For non-root items or non-ores/bars, filter out conversion stations
        properRecipes = RECIPES[name].filter(r => {
          if (conversionStations.some(s => r.station && r.station.includes(s))) {
            return false;
          }
          return true;
        });
      }
    } else {
      // For non-root items (ingredients), filter out conversion stations AND REVERSE wall conversions
      properRecipes = RECIPES[name].filter(r => {
        // Filter conversion stations
        if (conversionStations.some(s => r.station && r.station.includes(s))) {
          return false;
        }
        
        // Filter REVERSE wall conversions only (Wall → Block, e.g., Obsidian Wall -> Obsidian)
        // Block → Wall is normal crafting and should be allowed!
        if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          const output = name;
          // Only filter if ingredient has "Wall" but output doesn't (reverse crafting)
          const isReverseWallConversion = (ingredient.includes("Wall") && !output.includes("Wall"));
          if (isReverseWallConversion) return false;
        }
        
        // Filter reverse crafting
        if (r.station === "By Hand" && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          if (ingredient.includes(name) && ingredient !== name) return false;
        }
        
        return true;
      });
    }
    
    // Only show station if there are valid recipes AND the first recipe has a station
    if (properRecipes && properRecipes.length > 0 && properRecipes[0].station) {
      station = properRecipes[0].station;
      if (station && station.includes('/')) {
        station = station.split('/')[0].trim();
      }
    }
  }
  
  const displayLabel = label || name;
  const node = makeTreeNode(itemObj, displayLabel, "", x, y, station);

  if (depthLeft <= 0) {
    return node;
  }

  const kids = getChildren(name, mode);
  if (!kids.length) return node;

  if (mode === "craft" && !CRAFT_EXPANDED.has(name)) {
    return node;
  }

  if (mode === "craft") {
    const X_GAP = CRAFT_X_GAP;
    const Y_GAP = CRAFT_Y_GAP;
    
    const widths = kids.map(k => measureWidth(k.name, mode, depthLeft - 1, {}));
    const total = widths.reduce((a, b) => a + b, 0);

    let cursor = x - ((total - 1) * X_GAP) / 2;

    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      const w = widths[i];

      const childX = cursor + ((w - 1) * X_GAP) / 2;
      const childY = y + Y_GAP;

      const childLabel = k.qty ? `${k.name} x${k.qty}` : k.name;
      const childNode = renderTreeRecursive(k.name, mode, childX, childY, depthLeft - 1, { ...seen }, station, childLabel);

      if (childNode) {
        // Pass child item name AND parent item name for colored lines (only when parent has BOTH alternatives)
        drawSvgLine(
          x + NODE_W / 2,
          y + NODE_H,
          childX + NODE_W / 2,
          childY,
          null,
          k.name,
          name
        );
      }

      cursor += w * X_GAP;
    }

    return node;
  }
  
  console.warn("renderTreeRecursive called for uses mode - this shouldn't happen");
  return node;
}

function selectCategory(category) {
  currentCategory = category;
  currentSubcategory = null;
  
  document.querySelectorAll(".cat-item").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".cat-sub-item").forEach(el => el.classList.remove("active"));
  
  const catItem = document.querySelector(`[data-category="${category}"]`);
  if (catItem) catItem.classList.add("active");
  
  document.getElementById("q").value = "";
  applyFilter();
}

function selectSubcategory(category, subcategory) {
  currentCategory = category;
  currentSubcategory = subcategory;
  
  document.querySelectorAll(".cat-item").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".cat-sub-item").forEach(el => el.classList.remove("active"));
  
  const subItem = document.querySelector(`[data-subcategory="${category}-${subcategory}"]`);
  if (subItem) subItem.classList.add("active");
  
  document.getElementById("q").value = "";
  applyFilter();
}

function toggleSubcategories(category) {
  const subsDiv = document.getElementById(`subs-${category}`);
  const catItem = document.querySelector(`[data-category="${category}"]`);
  
  if (!subsDiv) return;
  
  if (subsDiv.style.display === "none" || !subsDiv.style.display) {
    subsDiv.style.display = "block";
    if (catItem) catItem.classList.add("expanded");
  } else {
    subsDiv.style.display = "none";
    if (catItem) catItem.classList.remove("expanded");
  }
}

function buildSubcategoryUI() {
  for (const [catKey, catData] of Object.entries(SUBCATEGORIES)) {
    const subsDiv = document.getElementById(`subs-${catKey}`);
    if (!subsDiv) continue;
    
    subsDiv.innerHTML = "";
    
    // Add "All [Category]" option
    const allDiv = document.createElement("div");
    allDiv.className = "cat-sub-item";
    allDiv.dataset.subcategory = `${catKey}-all`;
    allDiv.onclick = () => selectCategory(catKey);
    allDiv.innerHTML = `
      <span class="cat-sub-name">All ${catData.name}</span>
      <span class="cat-sub-count" id="count-${catKey}-all">0</span>
    `;
    subsDiv.appendChild(allDiv);
    
    // Add each subcategory
    for (const [subKey, subData] of Object.entries(catData.subs)) {
      const subDiv = document.createElement("div");
      subDiv.className = "cat-sub-item";
      subDiv.dataset.subcategory = `${catKey}-${subKey}`;
      subDiv.onclick = () => selectSubcategory(catKey, subKey);
      subDiv.innerHTML = `
        <span class="cat-sub-name">${subData.name}</span>
        <span class="cat-sub-count" id="count-${catKey}-${subKey}">0</span>
      `;
      subsDiv.appendChild(subDiv);
    }
  }
}

function updateCategoryCounts() {
  // Count items in each main category
  const catCounts = { all: ITEMS.length };
  const subCounts = {};
  
  for (const item of ITEMS) {
    const cat = detectCategory(item.name);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
    
    // Count subcategories
    const subcat = getItemSubcategory(item, cat);
    if (subcat) {
      const key = `${cat}-${subcat}`;
      subCounts[key] = (subCounts[key] || 0) + 1;
    }
  }
  
  // Update UI counts
  for (const [cat, count] of Object.entries(catCounts)) {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = count;
  }
  
  for (const [key, count] of Object.entries(subCounts)) {
    const el = document.getElementById(`count-${key}`);
    if (el) el.textContent = count;
  }
  
  // Update "All [Category]" counts
  for (const catKey of Object.keys(SUBCATEGORIES)) {
    const count = catCounts[catKey] || 0;
    const el = document.getElementById(`count-${catKey}-all`);
    if (el) el.textContent = count;
  }
}

async function main() {
  initDarkMode();
  
  ITEMS = await loadItems();
  RECIPES = await loadRecipes();
  ITEM_DETAILS = await loadItemDetails();
  NPC_BY_NAME = await loadNPCs();
  OBJECTS_BY_NAME = await loadObjects();
  STATION_IMAGES = await loadStationImages();
  buildIndexes();
  buildSubcategoryUI();

  FILTERED = ITEMS;

  const qEl = document.getElementById("q");

  const applyFilterDebounced = debounce(applyFilter, 120);

  qEl.addEventListener("input", applyFilterDebounced);
  qEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilter();
  });

  const resultsContainer = document.getElementById("results");
  if (resultsContainer) {
    resultsContainer.addEventListener("scroll", loadMoreIfNeeded);
  }
  
  document.getElementById("btnSettings").addEventListener("click", openSettingsModal);

  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      currentCategory = btn.dataset.category;
      
      document.getElementById("q").value = "";
      applyFilter();
    });
  });

  const backdrop = document.getElementById("modalBackdrop");

  document.getElementById("btnClose").addEventListener("click", closeChoiceModal);
  document.getElementById("infoModalClose").addEventListener("click", closeItemInfoModal);
  
  document.getElementById("infoModalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "infoModalBackdrop") {
      closeItemInfoModal();
    }
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeChoiceModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!document.getElementById("treeOverlay").classList.contains("hidden")) {
        closeTreeView();
      } else {
        closeChoiceModal();
      }
    }
  });

  document.getElementById("btnTree").addEventListener("click", () => {
    if (!selectedItem) return;
    const item = selectedItem;
    closeChoiceModal();
    openTreeView(item, "craft");
  });

  document.getElementById("btnUses").addEventListener("click", () => {
    if (!selectedItem) return;
    const item = selectedItem;
    closeChoiceModal();
    openTreeView(item, "uses");
  });

  document.getElementById("treeBack").addEventListener("click", closeTreeView);

  document.getElementById("btnTimeline").addEventListener("click", openTimeline);
  document.getElementById("timelineBack").addEventListener("click", closeTimeline);

  setupPanning();

  applyFilter();
  qEl.focus();
}

const TIMELINE_DATA = [
  {
    stage: "Pre-Hardmode",
    class: "stage-prehardmode",
    description: "Available from the start of the game",
    items: [
      { name: "Copper Ore", type: "Ore", img: "" },
      { name: "Tin Ore", type: "Ore (Alt)", img: "" },
      { name: "Iron Ore", type: "Ore", img: "" },
      { name: "Lead Ore", type: "Ore (Alt)", img: "" },
      { name: "Silver Ore", type: "Ore", img: "" },
      { name: "Tungsten Ore", type: "Ore (Alt)", img: "" },
      { name: "Gold Ore", type: "Ore", img: "" },
      { name: "Platinum Ore", type: "Ore (Alt)", img: "" },
      { name: "Meteorite", type: "Ore", img: "", milestone: "After breaking Shadow Orb/Crimson Heart" },
      { name: "Demonite Ore", type: "Ore", img: "", milestone: "From Eye of Cthulhu, Eater of Worlds" },
      { name: "Crimtane Ore", type: "Ore (Alt)", img: "", milestone: "From Eye of Cthulhu, Brain of Cthulhu" },
      { name: "Hellstone", type: "Ore", img: "", milestone: "Found in The Underworld" },
    ]
  },
  {
    stage: "Hardmode",
    class: "stage-hardmode",
    description: "Unlocked after defeating Wall of Flesh",
    milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
    items: [
      { name: "Cobalt Ore", type: "Ore", img: "" },
      { name: "Palladium Ore", type: "Ore (Alt)", img: "" },
      { name: "Mythril Ore", type: "Ore", img: "" },
      { name: "Orichalcum Ore", type: "Ore (Alt)", img: "" },
      { name: "Adamantite Ore", type: "Ore", img: "" },
      { name: "Titanium Ore", type: "Ore (Alt)", img: "" },
      { name: "Chlorophyte Ore", type: "Ore", img: "", milestone: "Found in Underground Jungle (Hardmode)" },
    ]
  },
  {
    stage: "Post-Plantera",
    class: "stage-plantera",
    description: "Available after defeating Plantera",
    milestone: "🌺 Defeat Plantera",
    items: [
      { name: "Shroomite Bar", type: "Bar", img: "", milestone: "Crafted with Chlorophyte + Glowing Mushrooms" },
      { name: "Spectre Bar", type: "Bar", img: "", milestone: "Crafted with Chlorophyte + Ectoplasm" },
    ]
  },
  {
    stage: "Post-Golem",
    class: "stage-golem",
    description: "Available after defeating Golem",
    milestone: "🗿 Defeat Golem",
    items: [
      { name: "Beetle Husk", type: "Material", img: "", milestone: "Drops from Golem" },
    ]
  },
  {
    stage: "Lunar Events",
    class: "stage-moonlord",
    description: "Available during/after Lunar Events",
    milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
    items: [
      { name: "Luminite", type: "Ore", img: "", milestone: "Drops from Moon Lord" },
      { name: "Solar Fragment", type: "Fragment", img: "" },
      { name: "Vortex Fragment", type: "Fragment", img: "" },
      { name: "Nebula Fragment", type: "Fragment", img: "" },
      { name: "Stardust Fragment", type: "Fragment", img: "" },
    ]
  }
];

function renderTimeline() {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";

  for (const stage of TIMELINE_DATA) {
    const stageDiv = document.createElement("div");
    stageDiv.className = `timeline-stage ${stage.class}`;

    if (stage.milestone) {
      const milestone = document.createElement("div");
      milestone.className = "milestone";
      milestone.innerHTML = `
        <div class="milestone-icon">⚡</div>
        <div class="milestone-text">${stage.milestone}</div>
      `;
      stageDiv.appendChild(milestone);
    }

    const header = document.createElement("div");
    header.className = "stage-header";
    header.innerHTML = `
      <h2>${stage.stage}</h2>
      <p>${stage.description}</p>
    `;
    stageDiv.appendChild(header);

    const itemsGrid = document.createElement("div");
    itemsGrid.className = "stage-items";

    for (const item of stage.items) {
      const itemDiv = document.createElement("div");
      itemDiv.className = "timeline-item";

      const itemData = ITEM_BY_NAME[item.name];
      const imgSrc = itemData?.img || "";

      itemDiv.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}" referrerpolicy="no-referrer" />
        <div class="timeline-item-info">
          <div class="timeline-item-name">${item.name}</div>
          <div class="timeline-item-type">${item.type}</div>
        </div>
      `;

      itemDiv.addEventListener("click", () => {
        closeTimeline();
        document.getElementById("q").value = item.name;
        applyFilter();
      });

      itemsGrid.appendChild(itemDiv);
    }

    stageDiv.appendChild(itemsGrid);
    content.appendChild(stageDiv);
  }
}

function openTimeline() {
  document.getElementById("timelinePage").classList.remove("hidden");
  document.body.classList.add("no-scroll");
  renderTimeline();
}

function closeTimeline() {
  document.getElementById("timelinePage").classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  document.body.classList.toggle('dark-mode', darkMode);
}

function initDarkMode() {
  if (darkMode) {
    document.body.classList.add('dark-mode');
  }
}

function openSettingsModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
  
  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--bg-secondary);padding:24px;border-radius:16px;min-width:350px;box-shadow:0 10px 40px rgba(0,0,0,0.3);';
  
  modal.innerHTML = `
    <h2 style="margin:0 0 20px 0;font-size:24px;color:var(--text-primary);">⚙️ Settings</h2>
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--bg-tertiary);border-radius:8px;">
        <div>
          <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">Dark Mode</div>
          <div style="font-size:13px;color:var(--text-secondary);">Toggle dark theme</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="darkModeToggle" ${darkMode ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <button id="closeSettings" style="padding:12px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:8px;cursor:pointer;font-weight:600;color:var(--text-primary);font-size:15px;">Close</button>
    </div>
  `;
  
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  
  const toggle = document.getElementById('darkModeToggle');
  toggle.addEventListener('change', () => {
    toggleDarkMode();
  });
  
  document.getElementById('closeSettings').addEventListener('click', () => {
    backdrop.remove();
  });
  
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  });
}

function openItemInfoModal(itemName) {
  const item = ITEM_BY_NAME[itemName];
  const details = ITEM_DETAILS[itemName] || {};
  
  if (!item) return;
  
  const infoImg = document.getElementById("infoModalImg");
  infoImg.src = item.img || "";
  
  // Handle "Any" items with animated GIFs - use smooth rendering
  if (itemName && (itemName.startsWith("Any ") || itemName === "Any Wood" || itemName === "Any Sand" || itemName === "Any Iron Bar" || itemName === "Any Balloon")) {
    infoImg.style.imageRendering = "auto";
  } else {
    infoImg.style.imageRendering = "pixelated";
  }
  
  document.getElementById("infoModalTitle").textContent = itemName;
  
  const station = details.station || "No crafting station";
  const stationEl = document.getElementById("infoModalStation");
  
  if (station && station !== "No crafting station") {
    const stationItem = ITEM_BY_NAME[station];
    if (stationItem?.img) {
      stationEl.innerHTML = `<img src="${stationItem.img}" style="width: 16px; height: 16px; vertical-align: middle; image-rendering: pixelated; margin-right: 4px;" referrerpolicy="no-referrer" /> ${station}`;
    } else if (station === "By Hand") {
      stationEl.textContent = `✋ ${station}`;
    } else {
      stationEl.textContent = `🏭 ${station}`;
    }
  } else {
    stationEl.textContent = station;
  }
  
  let contentHTML = "";
  
  if (details.tooltip) {
    contentHTML += `<div style="margin-bottom: 16px; padding: 12px 0; line-height: 1.6; color: var(--text-primary); opacity: 0.9;">
      ${details.tooltip}
    </div>`;
  }
  
  if (details.drops && details.drops.length > 0) {
    const DROP_THRESHOLD = 5;
    const dropId = `drops-${itemName.replace(/\s/g, '-')}`;
    
    const firstDrop = details.drops[0].enemy.toLowerCase();
    const isMob = NPC_BY_NAME[details.drops[0].enemy] !== undefined;
    const isTree = firstDrop.includes('tree');
    const dropHeader = isTree ? '🌳 Found in' : (isMob ? '💀 Dropped by' : '📦 Found in');
    
    if (details.drops.length > DROP_THRESHOLD) {
      contentHTML += `<div style="margin-bottom: 12px;"><div style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">${dropHeader}</div>`;
      contentHTML += `<div id="${dropId}" style="display: flex; flex-direction: column; gap: 6px;">`;
      
      const dropsToShow = details.drops.slice(0, 3);
      dropsToShow.forEach(drop => {
        const obj = OBJECTS_BY_NAME[drop.enemy];
        const npc = NPC_BY_NAME[drop.enemy];
        const dropItem = ITEM_BY_NAME[drop.enemy];
        const imgSrc = obj?.img || npc?.img || dropItem?.img || "";
        const rate = drop.percent ? `${drop.percent}%` : (drop.rate || "");
        
        const isTree = obj?.type === 'Tree';
        const containerSize = isTree ? '60px' : '32px';
        const maxImageSize = isTree ? '56px' : '32px';
        
        contentHTML += `<div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
          <div style="width: ${containerSize}; height: ${containerSize}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${imgSrc ? `<img src="${imgSrc}" referrerpolicy="no-referrer" style="max-height: ${maxImageSize}; max-width: ${maxImageSize}; height: auto; width: auto; image-rendering: pixelated;" onerror="this.style.display='none'" />` : ''}
          </div>
          <span style="flex: 1; color: var(--text-primary);">${drop.enemy}</span>
          <span style="opacity: 0.7; font-size: 13px; color: var(--text-secondary);">${rate}</span>
        </div>`;
      });
      
      const remainingDrops = details.drops.slice(3);
      contentHTML += `<div id="${dropId}-hidden" style="display: none; flex-direction: column; gap: 6px;">`;
      remainingDrops.forEach(drop => {
        const obj = OBJECTS_BY_NAME[drop.enemy];
        const npc = NPC_BY_NAME[drop.enemy];
        const dropItem = ITEM_BY_NAME[drop.enemy];
        const imgSrc = obj?.img || npc?.img || dropItem?.img || "";
        const rate = drop.percent ? `${drop.percent}%` : (drop.rate || "");
        
        const isTree = obj?.type === 'Tree';
        const containerSize = isTree ? '60px' : '32px';
        const maxImageSize = isTree ? '56px' : '32px';
        
        contentHTML += `<div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
          <div style="width: ${containerSize}; height: ${containerSize}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${imgSrc ? `<img src="${imgSrc}" referrerpolicy="no-referrer" style="max-height: ${maxImageSize}; max-width: ${maxImageSize}; height: auto; width: auto; image-rendering: pixelated;" onerror="this.style.display='none'" />` : ''}
          </div>
          <span style="flex: 1; color: var(--text-primary);">${drop.enemy}</span>
          <span style="opacity: 0.7; font-size: 13px; color: var(--text-secondary);">${rate}</span>
        </div>`;
      });
      contentHTML += '</div>';
      
      const remaining = remainingDrops.length;
      contentHTML += `<button id="${dropId}-toggle" onclick="toggleDropsList('${dropId}')" style="padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-weight: 600; transition: all 0.2s;">
        <span id="${dropId}-toggle-text">+${remaining} more</span>
      </button>`;
      
      contentHTML += '</div></div>';
    } else {
      const firstDrop = details.drops[0].enemy.toLowerCase();
      const isMob = NPC_BY_NAME[details.drops[0].enemy] !== undefined;
      const isTree = firstDrop.includes('tree');
      const dropHeader = isTree ? '🌳 Found in' : (isMob ? '💀 Dropped by' : '📦 Found in');
      
      contentHTML += `<div style="margin-bottom: 12px;"><div style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">${dropHeader}</div>`;
      contentHTML += '<div style="display: flex; flex-direction: column; gap: 6px;">';
      
      details.drops.forEach(drop => {
        const obj = OBJECTS_BY_NAME[drop.enemy];
        const npc = NPC_BY_NAME[drop.enemy];
        const dropItem = ITEM_BY_NAME[drop.enemy];
        const imgSrc = obj?.img || npc?.img || dropItem?.img || "";
        const rate = drop.percent ? `${drop.percent}%` : (drop.rate || "");
        
        const isTree = obj?.type === 'Tree';
        const containerSize = isTree ? '60px' : '32px';
        const maxImageSize = isTree ? '56px' : '32px';
        
        contentHTML += `<div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
          <div style="width: ${containerSize}; height: ${containerSize}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${imgSrc ? `<img src="${imgSrc}" referrerpolicy="no-referrer" style="max-height: ${maxImageSize}; max-width: ${maxImageSize}; height: auto; width: auto; image-rendering: pixelated;" onerror="this.style.display='none'" />` : ''}
          </div>
          <span style="flex: 1; color: var(--text-primary);">${drop.enemy}</span>
          <span style="opacity: 0.7; font-size: 13px; color: var(--text-secondary);">${rate}</span>
        </div>`;
      });
      
      contentHTML += '</div></div>';
    }
  }
  
  if (details.sold_by && details.sold_by.length > 0) {
    contentHTML += '<div style="margin-bottom: 12px;"><div style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">💰 Sold by</div>';
    contentHTML += '<div style="display: flex; flex-direction: column; gap: 6px;">';
    
    details.sold_by.forEach(npcName => {
      const npc = NPC_BY_NAME[npcName];
      const npcItem = ITEM_BY_NAME[npcName];
      const imgSrc = npc?.img || npcItem?.img || "";
      
      contentHTML += `<div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
        <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${imgSrc ? `<img src="${imgSrc}" referrerpolicy="no-referrer" style="max-height: 32px; max-width: 32px; height: auto; width: auto; image-rendering: pixelated;" onerror="this.style.display='none'" />` : ''}
        </div>
        <span style="color: var(--text-primary);">${npcName}</span>
      </div>`;
    });
    
    contentHTML += '</div></div>';
  }
  
  if (!contentHTML) {
    contentHTML = '<div style="opacity: 0.7; font-style: italic;">No additional information available.</div>';
  }
  
  // Add note about buffs/debuffs if this is an accessory or armor
  const itemCategory = detectCategory(itemName);
  if (itemCategory === 'accessory' || itemCategory === 'armor' || itemName.toLowerCase().includes('charm') || itemName.toLowerCase().includes('emblem')) {
    contentHTML += '<div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-left: 3px solid #667eea; border-radius: 6px;">';
    contentHTML += '<div style="font-weight: 600; margin-bottom: 4px; color: var(--text-primary);">💡 Buffs & Debuffs</div>';
    contentHTML += '<div style="font-size: 13px; opacity: 0.9; color: var(--text-secondary);">For detailed buff/debuff information, click the "Open Wiki Page" button below.</div>';
    contentHTML += '</div>';
  }
  
  document.getElementById("infoModalContent").innerHTML = contentHTML;
  
  const wikiLink = details.wiki || `https://terraria.wiki.gg/wiki/${itemName.replace(/ /g, '_')}`;
  document.getElementById("infoModalWikiLink").href = wikiLink;
  
  document.getElementById("infoModalBackdrop").classList.remove("hidden");
}

function toggleDropsList(dropId) {
  const hiddenDrops = document.getElementById(`${dropId}-hidden`);
  const toggleBtn = document.getElementById(`${dropId}-toggle`);
  const toggleText = document.getElementById(`${dropId}-toggle-text`);
  
  if (hiddenDrops.style.display === 'none') {
    hiddenDrops.style.display = 'flex';
    toggleText.textContent = 'Show less';
  } else {
    hiddenDrops.style.display = 'none';
    const count = hiddenDrops.children.length;
    toggleText.textContent = `+${count} more`;
  }
}

function closeItemInfoModal() {
  document.getElementById("infoModalBackdrop").classList.add("hidden");
}

function addInfoIconToNode(nodeElement, itemName) {
  if (!ITEM_BY_NAME[itemName]) return;
  
  const infoIcon = document.createElement("div");
  infoIcon.className = "item-info-icon";
  infoIcon.innerHTML = `<svg viewBox="-7 -5 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="9" y1="8" x2="9" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="9" cy="5" r="0.9" fill="currentColor"/>
  </svg>`;
  infoIcon.title = "View item info";
  
  infoIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    openItemInfoModal(itemName);
  });
  
  nodeElement.appendChild(infoIcon);
}

main().catch(err => {
  document.getElementById("results").textContent = err.message;
  console.error(err);
});