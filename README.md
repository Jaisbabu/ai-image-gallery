# AI Image Gallery

An AI-powered image gallery that allows users to upload images, receive automatic AI-generated metadata, and search their personal image collection using text, colors, or visual similarity.

Built with **React + Vite** on the frontend and **Node.js + Express** on the backend, using **Supabase** for authentication, database, and storage.

---

## ✨ Core Features

### 🔐 Authentication
- Email/password authentication using Supabase Auth
- Secure, user-isolated data access via Row Level Security (RLS)
- Each user can only access their own images and metadata

### 📤 Image Upload
- Drag & drop or file picker
- Supports JPEG, PNG, and WebP formats
- Stores:
  - Original image
  - Generated thumbnail (300×300)
- Uploads are non-blocking
- AI analysis runs asynchronously in the background

### 🤖 AI Image Analysis
Each image is processed **once** and cached.

AI generates:
- 5–10 semantic tags
- One descriptive sentence
- Top 3 dominant colors
- Processing status (`pending`, `processing`, `completed`)

All AI metadata is stored and reused for:
- Search
- Filtering
- Similarity matching

➡️ **No repeated AI calls** → faster performance and lower cost.

---

## 🔍 Search & Discovery

Supported search modes:
- **Text search** (tags + description)
- **Color-based filtering**
- **Find similar images** (metadata-based similarity)

### Search Behavior (Intentional Design)
- Search is **state-driven**, not triggered on every keystroke
- Queries shorter than 2 characters are ignored
- Empty queries reset the gallery
- Requests are cancelled using `AbortController`
- Pagination works across all search modes

This design avoids unnecessary API calls while keeping the UI responsive.

---

## 🖼️ Image Viewer
- Full-size image preview (modal)
- Keyboard navigation (← → Esc)
- Next / Previous navigation
- Download image
- Delete image
- Find similar images
- Color-based filtering
- Editable tags (bonus feature)

---

## 📱 UI & UX
- Responsive grid layout
- Optimized for desktop and mobile
- Clean, minimal, professional interface
- Skeleton loaders and clear empty states

---

## 🏗️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express.js
- Multer (uploads)
- Sharp (image processing)

### Database & Storage
- Supabase (PostgreSQL)
- Supabase Storage
- Row Level Security (RLS)

### AI Service
- Google Vision API
  - Image labeling
  - Description generation
  - Color extraction

---

## 🧠 AI Design Decisions

### Why Google Vision API?
Chosen for:
- High accuracy on real-world images
- Simple REST-based integration
- Generous free tier for prototyping

Alternatives considered:
- AWS Rekognition (higher cost)
- Azure Vision (more complex setup)

### Metadata Caching Strategy
- AI runs once per image
- Metadata is stored permanently
- All discovery features use cached data
- No repeated AI calls

---

## 🚀 Running the Project (Docker)

### Prerequisites
- Docker
- Docker Compose
- Supabase project
- Google Cloud Vision API enabled

## 🚀 Running the Project (Docker)
```bash
docker compose up --build

Services:

Frontend: http://localhost:3000

Backend: http://localhost:3001

## 📂 Project Structure

ai-image-gallery/
├── backend/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── vite.config.js
│
├── docs/
│   ├── AI_SERVICE_COMPARISON.md
│   ├── ARCHITECTURE.md
│   └── database_setup.sql



## 🔮 Future Improvements

- Albums / collections
- Batch operations
- Advanced similarity scoring
- Image editing (crop, rotate)
- Background job monitoring dashboard

## 📄 License

MIT License
