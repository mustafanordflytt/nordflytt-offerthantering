# localStorage SSR Compatibility Report

## Summary
Found multiple files using localStorage without proper SSR guards. While most React components have `'use client'` directive, several utility libraries and hooks access localStorage without checking if `window` is defined, which can cause issues during server-side rendering.

## Files That Need SSR Guards

### 1. Library Files (High Priority - Can be imported by server components)

#### `/lib/storage-utils.ts`
- Lines: 16, 31, 42-43, 56, 63, 69, 74, 80, 83, 99-100, 106, 109, 114, 139
- **Issue**: Direct localStorage access without `typeof window !== 'undefined'` check
- **Fix Needed**: Add window check wrapper around all localStorage operations

#### `/lib/offline.ts`
- Lines: 411, 419
- **Issue**: Direct localStorage access in class methods
- **Fix Needed**: Add window checks or ensure methods only run on client

#### `/lib/flyttparm.ts`
- Line: 35
- **Issue**: Direct localStorage.getItem without window check
- **Fix Needed**: Add `if (typeof window !== 'undefined')` guard

#### `/lib/order-confirmation.ts`
- Lines: 98, 102
- **Issue**: Direct localStorage access
- **Fix Needed**: Add window checks

#### `/lib/smart-triggers.ts`
- Multiple lines (needs investigation)
- **Issue**: Direct localStorage usage
- **Fix Needed**: Add window checks

#### `/lib/staff-employee-sync.ts`
- Multiple lines (needs investigation)
- **Issue**: Direct localStorage usage
- **Fix Needed**: Add window checks

#### `/lib/time-tracking.ts`
- Multiple lines (needs investigation)
- **Issue**: Direct localStorage usage
- **Fix Needed**: Add window checks

#### `/lib/auth-fetch.ts`
- Multiple lines (needs investigation)
- **Issue**: Direct localStorage usage
- **Fix Needed**: Add window checks

#### `/lib/FormContext.tsx`
- Multiple lines (needs investigation)
- **Issue**: Direct localStorage usage in React context
- **Fix Needed**: Add window checks or ensure only used in client components

### 2. Hooks (Medium Priority - Should have guards even in client components)

#### `/hooks/use-staff-data.ts`
- Lines: 80, 117, 129-130
- **Issue**: Direct localStorage access without window checks
- **Fix Needed**: Add window checks even though hooks run on client

#### `/hooks/use-offline.ts`
- Multiple lines (needs investigation)
- **Issue**: Direct localStorage usage
- **Fix Needed**: Add window checks

### 3. Client Components (Lower Priority - Already have 'use client')

These files have `'use client'` directive but could benefit from defensive window checks:

- `/app/staff/dashboard/page.tsx` - Lines: 191, 278, 317, 323-324, 477, 497, 661, 666, 669, 686, 765, 767, 769, 809, 811, 813, 883, 896, 898, 986
- Various component files in `/components/` directory

## Recommended Fix Pattern

```typescript
// For synchronous access
if (typeof window !== 'undefined') {
  localStorage.setItem(key, value);
}

// For functions that return values
function getStoredValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

// For class methods
class StorageManager {
  static setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }
}
```

## Action Items

1. **Immediate**: Fix all library files in `/lib/` directory as they can cause SSR build failures
2. **Important**: Update hooks to include window checks for defensive programming
3. **Optional**: Add window checks to client components for extra safety

## Testing

After fixes, test with:
```bash
npm run build
npm run start
```

Ensure no hydration errors or SSR compilation errors related to localStorage.