# QuizzViz - Intelligent Hiring Assessment Platform

## Overview

QuizzViz is a modern web application designed to revolutionize the hiring process by enabling companies to create enterprise-grade skill assessments in under 3 minutes. The platform focuses on helping organizations identify qualified candidates efficiently while improving applicant satisfaction through relevant, real-world skill testing.

The application is built as a full-stack solution with a React frontend and Express backend, designed to be scalable, performant, and user-friendly. It serves as a comprehensive hiring tool that streamlines the candidate evaluation process for both recruiters and job applicants.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Tailwind CSS for utility-first styling with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds
- **Component Structure**: Modular design with reusable UI components in `/components/ui/`

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the full stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful API architecture with `/api` prefix routing
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage
- **Primary Database**: PostgreSQL for relational data storage
- **Database Driver**: Neon Database serverless driver for cloud-native database connectivity
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Session Storage**: PostgreSQL-backed session storage for user authentication

### Development Architecture
- **Monorepo Structure**: Organized into `client/`, `server/`, and `shared/` directories
- **Shared Types**: Common TypeScript types and schemas in `/shared` for consistency
- **Development Server**: Vite dev server with Express backend integration
- **Hot Reload**: Full-stack hot reload support for rapid development

### Authentication and Authorization
- **Session-based Auth**: Traditional session-based authentication using Express sessions
- **User Schema**: Simple user model with username/password authentication
- **Database Storage**: User credentials and session data stored in PostgreSQL

### Styling and UI
- **Design System**: shadcn/ui component library with Radix UI primitives
- **Theme Support**: CSS custom properties for consistent theming
- **Typography**: Inter font family for modern, readable text
- **Responsive Design**: Mobile-first responsive design with Tailwind breakpoints
- **Animations**: CSS-based animations for smooth user interactions

### Build and Deployment
- **Production Build**: Vite builds client-side assets, esbuild bundles server code
- **Static Assets**: Client assets served from `/dist/public` in production
- **Environment Management**: Environment variables for database connections and configuration
- **Development Tools**: TSC for type checking, Drizzle Kit for database operations

### Code Organization
- **Path Aliases**: Configured TypeScript path mapping for clean imports (`@/`, `@shared/`)
- **Component Structure**: Logical separation of UI components, pages, and business logic
- **Shared Utilities**: Common utilities and types shared between client and server
- **Asset Management**: Centralized asset handling with Vite asset processing