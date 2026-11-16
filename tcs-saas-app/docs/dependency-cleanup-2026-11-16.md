# Dependency cleanup, 2026-11-16

Local checkout: base `eb7c26c` plus the uncommitted cleanup. This is local validation; staging and production remain unverified.

`npm.cmd audit fix --ignore-scripts` updated compatible packages. `npm.cmd update brace-expansion --ignore-scripts` refreshed the remaining compatible brace-expansion patch. Package lifecycle scripts were disabled. No forced changes were applied. Direct package version ranges are unchanged.

The initial audit reported 18 findings (10 high, 8 moderate). The final fresh audit reports **14 findings (5 high, 9 moderate)**. The intermediate install summary reported 13; the fresh audit is authoritative for this record. Counts include affected parent packages, not just distinct advisories. Full advisory URLs, affected paths and proposed fixes are preserved in [the audit JSON](dependency-audit-2026-11-16.json).

| Remaining packages | Disposition and next action |
| --- | --- |
| `postcss`, `next` | The remaining PostCSS copy is nested under Next.js. npm proposes Next.js 16.4.6, a major upgrade. Evaluate migration and rerun app/PWA/browser checks; do not force a framework upgrade as a routine patch. |
| `zod`, `@serwist/build`, `@serwist/next`, `@serwist/webpack-plugin` | Serwist's dependency chain still includes affected Zod. npm proposes downgrading Serwist to 8.4.4. Investigate an upstream compatible fix or a tested migration; a forced downgrade is not accepted. |
| `glob`, `minimatch` | Serwist's build tooling still uses affected traversal/matching packages. Resolve with a compatible upstream dependency change or a separately tested toolchain upgrade. |
| `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`, `eslint-config-next` | Affected matcher dependencies remain in lint tooling after compatible audit fixes. Coordinate the parser/plugin/config upgrade and verify the full lint suite. |

These are open findings, not accepted risk or proof of exploitability in this application. The lint/build toolchain processes repository-controlled inputs, but that does not justify dismissing the findings. Audit remediation remains an open release gate.

Local checks passed: all 19 security tests, full lint with zero warnings, production build, application TypeScript, and the dedicated service-worker TypeScript check. The production build ran before the last brace-expansion patch; full lint was rerun afterward. No hosted API, browser, migration or deployment claim is made.
