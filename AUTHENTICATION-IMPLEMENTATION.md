# Authentication System - Production Implementation

## Overview
Complete JWT-based authentication system implemented with Supabase Auth, replacing the previous localStorage demo auth.

## Architecture

### 1. Auth Service (`/lib/auth/auth-service.ts`)
Central authentication service with:
- JWT token management
- Session persistence
- Role-based permissions
- User profile management
- React hooks integration

Key features:
- Sign in/up/out
- Session refresh
- Permission checking
- Profile updates
- Password management

### 2. Auth Provider (`/components/auth/AuthProvider.tsx`)
React context provider that:
- Wraps entire application
- Manages auth state globally
- Handles route protection
- Shows loading states
- Redirects unauthorized users

Features:
- Automatic session check on mount
- Route permission validation
- Auth state subscriptions
- Toast notifications
- HOC for protected components

### 3. Middleware (`/middleware.ts`)
Server-side route protection:
- Validates JWT tokens
- Checks permissions for API routes
- Redirects unauthenticated users
- Adds user info to request headers

Protected routes configuration:
```typescript
const PROTECTED_API_ROUTES = {
  '/api/crm/customers': ['customers:read'],
  '/api/crm/leads': ['leads:read'],
  '/api/crm/jobs': ['jobs:read'],
  '/api/crm/staff': ['staff:read']
}
```

## Database Schema

### crm_users Table
```sql
- id (UUID) - References auth.users
- email (VARCHAR) - Unique
- name (VARCHAR)
- role (VARCHAR) - admin/manager/employee/readonly
- avatar_url (TEXT)
- phone (VARCHAR)
- department (VARCHAR)
- is_active (BOOLEAN)
- last_login (TIMESTAMP)
- created_at/updated_at (TIMESTAMP)
```

### Security Features
- Row Level Security (RLS) enabled
- Role-based access control
- Automatic first user = admin
- Login tracking
- Session management

## Permission System

### Role Hierarchy
1. **Admin**: Full access to everything
2. **Manager**: CRUD on most modules, read-only financial
3. **Employee**: Read customers, CRUD on leads/jobs
4. **Readonly**: Read-only access

### Permission Format
`resource:action` (e.g., `customers:write`, `leads:read`)

## UI Components

### Login Page (`/app/login/page.tsx`)
- Email/password authentication
- Demo credentials in dev mode
- Error handling
- Loading states
- Redirect to intended route

### Signup Page (`/app/signup/page.tsx`)
- New user registration
- Password confirmation
- Input validation
- Auto-login after signup

## Integration Points

### 1. CRM Layout Update
Updated `/app/crm/layout.tsx` to use new auth:
```typescript
const { user, loading, signOut } = useAuth()
```

### 2. API Endpoints
All CRM API endpoints now use `validateCRMAuth`:
```typescript
const authResult = await validateCRMAuth(request)
if (!authResult.permissions.includes('resource:action')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}
```

### 3. Protected Routes
Any route can be protected using the `withAuth` HOC:
```typescript
export default withAuth(MyComponent, ['customers:read'])
```

## Migration from Old Auth

### Before (localStorage):
- Demo auth stored in localStorage
- No real security
- Mock user data
- Client-side only

### After (Supabase JWT):
- Secure JWT tokens
- Server-side validation
- Real user accounts
- Session persistence
- Permission enforcement

## Testing

### Demo Accounts
- **Admin**: admin@nordflytt.se / admin123
- **Manager**: manager@nordflytt.se / manager123
- **Employee**: employee@nordflytt.se / employee123

### Test Authentication Flow:
1. Visit any CRM page while logged out → Redirects to /login
2. Login with demo credentials → Redirects to dashboard
3. Try accessing restricted page → Shows permission error
4. API calls include auth headers automatically

## Security Best Practices

1. **JWT Storage**: Secure httpOnly cookies via Supabase
2. **CSRF Protection**: Built into Supabase Auth
3. **Session Expiry**: Auto-refresh with configurable timeout
4. **Password Policy**: Minimum 6 characters (configurable)
5. **Rate Limiting**: Handled by Supabase

## Deployment Checklist

1. Set environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

2. Run database migration:
   ```bash
   supabase migration up
   ```

3. Configure Supabase Auth settings:
   - Enable email provider
   - Set JWT expiry (recommended: 7 days)
   - Configure password requirements

4. Update middleware matcher if needed

## Next Steps

1. **Email Verification**: Add email confirmation flow
2. **2FA**: Implement two-factor authentication
3. **OAuth**: Add Google/Microsoft login
4. **Audit Logs**: Track all auth events
5. **Password Policy**: Enforce stronger requirements

## Common Issues & Solutions

1. **"Unauthorized" errors**: Check JWT expiry and refresh
2. **Permission denied**: Verify user role in database
3. **Redirect loops**: Check middleware public routes
4. **Session lost**: Ensure cookies are enabled

This completes the authentication system implementation.