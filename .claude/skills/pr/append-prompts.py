#!/usr/bin/env python3
"""Append new user prompts from this project's Claude Code sessions to docs/prompt-log.md.

Idempotent: prompts already present in the log are skipped, so it is safe to run on
every /pr. New prompts are appended under a heading for the current branch + date,
continuing the log's global numbering.

Usage: append-prompts.py [--dry-run]
Run from the repository root.
"""
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

LOG = Path("docs/prompt-log.md")


def transcript_dir() -> Path:
    """Claude Code stores per-project transcripts under ~/.claude/projects/<munged-cwd>."""
    munged = str(Path.cwd().resolve()).replace("/", "-")
    return Path.home() / ".claude" / "projects" / munged


def iter_prompts(d: Path):
    """Yield (mtime, text) user prompts from all session transcripts, oldest file first."""
    files = sorted(d.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)
    for f in files:
        for line in f.read_text(errors="ignore").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if obj.get("type") != "user":
                continue
            content = obj.get("message", {}).get("content")
            texts = []
            if isinstance(content, str):
                texts.append(content)
            elif isinstance(content, list):
                for c in content:
                    if isinstance(c, dict) and c.get("type") == "text":
                        texts.append(c.get("text", ""))
            for t in texts:
                t = t.strip()
                if not t:
                    continue
                # Skip tool results, system reminders, hook noise, and slash-command stdout.
                if t.startswith("<") or t.startswith("[Request"):
                    continue
                if "local-command" in t or "command-name" in t:
                    continue
                yield t


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def main() -> int:
    dry = "--dry-run" in sys.argv
    if not LOG.exists():
        print(f"error: {LOG} not found — run from the repo root", file=sys.stderr)
        return 1

    d = transcript_dir()
    if not d.exists():
        print(f"error: no transcripts at {d}", file=sys.stderr)
        return 1

    log_text = LOG.read_text()
    log_norm = normalize(log_text)

    # Continue global numbering from the highest "N." item already in the log.
    nums = [int(m) for m in re.findall(r"(?m)^\s*(\d+)\.\s", log_text)]
    next_n = (max(nums) + 1) if nums else 1

    new = []
    seen = set()
    for t in iter_prompts(d):
        key = normalize(t)[:60]
        if not key or key in seen:
            continue
        # Skip if a recognizable chunk of this prompt is already logged.
        if key in log_norm:
            continue
        seen.add(key)
        new.append(t)

    if not new:
        print("No new prompts to append.")
        return 0

    branch = subprocess.run(
        ["git", "branch", "--show-current"], capture_output=True, text=True
    ).stdout.strip() or "(detached)"

    lines = [f"\n## {date.today().isoformat()} — `{branch}`\n"]
    for i, t in enumerate(new, start=next_n):
        body = t.replace("\n", "\n   > ")
        lines.append(f"{i}. > {body}\n")
    block = "\n".join(lines)

    if dry:
        print(block)
        return 0

    with LOG.open("a") as fh:
        fh.write(block)
    print(f"Appended {len(new)} new prompt(s) to {LOG}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
