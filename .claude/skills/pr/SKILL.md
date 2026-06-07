---
name: pr
description: >-
  Open a GitHub pull request for the current work, and append the prompts used to
  make these changes to docs/prompt-log.md as part of the same PR. Use when the user
  types /pr or asks to "open a PR", "create a pull request", or "ship this".
---

# /pr — open a pull request (and log the prompts behind it)

Goal: turn the current working changes into a pushed branch + GitHub PR, and capture
the prompts that produced those changes into `docs/prompt-log.md` so the project's
build history stays current.

## Workflow

Run these steps in order. Stop and ask the user only if a step is genuinely ambiguous
(e.g. uncommitted unrelated changes, or no GitHub remote).

1. **Inspect state.** Run `git status`, `git branch --show-current`, and
   `git diff --stat` (plus `git diff main...HEAD --stat` if already on a branch) to
   understand what will go into the PR.

2. **Ensure a feature branch.** If on `main` (the default), create a descriptive
   branch first: `git checkout -b <type>/<short-slug>` (e.g. `feat/`, `fix/`, `docs/`).
   If already on a feature branch, stay on it.

3. **Append the prompt log.** From the repo root, run:

   ```bash
   python3 .claude/skills/pr/append-prompts.py
   ```

   This extracts user prompts from this project's Claude Code session transcripts,
   skips any already recorded, and appends the new ones to `docs/prompt-log.md` under
   a heading for the current branch + today's date. It is idempotent — safe to run
   every time. Use `--dry-run` first if you want to preview what it would add.

4. **Stage and commit.** Stage the user's intended changes together with the updated
   `docs/prompt-log.md`. Write a concise, accurate commit message describing the work.
   End the commit message with:

   ```
   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

5. **Push.** `git push -u origin <branch>`.

6. **Open the PR.** Use the `gh` CLI:

   ```bash
   gh pr create --title "<title>" --body "<body>"
   ```

   Derive the title and body from the actual diff — summarize what changed and why.
   End the PR body with:

   ```
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

7. **Report.** Give the user the PR URL and a one-line summary of what shipped,
   including how many new prompts were logged.

## Notes

- The prompt-log update is part of the PR, not a separate commit on `main`.
- Never push straight to `main`; this repo uses a PR-based flow.
- If `gh` is not authenticated, tell the user to run `! gh auth login` and pause.
- The helper script derives the transcript location from the current working
  directory, so always run it from the repository root.
