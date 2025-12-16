AI Image Gallery

(Vite + React + Node.js + Docker)

An AI-powered image gallery that analyzes uploaded images and enables smart search, color filtering, and visual similarity discovery.

The project uses React + Vite on the frontend and Node.js + Express on the backend, with Supabase for authentication, database, and storage.
All services are designed to run locally via Docker for consistent development.

🌟 Key Features
🔐 User Authentication

Email/password authentication using Supabase Auth

Each user can access only their own images

Enforced using Row Level Security (RLS)

📤 Image Upload

Drag & drop or file picker

Supports JPEG, PNG, WebP

Stores:

Original image

Generated thumbnail (300×300)

Uploads are non-blocking

AI analysis runs asynchronously

🤖 AI Image Analysis

Each image is processed once and cached.

AI generates:

5–10 semantic tags

One-sentence description

Dominant colors (top 3)

Processing status (pending, processing, completed)

AI metadata is stored in the database and reused for:

Search

Filtering

Similarity matching

➡️ No repeated AI calls → faster & cheaper

🔍 Search & Discovery

Supported modes:

Text search (tags + description)

Color-based filtering

Find similar images (metadata-based)

Search Behavior (Intentional Design)

Search is state-driven, not triggered on every keystroke

Queries shorter than 2 characters are ignored

Empty queries reset the gallery

Requests are cancelled using AbortController

Pagination works across all search modes

This avoids unnecessary API calls while keeping the UI responsive.

🖼️ Image Viewer (Modal)

Full-size image preview

Keyboard navigation (← → Esc)

Next / Previous navigation

Download image

Delete image

Find similar images

Color-based filtering

Editable tags (bonus feature)

📱 Responsive UI

Grid-based layout

Optimized for desktop & mobile

Clean, minimal, professional design

🏗️ Tech Stack
Frontend

React 18

Vite

Tailwind CSS

Lucide React

React Dropzone

Backend

Node.js

Express.js

Multer (uploads)

Sharp (image processing)

Database & Storage

Supabase (PostgreSQL)

Supabase Storage

Row Level Security (RLS)

AI Service

Google Vision API

Image labeling

Description generation

Color extraction

Infrastructure

Docker

Docker Compose

🧠 AI Design Decisions
Why Google Vision AI?

Chosen for:

High accuracy on real-world images

Simple REST API

Generous free tier for prototyping

Trade-offs:

Vendor lock-in

Cost per request at scale

AI Metadata Caching

AI runs once per image

Metadata is stored permanently

All discovery features use cached data

No repeated AI calls

🚀 Getting Started (Docker)
Prerequisites

Docker

Docker Compose

Supabase account

Google Cloud Vision API enabled

Start the Application
docker compose up --build


This starts:

Frontend (Vite)

Backend (Express API)

Any required background services

Frontend: http://localhost:3000

Backend: http://localhost:3001

📂 Project Structure
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

🧪 Development Notes

AI processing is asynchronous

Search relies exclusively on stored metadata

Pagination is applied for performance

AbortController prevents stale responses

Vite provides instant HMR and fast builds

🔮 Future Improvements

Albums / collections

Batch operations

Advanced similarity scoring

Image editing (crop, rotate)

Background job monitoring dashboard

📄 License

MIT License