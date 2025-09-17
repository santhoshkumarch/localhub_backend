# LocalHub Admin Backend

Backend API for the LocalHub Admin Panel - Tamil Nadu district-wise business directory platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Start production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/toggle-status` - Toggle user status

### Businesses
- `GET /api/businesses` - Get all businesses
- `GET /api/businesses/:id` - Get business by ID
- `PATCH /api/businesses/:id/status` - Update business status

### Posts
- `GET /api/posts` - Get all posts
- `PATCH /api/posts/:id/status` - Update post status

### Districts
- `GET /api/districts` - Get all districts with statistics

### Hashtags
- `GET /api/hashtags` - Get all hashtags
- `POST /api/hashtags` - Create new hashtag
- `DELETE /api/hashtags/:id` - Delete hashtag

## Default Admin Credentials
- Email: admin@localhub.com
- Password: password

## run docker
docker-compose up -d
docker ps

Superadmin: superadmin@localhub.com / password

Admin: admin@localhub.com / password

Viewer: viewer@localhub.com / password