# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application called "abiogenesis-fun" that simulates a simplified artificial life system. The simulation explores how self-replicating programs can emerge spontaneously from simple interactions, based on the research paper "Computational Life: How Well-formed, Self-replicating Programs Emerge from Simple Interaction".

Core features:
- A self-modifying Turing machine implementation
- Random "fragments" of code that can interact with each other
- **Compression ratio tracking** to measure emergent complexity
- **Operations Per Interaction (OPI) tracking** to measure computational activity
- Real-time visualization and charting of simulation metrics
- Tabbed UI with simulation description, interactive charts, and program visualization

## Development Commands

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run a specific test file
bun test src/lib/interact.test.ts
bun test src/lib/utils/format-number.test.ts

# Lint the codebase
bun lint
```

## Architecture

### Core Simulation Logic

- **Random Fragment Generation**: `src/lib/random-fragment.ts` - Creates random byte arrays that serve as program fragments
- **Interaction System**: `src/lib/interact.ts` - Implements a Turing machine that processes and modifies program fragments
- **Compression Analysis**: `src/lib/compress.ts` - Measures the compressibility of fragments to track emergent complexity
- **Worker-based Simulation**: `public/simulation-worker.js` - Runs simulation in a web worker to avoid blocking the UI

### UI Components

- **Main Application**: `src/app/page.tsx` - Main application page with simulation controls, metrics sidebar, and tabbed interface
- **Charts**: `src/components/compression-chart.tsx` and `src/components/opi-chart.tsx` - Real-time charting using ECharts
- **Program Visualization**: `src/components/program.tsx` and `src/components/virtual-fragment-list.tsx` - Visualizes program fragments as icons with virtualization for performance
- **Simulation Description**: `src/components/simulation-description.tsx` - Educational content explaining the simulation
- **UI Library**: `src/components/ui/` - Contains reusable UI components built with Tailwind CSS and shadcn/ui patterns

### Utilities

- **Number Formatting**: `src/lib/utils/format-number.ts` - Formats large numbers with k/M/B/T suffixes for clean display
- **Class Names**: `src/lib/utils/cn.ts` - Utility for merging Tailwind classes
- **Array Operations**: `src/lib/utils/concat-uint8-arrays.ts` - Utility for concatenating Uint8Arrays

### Testing

- Jest is configured with jsdom for testing
- Test files are co-located with implementation files
- Comprehensive test coverage including:
  - Core simulation logic (`src/lib/interact.test.ts`)
  - Utility functions (`src/lib/utils/format-number.test.ts`)

## Implementation Details

The simulation works by:

1. **Initialization**: Generating 1024 random, 64-byte program fragments
2. **Interaction Loop**: Two programs are randomly selected to interact by:
   - Concatenating them into a 128-byte program
   - Executing the combined program on a Turing machine
   - Self-modification occurs since instruction and data tapes are unified
   - Splitting the result back into two 64-byte fragments
3. **Metrics Tracking**: 
   - **Compression Ratio**: Measured every 512 interactions to detect pattern emergence
   - **Operations Per Interaction**: Tracks computational activity as programs evolve
4. **Real-time Visualization**: UI updates with current statistics, charts, and program visualization

### Turing Machine Operations

The system uses 10 operations with visual symbols:
1. **Buffer Right/Left**: Move buffer pointer
2. **Buffer Increment/Decrement**: Modify buffer values  
3. **Program Right/Left**: Move program pointer
4. **Program Read/Write**: Copy between buffer and program (enables self-modification)
5. **Loop Start/End**: Conditional branching based on buffer values

### UI Features

- **Sidebar Controls**: Play/pause simulation, single-step interactions, status indicator
- **Real-time Metrics**: Interactions count (with k/M/B formatting), compression ratio, OPI
- **Tabbed Interface**:
  - **About**: Educational content explaining the simulation
  - **Metrics**: Real-time charts showing compression ratio and OPI over time
  - **Programs**: Visualization of all 1024 program fragments with operation reference
- **Debug Mode**: Optional debug logging and performance monitoring
