# Afer Health API

A RESTful API built with Node.js, Express, TypeScript, and MongoDB.

## Features

- Authentication with JWT (access token + refresh token)
- MongoDB integration
- API versioning
- TypeScript support
- Environment configuration
- Security best practices (helmet, rate limiting, CORS)

## Project Structure

```
api/
├── src/
│   ├── controllers/    # Request handlers
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   │   ├── v1/         # API version 1
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types/interfaces
│   └── index.ts        # Application entry point
├── .env.development    # Development environment variables
├── .env.production     # Production environment variables
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables by creating `.env.development` and `.env.production` files.

3. Start MongoDB:

```bash
# If you have MongoDB installed locally
mongod
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile

### Additional Endpoints (to be implemented)

- User management
- Data storage
- Reports
- etc.

## API Versioning

API routes are versioned using URL path versioning:

- `/api/v1/...` - Version 1 endpoints
- Future versions can be added as `/api/v2/...`, etc. 