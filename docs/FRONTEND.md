# Frontend — Life Goals with Kate

Codex owns the current frontend integration and refinement after the user-authorised handover from Opus stage 5. Moving, Saving and Profile use in-process services; components do not reimplement financial decisions.

## Run it

Requires Node.js 20+ (development uses Node 24).

```bash
npm ci
npm run dev        # localhost:3000; use -- --port 3100 if occupied
npm run typecheck
npm run build
npm run start
```

No API keys are needed. Data is synthetic; the fixed demo date is 1 October 2026. A document reload starts fresh in-memory sessions. Ordinary button actions and tab navigation preserve them.

## Profile-led Saving demo

1. Home shows €650 of a €2,000 Japan goal and invites the customer to personalise.
2. Profile → Add → enter a bio or use the Japan example → review the proposed preferences.
3. Confirm subscription reviews. The local parser uses keywords, not a live model; suggestions can be corrected or replaced manually. Coffee-only preferences show no matching spending suggestion.
4. Home → Review the charges → mark Stream A unused. The real Saving service proposes €13/month. Add to my plan changes the projected finish from September to August 2027; actual saved remains €650.
5. Profile contains goal editing (`UPDATE_GOAL`), a suggestions switch and Data & your answers. Evidence is expanded on demand. A plan can be removed; keeping a service or snoozing gives a quiet outcome.

A shared Profile session holds bio and confirmed preferences. Moving and Saving have independent financial snapshots and revisions. Editing the bio invalidates previous preference confirmations. Existing plans are preserved when preferences change. Reset clears the active scenario and shared Profile.

## Moving demo

Moving starts at €2,850 potentially available. Confirming a €2,500 move leaves €350. Acknowledge the reserve, then answer the coverage check. Home and Kate share the result. Profile → Data & your answers exposes provenance and Clear controls. Pausing retains answers. The alternate no-upcoming-plans path supports an explicitly labelled investment simulation; no money moves.

## Layout and interaction

- Custom KBC-inspired palette: ink navy `#183449`, muted blue `#007da9`, warm canvas `#f8f8f5`, white surfaces and restrained green. These are prototype design choices, not exact KBC brand tokens. Albert Sans is self-hosted.
- Profile shows identity, a short introduction and grouped settings. Bio, preference, goal and evidence details open in bottom sheets instead of filling a long nested-card page.
- Calculation details and the judge-facing trace are collapsed initially.
- The CSS phone fits available height, with a titanium rim, camera detail and status bar. Below 640 px the app fills the screen; demo controls remain below it.
- Tab scroll containers remain mounted. Action titles do not key/remount cards. Device scaling has no competing entrance animation. Service responses update the existing view instead of replaying screen transitions.
- Motion is local: button feedback, switch travel, amount/progress changes and sheet entrance. Reduced-motion settings are respected.
- Sheets trap focus, make the phone background inert and restore focus without scrolling. Domain errors retain the editor and input; no automatic retry.

## Integration status

| Area | Status |
|---|---|
| Moving / Saving services | Connected; one instance per session |
| Profile (`profile-1.0`) | Connected: bounded bio, local proposals, confirmation/correction and subscription relevance filtering |
| Saving `UPDATE_GOAL` | Connected through Profile |
| Saving `RECORD_CONTRIBUTION` | Service only; no UI control |
| Service dispatch | Serialized, returned snapshot adopted on success and domain error |
| Cross-scenario ranking | Deferred; confirmed subscription preference filters optional Saving discovery only |
| Recognition / constrained explanation UI | Not connected |
| Live bio model / voice / persistence | Not implemented |

## Verification record

Opus recorded a browser walkthrough of both domain journeys before the handover. The current refinement passed `npm run typecheck` and `npm run build`. Browser keyboard walkthrough covered bio confirmation → Stream A review → saving intention (€650 unchanged, September → August), Profile pause/resume, and Moving confirmation (€2,850 → €350). At a 390 px viewport, the document had no horizontal overflow and the Profile settings fit the mobile layout. No captured browser console errors occurred. Pointer automation in the in-app browser did not reliably hit scaled controls, so these results are keyboard-interaction evidence, not a complete mouse/touch audit. No automated test suite was added or run for this UI stage.

## Known limitations

Session state is memory-only. No live bank connection, cancellation, payment or external policy action exists. Keyword parsing may misread negation, so proposed tags always need customer confirmation. A completed investment simulation still uses its original exploration title in the engine trace. This is not a full accessibility audit; screen-reader testing remains outstanding.
