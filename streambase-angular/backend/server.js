const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

// Create server
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Upload directory
const uploadDir = path.join(__dirname, "public", "uploads", "users");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// --- LowDB Setup ---
const dbFile = path.join(__dirname, "streambase-db.json");
const adapter = new JSONFile(dbFile);
const defaultData = {
  users: [],
  admin: [],
  movies: [],
  notifications: [],
  reviews: [],
  "movie-requests": [],
  uploads: [],
  "archived-users": [],
  "archived-admin": [],
};

// Initialize LowDB
const db = new Low(adapter, defaultData);

// Function to initialize the database
const initDB = async () => {
  await db.read();
  db.data ||= { ...defaultData };
  await db.write();
};

// --- API Routes ---

// Upload endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const userId = req.body.userId;
  const filePath = `/uploads/users/${req.file.filename}`;
  const fullPath = path.join(__dirname, "public", filePath);

  await db.read();

  // Delete previous user image if userId is provided
  if (userId) {
    const user = db.data.users.find((u) => u.id === userId);
    if (user?.image) {
      const oldImagePath = path.join(__dirname, "public", user.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log(`🗑️ Deleted old image: ${user.image}`);
      }
    }

    // Update user image path
    const userIndex = db.data.users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      db.data.users[userIndex].image = filePath;
    }
  }

  // Save new upload record
  db.data.uploads ||= [];
  db.data.uploads.push({
    id: Date.now().toString(),
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: filePath,
    size: req.file.size,
    mimetype: req.file.mimetype,
    createdAt: new Date().toISOString(),
  });

  await db.write();

  res.json({ path: filePath });
});

// 🔁 Helper to simplify route handlers
const makeCrudRoutes = (resource) => {
  const base = `/api/${resource}`;

  // GET all with optional filtering and sorting
  app.get(base, async (req, res) => {
    await db.read();
    const list = db.data[resource] || [];

    // 🔍 Filtering
    let filtered = list;
    Object.keys(req.query).forEach((key) => {
      if (key !== "sortBy" && key !== "order") {
        filtered = filtered.filter((item) => item[key] == req.query[key]);
      }
    });

    // 🔃 Sorting (e.g., ?sortBy=createdAt&order=desc)
    const sortBy = req.query.sortBy;
    const order = req.query.order || "asc";
    if (sortBy) {
      filtered = filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === "string") {
          return order === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
      });
    }

    res.json(filtered);
  });

  // GET one by ID
  app.get(`${base}/:id`, async (req, res) => {
    await db.read();
    const item = (db.data[resource] || []).find((r) => r.id === req.params.id);
    if (!item)
      return res.status(404).json({ error: `${resource} item not found` });
    res.json(item);
  });

  // POST new
  app.post(base, async (req, res) => {
    await db.read();
    const newItem = { id: Date.now().toString(), ...req.body };
    db.data[resource] ||= [];
    db.data[resource].push(newItem);
    await db.write();
    res.status(201).json(newItem);
  });

  // PATCH by ID
  app.patch(`${base}/:id`, async (req, res) => {
    await db.read();
    const index = db.data[resource].findIndex((r) => r.id === req.params.id);
    if (index === -1)
      return res.status(404).json({ error: `${resource} item not found` });

    db.data[resource][index] = {
      ...db.data[resource][index],
      ...req.body,
    };
    await db.write();
    res.json(db.data[resource][index]);
  });

  // DELETE by ID
  app.delete(`${base}/:id`, async (req, res) => {
    await db.read();
    const originalLength = db.data[resource].length;
    db.data[resource] = db.data[resource].filter((r) => r.id !== req.params.id);
    if (db.data[resource].length === originalLength) {
      return res.status(404).json({ error: `${resource} item not found` });
    }
    await db.write();
    res.status(204).end();
  });
};

(async () => {
  // Initialize the database
  await initDB();
  console.log("LowDB initialized");

  // Register routes for all collections
  [
    "users",
    "admin",
    "uploads",
    "movies",
    "notifications",
    "reviews",
    "movie-requests",
    "archived-users",
    "archived-admin",
  ].forEach(makeCrudRoutes);

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`LowDB Server running at http://localhost:${port}`);
  });
})();

