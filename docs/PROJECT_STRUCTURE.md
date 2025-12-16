# Project Structure

## Directory Tree

```
ai-image-gallery/
│
├── backend/                          # Express.js Backend
│   ├── config/
│   │   └── supabase.js              # Supabase client configuration
│   │
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication middleware
│   │
│   ├── routes/
│   │   ├── upload.js                # Image upload endpoints
│   │   ├── images.js                # CRUD operations for images
│   │   └── search.js                # Search & filter endpoints
│   │
│   ├── services/
│   │   ├── visionAI.js              # Google Vision AI integration
│   │   ├── imageProcessor.js        # Sharp image processing
│   │   ├── storage.js               # Supabase Storage operations
│   │   └── queue.js                 # Bull job queue for async processing
│   │
│   ├── .env.example                 # Environment variables template
│   ├── package.json                 # Backend dependencies
│   └── server.js                    # Express app entry point
│
├── frontend/                         # React Frontend
│   ├── public/
│   │   └── index.html               # HTML template
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.js   # Authentication guard
│   │   │   ├── ImageUpload.js      # Drag & drop upload component
│   │   │   ├── ImageGrid.js        # Gallery grid display
│   │   │   ├── ImageModal.js       # Image detail modal
│   │   │   └── SearchBar.js        # Search input component
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.js            # Login page
│   │   │   ├── SignUp.js           # Registration page
│   │   │   └── Gallery.js          # Main gallery page
│   │   │
│   │   ├── hooks/
│   │   │   └── useAuth.js          # Auth context & hooks
│   │   │
│   │   ├── utils/
│   │   │   ├── supabase.js         # Supabase client
│   │   │   └── api.js              # Backend API service
│   │   │
│   │   ├── styles/
│   │   │   └── index.css           # Global styles
│   │   │
│   │   ├── App.js                  # Main App component with routing
│   │   └── index.js                # React entry point
│   │
│   ├── .env.example                 # Environment variables template
│   └── package.json                 # Frontend dependencies
│
├── docs/                             # Documentation
│   ├── AI_SERVICE_COMPARISON.md     # AI service evaluation
│   ├── ARCHITECTURE.md               # System architecture
│   ├── DEPLOYMENT.md                 # Deployment guide
│   └── database_setup.sql            # Database schema & RLS
│
├── .gitignore                        # Git ignore rules
└── README.md                         # Project documentation
```

## File Descriptions

### Backend Files

#### Configuration
- **config/supabase.js**: Initializes Supabase admin and user clients

#### Middleware
- **middleware/auth.js**: Verifies JWT tokens, attaches user to request

#### Routes
- **routes/upload.js**: 
  - POST /api/images/upload - Upload multiple images
  - Validates, optimizes, generates thumbnails
  - Queues AI processing

- **routes/images.js**:
  - GET /api/images - List user's images (paginated)
  - GET /api/images/:id - Get single image details
  - DELETE /api/images/:id - Delete image and files

- **routes/search.js**:
  - GET /api/search/text - Search by tags/description
  - GET /api/search/similar/:id - Find similar images
  - GET /api/search/color - Filter by color

#### Services
- **services/visionAI.js**:
  - Wraps Google Vision API
  - Analyzes images for tags, descriptions, colors
  - Handles errors and fallbacks

- **services/imageProcessor.js**:
  - Uses Sharp for image manipulation
  - Validates images
  - Generates thumbnails
  - Optimizes for storage

- **services/storage.js**:
  - Manages Supabase Storage
  - Uploads/downloads files
  - Generates signed URLs
  - Deletes files

- **services/queue.js**:
  - Bull job queue implementation
  - Background AI processing
  - Retry logic
  - Job status tracking

#### Main
- **server.js**:
  - Express app setup
  - Middleware configuration
  - Route mounting
  - Error handling
  - Server initialization

### Frontend Files

#### Components
- **ProtectedRoute.js**: Redirects unauthenticated users to login
- **ImageUpload.js**: Drag & drop zone with upload progress
- **ImageGrid.js**: Masonry/grid layout of images
- **ImageModal.js**: Full-size image view with metadata
- **SearchBar.js**: Search input with clear button

#### Pages
- **Login.js**: Email/password login form
- **SignUp.js**: Email/password registration form
- **Gallery.js**: Main app - grid, search, upload

#### Hooks
- **useAuth.js**: Auth context provider and consumer hook

#### Utils
- **supabase.js**: Supabase client initialization
- **api.js**: Centralized API calls to backend

#### Main
- **App.js**: Router setup, route definitions
- **index.js**: React DOM rendering

### Documentation Files

- **AI_SERVICE_COMPARISON.md**: 
  - Comparison of AI services
  - Decision rationale
  - Implementation details

- **ARCHITECTURE.md**:
  - System design
  - Data flow
  - Technology choices
  - Scalability considerations

- **DEPLOYMENT.md**:
  - Step-by-step deployment guides
  - Platform-specific instructions
  - Troubleshooting tips

- **database_setup.sql**:
  - Table definitions
  - Indexes
  - RLS policies
  - Helper functions

## Key Design Patterns

### Backend Patterns

**Service Layer Pattern**
```
Routes → Services → Database/External APIs
```
- Routes handle HTTP concerns
- Services contain business logic
- Clean separation of concerns

**Repository Pattern**
```
Services → Supabase Client → Database
```
- Database access abstracted
- Easy to mock for testing
- Can swap databases later

**Job Queue Pattern**
```
Upload → Queue → Background Worker → Database
```
- Non-blocking operations
- Retry logic
- Scalable processing

### Frontend Patterns

**Container/Component Pattern**
```
Pages (containers) → Components (presentational)
```
- Pages handle data/logic
- Components handle UI
- Reusable components

**Custom Hooks Pattern**
```
useAuth, useImages, useSearch
```
- Reusable logic
- Clean component code
- Easy to test

**Context API Pattern**
```
AuthProvider → useAuth hook → Components
```
- Global state management
- Avoid prop drilling
- Simple and effective

## Data Flow Summary

### Upload Flow
```
User → ImageUpload → API → Express
       ↓
Storage ← imageProcessor ← Multer
       ↓
Database ← Routes
       ↓
Queue ← queue service
       ↓
AI Processing (background)
       ↓
Database (update metadata)
```

### View Flow
```
User → Gallery → API → Express
                      ↓
                 Database (query)
                      ↓
                 Storage (signed URLs)
                      ↓
                 Response → Gallery → ImageGrid
```

### Search Flow
```
User → SearchBar → Gallery → API → Express
                                   ↓
                              Database (query with filters)
                                   ↓
                              Storage (signed URLs)
                                   ↓
                              Response → Gallery → ImageGrid
```

## API Endpoints Summary

### Authentication
- All endpoints require `Authorization: Bearer <token>`
- Token verified via Supabase Auth

### Upload
```
POST /api/images/upload
Content-Type: multipart/form-data
Body: images[] (files)
Response: { success, results[] }
```

### Images
```
GET /api/images?page=1&limit=20
Response: { images[], pagination }

GET /api/images/:id
Response: { image, metadata }

DELETE /api/images/:id
Response: { success }
```

### Search
```
GET /api/search/text?q=sunset&page=1
Response: { images[], pagination }

GET /api/search/similar/:id?limit=12
Response: { images[] }

GET /api/search/color?color=%23FF5733&page=1
Response: { images[], pagination }
```

## Environment Variables

### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./google-vision-credentials.json

# Redis
REDIS_URL=redis://localhost:6379

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```bash
# Supabase
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=

# API
REACT_APP_API_URL=http://localhost:3001/api
```

## Dependencies Overview

### Backend Core
- express: Web framework
- @supabase/supabase-js: Database & auth
- @google-cloud/vision: AI service
- sharp: Image processing
- multer: File upload handling
- bull: Job queue
- redis: Queue storage

### Backend Utilities
- cors: CORS handling
- helmet: Security headers
- dotenv: Environment variables
- express-rate-limit: Rate limiting
- uuid: Unique IDs

### Frontend Core
- react: UI library
- react-router-dom: Routing
- @supabase/supabase-js: Auth & database

### Frontend UI
- lucide-react: Icons
- react-dropzone: File uploads
- react-hot-toast: Notifications
- tailwindcss: Styling

## Getting Started Quick Reference

1. **Clone repo**
2. **Setup Supabase**
   - Create project
   - Run SQL script
   - Create storage bucket
3. **Setup Google Cloud**
   - Enable Vision API
   - Create service account
   - Download credentials
4. **Backend**
   - `cd backend`
   - `npm install`
   - Copy `.env.example` to `.env`
   - Fill in credentials
   - `npm run dev`
5. **Frontend**
   - `cd frontend`
   - `npm install`
   - Copy `.env.example` to `.env`
   - Fill in credentials
   - `npm start`
6. **Test**
   - Visit http://localhost:3000
   - Sign up
   - Upload image
   - Wait for AI processing
   - Search and explore!

---

This structure prioritizes:
- ✅ **Clarity**: Easy to navigate
- ✅ **Modularity**: Separated concerns
- ✅ **Maintainability**: Logical organization
- ✅ **Scalability**: Room to grow
