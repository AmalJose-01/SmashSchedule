# Clean Architecture Implementation Guide - Membership Service

## Overview
The membership service has been refactored into a scalable, maintainable clean architecture pattern with clear separation of concerns.

## Architecture Layers

### 1. **Types Layer** (`types.js`)
**Purpose:** Defines all TypeScript-like interfaces and type definitions.

**What it contains:**
- Type definitions for entities (Member, MembershipType, MemberDocument, etc.)
- Enum constants (MEMBERSHIP_STATUSES, MEMBERSHIP_TYPES, DOCUMENT_TYPES, etc.)
- No business logic, pure type definitions

**Usage:**
```javascript
import { MEMBERSHIP_TYPES, MEMBERSHIP_STATUSES } from "./services/types.js";
```

**Benefits:**
- Centralized type definitions
- Single source of truth for data shapes
- Improved IDE autocomplete

---

### 2. **DTOs Layer** (`dtos.js`)
**Purpose:** Defines Data Transfer Object shapes for API requests and responses.

**What it contains:**
- Request payload shapes (RegisterMemberRequest, UpdateMemberProfileRequest, etc.)
- Response payload shapes (RegisterMemberResponse, MemberProfileResponse, etc.)
- JSDoc type definitions for all API contracts
- DTO shape constants for reference

**Usage:**
```javascript
// Types are used as JSDoc for documentation
/**
 * @param {RegisterMemberRequest} memberData
 * @returns {Promise<RegisterMemberResponse>}
 */
```

**Benefits:**
- Api contract documentation
- Clear request/response expectations
- IDEautocomplete for API calls

---

### 3. **Services Layer** (`services.js`)
**Purpose:** Pure API calls without internal logic.

**What it contains:**
- Axios API calls to backend endpoints
- Raw HTTP requests and responses
- No error handling beyond axios defaults
- No Redux/state management calls
- No React Query logic
- JSDoc with detailed parameter and return types

**Key Functions (User):**
- `registerMember(memberData)`
- `getMembershipTypes()`
- `getMemberProfile(memberId)`
- `updateMemberProfile(memberId, profileData)`
- `uploadVerificationDocument(memberId, file, documentType)`
- `renewMembership(memberId)`
- `getMembershipHistory(memberId)`

**Key Functions (Admin):**
- `getAllMembers(page, limit, search, status)`
- `getPendingVerifications()`
- `verifyDocument(documentId, status, rejectionReason)`
- `getExpiringMemberships()`
- `getMembershipStats()`
- `autoExpireMembers()`

**Usage:**
```javascript
import { registerMember, getMembershipTypes } from "./services/services.js";

const response = await registerMember(formData);
const types = await getMembershipTypes();
```

**Benefits:**
- Pure functions (testable)
- Decoupled from React Query
- Reusable from any context
- Single responsibility

---

### 4. **Queries Layer** (`queries.js`)
**Purpose:** React Query hooks wrapping service layer calls.

**What it contains:**
- Query keys management (`membershipQueryKeys`, `adminMembershipQueryKeys`)
- `useQuery` hooks for fetching data
- `useMutation` hooks for mutations
- Automatic cache invalidation
- Error and success toast notifications
- Stale time and cache time configurations

**User Queries:**
- `useGetMembershipTypes()` - Fetch membership types (1hr stale)
- `useGetMemberProfile(memberId)` - Fetch member profile (5min stale)
- `useGetMembershipHistory(memberId)` - Fetch membership history (10min stale)

**User Mutations:**
- `useRegisterMember()` - Register new member with success callback
- `useUpdateMemberProfile(memberId)` - Update profile with invalidation
- `useUploadVerificationDocument(memberId)` - Upload documents with invalidation
- `useRenewMembership(memberId)` - Renew membership with dual invalidation

**Admin Queries:**
- `useGetAllMembers(page, limit, search, status)` - Members list with filtering
- `useGetPendingVerifications()` - Pending documents (auto-refetch every 30s)
- `useGetMembershipStats()` - Dashboard statistics
- `useGetExpiringMemberships()` - Members expiring soon

**Admin Mutations:**
- `useVerifyDocument()` - Approve/reject documents with multi-query invalidation
- `useAutoExpireMembers()` - Auto-expire all past-due memberships

**Usage:**
```javascript
import { useGetMembershipTypes, useRegisterMember } from "./services/queries.js";

const { data: types } = useGetMembershipTypes();
const { mutate: registerMember, isPending } = useRegisterMember();
```

**Benefits:**
- Declarative data fetching
- Built-in caching strategy
- Automatic cache management
- Unified error handling
- Optimized refetch intervals

---

## Data Flow Architecture

```
Component
    ↓
Custom Hook (useX) 
    ├─ Manages local state
    ├─ Calls queries/mutations
    └─ Returns { state, handlers, data }
    ↓
Queries Layer (queries.js)
    ├─ React Query hooks
    ├─ Cache management
    ├─ Error/success handling
    └─ Auto-invalidation
    ↓
Services Layer (services.js)
    ├─ Pure API calls
    ├─ No side effects
    └─ Returns raw response
    ↓
Backend API
```

---

## File Structure

```
features/membership/
├── users/
│   ├── services/
│   │   ├── types.js          ← Type definitions
│   │   ├── dtos.js           ← Response/request shapes
│   │   ├── services.js       ← Pure API calls
│   │   └── queries.js        ← React Query hooks
│   ├── hooks/
│   │   └── useMemberRegistration.js  ← Custom hook using new queries
│   └── pages/
│       └── MemberRegistration.jsx    ← Component using hook
│
└── admin/
    ├── services/
    │   ├── types.js          ← Type definitions
    │   ├── dtos.js           ← Response/request shapes
    │   ├── services.js       ← Pure API calls
    │   └── queries.js        ← React Query hooks
    ├── hooks/
    │   └── useAdminMembership.js    ← Custom hook using new queries
    └── pages/
        └── AdminMembershipDashboard.jsx  ← Component using hook
```

---

## Migration Guide (Old → New)

### Before (Old Structure)
```javascript
// All in one membershipService.js
export const registerMemberAPI = async (memberData) => { ... }
export const getMembershipTypesAPI = async () => { ... }

// Direct in hook
const { mutate: register } = useMutation({
  mutationFn: registerMemberAPI,
  onSuccess: () => { ... },
  onError: () => { ... }
});
```

### After (New Structure)
```javascript
// services/types.js - Type definitions
export const MEMBERSHIP_TYPES = { STANDARD, STUDENT, VETERAN };

// services/dtos.js - Shape documentation
/**
 * @typedef {Object} RegisterMemberResponse
 * @property {Object} member
 * @property {string} member._id
 */

// services/services.js - Pure API
export const registerMember = async (memberData) => { ... }

// services/queries.js - React Query hooks
export const useRegisterMember = () => useMutation({ ... });

// hooks/useMemberRegistration.js - Custom hook
const { mutate: registerMember } = useRegisterMember();

// pages/MemberRegistration.jsx - Component
const { registerMember, isRegistering } = useMemberRegistration();
```

---

## Best Practices Implemented

### 1. **Single Responsibility**
- Each file has one clear purpose
- No mixing of concerns

### 2. **Dependency Injection**
- `memberId` passed as parameter
- Conditional hook creation for availability checks

### 3. **Type Safety**
- JSDoc everywhere for IDE support
- Clear parameter and return types

### 4. **Cache Strategy**
- Different stale times per query type
- Automatic invalidation on mutations
- Real-time refetching for pending docs (30s)

### 5. **Error Handling**
- Centralized in mutations via toast notifications
- Original errors preserved for handling

### 6. **Reusability**
- Services can be called from any context (CLI, tests, etc.)
- Queries and mutations are React-specific but compositional

---

## Query Key Convention

Query keys follow a hierarchical pattern for easy invalidation:

```javascript
// User membership
membershipQueryKeys = {
  all: ["membership"],           // Invalidate all user queries
  types: () => [...all, "types"],
  profiles: () => [...all, "profiles"],
  profile: (id) => [...profiles(), id],
  history: () => [...all, "history"],
  memberHistory: (id) => [...history(), id],
}

// Admin membership
adminMembershipQueryKeys = {
  all: ["admin-membership"],      // Separate namespace from user
  members: () => [...all, "members"],
  membersList: (page, limit, search, status) => [...members(), { page, limit, search, status }],
  stats: () => [...all, "stats"],
  verifications: () => [...all, "verifications"],
  expiring: () => [...all, "expiring"],
}
```

---

## Testing Strategy

With this architecture, testing becomes modular:

```javascript
// Unit test services (no React)
test("registerMember calls correct endpoint", async () => {
  const result = await registerMember(mockData);
  expect(api.post).toHaveBeenCalledWith("/membership/register", mockData);
});

// Integration test queries (with React Query)
test("useRegisterMember invalidates profiles on success", () => {
  const { mutate } = renderHook(() => useRegisterMember());
  // Assert cache was cleared
});

// Component test with hooks
test("MemberRegistration displays success after registration", () => {
  render(<MemberRegistration />);
  // Interact and assert
});
```

---

## Adding New Features

To add a new membership feature:

1. **Create `types.js`** - Define entity and constants
2. **Create `dtos.js`** - Define API contract shapes
3. **Create `services.js`** - Add pure API functions
4. **Create `queries.js`** - Wrap with React Query hooks
5. **Create custom hook** - Orchestrate query hooks
6. **Use in component** - Import custom hook

---

## Benefits of This Architecture

✅ **Scalability** - Easy to extend with new features
✅ **Maintainability** - Clear structure and responsibilities
✅ **Testability** - Each layer testable independently
✅ **Reusability** - Services usable outside React
✅ **Performance** - Optimized caching with React Query
✅ **Type Safety** - JSDoc provides IDE support
✅ **Separation of Concerns** - Each file has single responsibility
✅ **Documentation** - Self-documenting through JSDoc

