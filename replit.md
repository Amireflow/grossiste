# SokoB2B - B2B Marketplace for West African Neighborhood Shops

## Overview
SokoB2B is a B2B marketplace web application connecting neighborhood shops (épiceries, kiosques, pharmacies) in West Africa with verified suppliers (wholesalers, importers) of consumer goods. The platform enables shop owners to browse product catalogs, place orders, and pay via mobile money or cash on delivery.

## Current State
- **MVP Complete**: Full authentication, role-based dashboards, product catalog, cart/checkout, order management
- **Language**: French (primary UI language)
- **Currency**: CFA Franc (XOF) default, supports XAF, NGN, GHS

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI, TanStack Query, Wouter routing
- **Backend**: Express.js, PostgreSQL (Drizzle ORM), Replit Auth (OpenID Connect)
- **Fonts**: DM Sans (sans), Playfair Display (serif), JetBrains Mono (mono)

### Project Structure
```
client/src/
├── pages/           # Route pages (landing, onboarding, dashboard, marketplace, cart, orders, products, product-form)
├── components/      # Reusable components (app-sidebar, theme-provider, theme-toggle, ui/)
├── hooks/           # Custom hooks (use-auth, use-toast, use-mobile)
├── lib/             # Utilities (queryClient, constants, utils, auth-utils)
server/
├── index.ts         # Express entry point
├── routes.ts        # API routes with Zod validation
├── storage.ts       # DatabaseStorage class (PostgreSQL)
├── db.ts            # Database connection pool
├── seed.ts          # Database seeding (categories)
├── replit_integrations/auth/  # Replit Auth module
shared/
├── schema.ts        # Drizzle schema + Zod insert schemas
├── models/auth.ts   # Auth-related tables (users, sessions)
```

### Data Model
- **Users** (from Replit Auth): id, email, firstName, lastName, profileImageUrl
- **UserProfiles**: role (shop_owner/supplier), businessName, phone, city, country, currency
- **Categories**: 12 seeded (Alimentation, Boissons, Hygiène, Parapharmacie, Bébé & Puériculture, Cosmétique & Beauté, Tabac & Accessoires, Papeterie & Fournitures, Téléphonie & Accessoires, Condiments & Épices, Confiserie & Biscuits, Ménage & Cuisine)
- **Products**: name, price, unit, stock, categoryId, supplierId
- **Orders**: buyerId, supplierId, status, totalAmount, deliveryAddress
- **OrderItems**: orderId, productId, productName, quantity, unitPrice
- **CartItems**: userId, productId, quantity

### User Roles
- **shop_owner**: Browse catalog, add to cart, checkout, view orders
- **supplier**: Manage products, view/update orders received

### Key API Endpoints
- `GET/POST /api/profile` - User profile CRUD
- `GET /api/categories` - Product categories (public)
- `GET /api/products` - All active products
- `GET /api/marketplace/products` - Public marketplace products with supplier info (supports ?category and ?search query params)
- `GET /api/my-products` - Supplier's own products
- `POST/PATCH /api/products` - Create/update products (supplier only)
- `GET/POST/PATCH/DELETE /api/cart` - Cart management
- `POST /api/orders/checkout` - Place order from cart (shop_owner only)
- `PATCH /api/orders/:id/status` - Update order status (supplier only)
- `GET /api/stats` - Dashboard statistics

### Public Pages
- `/marketplace` - Public marketplace browsable by anyone (no auth required), shows all products with supplier info
- `/` - Landing page (unauthenticated) or Dashboard (authenticated)

## Recent Changes
- 2026-02-09: Initial MVP build with all core features
- Added Zod validation on all POST/PATCH routes
- Order items now include product info (name, imageUrl) via JOIN
- 2026-02-09: Added public Marketplace page accessible to everyone, expanded from 4 to 12 categories, added 30 products from 3 demo suppliers, suppliers can switch between workspace and marketplace via sidebar link
- 2026-02-09: Removed Catalogue page - marketplace is now the primary browsing experience. Shop owners can add to cart directly from marketplace. Added sorting, category counts, trust indicators, improved product cards with category badges and stock info

## User Preferences
- French language UI
- Green primary color theme (hsl 142 76% 36%)
- Dark mode support
- Mobile-first responsive design
