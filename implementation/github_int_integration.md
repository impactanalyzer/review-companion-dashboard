# review-companion-dashboard — githubIntService Integration

> **Workspace owner:** `review-companion-dashboard`
>
> **Canonical contract:**
> `/Users/nirsriya/workspace/githubIntService/docs/design/implementation/phase 5/integration_design.md`
>
> **Contract version:** `demo-v1`
>
> **Scope:** Investor-demo manager, employee, and peer UI against `review-companion-service`.
> Do not call or modify `githubIntService` from this workstream.

## 1. Product boundary

The dashboard calls only `review-companion-service` through `VITE_API_BASE_URL`.

It must not:

- call the intelligence engine;
- send an engine customer ID, period key, GitHub username, or viewer role;
- decide which score fields to hide;
- render real GitHub usernames;
- fall back to hardcoded intelligence when the gateway fails.

The gateway returns product UUIDs, aliased names, and already role-scoped DTOs.

## 2. Current baseline

Reusable:

- React/Vite application and role-specific routes;
- login page and `AppContext`;
- manager dashboard and assessment page;
- employee review dashboard;
- `ReviewWriter` side-context layout;
- review cycle/request/feedback flows.

Must change:

- pages use raw `fetch()` with `any`;
- login state is not consistently persisted;
- role casing is inconsistent;
- no shared authorization header is sent;
- `ReviewWriter` exposes `qualityScore` and PR count to peers;
- `ManagerAssessmentPage` renders the obsolete impact-metrics model;
- recommendation selection is manual only;
- moderation UI does not exist;
- several static interaction cards and quarter values are fake;
- no Cal.com alias/demo identity flow is visible.

## 3. Demo session UX

The demo uses separate seeded product accounts:

- one synthetic manager;
- selected aliased employee accounts.

The investor flow explicitly logs out and logs in to change roles. Do not add a persona switcher.

### Required behavior

1. Login stores the product session token and normalized user profile.
2. Refresh restores the session.
3. Logout removes all session and cached role-scoped data.
4. Manager routes reject employee sessions.
5. Employee/peer routes reject manager-only payloads.
6. Switching accounts cannot reuse the previous user's profile, recommendations, moderation queue,
   or peer context.

Normalize roles at the context boundary:

```ts
type ProductRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
```

Do not maintain lowercase and uppercase variants in component checks.

## 4. API client

Create a small typed client instead of adding more page-local `fetch()` calls:

```text
src/api/client.ts
src/api/ai.ts
src/api/auth.ts
src/api/reviews.ts
src/api/types.ts
```

`client.ts` owns:

- `API_BASE_URL`;
- product `Authorization` header;
- JSON parsing;
- request IDs returned by the gateway;
- error-envelope parsing;
- `401` session clearing;
- typed `ApiError`.

It must not retry mutating moderation or feedback requests automatically.

### AI functions

```ts
getCycleReadiness(cycleId: string)
getManagerProfile(targetUserId: string, cycleId: string)
getRecommendations(targetUserId: string, cycleId: string)
getPeerReviewContext(requestId: string)
getModerationQueue(cycleId: string)
decideModeration(moderationId: string, body: ModerationDecisionInput)
```

The client consumes the product gateway routes in the canonical contract. It does not model engine
headers or GitHub identities.

## 5. Browser DTOs

Define strict TypeScript types matching `demo-v1`.

### Shared

```ts
type ProductIdentity = {
  id: string;
  name: string;
};

type ArtifactReference = {
  type: "PR" | "COMMENT" | "DOMAIN";
  url: string;
  title: string;
  domain?: string;
  whyShort: string;
};
```

There is deliberately no `githubUsername`.

### Manager profile

```ts
type ManagerProfile = {
  target: ProductIdentity;
  archetype: {
    primary: string;
    secondary?: string;
  };
  grade: string;
  badges: string[];
  dimensions: Array<{
    name: string;
    polarity: "STRENGTH" | "IMPROVEMENT";
    label: string;
    score: number;
    sampleSize: number;
    evidence: ArtifactReference[];
  }>;
  provenance: {
    promptVersion: string;
    modelVersion: string;
    computedAt: string;
  };
};
```

### Recommendation list

```ts
type FeedbackRecommendationView = {
  target: ProductIdentity;
  recommendationSetId?: string;
  recommendations: Array<{
    reviewer: ProductIdentity;
    narrative: string;
    domains: string[];
    artifactReferences: ArtifactReference[];
  }>;
};
```

No score or numeric rank is allowed in this type.

### Peer review context

```ts
type PeerReviewContext = {
  target: ProductIdentity;
  targetArchetypeLabel?: string;
  themes: Array<{
    name: string;
    guidance: string;
  }>;
  artifactReferences: ArtifactReference[];
  recommendationNarrative?: string;
};
```

No grade, score, percentile, rank, work share, or improvement summary is allowed.

### Moderation

```ts
type ModerationItem = {
  id: string;
  target: ProductIdentity;
  targetType: "IMPROVEMENT_SUMMARY";
  originalText: string;
  workSharePct: number;
  sampleSize: number;
  artifactReferences: ArtifactReference[];
};
```

## 6. Manager experience

### Manager dashboard

File: `src/pages/ManagerDashboardPage.tsx`

For each reportee:

- retain native review-cycle progress;
- show profile readiness (`Ready`, `Preparing`, `Unavailable`);
- show archetype and recognition badges when ready;
- expose an `Evaluate` action only through the existing review workflow.

Do not build a new leaderboard for the demo.

### Manager assessment

File: `src/pages/ManagerAssessmentPage.tsx`

Replace the old `authorMetrics`/`reviewerMetrics` panel with three manager-only sections:

1. **Impact profile**
   - primary/secondary archetype;
   - grade;
   - badges;
   - provenance timestamp.
2. **Dimensions and evidence**
   - strengths first;
   - manager-only improvement dimensions;
   - sample size and linked artifacts.
3. **AI growth-summary moderation**
   - original pending summary;
   - work-share/sample context;
   - evidence links;
   - `Showcase`, `Edit`, and `Dismiss` actions.

Moderation behavior:

- `Showcase` confirms the original text;
- `Edit` requires non-empty final text;
- `Dismiss` may collect an optional reason;
- disable controls while the request is in flight;
- remove a successfully decided item from the pending queue;
- retain local notification and error handling;
- do not merge moderation text into the manager's native evaluation automatically.

The manager's existing `SAVE_DRAFT`, `SUBMIT`, and `RETURN` review actions remain independent.

## 7. Employee experience

File: `src/pages/ReviewDashboardPage.tsx`

Add a **Recommended feedback providers** section to the Request Feedback flow:

- fetch recommendations for the logged-in employee and active cycle;
- show aliased reviewer name, grounded narrative, domains, and artifact links;
- allow selecting recommended peers;
- retain manual employee search below recommendations as a fallback;
- submit selected product reviewer IDs through the native batch-request endpoint;
- never show scores, rank numbers, grades, percentiles, or real GitHub names.

Suggested presentation:

```text
Taylor R.
Why ask: Taylor reviewed your scheduling and API work and can speak to...
Relevant areas: Scheduling, API
[View supporting work]
```

The order returned by the gateway may communicate priority, but the UI must not label it with a
numeric rank.

## 8. Peer experience

File: `src/components/ReviewWriter.tsx`

Delete the current `aiMetrics` state and `/api/users/:targetId/ai-metrics` request.

Replace it with:

```ts
getPeerReviewContext(requestId)
```

`ReviewWriter` therefore needs `requestId` as a required prop for peer reviews. Do not construct the
request from `targetId`; the gateway uses `requestId` to authorize reviewer and target.

Rename:

```text
"Show AI Context" -> "Show work context"
"AI Context for X" -> "Work context for X"
```

Render:

- recommendation narrative;
- qualitative themes and prompts;
- artifact links with domain and `whyShort`;
- optional archetype label without grade.

Remove:

- PR count;
- quality score;
- reviewer impact score;
- percentiles;
- numeric evaluation colors;
- any generic hardcoded interaction cards.

### Defense-in-depth assertion

Add a development/test helper that recursively fails when a peer DTO contains:

```text
score, *Score, grade, percentile, rank, scoreBreakdown,
axisScores, absoluteScore, hiddenSourceUser, githubUsername
```

The engine and gateway remain authoritative; this catches contract regressions during UI development.

## 9. Loading and error states

Every intelligence surface supports:

- `loading`;
- `ready`;
- `DATA_NOT_READY`;
- `IDENTITY_MAPPING_MISSING`;
- `CYCLE_MAPPING_MISSING`;
- `FORBIDDEN`;
- `UPSTREAM_UNAVAILABLE`.

Required copy:

```text
DATA_NOT_READY:
"Analysis is still being prepared for this review cycle."

IDENTITY_MAPPING_MISSING:
"This demo profile is not linked to the selected GitHub dataset."

UPSTREAM_UNAVAILABLE:
"Analysis is temporarily unavailable. Existing review content is still accessible."
```

Never display hardcoded scores or pretend that unavailable intelligence is ready.

Native self-review, peer-feedback, and manager-evaluation functions should remain usable when
intelligence reads fail.

## 10. Authentication and context fixes required for demo

### `src/context/AppContext.tsx`

- persist the token and normalized user;
- expose `login`, `logout`, and restored-session loading state;
- clear all user-specific query state on logout;
- standardize `orgId`/customer ID representation.

### `src/pages/LoginPage.tsx`

- use the shared auth client;
- persist the returned token;
- normalize role once;
- route `MANAGER` and `EMPLOYEE` deterministically.

### Route protection

Add a small role guard component:

```ts
<RequireRole allow={["MANAGER"]}>...</RequireRole>
```

This is UX defense only. The companion service remains the authorization authority.

The demo does not require a persona-switcher. The presenter logs out and logs in using prepared
manager/employee credentials.

## 11. Fixture-first parallel development

Implement the dashboard before the real gateway is ready by mocking the exact product-facing
`demo-v1` fixtures:

```text
src/test/fixtures/ai/readiness-ready.json
src/test/fixtures/ai/readiness-not-ready.json
src/test/fixtures/ai/manager-profile.json
src/test/fixtures/ai/self-recommendations.json
src/test/fixtures/ai/peer-review-context.json
src/test/fixtures/ai/moderation-pending.json
src/test/fixtures/ai/errors.json
```

Mock at the API module boundary, not inside page components. Components must not know whether data came
from fixtures or the live service.

Contract changes require updating the canonical Phase 5 contract first.

## 12. Tests

### Unit/component

- API envelope and error parsing;
- role normalization and logout cache clearing;
- manager profile rendering;
- recommendation selection;
- peer context rendering;
- recursive forbidden-field assertion;
- moderation action validation;
- loading/not-ready/error states.

### Role-disclosure tests

- manager profile renders scores/grade;
- employee recommendations render no numeric score or rank;
- peer writer renders no forbidden field;
- peer cannot navigate to manager assessment;
- logout from manager and login as employee leaves no manager data in DOM or state.

### Integration smoke

1. log in as synthetic manager;
2. open a reportee profile and moderation queue;
3. decide one improvement summary;
4. log out;
5. log in as an employee;
6. view recommendations and request feedback;
7. log out;
8. log in as a recommended peer;
9. open `ReviewWriter`, inspect evidence, and submit feedback;
10. log back in as manager and view the submitted peer feedback.

## 13. Implementation sequence

1. Add typed API modules and fixture adapters.
2. Normalize product session/role handling.
3. Implement manager profile panel.
4. Implement moderation queue and decision controls.
5. Implement employee recommendation selection.
6. Replace `ReviewWriter` score panel with peer context.
7. Remove static AI interaction placeholders and old metrics types.
8. Add error/not-ready states.
9. Run dashboard tests against fixtures.
10. Switch fixture adapter to live companion routes and run the role-flow smoke test.

## 14. Completion criteria

- Dashboard has no direct engine URL or engine headers.
- No active component calls `/api/users/:id/ai-metrics`.
- Manager sees profile, dimensions, evidence, and moderation controls.
- Employee sees score-free recommendations.
- Peer sees score-free work context.
- No GitHub username appears in browser data or rendered UI.
- Separate manager and employee login/logout flows work reliably.
- No role-scoped data survives logout.
- Intelligence failures never produce mock values.
- No sibling workspace was modified by this workstream.

## 15. Deferred

- production design system refactor;
- generalized onboarding and GitHub-linking UI;
- production SSO/session hardening;
- client-side query caching library;
- automated browser tests across deployed environments;
- organization-configurable archetype visibility;
- accessibility and responsive-polish pass beyond the investor path.

