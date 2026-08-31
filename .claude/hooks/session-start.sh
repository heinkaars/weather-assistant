#!/bin/bash
set -euo pipefail

# Attribute commits made in Claude Code sessions (including scheduled
# automation) to the repo owner's GitHub account, so they show up in
# their contribution graph instead of as "Claude <noreply@anthropic.com>".
git config user.name "Hein Kaars Sijpesteijn"
git config user.email "219910040+heinkaars@users.noreply.github.com"
