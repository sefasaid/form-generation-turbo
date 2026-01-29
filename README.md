# Form Generation

A modern monorepo application built with Turborepo, featuring a NestJS API backend and a Next.js frontend. This project enables dynamic form creation and management with real-time capabilities.

## 🏗️ Architecture

This is a **Turborepo** monorepo containing:

- **API** (`apps/api`) - NestJS backend with Prisma ORM
- **Frontend** (`apps/frontend`) - Next.js 16 application
- **Frontend E2E** (`apps/frontend-e2e`) - Cypress end-to-end tests
- **Prisma** (`packages/prisma`) - Database schema and migrations
- **NextFetch** (`packages/nextFetch`) - Shared fetch utilities
- **ESLint Config** (`packages/eslint-config`) - Shared linting rules
- **TypeScript Config** (`packages/typescript-config`) - Shared TypeScript configurations

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Yarn 1.22.22
- PostgreSQL database

### Installation

Install all dependencies for the monorepo:

```bash
yarn install
```

This will install dependencies for all packages and applications in the workspace.

### Environment Setup

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Edit `.env` and set the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database"
NEXT_PUBLIC_API_URL="http://localhost:3001"
API_PORT=3001
JWT_SECRET="your-secret-key"
```

## 💻 Development

### Before Starting Services

Both the frontend and backend depend on Prisma Client being generated. Turborepo should automatically run `prisma generate` before starting services (as configured in `turbo.json`), but if you encounter any issues, you can manually generate the Prisma Client:

```bash
yarn generate
```

This ensures the Prisma Client is up-to-date with your database schema.

### Start All Services

Run all applications in development mode:

```bash
yarn dev
```

This starts:
- **Frontend** on `http://localhost:3000`
- **API** on `http://localhost:3001`

### Start Individual Services

To run a specific service:

```bash
# Frontend only
cd apps/frontend && yarn dev

# API only
cd apps/api && yarn dev
```

## 🧪 Testing

### Run All Tests

Run all unit tests across the monorepo:

```bash
yarn test
```

### Run Tests for a Specific Package

```bash
# API tests
cd apps/api && yarn test

```

## 🎭 End-to-End Testing

E2E tests require both the frontend and API to be running.

### Setup

1. Start the development servers in separate terminals:

```bash
# Terminal 1 - Start frontend
cd apps/frontend && yarn dev

# Terminal 2 - Start API
cd apps/api && yarn dev

# or start both
yarn dev
```

2. Run E2E tests:

**Headless mode (CI/CD):**
```bash
yarn e2e
```

**Interactive mode (development):**
```bash
yarn e2e:open
```

This opens the Cypress Test Runner where you can interactively run and debug tests.

## 🗄️ Database

### Migrations

Generate and apply database migrations:

```bash
# From root
yarn migrate

# Or from prisma package
cd packages/prisma && yarn migrate
```

This will:
- Create a new migration if schema changes are detected
- Apply pending migrations
- Regenerate Prisma Client

### Seed Database

Populate the database with initial data:

```bash
cd packages/prisma && yarn seed
```

### Prisma Studio

Open Prisma Studio to visually explore and edit your database:

```bash
cd packages/prisma && yarn studio
```

### Generate Prisma Client

After schema changes, regenerate the Prisma Client:

```bash
cd packages/prisma && yarn generate
```

## 📦 Available Scripts

### Root Level

- `yarn build` - Build all packages and applications
- `yarn dev` - Start all services in development mode
- `yarn lint` - Lint all packages
- `yarn test` - Run all tests
- `yarn e2e` - Run E2E tests (headless)
- `yarn e2e:open` - Run E2E tests (interactive)
- `yarn check-types` - Type check all packages
- `yarn migrate` - Run database migrations

### Package-Specific Scripts

Each package has its own scripts. Check individual `package.json` files for details.

## 🛠️ Tech Stack

- **Monorepo**: Turborepo
- **Backend**: NestJS, Prisma, PostgreSQL
- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Testing**: Jest, Cypress
- **Language**: TypeScript
- **Package Manager**: Yarn Workspaces

## 📝 Project Structure

```
formgenerate/
├── apps/
│   ├── api/              # NestJS backend
│   ├── frontend/         # Next.js frontend
│   └── frontend-e2e/     # Cypress E2E tests
├── packages/
│   ├── prisma/           # Database schema & migrations
│   ├── nextFetch/        # Shared fetch utilities
│   ├── eslint-config/    # Shared ESLint configs
│   └── typescript-config/# Shared TypeScript configs
└── turbo.json            # Turborepo configuration
```

## 🔧 Troubleshooting

### Environment Variables Not Loading

Make sure your `.env` file is in the root directory and contains all required variables. For Prisma commands, the `.env` file is automatically loaded from the root.

### Port Already in Use

If ports 3000 or 3001 are already in use, you can change them:
- Frontend: Modify `apps/frontend/package.json` dev script
- API: Set `API_PORT` in `.env` file

### Database Connection Issues

Ensure your PostgreSQL database is running and the `DATABASE_URL` in `.env` is correct. Test the connection with:

```bash
cd packages/prisma && yarn studio
```

## 📚 Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)


# Docker

## 🐳 Docker Build

This project includes Docker support for containerized deployments. The Dockerfile uses a multi-stage build process to optimize image size and build time.

### Building the API Image

Build the Docker image for the API:

```bash
docker build -f Dockerfile.api -t formgenerate-api:latest --build-arg DATABASE_URL="postgresql://user:password@host:5432/database" .
```

**Important:** Replace the `DATABASE_URL` with your actual database connection string.

### Build Process

The Dockerfile uses a multi-stage build:

1. **Builder Stage:**
   - Installs all dependencies (including dev dependencies)
   - Generates Prisma Client
   - Runs database migrations
   - Builds the NestJS API

2. **Production Stage:**
   - Copies only production dependencies
   - Copies the built application and generated Prisma Client
   - Creates a minimal production image

### Running the Container

Run the containerized API:

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:password@host:5432/database" \
  -e JWT_SECRET="your-secret-key" \
  formgenerate-api:latest
```

### Environment Variables

The following environment variables can be set when running the container:

- `DATABASE_URL` - PostgreSQL database connection string (required)
- `JWT_SECRET` - Secret key for JWT token signing (required)
- `API_PORT` - Port for the API server (default: 3001)
- `NODE_ENV` - Node environment (default: production)

### Docker Compose

The project includes a `docker-compose.yml` file that sets up both the API and Frontend services.

#### Setup

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file** and configure the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   API_PORT=3001
   FRONTEND_PORT=3000
   JWT_SECRET="your-secret-key"
   NODE_ENV=production
   API_CONTAINER_NAME=form-api
   FRONTEND_CONTAINER_NAME=form-frontend
   ```

#### Running Services

Start all services (API and Frontend):

```bash
docker-compose up
```

Start in detached mode (background):

```bash
docker-compose up -d
```

Stop all services:

```bash
docker-compose down
```

Rebuild and start services:

```bash
docker-compose up --build
```

#### Services

The Docker Compose setup includes:

- **API** - NestJS backend service (port 3001)
- **Frontend** - Next.js frontend service (port 3000)

Both services are connected via a Docker network (`form-network`) and the frontend depends on the API service.

#### Viewing Logs

View logs from all services:

```bash
docker-compose logs
```

View logs from a specific service:

```bash
docker-compose logs api
docker-compose logs frontend
```

Follow logs in real-time:

```bash
docker-compose logs -f
```


# Addetional Info

## Prisma Type Generator

I crated a prisma type generator for frontend. That way api and frontend can type safe. I tried to use prisma (when it generates, it generates browser type as well) but it didn't work for me. That's why I made prisma type generator only for frontend.

## Live preview

You can check preview from [here](form-generation-turbo-frontend.vercel.app)
