# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application called "abiogenesis-fun" that simulates a simplified artificial life system. The core of the project involves:

- A self-modifying Turing machine implementation
- Random "fragments" of code that can interact with each other
- Compression ratio tracking to measure emergent complexity
- A UI to visualize the system and its statistics

## Development Commands

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run a specific test file
bun test src/lib/interact.test.ts

# Lint the codebase
bun lint
```

## Architecture

### Core Simulation Logic

- **Random Fragment Generation**: `src/lib/random-fragment.ts` - Creates random byte arrays that serve as program fragments
- **Interaction System**: `src/lib/interact.ts` - Implements a Turing machine that processes and modifies program fragments
- **Compression Analysis**: `src/lib/compress.ts` - Measures the compressibility of fragments to track emergent complexity

### UI Components

- **Page Component**: `src/app/page.tsx` - Main application page with simulation controls
- **Program Visualization**: `src/components/program.tsx` - Visualizes program fragments as icons
- **UI Library**: `src/components/ui/` - Contains reusable UI components built with Tailwind CSS

### Testing

- Jest is configured with jsdom for testing
- Test files are co-located with implementation files (e.g., `interact.ts` and `interact.test.ts`)

## Implementation Details

The simulation works by:

1. Generating 1024 random program fragments (byte arrays)
2. Allowing these fragments to interact using a Turing machine implementation
3. The Turing machine can read/write to both a buffer and the program itself (self-modification)
4. Tracking the compression ratio over time to measure if complexity emerges
5. Providing a UI to visualize fragments and statistics

The Turing machine uses 10 operations (move left/right, increment/decrement, read/write to program, loop start/end) to process program fragments when they interact.
