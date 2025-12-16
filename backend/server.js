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
          "http://localhost:3000",
          "http://localhost:3001",
          "https://*.supabase.co"
        ],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"]
      }
    }
  })
);

/* -------------------- CORS -------------------- */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

/* -------------------- BODY PARSING -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- RATE LIMIT -------------------- */
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

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



// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const storageService = require('./services/storage');

// // Routes
// const uploadRoutes = require('./routes/upload');
// const imagesRoutes = require('./routes/images');
// const searchRoutes = require('./routes/search');

// const app = express();
// const PORT = process.env.PORT || 3001;

// /* -------------------- SECURITY (FIXED CSP) -------------------- */
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'", "'unsafe-inline'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         imgSrc: [
//           "'self'",
//           "data:",
//           "blob:",
//           "https://*.supabase.co"
//         ],
//         connectSrc: [
//           "'self'",
//           "http://localhost:3000",
//           "http://localhost:3001",
//           "https://*.supabase.co"
//         ],
//         fontSrc: ["'self'", "data:"],
//         objectSrc: ["'none'"]
//       }
//     }
//   })
// );

// /* -------------------- CORS -------------------- */
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true
//   })
// );

// /* -------------------- BODY PARSING -------------------- */
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* -------------------- RATE LIMIT -------------------- */
// app.use(
//   '/api',
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100
//   })
// );

// /* -------------------- HEALTH -------------------- */
// app.get('/health', (_, res) => {
//   res.json({ status: 'ok' });
// });

// /* -------------------- ROUTES -------------------- */
// app.use('/api/upload', uploadRoutes);
// app.use('/api/images', imagesRoutes);
// app.use('/api/search', searchRoutes);

// /* -------------------- 404 -------------------- */
// app.use((req, res) => {
//   res.status(404).json({ error: 'Not Found', path: req.path });
// });

// /* -------------------- ERROR HANDLER -------------------- */
// app.use((err, req, res, next) => {
//   console.error(err);
//   res.status(500).json({ error: 'Server error' });
// });

// /* -------------------- START -------------------- */
// (async () => {
//   await storageService.initializeBucket();
//   app.listen(PORT, () =>
//     console.log(`✓ API running on http://localhost:${PORT}`)
//   );
// })();

// module.exports = app;



// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const storageService = require('./services/storage');

// // Routes
// const uploadRoutes = require('./routes/upload');
// const imagesRoutes = require('./routes/images');
// const searchRoutes = require('./routes/search');

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Security
// app.use(helmet());

// // CORS
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

// // Body parsing
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Rate limit
// app.use('/api', rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100
// }));

// // Health
// app.get('/health', (_, res) => {
//   res.json({ status: 'ok' });
// });

// // ✅ CORRECT ROUTE MOUNTING
// app.use('/api/upload', uploadRoutes);   // POST /api/images/upload
// app.use('/api/images', imagesRoutes);   // GET /api/images, DELETE /api/images/:id
// app.use('/api/search', searchRoutes);

// // 404
// app.use((req, res) => {
//   res.status(404).json({ error: 'Not Found', path: req.path });
// });

// // Errors
// app.use((err, req, res, next) => {
//   console.error(err);
//   res.status(500).json({ error: 'Server error' });
// });

// // Start
// (async () => {
//   await storageService.initializeBucket();
//   app.listen(PORT, () =>
//     console.log(`✓ API running on http://localhost:${PORT}`)
//   );
// })();

// module.exports = app;


// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const storageService = require('./services/storage');

// // Import routes
// const uploadRoutes = require('./routes/upload');
// const imagesRoutes = require('./routes/images');
// const searchRoutes = require('./routes/search');

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Security middleware
// app.use(helmet());

// // CORS configuration
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

// // Body parser
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api/', limiter);

// // Health check
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// // ✅ ROUTES (IMPORTANT CHANGE HERE)
// app.use('/api/upload', uploadRoutes);   // ⬅️ moved upload here
// app.use('/api/images', imagesRoutes);
// app.use('/api/search', searchRoutes);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     error: 'Not Found',
//     path: req.path
//   });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('Server error:', err);

//   if (err.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({
//       error: 'File too large',
//       message: 'Maximum file size is 10MB'
//     });
//   }

//   if (err.code === 'LIMIT_FILE_COUNT') {
//     return res.status(400).json({
//       error: 'Too many files',
//       message: 'Maximum 10 files per upload'
//     });
//   }

//   if (err.message?.includes('Invalid file type')) {
//     return res.status(400).json({
//       error: 'Invalid file type',
//       message: err.message
//     });
//   }

//   res.status(err.status || 500).json({
//     error: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// // Start server
// async function startServer() {
//   try {
//     await storageService.initializeBucket();
//     console.log('✓ Storage initialized');

//     app.listen(PORT, () => {
//       console.log(`✓ Server running on port ${PORT}`);
//       console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
//       console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, shutting down gracefully...');
//   process.exit(0);
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT received, shutting down gracefully...');
//   process.exit(0);
// });

// startServer();

// module.exports = app;






// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const storageService = require('./services/storage');

// // Import routes
// const uploadRoutes = require('./routes/upload');
// const imagesRoutes = require('./routes/images');
// const searchRoutes = require('./routes/search');

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Security middleware
// app.use(helmet());

// // CORS configuration
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

// // Body parser
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api/', limiter);

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// // API Routes
// app.use('/api/images', uploadRoutes);
// app.use('/api/images', imagesRoutes);
// app.use('/api/search', searchRoutes);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     error: 'Not Found',
//     path: req.path
//   });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('Server error:', err);

//   // Multer errors
//   if (err.code === 'LIMIT_FILE_SIZE') {
//     return res.status(400).json({
//       error: 'File too large',
//       message: 'Maximum file size is 10MB'
//     });
//   }

//   if (err.code === 'LIMIT_FILE_COUNT') {
//     return res.status(400).json({
//       error: 'Too many files',
//       message: 'Maximum 10 files per upload'
//     });
//   }

//   if (err.message?.includes('Invalid file type')) {
//     return res.status(400).json({
//       error: 'Invalid file type',
//       message: err.message
//     });
//   }

//   // Generic error
//   res.status(err.status || 500).json({
//     error: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// // Initialize and start server
// async function startServer() {
//   try {
//     // Initialize storage bucket
//     await storageService.initializeBucket();
//     console.log('✓ Storage initialized');

//     // Start server
//     app.listen(PORT, () => {
//       console.log(`✓ Server running on port ${PORT}`);
//       console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
//       console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// // Handle graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, shutting down gracefully...');
//   process.exit(0);
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT received, shutting down gracefully...');
//   process.exit(0);
// });

// // Start the server
// startServer();

// module.exports = app;
