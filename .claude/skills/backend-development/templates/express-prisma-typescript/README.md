# Express + Prisma + TypeScript Backend Template

Production-ready REST API backend with authentication, validation, and comprehensive error handling.

## Features

✅ **Express.js** - Fast, minimalist web framework
✅ **Prisma ORM** - Type-safe database access with PostgreSQL
✅ **TypeScript** - Full type safety
✅ **JWT Authentication** - Access + refresh token pattern
✅ **Zod Validation** - Runtime type checking
✅ **RBAC** - Role-based access control (Admin, Staff, Customer)
✅ **Docker** - Containerized development & production
✅ **Security** - Helmet, CORS, rate limiting, bcrypt
✅ **Error Handling** - Centralized error middleware
✅ **Logging** - Request/response logging
✅ **Multi-stage Dockerfile** - Optimized production builds

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 3000

### 4. Run Database Migrations

```bash
npm run prisma:migrate
```

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

## Development

```bash
# Start dev server with hot reload
npm run dev

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user profile

### Products

- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders

- `GET /api/orders` - List orders (filtered by user role)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

### Inventory

- `GET /api/inventory` - List inventory (Staff/Admin only)
- `GET /api/inventory/:productId/:locationId` - Get specific location inventory
- `PUT /api/inventory/:productId/:locationId` - Update inventory

## Database Schema

### Core Tables

- **users** - Authentication & roles
- **refresh_tokens** - JWT refresh tokens
- **customers** - Customer profiles
- **locations** - Store locations
- **products** - Product catalog
- **product_images** - Product photos
- **inventory** - Multi-location stock
- **orders** - Customer orders
- **order_items** - Order line items
- **payments** - Payment records

See `prisma/schema.prisma` for full schema.

## Authentication Flow

1. **Register/Login** → Receive access token (15min) + refresh token (7 days)
2. **API Requests** → Include access token in `Authorization: Bearer <token>` header
3. **Token Expires** → Call `/api/auth/refresh` with refresh token
4. **Logout** → Call `/api/auth/logout` to invalidate refresh tokens

## Role-Based Access Control

- **CUSTOMER** - Can view products, create orders, view own orders
- **STAFF** - Customer permissions + inventory management (own location)
- **ADMIN** - Full access to all resources and all locations

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | API port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

## Production Deployment

### 1. Build Docker Image

```bash
docker build --target production -t backend-api .
```

### 2. Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  backend-api
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate:prod
```

## Security Best Practices

✅ **Passwords** - Hashed with bcrypt (cost factor 12)
✅ **JWT Secrets** - Use strong, random secrets in production
✅ **HTTPS** - Always use HTTPS in production
✅ **Rate Limiting** - 100 requests per 15 minutes per IP
✅ **Helmet** - Security headers enabled
✅ **CORS** - Whitelist specific origins
✅ **Input Validation** - All inputs validated with Zod

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Server entry point
├── middleware/
│   ├── auth.ts            # JWT authentication
│   ├── validation.ts      # Zod validation
│   ├── errorHandler.ts    # Error handling
│   └── logger.ts          # Request logging
├── routes/
│   ├── auth.ts            # Auth routes
│   ├── products.ts        # Product routes
│   ├── orders.ts          # Order routes
│   └── inventory.ts       # Inventory routes
├── controllers/
│   ├── authController.ts
│   ├── productController.ts
│   ├── orderController.ts
│   └── inventoryController.ts
└── services/
    ├── authService.ts     # Auth business logic
    └── productService.ts  # Product business logic
```

## License

MIT
