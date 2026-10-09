# Security Specification: Cancionero Salesiano

## 1. Data Invariants
- **Public Songbook Readability**: All songs marked with `isPublic: true` can be read by public congregation members, readers, and musicians.
- **Admin Authoring Invariant**: Only authenticated, verified administrators (bootstrapped admin `jomusa78@gmail.com` with `email_verified == true` or documents in `/admins/{adminId}`) may create, update, or delete songs.
- **Payload Integrity**: Every song document must have `id`, `title` (Number), `artist` (Song title / Author), `tags` array, and valid string lengths.
- **Tag Size Bound**: Tag arrays must have `.size() <= 20` to prevent Denial of Wallet resource exhaustion.
- **ID Safety**: Document IDs must satisfy `isValidId(songId)` (`^[a-zA-Z0-9_\-]+$` and length <= 128).
- **Default Deny**: Any unmatched paths or shadow collections are strictly inaccessible (`allow read, write: if false;`).

## 2. The "Dirty Dozen" Payloads (Expected to return PERMISSION_DENIED)
1. Unauthenticated write: Attempting to `create` a song without authentication.
2. Unverified email write: Authenticated user with `email: 'jomusa78@gmail.com'` but `email_verified: false` attempting to create/update.
3. Random user write: Authenticated user with email `attacker@example.com` trying to `delete` or `update` a song.
4. Giant ID injection: Attempting to create a song with a 2000-character malicious document ID.
5. Path variable traversal: Attempting to create a song with illegal characters in ID like `../../secrets`.
6. Unbounded array attack: Attempting to save a song with 5000 tags in the `tags` array.
7. Shadow field attack: Attempting to inject hidden administrative or arbitrary fields like `isAdmin: true` into a song document.
8. Missing required fields: Attempting to create a song without `id`, `title`, `artist`, or `tags`.
9. Invalid field types: Attempting to update `bpm` with a string `"fast"` instead of a number.
10. Unauthenticated admin registration: Attempting to write into `/admins/{adminId}` without being the bootstrapped superadmin.
11. Blanket modification of system timestamps: Overwriting immutable system fields with arbitrary non-string payloads.
12. Private song bypass: Attempting to list or read unlisted/private draft songs without admin credentials.

## 3. Test Runner Specification
Tests verify that all unauthorized and malformed operations fail with `PERMISSION_DENIED`.
