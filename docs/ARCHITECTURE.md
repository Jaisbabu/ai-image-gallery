# Architecture Documentation

## System Overview

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐     ┌──────────────┐
│   Express   │────▶│   Supabase   │
│   Backend   │     │  (Database)  │
└──────┬──────┘     └──────────────┘
       │
       ├──────────▶ Google Vision AI
       │
       ├──────────▶ Supabase Storage
       │
       └──────────▶ Redis Queue
```

## Component Architecture

### Frontend (React)

```
src/
├── components/
│   ├── ProtectedRoute.js      # Auth guard
│   ├── ImageUpload.js          # Drag & drop upload
│   ├── ImageGrid.js            # Gallery display
│   ├── ImageModal.js           # Detail view
│   └── SearchBar.js            # Search input
├── pages/
│   ├── Login.js                # Authentication
│   ├── SignUp.js               # Registration
│   └── Gallery.js              # Main gallery
├── hooks/
│   └── useAuth.js              # Auth context
├── utils/
│   ├── supabase.js             # Supabase client
│   └── api.js                  # Backend API calls
└── styles/
    └── index.css               # Global styles
```

**Key Patterns:**
- **Context API**: Global auth state management
- **Custom Hooks**: Reusable logic (useAuth)
- **Protected Routes**: Authentication guards
- **API Layer**: Centralized backend communication

### Backend (Express.js)

```
backend/
├── config/
│   └── supabase.js             # DB client
├── services/
│   ├── visionAI.js             # Google Vision wrapper
│   ├── imageProcessor.js       # Sharp utilities
│   ├── storage.js              # Supabase Storage
│   └── queue.js                # Bull job queue
├── middleware/
│   └── auth.js                 # JWT verification
├── routes/
│   ├── upload.js               # Upload endpoints
│   ├── images.js               # CRUD endpoints
│   └── search.js               # Search endpoints
└── server.js                   # Express app
```

**Key Patterns:**
- **Service Layer**: Business logic separation
- **Middleware**: Cross-cutting concerns (auth, rate limiting)
- **Job Queue**: Async processing
- **Error Handling**: Centralized error middleware

## Data Flow

### Image Upload Flow

```
1. User drops image in browser
   ↓
2. React validates file (type, size)
   ↓
3. POST /api/images/upload with FormData
   ↓
4. Express validates and processes:
   - Validate image with Sharp
   - Optimize original (max 2400px)
   - Generate thumbnail (300x300)
   ↓
5. Upload both to Supabase Storage
   ↓
6. Insert record in database:
   - images table (paths, metadata)
   - image_metadata table (status: pending)
   ↓
7. Queue AI processing job in Redis
   ↓
8. Return success to client
   ↓
9. Background worker picks up job:
   - Download image from storage
   - Call Google Vision API
   - Extract tags, description, colors
   - Update image_metadata table
   ↓
10. Client polls or refreshes to see results
```

### Search Flow

```
Text Search:
User types "sunset beach"
   ↓
GET /api/search/text?q=sunset+beach
   ↓
Backend queries:
   SELECT * FROM images
   JOIN image_metadata
   WHERE tags @> '{sunset}' OR tags @> '{beach}'
   OR description ILIKE '%sunset beach%'
   ↓
Return results with signed URLs

Similar Images:
User clicks "Find Similar" on image
   ↓
GET /api/search/similar/:id
   ↓
Backend:
   1. Get source image tags/colors
   2. Query all user images
   3. Calculate similarity scores:
      - Tag overlap (Jaccard index)
      - Color overlap
   4. Sort by score
   5. Return top matches

Color Filter:
User clicks color #FF5733
   ↓
GET /api/search/color?color=%23FF5733
   ↓
Backend queries:
   SELECT * FROM images
   JOIN image_metadata
   WHERE colors @> '{"#FF5733"}'
```

## Database Schema

### Entity Relationship

```
auth.users (Supabase)
    ↓ 1:N
images
    ├── id (PK)
    ├── user_id (FK)
    ├── filename
    ├── original_path
    ├── thumbnail_path
    └── uploaded_at
    ↓ 1:1
image_metadata
    ├── id (PK)
    ├── image_id (FK)
    ├── user_id (FK)
    ├── description
    ├── tags[] (array)
    ├── colors[] (array)
    └── ai_processing_status
```

### Indexes

```sql
-- Performance indexes
images: (user_id), (uploaded_at DESC)
image_metadata: (user_id), (image_id), (tags GIN), (colors GIN)
```

**Why these indexes?**
- `user_id`: Fast user filtering (RLS)
- `uploaded_at DESC`: Chronological listing
- `tags GIN`: Efficient array searches
- `colors GIN`: Efficient array searches

## Security Architecture

### Authentication Flow

```
1. User signs up/in with Supabase Auth
2. Supabase returns JWT access token
3. Frontend stores token in memory
4. All API requests include: Authorization: Bearer <token>
5. Backend middleware verifies token with Supabase
6. Token includes user_id for RLS
```

### Row-Level Security (RLS)

```sql
-- Example RLS policy
CREATE POLICY "Users see own images"
ON images FOR SELECT
USING (auth.uid() = user_id);
```

**RLS Benefits:**
- Database-level security
- No way to bypass in code
- Automatic multi-tenancy
- Zero-trust architecture

### Storage Security

```
Supabase Storage:
├── Bucket: images (PRIVATE)
├── Path: {user_id}/{filename}
├── Access: Signed URLs (1 hour expiry)
└── Policies: User can access own folder
```

## Performance Optimizations

### Image Processing
- **Optimization**: Resize large images to max 2400px
- **Thumbnails**: 300x300 for grid view
- **Format**: Convert to JPEG for consistency
- **Quality**: 85-90% for good balance

### Caching Strategy
- **Browser**: Image caching with proper headers
- **Database**: Indexes for fast queries
- **API**: No caching (fresh data priority)
- **Future**: Redis cache for popular queries

### Pagination
- **Limit**: 20 images per page
- **Offset**: Page-based pagination
- **Trade-off**: Simple but can have issues at scale
- **Future**: Cursor-based pagination

## Scalability Considerations

### Current Limits
- File size: 10MB per image
- Concurrent uploads: 10 images
- Users: ~1000 concurrent (single instance)
- Storage: Unlimited (Supabase)

### Bottlenecks
1. **AI Processing**: Sequential, rate-limited
2. **Redis**: Single instance
3. **Backend**: Single instance

### Scaling Path
1. **Horizontal Backend**: Multiple Express instances
2. **Redis Cluster**: Distributed queue
3. **CDN**: Serve thumbnails via CDN
4. **Batch Processing**: Parallel AI processing
5. **Database**: Read replicas for queries

## Technology Choices

### Why Express.js?
- Simple, flexible, well-documented
- Large ecosystem
- Easy to understand for beginners
- Good for MVP/prototyping

### Why Supabase?
- PostgreSQL (powerful, reliable)
- Built-in auth (saves time)
- RLS (security by default)
- Storage included
- Generous free tier

### Why Google Vision AI?
- Best accuracy/features ratio
- Single API call for all data
- Production-ready
- Good documentation
- Affordable pricing

### Why React?
- Component-based architecture
- Large ecosystem
- Great for interactive UIs
- Easy to learn
- Industry standard

### Why Redis/Bull?
- Reliable job queue
- Retry logic built-in
- Job persistence
- Observable (can monitor jobs)
- Production-tested

## Error Handling Strategy

### Frontend
```javascript
try {
  const result = await api.uploadImages(files);
  toast.success('Upload complete');
} catch (error) {
  toast.error(error.message || 'Upload failed');
  // Log to error service (Sentry, etc.)
}
```

### Backend
```javascript
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message,
    ...(isDev && { stack: error.stack })
  });
});
```

### Graceful Degradation
- **Upload fails**: Show error, allow retry
- **AI processing fails**: Mark as failed, allow retry
- **Search fails**: Fall back to showing all images
- **Storage fails**: Show placeholder images

## Monitoring & Logging

### What to Monitor
- API response times
- Upload success rate
- AI processing success rate
- Queue depth
- Error rates
- Storage usage

### Logging Strategy
```javascript
// Development
console.log('Info message');
console.error('Error message');

// Production (upgrade to)
logger.info('Info message', { context });
logger.error('Error message', { error, context });
```

## Future Architecture Improvements

### Short Term
1. **WebSocket**: Real-time upload progress
2. **Service Worker**: Offline support
3. **Redis Cache**: Query result caching

### Medium Term
1. **Microservices**: Separate AI service
2. **CDN**: CloudFlare for images
3. **Vector DB**: Better similarity search

### Long Term
1. **Kubernetes**: Container orchestration
2. **ML Model**: Custom image analysis
3. **Edge Computing**: Process near users

## Testing Strategy

### Unit Tests
- Individual functions
- Service methods
- Utilities

### Integration Tests
- API endpoints
- Database queries
- Storage operations

### E2E Tests
- Full user flows
- Upload → Process → Search
- Multi-user scenarios

### Manual Testing
- Cross-browser testing
- Mobile responsiveness
- Error scenarios
- Edge cases

## Deployment Architecture

```
Production Environment:

Frontend (Vercel):
├── Global CDN
├── Automatic HTTPS
├── Preview deployments
└── Environment variables

Backend (Railway):
├── Docker container
├── Auto-scaling
├── Health checks
├── Zero-downtime deploys

Database (Supabase):
├── Managed PostgreSQL
├── Automatic backups
├── Connection pooling
└── Read replicas

Storage (Supabase):
├── S3-compatible
├── Global CDN
├── Automatic backups
└── Versioning

Redis (Railway):
├── Managed instance
├── Persistence
├── Backups
└── Monitoring
```

---

This architecture is designed for:
- ✅ **Simplicity**: Easy to understand and maintain
- ✅ **Scalability**: Can grow with demand
- ✅ **Security**: Multiple layers of protection
- ✅ **Reliability**: Graceful error handling
- ✅ **Performance**: Optimized for common operations
