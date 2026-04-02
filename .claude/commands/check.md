Check the cross-layer consistency of the work just completed.

Follow this order:

1. Read `docs/system-overview.md` — section "2. The Four Contracts" and "4. Feature Impact Matrix"
2. Read `docs/08-api-and-interfaces.md` — this is the quick source of truth for the endpoint list and TypeScript interfaces
3. For each Contract (A, B, C, D), check:
   - **Contract A** (DB Schema ↔ API Response): Are there any new/changed DB columns that the API response shape doesn't yet reflect?
   - **Contract B** (API Endpoint ↔ Frontend API Module): Are there any new/changed endpoints where (a) `docs/08-api-and-interfaces.md` Section 1 hasn't been updated, or (b) `frontend/src/api/*.ts` doesn't have a corresponding function? Check both sides.
   - **Contract C** (Socket.io Event ↔ Frontend Hook): Are there any new/changed events that the frontend socket hook isn't listening for?
   - **Contract D** (Business Rule ↔ Test Assertion): Are there any changed constants where test assertions haven't been updated?
4. Check `docs/08-api-and-interfaces.md` separately:
   - Are there any interfaces in Section 2 that are still missing (not yet in `frontend/src/types/`) but the feature just implemented needs them immediately?
   - Are there any endpoints just added/changed that aren't yet reflected in Section 1?
5. Check the Feature Impact Matrix — for the changes just made, are there any files marked REQUIRED that haven't been updated?
6. Report results clearly:
   - ✅ in sync
   - ⚠️ needs further checking (state reason)
   - ❌ contract violation (state specifically what needs to be done)

$ARGUMENTS
