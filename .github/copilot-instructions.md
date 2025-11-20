# VingVis-Tundra Copilot Instructions

## Project Overview

**VingVis (VingVingRobot Vis - วิ่งๆ โรบอท)** is a no-code/low-code web application designed for FTC (FIRST Tech Challenge) and FRC (FIRST Robotics Competition) teams. It provides a visual drag-and-drop interface for designing autonomous robot paths, controlling servos, and detecting colors without writing code.

### Project Type & Stack
- **Framework**: Next.js 15.2.4 with App Router
- **React Version**: React 19 (19.2.0)
- **Language**: TypeScript 5
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS v4.1.9 with PostCSS
- **Node Visualization**: ReactFlow 11.11.4
- **Backend**: Supabase (PostgreSQL database with Row Level Security)
- **Authentication**: Supabase Auth
- **Fonts**: Geist Sans & Geist Mono (from 'geist' package)
- **Node.js**: v20.19.5
- **Package Manager**: npm 10.8.2

### Repository Size
- **Total Files**: 146 files (excluding node_modules, .git, .next)
- **Node Modules Size**: 748MB with 381 packages

## Critical Build Instructions

### 1. Installation (ALWAYS REQUIRED)

**IMPORTANT**: Dependencies MUST be installed with `--legacy-peer-deps` flag due to React 19 peer dependency conflicts (specifically with `vaul@0.9.9`).

```bash
npm install --legacy-peer-deps
```

**DO NOT** use `npm install` without the flag - it will fail with ERESOLVE errors.

### 2. Development Server

```bash
npm run dev
```

- Starts on http://localhost:3000
- Takes approximately 1-2 seconds to start
- **Always works** in development mode

### 3. Building (Known Issues)

```bash
npm run build
```

**KNOWN ISSUE**: Build fails in sandboxed environments without internet access because Next.js tries to fetch Google Fonts from `fonts.googleapis.com`. The error occurs in `lib/fonts.ts` where it imports `Inter` font from `next/font/google`.

**Workaround**: If you need to validate builds in restricted environments, you may need to:
- Use local fonts instead of Google Fonts
- Or mock the font import
- Or have internet access to fonts.googleapis.com

### 4. Linting

The project does NOT have ESLint configured by default. Running `npm run lint` will attempt to set up ESLint interactively.

**To set up linting**:
```bash
npm install --save-dev eslint eslint-config-next --legacy-peer-deps
```

Then create `.eslintrc.json`:
```json
{
  "extends": "next/core-web-vitals"
}
```

After setup, run:
```bash
npm run lint
```

**Note**: There may be TypeScript errors during linting. The project has `typescript.ignoreBuildErrors: true` in `next.config.mjs`.

### 5. Running Tests

The project has a test script defined as `npm run test:prod` which references `automated-test.js`, but **this file does not exist in the repository**. No test infrastructure is currently set up.

### 6. Starting the Production Server

```bash
npm run start
```

This requires a successful build first.

## Project Architecture

### Directory Structure

```
/
├── app/                        # Next.js App Router pages & API routes
│   ├── api/                   # API endpoints
│   │   ├── auth/             # Authentication routes (signup, signin, signout, reset-password, session)
│   │   ├── projects/         # Project CRUD operations
│   │   ├── users/            # User profile management
│   │   └── waitlist/         # Waitlist signup
│   ├── dashboard/            # Main dashboard pages
│   │   └── [username]/[projecthash]/  # Project editor (ReactFlow canvas)
│   ├── signin/, signup/, login/  # Authentication pages
│   ├── forgot-password/      # Password reset flow
│   ├── waitlist/             # Waitlist page
│   ├── globals.css           # Global Tailwind imports
│   ├── layout.tsx            # Root layout with AuthProvider
│   ├── loading.tsx           # Loading state
│   └── page.tsx              # Landing page (Hero, Features, Testimonials, FAQ)
│
├── components/                # React components
│   ├── ui/                   # shadcn/ui components (40+ components)
│   ├── magicui/              # MagicUI components (marquee)
│   ├── home/                 # Landing page sections
│   ├── block-nodes.tsx       # ReactFlow node definitions (Start, End, Block nodes)
│   ├── custom-nodes.tsx      # Custom node styles and types
│   ├── field-preview.tsx     # FTC field visualization
│   ├── hardware-config-panel.tsx  # Robot hardware configuration
│   ├── math-tools.tsx        # Mathematical utilities for path planning
│   ├── navbar.tsx            # Navigation bar
│   └── ...                   # Other feature components
│
├── lib/                       # Utilities & core logic
│   ├── auth-context.tsx      # Authentication context provider
│   ├── supabase.ts           # Supabase client (browser-side)
│   ├── supabase-admin.ts     # Supabase admin client (server-side)
│   ├── drivetrain-types.ts   # Robot drivetrain type definitions
│   ├── math-utils.ts         # Math helper functions
│   ├── path-keyframes.ts     # Path animation logic
│   ├── rate-limit.ts         # API rate limiting
│   ├── fonts.ts              # Font configuration (uses Google Fonts)
│   └── utils.ts              # General utility functions
│
├── hooks/                     # Custom React hooks
│   ├── use-mobile.ts         # Mobile detection hook
│   └── use-toast.ts          # Toast notification hook
│
├── public/                    # Static assets
│   ├── fields/               # FTC field images
│   ├── fonts/                # Local fonts
│   └── *.svg, *.png          # Icons and images
│
├── styles/                    # Additional styles
│   └── globals.css           # Tailwind v4 configuration
│
├── middleware.ts              # Next.js middleware (CORS for API routes)
├── next.config.mjs            # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── components.json            # shadcn/ui configuration
├── postcss.config.mjs         # PostCSS configuration
└── supabase-schema.sql        # Database schema
```

### Key Configuration Files

1. **next.config.mjs**: 
   - ESLint validation enabled (`eslint.ignoreDuringBuilds: false`)
   - TypeScript errors ignored (`typescript.ignoreBuildErrors: true`)
   - Security headers configured (CSP, X-Frame-Options, etc.)
   - Image optimization disabled (`images.unoptimized: true`)

2. **tsconfig.json**:
   - Strict mode enabled
   - Path alias: `@/*` maps to `./*`
   - Target: ES6
   - Module resolution: bundler

3. **components.json** (shadcn/ui):
   - Style: "new-york"
   - RSC enabled
   - CSS variables enabled
   - Base color: neutral
   - Icon library: lucide-react

4. **middleware.ts**:
   - CORS configuration for `/api/*` routes
   - Security headers for API endpoints
   - Preflight (OPTIONS) request handling

### Database Schema (Supabase)

Located in `supabase-schema.sql`:

**Tables**:
- `users`: User profiles (email, username, FTC team info)
- `projects`: Robot projects (name, template_type, motor_config, workflow_data as JSONB)

**Drivetrain Types**:
- tank-drive
- omni-wheel
- mecanum-wheel
- x-drive
- h-drive
- swerve-drive

**RLS Policies**: Row Level Security enabled on both tables.

### Environment Variables Required

The application expects these environment variables (not in repo):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)

**Default fallback values**: The app uses placeholder values if env vars are missing, allowing dev server to start but functionality will be limited.

## Making Changes

### When Modifying Dependencies

1. **ALWAYS use `--legacy-peer-deps`** when installing new packages
2. Install with: `npm install <package> --legacy-peer-deps`
3. For dev dependencies: `npm install --save-dev <package> --legacy-peer-deps`

### When Modifying UI Components

- UI components are in `components/ui/` (shadcn/ui)
- Follow existing component patterns
- Use Tailwind CSS classes (v4 syntax with `@` rules)
- Use Radix UI primitives for accessibility

### When Modifying API Routes

- API routes are in `app/api/`
- Use Next.js 15 App Router conventions (route.ts files)
- CORS is configured in `middleware.ts`
- Rate limiting is available in `lib/rate-limit.ts`
- Use `supabase-admin.ts` for server-side operations that bypass RLS

### When Modifying the Dashboard/Editor

- Main editor: `app/dashboard/[username]/[projecthash]/page.tsx`
- Uses ReactFlow for node-based visual programming
- Node types defined in `components/block-nodes.tsx`
- Math utilities in `lib/math-utils.ts`
- Hardware config in `components/hardware-config-panel.tsx`

### When Modifying Styles

- Global styles: `app/globals.css` and `styles/globals.css`
- Tailwind v4 uses `@import 'tailwindcss'` syntax
- CSS variables defined with `oklch()` color space
- Dark mode is default (`className="dark"` on html element)

## Common Pitfalls & Solutions

### 1. Dependency Installation Fails
**Error**: `npm error ERESOLVE could not resolve`
**Solution**: Always use `npm install --legacy-peer-deps`

### 2. Build Fails with Font Error
**Error**: `Failed to fetch 'Inter' from Google Fonts`
**Solution**: This occurs in sandboxed/offline environments. The font is fetched at build time from `fonts.googleapis.com`. Either ensure internet access or use local fonts.

### 3. ESLint Not Configured
**Error**: Interactive prompt when running `npm run lint`
**Solution**: Manually install ESLint dependencies and create `.eslintrc.json` as shown above.

### 4. TypeScript Errors During Build
**Note**: TypeScript errors are ignored during builds (`ignoreBuildErrors: true`). This is intentional but should be addressed gradually.

### 5. Supabase Connection Issues
**Check**: Ensure environment variables are set correctly. The app will start without them but authentication and data persistence won't work.

## Validation Checklist

Before submitting changes:

1. ✅ Run `npm install --legacy-peer-deps` (if package.json changed)
2. ✅ Run `npm run dev` and verify the dev server starts
3. ✅ Test your changes in the browser at http://localhost:3000
4. ✅ Check for TypeScript errors: `npx tsc --noEmit` (optional, as builds ignore errors)
5. ✅ If ESLint is configured: `npm run lint`
6. ✅ For API changes: Test the endpoints using curl or Postman
7. ✅ For UI changes: Test in both desktop and mobile viewports

## Trust These Instructions

These instructions were created through comprehensive exploration and testing of the repository. **Trust this information first** and only search for additional details if:
- You encounter an error not documented here
- You need implementation details for specific components
- The instructions appear outdated (check last update date)

**Last Updated**: November 2025
**Next.js Version**: 15.2.4
**React Version**: 19.2.0
