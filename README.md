# AI Image Gallery

An AI-powered image gallery that allows users to upload images, receive automatic AI-generated metadata, and search their personal image collection using text, colors, or visual similarity.

Built with **React + Vite** on the frontend and **Node.js + Express** on the backend, using **Supabase** for authentication, database, and storage.

---

## 🔗 Live Demo
https://ai-image-gallery-git-main-jais-projects-cc8ec777.vercel.app/login

## 🎥 Demo Video
https://drive.google.com/file/d/1Lrh-WlERJIhYdYgg2IcY00CupgcjlvFm/view

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

Generated metadata:
- 5–10 semantic tags
- One descriptive sentence
- Top 3 dominant colors
- Processing status (`pending`, `processing`, `completed`)

Cached metadata is reused for:
- Search
- Filtering
- Similarity matching

➡️ **No repeated AI calls** → faster performance and lower cost.

---

## 🔍 Search & Discovery
- Text search (tags + description)
- Color-based filtering
- Find similar images using metadata similarity
- Pagination supported across all search modes

Search is optimized to avoid unnecessary API calls while keeping the UI responsive.

---

## 🖼️ Image Viewer
- Full-size image preview (modal)
- Keyboard navigation (← → Esc)
- Next / Previous navigation
- Download image
- Delete image
- Find similar images
- Color-based filtering

---

## 📱 UI & UX
- Responsive grid layout
- Optimized for desktop and mobile
- Clean, minimal, professional interface
- Skeleton loaders and clear empty states

---

## 🏗️ Tech Stack

### Frontend
- React + Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Multer
- Sharp

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
- Strong accuracy on real-world images
- Simple REST-based integration
- Cost efficiency with a generous free tier

Alternatives considered:
- AWS Rekognition (higher cost)
- Azure Vision (more complex setup)

### Metadata Caching Strategy
- AI runs once per image
- Metadata stored permanently
- All discovery features use cached data
- No repeated AI calls

---

## 🚀 Local Development (Optional)

> The live demo is fully deployed and does not require local setup for review.

### Prerequisites
- Docker
- Docker Compose
- Supabase project
- Google Cloud Vision API enabled

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
│   ├── worker.js
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
