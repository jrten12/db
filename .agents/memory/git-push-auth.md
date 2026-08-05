---
name: Git push auth
description: How to push to GitHub from this repl
---
Pushing with plain `git push` in the shell fails with "Authentication failed" — the repl's GitHub credentials are only available through the git-remote skill's `gitPush` callback in CodeExecution.
**Why:** shell has no GitHub token; the platform injects credentials only for the skill callback.
**How to apply:** after committing, always push via `gitPush({})`, never `git push` in ShellExec.
