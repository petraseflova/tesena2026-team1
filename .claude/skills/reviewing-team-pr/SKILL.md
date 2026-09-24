---
name: reviewing-team-pr
description: Use when asked to review a teammate's pull request in this repo ("review #N", "udělej review PR #N"), or to post review findings to GitHub as a comment, an approval or an LGTM.
---

# Reviewing a teammate's PR

## Overview

Both team members open PRs against the shared repo, and the other one reviews them. The review checks the diff against the project rules, not only for bugs. The user decides what gets posted. Claude never merges.

## 1. Resolve the number

The user often gives the **issue** number, not the PR number. Branches are named `feat/<issue>-...`, so resolve it before reviewing:

```bash
gh pr view <N> --json number,title,headRefName 2>/dev/null \
  || gh pr list --state all --limit 100 --json number,title,headRefName \
       --jq '.[] | select(.headRefName | test("^(feat|fix)/<N>-"))'
```

If the number was an issue, say which PR you reviewed instead ("#12 is the issue, the PR is #24").

## 2. Review

Run the `code-review` skill on the PR number. Then check these project rules yourself, because they cause most of the findings:

| Check                                                                                                                               | Source                           |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Every successful response, **including list results**, has `toMatchSchema(Schema.<resource>)`. An empty list is the only exception. | CLAUDE.md                        |
| The test asserts the behavior the TC describes, not only the schema. A step name must match what the step checks.                   | `Test Cases for automation.md`   |
| Name `TC-00X <name>`, tags `['@TC-00X', '@<suite>']`, every step inside `test.step`, and the file placed as planned                 | `docs/test-architecture-plan.md` |
| Data is created through `testData.create*`. Anything created through `send()` is tracked with `testData.track`.                     | CLAUDE.md                        |
| Fields asserted that are missing from `src/schemas/openapi.json` are listed as assumptions in the PR body                           | CLAUDE.md                        |

Also check the PR state:

```bash
gh pr view <PR> --json author,mergeable,statusCheckRollup,reviews
git fetch -q origin pull/<PR>/head:pr<PR> && git merge-tree --write-tree origin/main pr<PR> >/dev/null && echo NO_CONFLICT
git branch -D pr<PR>
```

## 3. Report, then ask

Report in the language the user chats in: the findings with `file:line`, then what you checked and found OK, then CI and merge state. End with one question. Offer the options that fit:

- no findings: approve, or approve with "LGTM"
- non-blocking nits only: approve with the nits as a note
- findings: a COMMENT review with inline comments, or fix them in the branch

Post nothing until the user picks.

## 4. Post (in English)

- Approve: `gh pr review <PR> --approve --body "..."`
- A general comment without a verdict: `gh pr comment <PR> --body "..."`
- Inline comments: write the JSON to the scratchpad, then post it with `gh api repos/petraseflova/tesena2026-team1/pulls/<PR>/reviews --input <file> --jq .html_url`.

````json
{
  "commit_id": "<headRefOid>",
  "event": "COMMENT",
  "body": "One-line summary.",
  "comments": [
    {
      "path": "tests/x.spec.ts",
      "start_line": 26,
      "line": 27,
      "side": "RIGHT",
      "body": "Why it matters.\n\n```suggestion\n<full replacement for lines 26-27>\n```"
    }
  ]
}
````

**Suggestion blocks replace exactly the lines from `start_line` to `line`.** Before posting one, apply it to the file mentally or locally and check that the result parses: no duplicated lines and no lost braces. A suggestion that fixes only part of a problem breaks the file when the author accepts it.

Reply with the URL of the posted review.

## 5. After the author merges

When the user says it is merged, confirm it (`gh pr view <PR> --json state,mergedAt`), then `git checkout main && git pull --ff-only`. Offer the next step, for example the user's next open issue from `gh issue list --assignee @me`.

## Common mistakes

| Mistake                                                   | Fix                                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| Reviewing issue #N as if it were a PR                     | Resolve it first (step 1)                                                  |
| Posting or approving without asking                       | Always ask first. "Jako komentář" means a COMMENT review, not an approval. |
| A suggestion that covers one line of a multi-line problem | Use `start_line`, and replace the whole broken range                       |
| Writing the GitHub comment in the chat language           | GitHub text is always in English                                           |
| Merging the PR                                            | Never merge. The author merges.                                            |
