require('dotenv').config();
const express = require('express');
const jsonServer = require('json-server');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const server = express();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const IMAGE_DIR = path.join(__dirname, 'public/images');
const PORT = process.env.PORT
const HOST_URL = process.env.HOST_URL

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Middleware
server.use(middlewares);
server.use('/images', express.static(IMAGE_DIR));
server.use(express.json());

server.post('/api/argaam_weekend', upload.fields([
  { name: 'image_ar', maxCount: 1 },
  { name: 'image_en', maxCount: 1 }
]), (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: 'Images not uploaded' });
  }

  const newEntry = {
    id: Date.now(),
    title_ar: req.body.title_ar || "",
    desc_ar: req.body.desc_ar || "",
    link_ar: req.body.link_ar || "",
    image_ar: req.files.image_ar?.[0]?.filename || "",
    title_en: req.body.title_en || "",
    desc_en: req.body.desc_en || "",
    link_en: req.body.link_en || "",
    image_en: req.files.image_en?.[0]?.filename || ""
  };

  const dbFile = path.join(__dirname, 'db.json');
  const db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

  db.argaam_weekend = db.argaam_weekend || [];
  db.argaam_weekend.push(newEntry);

  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

  res.status(201).json(newEntry);
});

router.render = (req, res) => {
  if (req.originalUrl.includes('/argaam_weekend')) {
    const data = res.locals.data.map(entry => ({
      ...entry,
      image_ar: entry.image_ar ? `${HOST_URL}/images/${entry.image_ar}` : null,
      image_en: entry.image_en ? `${HOST_URL}/images/${entry.image_en}` : null,
    }));
    return res.json(data);
  }
  res.json(res.locals.data);
};

server.use('/api', router);

// Start
server.listen(PORT, () => {
  console.log(`✅ Server running at ${HOST_URL}`);
});
