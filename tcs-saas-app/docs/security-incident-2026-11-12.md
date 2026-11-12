# Injected remote build configuration

## Observed and contained

While pushing the security changes on 2026-11-12, Git rejected the push. A fetch reported a forced update from `779b94ea2563c2b849a14183b3343aac05d3f4d4` to `502357e6fc7b46799d7ef4afabf8e89c243c481a`.

Comparing these revisions showed only two changed files: root `.gitignore` and `tcs-saas-app/postcss.config.mjs`. The latter added obfuscated JavaScript that queries Ethereum RPC services, derives network destinations from transaction data, retrieves and decodes remote payloads, evaluates downloaded code, and spawns detached Node processes. This is executable build-time injection, unrelated to PostCSS configuration. The final downloaded payload was not fetched or executed during this review; its effects are unknown.

The remote commit's author fields and original-looking deployment commit message do not establish who made the change. No attribution is claimed.

The suspicious revision was never checked out or executed in this session. A merge using the `ours` strategy retained the clean reviewed tree while recording the remote history, including the evidence. Push succeeded at `f39ea5f`. The clean configuration contains only the Tailwind PostCSS plugin. The local application source scan found no matching loader markers. This is not a host forensic examination.

## Required follow-up

1. Identify machines, CI runs and hosting builds that executed revision `502357e6fc7b46799d7ef4afabf8e89c243c481a`. Preserve relevant build/access logs and timestamps. Stop any affected running deployment until it has been rebuilt from a trusted revision in a clean environment.
2. From a trusted device, rotate credentials available to any affected build or host: deployment/GitHub tokens, Supabase service-role/database credentials, and other environment secrets. Check GitHub sessions, SSH/deploy keys, integrations and recent account activity. These actions require account access; none were performed here.
3. Inspect deployment logs and local process/persistence evidence on affected systems. Absence of the loader in the current source does not prove an affected host is clean.
4. Rebuild on a clean worker, verify the deployed revision and monitor for reintroduction. Review and restrict force pushes and repository write access.

The gateway/database review remains separate unfinished work. Removing this injection does not resolve the authorization and order-integrity findings in `security-progress-review-2026-11-12.md`.
