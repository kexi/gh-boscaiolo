# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Removed unused dependencies (ink-box, ink-multi-select, ink-select-input, ink-text-input, ink-table)

## [0.1.0] - 2026-01-04

### Added
- Initial release
- `deleted` command - Clean up worktrees with deleted branches
- `stale` command - Clean up worktrees not accessed for N days
- `merged` command - Clean up worktrees with branches merged to base
- `interactive` command - Interactively select worktrees to remove
- `list` command - Display all worktrees with statistics
- `--dry-run` option - Preview changes without removing
- `--verbose` option - Show detailed information
- `--yes` option - Skip confirmation prompts
- Safety features: uncommitted changes detection, locked worktree skip
- Cross-platform support (macOS, Linux, Windows)
- Rich terminal UI with React Ink
- Supply chain attack protection (package age check)

[Unreleased]: https://github.com/kexi/gh-boscaiolo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kexi/gh-boscaiolo/releases/tag/v0.1.0
