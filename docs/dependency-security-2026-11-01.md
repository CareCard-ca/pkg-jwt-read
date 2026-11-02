# Dependency security validation: 2026-11-01

Apply $carecard-workspace-standards and $pkg-publish to package changes and
the coordinated release sequence.

The installed dependency graph is refreshed for coordinated release 3.45.0.
Existing security overrides select the published fixed versions where
applicable: body-parser 2.4.0, Glob 14.0.2, Minimatch 11.0.1 and Serialize
JavaScript 7.1.3. Express peer query-string dependencies are refreshed within
their declared ranges. Public package APIs and business policy are unchanged.

The fixes address [the body-parser crash](https://github.com/advisories/GHSA-27r3-jxmh-p828),
[query-string coercion](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw),
[Glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
[Minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) and
[function serialization](https://github.com/advisories/GHSA-m5mm-p8h7-m29v).

The complete `npm audit --json` and `npm ls --all` checks succeed. Preserve
ordinary diagnostics, full runtime and type coverage, coverage thresholds and
every native Husky gate. Refresh declared CareCard dependencies after their
publishing turns and validate again before each deferred source push.

Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.

The direct `@carecard/common-util` dependency selects 3.45.0 from the verified
coordinated registry release. Preserve the generic public contract and the
full native validation gates when consuming this dependency.

The direct `@carecard/validate` dependency selects 3.45.0 from the verified
coordinated registry release. Preserve the generic public contract and the
full native validation gates when consuming this dependency.
