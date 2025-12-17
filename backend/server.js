require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const storageService = require('./services/storage');

// Routes
const uploadRoutes = require('./routes/upload');
const imagesRoutes = require('./routes/images');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ REQUIRED for Railway / reverse proxies
app.set('trust proxy', 1);



/* -------------------- SECURITY (FIXED CSP) -------------------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.supabase.co"
        ],
      connectSrc: [
  "'self'",
  "https://*.railway.app",
  "https://*.up.railway.app",
  "https://*.supabase.co",
  "https://ai-image-gallery-git-main-jais-projects-cc8ec777.vercel.app"
],


        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"]
      }
    }
  })
);


// -------------------- CORS --------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

/* -------------------- BODY PARSING -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- RATE LIMITERS --------------------
// -------------------- RATE LIMITERS --------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});


// Apply limits
app.use('/api/images', generalLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/search', searchLimiter);





/* -------------------- HEALTH -------------------- */
app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

/* -------------------- ROUTES -------------------- */
app.use('/api/upload', uploadRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/search', searchRoutes);

/* -------------------- 404 -------------------- */
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

/* -------------------- START -------------------- */
(async () => {
  await storageService.initializeBucket();
  app.listen(PORT, () =>
    console.log(`✓ API running on http://localhost:${PORT}`)
  );
})();

module.exports = app;
