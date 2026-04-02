I am about to work with: $ARGUMENTS

This is a sensitive area of the system. Please:

1. Read `docs/system-overview.md` — sections "2. The Four Contracts", "3. Authentication & Authorization Flow", and "5. Critical Business Rules"
2. Identify which category "$ARGUMENTS" belongs to and read further:
   - **Auth / JWT / Role**: Read `docs/03-backend.md` §3 and `docs/04-frontend.md` §4, §8, §9 — verify the auth flow cross-layer
   - **Enum values**: Contract A binding — the enum appears simultaneously in DB schema, Zod validation, TypeScript type, Badge.tsx color map, and test assertions. Also check the corresponding interface in `docs/08-api-and-interfaces.md` §2.1 because the type literal must match.
   - **API endpoint or TypeScript interface**: Read `docs/08-api-and-interfaces.md` — Section 1 to see the current shape of existing endpoints, Section 2 to see which interfaces are already defined. Contract B binding: endpoint changes must be synced with the interface in §2.2 (API Response Shapes) and the function in `frontend/src/api/*.ts`.
   - **Socket.io events**: Contract C is a three-file contract — must update `01-system-design.md` §5, `03-backend.md` §4, and `04-frontend.md` §6 simultaneously
   - **Business rule constants**: Contract D — changing a constant must sync both the implementation and test assertions immediately
3. List specifically what needs to be checked BEFORE making the change
4. Warn if the change could cause unexpected side effects on other layers
