# Prompts

Prompt files consumed by the assistant.

## Layout

- `system/current.md` — active system prompt. Loaded on every run.
- `system/v<N>.md` — historical snapshots of the system prompt.
- `user/current.md` — default user request when none is passed on the CLI.
- `user/v<N>.md` — historical snapshots of user prompts.

The assistant reads only the two `current.md` files. Historical files exist to compare model behavior across prompt revisions.

## Revising a prompt

1. Pick the next version number `N` (highest existing `v<N>.md` plus one).
2. Copy `current.md` to `v<N>.md` to freeze the previous version.
3. Edit `current.md` with the new prompt.
4. Commit both files in the same commit so `v<N>.md` matches what `current.md` was before the edit.

## Overriding the user prompt

- `--prompt "..."` — inline prompt on the CLI.
- `--prompt-file path/to/file.md` — read the user prompt from an alternate file (for example, an older `v<N>.md`).

The system prompt is fixed to `prompts/system/current.md` and has no CLI override.
