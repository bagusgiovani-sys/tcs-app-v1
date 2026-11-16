# Dependency cleanup, 2026-11-16

**Latest follow-up:** same-major overrides now remove the PostCSS and Zod findings. The fresh [follow-up audit](dependency-audit-2026-11-16-patches.json) reports **11 moderate findings, zero high or critical**. The original cleanup record below remains as historical evidence; its PostCSS/Zod dispositions are superseded by this follow-up.

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

## Same-major security patch follow-up

Base revision: `e75f37c`. The application keeps Next.js 15.5.29 and Serwist 9.5.13. Explicit npm overrides pin PostCSS to 8.5.33 for all consumers and Zod to 4.6.7 for the three Serwist packages that depend on it. These replace vulnerable pins within the same dependency major; they still bypass upstream exact pins, so production-build verification is required. Remove overrides when upstream dependency pins include the security fixes.

The [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) identifies 4.6.6 as the first fixed release. The installed tree and lockfile now resolve Zod 4.6.7 for all three consumers. Next.js now resolves the patched root PostCSS 8.5.33; its nested 8.4.31 lock entry has been removed. `npm.cmd ls postcss zod` exits successfully with no invalid dependencies. Installation used `--ignore-scripts` throughout.

The fresh audit is the recorded result (11 moderate); npm's install summary reported 10. All remaining findings arise from Glob/Minimatch and affected parent tooling. The [Glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) identifies 14.0.2 as fixed, and the [Minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) identifies 11.0.1. The installed consumers require Glob 13 and Minimatch 10, so resolving these findings requires separate cross-major compatibility work. No cross-major overrides, framework upgrade or Serwist downgrade were applied.

Validation after both patches: all 19 security tests, production build (including zero-warning lint, app types and service-worker bundling), application TypeScript, dedicated service-worker TypeScript, and `git diff --check`. Hosted browser/API acceptance is pending; no migration or deployment was performed.
