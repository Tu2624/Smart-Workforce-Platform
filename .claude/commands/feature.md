I am about to implement the feature: $ARGUMENTS

Follow these steps:

1. Read `docs/system-overview.md` — focus on section "4. Feature Impact Matrix" and "8. How to Add a New Feature (Checklist)"
2. Based on the feature name "$ARGUMENTS", identify:
   - What types of changes will occur (new DB table? new endpoint? new component? new socket event?...)
   - Mark which files are REQUIRED to update according to the Feature Impact Matrix
3. If the feature needs a new endpoint, changes to request/response, or a new interface: **read `docs/08-api-and-interfaces.md`** — Section 1 to see the current endpoint list, Section 2 to see which interfaces are already defined and which are missing. This step is mandatory to avoid creating duplicate endpoints or conflicting interfaces.
4. Read other relevant docs files to understand the current context
5. Create a concrete 6-step checklist for this feature (Design → Infrastructure → Backend → Frontend → Testing → Deployment), keeping only the steps that truly apply and skipping steps that don't. If the Feature Impact Matrix marks `08-api-interfaces` as REQUIRED, **include a step to update `docs/08-api-and-interfaces.md`** in the checklist (add endpoint to Section 1 and/or interface to Section 2).
6. Immediately identify which cross-cutting contracts (A/B/C/D) will be affected and the specific points to watch out for
