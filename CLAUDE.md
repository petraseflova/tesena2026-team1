# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Playwright + TypeScript API tests (no browser) for the Todoist REST API v1, run against one shared free Todoist account.

## Sources of truth

- `brief.md`: the project rules (scope, security, test design, git workflow, definition of done). Read it before starting an issue.
- `Test Cases for automation.md`: test cases TC-001 to TC-015, grouped by wave. TC-010 and everything about sections are out of scope.
- `docs/test-architecture-plan.md`: design decisions, and the planned spec file and tag for each TC.
- `README.md`: setup, npm scripts, and a template for a new test.
- `src/schemas/openapi.json`: the pinned spec, which defines expected API behavior. There are no other requirements.

## Commands

- Run one test by its TC tag: `npx playwright test --grep @TC-004`. Run one file: `npx playwright test tests/labels/labels.spec.ts`.
- Before a PR: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`.
- Tests need `TODOIST_API_TOKEN` in `.env`.

## Architecture

- Spec files import `test`, `expect` and `Schema` only from `src/fixtures`. That fixture chain (api, data, user) exposes `api`, `testData`, `accountTimezone`, `unauthenticatedApi` and `apiWithToken`.
- Clients (`src/clients/`) extend `BaseClient`. Typed methods throw `ApiError` on any non-2xx response. `send()` returns the raw `APIResponse`, and negative and status-code tests use it. List endpoints are paginated, so use `listAll`.
- Test data: create it through `testData.create*`. The builders add the `autotest-<run id>-` prefix, and teardown deletes the data in reverse order, ignoring 404. Anything created through `send` needs `testData.track(kind, id)`. The run id is fixed in the main process (`playwright.config.ts`), so every worker shares one prefix.
- `src/global-setup.ts` deletes `autotest-` data older than 1 hour, which keeps the account under the free plan project limit.
- Validate every successful response with `expect(body).toMatchSchema(Schema.<resource>)`. The `Schema` map in `src/schemas/validator.ts` maps each resource to a spec component name, for example task → `ItemSyncView`.
- Date assertions use `accountTimezone` with `src/utils/dates.ts`, never the runner's clock.
- `src/reporters/redact-reporter.ts` must stay the first reporter, because it redacts the token before the HTML report is built. ESLint forbids `console`.

## Test conventions

- Name the test `TC-00X <name from the test case file>` and tag it `['@TC-00X', '@<suite>']`. The wave decides the suite tag: `@smoke`, `@regression`, `@e2e` or `@negative`.
- Put every step in `test.step('...')`.
- Test one behavior per test. A TC with several inputs becomes several tests with suffixes (TC-014a, TC-014b).
- If a feature is not on the free plan, mark the test `test.fixme(true, '<reason>')`.
- If the expected result is unclear, call the real API first, assert what it actually returns, and list that as an assumption in the PR description.

## Git workflow

- Each change needs an issue, then a branch, then a PR. Name branches `feat/<issue id>-<short-description>` (or `fix/...`).
- Commit subjects must start with `#<issue id> ` (enforced by `commit-msg`). `pre-push` blocks pushes to `main`.
- Fill in `.github/pull_request_template.md`, including `Closes #<issue>`.
- Claude never merges PRs. It reviews its own PR, fixes the findings, and replies with the PR URL and a short summary. Start the next issue from an updated `main`.
- PR and smoke CI runs share the account through the `todoist-account` concurrency group. CI uses 2 workers and 1 retry, and a test that passes only on retry is reported as flaky.
