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
const HEAVY_BENCH_IMG = ["https://terraria.wiki.gg/images/Heavy_Work_Bench_%28old%29.png", "https://terraria.wiki.gg/images/Heavy_Assembler_%28placed%29.png"];

const NODE_W = 180;
const NODE_H = 60;
const CRAFT_X_GAP = 200;
const CRAFT_Y_GAP = 85;

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

// ============================================================
// ITEM CLASSIFIER
// Every item gets exactly one main category and (inside it) exactly one sub-category.
// The main signal is the wiki's own first sentence for the item ("...is a Hardmode bow"), which comes from
// data/complete_list.json. The item name is only used to pick the sub-category. Rules run in a fixed order.
// The sidebar counts and the grid both use this same function, so they can never disagree.
// "icon" is an item whose picture is shown next to the category in the sidebar.
// ============================================================
const SUBCATEGORIES = {
  weapon: {
    name: "Weapons", icon: "Copper Shortsword",
    subs: {
      broadswords: { name: "Swords", icon: "Iron Broadsword" },
      shortswords: { name: "Shortswords", icon: "Iron Shortsword" },
      spears: { name: "Spears", icon: "Spear" },
      yoyos: { name: "Yoyos", icon: "Wooden Yoyo" },
      flails: { name: "Flails", icon: "Ball O' Hurt" },
      boomerangs: { name: "Boomerangs", icon: "Wooden Boomerang" },
      whips: { name: "Whips", icon: "Leather Whip" },
      bows: { name: "Bows", icon: "Wooden Bow" },
      repeaters: { name: "Repeaters", icon: "Hallowed Repeater" },
      guns: { name: "Guns", icon: "Flintlock Pistol" },
      launchers: { name: "Launchers", icon: "Grenade Launcher" },
      wands: { name: "Staffs & Wands", icon: "Wand of Sparking" },
      rods: { name: "Magic Rods", icon: "Crimson Rod" },
      tomes: { name: "Spell Tomes", icon: "Water Bolt" },
      summon_minions: { name: "Summon Staffs", icon: "Slime Staff" },
      other_magic: { name: "Other Magic", icon: "Amethyst Staff" },
      thrown: { name: "Thrown & Explosives", icon: "Shuriken" },
      other_weapon: { name: "Other Weapons", icon: "Muramasa" },
    }
  },
  tool: {
    name: "Tools", icon: "Iron Pickaxe",
    subs: {
      pickaxes: { name: "Pickaxes", icon: "Copper Pickaxe" },
      drills: { name: "Drills", icon: "Cobalt Drill" },
      axes: { name: "Axes", icon: "Copper Axe" },
      hammers: { name: "Hammers", icon: "Wooden Hammer" },
      multitools: { name: "Multi-tools", icon: "Molten Hamaxe" },
      fishing: { name: "Fishing Poles", icon: "Golden Fishing Rod" },
      nets: { name: "Bug Nets", icon: "Bug Net" },
      other_tool: { name: "Other Tools", icon: "Red Wrench" },
    }
  },
  armor: {
    name: "Armor", icon: "Iron Chainmail",
    subs: {
      helmets: { name: "Helmets", icon: "Iron Helmet" },
      chestplates: { name: "Chestplates", icon: "Iron Chainmail" },
      leggings: { name: "Leggings", icon: "Iron Greaves" },
      vanity_armor: { name: "Vanity & Clothes", icon: "Pink Shirt" },
    }
  },
  accessory: {
    name: "Accessories", icon: "Hermes Boots",
    subs: {
      wings: { name: "Wings", icon: "Angel Wings" },
      boots: { name: "Boots", icon: "Hermes Boots" },
      balloons: { name: "Balloons & Jump", icon: "Shiny Red Balloon" },
      hooks: { name: "Hooks", icon: "Grappling Hook" },
      shields: { name: "Shields", icon: "Cobalt Shield" },
      emblems: { name: "Emblems", icon: "Warrior Emblem" },
      charms: { name: "Charms", icon: "Charm of Myths" },
      info: { name: "Informational", icon: "Gold Watch" },
      vanity: { name: "Vanity", icon: "Sunglasses" },
      other_acc: { name: "Other Accessories", icon: "Band of Regeneration" },
    }
  },
  potion: {
    name: "Potions", icon: "Healing Potion",
    subs: {
      healing: { name: "Healing", icon: "Healing Potion" },
      mana: { name: "Mana", icon: "Mana Potion" },
      buff: { name: "Buff Potions", icon: "Ironskin Potion" },
      food: { name: "Food & Drink", icon: "Pumpkin Pie" },
    }
  },
  material: {
    name: "Materials", icon: "Iron Bar",
    subs: {
      ores: { name: "Ores", icon: "Iron Ore" },
      bars: { name: "Bars", icon: "Iron Bar" },
      gems: { name: "Gems", icon: "Diamond" },
      souls: { name: "Souls", icon: "Soul of Light" },
      plants: { name: "Plants & Herbs", icon: "Daybloom" },
      other_material: { name: "Other Materials", icon: "Gel" },
    }
  },
  furniture: {
    name: "Furniture", icon: "Work Bench",
    subs: {
      crafting: { name: "Crafting Stations", icon: "Anvil" },
      storage: { name: "Storage", icon: "Chest" },
      lighting: { name: "Lighting", icon: "Torch" },
      comfort: { name: "Comfort", icon: "Wooden Chair" },
      decorative: { name: "Decorative", icon: "Painting" },
      other_furniture: { name: "Other Furniture", icon: "Wooden Door" },
    }
  },
  block: {
    name: "Blocks", icon: "Dirt Block",
    subs: {
      natural: { name: "Natural", icon: "Dirt Block" },
      bricks: { name: "Bricks", icon: "Gray Brick" },
      wood: { name: "Wood", icon: "Wood" },
      glass: { name: "Glass", icon: "Glass" },
      other_block: { name: "Walls & Platforms", icon: "Wood Platform" },
    }
  },
  misc: {
    name: "Misc", icon: "Life Crystal",
    subs: {
      pets: { name: "Pets & Mounts", icon: "Fairy Bell" },
      critters: { name: "Critters & Fish", icon: "Goldfish" },
      dyes: { name: "Dyes & Paint", icon: "Red Dye" },
      crates: { name: "Crates & Bags", icon: "Wooden Crate" },
      summons: { name: "Summoning Items", icon: "Suspicious Looking Eye" },
      boosters: { name: "Boosters & Pickups", icon: "Life Crystal" },
      mechanisms: { name: "Wiring & Traps", icon: "Red Pressure Plate" },
      keys: { name: "Keys & Molds", icon: "Golden Key" },
      other_misc: { name: "Everything Else", icon: "Binoculars" },
    }
  },
  ammo: {
    name: "Ammo", icon: "Wooden Arrow",
    subs: {
      arrows: { name: "Arrows", icon: "Wooden Arrow" },
      bullets: { name: "Bullets", icon: "Musket Ball" },
      rockets: { name: "Rockets", icon: "Rocket I" },
      darts: { name: "Darts & Seeds", icon: "Poison Dart" },
      other_ammo: { name: "Other Ammo", icon: "Flare" },
    }
  }
};

function getAlternativeType(itemName) {
  if (CRIMSON_ITEMS.has(itemName)) return "crimson";
  if (CORRUPTION_ITEMS.has(itemName)) return "corruption";
  return null;
}

// ---------- helpers ----------
const _normName = s => s.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
const _re = {};
function _ph(n, phrase) {            // whole-word phrase match ("bug net" matches "Golden Bug Net")
  const key = phrase;
  if (!_re[key]) _re[key] = new RegExp("(^|[^a-z0-9])" + _normName(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9])");
  return _re[key].test(n);
}
const _anyPh = (n, list) => list.some(p => _ph(n, p));
const _anyTok = (t, list) => list.some(w => t.has(w));

// ---------- word lists (lowercase, no apostrophes) ----------
const L = {
  multitool: ["hamaxe", "hamdrax", "drax", "picksaw", "pickaxe axe", "digging claw", "the axe"],
  toolTok: ["pickaxe", "hamaxe", "hamdrax", "drax", "picksaw", "chainsaw", "jackhammer", "pwnhammer"],
  otherTool: ["wrench", "wrenches", "paintbrush", "paint roller", "paint scraper", "clentaminator", "ruler", "wire cutter", "wire", "actuation rod", "rod of discord", "magic mirror", "ice mirror", "shovel", "spectre paintbrush", "spectre paint roller", "spectre paint scraper", "dirt rod", "staff of regrowth", "rod of harmony", "portal gun", "paint sprayer"],
  explicitAcc: ["bone helm", "diving helmet", "armor polish", "armor bracing", "jellyfish diving gear", "diving gear", "neptunes shell", "yoyo bag", "yoyo glove", "counterweight", "white string", "black string", "red string", "yellow string", "green string", "blue string", "purple string", "shield of cthulhu", "brain of confusion", "worm scarf", "hive pack", "bone glove", "demon heart", "soaring insignia", "gravity globe", "spore sac", "royal gel", "shiny stone", "magma stone", "sun stone", "moon stone", "celestial stone", "philosophers stone", "ankh charm", "ankh shield", "lucky coin", "discount card", "frozen turtle shell", "celestial shell", "moon shell", "sun shell", "eye of the golem", "obsidian skull", "obsidian rose", "hand warmer", "hercules beetle", "papyrus scarab", "putrid scent", "necromantic scroll", "star veil", "star cloak", "magic cuffs", "celestial cuffs", "mana flower", "fast clock", "mechanical lens", "ivy whip", "masterful? ", "cell phone", "pda", "gps", "depth meter", "compass", "radar", "gold watch", "silver watch", "platinum watch", "tungsten watch", "copper watch", "tin watch", "iron watch", "lead watch", "stopwatch", "sextant", "lifeform analyzer", "dps meter", "metal detector", "tally counter", "fish finder", "weather radio", "goblin tech", "rifle scope", "sniper scope", "red ryder? ", "mechanical glove", "power glove", "fire gauntlet", "titan glove", "feral claws", "climbing claws", "tiger climbing gear", "master ninja gear", "tabi", "black belt", "aglet", "anklet of the wind", "flipper", "frog flipper", "frog gear", "shoe spikes", "lava charm", "obsidian shield", "paladins shield", "ankh shield", "putrid scent", "treasure magnet", "lucky horseshoe", "blindfold", "nazar", "vitamins", "countercurse mantra", "megaphone", "trifold map", "shackle", "medicated bandage", "adhesive bandage", "bundle of balloons", "fart in a jar", "fart in a balloon", "cloud in a bottle", "blizzard in a bottle", "sandstorm in a bottle", "tsunami in a bottle", "frog leg", "eye of horror", "rainbow cursor", "stellar tune", "jewel of light", "pocket mirror", "jetpack", "hoverboard", "web slinger", "skeletron hand", "tendon hook", "slime hook", "fish hook"],
  accTok: ["wings", "boots", "balloon", "balloons", "horseshoe", "ring", "emblem", "charm", "necklace", "pendant", "shield", "band", "glove", "gloves", "gauntlet", "claws", "scarf", "cape", "cloak", "veil", "insignia", "anklet", "scarab", "bandage", "mantra", "cuffs", "pack", "sac", "ankh", "hook"],
  weaponTok: ["sword", "broadsword", "shortsword", "greatsword", "claymore", "blade", "saber", "katana", "scimitar", "cutlass", "rapier", "edge", "bow", "stormbow", "repeater", "gun", "rifle", "shotgun", "pistol", "revolver", "musket", "launcher", "blaster", "cannon", "magnum", "minishark", "megashark", "uzi", "flamethrower", "blowpipe", "blowgun", "boomstick", "staff", "wand", "rod", "tome", "scepter", "spear", "trident", "lance", "pike", "partisan", "glaive", "harpoon", "javelin", "yoyo", "boomerang", "chakram", "flail", "whip", "knife", "knives", "dagger", "shuriken", "mace", "club", "sickle", "scythe", "axe", "hatchet", "bomb", "dynamite", "grenade", "molotov", "bananarang", "excalibur", "muramasa", "starfury", "meowmere", "zenith", "terrarian", "daybreak", "vilethorn", "flamelash", "sunfury", "gladius", "bladetongue", "terragrim", "arkhalis", "seedler", "leaf", "bat", "hammush", "slap", "starlight", "nightglow", "eventide", "kaleidoscope", "prism", "typhoon", "tsunami", "phantasm", "eruption", "wrath", "possession", "terraprisma", "stynger", "orb", "gladius", "handgun", "lights bane", "butcherer"],
  weaponPh: ["spiky ball", "star anise", "lights bane", "blood butcherer", "gladius", "magic missile", "water bolt", "demon scythe", "flower of fire", "light disc", "book of skulls", "cursed flames", "golden shower", "crystal storm", "magnet sphere", "razorblade typhoon", "spirit flame", "lunar flare", "nettle burst", "flower pow", "wasp gun", "venus magnum", "bees knees", "bee keeper", "bee gun", "ball o hurt", "blue moon", "dao of pow", "golem fist", "drippler crippler", "meatball", "light's bane", "lights bane", "blood butcherer", "nights edge", "true nights edge", "true excalibur", "fiery greatsword", "blade of grass", "terra blade", "enchanted sword", "possessed hatchet", "paladins hammer", "bladed glove", "chain knife", "slime staff", "the undertaker", "star cannon", "coin gun", "space gun", "laser rifle", "razorpine", "rainbow gun", "last prism", "sky fracture", "crimson rod", "sdmg", "s.d.m.g.", "tactical shotgun", "sniper rifle", "chain gun", "gatligator", "xenopopper", "vortex beater", "celebration mk2", "celebration", "onyx blaster", "phoenix blaster", "dart pistol", "dart rifle", "heat ray", "staff of earth", "golem fist", "solar eruption", "star wrath", "influx waver", "ice sickle", "death sickle", "frost staff", "thunder zapper", "zapinator", "chlorophyte shotbow", "daedalus stormbow", "shadowflame bow", "hellwing bow", "molten fury", "aerial bane", "tsunami", "piranha gun", "sharkron balloon? ", "toxikarp", "bubble gun", "electric eel", "flairon", "razorblade", "chlorophyte saber", "chlorophyte claymore", "chlorophyte partisan", "orichalcum halberd", "mythril halberd", "titanium trident", "adamantite glaive", "palladium pike", "cobalt naginata", "obsidian swordfish", "swordfish", "north pole", "dark lance", "gungnir", "mushroom spear", "thunder spear", "ballista rod? ", "ice bow", "blizzard staff", "sandgun", "sand gun", "ichor arrow? ", "nimbus rod", "rainbow rod", "poison staff", "venom staff", "inferno fork", "unholy trident", "bat scepter", "ice rod", "lightning aura? ", "flamethrower", "elf melter", "snowman cannon", "stake launcher", "proximity mine launcher", "rocket launcher", "grenade launcher", "firecracker", "snapthorn", "dark harvest", "cool whip", "thorn whip", "durendal", "sanguine staff"],
  summonStaffs: ["slime staff", "finch staff", "flinx staff", "imp staff", "hornet staff", "optic staff", "spider staff", "pirate staff", "pygmy staff", "raven staff", "tempest staff", "xeno staff", "stardust cell staff", "stardust dragon staff", "queen spider staff", "deadly sphere staff", "blade staff", "desert tiger staff", "vampire frog staff", "terraprisma", "abigails flower", "sanguine staff", "rainbow crystal staff", "lunar portal staff", "ravenstaff", "tiger staff", "frost hydra staff", "lightning aura rod", "flameburst rod", "explosive trap rod", "ballista rod", "hoplite staff"],
  yoyoNames: ["rally", "malaise", "artery", "amazon", "code 1", "code 2", "valor", "cascade", "chik", "format:c", "format c", "hel-fire", "hel fire", "amarok", "gradient", "yelets", "reds throw", "valkyrie yoyo", "kraken", "the eye of cthulhu", "terrarian", "wooden yoyo", "yoyo"],
  flailNames: ["ball o hurt", "blue moon", "sunfury", "the meatball", "dao of pow", "flower pow", "golem fist", "drippler crippler", "flail", "mace", "flaming mace", "chain knife"],
  boomNames: ["boomerang", "chakram", "bananarang", "possessed hatchet", "flamarang", "thorn chakram", "light disc", "paladins hammer", "bladed glove", "ice boomerang", "enchanted boomerang"],
  whipNames: ["whip", "firecracker", "snapthorn", "dark harvest", "kaleidoscope", "cool whip", "thorn whip", "durendal", "leather whip", "bone whip"],
  tomeNames: ["tome", "book of skulls", "water bolt", "demon scythe", "cursed flames", "golden shower", "crystal storm", "magnet sphere", "razorblade typhoon", "lunar flare", "spirit flame", "nettle burst"],
  food: ["pie", "cake", "ale", "sake", "smoothie", "sushi", "burger", "taco", "fries", "soup", "salad", "steak", "spaghetti", "sashimi", "pizza", "milkshake", "apple", "banana", "grapes", "lemon", "mango", "peach", "pineapple", "plum", "pomegranate", "cherry", "coconut", "elderberry", "blackcurrant", "rambutan", "apricot", "dragon fruit", "star fruit", "prickly pear", "escargot", "cooked fish", "cooked shrimp", "fried egg", "grub soup", "bloody moscato", "pad thai", "chicken nugget", "roasted bird", "roasted duck", "grilled squirrel", "marshmallow", "cookie", "gingerbread", "candy", "bunny stew", "ice cream", "popcorn", "tea", "juice", "sweet pad? "],
};
// strip the "name? " placeholders and normalise every entry once
for (const k of Object.keys(L)) L[k] = L[k].filter(s => !s.includes("?")).map(_normName);
const _SET = Object.fromEntries(Object.entries(L).map(([k, v]) => [k, new Set(v)]));


const _classCache = new Map();

function classifyItem(name) {
  if (_classCache.has(name)) return _classCache.get(name);
  const res = _classify(name);
  _classCache.set(name, res);
  return res;
}

// The wiki sentence that says what an item IS ("The Nightglow is a Hardmode, post-Plantera magic weapon ...").
// `head` is the part after "is a", cut off before the details, so it is mostly just the item type.
function _tipInfo(raw) {
  const tip = (typeof ITEM_DETAILS !== "undefined" && ITEM_DETAILS && ITEM_DETAILS[raw] && ITEM_DETAILS[raw].tooltip) || "";
  const s1 = tip.split(/(?<=[a-z\)\d])\.\s/)[0].toLowerCase();
  let rest = s1;
  const m = s1.match(/\b(?:is|are)\s+(?:a|an|the|one of the|one of|only|some|also)?\s*(.*)$/);
  if (m) rest = m[1];
  rest = rest.split(/\s(?:that|which|used|purchased|obtained|dropped|sold|crafted|made|found|acquired|available|capable|worn|required|requires|when|with a|can|has|by|from|for|in the|to|and the)\s|[;(]/)[0];
  return { s1, head: rest.trim() };
}

function _classify(rawName) {
  const n = _normName(rawName);
  const tokens = n.split(/[^a-z0-9]+/).filter(Boolean);
  const t = new Set(tokens);
  const ph = p => _ph(n, p);
  const out = (cat, sub) => ({ cat, sub });
  const { s1, head: H } = _tipInfo(rawName);
  const hH = re => re.test(H);
  const hS = re => re.test(s1);

  if (n === "drill containment unit") return out("tool", "drills");

  // ---------- 0. things that are clearly not gear ----------
  const decor = _anyTok(t, ["statue", "painting", "trophy", "banner", "relic", "mannequin", "womannequin", "rack", "pylon", "monolith", "planter", "potted", "poster", "flag"]) || ph("music box") || hH(/decorative item|\bpaintings?\b|racks/) || hS(/\bracks? are\b|\bpainting\b/);
  if (decor) return out("furniture", "decorative");
  if (t.has("potion") || t.has("elixir") || t.has("flask") || ph("bottled honey") || ph("bottled water") || t.has("tonic") || t.has("draught")) {
    if (ph("healing potion")) return out("potion", "healing");
    if (ph("mana potion")) return out("potion", "mana");
    return out("potion", "buff");
  }
  if (t.has("crate") || ph("treasure bag") || ph("goodie bag") || ph("grab bag") || ph("lock box") || t.has("present") || hH(/\bcrates?\b|bag-like|bag item/)) return out("misc", "crates");
  if ((t.has("dye") || t.has("paint")) && !_anyTok(t, ["brush", "sprayer", "roller", "scraper", "paintbrush"])) return out("misc", "dyes");
  if (hH(/\bdye\b/) && !hH(/dye (?:trader|vat)/)) return out("misc", "dyes");
  if (hH(/pet-summoning|light pet|mount-summoning|\bmounts?\b|\bsaddle\b/) || t.has("minecart") || ph("mechanical cart") || ph("mechanical wagon piece") ) {
    if (!hH(/track/)) return out("misc", "pets");
  }
  if (hH(/\bcritters?\b/) || hH(/\b(fish|fishes|bait)\b/) && !hH(/fishing (?:pole|rod)/) || ph("fishing catch") || ph("quest fish")) {
    if (!/pole|rod|hook|rack|banner|trophy|statue|painting|bowl|jar/.test(n)) return out("misc", "critters");
  }
  if (hH(/(?:boss|event)-summoning/)) return out("misc", "summons");
  if (hH(/booster item|power-up|permanent/) && !hH(/accessory|armor/)) return out("misc", "boosters");
  if ((t.has("key") && !hH(/pet-summoning|mount/)) || (t.has("mold") && t.has("key")) || ph("key of night") || ph("key of light")) return out("misc", "keys");

  if (["obsidian", "coal", "fallen star", "holy water", "unholy water", "purification powder", "vile powder", "vicious powder", "geode", "beetle shell", "sunflower", "sunflowers"].includes(n)) return out("material", n.startsWith("sunflower") ? "plants" : "other_material");

  // ---------- 1. TOOLS ----------
  const fishing = (ph("fishing") && _anyTok(t, ["pole", "rod", "hook"])) || ph("mechanics rod") || ph("hotline") || hS(/fishing poles?/);
  const isNet = ph("bug net") && !t.has("cage") && !t.has("jar");
  const isPaladin = ph("paladins hammer");
  const tipTool = hH(/^(?:pickaxe|axe|hammer|drill|chainsaw|tools?|special tools?|unobtainable tools?)\b|\b(?:pickaxe|drill|chainsaw|hammer|axe)\b$/) || hH(/\b(?:pickaxe|drill|chainsaw)\b/) && !hH(/weapon/);
  const toolWord =
    _anyTok(t, L.toolTok) ||
    (t.has("drill") && !t.has("containment") && !hH(/vanity/)) ||
    (t.has("axe") && !ph("battle axe") && !hH(/weapon/)) ||
    (t.has("hammer") && !isPaladin && !hH(/weapon/) && !t.has("hammush")) ||
    _anyPh(n, L.otherTool) || tipTool;
  if (fishing) return out("tool", "fishing");
  if (isNet) return out("tool", "nets");
  if (toolWord && !hH(/\bgolf\b/) && !hS(/golf/)) {
    if ((_anyPh(n, L.multitool) || hH(/pickaxe and axe|axe and pickaxe|hamaxe|pickaxe axe/)) && !(t.has("pickaxe") && !t.has("axe") && !hH(/axe and|and axe/))) return out("tool", "multitools");
    if (t.has("pickaxe") || hH(/\bpickaxe\b/) && !hH(/axe\b.*pickaxe/) ) return out("tool", "pickaxes");
    if (t.has("drill") || hH(/\bdrill\b/)) return out("tool", "drills");
    if (t.has("chainsaw") || hH(/\bchainsaw\b/)) return out("tool", "axes");
    if (t.has("axe") || t.has("waraxe") || t.has("greataxe") || hH(/\baxe\b/)) return out("tool", "axes");
    if (t.has("hammer") || t.has("pwnhammer") || t.has("jackhammer") || hH(/\bhammer\b/)) return out("tool", "hammers");
    return out("tool", "other_tool");
  }

  // ---------- 2. accessories that look like something else ----------
  const explicitAcc = _SET.explicitAcc.has(n) || _anyPh(n, L.explicitAcc);

  // ---------- 3. ARMOR ----------
  const notArmorTip = hH(/furniture|decorative|critter|banner|trophy|painting|statue|\bwall\b|\bblock\b/) || (hH(/accessory/) && !hH(/vanity|armor/));
  if (!explicitAcc && !notArmorTip) {
    const HEAD = ["helmet", "helm", "hat", "hood", "mask", "cap", "headgear", "visor", "headdress", "wig", "goggles", "crown", "tiara", "headband", "bandana", "fez", "beanie", "pith", "bonnet", "turban", "circlet", "halo", "ears", "antlers", "hairpin", "jingasa", "fedora"];
    const CHEST = ["breastplate", "chestplate", "shirt", "chainmail", "scalemail", "robe", "robes", "mail", "suit", "tunic", "jacket", "dress", "vest", "coat", "gown", "longcoat", "torso", "uniform", "kimono", "gi", "bodice", "sweater", "coverings", "cuirass", "overalls", "plate", "garb", "hoodie", "blouse", "apron"];
    const LEGS = ["greaves", "pants", "leggings", "skirt", "shorts", "trousers", "pantaloons", "tights", "loincloth", "heels", "shoes", "slacks", "stockings", "footwear", "geta"];
    let kind = null;
    for (let i = tokens.length - 1; i >= 0 && !kind; i--) {
      const w = tokens[i];
      if (HEAD.includes(w)) kind = "helmets";
      else if (CHEST.includes(w)) kind = "chestplates";
      else if (LEGS.includes(w)) kind = "leggings";
    }
    if (!kind && hH(/armor (?:item|piece|set)|armor$|vanity set|set consisting/)) kind = "chestplates";
    if (kind === "chestplates" && t.has("plate") && (ph("pressure plate") || t.has("platform") || hH(/block|wall/) || ph("copper plating"))) kind = null;
    if (kind && (hH(/vanity|social/) || hS(/vanity/) || !H && !hS(/armor|defense/))) return out("armor", "vanity_armor");
    if (kind && !(kind === "helmets" && _anyTok(t, ["halo", "ears", "antlers", "hairpin"]) && false)) return out("armor", kind);
  }

  // ---------- 5. ACCESSORIES ----------
  const vanityTip = hH(/vanity|developer/) || hS(/vanity item|social/);
  const accWord = explicitAcc || hH(/accessor/) ||
    (_anyTok(t, L.accTok) && !ph("bladed glove") && !ph("fishing hook") && !(t.has("pack") && !t.has("hive") && !t.has("jet")) && !(t.has("sac") && !t.has("spore")) && !hH(/weapon|furniture|critter|block|decorative|wall|chest|flat-surface/) && !hS(/furniture|decorative|background wall|chest/));
  if (accWord) {
    if (vanityTip && !t.has("wings")) return out("accessory", "vanity");
    if (t.has("wings")) return out("accessory", "wings");
    if (t.has("boots")) return out("accessory", "boots");
    if (_anyPh(n, ["balloon", "balloons", "bottle", "fart in a jar", "frog leg", "horseshoe", "bundle of balloons", "jump"])) return out("accessory", "balloons");
    if (t.has("hook") || ph("ivy whip") || ph("grappling") || ph("web slinger") || ph("skeletron hand")) return out("accessory", "hooks");
    if (t.has("shield")) return out("accessory", "shields");
    if (t.has("emblem")) return out("accessory", "emblems");
    if (t.has("charm")) return out("accessory", "charms");
    if (hH(/informational/) || _anyPh(n, ["watch", "stopwatch", "compass", "depth meter", "gps", "cell phone", "pda", "radar", "lifeform analyzer", "dps meter", "metal detector", "tally counter", "sextant", "fish finder", "weather radio", "goblin tech", "fast clock", "shellphone"])) return out("accessory", "info");
    return out("accessory", "other_acc");
  }
  if (vanityTip) return out("accessory", "vanity");
  if (_anyPh(n, ["watch", "stopwatch", "compass", "gps", "radar", "sextant", "depth meter", "metal detector", "lifeform analyzer", "tally counter", "fish finder", "weather radio", "dps meter"]) && !t.has("watchtower")) return out("accessory", "info");

  // ---------- AMMO (before weapons, so "Poison Dart" is not a weapon) ----------
  const gunLike = _anyTok(t, ["pistol", "rifle", "gun", "trap", "launcher", "blaster"]);
  if (t.has("arrow") || t.has("arrows")) return out("ammo", "arrows");
  if (t.has("bullet") || t.has("bullets") || ph("musket ball") || ph("meteor shot")) return out("ammo", "bullets");
  if (/^(?:cluster |wet |lava |honey |dry )?rocket (?:i|ii|iii|iv)$/.test(n) || /^(?:wet|lava|honey|dry) rocket$/.test(n) || ph("mini nuke") || n === "nuke") return out("ammo", "rockets");
  if ((t.has("dart") && !gunLike) || n === "seed" || n === "stynger bolt" || n === "candy corn") return out("ammo", n === "seed" || t.has("dart") ? "darts" : "other_ammo");
  if (["stake", "flare", "blue flare", "cannonball", "nanite", "nanites", "nail", "explosive jack o lantern", "endless quiver", "endless musket pouch"].includes(n) || (t.has("flare") && !gunLike) || hH(/ammunition|solution/)) return out("ammo", "other_ammo");
  if (_anyPh(n, ["copper coin", "silver coin", "gold coin", "platinum coin"]) && !t.has("ring") && !t.has("gun")) return out("misc", "other_misc");

  if (ph("spear trap") || ph("spiky ball trap") || ph("flame trap") || ph("gas trap")) return out("misc", "mechanisms");

  // ---------- 6. WEAPONS (the wiki must say it is a weapon, so "Sword Rack" or "Golf Club" are not) ----------
  const tipWeapon = hH(/weapon|sword|blade|\bbows?\b|repeater|\bguns?\b|launcher|staff|staves|wands?\b|spears?\b|yoyos?|boomerangs?|flails?|whips?|tome|spell ?book|knife|knives|explosive|javelin|\brods?\b|cannon|rifle|pistol|shotgun|scepter|claymore|saber|glaive|lance|trident|flamethrower|bomb|grenade|dagger|shuriken|chakram|\bdarts?\b|katana|scythe|sickle|mace\b|club\b|blowpipe|musket|rocket|minishark|megashark/) &&
                    !hH(/ammunition|\barrow\b|bullet|pet-summoning|\bgolf\b|furniture/);
  const nameWeapon = _anyTok(t, L.weaponTok) || _anyPh(n, L.weaponPh) || _anyPh(n, L.yoyoNames) || _anyPh(n, L.flailNames) || _anyPh(n, L.boomNames);
  // when the wiki sentence is missing or odd, fall back to the name only for words that are never anything but weapons
  const strongName = _anyTok(t, ["sword", "broadsword", "shortsword", "greatsword", "claymore", "saber", "katana", "scimitar", "cutlass", "rapier", "repeater", "shotgun", "pistol", "revolver", "musket", "launcher", "staff", "wand", "tome", "spear", "trident", "glaive", "yoyo", "boomerang", "chakram", "flail", "whip", "dagger", "shuriken"]);
  const weaponWord = tipWeapon || (!s1 && nameWeapon) || (strongName && !hH(/furniture|decorative|block|wall|critter|mount|pet|vanity|golf|tool|accessory|armor/) && !s1.includes("furniture"));
  const notWeapon = n === "bone" || n === "candy corn" || ph("sword statue") || t.has("flag") || ph("cat sword");
  const ammoLike = ph("musket ball") || ph("bullet") || (t.has("arrow") || t.has("arrows")) && !t.has("bow") || hH(/ammunition/);
  if (weaponWord && !notWeapon && !ammoLike) {
    const has = list => _anyPh(n, list);
    // the wiki's own word for the weapon type wins over anything guessed from the name
    const WT = [[/shortswords?\b/, "shortswords"], [/broadswords?\b/, "broadswords"], [/boomerangs?\b/, "boomerangs"], [/yoyos?\b/, "yoyos"], [/flails?\b/, "flails"], [/\bwhips?\b/, "whips"], [/summon weapons?/, "summon_minions"], [/repeaters?\b/, "repeaters"], [/\bspears?\b/, "spears"], [/\bbows?\b/, "bows"], [/launchers?\b/, "launchers"], [/\bguns?\b/, "guns"], [/\bwands?\b/, "wands"], [/spell ?books?|\btomes?\b/, "tomes"]];
    for (const [re, sub] of WT) if (hH(re)) return out("weapon", sub);
    if (t.has("shortsword") || t.has("rapier") || ph("gladius") || hH(/shortsword/)) return out("weapon", "shortswords");
    if (has(L.yoyoNames) || hH(/yoyo/)) return out("weapon", "yoyos");
    if ((has(L.whipNames) && !ph("ivy whip")) || hH(/\bwhip/)) return out("weapon", "whips");
    if (has(L.boomNames) || hH(/boomerang/)) return out("weapon", "boomerangs");
    if (has(L.flailNames) || hH(/\bflail/)) return out("weapon", "flails");
    if (has(L.summonStaffs) || hH(/summon/)) return out("weapon", "summon_minions");
    if (has(L.tomeNames) || hH(/tome|spell ?book/)) return out("weapon", "tomes");
    if (t.has("wand") || hH(/\bwand/)) return out("weapon", "wands");
    if (t.has("rod") || hH(/\brod\b/)) return out("weapon", "rods");
    if (_anyTok(t, ["spear", "lance", "trident", "pike", "partisan", "glaive", "harpoon", "javelin", "swordfish", "naginata", "halberd", "gungnir"]) || ph("dark lance") || ph("north pole") || hH(/\bspears?\b|\bpolearm/)) return out("weapon", "spears");
    if (_anyTok(t, ["launcher", "cannon", "stynger"]) || ph("rocket launcher") || ph("celebration mk2") || ph("celebration") || hH(/launcher|cannon/)) return out("weapon", "launchers");
    if (t.has("repeater") || hH(/repeater/)) return out("weapon", "repeaters");
    if (t.has("bow") || t.has("stormbow") || hH(/\bbow\b/) || ph("tsunami") || ph("phantasm") || ph("aerial bane") || ph("molten fury") || ph("shotbow")) return out("weapon", "bows");
    if (_anyTok(t, ["gun", "pistol", "rifle", "shotgun", "musket", "revolver", "blaster", "magnum", "minishark", "megashark", "uzi", "flamethrower", "blowpipe", "blowgun", "boomstick", "sdmg", "gatligator", "xenopopper", "toxikarp", "handgun"]) || ph("the undertaker") || ph("vortex beater") || ph("heat ray") || ph("laser rifle") || hH(/\bguns?\b|rifle|pistol|shotgun/)) return out("weapon", "guns");
    if (_anyTok(t, ["staff", "scepter", "orb"]) || ph("magic missile") || ph("flower of fire") || ph("flamelash") || ph("vilethorn") || ph("last prism") || ph("sky fracture") || ph("razorpine") || hH(/magic weapon|\bstaff|scepter/)) return out("weapon", "other_magic");
    if (_anyTok(t, ["knife", "knives", "dagger", "shuriken", "bomb", "dynamite", "grenade", "molotov"]) || ph("spiky ball") || ph("star anise") || hH(/explosive|thrown|knife|knives|ranged weapon/)) return out("weapon", "thrown");
    if (_anyTok(t, ["sword", "broadsword", "greatsword", "claymore", "blade", "saber", "katana", "scimitar", "cutlass", "edge", "mace", "sickle", "scythe", "hatchet", "phaseblade", "phasesaber"]) || has(["excalibur", "muramasa", "starfury", "meowmere", "zenith", "daybreak", "terragrim", "arkhalis", "bladetongue", "slap hand", "seedler", "lights bane", "blood butcherer", "terra blade", "starlight", "nightglow", "eventide", "solar eruption", "star wrath", "influx waver"]) || hH(/broadsword|sword/)) return out("weapon", "broadswords");
    return out("weapon", "other_weapon");
  }

  // ---------- FISH & BAIT by name ----------
  if (/(fish|koi|trout|tuna|jellyfish|shrimp|tetra|minnow|carp|flounder|seahorse|oyster|lobster|bait|bass|salmon|cod|snapper|piranha|nightcrawler|starfish|fungifin|barracuda|manowar|scabbardfish|hellfish|flinxfin|plankton|wyverntail|old shoe|tin can)$/.test(n) && !hH(/furniture|decorative|weapon|armor|accessory/)) return out("misc", "critters");

  if (t.has("fountain")) return out("furniture", "other_furniture");
  // ---------- 8. WIRING, TRAPS ----------
  if (_anyTok(t, ["plate", "timer", "pump", "switch", "lever", "teleporter", "actuator", "trap", "wire", "wires", "mine", "sensor", "detector"]) && !hH(/\bblock\b|\bwall\b/) || ph("pressure plate") || ph("logic gate") || hH(/mechanism|\btrap\b|activation/) || (t.has("spike") ) || ph("wooden spike") || ph("land mine") || ph("explosives")) {
    return out("misc", "mechanisms");
  }

  // ---------- 9. WALLS, PLATFORMS, BLOCKS ----------
  if (ph("stained glass")) return out("block", "glass");
  if (t.has("wallpaper") || t.has("wall") || t.has("walls") || t.has("platform") || t.has("fence") || hH(/background wall|\bwalls?\b|platform|safe wall|wallpaper/)) return out("block", "other_block");
  const woods = new Set(["wood", "boreal wood", "palm wood", "rich mahogany", "ebonwood", "shadewood", "pearlwood", "spooky wood", "ash wood", "dynasty wood", "living wood", "bamboo"]);
  if (woods.has(n)) return out("block", "wood");
  const furnTip = hH(/furniture|light source|storage|crafting station|flat-surface|chest|decorative|mechanical item/);
  if (t.has("glass") && !furnTip || ph("stained glass")) return out("block", "glass");
  if (t.has("block") || t.has("blocks") || t.has("stucco") || t.has("shingles") || t.has("plating") || t.has("slab")) return out("block", t.has("brick") ? "bricks" : "natural");
  if (!furnTip) {
    if (t.has("brick") || t.has("bricks") || t.has("shingles") || t.has("stucco") || hH(/\bbrick/)) return out("block", "bricks");
    if (t.has("block") || hH(/\bblocks?\b|type of block|\bbeam\b/) || _anyTok(t, ["sandstone", "hardened"])) return out("block", "natural");
  }

  // ---------- 10. FOOD ----------
  if (_anyPh(n, L.food) || ph("bowl of soup") || hH(/\bfood\b|\bdrink\b|beverage/)) return out("potion", "food");

  // ---------- 11. FURNITURE ----------
  const stations = ["work bench", "heavy work bench", "anvil", "mythril anvil", "orichalcum anvil", "adamantite forge", "titanium forge", "furnace", "hellforge", "loom", "sawmill", "tinkerers workshop", "imbuing station", "dye vat", "kiln", "glass kiln", "cooking pot", "cauldron", "alchemy table", "bottle", "solidifier", "extractinator", "ancient manipulator", "autohammer", "lihzahrd furnace", "keg", "blend-o-matic", "blend o matic", "meat grinder", "flesh cloning vat", "steampunk boiler", "bone welder", "living loom", "sky mill", "ice machine", "honey dispenser", "crystal ball", "campfire", "bonfire", "fireplace"].map(_normName);
  const storage = ["chest", "piggy bank", "safe", "barrel", "trash can", "void vault", "defenders forge", "dresser", "bookcase", "wardrobe", "trough"];
  const lighting = ["torch", "lantern", "candle", "chandelier", "lamp", "candelabra", "lamppost", "lava lamp", "tiki torch", "glowstick", "light", "lights", "sconce", "bulb", "garland"];
  const comfort = ["chair", "bed", "bench", "sofa", "couch", "throne", "toilet", "bathtub", "bath", "stool"];
  const otherFurn = ["door", "table", "clock", "piano", "sink", "mirror", "sign", "fountain", "cage", "bowl", "bookshelf", "workshop", "vase", "shelf", "gate", "rope", "cup", "chain", "pot", "dishes", "chalice", "jar", "terrarium", "tombstone", "gravestone", "headstone", "obelisk", "cross"];
  if ((_anyPh(n, stations) && !ph("work bench")) || ph("work bench") || ph("heavy work bench") || hH(/crafting station/)) return out("furniture", "crafting");
  if (_anyTok(t, storage) || ph("piggy bank") || ph("trash can") || ph("void vault") || hH(/storage/)) return out("furniture", "storage");
  if (_anyTok(t, lighting) || hH(/light source/)) return out("furniture", "lighting");
  if (_anyTok(t, comfort)) return out("furniture", "comfort");
  if (hH(/furniture|decorative/) || s1.includes("furniture") || _anyTok(t, otherFurn)) return out("furniture", "other_furniture");

  // ---------- 12. MATERIALS ----------
  if (t.has("ore") || n === "hellstone" || n === "luminite" || n === "meteorite") return out("material", "ores");
  if (t.has("bar") && !t.has("crowbar") || hH(/\bbars?\b/)) return out("material", "bars");
  if (_anyTok(t, ["amethyst", "topaz", "sapphire", "emerald", "ruby", "diamond", "amber"]) && !hH(/furniture|gemspark|staff|robe|hook|block|wall/) || hH(/\bgems?\b|items designed/)) return out("material", "gems");
  if (t.has("soul") && t.has("of")) return out("material", "souls");
  if (_anyTok(t, ["daybloom", "moonglow", "blinkroot", "deathweed", "waterleaf", "fireblossom", "shiverthorn", "seeds", "seed", "mushroom", "vine", "herb", "acorn", "acorns", "moss", "grass"]) || hH(/\bseeds?\b|herbs?\b|grass-like plant|type of plant/)) return out("material", "plants");
  if (hH(/material/) || hS(/crafting|craft /)) return out("material", "other_material");
  return out("misc", "other_misc");
}

function detectCategory(itemName) {
  return classifyItem(itemName).cat;
}

function getItemSubcategory(item, mainCategory) {
  const c = classifyItem(item.name);
  return c.cat === mainCategory ? c.sub : null;
}

// ============================================================
// Broken-picture rescue. Some wiki items are animated (.gif) or have "(item)" in the file name, so the
// first guess can fail. Any <img> that fails to load tries the other spellings before giving up.
// ============================================================
const NO_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect x="3" y="3" width="34" height="34" rx="6" fill="#8884" stroke="#8886"/><text x="20" y="27" font-size="20" font-family="sans-serif" text-anchor="middle" fill="#888">?</text></svg>');

document.addEventListener("error", (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (img.dataset.fallbacks !== undefined) return;            // those already have their own fallback list
  if (img.dataset.dead) return;
  const name = (img.alt || "").trim();
  if (!name || name.length > 60) return;
  if (!img.dataset.rescue) {
    const bases = [...new Set([name.replace(/ /g, "_"), name.replace(/\//g, "-").replace(/ /g, "_"), name.replace(/\//g, "_").replace(/ /g, "_"), name.replace(/\//g, "").replace(/ /g, "_")])];
    const list = [];
    for (const base of bases) {
      const enc = encodeURIComponent(base).replace(/%27/g, "'");
      list.push(`https://terraria.wiki.gg/images/${enc}.png`, `https://terraria.wiki.gg/images/${enc}.gif`, `https://terraria.wiki.gg/images/${enc}_(item).png`, `https://terraria.wiki.gg/images/${enc}_(item).gif`, `https://terraria.wiki.gg/images/${enc}_(placed).png`);
    }
    img.dataset.rescue = JSON.stringify([...new Set(list)].filter(u => u !== img.src));
  }
  let rest = [];
  try { rest = JSON.parse(img.dataset.rescue); } catch (err) {}
  if (!rest.length) {
    // nothing worked: show a plain "?" tile instead of a broken picture with its text
    if (!img.dataset.dead) { img.dataset.dead = "1"; img.src = NO_IMAGE; }
    return;
  }
  img.referrerPolicy = "no-referrer";
  img.src = rest.shift();
  img.dataset.rescue = JSON.stringify(rest);
}, true);

function debounce(fn, delay = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

async function loadItems() {
  const res = await fetch("./data/items.json");
  if (!res.ok) throw new Error("Failed to load data/items.json");
  return fixItemImages(await res.json());
}

// Some items have the wrong picture (another page's image, or an unrelated animation).
// A real sprite file is named after its item, so any wiki.gg image whose file name doesn't match the item
// name is replaced with the standard sprite file for that item.
// the four Strange Plants (by item ID) each get their own colored picture
const OWN_IMAGES = { 3385: "data/img/strange_plant_purple.png", 3386: "data/img/strange_plant_orange.png", 3387: "data/img/strange_plant_green.png", 3388: "data/img/strange_plant_red.png" };

// items listed as "n/a (No official name)" in the data, renamed by item ID
const NAME_FIXES = { 4722: "First Fractal", 5013: "SleepingIcon" };
const FIXED_IMAGES = { 4722: "First Fractal" };   // these load their picture from the wiki under the new name

function fixItemImages(list) {
  for (const it of list) {
    if (NAME_FIXES[it.id]) it.name = NAME_FIXES[it.id];
    if (FIXED_IMAGES[it.id]) it.img = wikiImgUrl(FIXED_IMAGES[it.id], "png");
  }
  for (const it of list) if (OWN_IMAGES[it.id]) it.img = OWN_IMAGES[it.id];
  const norm = s => s.toLowerCase().replace(/[_\s]+/g, " ").trim();
  for (const it of list) {
    const m = /^https?:\/\/terraria\.wiki\.gg\/images\/(?:thumb\/)?(?:[0-9a-f]\/[0-9a-f]{2}\/)?([^\/?]+)/.exec(it.img || "");
    if (!m) continue;
    let file;
    try { file = decodeURIComponent(m[1]); } catch { continue; }
    const base = norm(file.replace(/\.[a-z0-9]+$/i, "").replace(/_?\((?:item|placed|equipped)\)$/i, ""));
    if (base !== norm(it.name)) it.img = wikiImgUrl(it.name);
  }
  list.sort((p, q) => p.id - q.id);   // items added later are stored at the end of the file; show everything in ID order
  return list;
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

  // Add "Any ..." helper items that appear in recipes but are not standalone items
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

function renderItems(list, append = false) {
  const el = document.getElementById("results");
  if (!append) el.innerHTML = "";

  if (!list.length) {
    if (!append) el.textContent = "No matches.";
    return;
  }

  for (const item of list) {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.referrerPolicy = "no-referrer";   // must be set before src or the request leaks a referrer and gets blocked
    // "Any" items use an animated cycling GIF
    if (item.name && (item.name.startsWith("Any ") || item.name === "Any Wood" || item.name === "Any Sand" || item.name === "Any Iron Bar" || item.name === "Any Balloon")) {
      img.src = item.img;
      img.style.imageRendering = "auto"; // smooth rendering for the animated GIF
    } else {
      img.src = item.img;
      img.style.imageRendering = "pixelated";
    }
    img.alt = item.name;
    img.loading = "lazy";
    img.decoding = "async";
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
  const resultsEl = document.getElementById("results");
  if (resultsEl) resultsEl.scrollTop = 0;
  renderItems(FILTERED.slice(0, visibleCount));
  updateCategoryCounts();
  fillScreenIfNeeded();
}

function loadMoreIfNeeded() {
  const container = document.getElementById("results");
  if (!container) return;

  const nearBottom =
    container.scrollTop + container.clientHeight >=
    container.scrollHeight - 300;

  if (!nearBottom) return;

  if (visibleCount < FILTERED.length) {
    const prevCount = visibleCount;
    visibleCount = Math.min(
      visibleCount + PAGE_SIZE,
      FILTERED.length
    );
    // only add the NEW cards instead of rebuilding the whole grid
    renderItems(FILTERED.slice(prevCount, visibleCount), true);
    fillScreenIfNeeded();
  }
}

// Keep loading until the grid overflows the container (no scrollbar = no scroll event, e.g. 4K)
function fillScreenIfNeeded() {
  const container = document.getElementById("results");
  if (!container) return;
  requestAnimationFrame(() => {
    if (
      visibleCount < FILTERED.length &&
      container.scrollHeight <= container.clientHeight + 300
    ) {
      loadMoreIfNeeded();
    }
  });
}

let selectedItem = null;

function openChoiceModal(item) {
  selectedItem = item;

  document.getElementById("modalTitle").textContent = item.name;

  const mImg = document.getElementById("modalImg");
  mImg.referrerPolicy = "no-referrer";
  mImg.src = item.img;
  mImg.alt = item.name;
  mImg.referrerPolicy = "no-referrer";

  // "Any" items are animated GIFs, so use smooth rendering
  if (item.name && (item.name.startsWith("Any ") || item.name === "Any Wood" || item.name === "Any Sand" || item.name === "Any Iron Bar" || item.name === "Any Balloon")) {
    mImg.style.imageRendering = "auto";
  } else {
    mImg.style.imageRendering = "pixelated";
  }

  // Modal info button click handler
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
  USES_TREE_STATE.rootCollapsed = false;
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
    d.classList.add("treeGroup");

    const icon = document.createElement("span");
    icon.textContent = USES_TREE_STATE.expandedNodes.has(node.id) ? "📂" : "📁";
    icon.style.fontSize = "24px";

    const text = document.createElement("div");
    text.innerHTML = `
      <div style="font-weight:800">${node.name}</div>
      <div class="treeSub">${node.items.length} items</div>
    `;

    d.appendChild(icon);
    d.appendChild(text);

    // same + / minus marker the item cards have, so it is clear the folder opens and closes
    const gOpen = USES_TREE_STATE.expandedNodes.has(node.id);
    const gIcon = document.createElement("div");
    gIcon.className = "treeToggle";
    gIcon.textContent = gOpen ? "\u2212" : "+";
    d.appendChild(gIcon);
    d.title = gOpen ? "Click to close" : "Click to open";

    d.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleGroupNode(node.id);
    });
  } else if (node.type === 'loadmore') {
    d.classList.add("treeLoadMore");

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
    img.referrerPolicy = "no-referrer";
    // "Any" items use an animated cycling GIF
    if (node.name && (node.name.startsWith("Any ") || node.name === "Any Wood" || node.name === "Any Sand" || node.name === "Any Iron Bar" || node.name === "Any Balloon")) {
      const anyItem = ITEM_BY_NAME[node.name];
      img.src = anyItem?.img || "";
      img.style.imageRendering = "auto"; // smooth rendering for the animated GIF
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
        expandIcon.style.bottom = "3px";   // sits under the info icon with a gap, not right against it
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
    if (node.depth === 0) USES_TREE_STATE.rootCollapsed = true;   // the top item can be closed too
  } else {
    USES_TREE_STATE.expandedNodes.add(nodeId);
    if (node.depth === 0) USES_TREE_STATE.rootCollapsed = false;
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

  if (!USES_TREE_STATE.rootCollapsed) USES_TREE_STATE.expandedNodes.add(newRootNode.id);
  else USES_TREE_STATE.expandedNodes.delete(newRootNode.id);

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

function zoomAt(clientX, clientY, newZoom) {
  const viewport = document.getElementById("treeViewport");
  const rect = viewport.getBoundingClientRect();
  newZoom = Math.max(0.1, Math.min(3, newZoom));
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const worldX = (mx - panX) / zoomLevel;
  const worldY = (my - panY) / zoomLevel;
  panX = mx - worldX * newZoom;
  panY = my - worldY * newZoom;
  zoomLevel = newZoom;
}

function setupPanning() {
  const viewport = document.getElementById("treeViewport");
  const pointers = new Map();
  let moved = false;
  let downX = 0, downY = 0;
  let lastDist = 0, lastMidX = 0, lastMidY = 0;

  const getPinch = () => {
    const [a, b] = [...pointers.values()];
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2
    };
  };

  viewport.addEventListener("pointerdown", (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      isPanning = true;
      moved = false;
      downX = e.clientX;
      downY = e.clientY;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    } else if (pointers.size === 2) {
      isPanning = false;
      moved = true; // never treat a pinch as a tap
      const p = getPinch();
      lastDist = p.dist; lastMidX = p.midX; lastMidY = p.midY;
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2) {
      const p = getPinch();
      if (lastDist > 0) {
        panX += p.midX - lastMidX;
        panY += p.midY - lastMidY;
        zoomAt(p.midX, p.midY, zoomLevel * (p.dist / lastDist));
      }
      lastDist = p.dist; lastMidX = p.midX; lastMidY = p.midY;
      setWorldTransform();
      return;
    }

    if (!isPanning) return;
    if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) {
      moved = true;
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    }
    if (moved) {
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      setWorldTransform();
    }
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 1) {
      // went from pinch back to one finger: continue panning smoothly
      const p = [...pointers.values()][0];
      isPanning = true;
      startX = p.x - panX;
      startY = p.y - panY;
    } else if (pointers.size === 0) {
      isPanning = false;
    }
  };
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, zoomLevel * (e.deltaY > 0 ? 0.9 : 1.1));
    setWorldTransform();
  }, { passive: false });
}

function setupMobileDrawer() {
  const sidebar = document.querySelector(".category-sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const open = () => { sidebar.classList.add("open"); backdrop.classList.add("open"); };
  const close = () => { sidebar.classList.remove("open"); backdrop.classList.remove("open"); };

  document.getElementById("btnCategories").addEventListener("click", open);
  backdrop.addEventListener("click", close);

  // close the drawer after picking "All Items" or a subcategory
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest(".cat-sub-item") || e.target.closest('.cat-item[data-category="all"]')) close();
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

  // Check whether the tree contains recipes with both Crimson and Corruption alternatives
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

        // If this recipe has both, show the legend
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

  // Show the legend only if a recipe has both alternatives (pick one)
  if (showLegend) {
    legend.style.display = "flex";
  } else {
    legend.style.display = "none";
  }
}

// "Platform -> raw material" un-crafting (e.g. Mushroom Platform -> Glowing Mushroom) is not a real way to make the item
function isPlatformReverse(r, out) {
  const ing = r && r.ingredients;
  if (!ing || ing.length !== 1) return false;
  return ing[0].item.includes("Platform") && !String(out).includes("Platform");
}

function autoExpandAllCraftNodes(itemName, seen, isRoot = false) {
  if (seen.has(itemName)) return;
  seen.add(itemName);

  CRAFT_EXPANDED.add(itemName);

  const recipeVariants = RECIPES[itemName];
  if (!recipeVariants || !recipeVariants.length) return;

  const conversionStations = ["Shimmer", "Chlorophyte Extractinator", "Extractinator"];

  let properRecipes;
  // Special case: for root ores, only use conversion recipes
  if (isRoot && itemName.includes("Ore") && !itemName.includes("Meteorite")) {
    properRecipes = recipeVariants.filter(r => {
        if (isPlatformReverse(r, itemName)) return false;
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
        if (isPlatformReverse(r, itemName)) return false;
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
        if (isPlatformReverse(r, itemName)) return false;
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

  // Use colored lines for Crimson/Corruption alternatives only when the parent recipe has both
  let lineColor = "#333";
  let lineWidth = "3";

  if (color) {
    lineColor = color;
    lineWidth = "4";
  } else if (itemName && parentItemName) {
    // Check whether the parent recipe contains both Crimson and Corruption alternatives
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

      // Only color if the parent has both alternatives (meaning pick one)
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
  img.referrerPolicy = "no-referrer";
  // "Any" items use an animated cycling GIF
  if (label && (label.startsWith("Any ") || label === "Any Wood" || label === "Any Sand" || label === "Any Iron Bar" || label === "Any Balloon")) {
    const anyItem = ITEM_BY_NAME[label.replace(/ x\d+$/, '')];
    img.src = anyItem?.img || "";
    img.style.imageRendering = "auto"; // smooth rendering for the animated GIF
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
        if (isPlatformReverse(r, itemName)) return false;
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
      expandIcon.style.bottom = "3px";   // under the info icon with a clear gap
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
      // Special case: for ores at root level, only show conversion recipes
      if (name.includes("Ore") && !name.includes("Meteorite")) {
        properRecipes = recipeVariants.filter(r => {
        if (isPlatformReverse(r, name)) return false;
          // Only include conversion station recipes for ores
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
        if (isPlatformReverse(r, name)) return false;
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
        // Root: only filter reverse wall conversions and reverse crafting
        properRecipes = recipeVariants.filter(r => {
        if (isPlatformReverse(r, name)) return false;
          // Filter reverse wall conversions (Wall → Block, not Block → Wall)
          // Block → Wall is normal crafting and is allowed
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
      // Ingredient: filter extractinator, uncommon stations and reverse wall recipes
      properRecipes = recipeVariants.filter(r => {
        if (isPlatformReverse(r, name)) return false;
        // Filter reverse wall conversions only (Wall → Block, not Block → Wall)
        if (r.station && r.station.includes("Work Bench") && r.ingredients && r.ingredients.length === 1) {
          const ingredient = r.ingredients[0].item;
          const output = name;
          // Only filter if ingredient has "Wall" but output doesn't (reverse crafting)
          const isReverseWallConversion = (ingredient.includes("Wall") && !output.includes("Wall"));
          if (isReverseWallConversion) return false;
        }

        // Filter conversion stations
        if (conversionStations.some(s => r.station && r.station.includes(s))) return false;

        // Filter uncommon stations
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
        if (isPlatformReverse(r, name)) return false;
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
        if (isPlatformReverse(r, name)) return false;
          if (conversionStations.some(s => r.station && r.station.includes(s))) {
            return false;
          }
          return true;
        });
      }
    } else {
      // For non-root items (ingredients), filter out conversion stations and reverse wall conversions
      properRecipes = RECIPES[name].filter(r => {
        if (isPlatformReverse(r, name)) return false;
        // Filter conversion stations
        if (conversionStations.some(s => r.station && r.station.includes(s))) {
          return false;
        }

        // Filter reverse wall conversions only (Wall → Block, e.g., Obsidian Wall -> Obsidian)
        // Block → Wall is normal crafting and is allowed
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

    // Only show a station if there are valid recipes and the first recipe has one
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


// ============================================================
// TERRARIA ICONS: real item / NPC pictures instead of emojis
// ============================================================
const MENU_ICONS = {
  "Ores & Bars": "Gold Bar", "Bosses": "Suspicious Looking Eye", "Armor": "Iron Chainmail",
  "Pickaxes": "Iron Pickaxe", "Events": "Goblin Battle Standard",
  "NPCs": "Guide", "Classes": "Night's Edge", "Crimson vs Corruption": "Crimtane Bar",
  "Pre-Hardmode NPCs": "Guide", "Hardmode NPCs": "Wizard", "Visitors & Others": "Traveling Merchant", "Town Pets": "Town Cat",
  "Melee": "Night's Edge", "Ranged": "Minishark", "Mage": "Water Bolt", "Summoner": "Slime Staff",
};

function iconCandidates(name) {
  return [...new Set([
    ITEM_BY_NAME[name]?.img,
    NPC_BY_NAME[name]?.img,
    wikiImgUrl(name, "png"),
    wikiImgUrl(name, "gif"),
  ].filter(Boolean))];
}

// Puts a picture into `host`. The old emoji / text stays until the picture has loaded, so nothing ever looks empty.
function loadIconInto(host, name, cls) {
  if (!host || !name) return;
  const old = host.querySelector("img.tr-icon");
  if (old) old.remove();
  const img = document.createElement("img");
  img.className = "tr-icon" + (cls ? " " + cls : "");
  img.alt = "";
  img.loading = "lazy";
  img.style.display = "none";
  // hide the emoji right away (no flicker); put it back only if no picture could be loaded
  const saved = [];
  for (const n of [...host.childNodes]) if (n.nodeType === 3 && n.textContent.trim()) { saved.push([n, n.textContent]); n.textContent = ""; }
  img.addEventListener("load", () => {
    img.style.display = "";
    host.classList.add("has-img");
  });
  setImgWithFallbacks(img, iconCandidates(name));
  const origErr = img.onerror;
  img.onerror = () => { origErr(); if (img.style.display === "none") { for (const [n, t] of saved) n.textContent = t; host.classList.add("icon-failed"); } };
  host.appendChild(img);
}

function applyCategoryIcons() {
  const allIcon = document.querySelector('.cat-item[data-category="all"] .cat-icon');
  loadIconInto(allIcon, "Chest");
  for (const [catKey, catData] of Object.entries(SUBCATEGORIES)) {
    const el = document.querySelector(`.cat-item[data-category="${catKey}"] .cat-icon`);
    loadIconInto(el, catData.icon);
  }
}

// Opens / closes the list of subcategories under a main category in the sidebar
function toggleSubcategories(category) {
  const subsDiv = document.getElementById(`subs-${category}`);
  const catItem = document.querySelector(`[data-category="${category}"]`);
  if (!subsDiv) return;
  const open = subsDiv.style.display === "none" || !subsDiv.style.display;
  subsDiv.style.display = open ? "block" : "none";
  if (catItem) catItem.classList.toggle("expanded", open);
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
      <span class="cat-sub-icon"></span>
      <span class="cat-sub-name">All ${catData.name}</span>
      <span class="cat-sub-count" id="count-${catKey}-all">0</span>
    `;
    subsDiv.appendChild(allDiv);
    loadIconInto(allDiv.querySelector(".cat-sub-icon"), catData.icon);

    // Add each subcategory
    for (const [subKey, subData] of Object.entries(catData.subs)) {
      const subDiv = document.createElement("div");
      subDiv.className = "cat-sub-item";
      subDiv.dataset.subcategory = `${catKey}-${subKey}`;
      subDiv.onclick = () => selectSubcategory(catKey, subKey);
      subDiv.innerHTML = `
        <span class="cat-sub-icon"></span>
        <span class="cat-sub-name">${subData.name}</span>
        <span class="cat-sub-count" id="count-${catKey}-${subKey}">0</span>
      `;
      subsDiv.appendChild(subDiv);
      loadIconInto(subDiv.querySelector(".cat-sub-icon"), subData.icon);
    }
  }
  applyCategoryIcons();
}

function updateCategoryCounts() {
  // Counts only depend on ITEMS, so skip the work if already done
  if (updateCategoryCounts._doneFor === ITEMS.length) return;
  updateCategoryCounts._doneFor = ITEMS.length;

  // Count items in each main category
  const catCounts = { all: ITEMS.filter(it => it.id >= 0).length };   // the "Any ..." helper entries are not real items
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
  STATION_IMAGES["Heavy Work Bench"] = HEAVY_BENCH_IMG[0];
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

  window.addEventListener("resize", debounce(fillScreenIfNeeded, 150));

  document.getElementById("btnSettings").addEventListener("click", openSettingsModal);
  document.getElementById("btnAbout").addEventListener("click", () => openAboutModal("guide"));
  maybeShowIntro();

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
  document.getElementById("btnEvil").addEventListener("click", openEvil);
  setupEvilButton();
  document.getElementById("btnGuide").addEventListener("click", openGuide);
  loadIconInto(document.querySelector("#btnGuide .btn-ico"), "Compass");
  loadIconInto(document.querySelector("#btnTimeline .btn-ico"), "Platinum Watch");
  loadIconInto(document.querySelector("#btnAbout .btn-ico"), "Life Crystal");
  loadIconInto(document.querySelector("#btnSettings .btn-ico"), "Mana Crystal");
  document.getElementById("timelineBack").addEventListener("click", timelineGoBack);

  setupPanning();
  setupMobileDrawer();

  applyFilter();
  if (window.matchMedia("(hover: hover)").matches) qEl.focus();
}

const TIMELINE_ORES = [
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

// ============================================================
// TIMELINES: add a new timeline by adding data here + a menu entry below
// stage classes available: stage-prehardmode, stage-hardmode, stage-plantera, stage-golem, stage-moonlord
// item fields: name, type, img (optional), milestone (optional), search (optional grid search term)
// ============================================================
const TIMELINES = {
  ores: TIMELINE_ORES,

  bosses: [
    {
      stage: "Pre-Hardmode", class: "stage-prehardmode",
      description: "Bosses available from the start of the game",
      items: [
        { name: "King Slime", type: "Boss (Optional)", img: "" },
        { name: "Dark Mage", type: "Event Boss", img: "", milestone: "Old One's Army, tiers 1 and 2" },
        { name: "Eye of Cthulhu", type: "Boss", img: "" },
        { name: "Eater of Worlds", type: "Boss (Alt)", img: "" },
        { name: "Brain of Cthulhu", type: "Boss (Alt)", img: "" },
        { name: "Queen Bee", type: "Boss", img: "" },
        { name: "Skeletron", type: "Boss", img: "" },
        { name: "Deerclops", type: "Boss", img: "https://terraria.wiki.gg/images/Deerclops.gif" }, // not in npc.json, URL guessed from wiki pattern
        { name: "Wall of Flesh", type: "Boss", img: "", milestone: "Starts Hardmode" },
      ]
    },
    {
      stage: "Hardmode", class: "stage-hardmode",
      description: "Unlocked after defeating Wall of Flesh",
      milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
      items: [
        { name: "Queen Slime", type: "Boss", img: "" },
        { name: "The Twins", type: "Boss (Mech)", img: "" },
        { name: "The Destroyer", type: "Boss (Mech)", img: "" },
        { name: "Skeletron Prime", type: "Boss (Mech)", img: "" },
        { name: "Duke Fishron", type: "Boss (Optional)", img: "" },
        { name: "Dreadnautilus", type: "Mini-Boss", img: "", milestone: "Hardmode Blood Moon" },
        { name: "Ogre", type: "Event Boss", img: "", milestone: "Old One's Army, tiers 2 and 3" },
        { name: "Flying Dutchman", type: "Event Boss", img: "", milestone: "Hardmode Pirate Invasion" },
      ]
    },
    {
      stage: "Post-Mechanical Bosses", class: "stage-plantera",
      description: "Unlocked after defeating all three mechanical bosses",
      milestone: "🌺 Defeat all three mechanical bosses",
      items: [
        { name: "Plantera", type: "Boss", img: "" },
      ]
    },
    {
      stage: "Post-Plantera", class: "stage-golem",
      description: "Available after defeating Plantera",
      milestone: "🌺 Defeat Plantera",
      items: [
        { name: "Golem", type: "Boss", img: "" },
        { name: "Empress of Light", type: "Boss", img: "" },
        { name: "Lunatic Cultist", type: "Boss", img: "", milestone: "Defeat Golem first" },
        { name: "Betsy", type: "Event Boss", img: "", milestone: "Old One's Army, tier 3" },
        { name: "Mothron", type: "Event Boss", img: "", milestone: "Solar Eclipse" },
        { name: "Martian Saucer", type: "Event Boss", img: "", milestone: "Martian Madness" },
        { name: "Mourning Wood", type: "Event Boss", img: "", milestone: "Pumpkin Moon" },
        { name: "Pumpking", type: "Event Boss", img: "", milestone: "Pumpkin Moon" },
        { name: "Everscream", type: "Event Boss", img: "", milestone: "Frost Moon" },
        { name: "Santa-NK1", type: "Event Boss", img: "", milestone: "Frost Moon" },
        { name: "Ice Queen", type: "Event Boss", img: "", milestone: "Frost Moon" },
      ]
    },
    {
      stage: "Lunar Events", class: "stage-moonlord",
      description: "Triggered by the Lunatic Cultist",
      milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
      items: [
        { name: "Solar Pillar", type: "Celestial Pillar", img: "" },
        { name: "Vortex Pillar", type: "Celestial Pillar", img: "" },
        { name: "Nebula Pillar", type: "Celestial Pillar", img: "" },
        { name: "Stardust Pillar", type: "Celestial Pillar", img: "" },
        { name: "Moon Lord", type: "Final Boss", img: "" },
      ]
    },
  ],

  // Armor timelines: every set lists its pieces (shown in the info popup).
  armorMelee: [
    {
      stage: "Starter Armor", class: "stage-prehardmode",
      description: "Early armor usable by every class",
      items: [
        { name: "Wood Armor", type: "Armor Set", img: "", iconItem: "Wood Breastplate", related: ["Wood Helmet", "Wood Breastplate", "Wood Greaves"] },
        { name: "Cactus Armor", type: "Armor Set", img: "", iconItem: "Cactus Breastplate", related: ["Cactus Helmet", "Cactus Breastplate", "Cactus Leggings"] },
        { name: "Copper Armor", type: "Armor Set", img: "", iconItem: "Copper Chainmail", related: ["Copper Greaves", "Copper Chainmail", "Copper Helmet"] },
        { name: "Tin Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tin Chainmail", related: ["Tin Helmet", "Tin Chainmail", "Tin Greaves"] },
        { name: "Iron Armor", type: "Armor Set", img: "", iconItem: "Iron Chainmail", related: ["Iron Greaves", "Iron Chainmail", "Iron Helmet"] },
        { name: "Lead Armor", type: "Armor Set (Alt)", img: "", iconItem: "Lead Chainmail", related: ["Lead Helmet", "Lead Chainmail", "Lead Greaves"] },
        { name: "Silver Armor", type: "Armor Set", img: "", iconItem: "Silver Chainmail", related: ["Silver Greaves", "Silver Chainmail", "Silver Helmet"] },
        { name: "Tungsten Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tungsten Chainmail", related: ["Tungsten Helmet", "Tungsten Chainmail", "Tungsten Greaves"] },
        { name: "Gold Armor", type: "Armor Set", img: "", iconItem: "Gold Chainmail", related: ["Gold Greaves", "Gold Chainmail", "Gold Helmet"] },
        { name: "Platinum Armor", type: "Armor Set (Alt)", img: "", iconItem: "Platinum Chainmail", related: ["Platinum Helmet", "Platinum Chainmail", "Platinum Greaves"] },
      ]
    },
    {
      stage: "Pre-Hardmode", class: "stage-prehardmode",
      description: "Class-specific early armor",
      items: [
        { name: "Shadow Armor", type: "Armor Set", img: "", iconItem: "Shadow Scalemail", related: ["Shadow Greaves", "Shadow Scalemail", "Shadow Helmet"] },
        { name: "Crimson Armor", type: "Armor Set (Alt)", img: "", iconItem: "Crimson Scalemail", related: ["Crimson Helmet", "Crimson Scalemail", "Crimson Greaves"] },
        { name: "Molten Armor", type: "Armor Set", img: "", iconItem: "Molten Breastplate", related: ["Molten Helmet", "Molten Breastplate", "Molten Greaves"] },
      ]
    },
    {
      stage: "Hardmode", class: "stage-hardmode",
      description: "Pick the helmet variant for your class",
      milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
      items: [
        { name: "Cobalt Armor", type: "Armor Set", img: "", iconItem: "Cobalt Breastplate", related: ["Cobalt Hat", "Cobalt Helmet", "Cobalt Mask", "Cobalt Breastplate", "Cobalt Leggings"] },
        { name: "Palladium Armor", type: "Armor Set (Alt)", img: "", iconItem: "Palladium Breastplate", related: ["Palladium Mask", "Palladium Helmet", "Palladium Headgear", "Palladium Breastplate", "Palladium Leggings"] },
        { name: "Mythril Armor", type: "Armor Set", img: "", iconItem: "Mythril Chainmail", related: ["Mythril Hood", "Mythril Helmet", "Mythril Hat", "Mythril Chainmail", "Mythril Greaves"] },
        { name: "Orichalcum Armor", type: "Armor Set (Alt)", img: "", iconItem: "Orichalcum Breastplate", related: ["Orichalcum Mask", "Orichalcum Helmet", "Orichalcum Headgear", "Orichalcum Breastplate", "Orichalcum Leggings"] },
        { name: "Adamantite Armor", type: "Armor Set", img: "", iconItem: "Adamantite Breastplate", related: ["Adamantite Headgear", "Adamantite Helmet", "Adamantite Mask", "Adamantite Breastplate", "Adamantite Leggings"] },
        { name: "Titanium Armor", type: "Armor Set (Alt)", img: "", iconItem: "Titanium Breastplate", related: ["Titanium Mask", "Titanium Helmet", "Titanium Headgear", "Titanium Breastplate", "Titanium Leggings"] },
        { name: "Hallowed Armor", type: "Armor Set", img: "", iconItem: "Hallowed Plate Mail", related: ["Hallowed Plate Mail", "Hallowed Greaves", "Hallowed Helmet", "Hallowed Headgear", "Hallowed Mask", "Hallowed Hood"] },
      ]
    },
    {
      stage: "Post-Plantera", class: "stage-plantera",
      description: "Jungle and endgame armor",
      milestone: "🌺 Defeat Plantera",
      items: [
        { name: "Chlorophyte Armor", type: "Armor Set", img: "", iconItem: "Chlorophyte Plate Mail", related: ["Chlorophyte Mask", "Chlorophyte Helmet", "Chlorophyte Headgear", "Chlorophyte Plate Mail", "Chlorophyte Greaves"] },
        { name: "Turtle Armor", type: "Armor Set", img: "", iconItem: "Turtle Scale Mail", related: ["Turtle Helmet", "Turtle Scale Mail", "Turtle Leggings"] },
      ]
    },
    {
      stage: "Post-Golem", class: "stage-golem",
      description: "Available after defeating Golem",
      milestone: "🗿 Defeat Golem",
      items: [
        { name: "Beetle Armor", type: "Armor Set", img: "", iconItem: "Beetle Scale Mail", related: ["Beetle Helmet", "Beetle Scale Mail", "Beetle Leggings"] },
      ]
    },
    {
      stage: "Lunar Events", class: "stage-moonlord",
      description: "Best armor for this class",
      milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
      items: [
        { name: "Solar Flare Armor", type: "Armor Set", img: "", iconItem: "Solar Flare Breastplate", related: ["Solar Flare Helmet", "Solar Flare Breastplate", "Solar Flare Leggings"] },
      ]
    },
  ],

  armorRanged: [
    {
      stage: "Starter Armor", class: "stage-prehardmode",
      description: "Early armor usable by every class",
      items: [
        { name: "Wood Armor", type: "Armor Set", img: "", iconItem: "Wood Breastplate", related: ["Wood Helmet", "Wood Breastplate", "Wood Greaves"] },
        { name: "Cactus Armor", type: "Armor Set", img: "", iconItem: "Cactus Breastplate", related: ["Cactus Helmet", "Cactus Breastplate", "Cactus Leggings"] },
        { name: "Copper Armor", type: "Armor Set", img: "", iconItem: "Copper Chainmail", related: ["Copper Greaves", "Copper Chainmail", "Copper Helmet"] },
        { name: "Tin Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tin Chainmail", related: ["Tin Helmet", "Tin Chainmail", "Tin Greaves"] },
        { name: "Iron Armor", type: "Armor Set", img: "", iconItem: "Iron Chainmail", related: ["Iron Greaves", "Iron Chainmail", "Iron Helmet"] },
        { name: "Lead Armor", type: "Armor Set (Alt)", img: "", iconItem: "Lead Chainmail", related: ["Lead Helmet", "Lead Chainmail", "Lead Greaves"] },
        { name: "Silver Armor", type: "Armor Set", img: "", iconItem: "Silver Chainmail", related: ["Silver Greaves", "Silver Chainmail", "Silver Helmet"] },
        { name: "Tungsten Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tungsten Chainmail", related: ["Tungsten Helmet", "Tungsten Chainmail", "Tungsten Greaves"] },
        { name: "Gold Armor", type: "Armor Set", img: "", iconItem: "Gold Chainmail", related: ["Gold Greaves", "Gold Chainmail", "Gold Helmet"] },
        { name: "Platinum Armor", type: "Armor Set (Alt)", img: "", iconItem: "Platinum Chainmail", related: ["Platinum Helmet", "Platinum Chainmail", "Platinum Greaves"] },
      ]
    },
    {
      stage: "Pre-Hardmode", class: "stage-prehardmode",
      description: "Class-specific early armor",
      items: [
        { name: "Necro Armor", type: "Armor Set", img: "", iconItem: "Necro Breastplate", related: ["Necro Helmet", "Necro Breastplate", "Necro Greaves"] },
      ]
    },
    {
      stage: "Hardmode", class: "stage-hardmode",
      description: "Pick the helmet variant for your class",
      milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
      items: [
        { name: "Cobalt Armor", type: "Armor Set", img: "", iconItem: "Cobalt Breastplate", related: ["Cobalt Hat", "Cobalt Helmet", "Cobalt Mask", "Cobalt Breastplate", "Cobalt Leggings"] },
        { name: "Palladium Armor", type: "Armor Set (Alt)", img: "", iconItem: "Palladium Breastplate", related: ["Palladium Mask", "Palladium Helmet", "Palladium Headgear", "Palladium Breastplate", "Palladium Leggings"] },
        { name: "Mythril Armor", type: "Armor Set", img: "", iconItem: "Mythril Chainmail", related: ["Mythril Hood", "Mythril Helmet", "Mythril Hat", "Mythril Chainmail", "Mythril Greaves"] },
        { name: "Orichalcum Armor", type: "Armor Set (Alt)", img: "", iconItem: "Orichalcum Breastplate", related: ["Orichalcum Mask", "Orichalcum Helmet", "Orichalcum Headgear", "Orichalcum Breastplate", "Orichalcum Leggings"] },
        { name: "Adamantite Armor", type: "Armor Set", img: "", iconItem: "Adamantite Breastplate", related: ["Adamantite Headgear", "Adamantite Helmet", "Adamantite Mask", "Adamantite Breastplate", "Adamantite Leggings"] },
        { name: "Titanium Armor", type: "Armor Set (Alt)", img: "", iconItem: "Titanium Breastplate", related: ["Titanium Mask", "Titanium Helmet", "Titanium Headgear", "Titanium Breastplate", "Titanium Leggings"] },
        { name: "Hallowed Armor", type: "Armor Set", img: "", iconItem: "Hallowed Plate Mail", related: ["Hallowed Plate Mail", "Hallowed Greaves", "Hallowed Helmet", "Hallowed Headgear", "Hallowed Mask", "Hallowed Hood"] },
      ]
    },
    {
      stage: "Post-Plantera", class: "stage-plantera",
      description: "Jungle and endgame armor",
      milestone: "🌺 Defeat Plantera",
      items: [
        { name: "Chlorophyte Armor", type: "Armor Set", img: "", iconItem: "Chlorophyte Plate Mail", related: ["Chlorophyte Mask", "Chlorophyte Helmet", "Chlorophyte Headgear", "Chlorophyte Plate Mail", "Chlorophyte Greaves"] },
        { name: "Shroomite Armor", type: "Armor Set", img: "", iconItem: "Shroomite Breastplate", related: ["Shroomite Headgear", "Shroomite Mask", "Shroomite Helmet", "Shroomite Breastplate", "Shroomite Leggings"] },
      ]
    },
    {
      stage: "Lunar Events", class: "stage-moonlord",
      description: "Best armor for this class",
      milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
      items: [
        { name: "Vortex Armor", type: "Armor Set", img: "", iconItem: "Vortex Breastplate", related: ["Vortex Helmet", "Vortex Breastplate", "Vortex Leggings"] },
      ]
    },
  ],

  armorMage: [
    {
      stage: "Starter Armor", class: "stage-prehardmode",
      description: "Early armor usable by every class",
      items: [
        { name: "Wood Armor", type: "Armor Set", img: "", iconItem: "Wood Breastplate", related: ["Wood Helmet", "Wood Breastplate", "Wood Greaves"] },
        { name: "Cactus Armor", type: "Armor Set", img: "", iconItem: "Cactus Breastplate", related: ["Cactus Helmet", "Cactus Breastplate", "Cactus Leggings"] },
        { name: "Copper Armor", type: "Armor Set", img: "", iconItem: "Copper Chainmail", related: ["Copper Greaves", "Copper Chainmail", "Copper Helmet"] },
        { name: "Tin Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tin Chainmail", related: ["Tin Helmet", "Tin Chainmail", "Tin Greaves"] },
        { name: "Iron Armor", type: "Armor Set", img: "", iconItem: "Iron Chainmail", related: ["Iron Greaves", "Iron Chainmail", "Iron Helmet"] },
        { name: "Lead Armor", type: "Armor Set (Alt)", img: "", iconItem: "Lead Chainmail", related: ["Lead Helmet", "Lead Chainmail", "Lead Greaves"] },
        { name: "Silver Armor", type: "Armor Set", img: "", iconItem: "Silver Chainmail", related: ["Silver Greaves", "Silver Chainmail", "Silver Helmet"] },
        { name: "Tungsten Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tungsten Chainmail", related: ["Tungsten Helmet", "Tungsten Chainmail", "Tungsten Greaves"] },
        { name: "Gold Armor", type: "Armor Set", img: "", iconItem: "Gold Chainmail", related: ["Gold Greaves", "Gold Chainmail", "Gold Helmet"] },
        { name: "Platinum Armor", type: "Armor Set (Alt)", img: "", iconItem: "Platinum Chainmail", related: ["Platinum Helmet", "Platinum Chainmail", "Platinum Greaves"] },
      ]
    },
    {
      stage: "Pre-Hardmode", class: "stage-prehardmode",
      description: "Class-specific early armor",
      items: [
        { name: "Jungle Armor", type: "Armor Set", img: "", iconItem: "Jungle Shirt", related: ["Jungle Hat", "Jungle Shirt", "Jungle Pants"] },
        { name: "Meteor Armor", type: "Armor Set", img: "", iconItem: "Meteor Suit", related: ["Meteor Helmet", "Meteor Suit", "Meteor Leggings"] },
      ]
    },
    {
      stage: "Hardmode", class: "stage-hardmode",
      description: "Pick the hat/hood variant for your class",
      milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
      items: [
        { name: "Cobalt Armor", type: "Armor Set", img: "", iconItem: "Cobalt Breastplate", related: ["Cobalt Hat", "Cobalt Helmet", "Cobalt Mask", "Cobalt Breastplate", "Cobalt Leggings"] },
        { name: "Palladium Armor", type: "Armor Set (Alt)", img: "", iconItem: "Palladium Breastplate", related: ["Palladium Mask", "Palladium Helmet", "Palladium Headgear", "Palladium Breastplate", "Palladium Leggings"] },
        { name: "Mythril Armor", type: "Armor Set", img: "", iconItem: "Mythril Chainmail", related: ["Mythril Hood", "Mythril Helmet", "Mythril Hat", "Mythril Chainmail", "Mythril Greaves"] },
        { name: "Orichalcum Armor", type: "Armor Set (Alt)", img: "", iconItem: "Orichalcum Breastplate", related: ["Orichalcum Mask", "Orichalcum Helmet", "Orichalcum Headgear", "Orichalcum Breastplate", "Orichalcum Leggings"] },
        { name: "Adamantite Armor", type: "Armor Set", img: "", iconItem: "Adamantite Breastplate", related: ["Adamantite Headgear", "Adamantite Helmet", "Adamantite Mask", "Adamantite Breastplate", "Adamantite Leggings"] },
        { name: "Titanium Armor", type: "Armor Set (Alt)", img: "", iconItem: "Titanium Breastplate", related: ["Titanium Mask", "Titanium Helmet", "Titanium Headgear", "Titanium Breastplate", "Titanium Leggings"] },
        { name: "Hallowed Armor", type: "Armor Set", img: "", iconItem: "Hallowed Plate Mail", related: ["Hallowed Plate Mail", "Hallowed Greaves", "Hallowed Helmet", "Hallowed Headgear", "Hallowed Mask", "Hallowed Hood"] },
        { name: "Forbidden Armor", type: "Armor Set", img: "", iconItem: "Forbidden Robes", related: ["Forbidden Mask", "Forbidden Robes"] },
      ]
    },
    {
      stage: "Post-Plantera", class: "stage-plantera",
      description: "Jungle and endgame armor",
      milestone: "🌺 Defeat Plantera",
      items: [
        { name: "Chlorophyte Armor", type: "Armor Set", img: "", iconItem: "Chlorophyte Plate Mail", related: ["Chlorophyte Mask", "Chlorophyte Helmet", "Chlorophyte Headgear", "Chlorophyte Plate Mail", "Chlorophyte Greaves"] },
        { name: "Spectre Armor", type: "Armor Set", img: "", iconItem: "Spectre Robe", related: ["Spectre Hood", "Spectre Robe", "Spectre Pants", "Spectre Mask"] },
      ]
    },
    {
      stage: "Lunar Events", class: "stage-moonlord",
      description: "Best armor for this class",
      milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
      items: [
        { name: "Nebula Armor", type: "Armor Set", img: "", iconItem: "Nebula Breastplate", related: ["Nebula Helmet", "Nebula Breastplate", "Nebula Leggings"] },
      ]
    },
  ],

  armorSummoner: [
    {
      stage: "Starter Armor", class: "stage-prehardmode",
      description: "Early armor usable by every class",
      items: [
        { name: "Wood Armor", type: "Armor Set", img: "", iconItem: "Wood Breastplate", related: ["Wood Helmet", "Wood Breastplate", "Wood Greaves"] },
        { name: "Cactus Armor", type: "Armor Set", img: "", iconItem: "Cactus Breastplate", related: ["Cactus Helmet", "Cactus Breastplate", "Cactus Leggings"] },
        { name: "Copper Armor", type: "Armor Set", img: "", iconItem: "Copper Chainmail", related: ["Copper Greaves", "Copper Chainmail", "Copper Helmet"] },
        { name: "Tin Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tin Chainmail", related: ["Tin Helmet", "Tin Chainmail", "Tin Greaves"] },
        { name: "Iron Armor", type: "Armor Set", img: "", iconItem: "Iron Chainmail", related: ["Iron Greaves", "Iron Chainmail", "Iron Helmet"] },
        { name: "Lead Armor", type: "Armor Set (Alt)", img: "", iconItem: "Lead Chainmail", related: ["Lead Helmet", "Lead Chainmail", "Lead Greaves"] },
        { name: "Silver Armor", type: "Armor Set", img: "", iconItem: "Silver Chainmail", related: ["Silver Greaves", "Silver Chainmail", "Silver Helmet"] },
        { name: "Tungsten Armor", type: "Armor Set (Alt)", img: "", iconItem: "Tungsten Chainmail", related: ["Tungsten Helmet", "Tungsten Chainmail", "Tungsten Greaves"] },
        { name: "Gold Armor", type: "Armor Set", img: "", iconItem: "Gold Chainmail", related: ["Gold Greaves", "Gold Chainmail", "Gold Helmet"] },
        { name: "Platinum Armor", type: "Armor Set (Alt)", img: "", iconItem: "Platinum Chainmail", related: ["Platinum Helmet", "Platinum Chainmail", "Platinum Greaves"] },
      ]
    },
    {
      stage: "Pre-Hardmode", class: "stage-prehardmode",
      description: "Class-specific early armor",
      items: [
        { name: "Bee Armor", type: "Armor Set", img: "", iconItem: "Bee Breastplate", related: ["Bee Hat", "Bee Shirt", "Bee Pants", "Bee Headgear", "Bee Breastplate", "Bee Greaves"] },
      ]
    },
    {
      stage: "Hardmode", class: "stage-hardmode",
      description: "Hardmode summoner armor",
      milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
      items: [
        { name: "Spider Armor", type: "Armor Set", img: "", iconItem: "Spider Breastplate", related: ["Spider Mask", "Spider Breastplate", "Spider Greaves"] },
      ]
    },
    {
      stage: "Post-Plantera", class: "stage-plantera",
      description: "Jungle and endgame armor",
      milestone: "🌺 Defeat Plantera",
      items: [
        { name: "Tiki Armor", type: "Armor Set", img: "", iconItem: "Tiki Shirt", related: ["Tiki Mask", "Tiki Shirt", "Tiki Pants"] },
        { name: "Spooky Armor", type: "Armor Set", img: "", iconItem: "Spooky Breastplate", related: ["Spooky Helmet", "Spooky Breastplate", "Spooky Leggings"] },
      ]
    },
    {
      stage: "Lunar Events", class: "stage-moonlord",
      description: "Best armor for this class",
      milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
      items: [
        { name: "Stardust Armor", type: "Armor Set", img: "", iconItem: "Stardust Plate", related: ["Stardust Helmet", "Stardust Plate", "Stardust Leggings"] },
      ]
    },
  ],

  pickaxes: [
    {
      stage: "Pre-Hardmode", class: "stage-prehardmode",
      description: "Pickaxes available from the start of the game",
      items: [
        { name: "Copper Pickaxe", type: "Pickaxe", img: "" },
        { name: "Tin Pickaxe", type: "Pickaxe (Alt)", img: "" },
        { name: "Iron Pickaxe", type: "Pickaxe", img: "" },
        { name: "Lead Pickaxe", type: "Pickaxe (Alt)", img: "" },
        { name: "Silver Pickaxe", type: "Pickaxe", img: "" },
        { name: "Tungsten Pickaxe", type: "Pickaxe (Alt)", img: "" },
        { name: "Gold Pickaxe", type: "Pickaxe", img: "" },
        { name: "Platinum Pickaxe", type: "Pickaxe (Alt)", img: "" },
        { name: "Nightmare Pickaxe", type: "Pickaxe (Alt)", img: "", milestone: "Crafted from Demonite Bars" },
        { name: "Deathbringer Pickaxe", type: "Pickaxe (Alt)", img: "", milestone: "Crafted from Crimtane Bars" },
        { name: "Molten Pickaxe", type: "Pickaxe", img: "", milestone: "Crafted from Hellstone Bars" }
      ]
    },
    {
      stage: "Hardmode", class: "stage-hardmode",
      description: "Unlocked after defeating Wall of Flesh",
      milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
      items: [
        { name: "Cobalt Pickaxe", type: "Pickaxe", img: "" },
        { name: "Palladium Pickaxe", type: "Pickaxe (Alt)", img: "" },
        { name: "Mythril Pickaxe", type: "Pickaxe", img: "" },
        { name: "Orichalcum Pickaxe", type: "Pickaxe (Alt)", img: "" },
        { name: "Adamantite Pickaxe", type: "Pickaxe", img: "" },
        { name: "Titanium Pickaxe", type: "Pickaxe (Alt)", img: "" },
        { name: "Chlorophyte Pickaxe", type: "Pickaxe", img: "" }
      ]
    },
    {
      stage: "Post-Mechanical Bosses", class: "stage-plantera",
      description: "Crafted from Hallowed Bars",
      milestone: "🌺 Defeat all three mechanical bosses",
      items: [
        { name: "Drax", type: "Drill-Axe", img: "" },
        { name: "Pickaxe Axe", type: "Pickaxe-Axe", img: "" }
      ]
    },
    {
      stage: "Post-Plantera", class: "stage-golem",
      description: "Available after defeating Plantera",
      milestone: "🌺 Defeat Plantera",
      items: [
        { name: "Spectre Pickaxe", type: "Pickaxe", img: "", milestone: "Crafted from Spectre Bars" },
        { name: "Shroomite Digging Claw", type: "Digging Claw", img: "" },
        { name: "Picksaw", type: "Pickaxe-Saw", img: "", milestone: "Drops from Golem" }
      ]
    },
    {
      stage: "Lunar Events", class: "stage-moonlord",
      description: "Crafted from Lunar Fragments",
      milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
      items: [
        { name: "Vortex Pickaxe", type: "Pickaxe", img: "" },
        { name: "Nebula Pickaxe", type: "Pickaxe", img: "" },
        { name: "Solar Flare Pickaxe", type: "Pickaxe", img: "" },
        { name: "Stardust Pickaxe", type: "Pickaxe", img: "" }
      ]
    },
    {
      stage: "Post-Moon Lord", class: "stage-moonlord",
      description: "The fastest way to dig",
      milestone: "🌙 Defeat the Moon Lord",
      items: [
        { name: "Drill Containment Unit", type: "Drill Mount", img: "", milestone: "Mount that mines a tunnel ahead of you (needs Luminite, Chlorophyte, Shroomite, Spectre, Hellstone and Meteorite bars)" }
      ]
    },
  ],

  events: [
    {
      stage: "Pre-Hardmode", class: "stage-prehardmode",
      description: "Events available from the start of the game",
      items: [
        { name: "Blood Moon", type: "Event", img: "", iconItem: "Bloody Tear", search: "Bloody Tear" },
        { name: "Slime Rain", type: "Event", img: "", iconNpc: "Green Slime" },
        { name: "Goblin Army", type: "Invasion", img: "", iconItem: "Goblin Battle Standard", search: "Goblin Battle Standard" },
        { name: "Old One's Army", type: "Invasion", img: "", iconItem: "Eternia Crystal Stand", search: "Eternia Crystal Stand", milestone: "Tier 2 after a mechanical boss, Tier 3 after Golem" }
      ]
    },
    {
      stage: "Hardmode", class: "stage-hardmode",
      description: "Unlocked after defeating Wall of Flesh",
      milestone: "🎯 Defeat Wall of Flesh to unlock Hardmode",
      items: [
        { name: "Frost Legion", type: "Invasion", img: "", iconItem: "Snow Globe", search: "Snow Globe" },
        { name: "Pirate Invasion", type: "Invasion", img: "", iconItem: "Pirate Map", search: "Pirate Map" },
        { name: "Solar Eclipse", type: "Event", img: "", iconItem: "Solar Tablet", search: "Solar Tablet" }
      ]
    },
    {
      stage: "Post-Plantera", class: "stage-plantera",
      description: "Available after defeating Plantera",
      milestone: "🌺 Defeat Plantera",
      items: [
        { name: "Pumpkin Moon", type: "Invasion", img: "", iconItem: "Pumpkin Moon Medallion", search: "Pumpkin Moon Medallion" },
        { name: "Frost Moon", type: "Invasion", img: "", iconItem: "Naughty Present", search: "Naughty Present" }
      ]
    },
    {
      stage: "Post-Golem", class: "stage-golem",
      description: "Available after defeating Golem",
      milestone: "🗿 Defeat Golem",
      items: [
        { name: "Martian Madness", type: "Invasion", img: "", iconNpc: "Martian Saucer" }
      ]
    },
    {
      stage: "Lunar Events", class: "stage-moonlord",
      description: "Triggered by the Lunatic Cultist",
      milestone: "🌙 Defeat Lunatic Cultist to trigger Lunar Events",
      items: [
        { name: "Lunar Events", type: "Event", img: "", iconItem: "Celestial Sigil" }
      ]
    },
  ],
};

// ============================================================
// CORRUPTION vs CRIMSON compare page (data from the official Terraria wiki)
// item fields: name, note (small text), info (shown in popup), icon (backup icon item/NPC name), wiki (wiki page title)
// ============================================================
const COMPARES = {
  evil: {
    sides: [
      { key: "crimson", name: "Crimson", tag: "Red, fleshy and gory" },
      { key: "corruption", name: "Corruption", tag: "Purple, rotting wasteland" },
    ],
    facts: [
      { label: "Chasm shape",
        crimson: "A wide circular cavity with branching tunnels that end in Crimson Hearts",
        corruption: "Long, straight vertical drops that end in Shadow Orbs" },
      { label: "Gear",
        crimson: "Tools, weapons and armor generally have small power advantages",
        corruption: "Tools are slightly faster, but gear is a bit less powerful" },
      { label: "Enemies",
        crimson: "Slightly higher health, defense and damage",
        corruption: "Slightly lower health, defense and damage" },
      { label: "Hardmode material",
        crimson: "Ichor: lowers enemy defense",
        corruption: "Cursed Flame: burns enemies over time" },
    ],
    sections: [
      { label: "Boss",
        crimson: [
          { name: "Brain of Cthulhu", note: "Break 3 Crimson Hearts or use a Bloody Spine" },
        ],
        corruption: [
          { name: "Eater of Worlds", note: "Break 3 Shadow Orbs or use Worm Food" },
        ] },
      { label: "Boss drops",
        crimson: [
          { name: "Crimtane Ore", note: "Ore for Crimson gear" },
          { name: "Tissue Sample", note: "Crafting material" },
          { name: "Brain of Confusion", note: "Expert Mode accessory" },
        ],
        corruption: [
          { name: "Demonite Ore", note: "Ore for Corruption gear" },
          { name: "Shadow Scale", note: "Crafting material" },
          { name: "Worm Scarf", note: "Expert Mode accessory" },
        ] },
      { label: "Pre-Hardmode mobs",
        crimson: [
          { name: "Blood Crawler" }, { name: "Face Monster" },
          { name: "Crimera" }, { name: "Vicious Goldfish" },
        ],
        corruption: [
          { name: "Eater of Souls" }, { name: "Devourer" },
          { name: "Corrupt Goldfish" },
        ] },
      { label: "Hardmode mobs (surface)",
        crimson: [
          { name: "Herpling" }, { name: "Crimslime" },
          { name: "Blood Jelly" }, { name: "Blood Feeder" },
        ],
        corruption: [
          { name: "Corruptor" }, { name: "Corrupt Slime" },
          { name: "Slimer" }, { name: "World Feeder" },
        ] },
      { label: "Hardmode mobs (underground)",
        crimson: [
          { name: "Floaty Gross" }, { name: "Ichor Sticker" },
          { name: "Crimson Axe" }, { name: "Crimson Mimic" },
        ],
        corruption: [
          { name: "Clinger" }, { name: "Cursed Hammer" },
          { name: "Corrupt Mimic" },
        ] },
      { label: "Orb / Heart treasure",
        crimson: [
          { name: "The Undertaker", note: "Gun (comes with Musket Balls)" },
          { name: "The Rotted Fork", note: "Spear" },
          { name: "Crimson Rod", note: "Magic staff" },
          { name: "Panic Necklace", note: "Accessory" },
        ],
        corruption: [
          { name: "Musket", note: "Gun (comes with Musket Balls)" },
          { name: "Ball O' Hurt", note: "Flail" },
          { name: "Vilethorn", note: "Magic weapon" },
          { name: "Band of Starpower", note: "Accessory" },
        ] },
      { label: "Mob materials",
        crimson: [ { name: "Vertebra", note: "From Blood Crawlers, Crimera, Face Monsters" } ],
        corruption: [
          { name: "Rotten Chunk", note: "From Eaters of Souls, Devourers" },
          { name: "Worm Tooth", note: "From Devourers" },
        ] },
      { label: "Hardmode materials",
        crimson: [ { name: "Ichor", note: "From Ichor Stickers and Tainted Ghouls" } ],
        corruption: [ { name: "Cursed Flame", note: "From World Feeders, Clingers, Vile Ghouls" } ] },
      { label: "Mimic loot",
        crimson: [
          { name: "Life Drain" }, { name: "Dart Pistol" }, { name: "Fetid Baghnakhs" },
          { name: "Flesh Knuckles" }, { name: "Tendon Hook" },
        ],
        corruption: [
          { name: "Dart Rifle" }, { name: "Worm Hook" }, { name: "Chain Guillotines" },
          { name: "Clinger Staff" }, { name: "Putrid Scent" },
        ] },
      { label: "Gear",
        crimson: [
          { name: "Crimson Armor", icon: "Crimson Helmet", wiki: "Crimson armor", note: "Crimtane Bars + Tissue Samples" },
          { name: "Deathbringer Pickaxe", note: "Crimson pickaxe" },
        ],
        corruption: [
          { name: "Shadow Armor", icon: "Shadow Helmet", wiki: "Shadow armor", note: "Demonite Bars + Shadow Scales" },
          { name: "Nightmare Pickaxe", note: "Corruption pickaxe" },
        ] },
      { label: "Biome chest (after Plantera)",
        crimson: [ { name: "Vampire Knives", note: "From the Crimson Chest (Crimson Key)" } ],
        corruption: [ { name: "Scourge of the Corruptor", note: "From the Corruption Chest (Corruption Key)" } ] },
    ],
    picks: {
      crimson: [
        "You want gear with a slight power edge",
        "You like a tougher challenge from the enemies",
        "You'd rather avoid long, straight chasm drops",
      ],
      corruption: [
        "You want slightly faster tools",
        "You prefer a gentler early game",
        "You like Cursed Flame (burning damage)",
      ],
    },
    footnote: "You are not locked in: in Hardmode the Dryad sells seeds for the other biome while you stand in a Graveyard, so you can build one later. Drunk worlds generate both.",
  },
};

function compareImgCandidates(entry) {
  const npcImg = NPC_BY_NAME[entry.name]?.img;
  const list = [
    entry.img,
    npcImg,
    ITEM_BY_NAME[entry.name]?.img,
    ITEM_BY_NAME[entry.icon]?.img,
    NPC_BY_NAME[entry.icon]?.img,
    // same backup the timeline uses: if the .gif link is dead, try the .png version
    npcImg && npcImg.endsWith(".gif") ? npcImg.replace(/\.gif$/, ".png") : null,
    entry.fallbackImg,
  ];
  return [...new Set(list.filter(Boolean))];
}

function openCompareEntry(entry, sideName, label) {
  if (typeof BOSS_DATA !== "undefined" && BOSS_DATA[entry.name] && typeof timelinePath !== "undefined") {
    timelinePath.push({ name: entry.name, boss: entry.name });
    showTimelineLevel();
    return;
  }
  const itemData = ITEM_BY_NAME[entry.name];
  if (itemData) {
    openChoiceModal(itemData);
    return;
  }
  const wikiTitle = entry.wiki || entry.name;
  showInfoPopup({
    title: entry.name,
    imgs: compareImgCandidates(entry),
    subtitle: `${sideName} · ${label}`,
    paragraph: entry.info || entry.note || "",
    lines: [],
    related: [],
    wikiUrl: `https://terraria.wiki.gg/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, "_"))}`,
  });
}

function cmpEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderCompare(key) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const data = COMPARES[key];
  if (!data) {
    content.innerHTML = `<div class="timeline-soon">Coming soon</div>`;
    return;
  }

  const [left, right] = data.sides;
  const wrap = cmpEl("div", "cmp");

  // Header: names with a line under them
  const head = cmpEl("div", "cmp-head");
  for (const side of data.sides) {
    const cell = cmpEl("div", "cmp-head-cell");
    cell.appendChild(cmpEl("div", `cmp-title ${side.key}`, side.name));
    cell.appendChild(cmpEl("div", "cmp-tag", side.tag));
    head.appendChild(cell);
  }
  wrap.appendChild(head);

  // Quick facts (plain text rows)
  for (const fact of data.facts) {
    const section = cmpEl("div", "cmp-section");
    section.appendChild(cmpEl("div", "cmp-label", fact.label));
    const cols = cmpEl("div", "cmp-cols");
    cols.appendChild(cmpEl("div", "cmp-col cmp-fact", fact[left.key]));
    cols.appendChild(cmpEl("div", "cmp-col cmp-fact", fact[right.key]));
    section.appendChild(cols);
    wrap.appendChild(section);
  }

  // Mobs / items (clickable)
  for (const sec of data.sections) {
    const section = cmpEl("div", "cmp-section");
    section.appendChild(cmpEl("div", "cmp-label", sec.label));
    const cols = cmpEl("div", "cmp-cols");

    for (const side of data.sides) {
      const col = cmpEl("div", "cmp-col");
      for (const entry of sec[side.key] || []) {
        const row = cmpEl("div", "cmp-item");

        const ico = cmpEl("span", "cmp-ico");
        const urls = compareImgCandidates(entry);
        if (urls.length) {
          const img = document.createElement("img");
          img.alt = entry.name;
          img.loading = "lazy";
          setImgWithFallbacks(img, urls);
          ico.appendChild(img);
        }
        row.appendChild(ico);

        const text = cmpEl("div", "cmp-text");
        text.appendChild(cmpEl("div", "cmp-name", entry.name));
        if (entry.note) text.appendChild(cmpEl("div", "cmp-note", entry.note));
        row.appendChild(text);

        row.addEventListener("click", () => openCompareEntry(entry, side.name, sec.label));
        col.appendChild(row);
      }
      cols.appendChild(col);
    }
    section.appendChild(cols);
    wrap.appendChild(section);
  }

  // Which one to pick
  if (data.picks) {
    const section = cmpEl("div", "cmp-section");
    section.appendChild(cmpEl("div", "cmp-label", "Which should I pick?"));
    const cols = cmpEl("div", "cmp-cols");
    for (const side of data.sides) {
      const col = cmpEl("div", "cmp-col cmp-pick");
      col.appendChild(cmpEl("div", `cmp-pick-title ${side.key}`, `Pick ${side.name} if...`));
      const ul = cmpEl("ul", "cmp-pick-list");
      for (const line of data.picks[side.key] || []) ul.appendChild(cmpEl("li", "", line));
      col.appendChild(ul);
      cols.appendChild(col);
    }
    section.appendChild(cols);
    wrap.appendChild(section);
  }

  if (data.footnote) wrap.appendChild(cmpEl("div", "cmp-footnote", data.footnote));

  content.appendChild(wrap);
}

// ============================================================
// NPC PAGES (data from the official Terraria wiki NPC table)
// fields: name, tag, unlock (short line for the menu), about, get, sells {summary, items[]}, use, fights, list[], wiki, ext
// "items" are highlights, not the full stock (shops change with progress, biome and moon phase)
// ============================================================
const NPCS = {
  // ---------- Pre-Hardmode ----------
  guide: { name: "Guide", tag: "Your starter helper", unlock: "Already in your world at the start",
    about: "He gives tips on how to attract the other town NPCs and shows crafting recipes for any item you hand him.",
    get: "He is already in the world when you start a normal new game.",
    use: "Put an item in his slot to see every recipe that uses it. It is the fastest way to find out what an item is for.",
    fights: "Wooden Bow" },
  merchant: { name: "Merchant", tag: "Basic tools and supplies", unlock: "Needs 50 silver across all players",
    about: "A general store for basic tools and supplies.",
    get: "Together, the players must be carrying more than 50 silver. (He replaces the Guide as the starter NPC in a Not the Bees world.)",
    sells: { summary: "Everyday supplies for the early game.", items: ["Torch", "Lesser Healing Potion", "Rope", "Glowstick", "Wooden Arrow"] },
    use: "Cheap supplies early on. Like every shop NPC, he also buys your spare items for coins.",
    fights: "Throwing Knife" },
  nurse: { name: "Nurse", tag: "Heals you for coins", unlock: "Needs 100+ max health and the Merchant",
    about: "She restores your health and removes debuffs in exchange for coins.",
    get: "A player has more than 100 health and the Merchant is already in town.",
    use: "Save your potions by paying her to heal you. Her syringes also heal nearby NPCs for 20 health.",
    fights: "Syringes (poison enemies, heal NPCs)" },
  demolitionist: { name: "Demolitionist", tag: "Explosives", unlock: "Needs an explosive in your inventory",
    about: "Sells explosives.",
    get: "A player is carrying an explosive and the Merchant is present. (He replaces the Guide in a For the Worthy world.)",
    sells: { summary: "Grenades, bombs and dynamite.", items: ["Grenade", "Bomb", "Dynamite"] },
    use: "Great for clearing rock fast. Explosives can also blow up the Ebonstone and Crimstone in evil chasms.",
    fights: "Grenade" },
  dye_trader: { name: "Dye Trader", tag: "Dyes and the Dye Vat", unlock: "Needs a dye item in your inventory",
    about: "Sells the Dye Vat crafting station and trades rare dyes for Strange Plants.",
    get: "A player carries a dye item or an item used to craft dye, plus a few other conditions.",
    sells: { summary: "The Dye Vat, plus rare dyes for Strange Plants.", items: ["Dye Vat"] },
    use: "Craft your own dyes at the Dye Vat. Bring him Strange Plants to swap for rare dyes.",
    fights: "Exotic Scimitar" },
  angler: { name: "Angler", tag: "Daily fishing quests", unlock: "Found sleeping at the Ocean",
    about: "Gives you fishing quests and rewards you for completing them.",
    get: "Find him sleeping in an Ocean biome and talk to him to rescue him.",
    use: "Hand in the fish he asks for to earn rewards. You get one quest per day.",
    fights: "Frost Daggerfish" },
  zoologist: { name: "Zoologist", tag: "Pets, mounts and critter items", unlock: "Needs 10% of the Bestiary filled",
    about: "Sells vanity items, mounts, pets and critter-themed items. More unlock as your Bestiary fills up.",
    get: "At least 10% of the Bestiary (55 entries) has been filled.",
    sells: { summary: "Pet licenses plus items that unlock with Bestiary progress. The Dog License needs 25% (137 entries) and the Bunny License needs 45% (246 entries).", items: ["Cat License", "Dog License", "Bunny License"] },
    use: "Fill out the Bestiary to unlock more of his stock. The licenses bring town pets into your town.",
    fights: "Claws" },
  dryad: { name: "Dryad", tag: "Nature and purity", unlock: "Beat Eye of Cthulhu, Eater of Worlds/Brain of Cthulhu or Skeletron",
    about: "Sells nature, Corruption and Crimson items, and can tell you how much of your world is Corrupted, Crimson or Hallowed.",
    get: "Defeat any one of the Eye of Cthulhu, the Eater of Worlds or Brain of Cthulhu, or Skeletron. (She replaces the Guide in a Purify this world.)",
    sells: { summary: "Purification Powder and seeds. In Hardmode, while you stand in a Graveyard, she sells Corrupt and Crimson Seeds so you can make the other evil biome.", items: ["Purification Powder", "Corrupt Seeds", "Crimson Seeds"] },
    use: "Ask her for your world's purity report. Her aura gives players Dryad's Blessing and curses nearby enemies with Dryad's Bane.",
    fights: "Dryad's Blessing aura" },
  painter: { name: "Painter", tag: "Paint and paintings", unlock: "Needs 8 other town NPCs",
    about: "Sells paint, painting tools and paintings.",
    get: "There are 8 other town NPCs in the world.",
    sells: { summary: "Paint, painting tools and paintings.", items: ["Paintbrush", "Paint Roller", "Paint Scraper"] },
    use: "Recolor blocks and walls to decorate your base.",
    fights: "Paintball Gun" },
  golfer: { name: "Golfer", tag: "Golf gear", unlock: "Found in the Underground Desert",
    about: "Sells golf clubs, golf balls and other golfing items.",
    get: "Find him in the Underground Desert and talk to him to rescue him.",
    sells: { summary: "Golf clubs, balls and other golf items.", items: ["Golf Club", "Golf Ball"] },
    use: "Build a course and play for fun.",
    fights: "Golf Balls" },
  arms_dealer: { name: "Arms Dealer", tag: "Guns and ammo", unlock: "Needs bullets or a gun",
    about: "Sells guns, bullets and other ammunition.",
    get: "A player has bullets, or a gun that fires bullets, in their inventory.",
    sells: { summary: "Guns and ammunition.", items: ["Musket Ball", "Flintlock Pistol"] },
    use: "The place to restock bullets for a ranged build.",
    fights: "Flintlock Pistol (Minishark in Hardmode)" },
  tavernkeep: { name: "Tavernkeep", tag: "Old One's Army", unlock: "Beat Eater of Worlds or Brain of Cthulhu",
    about: "Sells items that summon and help fight the Old One's Army. Most cost Defender Medals.",
    get: "After beating the Eater of Worlds or Brain of Cthulhu, find and talk to the Unconscious Man.",
    sells: { summary: "Old One's Army items, mostly bought with Defender Medals.", items: [] },
    use: "Your doorway into the Old One's Army event. Earn Defender Medals by clearing its waves.",
    fights: "Ale Tosser", noPylon: true },
  stylist: { name: "Stylist", tag: "Hair and hair dye", unlock: "Rescue her from a Spider Nest",
    about: "Changes your hairstyle and hair color, and sells hair dyes.",
    get: "Find her webbed up in a Spider Nest and talk to her to rescue her.",
    sells: { summary: "Hair dyes and hairstyle changes.", items: [] },
    use: "Change your look any time you like.",
    fights: "Stylish Scissors" },
  goblin_tinkerer: { name: "Goblin Tinkerer", tag: "Accessories and reforging", unlock: "Beat a Goblin Army, then rescue him",
    about: "Sells the Tinkerer's Workshop and can reforge your items.",
    get: "After a Goblin Army has been defeated, find him bound in the Cavern layer and rescue him.",
    sells: { summary: "The Tinkerer's Workshop and other gear.", items: ["Tinkerer's Workshop"] },
    use: "Combine accessories at the Tinkerer's Workshop, and reforge weapons and gear for better modifiers.",
    fights: "Spiky Ball" },
  witch_doctor: { name: "Witch Doctor", tag: "Summoner gear", unlock: "Beat the Queen Bee",
    about: "Sells the Blowgun, the Imbuing Station, summoner equipment, fountains and Leaf Wings.",
    get: "The Queen Bee has been defeated.",
    sells: { summary: "Summoner gear, fountains and more.", items: ["Blowgun", "Imbuing Station", "Leaf Wings"] },
    use: "A key stop for summoners, and the Imbuing Station lets you imbue weapons with flasks.",
    fights: "Blowgun" },
  clothier: { name: "Clothier", tag: "Vanity items", unlock: "Beat Skeletron",
    about: "Sells vanity items, including the Familiar set.",
    get: "Skeletron has been defeated. The Old Man moves into town as the Clothier.",
    sells: { summary: "Vanity items such as the Familiar set.", items: ["Familiar Wig", "Familiar Shirt", "Familiar Pants"] },
    use: "Cosmetic outfits only.",
    fights: "Shadowflame Skull" },
  mechanic: { name: "Mechanic", tag: "Wires and mechanisms", unlock: "Rescue her in the Dungeon",
    about: "Sells wrenches, wire and other mechanism items.",
    get: "Find her bound in the Dungeon and talk to her to rescue her.",
    sells: { summary: "Everything for wiring.", items: ["Wire", "Actuator", "Red Wrench"] },
    use: "Needed for traps, switches, doors and any automated build.",
    fights: "Mechanic's Wrench" },
  party_girl: { name: "Party Girl", tag: "Party items", unlock: "Random after 20 other town NPCs",
    about: "Sells novelty items that make colorful effects.",
    get: "She has a 1/40 chance to move in once 20 other town NPCs are in the world.",
    sells: { summary: "Novelty items with colorful effects.", items: [] },
    use: "Mostly cosmetic fun for your town.",
    fights: "Happy Grenade" },

  // ---------- Hardmode ----------
  wizard: { name: "Wizard", tag: "Magic items", unlock: "Rescue him in the Cavern",
    about: "Sells magic-related items.",
    get: "Find him bound in the Cavern layer and rescue him. (The wiki lists him as a Hardmode NPC.)",
    sells: { summary: "Magic-related items.", items: [] },
    use: "A stop for magic users.",
    fights: "Ball of Fire" },
  tax_collector: { name: "Tax Collector", tag: "Collects taxes", unlock: "Cure a Tortured Soul in the Underworld",
    about: "Collects property taxes from your other NPCs.",
    get: "Use Purification Powder on a Tortured Soul in the Underworld. (He replaces the Guide in a Remix world.)",
    use: "He earns 50 copper for each NPC in your town, and you collect it by talking to him.",
    fights: "Classy Cane" },
  truffle: { name: "Truffle", tag: "Mushroom items", unlock: "Hardmode, with a mushroom house",
    about: "Sells the Autohammer, the Mushroom Spear and other mushroom-themed items.",
    get: "Have an open house in an above-ground Glowing Mushroom biome during Hardmode.",
    sells: { summary: "Mushroom-themed items.", items: ["Autohammer", "Mushroom Spear"] },
    use: "The Autohammer is his signature item.",
    fights: "Truffle Spore" },
  pirate: { name: "Pirate", tag: "Pirate items", unlock: "Beat a Pirate Invasion",
    about: "Sells the Cannon and other pirate-themed items.",
    get: "A Pirate Invasion has been defeated.",
    sells: { summary: "Cannons and pirate-themed items.", items: ["Cannon"] },
    use: "The invasion itself can rarely drop a Discount Card, which lowers shop prices.",
    fights: "Pirate Cannon" },
  steampunker: { name: "Steampunker", tag: "Clentaminator and jetpack", unlock: "Beat any mechanical boss",
    about: "Sells the Clentaminator, the Jetpack and other items.",
    get: "A mechanical boss has been defeated.",
    sells: { summary: "In a Corruption world she sells the Decay Chamber (and Purple Solution during a Blood Moon). In a Crimson world she sells the Flesh Cloning Vat (and Red Solution during a Blood Moon).", items: ["Clentaminator", "Jetpack", "Decay Chamber", "Flesh Cloning Vat"] },
    use: "The Clentaminator can clean or spread biomes using solutions.",
    fights: "Clockwork Assault Rifle" },
  cyborg: { name: "Cyborg", tag: "Rockets and mines", unlock: "Beat Plantera",
    about: "Sells the Proximity Mine Launcher, rockets and nanites.",
    get: "Plantera has been defeated.",
    sells: { summary: "Rockets, nanites and explosive launchers.", items: ["Proximity Mine Launcher", "Rocket I", "Nanites"] },
    use: "Late-game explosives and ammo.",
    fights: "Grenade, rocket and mine launchers" },
  santa: { name: "Santa Claus", tag: "Christmas items", unlock: "Beat the Frost Legion at Christmas",
    about: "Sells Christmas-themed vanity and novelty items.",
    get: "The Frost Legion has been defeated and it is Christmas.",
    sells: { summary: "Unique Christmas items.", items: [] },
    use: "A seasonal visitor for festive decor and outfits.",
    fights: "Christmas Ornament" },
  princess: { name: "Princess", tag: "Furniture and vanity", unlock: "Every other town NPC must be present",
    about: "Sells several vanity and furniture items.",
    get: "All other town NPCs are in the world (town pets and Santa Claus do not count).",
    sells: { summary: "Vanity and furniture items.", items: [] },
    use: "She moves in last, so she is needed for the Real Estate Agent achievement.",
    fights: "Resonance Scepter" },

  // ---------- Visitors and others ----------
  traveling_merchant: { name: "Traveling Merchant", tag: "Random stock, one day only", unlock: "Random morning visitor",
    about: "Stays until the evening and sells a different random selection of unique items each day.",
    get: "Each morning (4:30 AM to 12:00 PM) he has a 22.12% chance to show up once two other NPCs are present.",
    sells: { summary: "A random pick of unique items that changes every visit.", items: [] },
    use: "Check on every visit, since the stock changes.",
    fights: "Revolver (Pulse Bow in Hardmode)", noPylon: true },
  old_man: { name: "Old Man", tag: "Dungeon guardian", unlock: "Waits at the Dungeon entrance",
    about: "Stands at the entrance to the Dungeon.",
    get: "He is there when you start a new world.",
    use: "Talk to him at night to summon Skeletron. Once Skeletron is defeated, he moves into town as the Clothier." },
  skeleton_merchant: { name: "Skeleton Merchant", tag: "Moon-phase shop", unlock: "Rarely found in the Caverns",
    about: "Sells different items depending on the lunar cycle.",
    get: "Rarely found in the Cavern layer.",
    sells: { summary: "Stock depends on the moon phase. The Slap Hand can only be obtained from him.", items: ["Counterweight", "Spelunker Glowstick", "Magic Lantern", "Yoyo Glove", "Slap Hand"] },
    use: "Worth a trip whenever you run into him.",
    fights: "Thrown bones", noPylon: true },

  // ---------- Town pets ----------
  town_cat: { name: "Town Cat", ext: "gif", tag: "Zoologist pet", unlock: "Cat License from the Zoologist", pet: true,
    about: "A cat that wanders your town.",
    get: "Use a Cat License from the Zoologist. The cat appears at dawn (4:30 AM) the next day. Only one of each kind of pet can exist at a time.",
    sells: { summary: "Nothing to buy. The license comes from the Zoologist.", items: ["Cat License"] },
    use: "Cosmetic, but it counts as an NPC for pylon requirements and lowers enemy spawns." },
  town_dog: { name: "Town Dog", ext: "gif", tag: "Zoologist pet", unlock: "Dog License at 25% Bestiary", pet: true,
    about: "A dog that wanders your town.",
    get: "Use a Dog License, which the Zoologist sells once your Bestiary is 25% complete (137 entries). The dog appears at dawn the next day.",
    sells: { summary: "Nothing to buy. The license comes from the Zoologist.", items: ["Dog License"] },
    use: "Cosmetic, but it counts as an NPC for pylon requirements and lowers enemy spawns." },
  town_bunny: { name: "Town Bunny", ext: "gif", tag: "Zoologist pet", unlock: "Bunny License at 45% Bestiary", pet: true,
    about: "A bunny that wanders your town.",
    get: "Use a Bunny License, which the Zoologist sells once your Bestiary is 45% complete (246 entries). The bunny appears at dawn the next day.",
    sells: { summary: "Nothing to buy. The license comes from the Zoologist.", items: ["Bunny License"] },
    use: "Cosmetic, but it counts as an NPC for pylon requirements and lowers enemy spawns." },
  town_slimes: { name: "Town Slimes", img: "Town_Slimes", ext: "gif", tag: "Eight friendly slimes", unlock: "Each has its own unlock", pet: true,
    about: "Slime pets that move in once you meet each one's requirement. Unlike the Zoologist pets, all eight can live in your town at once.",
    get: "Each needs its own vacant house, and each has its own trigger (below).",
    list: [
      { name: "Squire Slime", text: "Drop a Copper Helmet or Copper Shortsword on a slime enemy." },
      { name: "Clumsy Slime", text: "Pop the balloon of a Clumsy Balloon Slime." },
      { name: "Nerdy Slime", text: "Defeat King Slime." },
      { name: "Surly Slime", text: "Fish one up during a Blood Moon." },
      { name: "Mystic Slime", text: "Use Purification Powder on a Mystic Frog in the Jungle." },
      { name: "Elder Slime", text: "Open an Old Shaking Chest with a Golden Key (it can appear in the Cavern after Skeletron is defeated)." },
      { name: "Cool Slime", text: "Can move in during a naturally occurring Party." },
      { name: "Diva Slime", text: "Throw a Sparkle Slime Balloon into Shimmer." },
    ],
    use: "Cosmetic companions for your town." },
};

const NPC_CATEGORIES = [
  { name: "Pre-Hardmode NPCs", icon: "🌱", desc: "18 NPCs you can meet before Hardmode",
    ids: ["guide", "merchant", "nurse", "demolitionist", "dye_trader", "angler", "zoologist", "dryad", "painter", "golfer", "arms_dealer", "tavernkeep", "stylist", "goblin_tinkerer", "witch_doctor", "clothier", "mechanic", "party_girl"] },
  { name: "Hardmode NPCs", icon: "🔥", desc: "8 NPCs that arrive in Hardmode",
    ids: ["wizard", "tax_collector", "truffle", "pirate", "steampunker", "cyborg", "santa", "princess"] },
  { name: "Visitors & Others", icon: "🧳", desc: "NPCs that don't move into houses",
    ids: ["traveling_merchant", "old_man", "skeleton_merchant"] },
  { name: "Town Pets", icon: "🐾", desc: "Cat, dog, bunny and the eight Town Slimes",
    ids: ["town_cat", "town_dog", "town_bunny", "town_slimes"] },
];

const NPC_MENU = NPC_CATEGORIES.map(cat => ({
  name: cat.name, icon: cat.icon, desc: cat.desc,
  children: cat.ids.map(id => ({ name: NPCS[id].name, icon: "🧑", desc: NPCS[id].unlock, npc: id })),
}));

function wikiImgUrl(name, ext = "png") {
  return `https://terraria.wiki.gg/images/${encodeURIComponent(name.replace(/ /g, "_"))}.${ext}`;
}

function npcPortraitCandidates(npc) {
  const fromData = NPC_BY_NAME[npc.name]?.img;
  const list = [
    fromData,
    fromData && fromData.endsWith(".gif") ? fromData.replace(/\.gif$/, ".png") : null,
    wikiImgUrl(npc.img || npc.name, npc.ext || "png"),
  ];
  return [...new Set(list.filter(Boolean))];
}

function renderNpc(id) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const npc = NPCS[id];
  if (!npc) {
    content.innerHTML = `<div class="timeline-soon">Coming soon</div>`;
    return;
  }

  const wrap = cmpEl("div", "cmp npc");

  // header: portrait, name, tagline
  const head = cmpEl("div", "npc-head");
  const ico = cmpEl("div", "npc-ico");
  const portrait = document.createElement("img");
  portrait.alt = npc.name;
  setImgWithFallbacks(portrait, npcPortraitCandidates(npc));
  ico.appendChild(portrait);
  head.appendChild(ico);
  head.appendChild(cmpEl("div", "npc-name", npc.name));
  head.appendChild(cmpEl("div", "cmp-tag", npc.tag));
  wrap.appendChild(head);

  const section = (label) => {
    const s = cmpEl("div", "cmp-section");
    s.appendChild(cmpEl("div", "cmp-label", label));
    wrap.appendChild(s);
    return s;
  };

  if (npc.about) section("About").appendChild(cmpEl("div", "npc-text", npc.about));
  if (npc.get) section(npc.pet ? "How to get it" : "How to get them").appendChild(cmpEl("div", "npc-text", npc.get));

  if (npc.list) {
    const s = section("The slimes");
    const rows = cmpEl("div", "npc-rows");
    for (const entry of npc.list) {
      const row = cmpEl("div", "npc-row");
      const rico = cmpEl("span", "cmp-ico");
      const img = document.createElement("img");
      img.alt = entry.name;
      setImgWithFallbacks(img, npcPortraitCandidates({ name: entry.name, ext: entry.name === "Diva Slime" ? "gif" : "png" }));
      rico.appendChild(img);
      row.appendChild(rico);
      const t = cmpEl("div", "cmp-text");
      t.appendChild(cmpEl("div", "cmp-name", entry.name));
      t.appendChild(cmpEl("div", "cmp-note", entry.text));
      row.appendChild(t);
      rows.appendChild(row);
    }
    s.appendChild(rows);
  }

  if (npc.sells) {
    const s = section(npc.pet ? "License" : "Sells");
    s.appendChild(cmpEl("div", "npc-text", npc.sells.summary));
    if (npc.sells.items.length) {
      const grid = cmpEl("div", "npc-items");
      for (const itemName of npc.sells.items) {
        const entry = { name: itemName, fallbackImg: wikiImgUrl(itemName) };
        const row = cmpEl("div", "cmp-item");
        const rico = cmpEl("span", "cmp-ico");
        const urls = compareImgCandidates(entry);
        if (urls.length) {
          const img = document.createElement("img");
          img.alt = itemName;
          img.loading = "lazy";
          setImgWithFallbacks(img, urls);
          rico.appendChild(img);
        }
        row.appendChild(rico);
        const t = cmpEl("div", "cmp-text");
        t.appendChild(cmpEl("div", "cmp-name", itemName));
        row.appendChild(t);
        row.addEventListener("click", () => openCompareEntry(entry, npc.name, "Sells"));
        grid.appendChild(row);
      }
      s.appendChild(grid);
      s.appendChild(cmpEl("div", "npc-note", "Highlights, not the full stock. Tap an item for details, or open the wiki page for the whole shop."));
    }
  }

  if (npc.use) section("Why you want them").appendChild(cmpEl("div", "npc-text", npc.use));
  if (npc.fights) section("Defends the town with").appendChild(cmpEl("div", "npc-text", npc.fights));

  if (npc.sells && !npc.noPylon && !npc.pet) {
    wrap.appendChild(cmpEl("div", "cmp-footnote", "Shop NPCs also sell Pylons when another NPC is nearby, and they all buy your spare items for 1/5 of the shop price."));
  }

  const linkWrap = cmpEl("div", "npc-linkwrap");
  const link = document.createElement("a");
  link.className = "npc-wiki";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "📖 Open Wiki Page";
  link.href = `https://terraria.wiki.gg/wiki/${encodeURIComponent((npc.wiki || npc.name).replace(/ /g, "_"))}`;
  linkWrap.appendChild(link);
  wrap.appendChild(linkWrap);

  content.appendChild(wrap);
}

// ============================================================
// ARMOR + CLASS PAGES
// defense = full-set total (set-bonus defense included, like the wiki's armor table).
// A [low, high] range means the total depends on which helmet you wear.
// cls: "any" = every class can use it, otherwise the classes it is built for.
// ============================================================
const ARMOR_STAGES = ["Pre-Hardmode", "Hardmode", "Post-Plantera", "Endgame"];

const ARMOR_SETS = {
  // ---------- Pre-Hardmode ----------
  wood:      { name: "Wood armor", stage: 0, def: 3,  cls: ["any"], bonus: "+1 defense", pieces: ["Wood Helmet", "Wood Breastplate", "Wood Greaves"] },
  boreal:    { name: "Boreal Wood armor", stage: 0, def: 4, cls: ["any"], bonus: "+1 defense", pieces: ["Boreal Wood Helmet", "Boreal Wood Breastplate", "Boreal Wood Greaves"] },
  palm:      { name: "Palm Wood armor", stage: 0, def: 4, cls: ["any"], bonus: "+1 defense", pieces: ["Palm Wood Helmet", "Palm Wood Breastplate", "Palm Wood Greaves"] },
  mahogany:  { name: "Rich Mahogany armor", stage: 0, def: 4, cls: ["any"], bonus: "+1 defense", pieces: ["Rich Mahogany Helmet", "Rich Mahogany Breastplate", "Rich Mahogany Greaves"] },
  ebon:      { name: "Ebonwood armor", stage: 0, def: 5, cls: ["any"], bonus: "+1 defense", pieces: ["Ebonwood Helmet", "Ebonwood Breastplate", "Ebonwood Greaves"] },
  shade:     { name: "Shadewood armor", stage: 0, def: 5, cls: ["any"], bonus: "+1 defense", pieces: ["Shadewood Helmet", "Shadewood Breastplate", "Shadewood Greaves"] },
  ash:       { name: "Ash Wood armor", stage: 0, def: 7, cls: ["any"], bonus: "Halves lava damage and the On Fire! debuff time", pieces: ["Ash Wood Helmet", "Ash Wood Breastplate", "Ash Wood Greaves"] },
  cactus:    { name: "Cactus armor", stage: 0, def: 3, cls: ["any"], bonus: "Thorns: enemies that hit you take damage back", pieces: ["Cactus Helmet", "Cactus Breastplate", "Cactus Leggings"] },
  copper:    { name: "Copper armor", stage: 0, def: 6, cls: ["any"], bonus: "+2 defense", pieces: ["Copper Helmet", "Copper Chainmail", "Copper Greaves"] },
  tin:       { name: "Tin armor", stage: 0, def: 7, cls: ["any"], bonus: "+2 defense", pieces: ["Tin Helmet", "Tin Chainmail", "Tin Greaves"] },
  iron:      { name: "Iron armor", stage: 0, def: 9, cls: ["any"], bonus: "+2 defense", pieces: ["Iron Helmet", "Iron Chainmail", "Iron Greaves"] },
  lead:      { name: "Lead armor", stage: 0, def: 11, cls: ["any"], bonus: "+3 defense", pieces: ["Lead Helmet", "Lead Chainmail", "Lead Greaves"] },
  silver:    { name: "Silver armor", stage: 0, def: 13, cls: ["any"], bonus: "+3 defense", pieces: ["Silver Helmet", "Silver Chainmail", "Silver Greaves"] },
  tungsten:  { name: "Tungsten armor", stage: 0, def: 15, cls: ["any"], bonus: "+3 defense", pieces: ["Tungsten Helmet", "Tungsten Chainmail", "Tungsten Greaves"] },
  gold:      { name: "Gold armor", stage: 0, def: 16, cls: ["any"], bonus: "+3 defense", pieces: ["Gold Helmet", "Gold Chainmail", "Gold Greaves"] },
  platinum:  { name: "Platinum armor", stage: 0, def: 20, cls: ["any"], bonus: "+4 defense", pieces: ["Platinum Helmet", "Platinum Chainmail", "Platinum Greaves"] },
  pumpkin:   { name: "Pumpkin armor", stage: 0, def: 7, cls: ["any"], bonus: "+10% damage", pieces: ["Pumpkin Helmet", "Pumpkin Breastplate", "Pumpkin Greaves"] },
  ninja:     { name: "Ninja armor", stage: 0, def: 9, cls: ["any"], bonus: "+20% movement speed", pieces: ["Ninja Hood", "Ninja Shirt", "Ninja Pants"] },
  fossil:    { name: "Fossil armor", stage: 0, def: 13, cls: ["ranged"], bonus: "20% chance not to use ammo", pieces: ["Fossil Helmet", "Fossil Plate", "Fossil Greaves"] },
  bee:       { name: "Bee armor", stage: 0, def: 13, cls: ["summoner"], bonus: "+10% summon damage", pieces: ["Bee Headgear", "Bee Breastplate", "Bee Greaves"] },
  obsidian:  { name: "Obsidian armor", stage: 0, def: 15, cls: ["summoner"], bonus: "More summon damage, whip range and whip speed", pieces: ["Obsidian Helm", "Obsidian Shirt", "Obsidian Pants"] },
  meteor:    { name: "Meteor armor", stage: 0, def: 16, cls: ["mage"], bonus: "Space Gun, Laser Rifle and Zapinators cost no mana", pieces: ["Meteor Helmet", "Meteor Suit", "Meteor Leggings"] },
  jungle:    { name: "Jungle armor", stage: 0, def: 17, cls: ["mage"], bonus: "-16% mana cost", pieces: ["Jungle Hat", "Jungle Shirt", "Jungle Pants"] },
  necro:     { name: "Necro armor", stage: 0, def: 19, cls: ["ranged"], bonus: "+10% ranged critical chance", pieces: ["Necro Helmet", "Necro Breastplate", "Necro Greaves"] },
  shadow:    { name: "Shadow armor", stage: 0, def: 19, cls: ["melee"], bonus: "Faster running speed", pieces: ["Shadow Helmet", "Shadow Scalemail", "Shadow Greaves"] },
  crimson:   { name: "Crimson armor", stage: 0, def: 19, cls: ["any"], bonus: "Greatly increased life regeneration", pieces: ["Crimson Helmet", "Crimson Scalemail", "Crimson Greaves"] },
  molten:    { name: "Molten armor", stage: 0, def: 25, cls: ["melee"], bonus: "+17% melee damage, immune to On Fire!", pieces: ["Molten Helmet", "Molten Breastplate", "Molten Greaves"] },

  // ---------- Hardmode ----------
  pearlwood: { name: "Pearlwood armor", stage: 1, def: 8, cls: ["any"], bonus: "+1 defense", pieces: ["Pearlwood Helmet", "Pearlwood Breastplate", "Pearlwood Greaves"] },
  spider:    { name: "Spider armor", stage: 1, def: 20, cls: ["summoner"], bonus: "+12% summon damage", pieces: ["Spider Mask", "Spider Breastplate", "Spider Greaves"] },
  forbidden: { name: "Forbidden armor", stage: 1, def: 26, cls: ["mage", "summoner"], bonus: "Double tap ▼ to call an ancient storm (costs mana)", pieces: ["Forbidden Mask", "Forbidden Robes", "Forbidden Treads"] },
  cobalt:    { name: "Cobalt armor", stage: 1, def: [21, 32], cls: ["any"], bonus: "Depends on the helmet you wear", pieces: ["Cobalt Hat", "Cobalt Helmet", "Cobalt Mask", "Cobalt Breastplate", "Cobalt Leggings"] },
  palladium: { name: "Palladium armor", stage: 1, def: [21, 32], cls: ["any"], bonus: "Rapid Healing after you hit an enemy", pieces: ["Palladium Mask", "Palladium Helmet", "Palladium Headgear", "Palladium Breastplate", "Palladium Leggings"] },
  mythril:   { name: "Mythril armor", stage: 1, def: [24, 37], cls: ["any"], bonus: "Depends on the helmet you wear", pieces: ["Mythril Hood", "Mythril Helmet", "Mythril Hat", "Mythril Chainmail", "Mythril Greaves"] },
  orichalcum:{ name: "Orichalcum armor", stage: 1, def: [27, 42], cls: ["any"], bonus: "Flower petals fire when you hit an enemy", pieces: ["Orichalcum Mask", "Orichalcum Helmet", "Orichalcum Headgear", "Orichalcum Breastplate", "Orichalcum Leggings"] },
  adamantite:{ name: "Adamantite armor", stage: 1, def: [32, 50], cls: ["any"], bonus: "Faster movement; the rest depends on the helmet", pieces: ["Adamantite Headgear", "Adamantite Helmet", "Adamantite Mask", "Adamantite Breastplate", "Adamantite Leggings"] },
  titanium:  { name: "Titanium armor", stage: 1, def: [30, 49], cls: ["any"], bonus: "Hitting enemies summons Titanium Shards that protect you", pieces: ["Titanium Mask", "Titanium Helmet", "Titanium Headgear", "Titanium Breastplate", "Titanium Leggings"] },
  crystal:   { name: "Crystal Assassin armor", stage: 1, def: 36, cls: ["any"], bonus: "Grants a dash", pieces: ["Crystal Assassin Hood", "Crystal Assassin Shirt", "Crystal Assassin Pants"] },
  frost:     { name: "Frost armor", stage: 1, def: 43, cls: ["melee", "ranged"], bonus: "Melee and ranged attacks inflict a frost debuff", pieces: ["Frost Helmet", "Frost Breastplate", "Frost Leggings"] },
  hallowed:  { name: "Hallowed armor", stage: 1, def: [27, 50], cls: ["any"], bonus: "Become immune after striking an enemy (Hood: +2 minions)", pieces: ["Hallowed Mask", "Hallowed Helmet", "Hallowed Headgear", "Hallowed Hood", "Hallowed Plate Mail", "Hallowed Greaves"] },

  // ---------- Post-Plantera ----------
  chlorophyte:{ name: "Chlorophyte armor", stage: 2, def: [33, 51], cls: ["any"], bonus: "A leaf crystal shoots nearby enemies (Mask: -5% damage taken, Visor: +2 minions)", pieces: ["Chlorophyte Mask", "Chlorophyte Helmet", "Chlorophyte Headgear", "Chlorophyte Visor", "Chlorophyte Plate Mail", "Chlorophyte Greaves"] },
  tiki:      { name: "Tiki armor", stage: 2, def: 35, cls: ["summoner"], bonus: "+1 minion and +20% whip range", pieces: ["Tiki Mask", "Tiki Shirt", "Tiki Pants"] },
  spooky:    { name: "Spooky armor", stage: 2, def: 30, cls: ["summoner"], bonus: "+25% summon damage", pieces: ["Spooky Helmet", "Spooky Breastplate", "Spooky Leggings"] },
  spectre:   { name: "Spectre armor", stage: 2, def: [30, 42], cls: ["mage"], bonus: "Hood: magic damage heals allies. Mask: magic hits hurt extra nearby enemies", pieces: ["Spectre Hood", "Spectre Mask", "Spectre Robe", "Spectre Pants"] },
  shroomite: { name: "Shroomite armor", stage: 2, def: 51, cls: ["ranged"], bonus: "Stand still to turn stealthy: more ranged damage, fewer enemies target you", pieces: ["Shroomite Headgear", "Shroomite Mask", "Shroomite Helmet", "Shroomite Breastplate", "Shroomite Leggings"] },
  turtle:    { name: "Turtle armor", stage: 2, def: 65, cls: ["melee"], bonus: "Attackers take damage back; 15% less damage taken", pieces: ["Turtle Helmet", "Turtle Scale Mail", "Turtle Leggings"] },
  beetle:    { name: "Beetle armor", stage: 2, def: [61, 73], cls: ["melee"], bonus: "Scale Mail: beetles boost melee damage and speed. Shell: beetles protect you", pieces: ["Beetle Helmet", "Beetle Scale Mail", "Beetle Shell", "Beetle Leggings"] },

  // ---------- Endgame (Lunar Events) ----------
  stardust:  { name: "Stardust armor", stage: 3, def: 38, cls: ["summoner"], bonus: "A stardust guardian protects you", pieces: ["Stardust Helmet", "Stardust Plate", "Stardust Leggings"] },
  nebula:    { name: "Nebula armor", stage: 3, def: 46, cls: ["mage"], bonus: "Magic hits drop buff boosters you can pick up", pieces: ["Nebula Helmet", "Nebula Breastplate", "Nebula Leggings"] },
  vortex:    { name: "Vortex armor", stage: 3, def: 62, cls: ["ranged"], bonus: "Double tap ▼ for stealth: more ranged damage, slower movement", pieces: ["Vortex Helmet", "Vortex Breastplate", "Vortex Leggings"] },
  solar:     { name: "Solar Flare armor", stage: 3, def: 78, cls: ["melee"], bonus: "-12% damage taken; solar shields let you dash and damage enemies", pieces: ["Solar Flare Helmet", "Solar Flare Breastplate", "Solar Flare Leggings"] },
};

// the number used for sorting and for the bar (a range counts by its best helmet)
function armorDefMax(set) { return Array.isArray(set.def) ? set.def[1] : set.def; }
function armorDefText(set) { return Array.isArray(set.def) ? `${set.def[0]}–${set.def[1]}` : String(set.def); }

const ARMOR_BAR_MAX = 80; // the strongest set (Solar Flare, 78) fills almost the whole bar

const CLASS_INFO = {
  melee: {
    name: "Melee", icon: "⚔️",
    tag: "Close range · highest defense",
    about: "Swords, spears, flails and yoyos. You fight up close, so you want the toughest armor and plenty of health.",
    stages: [
      { label: "Pre-Hardmode",
        sets: [["platinum", "Best plain metal set. Fine until you find something better."], ["shadow", "Corruption boss drops. Faster running."], ["crimson", "Crimson version of Shadow armor."], ["molten", "The best melee set before Hardmode."]],
        weapons: ["Blade of Grass", "Muramasa", "Fiery Greatsword", "Night's Edge", "Sunfury"] },
      { label: "Hardmode",
        sets: [["titanium", "Wear the Mask for melee."], ["adamantite", "Wear the Helmet for melee."], ["hallowed", "Wear the Mask for melee. Best defense of the ore-era sets."]],
        weapons: ["Cobalt Sword", "Mythril Halberd", "Excalibur", "True Night's Edge"] },
      { label: "Post-Plantera",
        sets: [["chlorophyte", "Wear the Mask for melee."], ["turtle", "Reflects damage back at attackers. Very tanky."], ["beetle", "Needs Beetle Husks (after Golem)."]],
        weapons: ["Chlorophyte Saber", "Terra Blade", "Flairon", "Influx Waver"] },
      { label: "Endgame",
        sets: [["solar", "The best melee set in the game."]],
        weapons: ["Solar Eruption", "Daybreak", "Meowmere", "Star Wrath", "Zenith"] },
    ],
  },
  ranged: {
    name: "Ranged", icon: "🏹",
    tag: "Long range · guns and bows",
    about: "Bows, guns and launchers. You stay back and shoot, and your ammo and crit chance matter most.",
    stages: [
      { label: "Pre-Hardmode",
        sets: [["platinum", "Best plain metal set. Fine until you find something better."], ["fossil", "Crafted from Fossil found in the Desert."], ["necro", "Dungeon drop."]],
        weapons: ["Minishark", "The Undertaker", "Phoenix Blaster", "Molten Fury", "Demon Bow"] },
      { label: "Hardmode",
        sets: [["titanium", "Wear the Helmet for ranged."], ["hallowed", "Wear the Helmet for ranged."], ["frost", "Dropped by the Frost Legion."]],
        weapons: ["Hallowed Repeater", "Daedalus Stormbow", "Clockwork Assault Rifle", "Megashark"] },
      { label: "Post-Plantera",
        sets: [["chlorophyte", "Wear the Helmet for ranged."], ["shroomite", "Stealth makes this the ranged set of choice."]],
        weapons: ["Chlorophyte Shotbow", "Tactical Shotgun", "Sniper Rifle", "Tsunami"] },
      { label: "Endgame",
        sets: [["vortex", "The best ranged set in the game."]],
        weapons: ["Phantasm", "Vortex Beater", "Celebration Mk2"] },
    ],
  },
  mage: {
    name: "Mage", icon: "🔮",
    tag: "Magic · uses mana",
    about: "Staves, tomes and wands powered by mana. Mana cost is your limit, so look for armor and accessories that cut it.",
    stages: [
      { label: "Pre-Hardmode",
        sets: [["platinum", "Best plain metal set. Fine until you find something better."], ["jungle", "Easy to make from Jungle materials."], ["meteor", "Great for the early game."]],
        weapons: ["Water Bolt", "Demon Scythe", "Space Gun", "Flower of Fire", "Vilethorn"] },
      { label: "Hardmode",
        sets: [["titanium", "Wear the Headgear for magic."], ["adamantite", "Wear the Headgear for magic."], ["hallowed", "Wear the Headgear for magic."], ["forbidden", "Works for both mage and summoner."]],
        weapons: ["Crystal Storm", "Golden Shower", "Rainbow Rod", "Frost Staff"] },
      { label: "Post-Plantera",
        sets: [["chlorophyte", "Wear the Headgear for magic."], ["spectre", "Hood to heal your team, Mask for extra damage."]],
        weapons: ["Razorblade Typhoon", "Staff of Earth", "Venom Staff", "Spectre Staff"] },
      { label: "Endgame",
        sets: [["nebula", "The best mage set in the game."]],
        weapons: ["Last Prism", "Nebula Blaze", "Nebula Arcanum", "Lunar Flare"] },
    ],
  },
  summoner: {
    name: "Summoner", icon: "🐝",
    tag: "Minions and whips",
    about: "You call minions to fight for you and use whips for backup. More minion slots means more damage, so armor that adds slots is gold.",
    stages: [
      { label: "Pre-Hardmode",
        sets: [["platinum", "Best plain metal set. Fine until you find something better."], ["bee", "Crafted from Bee Wax (Queen Bee)."], ["obsidian", "Boosts whip range and speed."]],
        weapons: ["Slime Staff", "Finch Staff", "Flinx Staff", "Imp Staff"] },
      { label: "Hardmode",
        sets: [["spider", "Crafted from Spider Fangs."], ["hallowed", "Wear the Hood for +2 minions."], ["forbidden", "Works for both mage and summoner."]],
        weapons: ["Optic Staff", "Spider Staff", "Pirate Staff", "Desert Tiger Staff"] },
      { label: "Post-Plantera",
        sets: [["chlorophyte", "Wear the Visor for +2 minions."], ["tiki", "Great if you use whips."], ["spooky", "From the Pumpkin Moon event."]],
        weapons: ["Pygmy Staff", "Xeno Staff"] },
      { label: "Endgame",
        sets: [["stardust", "The best summoner set in the game."]],
        weapons: ["Stardust Cell Staff", "Stardust Dragon Staff", "Terraprisma", "Kaleidoscope"] },
    ],
  },
};

const CLASS_MENU = Object.entries(CLASS_INFO).map(([key, c]) => ({
  name: c.name, icon: c.icon, desc: c.tag, klass: key,
}));

const ARMOR_SHIELD_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5 4.5 5v6.2c0 4.7 3.1 8.4 7.5 10.3 4.4-1.9 7.5-5.6 7.5-10.3V5L12 2.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

function armorPieceImgUrls(pieceName) {
  return [...new Set([ITEM_BY_NAME[pieceName]?.img, wikiImgUrl(pieceName)].filter(Boolean))];
}

function openArmorSet(set) {
  const pieces = set.pieces.filter(n => ITEM_BY_NAME[n]);
  const wikiTitle = set.name.replace(/ /g, "_");
  showInfoPopup({
    title: set.name.replace(/ armor$/, " Armor"),
    imgs: armorPieceImgUrls(set.pieces[Math.min(1, set.pieces.length - 1)]),
    setImgs: set.pieces.map(armorPieceImgUrls),
    heroImgs: [wikiImgUrl(set.name), wikiImgUrl(set.name + " female")],
    subtitle: `Armor set · ${ARMOR_STAGES[set.stage]} · ${armorDefText(set)} defense`,
    paragraph: set.bonus,
    lines: [],
    related: pieces,
    relatedLabel: "Armor pieces (click for crafting)",
    wikiUrl: `https://terraria.wiki.gg/wiki/${encodeURIComponent(wikiTitle)}`,
  });
}

// One armor row: name, piece icons, defense (with a bar), set bonus
function buildArmorRow(set, note) {
  const row = cmpEl("div", "arm-row");

  const name = cmpEl("div", "arm-name");
  name.appendChild(cmpEl("div", "arm-title", set.name));
  row.appendChild(name);

  const pieces = cmpEl("div", "arm-pieces");
  for (const p of set.pieces) {
    const img = document.createElement("img");
    img.alt = p;
    img.title = p;
    img.loading = "lazy";
    setImgWithFallbacks(img, armorPieceImgUrls(p));
    pieces.appendChild(img);
  }
  row.appendChild(pieces);

  const def = cmpEl("div", "arm-def");
  const shield = cmpEl("span", "arm-shield");
  shield.innerHTML = ARMOR_SHIELD_SVG;
  def.appendChild(shield);
  def.appendChild(cmpEl("span", "arm-num", armorDefText(set)));
  const bar = cmpEl("div", "arm-bar");
  const fill = cmpEl("div", "arm-bar-fill");
  fill.style.width = `${Math.min(100, Math.round(armorDefMax(set) / ARMOR_BAR_MAX * 100))}%`;
  if (Array.isArray(set.def)) {
    // the low end of the range shows as a darker part of the bar
    const low = cmpEl("div", "arm-bar-low");
    low.style.width = `${Math.round(set.def[0] / armorDefMax(set) * 100)}%`;
    fill.appendChild(low);
  }
  bar.appendChild(fill);
  def.appendChild(bar);
  row.appendChild(def);

  const bonus = cmpEl("div", "arm-bonus");
  bonus.appendChild(cmpEl("div", "arm-bonus-text", set.bonus));
  if (note) bonus.appendChild(cmpEl("div", "arm-note", note));
  row.appendChild(bonus);

  row.addEventListener("click", () => openArmorSet(set));
  return row;
}

function renderArmorAll() {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const wrap = cmpEl("div", "cmp arm");

  wrap.appendChild(cmpEl("div", "arm-legend", "Defense is the full set, including any defense from the set bonus. A range means it depends on which helmet you wear. Tap a set for its pieces."));

  ARMOR_STAGES.forEach((stageName, si) => {
    const sets = Object.values(ARMOR_SETS)
      .filter(s => s.stage === si)
      .sort((a, b) => armorDefMax(a) - armorDefMax(b));
    if (!sets.length) return;
    const section = cmpEl("div", "cmp-section");
    section.appendChild(cmpEl("div", "cmp-label", stageName));
    for (const set of sets) section.appendChild(buildArmorRow(set));
    wrap.appendChild(section);
  });

  content.appendChild(wrap);
}

function renderClass(key) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const info = CLASS_INFO[key];
  if (!info) {
    content.innerHTML = `<div class="timeline-soon">Coming soon</div>`;
    return;
  }
  const wrap = cmpEl("div", "cmp arm");

  const head = cmpEl("div", "npc-head");
  const clsIcon = cmpEl("div", "cls-icon", info.icon);
  head.appendChild(clsIcon);
  loadIconInto(clsIcon, MENU_ICONS[info.name]);
  head.appendChild(cmpEl("div", "npc-name", info.name));
  head.appendChild(cmpEl("div", "cmp-tag", info.tag));
  wrap.appendChild(head);
  wrap.appendChild(cmpEl("div", "npc-text cls-about", info.about));

  for (const stage of info.stages) {
    const section = cmpEl("div", "cmp-section");
    section.appendChild(cmpEl("div", "cmp-label", stage.label));

    section.appendChild(cmpEl("div", "cls-sub", "Armor"));
    for (const [id, note] of stage.sets) {
      if (ARMOR_SETS[id]) section.appendChild(buildArmorRow(ARMOR_SETS[id], note));
    }

    section.appendChild(cmpEl("div", "cls-sub", "Weapons"));
    const grid = cmpEl("div", "npc-items");
    for (const itemName of stage.weapons) {
      const entry = { name: itemName, fallbackImg: wikiImgUrl(itemName) };
      const row = cmpEl("div", "cmp-item");
      const rico = cmpEl("span", "cmp-ico");
      const urls = compareImgCandidates(entry);
      if (urls.length) {
        const img = document.createElement("img");
        img.alt = itemName;
        img.loading = "lazy";
        setImgWithFallbacks(img, urls);
        rico.appendChild(img);
      }
      row.appendChild(rico);
      const t = cmpEl("div", "cmp-text");
      t.appendChild(cmpEl("div", "cmp-name", itemName));
      row.appendChild(t);
      row.addEventListener("click", () => openCompareEntry(entry, info.name, stage.label));
      grid.appendChild(row);
    }
    section.appendChild(grid);
    wrap.appendChild(section);
  }

  wrap.appendChild(cmpEl("div", "cmp-footnote", "Weapons are highlights for each stage, not a full list. Tap any item or armor set for details."));
  content.appendChild(wrap);
}

// ============================================================
// BOSS PAGES (opened from the (i) button in a boss popup)
// summon: how to fight it · classic: normal-mode drops · bagOnly: only in the Treasure Bag (Expert/Master)
// bag: other things in the bag · master: relic + pet.  Items are "Name" or "Name|short note".
// Every boss can also drop its Mask and Trophy, so those are not listed one by one.
// ============================================================
const BOSS_DATA = {
  "King Slime": {
    tag: "Pre-Hardmode · optional",
    summon: "Use a Slime Crown, or wait for a Slime Rain and kill 150 slimes.",
    classic: ["Solidifier", "Lesser Healing Potion", "Slimy Saddle|Mount", "Ninja Hood|One of the ninja pieces", "Ninja Shirt", "Ninja Pants", "Slime Gun", "Slime Hook", "Slime Staff|Rare"],
    bagOnly: ["Royal Gel|Makes most slimes friendly"],
    bag: ["Solidifier", "Slimy Saddle|Mount", "Ninja Hood", "Ninja Shirt", "Ninja Pants", "Slime Gun", "Slime Hook", "Slime Staff|Rare"],
    master: ["King Slime Relic", "Royal Delight|Pet"],
  },
  "Eye of Cthulhu": {
    tag: "Pre-Hardmode",
    summon: "Use a Suspicious Looking Eye at night. He can also show up on his own once you have a few town NPCs.",
    classic: ["Shield of Cthulhu", "Demonite Ore|Corruption worlds", "Crimtane Ore|Crimson worlds", "Unholy Arrow|Corruption worlds", "Corrupt Seeds|Corruption worlds", "Crimson Seeds|Crimson worlds", "Lesser Healing Potion", "Binoculars|Rare"],
    bagOnly: ["Shield of Cthulhu|Dash into enemies"],
    bag: ["Demonite Ore|Corruption worlds", "Crimtane Ore|Crimson worlds", "Unholy Arrow|Corruption worlds", "Corrupt Seeds|Corruption worlds", "Crimson Seeds|Crimson worlds", "Binoculars|Rare"],
    master: ["Eye of Cthulhu Relic", "Suspicious Grinning Eye|Pet", "0x33's Aviators"],
  },
  "Eater of Worlds": {
    tag: "Pre-Hardmode · Corruption only",
    summon: "Break every third Shadow Orb, or use Worm Food in the Corruption.",
    classic: ["Demonite Ore", "Shadow Scale", "Lesser Healing Potion", "Eater's Bone|Pet, rare"],
    bagOnly: ["Worm Scarf|Take less damage"],
    bag: ["Demonite Ore", "Shadow Scale", "Eater's Bone|Pet, rare"],
    master: ["Eater of Worlds Relic", "Writhing Remains|Pet"],
  },
  "Brain of Cthulhu": {
    tag: "Pre-Hardmode · Crimson only",
    summon: "Break every third Crimson Heart, or use a Bloody Spine in the Crimson.",
    classic: ["Crimtane Ore", "Tissue Sample", "Lesser Healing Potion", "Bone Rattle|Pet, rare"],
    bagOnly: ["Brain of Confusion|Helps you dodge and confuses enemies"],
    bag: ["Crimtane Ore", "Tissue Sample", "Bone Rattle|Pet, rare"],
    master: ["Brain of Cthulhu Relic", "Brain in a Jar|Pet"],
  },
  "Queen Bee": {
    tag: "Pre-Hardmode",
    summon: "Break a Larva in a Bee Hive in the Underground Jungle, or use an Abeemination in the Jungle.",
    classic: ["Bee Wax", "Bottled Honey", "Beenade", "Bee Gun|One of three weapons", "Bee Keeper", "The Bee's Knees", "Hive Wand", "Honey Comb", "Nectar|Pet", "Honeyed Goggles|Pet", "Bee Headgear|Armor", "Bee Breastplate", "Bee Greaves"],
    bagOnly: ["Hive Pack|Stronger bees"],
    bag: ["Bee Wax", "Beenade", "Bee Gun|One of three weapons", "Bee Keeper", "The Bee's Knees", "Hive Wand", "Honey Comb", "Nectar|Pet", "Honeyed Goggles|Pet"],
    master: ["Queen Bee Relic", "Sparkling Honey|Pet"],
  },
  "Skeletron": {
    tag: "Pre-Hardmode · opens the Dungeon",
    summon: "Talk to the Old Man at the Dungeon entrance at night and pick Curse. After that you can use a Clothier Voodoo Doll.",
    classic: ["Healing Potion", "Skeletron Hand|Accessory", "Book of Skulls|Magic weapon"],
    bagOnly: ["Bone Glove|Throws bones at enemies"],
    bag: ["Skeletron Hand|Accessory", "Book of Skulls|Magic weapon"],
    master: ["Skeletron Relic", "Possessed Skull|Pet"],
  },
  "Deerclops": {
    tag: "Pre-Hardmode · winter boss",
    summon: "Use a Deer Thing in the Snow biome, or he may show up at midnight during a Blizzard.",
    classic: ["Healing Potion", "Pew-matic Horn|One of four weapons", "Weather Pain", "Houndius Shootius", "Lucy the Axe", "Eye Bone", "Eyebrella", "Radio Thing"],
    bagOnly: ["Bone Helm|Expert accessory"],
    bag: ["Pew-matic Horn|One of four weapons", "Weather Pain", "Houndius Shootius", "Lucy the Axe", "Eye Bone", "Eyebrella", "Radio Thing"],
    master: ["Deerclops Relic", "Deerclops Eyeball|Pet"],
  },
  "Wall of Flesh": {
    tag: "Pre-Hardmode · starts Hardmode",
    summon: "Throw a Guide Voodoo Doll into lava in the Underworld.",
    classic: ["Pwnhammer|Breaks Hallowed altars", "Breaker Blade|One of four weapons", "Clockwork Assault Rifle", "Laser Rifle", "Firecracker", "Warrior Emblem|One of four emblems", "Ranger Emblem", "Sorcerer Emblem", "Summoner Emblem", "Healing Potion"],
    bagOnly: ["Demon Heart|Extra accessory slot"],
    bag: ["Breaker Blade|One of four weapons", "Clockwork Assault Rifle", "Laser Rifle", "Firecracker", "Warrior Emblem|One of four emblems", "Ranger Emblem", "Sorcerer Emblem", "Summoner Emblem"],
    master: ["Wall of Flesh Relic", "Goat Skull|Mount"],
  },
  "Queen Slime": {
    tag: "Hardmode · optional",
    summon: "Use a Gelatin Crystal in the Hallow.",
    classic: ["Volatile Gelatin", "Crystal Assassin Hood|One of three armor pieces", "Crystal Assassin Shirt", "Crystal Assassin Pants", "Blade Staff", "Gelatinous Pillion|Mount", "Hook of Dissonance", "Sparkle Slime Balloon", "Greater Healing Potion"],
    bagOnly: [],
    bag: ["Crystal Assassin Hood|Armor pieces", "Crystal Assassin Shirt", "Crystal Assassin Pants", "Blade Staff", "Gelatinous Pillion|Mount", "Hook of Dissonance", "Greater Healing Potion"],
    master: ["Queen Slime Relic", "Regal Delicacy|Pet"],
  },
  "The Twins": {
    tag: "Hardmode · mechanical boss",
    summon: "Use a Mechanical Eye at night.",
    classic: ["Soul of Sight", "Hallowed Bar", "Greater Healing Potion"],
    bagOnly: ["Mechanical Wheel Piece|Part of the Mechanical Cart"],
    bag: ["Soul of Sight", "Hallowed Bar"],
    master: ["Twins Relic", "Pair of Eyeballs|Pet"],
  },
  "The Destroyer": {
    tag: "Hardmode · mechanical boss",
    summon: "Use a Mechanical Worm at night.",
    classic: ["Soul of Might", "Hallowed Bar", "Greater Healing Potion"],
    bagOnly: ["Mechanical Wagon Piece|Part of the Mechanical Cart"],
    bag: ["Soul of Might", "Hallowed Bar"],
    master: ["Destroyer Relic", "Deactivated Probe|Pet"],
  },
  "Skeletron Prime": {
    tag: "Hardmode · mechanical boss",
    summon: "Use a Mechanical Skull at night.",
    classic: ["Soul of Fright", "Hallowed Bar", "Greater Healing Potion"],
    bagOnly: ["Mechanical Battery Piece|Part of the Mechanical Cart"],
    bag: ["Soul of Fright", "Hallowed Bar"],
    master: ["Skeletron Prime Relic", "Robotic Skull|Pet"],
  },
  "Duke Fishron": {
    tag: "Hardmode · optional",
    summon: "Fish in the Ocean with a Truffle Worm as bait.",
    classic: ["Bubble Gun|One of the weapons", "Flairon", "Razorblade Typhoon", "Tempest Staff", "Tsunami", "Electric Eel", "Fishron Wings|Rare", "Shrimpy Truffle", "Greater Healing Potion"],
    bagOnly: [],
    bag: ["Bubble Gun|One of the weapons", "Flairon", "Razorblade Typhoon", "Tempest Staff", "Tsunami", "Electric Eel", "Fishron Wings|Rare", "Shrimpy Truffle"],
    master: ["Duke Fishron Relic", "Pork of the Sea|Pet"],
  },
  "Plantera": {
    tag: "Post-Mechanical Bosses",
    summon: "Destroy a Plantera's Bulb in the Underground Jungle after all three mechanical bosses are down.",
    classic: ["Temple Key|Opens the Jungle Temple", "Grenade Launcher|Always on the first kill", "Venus Magnum|One of the weapons", "Nettle Burst", "Leaf Blower", "Flower Pow", "Wasp Gun", "Seedler", "Pygmy Staff", "Thorn Hook", "The Axe|Rare", "Seedling|Pet, rare"],
    bagOnly: ["Spore Sac|Spores guard you"],
    bag: ["Temple Key|Opens the Jungle Temple", "Venus Magnum|One of the weapons", "Nettle Burst", "Leaf Blower", "Flower Pow", "Wasp Gun", "Seedler", "Pygmy Staff", "Thorn Hook", "The Axe|Rare", "Seedling|Pet, rare"],
    master: ["Plantera Relic", "Plantera Seedling|Pet"],
  },
  "Golem": {
    tag: "Post-Plantera",
    summon: "Use a Lihzahrd Power Cell on the Lihzahrd Altar in the Jungle Temple.",
    classic: ["Beetle Husk", "Stynger|One of the weapons", "Possessed Hatchet", "Sun Stone", "Eye of the Golem", "Heat Ray", "Staff of Earth", "Golem Fist", "Picksaw|Rare"],
    bagOnly: ["Shiny Stone|Fast life regen when standing still"],
    bag: ["Beetle Husk", "Stynger|One of the weapons", "Possessed Hatchet", "Sun Stone", "Eye of the Golem", "Heat Ray", "Staff of Earth", "Golem Fist", "Picksaw|Rare"],
    master: ["Golem Relic", "Guardian Golem|Pet"],
  },
  "Empress of Light": {
    tag: "Post-Plantera",
    summon: "Kill a Prismatic Lacewing in the Hallow (evening, surface).",
    classic: ["Nightglow|One of four weapons", "Starlight", "Kaleidoscope", "Eventide", "Prismatic Dye", "Empress Wings|Rare", "Stellar Tune|Rare", "Rainbow Cursor", "Terraprisma|Only if you fight her in daylight", "Greater Healing Potion"],
    bagOnly: ["Soaring Insignia|Infinite wing flight"],
    bag: ["Nightglow|One of four weapons", "Starlight", "Kaleidoscope", "Eventide", "Prismatic Dye", "Empress Wings|Rare", "Stellar Tune|Rare", "Rainbow Cursor", "Terraprisma|Only if you fight her in daylight"],
    master: ["Empress of Light Relic", "Jewel of Light|Pet"],
  },
  "Lunatic Cultist": {
    tag: "Post-Golem · triggers the Lunar Events",
    summon: "Defeat the cultists outside the Dungeon entrance after Golem is down.",
    classic: ["Ancient Manipulator|Crafting station", "Greater Healing Potion"],
    bagOnly: [],
    bag: ["Ancient Manipulator|Crafting station", "Greater Healing Potion"],
    master: ["Lunatic Cultist Relic", "Tablet Fragment|Pet"],
  },
  "Dark Mage": {
    tag: "Event boss · Old One's Army",
    summon: "Hold an Eternia Crystal and put it in an Eternia Crystal Stand to start Old One's Army. The Dark Mage shows up at the end of tiers 1 and 2.",
    classic: ["Apprentice's Scarf|Tier 1 gear", "Squire's Shield", "Dark Mage's Tome|Pet", "Gato Egg|Pet", "Dragon Egg|Pet", "War Table|Defense station"],
    bagOnly: [], bag: [],
    master: ["Dark Mage Relic"],
  },
  "Ogre": {
    tag: "Event boss · Old One's Army",
    summon: "Survive the waves of Old One's Army. The Ogre is the boss at the end of tiers 2 and 3.",
    classic: ["Huntress's Buckler", "Monk's Belt", "Brand of the Inferno|One of four weapons", "Sleepy Octopod", "Ghastly Glaive", "Tome of Infinite Wisdom", "Phantom Phoenix", "Creeper Egg|Pet", "Ogre's Club|Pet"],
    bagOnly: [], bag: [],
    master: ["Ogre Relic"],
  },
  "Betsy": {
    tag: "Event boss · Old One's Army tier 3",
    summon: "She is the boss at the end of tier 3 of Old One's Army, which needs Golem to be defeated first.",
    classic: ["Flying Dragon|One of four weapons", "Sky Dragon's Fury", "Aerial Bane", "Betsy's Wrath", "Betsy's Egg|Pet"],
    bagOnly: [],
    bag: ["Flying Dragon|One of four weapons", "Sky Dragon's Fury", "Aerial Bane", "Betsy's Wrath"],
    master: ["Betsy Relic"],
  },
  "Flying Dutchman": {
    tag: "Event boss · Pirate Invasion",
    summon: "He appears while a Pirate Invasion is going on in Hardmode. Pirate Invasions start after a Goblin Army is defeated, or by using a Pirate Map.",
    classic: ["Cutlass", "Discount Card", "Lucky Coin", "Coin Gun", "Pirate Staff", "Gold Ring", "The Black Spot|Pet"],
    bagOnly: [], bag: [],
    master: ["Flying Dutchman Relic"],
  },
  "Mourning Wood": {
    tag: "Event boss · Pumpkin Moon",
    summon: "Use a Pumpkin Moon Medallion at night after Plantera is defeated, then survive the early waves.",
    classic: ["Spooky Wood", "Spooky Twig|Pet", "Stake Launcher", "Stake", "Cursed Sapling|Pet", "Necromantic Scroll|Accessory", "Witch's Broom|Mount", "Hexxed Branch|Pet"],
    bagOnly: [], bag: [],
    master: ["Mourning Wood Relic"],
  },
  "Pumpking": {
    tag: "Event boss · Pumpkin Moon",
    summon: "Use a Pumpkin Moon Medallion at night after Plantera is defeated. The Pumpking arrives in the later waves.",
    classic: ["Candy Corn Rifle|One of the weapons", "Candy Corn", "Jack 'O Lantern Launcher", "Explosive Jack 'O Lantern", "Bat Scepter", "Raven Staff", "The Horseman's Blade", "Dark Harvest", "Spider Egg|Pet", "Black Fairy Dust|Pet", "Pumpkin Scented Candle|Pet"],
    bagOnly: [], bag: [],
    master: ["Pumpking Relic"],
  },
  "Everscream": {
    tag: "Event boss · Frost Moon",
    summon: "Use a Naughty Present at night after Plantera is defeated to start the Frost Moon, then survive the early waves.",
    classic: ["Christmas Tree Sword", "Razorpine", "Shrub Star|Pet"],
    bagOnly: [], bag: [],
    master: ["Everscream Relic"],
  },
  "Santa-NK1": {
    tag: "Event boss · Frost Moon",
    summon: "Use a Naughty Present at night after Plantera is defeated. Santa-NK1 comes in the middle waves of the Frost Moon.",
    classic: ["Elf Melter", "Chain Gun", "Toy Tank|Pet"],
    bagOnly: [], bag: [],
    master: ["Santa-NK1 Relic"],
  },
  "Ice Queen": {
    tag: "Event boss · Frost Moon",
    summon: "Use a Naughty Present at night after Plantera is defeated. The Ice Queen is the toughest enemy of the Frost Moon, in the later waves.",
    classic: ["Blizzard Staff", "Snowman Cannon", "North Pole", "Reindeer Bells|Mount", "Baby Grinch's Mischief Whistle|Pet", "Frozen Crown|Pet"],
    bagOnly: [], bag: [],
    master: ["Ice Queen Relic"],
  },
  "Martian Saucer": {
    tag: "Event boss · Martian Madness",
    summon: "Martian Madness can start at random after Golem is defeated, when a Martian Probe spots you. The Saucer is the final target of the event.",
    classic: ["Greater Healing Potion", "Xeno Staff", "Laser Machinegun", "Electrosphere Launcher", "Xenopopper", "Influx Waver", "Cosmic Car Key|Mount", "Cosmic Skateboard|Mount"],
    bagOnly: [], bag: [],
    master: ["Martian Saucer Relic"],
  },
  "Mothron": {
    tag: "Event boss · Solar Eclipse",
    summon: "Appears during a Solar Eclipse once Plantera has been defeated.",
    classic: ["Broken Hero Sword|Used to craft the Terra Blade", "The Eye of Cthulhu|Yoyo"],
    bagOnly: [], bag: [],
    master: [],
  },
  "Dreadnautilus": {
    tag: "Mini-boss · Blood Moon",
    summon: "Appears during a Blood Moon in Hardmode, in the water.",
    classic: ["Sanguine Staff|Summon weapon", "Bloody Tear|Summons a Blood Moon", "Chum Bucket"],
    bagOnly: [], bag: [],
    master: [],
  },
  "Moon Lord": {
    tag: "Final boss",
    summon: "Defeat all four Celestial Pillars, or use a Celestial Sigil.",
    classic: ["Luminite", "Super Healing Potion", "Portal Gun", "Meowmere|Two of the weapons", "Terrarian", "Star Wrath", "S.D.M.G.", "Celebration Mk2", "Last Prism", "Lunar Flare", "Rainbow Crystal Staff", "Lunar Portal Staff", "Suspicious Looking Tentacle|Pet"],
    bagOnly: ["Gravity Globe|Flip gravity"],
    bag: ["Luminite", "Meowmere|Two of the weapons", "Terrarian", "Star Wrath", "S.D.M.G.", "Celebration Mk2", "Last Prism", "Lunar Flare", "Rainbow Crystal Staff", "Lunar Portal Staff", "Suspicious Looking Tentacle|Pet"],
    master: ["Moon Lord Relic", "Piece of Moon Squid|Pet"],
  },
};

function bossEntry(raw, extra = {}) {
  const [name, note] = raw.split("|");
  return { name, note: note || "", fallbackImg: wikiImgUrl(name), ...extra };
}

function bossItemRow(entry, sideName, label) {
  const row = cmpEl("div", "cmp-item");
  const ico = cmpEl("span", "cmp-ico");
  const urls = compareImgCandidates(entry);
  if (urls.length) {
    const img = document.createElement("img");
    img.alt = entry.name;
    img.loading = "lazy";
    setImgWithFallbacks(img, urls);
    ico.appendChild(img);
  }
  row.appendChild(ico);
  const text = cmpEl("div", "cmp-text");
  text.appendChild(cmpEl("div", "cmp-name", entry.name));
  if (entry.noteNode) { const nn = cmpEl("div", "cmp-note"); nn.appendChild(entry.noteNode); text.appendChild(nn); }
  else if (entry.note) text.appendChild(cmpEl("div", "cmp-note", entry.note));
  row.appendChild(text);
  row.addEventListener("click", () => openCompareEntry(entry, sideName, label));
  return row;
}

// ---------- Biome page ----------
// ---------- Bestiary ----------
let _dropsByEnemy = null;
function dropsByEnemy() {
  if (_dropsByEnemy) return _dropsByEnemy;
  _dropsByEnemy = {};
  for (const [item, d] of Object.entries(ITEM_DETAILS)) {
    for (const x of (d.drops || [])) {
      if (!x.enemy) continue;
      (_dropsByEnemy[x.enemy] = _dropsByEnemy[x.enemy] || []).push({ item, rate: x.rate || "", pct: parseFloat(x.percent) || 0 });
    }
  }
  for (const list of Object.values(_dropsByEnemy)) list.sort((p, q) => q.pct - p.pct);
  return _dropsByEnemy;
}

function beastImgs(npc) {
  const gif = npc.img || "";
  return [...new Set([gif, gif.replace(/\.gif$/, ".png"), wikiImgUrl(npc.Name, "png")].filter(Boolean))];
}

function openBeast(name) {
  timelinePath.push(BOSS_DATA[name] ? { name, boss: name } : { name, beast: name });
  showTimelineLevel();
}

function renderBestiary() {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const all = Object.values(NPC_BY_NAME).filter(n => n.Type !== "Town NPC").sort((p, q) => p.Name.localeCompare(q.Name));
  const wrap = cmpEl("div", "cmp bestiary");
  const head = cmpEl("div", "npc-head");
  const ico = cmpEl("div", "cls-icon", "📕");
  loadIconInto(ico, "Lifeform Analyzer");
  head.appendChild(ico);
  head.appendChild(cmpEl("div", "npc-name", "Bestiary"));
  head.appendChild(cmpEl("div", "cmp-tag", `${all.length} creatures`));
  wrap.appendChild(head);

  const bar = cmpEl("div", "bst-bar");
  const input = document.createElement("input");
  input.type = "text"; input.className = "bst-search"; input.placeholder = "Search the bestiary...";
  bar.appendChild(input);
  const pills = cmpEl("div", "bst-pills");
  let kind = "All";
  const kinds = [["All", "All"], ["Enemy", "Enemies"], ["Critter", "Critters"], ["Boss", "Bosses"]];
  const pillEls = kinds.map(([k, label]) => {
    const b = cmpEl("button", "bst-pill", label);
    b.addEventListener("click", () => { kind = k; refresh(); });
    pills.appendChild(b);
    return [k, b];
  });
  bar.appendChild(pills);
  wrap.appendChild(bar);

  const grid = cmpEl("div", "bst-grid");
  wrap.appendChild(grid);
  const empty = cmpEl("div", "bst-empty", "Nothing matches that search.");
  wrap.appendChild(empty);

  function refresh() {
    for (const [k, b] of pillEls) b.classList.toggle("active", k === kind);
    const q = input.value.trim().toLowerCase();
    const list = all.filter(n => (kind === "All" || n.Type === kind) && (!q || n.Name.toLowerCase().includes(q)));
    grid.innerHTML = "";
    for (const n of list) {
      const card = cmpEl("div", "bst-card");
      const im = cmpEl("span", "bst-ico");
      const img = document.createElement("img");
      img.alt = n.Name; img.loading = "lazy";
      setImgWithFallbacks(img, beastImgs(n));
      im.appendChild(img);
      card.appendChild(im);
      card.appendChild(cmpEl("span", "bst-name", n.Name));
      card.addEventListener("click", () => openBeast(n.Name));
      grid.appendChild(card);
    }
    empty.style.display = list.length ? "none" : "";
  }
  input.addEventListener("input", refresh);
  refresh();
  content.appendChild(wrap);
}

function renderBeast(name) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const npc = NPC_BY_NAME[name];
  if (!npc) { content.innerHTML = `<div class="timeline-soon">Coming soon</div>`; return; }
  const wrap = cmpEl("div", "cmp biome beast");
  const head = cmpEl("div", "npc-head");
  const ico = cmpEl("div", "npc-ico");
  const img = document.createElement("img");
  img.alt = name;
  setImgWithFallbacks(img, beastImgs(npc));
  ico.appendChild(img);
  head.appendChild(ico);
  head.appendChild(cmpEl("div", "npc-name", name));
  head.appendChild(cmpEl("div", "cmp-tag", { Enemy: "Enemy", Critter: "Critter", Boss: "Boss" }[npc.Type] || npc.Type));
  wrap.appendChild(head);

  const drops = dropsByEnemy()[name] || [];
  const s = cmpEl("div", "cmp-section");
  s.appendChild(cmpEl("div", "cmp-label", drops.length ? `Drops (${drops.length})` : "Drops"));
  if (drops.length) {
    s.appendChild(iconColumn(drops.map(d => ({
      name: d.item, right: d.rate, img: compareImgCandidates({ name: d.item }),
      click: ITEM_BY_NAME[d.item] ? () => openChoiceModal(ITEM_BY_NAME[d.item]) : null,
    }))));
    s.appendChild(cmpEl("div", "cmp-footnote", "Gold numbers are Expert Mode rates. Tap an item for its crafting and details."));
  } else {
    s.appendChild(cmpEl("div", "npc-text", "No tracked item drops for this one."));
  }
  wrap.appendChild(s);

  const linkWrap = cmpEl("div", "npc-linkwrap");
  const link = document.createElement("a");
  link.className = "npc-wiki"; link.target = "_blank"; link.rel = "noopener noreferrer";
  link.textContent = "📖 Open Wiki Page";
  link.href = `https://terraria.wiki.gg/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`;
  linkWrap.appendChild(link);
  wrap.appendChild(linkWrap);
  content.appendChild(wrap);
}

function renderEvent(name) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const e = EVENTS[name];
  if (!e) { content.innerHTML = `<div class="timeline-soon">Coming soon</div>`; return; }
  const wrap = cmpEl("div", "cmp biome event");

  const head = cmpEl("div", "npc-head");
  const ico = cmpEl("div", "npc-ico");
  const img = document.createElement("img");
  img.alt = name;
  setImgWithFallbacks(img, iconCandidates(e.icon || e.iconNpc));
  ico.appendChild(img);
  head.appendChild(ico);
  head.appendChild(cmpEl("div", "npc-name", name));
  head.appendChild(cmpEl("div", "cmp-tag", e.tag));
  wrap.appendChild(head);

  const s1 = cmpEl("div", "cmp-section");
  s1.appendChild(cmpEl("div", "cmp-label", "How it starts"));
  s1.appendChild(cmpEl("div", "npc-text", e.start));
  if (e.where) s1.appendChild(cmpEl("div", "npc-text", e.where));
  wrap.appendChild(s1);

  if (e.enemies.length) {
    const s2 = cmpEl("div", "cmp-section");
    s2.appendChild(cmpEl("div", "cmp-label", "Who attacks"));
    const eg = cmpEl("div", "npc-items");
    for (const raw of e.enemies) eg.appendChild(bossItemRow(bossEntry(raw), name, "Enemy"));
    s2.appendChild(eg);
    wrap.appendChild(s2);
  }
  if (e.items.length) {
    const s3 = cmpEl("div", "cmp-section");
    s3.appendChild(cmpEl("div", "cmp-label", "What you can get"));
    const ig = cmpEl("div", "npc-items");
    for (const raw of e.items) ig.appendChild(bossItemRow(bossEntry(raw), name, "Reward"));
    s3.appendChild(ig);
    wrap.appendChild(s3);
  }
  if (e.tip) {
    const s4 = cmpEl("div", "cmp-section");
    s4.appendChild(cmpEl("div", "cmp-label", "Good to know"));
    s4.appendChild(cmpEl("div", "npc-text", e.tip));
    wrap.appendChild(s4);
  }
  wrap.appendChild(cmpEl("div", "cmp-footnote", "Highlights, not a full list. Tap any item for its crafting and details."));
  const linkWrap = cmpEl("div", "npc-linkwrap");
  const link = document.createElement("a");
  link.className = "npc-wiki"; link.target = "_blank"; link.rel = "noopener noreferrer";
  link.textContent = "📖 Open Wiki Page";
  link.href = `https://terraria.wiki.gg/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`;
  linkWrap.appendChild(link);
  wrap.appendChild(linkWrap);
  content.appendChild(wrap);
}

function renderBiome(key) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const b = BIOMES[key];
  if (!b) { content.innerHTML = `<div class="timeline-soon">Coming soon</div>`; return; }
  const wrap = cmpEl("div", "cmp biome");

  const head = cmpEl("div", "npc-head");
  const ico = cmpEl("div", "npc-ico");
  const img = document.createElement("img");
  img.alt = b.name;
  setImgWithFallbacks(img, iconCandidates(b.iconItem));
  ico.appendChild(img);
  head.appendChild(ico);
  head.appendChild(cmpEl("div", "npc-name", b.name));
  head.appendChild(cmpEl("div", "cmp-tag", b.tag));
  wrap.appendChild(head);

  const s1 = cmpEl("div", "cmp-section");
  s1.appendChild(cmpEl("div", "cmp-label", "Where to find it"));
  s1.appendChild(cmpEl("div", "npc-text", b.where));
  wrap.appendChild(s1);

  const s2 = cmpEl("div", "cmp-section");
  s2.appendChild(cmpEl("div", "cmp-label", "Who lives here"));
  const eg = cmpEl("div", "npc-items");
  for (const raw of b.enemies) eg.appendChild(bossItemRow(bossEntry(raw), b.name, "Found here"));
  s2.appendChild(eg);
  wrap.appendChild(s2);

  const s3 = cmpEl("div", "cmp-section");
  s3.appendChild(cmpEl("div", "cmp-label", "What you can get here"));
  const ig = cmpEl("div", "npc-items");
  for (const raw of b.items) ig.appendChild(bossItemRow(bossEntry(raw), b.name, "Found here"));
  s3.appendChild(ig);
  wrap.appendChild(s3);

  if (b.tip) {
    const s4 = cmpEl("div", "cmp-section");
    s4.appendChild(cmpEl("div", "cmp-label", "Good to know"));
    s4.appendChild(cmpEl("div", "npc-text", b.tip));
    wrap.appendChild(s4);
  }
  wrap.appendChild(cmpEl("div", "cmp-footnote", "Highlights, not a full list. Tap any item for its crafting and details."));

  const linkWrap = cmpEl("div", "npc-linkwrap");
  const link = document.createElement("a");
  link.className = "npc-wiki"; link.target = "_blank"; link.rel = "noopener noreferrer";
  link.textContent = "📖 Open Wiki Page";
  link.href = `https://terraria.wiki.gg/wiki/${encodeURIComponent(b.name.split(" & ")[0].replace(/ /g, "_"))}`;
  linkWrap.appendChild(link);
  wrap.appendChild(linkWrap);
  content.appendChild(wrap);
}


function renderModifiers() {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const wrap = cmpEl("div", "cmp mods");
  const head = cmpEl("div", "npc-head");
  const ico = cmpEl("div", "cls-icon", "✨");
  loadIconInto(ico, "Tinkerer's Workshop");
  head.appendChild(ico);
  head.appendChild(cmpEl("div", "npc-name", "Modifiers"));
  head.appendChild(cmpEl("div", "cmp-tag", "Prefixes that change an item's stats"));
  wrap.appendChild(head);

  const how = cmpEl("div", "cmp-section");
  how.appendChild(cmpEl("div", "cmp-label", "How you get one"));
  for (const t of [
    "About 3 in 4 new weapons, tools and accessories get a random modifier when they are made, found or dropped.",
    "If the first roll is a bad one (Broken, Dull, Slow and so on), there is a 2 in 3 chance it is thrown away and the item stays plain. Accessories never roll bad modifiers.",
    "Armor, ammo, vanity items and stackable items cannot have modifiers. Fished items, Presents and Angler rewards start without one.",
    "Reforging at the Goblin Tinkerer costs a third of the item's buy price. Every modifier that fits the item has the same chance, and bad ones are not filtered out.",
  ]) how.appendChild(cmpEl("div", "mod-bullet", t));
  wrap.appendChild(how);

  for (const key of ["universal", "common", "melee", "ranged", "magic", "summon", "accessory"]) {
    const g = MODIFIERS[key];
    const pool = MODIFIER_POOLS[key].reduce((n, k) => n + MODIFIERS[k].list.length, 0);
    const pct = Math.round(1000 / pool) / 10;
    const sec = cmpEl("div", "cmp-section");
    sec.appendChild(cmpEl("div", "cmp-label", g.name));
    sec.appendChild(cmpEl("div", "mod-note", `${g.note}. When reforging${key === "universal" || key === "common" ? " a sword" : ""}, each one is about ${pct}% (1 in ${pool}).`));
    const list = cmpEl("div", "mod-list");
    for (const [name, effect, tier] of g.list) {
      const row = cmpEl("div", "mod-row " + (tier < 0 ? "bad" : tier > 0 ? "good" : "meh"));
      row.appendChild(cmpEl("span", "mod-name", name));
      row.appendChild(cmpEl("span", "mod-effect", effect));
      list.appendChild(row);
    }
    sec.appendChild(list);
    wrap.appendChild(sec);
  }

  const best = cmpEl("div", "cmp-section");
  best.appendChild(cmpEl("div", "cmp-label", "Best modifier to aim for"));
  const bl = cmpEl("div", "mod-list");
  for (const [what, mod] of MODIFIER_BEST) {
    const row = cmpEl("div", "mod-row good");
    row.appendChild(cmpEl("span", "mod-name", mod));
    row.appendChild(cmpEl("span", "mod-effect", what));
    bl.appendChild(row);
  }
  best.appendChild(bl);
  wrap.appendChild(best);
  wrap.appendChild(cmpEl("div", "cmp-footnote", "Green is better than none, red is worse, grey is a trade-off. Chances are approximate."));
  content.appendChild(wrap);
}

// a line of text with tiny station pictures in front of each name: [icon] Placed Bottle / [icon] Alchemy Table
function stationInline(names) {
  const sp = document.createElement("span");
  names.forEach((n, i) => {
    if (i) sp.appendChild(document.createTextNode(" / "));
    const w = document.createElement("span");
    w.className = "inline-ico-name";
    const img = document.createElement("img");
    img.alt = "";
    setImgWithFallbacks(img, stationImgCandidates(n));
    w.appendChild(img);
    w.appendChild(document.createTextNode(n));
    sp.appendChild(w);
  });
  return sp;
}

// ingredients of the first recipe as plain inline text: 2 [icon] Gel + [icon] Mushroom
function recipeInline(name) {
  const v = (RECIPES[name] || [])[0];
  if (!v) return null;
  const line = document.createElement("div");
  line.className = "pot-ing";
  (v.ingredients || []).forEach((i, k) => {
    if (k) line.appendChild(document.createTextNode(" + "));
    const w = document.createElement("span");
    w.className = "inline-ico-name";
    const img = document.createElement("img");
    img.alt = "";
    setImgWithFallbacks(img, iconCandidates(i.item));
    w.appendChild(img);
    w.appendChild(document.createTextNode((i.qty > 1 ? i.qty + " " : "") + i.item));
    line.appendChild(w);
  });
  return line;
}

function stationsOf(name) {
  const out = [];
  for (const v of (RECIPES[name] || [])) for (const s of String(v.station || "").split(/\s*\/\s*/)) if (s && !/^(none|by hand)$/i.test(s) && !out.includes(s)) out.push(s);
  return out;
}

function renderHerbs() {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const wrap = cmpEl("div", "cmp herbs");
  const head = cmpEl("div", "npc-head");
  head.appendChild(cmpEl("div", "cls-icon", "🌿"));
  head.appendChild(cmpEl("div", "npc-name", "Herbs & Plants"));
  head.appendChild(cmpEl("div", "cmp-tag", "The seven herbs used in potions"));
  wrap.appendChild(head);
  wrap.appendChild(cmpEl("div", "npc-text cls-about", "Herbs only give you their best harvest while they are in bloom. You can also plant their Seeds in a Clay Pot or Planter Box so they are close to your Alchemy Table."));

  for (const h of HERBS) {
    const sec = cmpEl("div", "cmp-section herb-card");
    sec.appendChild(bossItemRow(bossEntry(h.name), "Herbs", "Herb"));
    const facts = cmpEl("div", "herb-facts");
    facts.appendChild(cmpEl("div", "", `Grows on: ${h.grows}`));
    facts.appendChild(cmpEl("div", "", `Blooms: ${h.blooms}`));
    // potions that use this herb
    const makes = [];
    for (const [out, variants] of Object.entries(RECIPES)) {
      if (!variants.some(v => (v.ingredients || []).some(i => i.item === h.name))) continue;
      const c = classifyItem(out);
      if (c.cat === "potion" && c.sub !== "food") makes.push(out);
    }
    facts.appendChild(cmpEl("div", "", `Plant the seeds in: Clay Pot, Planter Box or on ${h.grows.split(" (")[0].toLowerCase()}`));
    sec.appendChild(facts);
    if (makes.length) {
      const used = cmpEl("div", "herb-used");
      used.appendChild(cmpEl("div", "herb-used-label", "Used in"));
      const list = cmpEl("div", "mini-list");
      for (const m of makes.slice(0, 14)) list.appendChild(miniItem(m));
      if (makes.length > 14) list.appendChild(cmpEl("span", "mini-station", `and ${makes.length - 14} more`));
      used.appendChild(list);
      sec.appendChild(used);
      const brew = cmpEl("div", "herb-brew");
      brew.appendChild(document.createTextNode("Brew at "));
      brew.appendChild(stationInline(["Placed Bottle", "Alchemy Table"]));
      sec.appendChild(brew);
    }
    const seedRow = bossItemRow(bossEntry(h.seeds + "|Plant it to grow more"), "Herbs", "Seeds");
    seedRow.classList.add("herb-seed");
    sec.appendChild(seedRow);
    wrap.appendChild(sec);
  }
  content.appendChild(wrap);
}

function renderPotions(kind) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const titles = { heal: "Healing & Mana", buff: "Buff Potions", flask: "Flasks" };
  const blurbs = {
    heal: "Healing potions restore health and mana potions restore mana. Higher tiers are brewed from better ingredients.",
    buff: "Buff potions give a temporary bonus. Most are brewed at an Alchemy Table from Bottled Water and herbs.",
    flask: "Flasks coat your melee weapons and arrows with an effect for a while. They are crafted at an Alchemy Table or Imbuing Station.",
  };
  const list = ITEMS.filter(it => {
    const c = classifyItem(it.name);
    if (c.cat !== "potion") return false;
    const isFlask = /(^|\s)Flask\b/.test(it.name);
    if (kind === "flask") return isFlask;
    if (isFlask) return false;
    if (kind === "heal") return c.sub === "healing" || c.sub === "mana";
    return c.sub === "buff";
  }).sort((a, b) => a.id - b.id);

  const wrap = cmpEl("div", "cmp potions");
  const head = cmpEl("div", "npc-head");
  head.appendChild(cmpEl("div", "cls-icon", kind === "flask" ? "🫙" : "🧪"));
  head.appendChild(cmpEl("div", "npc-name", titles[kind]));
  head.appendChild(cmpEl("div", "cmp-tag", `${list.length} items`));
  wrap.appendChild(head);
  wrap.appendChild(cmpEl("div", "npc-text cls-about", blurbs[kind]));
  const grid = cmpEl("div", "pot-list");
  for (const it of list) {
    const row = cmpEl("div", "pot-row");
    const ico = cmpEl("span", "pot-ico");
    const img = document.createElement("img");
    img.alt = it.name; img.loading = "lazy";
    setImgWithFallbacks(img, compareImgCandidates({ name: it.name, fallbackImg: wikiImgUrl(it.name) }));
    ico.appendChild(img);
    row.appendChild(ico);
    const txt = cmpEl("div", "pot-text");
    txt.appendChild(cmpEl("div", "pot-name", it.name));
    const ing = recipeInline(it.name);
    if (ing) {
      txt.appendChild(ing);
      const st = stationsOf(it.name);
      if (st.length) { const s = cmpEl("div", "pot-station"); s.appendChild(document.createTextNode("Brew at ")); s.appendChild(stationInline(st)); txt.appendChild(s); }
    } else txt.appendChild(cmpEl("div", "pot-station", "Not crafted. Found or bought instead."));
    row.appendChild(txt);
    row.addEventListener("click", () => openCompareEntry({ name: it.name }, titles[kind], "Potion"));
    grid.appendChild(row);
  }
  wrap.appendChild(grid);
  content.appendChild(wrap);
}

function renderBoss(name) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";
  const data = BOSS_DATA[name];
  if (!data) {
    content.innerHTML = `<div class="timeline-soon">Coming soon</div>`;
    return;
  }
  const wrap = cmpEl("div", "cmp boss");

  // header: boss icon, name, tag
  const head = cmpEl("div", "npc-head");
  const ico = cmpEl("div", "npc-ico");
  const img = document.createElement("img");
  img.alt = name;
  const icons = [...timelineImgCandidates({ name }, null), wikiImgUrl(name, "png"), wikiImgUrl(name, "gif")];
  setImgWithFallbacks(img, [...new Set(icons)]);
  ico.appendChild(img);
  head.appendChild(ico);
  head.appendChild(cmpEl("div", "npc-name", name));
  head.appendChild(cmpEl("div", "cmp-tag", data.tag));
  wrap.appendChild(head);

  // how to summon
  const s1 = cmpEl("div", "cmp-section");
  s1.appendChild(cmpEl("div", "cmp-label", "How to fight it"));
  s1.appendChild(cmpEl("div", "npc-text", data.summon));
  wrap.appendChild(s1);

  // two columns: normal drops | treasure bag
  const sec = cmpEl("div", "cmp-section");
  sec.appendChild(cmpEl("div", "cmp-label", "What it drops"));
  const hasBag = !!((data.bagOnly && data.bagOnly.length) || data.bag.length);
  const heads = cmpEl("div", "cmp-cols boss-colheads");
  heads.appendChild(cmpEl("div", "cmp-col boss-colhead", hasBag ? "Classic mode" : "Drops"));
  if (hasBag) heads.appendChild(cmpEl("div", "cmp-col boss-colhead bag", "Treasure Bag (Expert & Master)"));
  sec.appendChild(heads);

  const cols = cmpEl("div", "cmp-cols");
  const left = cmpEl("div", "cmp-col");
  for (const raw of data.classic) left.appendChild(bossItemRow(bossEntry(raw), name, "Classic mode drop"));
  const right = cmpEl("div", "cmp-col");
  if (data.bagOnly && data.bagOnly.length) {
    right.appendChild(cmpEl("div", "boss-badge", "★ Only in the bag"));
    for (const raw of data.bagOnly) right.appendChild(bossItemRow(bossEntry(raw), name, "Treasure Bag exclusive"));
    if (data.bag.length) right.appendChild(cmpEl("div", "boss-badge plain", "Also in the bag"));
  }
  for (const raw of data.bag) right.appendChild(bossItemRow(bossEntry(raw), name, "Treasure Bag"));
  cols.appendChild(left);
  if (hasBag) cols.appendChild(right);
  else { cols.classList.add("boss-single"); heads.classList.add("boss-single"); }
  sec.appendChild(cols);
  wrap.appendChild(sec);

  // master mode
  if (data.master && data.master.length) {
    const s3 = cmpEl("div", "cmp-section");
    s3.appendChild(cmpEl("div", "cmp-label", "Master mode extras"));
    const grid = cmpEl("div", "npc-items");
    for (const raw of data.master) grid.appendChild(bossItemRow(bossEntry(raw), name, "Master mode"));
    s3.appendChild(grid);
    wrap.appendChild(s3);
  }

  wrap.appendChild(cmpEl("div", "cmp-footnote", "Every boss can also drop its Mask and Trophy. Weapon lists marked \"one of\" give you one of them per kill. Treasure Bags only drop in Expert and Master mode. Tap any item for details."));

  const linkWrap = cmpEl("div", "npc-linkwrap");
  const link = document.createElement("a");
  link.className = "npc-wiki";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "📖 Open Wiki Page";
  link.href = `https://terraria.wiki.gg/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`;
  linkWrap.appendChild(link);
  wrap.appendChild(linkWrap);

  content.appendChild(wrap);
}

// ============================================================
// TIMELINE MENU: nodes with `children` open another menu, nodes with `timeline` open that timeline
// ============================================================
const TIMELINE_MENU = [
  { name: "Ores & Bars", icon: "⛏️", desc: "Materials by progression", timeline: "ores" },
  { name: "Bosses", icon: "👁️", desc: "Boss order. Tap one, then (i) for its drops and Treasure Bag", timeline: "bosses" },
  { name: "Armor", icon: "🛡️", desc: "Every armor set with its defense level", armorAll: true },
  { name: "Pickaxes", icon: "🔨", desc: "Mining tiers", timeline: "pickaxes" },
  { name: "Events", icon: "🎪", desc: "Invasions and special events", timeline: "events" },
];

// ============================================================
// FIELD GUIDE: BIOMES + PLANTS & POTIONS
// Item names that are not in the item list still show (with their wiki picture), so a typo can never break a page.
// Items are "Name" or "Name|short note".
// ============================================================
const BIOMES = {
  forest: {
    name: "Forest", icon: "🌳", iconItem: "Acorn", tag: "Surface · where you start",
    where: "The green, grassy surface around your spawn point. The Hallow and the evil biomes can spread into it later.",
    enemies: ["Green Slime", "Blue Slime", "Zombie|Night", "Demon Eye|Night"],
    items: ["Wood|From trees", "Acorn|Plant new trees", "Daybloom|Herb", "Gel", "Lens|From Demon Eyes", "Fallen Star|Night sky"],
    tip: "Almost everything early on starts here. Chop trees for Wood, then build a house so NPCs move in.",
  },
  desert: {
    name: "Desert", icon: "🏜️", iconItem: "Sand Block", tag: "Surface and underground",
    where: "Large sandy area, usually next to the Ocean or the Jungle. It has an Underground Desert full of hard sandstone.",
    enemies: ["Antlion|Spits sand", "Vulture", "Tomb Crawler|Underground", "Mummy|Hardmode"],
    items: ["Sand Block", "Cactus", "Waterleaf|Herb", "Antlion Mandible", "Amber|Underground Desert", "Forbidden Fragment|Hardmode", "Desert Fossil"],
    tip: "Waterleaf only blooms while it rains. Dig down for the Underground Desert and its fossils.",
  },
  snow: {
    name: "Snow", icon: "❄️", iconItem: "Snow Block", tag: "Surface and underground",
    where: "A cold biome of snow and ice. It is also where the Ice Biome caves, frozen chests and Deerclops are found.",
    enemies: ["Ice Slime", "Undead Viking", "Zombie Eskimo|Night", "Ice Bat|Underground", "Ice Tortoise|Hardmode"],
    items: ["Snow Block", "Ice Block", "Shiverthorn|Herb", "Ice Skates|Frozen chests", "Ice Blade|Frozen chests", "Ice Boomerang|Frozen chests", "Blizzard in a Bottle|Frozen chests", "Flinx Fur"],
    tip: "Shiverthorn only grows here, so stock up before brewing potions that need it.",
  },
  jungle: {
    name: "Jungle", icon: "🌴", iconItem: "Jungle Spores", tag: "Surface and underground",
    where: "A thick biome of mud, vines and Rich Mahogany. Underneath it hides the Bee Hive and, later, the Jungle Temple.",
    enemies: ["Jungle Slime", "Hornet", "Man Eater", "Giant Tortoise|Hardmode", "Derpling|Hardmode"],
    items: ["Jungle Spores", "Stinger", "Vine", "Moonglow|Herb", "Rich Mahogany", "Ivy Whip|Ivy chests", "Feral Claws|Ivy chests", "Staff of Regrowth|Ivy chests", "Anklet of the Wind|Ivy chests", "Life Fruit|After Plantera", "Chlorophyte Ore|Hardmode"],
    tip: "Jungle enemies hit hard before you have good armor. Come back for Chlorophyte after the mechanical bosses.",
  },
  ocean: {
    name: "Ocean", icon: "🌊", iconItem: "Seashell", tag: "Both edges of the world",
    where: "The large bodies of water on the far left and right of the world.",
    enemies: ["Crab", "Pink Jellyfish", "Shark", "Squid|Night"],
    items: ["Seashell", "Starfish", "Coral", "Shark Fin", "Water Walking Boots|Water chests", "Flipper|Water chests", "Breathing Reed|Water chests", "Trident|Water chests"],
    tip: "Good place to fish, and the Angler NPC shows up when you are near here.",
  },
  caves: {
    name: "Underground & Caverns", icon: "⛏️", iconItem: "Life Crystal", tag: "Below the surface",
    where: "Everything under the grass: dirt, stone, then the big caverns. Most ore, chests and Life Crystals are here.",
    enemies: ["Cave Bat", "Skeleton", "Giant Worm", "Undead Miner", "Black Recluse|Spider Nest"],
    items: ["Copper Ore", "Iron Ore", "Silver Ore", "Gold Ore", "Life Crystal", "Cobweb", "Bone", "Blinkroot|Herb", "Diamond", "Ruby"],
    tip: "Each Life Crystal adds 20 health. Light the way with Torches and take a Spelunker Potion for ore.",
  },
  underworld: {
    name: "Underworld", icon: "🔥", iconItem: "Hellstone", tag: "Bottom of the world",
    where: "A fiery layer at the very bottom. You reach it by digging straight down (a Hellevator). Lava will destroy items, so be careful.",
    enemies: ["Fire Imp", "Lava Slime", "Hellbat", "Demon", "Bone Serpent"],
    items: ["Hellstone", "Obsidian", "Ash Block", "Fireblossom|Herb", "Obsidian Rose|Demons", "Guide Voodoo Doll|Demons, needed for Wall of Flesh", "Hellforge|Craft here"],
    tip: "The Wall of Flesh is fought here, and beating it starts Hardmode.",
  },
  corruption: {
    name: "Corruption", icon: "💜", iconItem: "Demonite Ore", tag: "Evil biome",
    where: "A purple, spreading evil biome that is picked at world creation. It has deep chasms with Shadow Orbs.",
    enemies: ["Eater of Souls", "Devourer", "Corruptor|Hardmode", "World Feeder|Hardmode"],
    items: ["Demonite Ore", "Shadow Scale", "Rotten Chunk", "Ebonstone Block", "Vile Mushroom", "Deathweed|Herb", "Shadow Orb", "Vilethorn|Orb drop", "Ball O' Hurt|Orb drop", "Band of Starpower|Orb drop"],
    tip: "Smash Shadow Orbs to summon the Eater of Worlds. Compare it with the Crimson using the Crimson vs Corruption button.",
  },
  crimson: {
    name: "Crimson", icon: "❤️‍🔥", iconItem: "Crimtane Ore", tag: "Evil biome",
    where: "The red, fleshy evil biome. It is the alternative to the Corruption in every world, and it has Crimson Hearts instead of Shadow Orbs.",
    enemies: ["Face Monster", "Blood Crawler", "Herpling", "Crimera", "Floaty Gross|Hardmode"],
    items: ["Crimtane Ore", "Tissue Sample", "Vertebra", "Crimstone Block", "Vicious Mushroom", "Deathweed|Herb", "Crimson Heart", "Crimson Rod|Heart drop", "Panic Necklace|Heart drop", "The Rotted Fork|Heart drop"],
    tip: "Break Crimson Hearts to summon the Brain of Cthulhu.",
  },
  hallow: {
    name: "Hallow", icon: "🦄", iconItem: "Pixie Dust", tag: "Hardmode biome",
    where: "Appears after the Wall of Flesh falls. It is a bright, rainbow-colored biome that spreads like the evil biomes.",
    enemies: ["Pixie", "Unicorn", "Gastropod", "Chaos Elemental", "Enchanted Sword"],
    items: ["Pixie Dust", "Unicorn Horn", "Crystal Shard", "Soul of Light", "Rod of Discord|Chaos Elemental", "Pearlstone Block", "Hallowed Seeds"],
    tip: "Use Hallowed Seeds to turn evil biomes back. Pixies and Gastropods drop Souls of Light.",
  },
  mushroom: {
    name: "Glowing Mushroom", icon: "🍄", iconItem: "Glowing Mushroom", tag: "Underground · mud and giant mushrooms",
    where: "A glowing patch of mud and mushrooms, usually in the Caverns. Truffle moves in here once you have a house in this biome (Hardmode).",
    enemies: ["Spore Bat", "Fungi Bulb", "Anomura Fungus", "Zombie Mushroom|Hardmode"],
    items: ["Glowing Mushroom", "Mushroom Grass Seeds", "Truffle Worm|Hardmode, bait for Duke Fishron"],
    tip: "Mushroom grass can grow in the Underground, and the glow is bright enough to see without Torches.",
  },
  dungeon: {
    name: "Dungeon", icon: "💀", iconItem: "Golden Key", tag: "Pre-Hardmode · opens after Skeletron",
    where: "A blue, green or pink brick structure at one side of the world. Skeletron guards the entrance, and Locked Chests inside need Golden Keys.",
    enemies: ["Angry Bones", "Dark Caster", "Cursed Skull", "Necromancer|Hardmode", "Bone Lee|Hardmode"],
    items: ["Golden Key|From dungeon enemies", "Muramasa|Locked Gold Chest", "Cobalt Shield|Locked Gold Chest", "Aqua Scepter|Locked Gold Chest", "Blue Moon|Locked Gold Chest", "Handgun|Locked Gold Chest", "Water Bolt|Locked Gold Chest", "Bone Welder"],
    tip: "Enter before Skeletron is dead and the Dungeon Guardian will chase you, so beat him first.",
  },
  temple: {
    name: "Jungle Temple", icon: "🗿", iconItem: "Lihzahrd Brick", tag: "Post-Plantera",
    where: "A large temple deep in the Underground Jungle. It is sealed until Plantera is defeated, then opened with a Temple Key.",
    enemies: ["Lihzahrd", "Flying Snake", "Lihzahrd Crawler", "Golem|Boss"],
    items: ["Temple Key|Plantera", "Lihzahrd Brick", "Lihzahrd Altar", "Lihzahrd Power Cell|Summons Golem", "Picksaw|Mines Lihzahrd Bricks", "Solar Tablet Fragment|Solar Eclipse"],
    tip: "You need a Picksaw to break the Lihzahrd Bricks. Use a Lihzahrd Power Cell on the Altar to call Golem.",
  },
  sky: {
    name: "Sky Islands", icon: "☁️", iconItem: "Starfury", tag: "High above the surface",
    where: "Floating islands high in the sky, made of Cloud and Sunplate blocks. The loot is in the Skyware Chest.",
    enemies: ["Harpy", "Wyvern|Hardmode"],
    items: ["Starfury|Skyware chest", "Shiny Red Balloon|Skyware chest", "Lucky Horseshoe|Skyware chest", "Sunplate Block", "Cloud", "Fallen Star"],
    tip: "Use a Rocket Boots or Wings jump or a grappling hook to get up. A Wyvern flies here in Hardmode.",
  },
};

const BIOME_MENU = Object.entries(BIOMES).map(([key, b]) => ({
  name: b.name, icon: b.icon, iconItem: b.iconItem, desc: b.tag, biome: key,
}));

// herbs: what they grow on and when they bloom (from the wiki text in the data)
const HERBS = [
  { name: "Daybloom", seeds: "Daybloom Seeds", grows: "Normal and Hallowed grass", blooms: "Daytime, 4:30 AM to 7:29 PM" },
  { name: "Moonglow", seeds: "Moonglow Seeds", grows: "Jungle grass", blooms: "Nighttime, 7:30 PM to 4:29 AM" },
  { name: "Blinkroot", seeds: "Blinkroot Seeds", grows: "Dirt or Mud with no grass on it", blooms: "Any time" },
  { name: "Deathweed", seeds: "Deathweed Seeds", grows: "Corruption and Crimson stone and grass", blooms: "During a Blood Moon or Full Moon" },
  { name: "Waterleaf", seeds: "Waterleaf Seeds", grows: "Sand (but never in the Ocean)", blooms: "While it is raining" },
  { name: "Fireblossom", seeds: "Fireblossom Seeds", grows: "Ash blocks and Ash grass in the Underworld", blooms: "Sunset, 3:45 PM to 7:30 PM, unless it rains" },
  { name: "Shiverthorn", seeds: "Shiverthorn Seeds", grows: "Snow and Ice", blooms: "Randomly, and then stays bloomed" },
];

const PLANT_MENU = [
  { name: "Herbs & Plants", icon: "🌿", iconItem: "Daybloom", desc: "Where each herb grows, when it blooms and what it makes", herbs: true },
  { name: "Healing & Mana", icon: "🧪", iconItem: "Healing Potion", desc: "Healing and mana potions with their ingredients", potions: "heal" },
  { name: "Buff Potions", icon: "⚗️", iconItem: "Ironskin Potion", desc: "Every buff potion and what it takes to brew it", potions: "buff" },
  { name: "Flasks", icon: "🫙", iconItem: "Flask of Fire", desc: "Weapon coatings that add effects to your melee hits", potions: "flask" },
];

// ---------- Event pages ----------
const EVENTS = {
  "Blood Moon": {
    "icon": "Bloody Tear",
    "tag": "Night event · Pre-Hardmode",
    "start": "It begins on its own at night (about 1 night in 9), or use a Bloody Tear to start one. The sky turns red.",
    "where": "Everywhere, from dusk until dawn.",
    "enemies": [
      "Blood Zombie",
      "Drippler",
      "Blood Eel",
      "Hemogoblin Shark",
      "Wandering Eye Fish",
      "Zombie Merman",
      "Clown|Hardmode only",
      "The Bride|Rare visitor",
      "The Groom|Rare visitor"
    ],
    "items": [
      "Bloody Tear",
      "Chum Bucket",
      "Shark Tooth Necklace",
      "Money Trough",
      "Blood Rain Bow",
      "Vampire Frog Staff",
      "Drippler Crippler",
      "Haemorrhaxe",
      "Blood Thorn",
      "Wedding Dress",
      "Wedding Veil",
      "Top Hat",
      "Tuxedo Shirt",
      "Tuxedo Pants"
    ],
    "tip": "Many more enemies spawn and zombies can break down doors, so build a safe room. Some enemies only appear during a Blood Moon, and the Bride and Groom can drop their outfits."
  },
  "Slime Rain": {
    "iconNpc": "Green Slime",
    "tag": "Day event · Pre-Hardmode",
    "start": "Starts at random during the day. Slimes fall from the sky in the Forest.",
    "where": "Above ground, mostly the Forest.",
    "enemies": [
      "Green Slime",
      "Blue Slime",
      "Purple Slime",
      "Pinky",
      "Black Slime",
      "Mother Slime"
    ],
    "items": [
      "Gel",
      "Slime Staff",
      "Pink Gel",
      "Compass",
      "Bomb",
      "Ironskin Potion",
      "Mining Potion",
      "Spelunker Potion",
      "Swiftness Potion",
      "Recall Potion"
    ],
    "tip": "Kill enough slimes and King Slime will show up. Slimes can drop ores and potions, so it is a good time to stock up."
  },
  "Goblin Army": {
    "icon": "Goblin Battle Standard",
    "tag": "Invasion · Pre-Hardmode",
    "start": "Can start on its own after you smash your first Shadow Orb or Crimson Heart, or use a Goblin Battle Standard.",
    "where": "They march in from the left or right edge of the world toward your base.",
    "enemies": [
      "Goblin Peon",
      "Goblin Thief",
      "Goblin Warrior",
      "Goblin Archer",
      "Goblin Sorcerer",
      "Goblin Summoner"
    ],
    "items": [
      "Goblin Battle Standard",
      "Spiky Ball",
      "Harpoon",
      "Tattered Cloth",
      "Shadowflame Hex Doll",
      "Shadowflame Knife",
      "Shadowflame Bow"
    ],
    "tip": "Defeating the army also lets you rescue the Goblin Tinkerer (found tied up underground), who reforges items. The Goblin Summoner is the one to hunt for the Shadowflame weapons."
  },
  "Old One's Army": {
    "icon": "Eternia Crystal Stand",
    "tag": "Event · stronger after each boss",
    "start": "Place an Eternia Crystal Stand and hold an Eternia Crystal against the stand. You protect the crystal for several waves.",
    "where": "A flat open area works best. Enemies come from both sides.",
    "enemies": [
      "Dark Mage",
      "Ogre",
      "Betsy",
      "Etherian Goblin",
      "Etherian Javelin Thrower",
      "Etherian Wyvern",
      "Kobold",
      "Drakin"
    ],
    "items": [
      "Eternia Crystal Stand",
      "Defender Medal",
      "Flameburst Staff",
      "Ballista Rod",
      "Lightning Aura Rod"
    ],
    "tip": "It gets harder after a mechanical boss (tier 2) and after Golem (tier 3). Defender Medals pay for your defenses and sentries."
  },
  "Frost Legion": {
    "icon": "Snow Globe",
    "tag": "Invasion · Hardmode",
    "start": "Use a Snow Globe in Hardmode to start it.",
    "where": "Snowmen soldiers attack from the sides of the world.",
    "enemies": [
      "Mister Stabby",
      "Snow Balla",
      "Snowman Gangsta"
    ],
    "items": [
      "Snow Globe",
      "Snowball Launcher",
      "Snow Block"
    ],
    "tip": "It's a small, quick event. Take it on after Wall of Flesh for easy loot."
  },
  "Pirate Invasion": {
    "icon": "Pirate Map",
    "tag": "Invasion · Hardmode",
    "start": "It can start on its own after Wall of Flesh, or use a Pirate Map.",
    "where": "Pirates arrive from the edge of the world. The Flying Dutchman sails in late in the invasion.",
    "enemies": [
      "Pirate Deadeye",
      "Pirate Corsair",
      "Pirate Crossbower",
      "Pirate Captain",
      "Flying Dutchman"
    ],
    "items": [
      "Pirate Map",
      "Coin Gun",
      "Cutlass",
      "Pirate Staff",
      "Lucky Coin",
      "Discount Card",
      "Gold Ring",
      "The Black Spot",
      "Eye Patch",
      "Buccaneer Bandana",
      "Buccaneer Tunic",
      "Buccaneer Pantaloons"
    ],
    "tip": "Win the invasion and the Pirate moves into town. The Black Spot from the Flying Dutchman unlocks more pirate gear."
  },
  "Solar Eclipse": {
    "icon": "Solar Tablet",
    "tag": "Day event · Hardmode",
    "start": "Starts at random during the day in Hardmode, or use a Solar Tablet.",
    "where": "Everywhere. The sky goes dark and special enemies appear in daylight.",
    "enemies": [
      "Swamp Thing",
      "Frankenstein",
      "Vampire",
      "Creature from the Deep",
      "Fritz",
      "Butcher",
      "Reaper",
      "Deadly Sphere",
      "Dr. Man Fly",
      "Nailhead",
      "Psycho",
      "The Possessed",
      "Mothron|After Plantera"
    ],
    "items": [
      "Solar Tablet",
      "Death Sickle",
      "Butcher's Chainsaw",
      "Nail Gun",
      "Neptune's Shell",
      "Moon Stone",
      "Broken Hero Sword",
      "Broken Bat Wing",
      "Toxic Flask",
      "Deadly Sphere Staff",
      "Psycho Knife"
    ],
    "tip": "It's dangerous but rewarding. Mothron only appears after Plantera, and it drops the Broken Hero Sword used for the Terra Blade."
  },
  "Pumpkin Moon": {
    "icon": "Pumpkin Moon Medallion",
    "tag": "Night event · after Plantera",
    "start": "Use a Pumpkin Moon Medallion at night after defeating Plantera. It's fifteen waves.",
    "where": "Best fought in an open arena. It runs through the night.",
    "enemies": [
      "Scarecrow",
      "Splinterling",
      "Hellhound",
      "Poltergeist",
      "Headless Horseman",
      "Mourning Wood",
      "Pumpking"
    ],
    "items": [
      "Pumpkin Moon Medallion",
      "Spooky Wood",
      "Candy Corn Rifle",
      "The Horseman's Blade",
      "Jack 'O Lantern Launcher",
      "Raven Staff",
      "Bat Scepter",
      "Dark Harvest",
      "Stake Launcher",
      "Necromantic Scroll",
      "Spooky Twig",
      "Cursed Sapling",
      "Hexxed Branch",
      "Witch's Broom"
    ],
    "tip": "Mourning Wood and Pumpking are the big bosses of the event. Finishing it earns good Halloween weapons."
  },
  "Frost Moon": {
    "icon": "Naughty Present",
    "tag": "Night event · after Plantera",
    "start": "Use a Naughty Present at night after defeating Plantera. It's fifteen waves.",
    "where": "Best fought in an open arena. It runs through the night.",
    "enemies": [
      "Zombie Elf",
      "Gingerbread Man",
      "Elf Archer",
      "Nutcracker",
      "Elf Copter",
      "Krampus",
      "Flocko",
      "Present Mimic",
      "Everscream",
      "Santa-NK1",
      "Ice Queen"
    ],
    "items": [
      "Naughty Present",
      "Razorpine",
      "Christmas Tree Sword",
      "Shrub Star",
      "Elf Melter",
      "Chain Gun",
      "Toy Tank",
      "Blizzard Staff",
      "Snowman Cannon",
      "North Pole",
      "Frozen Crown",
      "Reindeer Bells"
    ],
    "tip": "Everscream, Santa-NK1 and the Ice Queen are the main bosses. It is the Christmas version of the Pumpkin Moon."
  },
  "Martian Madness": {
    "iconNpc": "Martian Saucer",
    "tag": "Invasion · after Golem",
    "start": "Starts at random after you defeat Golem, or from a Martian Probe that spots you.",
    "where": "Martians land on the surface and a Saucer flies in.",
    "enemies": [
      "Martian Walker",
      "Gray Grunt",
      "Ray Gunner",
      "Brain Scrambler",
      "Gigazapper",
      "Martian Officer",
      "Scutlix Gunner",
      "Tesla Turret",
      "Martian Drone",
      "Martian Saucer"
    ],
    "items": [
      "Xenopopper",
      "Xeno Staff",
      "Laser Machinegun",
      "Electrosphere Launcher",
      "Influx Waver",
      "Cosmic Car Key",
      "Charged Blaster Cannon",
      "Anti-Gravity Hook",
      "Laser Drill",
      "Martian Conduit Plating",
      "Martian Uniform Helmet"
    ],
    "tip": "The Martian Saucer is the boss of the invasion. Hit its turrets first."
  },
  "Lunar Events": {
    "icon": "Celestial Sigil",
    "tag": "Event · after the Lunatic Cultist",
    "start": "Defeat the Lunatic Cultist and four pillars rise across the world.",
    "where": "Solar, Vortex, Nebula and Stardust Pillars appear at different spots. Each is guarded by enemies of its theme.",
    "enemies": [
      "Solar Pillar",
      "Vortex Pillar",
      "Nebula Pillar",
      "Stardust Pillar"
    ],
    "items": [
      "Solar Fragment",
      "Vortex Fragment",
      "Nebula Fragment",
      "Stardust Fragment",
      "Celestial Sigil"
    ],
    "tip": "Destroy all four pillars and the Moon Lord arrives. Fragments are used to craft the best armor and weapons in the game."
  }
};

// ---------- Modifiers (reforge prefixes) ----------
// [name, effect text, tier] -- tier below zero means it makes the item worse
const MODIFIERS = {
  universal: { name: "Universal", note: "Any weapon can roll these", list: [
    ["Keen", "+3% crit", 1], ["Superior", "+10% damage, +3% crit, +10% knockback", 2], ["Forceful", "+15% knockback", 1], ["Hurtful", "+10% damage", 1],
    ["Strong", "+15% knockback", 1], ["Zealous", "+5% crit", 1], ["Godly", "+15% damage, +5% crit, +15% knockback", 2], ["Demonic", "+15% damage, +5% crit", 2],
    ["Unpleasant", "+5% damage, +15% knockback", 2], ["Ruthless", "+18% damage, -10% knockback", 1],
    ["Broken", "-30% damage, -20% knockback", -2], ["Damaged", "-15% damage", -1], ["Shoddy", "-10% damage, -15% knockback", -2], ["Weak", "-20% knockback", -2] ] },
  common: { name: "Common", note: "Swords, shortswords, whips, ranged and magic weapons, and some tools", list: [
    ["Quick", "+10% speed", 1], ["Nimble", "+5% speed", 1], ["Agile", "+10% speed, +3% crit", 1], ["Deadly", "+10% damage, +10% speed", 2],
    ["Murderous", "+7% damage, +6% speed, +3% crit", 2], ["Nasty", "+5% damage, +10% speed, +2% crit", 1],
    ["Slow", "-15% speed", -1], ["Lazy", "-8% speed", -1], ["Sluggish", "-20% speed", -2], ["Annoying", "-20% damage, -15% speed", -2] ] },
  melee: { name: "Melee", note: "Swords, shortswords, pickaxes, hammers, axes and whips", list: [
    ["Large", "+12% size", 1], ["Massive", "+18% size", 1], ["Dangerous", "+5% damage, +2% crit, +5% size", 1], ["Savage", "+10% damage, +10% size, +10% knockback", 2],
    ["Sharp", "+15% damage", 1], ["Pointy", "+10% damage", 1], ["Bulky", "+5% damage, -15% speed, +10% size, +10% knockback", 1], ["Heavy", "-10% speed, +15% knockback", 0],
    ["Light", "+15% speed, -10% knockback", 0], ["Legendary", "+15% damage, +10% speed, +5% crit, +10% size, +15% knockback", 2],
    ["Tiny", "-18% size", -1], ["Small", "-10% size", -1], ["Dull", "-15% damage", -1], ["Unhappy", "-10% speed, -10% size, -10% knockback", -2],
    ["Terrible", "-15% damage, -13% size, -15% knockback", -2], ["Shameful", "-10% damage, +10% size, -20% knockback", -2] ] },
  ranged: { name: "Ranged", note: "Bows, guns, launchers and other ranged weapons", list: [
    ["Sighted", "+10% damage, +3% crit", 1], ["Rapid", "+15% speed, +10% velocity", 2], ["Hasty", "+10% speed, +15% velocity", 2], ["Intimidating", "+5% velocity, +15% knockback", 2],
    ["Deadly", "+10% damage, +5% speed, +2% crit, +5% velocity, +5% knockback", 2], ["Staunch", "+10% damage, +15% knockback", 2], ["Powerful", "+15% damage, -10% speed, +1% crit", 1],
    ["Frenzying", "-15% damage, +15% speed", 0], ["Unreal", "+15% damage, +10% speed, +5% crit, +10% velocity, +15% knockback", 2],
    ["Awful", "-15% damage, -10% velocity, -10% knockback", -2], ["Lethargic", "-15% speed, -10% velocity", -2], ["Awkward", "-10% speed, -20% knockback", -2] ] },
  magic: { name: "Magic", note: "Staves, tomes and other mana weapons", list: [
    ["Mystic", "+10% damage, -15% mana cost", 2], ["Adept", "-15% mana cost", 1], ["Masterful", "+15% damage, -15% mana cost, +5% knockback", 2],
    ["Celestial", "+10% damage, -10% speed, -10% mana cost, +10% knockback", 1], ["Taboo", "+10% speed, +10% mana cost, +10% knockback", 1], ["Manic", "-10% damage, +10% speed, -10% mana cost", 1],
    ["Furious", "+15% damage, +20% mana cost, +15% knockback", 1], ["Mythical", "+15% damage, +10% speed, +5% crit, -10% mana cost, +15% knockback", 2],
    ["Inept", "+10% mana cost", -1], ["Ignorant", "-10% damage, +20% mana cost", -2], ["Deranged", "-10% damage, -10% knockback", -1], ["Intense", "+10% damage, +15% mana cost", -1] ] },
  summon: { name: "Summon", note: "Summoning staves (not whips)", list: [
    ["Fabled", "+15% damage, +10 armor pierce, +3 tag damage, +15% knockback", 2], ["Loyal", "+10% damage, +5 armor pierce, +3 tag damage, +5% knockback", 2],
    ["Worthy", "+15% damage, +8 armor pierce", 2], ["Focused", "+10% damage, +3 tag damage", 1], ["Eager", "+25 armor pierce", 2], ["Ballistic", "+5 tag damage", 1],
    ["Scraggling", "+25% knockback", 2], ["Patient", "-5% damage, +3 tag damage", 0], ["Rabid", "+10% damage, -10% knockback", 0], ["Ill-Tempered", "-5% damage, +10 armor pierce", 1],
    ["Petty", "-30% damage", -2], ["Feeble", "-25% knockback", -2], ["Skittish", "-15% damage, -10% knockback", -2] ] },
  accessory: { name: "Accessory", note: "Accessories only. They are never bad, and only work in a normal (non-vanity) slot", list: [
    ["Hard", "+1 defense", 1], ["Guarding", "+2 defense", 1], ["Armored", "+3 defense", 1], ["Warding", "+4 defense", 2],
    ["Precise", "+2% crit", 1], ["Lucky", "+4% crit", 2],
    ["Jagged", "+1% damage", 1], ["Spiked", "+2% damage", 1], ["Angry", "+3% damage", 1], ["Menacing", "+4% damage", 2],
    ["Brisk", "+1% move speed", 1], ["Fleeting", "+2% move speed", 1], ["Hasty", "+3% move speed", 1], ["Quick", "+4% move speed", 2],
    ["Wild", "+1% melee speed", 1], ["Rash", "+2% melee speed", 1], ["Intrepid", "+3% melee speed", 1], ["Violent", "+4% melee speed", 2],
    ["Arcane", "+20 max mana", 1] ] },
};
// which groups an item type draws from (used for the "chance" on each row)
const MODIFIER_POOLS = {
  melee: ["universal", "common", "melee"], ranged: ["universal", "common", "ranged"], magic: ["universal", "common", "magic"],
  summon: ["universal", "summon"], accessory: ["accessory"], universal: ["universal", "common", "melee"], common: ["universal", "common", "melee"],
};
const MODIFIER_BEST = [
  ["Melee swords (overhead swing)", "Legendary"], ["Melee, other styles", "Godly"], ["Pickaxes, axes, hammers", "Light"],
  ["Ranged with knockback", "Unreal"], ["Magic with knockback", "Mythical"], ["Weapons with no knockback", "Demonic"],
  ["Summon staves", "Fabled"], ["Accessories", "Warding, Menacing or Lucky"],
];

// everything else lives in the Field Guide
const GUIDE_MENU = [
  { name: "NPCs", icon: "🏘️", desc: "Who they are, what they sell and how to get them", children: NPC_MENU },
  { name: "Classes", icon: "🎓", desc: "Melee, Ranged, Mage and Summoner: best armor and weapons", children: CLASS_MENU },
  { name: "Biomes", icon: "🗺️", iconItem: "Acorn", desc: "Forest, Desert, Jungle, Corruption and more: enemies, loot and tips", children: BIOME_MENU },
  { name: "Plants & Potions", icon: "🌿", iconItem: "Daybloom", desc: "Herbs, healing, buff potions and flasks with their ingredients", children: PLANT_MENU },
  { name: "Bestiary", icon: "📕", iconItem: "Lifeform Analyzer", desc: "Every enemy, critter and boss, and what each one drops", bestiary: true },
  { name: "Modifiers", icon: "✨", iconItem: "Tinkerer's Workshop", desc: "Every reforge modifier, what it does and your chances of getting it", modifiers: true },
];

// has its own button in the header
const EVIL_NODE = { name: "Crimson vs Corruption", icon: "🩸", desc: "Compare mobs, drops and gear side by side", compare: "evil" };

// which menu the timeline page is showing right now
let timelineRoot = TIMELINE_MENU;
let timelineRootTitle = "Timeline";
let timelineMinDepth = 0; // 1 when a page was opened directly (back then closes the page)

let timelinePath = []; // stack of menu nodes the user has clicked into

function timelineNodeReady(node) {
  if (node.children) return true;
  if (node.compare) return true;
  if (node.npc) return true;
  if (node.armorAll || node.klass || node.boss || node.biome || node.herbs || node.potions || node.modifiers || node.bestiary || node.beast) return true;
  const data = TIMELINES[node.timeline];
  return !!(data && data.length);
}

function renderTimelineMenu(nodes) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "timeline-menu";
  // NPC lists show as an even grid of compact cards instead of one long column
  if (nodes.length && nodes.every(n => n.npc || n.klass || n.biome || n.herbs || n.potions || n.modifiers)) grid.classList.add("tm-grid");

  for (const node of nodes) {
    const card = document.createElement("div");
    card.className = "timeline-menu-card";
    const ready = timelineNodeReady(node);
    if (!ready) card.classList.add("soon");

    card.innerHTML = `
      <div class="tm-icon">${node.icon || "📅"}</div>
      <div class="tm-info">
        <div class="tm-name">${node.name}</div>
        <div class="tm-desc">${ready ? (node.desc || "") : "Coming soon"}</div>
      </div>
      <div class="tm-arrow">${node.children ? "›" : ""}</div>
    `;

    if (node.npc && NPCS[node.npc]) {
      const icoEl = card.querySelector(".tm-icon");
      const emoji = icoEl.firstChild;
      const emojiText = emoji ? emoji.textContent : "";
      if (emoji) emoji.textContent = "";
      const img = document.createElement("img");
      img.alt = node.name;
      setImgWithFallbacks(img, npcPortraitCandidates(NPCS[node.npc]));
      const origErr = img.onerror;
      img.onerror = () => { origErr(); if (img.style.display === "none" && emoji) emoji.textContent = emojiText; };
      icoEl.appendChild(img);
    }

    if (!node.npc && (node.iconItem || MENU_ICONS[node.name])) loadIconInto(card.querySelector(".tm-icon"), node.iconItem || MENU_ICONS[node.name]);

    card.addEventListener("click", () => {
      timelinePath.push(node);
      showTimelineLevel();
    });

    grid.appendChild(card);
  }

  content.appendChild(grid);
}

// Every icon we could use for an entry, best first. If one fails to load, the next is tried.
function timelineImgCandidates(item, itemData) {
  if (typeof BOSS_DATA !== "undefined" && BOSS_DATA[item.name]) itemData = null;   // "The Destroyer" is also a painting item
  const npcImg = NPC_BY_NAME[item.name]?.img;
  const list = [
    item.img,
    itemData?.img,
    npcImg,
    ITEM_BY_NAME[item.iconItem]?.img,
    NPC_BY_NAME[item.iconNpc]?.img,
    npcImg && npcImg.endsWith(".gif") ? npcImg.replace(/\.gif$/, ".png") : null,
    (item.type || "").match(/Boss|Pillar/) ? wikiImgUrl(item.name, "png") : null,
    (item.type || "").match(/Boss|Pillar/) ? wikiImgUrl(item.name, "gif") : null,
    ITEM_BY_NAME[`${item.name} Mask`]?.img,     // boss mask as a backup icon
    ITEM_BY_NAME[`${item.name} Trophy`]?.img,   // boss trophy as a last resort
  ];
  return [...new Set(list.filter(Boolean))];
}

function setImgWithFallbacks(img, urls) {
  img.referrerPolicy = "no-referrer";
  img.dataset.fallbacks = JSON.stringify(urls.slice(1));
  img.onerror = () => {
    let rest = [];
    try { rest = JSON.parse(img.dataset.fallbacks || "[]"); } catch (e) {}
    if (rest.length) {
      img.src = rest.shift();
      img.dataset.fallbacks = JSON.stringify(rest);
    } else {
      img.style.display = "none";
    }
  };
  img.style.display = "";
  img.src = urls[0];
}

function renderTimeline(key) {
  const content = document.getElementById("timelineContent");
  content.innerHTML = "";

  const data = TIMELINES[key];
  if (!data || !data.length) {
    content.innerHTML = `<div class="timeline-soon">Coming soon</div>`;
    return;
  }

  for (const stage of data) {
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
      itemDiv.style.cursor = "pointer";

      const itemData = ITEM_BY_NAME[item.name];
      const urls = timelineImgCandidates(item, itemData);

      if (urls.length) {
        const img = document.createElement("img");
        img.alt = item.name;
        setImgWithFallbacks(img, urls);
        itemDiv.appendChild(img);
      }

      const info = document.createElement("div");
      info.className = "timeline-item-info";
      info.innerHTML = `
        <div class="timeline-item-name">${item.name}</div>
        <div class="timeline-item-type">${item.type}</div>
      `;
      itemDiv.appendChild(info);

      // Everything is clickable
      itemDiv.addEventListener("click", () => openTimelineEntry(item, stage, urls));

      itemsGrid.appendChild(itemDiv);
    }

    stageDiv.appendChild(itemsGrid);
    content.appendChild(stageDiv);
  }
}

// Real items open the same popup as the main grid (craft / uses / info).
// Bosses, events and armor sets open the info popup with a wiki button.
function openTimelineEntry(item, stage, urls) {
  if (EVENTS[item.name]) {
    timelinePath.push({ name: item.name, event: item.name });
    showTimelineLevel();
    return;
  }
  if (BOSS_DATA[item.name]) {
    timelinePath.push({ name: item.name, boss: item.name });
    showTimelineLevel();
    return;
  }
  const itemData = BOSS_DATA[item.name] ? null : ITEM_BY_NAME[item.name];
  if (itemData) {
    openChoiceModal(itemData);
    return;
  }

  const lines = [];
  const aboutName = item.iconItem;
  const aboutTip = aboutName ? ITEM_DETAILS[aboutName]?.tooltip : null;
  if (aboutTip) lines.push({ label: `About the ${aboutName}`, text: aboutTip });
  if (stage.description) lines.push({ label: "Available", text: stage.description });
  if (item.milestone) lines.push({ label: "Note", text: item.milestone });

  let related = item.related || (aboutName && ITEM_BY_NAME[aboutName] ? [aboutName] : []);
  related = related.filter(n => ITEM_BY_NAME[n]);
  const isArmor = (item.type || "").startsWith("Armor Set");

  const wikiTitle = item.wikiTitle || (isArmor ? item.name.replace(/ Armor$/, " armor") : item.name);

  showInfoPopup({
    title: item.name,
    imgs: urls,
    subtitle: `${item.type} · ${stage.stage}`,
    paragraph: item.info || "",
    lines,
    related,
    relatedLabel: isArmor ? "Armor pieces (click for crafting)" : "Trigger item (click for crafting)",
    wikiUrl: item.wiki || `https://terraria.wiki.gg/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, "_"))}`,
    onMore: BOSS_DATA[item.name] ? () => {
      closeItemInfoModal();
      timelinePath.push({ name: item.name, boss: item.name });
      showTimelineLevel();
    } : null,
  });
}

function showTimelineLevel() {
  const node = timelinePath[timelinePath.length - 1];

  document.getElementById("timelineTitle").textContent =
    [timelineRootTitle, ...timelinePath.map(n => n.name)].filter(Boolean).join(" › ");

  if (!node) renderTimelineMenu(timelineRoot);
  else if (node.children) renderTimelineMenu(node.children);
  else if (node.compare) renderCompare(node.compare);
  else if (node.npc) renderNpc(node.npc);
  else if (node.boss) renderBoss(node.boss);
  else if (node.event) renderEvent(node.event);
  else if (node.biome) renderBiome(node.biome);
  else if (node.bestiary) renderBestiary();
  else if (node.beast) renderBeast(node.beast);
  else if (node.modifiers) renderModifiers();
  else if (node.herbs) renderHerbs();
  else if (node.potions) renderPotions(node.potions);
  else if (node.armorAll) renderArmorAll();
  else if (node.klass) renderClass(node.klass);
  else renderTimeline(node.timeline);

  document.getElementById("timelinePage").scrollTop = 0;
  document.getElementById("timelineContent").scrollTop = 0;
}

// Back goes up one level; from the top menu it closes the timeline
function timelineGoBack() {
  if (timelinePath.length > timelineMinDepth) {
    timelinePath.pop();
    showTimelineLevel();
  } else {
    closeTimeline();
  }
}

function openTimelineWith(root, title, firstNode) {
  document.getElementById("timelinePage").classList.remove("hidden");
  document.body.classList.add("no-scroll");
  timelineRoot = root;
  timelineRootTitle = title;
  timelinePath = firstNode ? [firstNode] : [];
  timelineMinDepth = firstNode ? 1 : 0;
  showTimelineLevel();
}

// ============================================================
// Crimson vs Corruption button: a tiny pixel scene.
// Crimson (red sky, red trees) on the left, Corruption (purple sky, dark eyed trees) on the right.
// ============================================================
function setupEvilButton() {
  const btn = document.getElementById("btnEvil");
  const cv = btn && btn.querySelector(".evil-canvas");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const PX = 2; // one scene "pixel" is 2 screen pixels
  let W = 0, H = 0;

  const hash = (x, y, s) => {
    let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const mix = (c1, c2, t) => {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1), b = p(c2);
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
  };

  const PAL = {
    crimson: {
      skyTop: "#4a1826", skyBot: "#7d3042",
      grass: ["#e0364a", "#b01a2c"], dirt: ["#3d1118", "#4d171f", "#2c0b11"],
      trunk: ["#3f2b32", "#5a3f48"],
      leaf: ["#b5202f", "#d83a4c", "#8a1224"], leafEdge: "#5a0c18",
    },
    corrupt: {
      skyTop: "#1a1450", skyBot: "#3b3786",
      grass: ["#8b4fd0", "#5f2fa0"], dirt: ["#241a3c", "#2e2150", "#190f2c"],
      trunk: ["#2f2c48", "#46426a"],
      leaf: ["#2a2036", "#3a2d4c", "#1a1224"], leafEdge: "#0f0a18",
    },
  };

  function draw() {
    if (!W) return;
    const mid = Math.round(W * 0.5);
    const G = Math.max(4, Math.round(H * 0.2));   // ground thickness
    const groundY = H - G;                         // first ground row
    // grid of colors, so trees can be painted over the sky
    const grid = new Array(W * H);
    const sideAt = (x, y) => {
      return x < mid ? "crimson" : "corrupt";   // a clean, flush line where the two sides meet
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const side = sideAt(x, y), p = PAL[side];
        let col;
        if (y < groundY) {
          col = mix(p.skyTop, p.skyBot, y / groundY);       // sky, a little lighter near the horizon
        } else if (y === groundY || (y === groundY + 1 && hash(x, y, 6) < 0.5)) {
          col = p.grass[y === groundY && hash(x, y, 2) < 0.6 ? 0 : 1];       // grass line
        } else {
          const r = hash(x, y, 7);
          col = r > 0.94 ? p.dirt[1] : r < 0.1 ? p.dirt[2] : p.dirt[0];
        }
        grid[y * W + x] = col;
      }
    }
    const put = (x, y, col) => { if (x >= 0 && x < W && y >= 0 && y < H) grid[y * W + x] = col; };

    // a tree: trunk, round canopy, little clusters on the sides
    function tree(cx, trunkH, r, side) {
      const p = PAL[side];
      const base = groundY;                       // trunk stands on the grass
      for (let i = 1; i <= trunkH + r; i++) {
        put(cx - 1, base - i, p.trunk[0]);
        put(cx, base - i, p.trunk[1]);
        put(cx + 1, base - i, p.trunk[0]);
      }
      const cy = Math.max(r, base - trunkH - r + 2); // canopy center
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r + 1; x++) {
          const dx = x - (cx + 0.5), dy = y - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const edge = r + (hash(x, y, 31) - 0.5) * 1.6;
          if (d > edge) continue;
          const rr = hash(x, y, 17);
          let col = rr < 0.18 ? p.leaf[2] : rr > 0.8 ? p.leaf[1] : p.leaf[0];
          if (d > edge - 1) col = p.leafEdge;    // darker rim
          put(x, y, col);
        }
      }
      // small clusters hanging off the trunk
      const cl = Math.max(2, Math.round(r / 2.2));
      const clusters = [[-cl - 2, base - Math.round(trunkH * 0.7)], [cl + 2, base - Math.round(trunkH * 0.45)]];
      for (const [ox, oy] of clusters) {
        for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) {
          if (Math.abs(x) + Math.abs(y) > 2) continue;
          put(cx + ox + x, oy + y, hash(cx + ox + x, oy + y, 41) < 0.3 ? p.leaf[1] : p.leaf[0]);
        }
        // little branch connecting the cluster to the trunk
        const step = ox < 0 ? 1 : -1;
        for (let x = ox + step * 2; x !== (ox < 0 ? -1 : 1); x += step) put(cx + x, oy + 1, p.trunk[0]);
      }
      // corruption trees watch you
      if (side === "corrupt") {
        const eyes = [[-Math.round(r * 0.35), -Math.round(r * 0.3)], [Math.round(r * 0.45), Math.round(r * 0.1)]];
        for (const [ex, ey] of eyes) {
          put(cx + ex, cy + ey, "#c9bfe6");
          put(cx + ex + 1, cy + ey, "#6a58a0");
        }
      }
    }

    const big = Math.round(H * 0.21), small = Math.round(H * 0.17);
    const bigT = Math.round(H * 0.46), smallT = Math.round(H * 0.36);
    tree(Math.round(W * 0.14), bigT, big, "crimson");
    tree(Math.round(W * 0.33), smallT, small, "crimson");
    tree(Math.round(W * 0.68), smallT, small, "corrupt");
    tree(Math.round(W * 0.87), bigT, big, "corrupt");

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        ctx.fillStyle = grid[y * W + x];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function resize() {
    const r = btn.getBoundingClientRect();
    W = Math.max(40, Math.round(r.width / PX));
    H = Math.max(20, Math.round(r.height / PX));
    cv.width = W;
    cv.height = H;
    draw();
  }

  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(btn);
  else window.addEventListener("resize", resize);
}

function openTimeline() { openTimelineWith(TIMELINE_MENU, "Timeline"); }
function openGuide() { openTimelineWith(GUIDE_MENU, "Field Guide"); }
function openEvil() { openTimelineWith([], "", EVIL_NODE); }

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

// ---------- About / welcome / legal ----------
const CONTACT_EMAIL = "spectreskeep@gmail.com";

// The welcome popup shows only on the very first visit. The "seen" mark is saved the moment it opens,
// so closing it or refreshing the page means it does not pop up again. It lives in the About button after that.
function maybeShowIntro() {
  try {
    if (localStorage.getItem("tcIntroSeen")) return;
    localStorage.setItem("tcIntroSeen", "1");
  } catch (e) { return; }   // storage blocked: skip the popup rather than show it on every visit
  openAboutModal("guide", true);
}

function openAboutModal(tab = "guide", firstVisit = false) {
  if (document.getElementById("aboutBackdrop")) return;
  const backdrop = document.createElement("div");
  backdrop.id = "aboutBackdrop";
  backdrop.className = "about-backdrop";
  const modal = document.createElement("div");
  modal.className = "about-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const guide = `
    <h2>${firstVisit ? "Welcome to Terraria Crafting" : "Quick guide"}</h2>
    <p class="about-lead">Look up any item in Terraria, see exactly how to craft it, and learn how the game fits together.</p>
    <ul class="about-list">
      <li><b>Search</b> the box at the top for any item, or open <b>Categories</b> to browse weapons, tools, armor, potions and more.</li>
      <li><b>Click an item</b> to see its crafting tree: every ingredient and the station you need. The info button shows where it drops and what it does.</li>
      <li><b>Timeline</b> shows what to make and fight in order, from the first pickaxe to the Moon Lord.</li>
      <li><b>Field Guide</b> has NPCs, classes, biomes, herbs, potions and every modifier.</li>
      <li><b>Crimson vs Corruption</b> compares the two evil biomes side by side.</li>
      <li><b>Settings</b> has dark mode. The <b>About</b> button brings this page back any time.</li>
    </ul>`;
  const legal = `
    <h2>Legal &amp; contact</h2>
    <h3>Not affiliated</h3>
    <p>This is a free fan-made website. It is not made, endorsed or sponsored by Re-Logic, Inc. or anyone connected with Terraria.</p>
    <h3>Rights belong to their owners</h3>
    <p>Terraria, its name, logo, characters, items, sprites and artwork are trademarks and copyright of Re-Logic, Inc. All game images shown here belong to Re-Logic and are used only to describe the game.</p>
    <p>Item names, descriptions and facts come from the <a href="https://terraria.wiki.gg" target="_blank" rel="noopener noreferrer">Official Terraria Wiki</a>. Its text is available under the <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 3.0</a> license, and I link back to the wiki page for each item.</p>
    <p>The layout and code of this site are &copy; 2026 Spectreskeep. Everything about the game itself is not mine.</p>
    <h3>Terms of use</h3>
    <ul class="about-list">
      <li>Free to use, non-commercial, with no ads and nothing for sale.</li>
      <li>Provided as is, with no promises. The data is collected from the wiki and may be out of date or wrong, so check the wiki for anything important.</li>
      <li>Please do not copy this site's design or code and pass it off as your own, and do not overload it with automated requests.</li>
    </ul>
    <h3>Privacy</h3>
    <p>No accounts, no ads and no tracking from this site. Your dark mode choice is saved in your own browser only. Pictures load from the Terraria wiki's servers, so the wiki can see a normal image request, like any website that shows their images.</p>
    <h3>Contact and takedowns</h3>
    <p>Questions, corrections, or a rights holder who wants something changed or removed: email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> and I will respond quickly.</p>`;

  modal.innerHTML = `
    <button class="about-x" aria-label="Close">&times;</button>
    <div class="about-tabs">
      <button class="about-tab" data-tab="guide">Guide</button>
      <button class="about-tab" data-tab="legal">Legal &amp; contact</button>
    </div>
    <div class="about-body">
      <div class="about-pane" data-pane="guide">${guide}</div>
      <div class="about-pane" data-pane="legal">${legal}</div>
    </div>
    <div class="about-foot"><button class="about-ok">${firstVisit ? "Start exploring" : "Close"}</button></div>`;

  const show = (t) => {
    modal.querySelectorAll(".about-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === t));
    modal.querySelectorAll(".about-pane").forEach(p => p.classList.toggle("active", p.dataset.pane === t));
    modal.querySelector(".about-body").scrollTop = 0;
  };
  const close = () => { backdrop.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  modal.querySelectorAll(".about-tab").forEach(b => b.addEventListener("click", () => show(b.dataset.tab)));
  modal.querySelector(".about-x").addEventListener("click", close);
  modal.querySelector(".about-ok").addEventListener("click", close);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  document.addEventListener("keydown", onKey);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  show(tab);
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

// Fills in and shows the Item Info popup (#infoModalBackdrop in index.html)
function showInfoPopup({ title, imgs = [], subtitle = "", paragraph = "", lines = [], related = [], relatedLabel = "Related items", wikiUrl, setImgs = [], heroImgs = [], onMore = null }) {
  const modalBox = document.querySelector("#infoModalBackdrop .modal");
  modalBox.querySelectorAll(".boss-more").forEach(el => el.remove());
  if (onMore) {
    const more = document.createElement("div");
    more.className = "modal-info-icon boss-more";
    more.title = "Full details: drops and Treasure Bag";
    more.innerHTML = `<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="9" y1="8" x2="9" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="5" r="0.9" fill="currentColor"/></svg>`;
    more.addEventListener("click", onMore);
    modalBox.appendChild(more);
  }
  const imgEl = document.getElementById("infoModalImg");
  if (setImgs.length) {
    imgEl.style.display = "none"; // the whole set is shown below instead of one icon
  } else if (imgs.length) {
    imgEl.style.imageRendering = "pixelated";
    setImgWithFallbacks(imgEl, imgs);
  } else {
    imgEl.style.display = "none";
  }

  document.getElementById("infoModalTitle").textContent = title;
  document.getElementById("infoModalStation").textContent = subtitle;

  const content = document.getElementById("infoModalContent");
  content.innerHTML = "";

  // full armor set: every piece side by side
  if (setImgs.length) {
    const makePiecesRow = () => {
      const row = document.createElement("div");
      row.className = "info-set-icons";
      for (const urls of setImgs) {
        const img = document.createElement("img");
        img.alt = "";
        setImgWithFallbacks(img, urls);
        row.appendChild(img);
      }
      return row;
    };
    if (heroImgs.length) {
      // the character wearing the whole set (front and back); if it won't load, show the pieces instead
      const hero = document.createElement("div");
      hero.className = "info-set-hero";
      const img = document.createElement("img");
      img.alt = title;
      img.referrerPolicy = "no-referrer";
      let i = 0;
      img.onerror = () => {
        i++;
        if (i < heroImgs.length) img.src = heroImgs[i];
        else hero.replaceWith(makePiecesRow());
      };
      img.src = heroImgs[0];
      hero.appendChild(img);
      content.appendChild(hero);
    } else {
      content.appendChild(makePiecesRow());
    }
  }

  if (paragraph) renderInfoText(content, paragraph);

  for (const line of lines) {
    if (!line.text && !line.node) continue;
    const d = document.createElement("div");
    d.className = "info-line";
    const strong = document.createElement("strong");
    strong.textContent = line.label + (line.node && !line.inline ? "" : ": ");
    d.appendChild(strong);
    if (line.node) d.appendChild(line.node); else d.appendChild(document.createTextNode(line.text));
    content.appendChild(d);
  }

  if (related.length) {
    const label = document.createElement("div");
    label.className = "info-related-label";
    label.textContent = relatedLabel;
    content.appendChild(label);

    const chips = document.createElement("div");
    chips.className = "info-chips";
    for (const name of related) {
      const chip = document.createElement("button");
      chip.className = "info-chip";
      chip.appendChild(miniItem(name).firstChild);
      chip.appendChild(document.createTextNode(" " + name));
      chip.addEventListener("click", () => {
        closeItemInfoModal();
        openChoiceModal(ITEM_BY_NAME[name]);
      });
      chips.appendChild(chip);
    }
    content.appendChild(chips);
  }

  document.getElementById("infoModalWikiLink").href = wikiUrl;
  document.getElementById("infoModalBackdrop").classList.remove("hidden");
}

// Wiki text can be one giant block (and sometimes has leftover HTML). This keeps every word but cleans it up and
// splits it into short paragraphs: the first sentence stands out as a summary, the rest is grouped 2-3 sentences at a time.
function cleanWikiText(raw) {
  let s = String(raw || "");
  s = s.replace(/<\s*br\s*\/?>/gi, " ").replace(/<[^>]*>/g, " ");
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
  return s.replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  const ABBR = /(?:\b(?:Mr|Mrs|Ms|Dr|St|vs|etc|approx|No|Lv|Inc|e\.g|i\.e|cf|Jr|Sr)|\b[A-Z])\.$/;
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(\u2692\u2697\u26B7])/);
  const out = [];
  for (const p of parts) {
    if (out.length && ABBR.test(out[out.length - 1])) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out;
}

// Drop rates are written "Classic / Expert / Master", e.g. "1/40 (2.5%) / 1/20 (5%)".
// The wiki shows the Expert one in gold (and Master in orange). Do the same, with a hover note that says why.
const RATE_ONE = "\\d+(?:\\.\\d+)?\\/\\d+(?:\\.\\d+)?(?:\\s*\\(\\d+(?:\\.\\d+)?%\\))?";
const RATE_CHAIN_RE = new RegExp(`${RATE_ONE}(?:\\s\\/\\s${RATE_ONE}){1,2}`, "g");
const RATE_ONE_RE = new RegExp(RATE_ONE, "g");
function rateFragment(text) {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(RATE_CHAIN_RE)) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const parts = m[0].match(RATE_ONE_RE) || [];
    parts.forEach((p, i) => {
      if (i) frag.appendChild(document.createTextNode(" / "));
      if (i === 0) { frag.appendChild(document.createTextNode(p)); return; }
      const s = document.createElement("span");
      s.className = i === 1 ? "rate-expert" : "rate-master";
      s.dataset.tip = i === 1 ? "Expert Mode drop rate" : "Master Mode drop rate";
      s.tabIndex = 0;
      s.textContent = p;
      frag.appendChild(s);
    });
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}

function renderInfoText(container, raw) {
  const text = cleanWikiText(raw);
  if (!text) return;
  const sentences = splitSentences(text);
  const box = document.createElement("div");
  box.className = "info-text";
  const lead = document.createElement("p");
  lead.className = "info-lead";
  lead.appendChild(rateFragment(sentences[0]));
  box.appendChild(lead);
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const p = document.createElement("p");
    p.appendChild(rateFragment(buf.join(" ")));
    box.appendChild(p);
    buf = [];
  };
  for (const s of sentences.slice(1)) {
    buf.push(s);
    if (buf.join(" ").length > 230 || buf.length >= 3) flush();
  }
  flush();
  container.appendChild(box);
}

// ---------- tiny item icon + name, used inside descriptive text ----------
function miniItem(name, qty) {
  const el = document.createElement(ITEM_BY_NAME[name] ? "button" : "span");
  el.className = "mini-item";
  const ico = document.createElement("span");
  ico.className = "mini-ico";
  const img = document.createElement("img");
  img.alt = name;
  img.loading = "lazy";
  setImgWithFallbacks(img, iconCandidates(name));
  ico.appendChild(img);
  el.appendChild(ico);
  el.appendChild(document.createTextNode((qty > 1 ? qty + " " : "") + name));
  if (ITEM_BY_NAME[name]) el.addEventListener("click", (e) => { e.stopPropagation(); openChoiceModal(ITEM_BY_NAME[name]); });
  return el;
}

function formatInfoValue(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v.map(x => typeof x === "string" ? x : (x?.name || x?.npc || x?.item || "")).filter(Boolean).join(", ");
  }
  return "";
}

// picture candidates for a crafting station (uses the station picture list first, then the item of the same name)
function stationImgCandidates(name) {
  const alias = { "Placed Bottle": "Bottle", "Placed Bottles": "Bottle" }[name];
  const first = name === "Heavy Work Bench" ? [...HEAVY_BENCH_IMG, ITEM_BY_NAME[name]?.img] : [STATION_IMAGES[name], ITEM_BY_NAME[name]?.img];
  return [...new Set([...first, ...(alias ? iconCandidates(alias) : []), ...iconCandidates(name)].filter(Boolean))];
}

// Some "Dropped By" names are groups or things that are not in the NPC list (Mummies, Jellyfish, trees...).
// Map them to a picture that exists; anything else tries the wiki file of the same name.
const DROP_ICON_ALIAS = {
  "Mimics": "Mimic", "Mummies": "Mummy", "Ghouls": "Ghoul", "Jellyfish": "Blue Jellyfish", "Sand Sharks": "Sand Shark",
  "Slimes": "Green Slime", "Goblin Warlock": "Goblin Summoner", "Celestial Pillars": "Celestial Sigil",
  "Forest tree": "Wood", "Palm tree": "Palm Wood", "Boreal tree": "Boreal Wood", "Ash tree": "Ash Wood", "Mahogany tree": "Rich Mahogany",
  "Pearlwood tree": "Pearlwood", "Pearlwood Palm tree": "Pearlwood", "Ebonwood tree": "Ebonwood", "Ebonwood Palm tree": "Ebonwood",
  "Shadewood tree": "Shadewood", "Shadewood Palm tree": "Shadewood", "Giant Glowing Mushroom": "Glowing Mushroom",
};
function dropIconCandidates(name) {
  const via = DROP_ICON_ALIAS[name];
  const list = [...compareImgCandidates({ name })];
  if (via) list.unshift(...compareImgCandidates({ name: via }));
  else list.push(wikiImgUrl(name, "png"), wikiImgUrl(name, "gif"));
  return [...new Set(list.filter(Boolean))];
}

// a vertical column of rows: picture, name, and (optionally) a small note on the right such as a drop rate
function iconColumn(rows) {
  const col = document.createElement("div");
  col.className = "icon-col";
  for (const r of rows) {
    const row = document.createElement("div");
    row.className = "icon-row";
    const ico = document.createElement("span");
    ico.className = "icon-row-ico";
    if (r.img && r.img.length) {
      const img = document.createElement("img");
      img.alt = r.name;
      img.loading = "lazy";
      setImgWithFallbacks(img, r.img);
      ico.appendChild(img);
    }
    row.appendChild(ico);
    if (r.click) { row.classList.add("clickable"); row.addEventListener("click", r.click); }
    const nm = document.createElement("span");
    nm.className = "icon-row-name";
    nm.textContent = r.name;
    row.appendChild(nm);
    if (r.right) {
      const rt = document.createElement("span");
      rt.className = "icon-row-note";
      rt.appendChild(rateFragment(r.right));
      row.appendChild(rt);
    }
    col.appendChild(row);
  }
  return col;
}

// "Any ..." entries are recipe groups, not real items, so they have no wiki data of their own.
const ANY_GROUPS = {
  "Any Wood": { text: "Any Wood is a recipe group, not a single item. Any one of these woods works in the recipe. Dynasty Wood, Feywood and Pine Wood are the exceptions: they cannot be used.", members: ["Wood", "Boreal Wood", "Palm Wood", "Rich Mahogany", "Ebonwood", "Shadewood", "Ash Wood", "Pearlwood", "Spooky Wood"], wiki: "Wood" },
  "Any Iron Bar": { text: "Any Iron Bar is a recipe group, not a single item. Either bar works, so you can use whichever ore your world has.", members: ["Iron Bar", "Lead Bar"], wiki: "Iron_Bar" },
  "Any Sand": { text: "Any Sand is a recipe group, not a single item. Any of these sand blocks works in the recipe.", members: ["Sand Block", "Ebonsand Block", "Pearlsand Block", "Crimsand Block"], wiki: "Sand_Block" },
  "Any Balloon": { text: "Any Balloon is a recipe group, not a single item. Several different balloon accessories can be used in this slot of the recipe.", members: [], wiki: "Balloon_Platform" },
};

function openItemInfoModal(itemName) {
  if (ANY_GROUPS[itemName]) {
    const g = ANY_GROUPS[itemName];
    showInfoPopup({
      title: itemName,
      imgs: ITEM_BY_NAME[itemName]?.img ? [ITEM_BY_NAME[itemName].img] : [],
      subtitle: "Recipe group",
      paragraph: g.text,
      lines: [],
      related: g.members.filter(n => ITEM_BY_NAME[n]),
      relatedLabel: "Any of these work (click for crafting)",
      wikiUrl: `https://terraria.wiki.gg/wiki/${g.wiki}`,
    });
    return;
  }
  const details = ITEM_DETAILS[itemName] || {};
  const item = ITEM_BY_NAME[itemName];

  const lines = [];
  // Only items that have a real recipe get a crafting station. (The wiki's "station" field also lists
  // things the item is used to craft, like Cloud in a Bottle -> Crystal Ball, which is not how you make it.)
  const stationNames = [];
  for (const v of (RECIPES[itemName] || [])) {
    for (const s of String(v.station || "").split(/\s*\/\s*/)) {
      if (s && !/^(none|by hand)$/i.test(s) && !stationNames.includes(s)) stationNames.push(s);
    }
  }
  if (stationNames.length) {
    const sp = document.createElement("span");
    stationNames.forEach((n, i) => {
      if (i) sp.appendChild(document.createTextNode(" / "));
      const w = document.createElement("span");
      w.className = "inline-ico-name";
      const img = document.createElement("img");
      img.alt = "";
      setImgWithFallbacks(img, stationImgCandidates(n));
      w.appendChild(img);
      w.appendChild(document.createTextNode(n));
      sp.appendChild(w);
    });
    lines.push({ label: "Crafting Station", node: sp, inline: true });
  }
  const dropRows = (Array.isArray(details.drops) ? details.drops : []).map(d => ({
    name: d.enemy || d.name || "", right: d.rate || "", pct: parseFloat(d.percent) || 0,
  })).filter(d => d.name && !/^\[\d+\]$/.test(d.name));
  if (dropRows.length) {
    dropRows.sort((x, y) => y.pct - x.pct);
    lines.push({ label: `Dropped By (${dropRows.length})`, node: iconColumn(dropRows.map(d => ({ name: d.name, right: d.right, img: dropIconCandidates(d.name) }))) });
  } else {
    const drops = formatInfoValue(details.drops_summary);
    if (drops) lines.push({ label: "Dropped By", text: drops });
  }
  const soldRows = (Array.isArray(details.sold_by) ? details.sold_by : []).map(s => typeof s === "string" ? { name: s } : { name: s?.npc || s?.name || "", right: s?.price || "" }).filter(s => s.name);
  if (soldRows.length) lines.push({ label: "Sold By", node: iconColumn(soldRows.map(s => ({ name: s.name, right: s.right, img: compareImgCandidates({ name: s.name }) }))) });
  else { const sold = formatInfoValue(details.sold_by); if (sold) lines.push({ label: "Sold By", text: sold }); }
  const tags = [...(details.immunities || []), ...(details.buffs || [])];
  if (tags.length) lines.push({ label: "Buffs / Immunities", text: tags.join(", ") });

  showInfoPopup({
    title: itemName,
    imgs: item?.img ? [item.img] : [],
    subtitle: details.category || "",
    paragraph: details.tooltip || "",
    lines,
    wikiUrl: details.wiki_url || details.wiki ||
      `https://terraria.wiki.gg/wiki/${encodeURIComponent(itemName.replace(/ /g, "_"))}`,
  });
}


function closeItemInfoModal() {
  document.getElementById("infoModalBackdrop").classList.add("hidden");
}

function addInfoIconToNode(nodeElement, itemName) {
  if (!ITEM_BY_NAME[itemName]) return;

  const infoIcon = document.createElement("div");
  infoIcon.className = "item-info-icon";
  infoIcon.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="10" cy="5" r="1.7" fill="currentColor"/>
    <rect x="8.6" y="8.4" width="2.8" height="7.6" rx="1.2" fill="currentColor"/>
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