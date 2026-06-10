# Sign In with Apple — Design Spec
Date: 2026-06-10

## Overview

Add Sign In with Apple to the ALMA mobile app using `expo-apple-authentication` (native iOS SDK). Follows the same find-or-create pattern as the existing Google OAuth flow. Shown only on iOS; not rendered on Android.

---

## Architecture

### Data Model

Add `appleId` field to the Prisma `User` model:

```prisma
appleId  String?  @unique
```

`appleId` stores Apple's stable `sub` identifier (not the email, which Apple can relay/hide). It is nullable so existing users (email/password, Google) are unaffected.

### Backend — New Route

`POST /api/auth/apple`

**Request body:**
```json
{ "identityToken": "<JWT from Apple>" }
```

**Flow:**
1. Receive `identityToken` from frontend
2. Verify token against Apple's public JWKS (`https://appleid.apple.com/auth/keys`)
3. Extract `sub` (Apple user ID) and `email` from verified payload
4. Find-or-create user:
   - If `appleId` matches existing user → log in
   - Else if `email` matches existing user → link account (set `appleId`), log in
   - Else → create new user with `appleId`, `email`, `isEmailVerified: true`
5. Issue ALMA JWT via existing `signToken()` → return `{ token, user }`

**Token verification:** Use `jwks-rsa` + `jsonwebtoken` to fetch Apple's public keys and verify the `identityToken`. Apple's JWKS endpoint is `https://appleid.apple.com/auth/keys`.

**New user display name:** Apple only sends the user's name on the *first* login (subsequent logins omit it). Frontend must capture the name from the first credential response and send it in the request body as `displayName`.

**Request body (full):**
```json
{
  "identityToken": "<JWT>",
  "displayName": "John Doe"  // optional, only present on first login
}
```

### Frontend — Login Screen Changes

File: `frontend/app/(auth)/login.tsx`

1. Install `expo-apple-authentication`
2. Import `AppleAuthentication` from `expo-apple-authentication`
3. Show Apple button only when `Platform.OS === 'ios'` AND `AppleAuthentication.isAvailableAsync()` returns true
4. On press:
   - Call `AppleAuthentication.signInAsync()` with scopes `FULL_NAME` and `EMAIL`
   - Extract `identityToken` and `fullName` from credential
   - POST to `/api/auth/apple` with `{ identityToken, displayName }`
   - Save JWT via `saveToken()`, update auth store, navigate (same routing logic as email/Google login)
5. Handle user cancel gracefully (error code `ERR_REQUEST_CANCELED` — show nothing)

**Button placement:** Below the Google button, above the register link. Apple's Human Interface Guidelines require the Apple button to appear on the same screen and at equal or greater prominence than other social login buttons — placing it directly below Google satisfies this.

---

## Error Handling

| Scenario | Backend response | Frontend action |
|---|---|---|
| Invalid/expired `identityToken` | 401 `{ error: 'Invalid Apple token' }` | Show generic login error |
| User cancelled Apple sheet | — (no request sent) | Silent no-op |
| Apple JWKS fetch failure | 500 | Show generic error |
| Existing user, no `appleId`, email match | Link account, 200 | Normal login |

---

## Packages

**Backend:** `jwks-rsa` (fetch Apple public keys), already has `jsonwebtoken`

**Frontend:** `expo-apple-authentication` (~2.2.0 for Expo SDK 54)

---

## What Is NOT in Scope

- Android support (Apple auth is iOS-only)
- Web support
- Unlinking Apple account
- Sign In with Apple on the registration screen (login screen only)

---

## Testing Notes

- Sign In with Apple only works on a **real iOS device** (not simulator)
- Requires the app to be built with the `Sign In with Apple` capability enabled in the Apple Developer portal (already planned)
- On first login, Apple sends name + email; on subsequent logins it sends neither — the backend must handle the missing `displayName` gracefully (fall back to email prefix)
