/**
 * e COH v2.0 Private Cloud & Hybrid Persistence Engine
 * Supports LocalStorage fail-safe, Base64 Image Repository, and Vercel/Firestore Sync
 */

const ECOH_KEYS = {
  USERS: 'ecoh_v2_users',
  CONFIG: 'ecoh_v2_config',
  CRAFTICLES: 'ecoh_v2_crafticles',
  SESSION: 'ecoh_v2_session',
  SUBMISSIONS: 'ecoh_v2_submissions'
};

const DEFAULT_CONFIG = {
  quizPoints: 10,
  crafticlePoints: 20,
  level1Req: 50,  // Bronze Seedling
  level2Req: 150, // Silver Sprout
  level3Req: 300  // Gold Canopy
};

const DEFAULT_CRAFTICLES = [
  {
    id: "craft-1",
    title: "Plastic Bottle Planter",
    category: "Plastic",
    points: 20,
    description: "Transform an empty plastic soda bottle into a self-watering herb planter.",
    procedure: "1. Clean and dry a 2L plastic bottle.\n2. Cut bottle in half 4 inches below neck.\n3. Invert top neck into bottom base.\n4. Thread cotton yarn through cap hole for wick.\n5. Fill top with potting soil and plant seeds.\n6. Add water to bottom reservoir.",
    icon: "potted_plant"
  },
  {
    id: "craft-2",
    title: "Cardboard Desk Organizer",
    category: "Paper & Cardboard",
    points: 25,
    description: "Upcycle discarded shipping boxes into a multi-tier desk stationery organizer.",
    procedure: "1. Flatten cardboard shipping box.\n2. Measure and cut 3 tiered compartment dividers.\n3. Glue dividers using non-toxic PVA glue.\n4. Wrap exterior in recycled kraft paper or fabric.\n5. Allow to dry for 2 hours before placing stationery.",
    icon: "inventory_2"
  },
  {
    id: "craft-3",
    title: "Old T-Shirt Tote Bag",
    category: "Textile",
    points: 20,
    description: "Convert a worn cotton t-shirt into a reusable grocery tote without any sewing.",
    procedure: "1. Lay t-shirt flat on working table.\n2. Cut off sleeves and neckline collar.\n3. Cut 1-inch wide vertical fringe strips along bottom hem.\n4. Tie corresponding front and back strips into double knots.\n5. Turn bag inside out for clean finished tote bag.",
    icon: "shopping_bag"
  },
  {
    id: "craft-4",
    title: "Glass Jar Ambient Lantern",
    category: "Glass",
    points: 15,
    description: "Repurpose empty food mason jars into decorative solar or LED tea-light lanterns.",
    procedure: "1. Remove paper labels with warm soapy water.\n2. Wrap exterior with twine or lace patterns.\n3. Insert battery tea light or micro solar fairy string lights inside.\n4. Secure wire handle around jar neck for hanging.",
    icon: "light"
  },
  {
    id: "craft-5",
    title: "Newspaper Seed Starter Pots",
    category: "Paper",
    points: 15,
    description: "Fold biodegradable seedling pots from old newspaper pages for garden planting.",
    procedure: "1. Cut newspaper into 5-inch wide strips.\n2. Roll strip tightly around small glass jar base.\n3. Fold bottom edges inward to seal base.\n4. Slide off jar, fill with compost, and plant seeds.",
    icon: "eco"
  },
  {
    id: "craft-6",
    title: "Tin Can Pencil Holder",
    category: "Metal",
    points: 20,
    description: "Upcycle washed soup cans into rustic desktop pen and paintbrush holders.",
    procedure: "1. Clean tin can and sand any sharp top rim edges smooth.\n2. Wrap can body with burlap, jute twine, or painted paper.\n3. Apply craft sealer and dry.",
    icon: "edit"
  },
  {
    id: "craft-7",
    title: "Denim Pocket Wall Organizer",
    category: "Textile",
    points: 30,
    description: "Repurpose pockets from old jeans into a multi-pocket wall hanging organizer.",
    procedure: "1. Carefully cut back pockets from worn jeans.\n2. Arrange and glue pockets onto sturdy cardboard or wood backing.\n3. Attach top cord for wall mounting.",
    icon: "space_dashboard"
  },
  {
    id: "craft-8",
    title: "Bottle Cap Mosaic Coasters",
    category: "Metal & Plastic",
    points: 25,
    description: "Craft eco-friendly drink coasters using collected metal and plastic bottle caps.",
    procedure: "1. Collect 7-9 bottle caps of uniform height.\n2. Arrange caps in hexagon layout on cork tile base.\n3. Adhere caps with strong eco-resin or non-toxic glue.",
    icon: "grid_on"
  }
];

class ECOHDatabase {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    try {
      if (!localStorage.getItem(ECOH_KEYS.CONFIG)) {
        localStorage.setItem(ECOH_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      }

      if (!localStorage.getItem(ECOH_KEYS.CRAFTICLES)) {
        localStorage.setItem(ECOH_KEYS.CRAFTICLES, JSON.stringify(DEFAULT_CRAFTICLES));
      }

      if (!localStorage.getItem(ECOH_KEYS.USERS)) {
        localStorage.setItem(ECOH_KEYS.USERS, JSON.stringify([]));
      }

      if (!localStorage.getItem(ECOH_KEYS.SUBMISSIONS)) {
        localStorage.setItem(ECOH_KEYS.SUBMISSIONS, JSON.stringify([]));
      }
    } catch (e) {
      console.error("LocalStorage Initialization Error:", e);
    }
  }

  getConfig() {
    try {
      return JSON.parse(localStorage.getItem(ECOH_KEYS.CONFIG)) || DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  }

  saveConfig(newConfig) {
    try {
      const merged = { ...this.getConfig(), ...newConfig };
      localStorage.setItem(ECOH_KEYS.CONFIG, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error("Error saving config:", e);
      return this.getConfig();
    }
  }

  getCrafticles() {
    try {
      return JSON.parse(localStorage.getItem(ECOH_KEYS.CRAFTICLES)) || DEFAULT_CRAFTICLES;
    } catch (e) {
      return DEFAULT_CRAFTICLES;
    }
  }

  saveCrafticle(updatedItem) {
    try {
      const list = this.getCrafticles();
      const idx = list.findIndex(c => c.id === updatedItem.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updatedItem };
      } else {
        list.push(updatedItem);
      }
      localStorage.setItem(ECOH_KEYS.CRAFTICLES, JSON.stringify(list));
      return list;
    } catch (e) {
      console.error("Error saving crafticle:", e);
      return this.getCrafticles();
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(ECOH_KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  }

  getUser(uid) {
    const users = this.getUsers();
    return users.find(u => u.uid === uid) || null;
  }

  saveUser(userObj) {
    try {
      const users = this.getUsers();
      const idx = users.findIndex(u => u.uid === userObj.uid);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...userObj };
      } else {
        users.push(userObj);
      }
      localStorage.setItem(ECOH_KEYS.USERS, JSON.stringify(users));
      return userObj;
    } catch (e) {
      console.error("Error saving user:", e);
      return userObj;
    }
  }

  recordSubmission(submissionObj) {
    try {
      const subs = JSON.parse(localStorage.getItem(ECOH_KEYS.SUBMISSIONS)) || [];
      const newSub = {
        id: "sub-" + Date.now(),
        timestamp: new Date().toISOString(),
        ...submissionObj
      };
      subs.unshift(newSub);
      localStorage.setItem(ECOH_KEYS.SUBMISSIONS, JSON.stringify(subs));
      return newSub;
    } catch (e) {
      console.error("Error recording submission:", e);
    }
  }

  getSubmissions() {
    try {
      return JSON.parse(localStorage.getItem(ECOH_KEYS.SUBMISSIONS)) || [];
    } catch (e) {
      return [];
    }
  }

  deleteSubmission(subId) {
    try {
      let subs = this.getSubmissions();
      subs = subs.filter(s => s.id !== subId);
      localStorage.setItem(ECOH_KEYS.SUBMISSIONS, JSON.stringify(subs));
      return subs;
    } catch (e) {
      console.error("Error deleting submission:", e);
      return this.getSubmissions();
    }
  }

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(ECOH_KEYS.SESSION)) || null;
    } catch (e) {
      return null;
    }
  }

  setSession(userObj) {
    try {
      localStorage.setItem(ECOH_KEYS.SESSION, JSON.stringify(userObj));
    } catch (e) {
      console.error("Error setting session:", e);
    }
  }

  clearSession() {
    try {
      localStorage.removeItem(ECOH_KEYS.SESSION);
    } catch (e) {
      console.error("Error clearing session:", e);
    }
  }
}

const db = new ECOHDatabase();
window.ecohDb = db;
