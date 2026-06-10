# Sign In with Apple Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native Sign In with Apple button to the ALMA iOS login screen, backed by a new `POST /api/auth/apple` Express route that verifies Apple's identity token and issues an ALMA JWT.

**Architecture:** Frontend uses `expo-apple-authentication` to get a signed `identityToken` from Apple's native sheet, then POSTs it to the backend. The backend verifies the token against Apple's public JWKS, then finds-or-creates a user (linking by email if the account already exists), and returns the same JWT shape as all other auth routes.

**Tech Stack:** expo-apple-authentication, jwks-rsa, jsonwebtoken, Prisma (PostgreSQL), Express, Zod, Zustand

---

## File Map

| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Add `appleId String? @unique` to `User` model |
| `backend/src/routes/auth.ts` | Add `appleSchema` Zod validator + `POST /apple` route handler |
| `backend/package.json` | Add `jwks-rsa` dependency |
| `frontend/package.json` | Add `expo-apple-authentication` dependency |
| `frontend/app.json` | Add `expo-apple-authentication` to plugins, add `bundleIdentifier` to ios config |
| `frontend/app/(auth)/login.tsx` | Add Apple button (iOS-only), `handleAppleLogin` handler, `appleLoading` state |

---

## Task 1: Add `appleId` to Prisma schema and migrate

**Files:**
- Modify: `backend/prisma/schema.prisma` (User model, line 71 — after `googleId`)

- [ ] **Step 1: Add `appleId` field to User model**

Open `backend/prisma/schema.prisma`. After line 71 (`googleId String? @unique`), add:

```prisma
  appleId              String?   @unique
```

The User model block should now look like:

```prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  passwordHash         String?
  role                 Role      @default(STUDENT)
  displayName          String
  avatarUrl            String?
  age                  Int?
  gender               Gender?
  nativeLanguage       String?
  country              String?
  isEmailVerified      Boolean   @default(false)
  isOnboardingComplete Boolean   @default(false)
  isActive             Boolean   @default(true)
  googleId             String?   @unique
  appleId              String?   @unique
  xpTotal              Int       @default(0)
  ...
```

- [ ] **Step 2: Create and apply the migration**

```bash
cd backend
npx prisma migrate dev --name add_apple_id
```

Expected output:
```
✔ Generated Prisma Client
The following migration was created: prisma/migrations/20260610_add_apple_id/migration.sql
```

- [ ] **Step 3: Verify migration SQL**

Open `backend/prisma/migrations/<timestamp>_add_apple_id/migration.sql` — it should contain:

```sql
ALTER TABLE "User" ADD COLUMN "appleId" TEXT;
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");
```

- [ ] **Step 4: Commit**

```bash
cd backend
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add appleId field to User model"
```

---

## Task 2: Install `jwks-rsa` on the backend

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install the package**

```bash
cd backend
npm install jwks-rsa
```

- [ ] **Step 2: Verify it's in package.json**

Check `backend/package.json` — `jwks-rsa` should appear in `dependencies`.

- [ ] **Step 3: Commit**

```bash
cd backend
git add package.json package-lock.json
git commit -m "chore: add jwks-rsa for Apple identity token verification"
```

---

## Task 3: Add `POST /api/auth/apple` backend route

**Files:**
- Modify: `backend/src/routes/auth.ts`

- [ ] **Step 1: Add the import for `jwks-rsa` at the top of auth.ts**

Open `backend/src/routes/auth.ts`. After the existing imports (after line 10 `import { verifyJWT } from '../middleware/auth'`), add:

```typescript
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
```

- [ ] **Step 2: Add the JWKS client and Zod schema after the existing schemas block**

After the `onboardingSchema` definition (around line 127), add:

```typescript
const appleJwksClient = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
})

const appleSchema = z.object({
  identityToken: z.string().min(1),
  displayName: z.string().min(1).max(100).optional(),
})
```

- [ ] **Step 3: Add the route handler before `export default router`**

At the bottom of `backend/src/routes/auth.ts`, before the final `export default router` line, add:

```typescript
// ─── POST /api/auth/apple ─────────────────────────────────────────────────────

router.post('/apple', async (req: Request, res: Response): Promise<void> => {
  const parsed = appleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR' })
    return
  }

  const { identityToken, displayName } = parsed.data

  try {
    // Decode header to get the key ID (kid)
    const decoded = jwt.decode(identityToken, { complete: true })
    if (!decoded || typeof decoded === 'string' || !decoded.header?.kid) {
      res.status(401).json({ error: 'Invalid Apple token', code: 'INVALID_APPLE_TOKEN' })
      return
    }

    // Fetch matching public key from Apple's JWKS
    const key = await appleJwksClient.getSigningKey(decoded.header.kid)
    const publicKey = key.getPublicKey()

    // Verify the token — audience must be our bundle ID
    const payload = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
    }) as jwt.JwtPayload

    const appleId = payload.sub
    const email = payload.email as string | undefined

    if (!appleId) {
      res.status(401).json({ error: 'Invalid Apple token', code: 'INVALID_APPLE_TOKEN' })
      return
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ appleId }, ...(email ? [{ email }] : [])] },
    })

    if (!user) {
      // New user — email is required for account creation
      if (!email) {
        res.status(400).json({ error: 'Email not provided by Apple', code: 'MISSING_EMAIL' })
        return
      }
      user = await prisma.user.create({
        data: {
          email,
          appleId,
          displayName: displayName || email.split('@')[0],
          isEmailVerified: true,
          role: 'STUDENT',
        },
      })
    } else if (!user.appleId) {
      // Existing user matched by email — link Apple ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: { appleId, isEmailVerified: true },
      })
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated', code: 'ACCOUNT_INACTIVE' })
      return
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isOnboardingComplete: user.isOnboardingComplete,
        xpTotal: user.xpTotal,
        streakCount: user.streakCount,
      },
    })
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Invalid Apple token', code: 'INVALID_APPLE_TOKEN' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
  }
})
```

- [ ] **Step 4: Check TypeScript compiles**

```bash
cd backend
npx tsc --noEmit
```

Expected output: no errors.

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/routes/auth.ts
git commit -m "feat: add POST /api/auth/apple route with JWKS token verification"
```

---

## Task 4: Install `expo-apple-authentication` on the frontend

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/app.json`

- [ ] **Step 1: Install the package**

```bash
cd frontend
npx expo install expo-apple-authentication
```

Expected: package added to `frontend/package.json` dependencies.

- [ ] **Step 2: Add the plugin and bundle identifier to app.json**

Open `frontend/app.json`. Make two changes:

**a)** In the `"plugins"` array, add `"expo-apple-authentication"`:

```json
"plugins": [
  "expo-router",
  "expo-speech-recognition",
  "expo-apple-authentication",
  ...
]
```

**b)** In the `"ios"` block, add `"bundleIdentifier"` (use whatever unique ID you registered on the Apple Developer portal, e.g. `"com.almalearn.app"`):

```json
"ios": {
  "supportsTablet": false,
  "bundleIdentifier": "com.almalearn.app",
  "infoPlist": {
    "NSSpeechRecognitionUsageDescription": "Allow $(PRODUCT_NAME) to use speech recognition.",
    "NSMicrophoneUsageDescription": "Allow $(PRODUCT_NAME) to use the microphone."
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add package.json package-lock.json app.json
git commit -m "chore: install expo-apple-authentication and set ios bundleIdentifier"
```

---

## Task 5: Add Apple Sign In button to the login screen

**Files:**
- Modify: `frontend/app/(auth)/login.tsx`

- [ ] **Step 1: Add the import**

At the top of `frontend/app/(auth)/login.tsx`, add after the existing imports (after the `useAuthStore` import line):

```typescript
import * as AppleAuthentication from 'expo-apple-authentication'
```

- [ ] **Step 2: Add `appleLoading` state**

Inside the `Login` component, after the existing `const [error, setError] = useState<string | null>(null)` line (around line 41), add:

```typescript
const [appleLoading, setAppleLoading] = useState(false)
```

- [ ] **Step 3: Add `handleAppleLogin` function**

After the `handleGoogleLogin` function (after line 125), add:

```typescript
const handleAppleLogin = async () => {
  setAppleLoading(true)
  setError(null)
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    const displayName = credential.fullName
      ? [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ')
      : undefined

    const { data } = await api.post('/api/auth/apple', {
      identityToken: credential.identityToken,
      ...(displayName ? { displayName } : {}),
    })

    await saveToken(data.token)
    useAuthStore.getState().setAuth(data.token, data.user)

    if (!data.user.isOnboardingComplete) {
      router.replace('/(onboarding)/name')
    } else if (data.user.role === 'ADMIN') {
      router.replace('/(admin)/overview')
    } else {
      router.replace('/(student)/home')
    }
  } catch (e: any) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return // user dismissed the sheet
    setError(getErrorMessage(e, 'Apple sign-in failed'))
  } finally {
    setAppleLoading(false)
  }
}
```

- [ ] **Step 4: Add the Apple button in JSX**

In the JSX return block, find the Google button block (around line 231–238):

```tsx
<TouchableOpacity
  style={styles.googleBtn}
  onPress={handleGoogleLogin}
  activeOpacity={0.85}
>
  <GoogleIcon />
  <Text style={styles.googleText}>Sign In with Google</Text>
</TouchableOpacity>
```

Immediately after the closing `</TouchableOpacity>` of the Google button and before the `<View style={styles.registerRow}>` block, add:

```tsx
{Platform.OS === 'ios' && (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
    cornerRadius={26}
    style={styles.appleBtn}
    onPress={handleAppleLogin}
  />
)}
```

- [ ] **Step 5: Add the `appleBtn` style**

In the `StyleSheet.create({...})` block at the bottom of the file, after the `googleText` style entry, add:

```typescript
appleBtn: {
  width: '100%',
  height: 54,
  marginTop: 14,
},
```

- [ ] **Step 6: Check TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected output: no errors.

- [ ] **Step 7: Commit**

```bash
cd frontend
git add app/\(auth\)/login.tsx
git commit -m "feat: add Sign In with Apple button to login screen (iOS only)"
```

---

## Task 6: Build and test on device

- [ ] **Step 1: Make sure EAS CLI is installed and logged in**

```bash
npm install -g eas-cli
eas login
```

- [ ] **Step 2: Trigger a development build**

```bash
cd frontend
eas build --profile development --platform ios
```

EAS will ask to register devices if needed. When complete, scan the QR or follow the link to install the dev client on your iPhone.

- [ ] **Step 3: Start the dev server**

```bash
cd frontend
npx expo start --dev-client
```

Scan the QR with your iPhone camera to open the app in the dev client.

- [ ] **Step 4: Test the happy path**

1. Open the app on the iPhone
2. On the login screen, scroll down — you should see a white "Sign in with Apple" button below Google
3. Tap it → Apple's native sheet appears
4. Authenticate with Face ID / Touch ID
5. App navigates to onboarding (first time) or home (returning user)

- [ ] **Step 5: Test account linking**

1. Register an account with email/password using an email that matches your Apple ID
2. Log out
3. Tap Sign In with Apple using the same Apple ID email
4. Confirm you land on the home screen (not re-onboarding) — the accounts were linked

- [ ] **Step 6: Test cancel**

1. Tap Sign In with Apple
2. Tap Cancel on the Apple sheet
3. Confirm no error message appears and the login screen stays as-is
