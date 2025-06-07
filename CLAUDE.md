# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application called "abiogenesis-fun" that simulates a simplified artificial life system. The simulation explores how self-replicating programs can emerge spontaneously from simple interactions, based on the research paper "Computational Life: How Well-formed, Self-replicating Programs Emerge from Simple Interaction".

Core features:
- A self-modifying Turing machine implementation with configurable bits per position (4-8 bits)
- Random "fragments" of code that can interact with each other
- **Compression ratio tracking** to measure emergent complexity
- **Operations Per Interaction (OPI) tracking** with weighted averaging to measure computational activity
- Real-time visualization and charting of simulation metrics
- Tabbed UI with simulation description, interactive charts, program visualization, and fragment creator

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

# Type check
bun run typecheck
```

## Architecture

### Core Simulation Logic

- **Random Fragment Generation**: `src/lib/random-fragment.ts` - Creates random byte arrays with configurable bits per position
- **Interaction System**: 
  - `src/lib/interact.ts` - TypeScript implementation for UI and testing
  - `public/shared-interact.js` - Shared implementation used by all workers (single source of truth)
- **Compression Analysis**: `src/lib/compress.ts` - Measures the compressibility of fragments to track emergent complexity
- **Example Fragments**: `src/lib/example-fragments.ts` - Pre-built examples including Simple Replicator, Data Mover, and Pattern Generator
- **Worker-based Simulation**: 
  - `public/simulation-worker.js` - Main simulation worker with parallel batch processing
  - `public/interaction-worker.js` - Parallel worker for processing fragment interactions
  - Both workers import the shared `interact()` function from `shared-interact.js`

### State Management

- **Custom Hook**: `src/hooks/use-simulation.ts` - Centralized simulation state management hook that:
  - Manages all simulation state (metrics, configuration, UI state)
  - Handles worker initialization and lifecycle
  - Processes worker messages and updates
  - Calculates weighted OPI with exponential decay
  - Provides clean `state` and `actions` interface to components

### UI Components

- **Main Application**: `src/app/page.tsx` - Simplified main page that uses the `useSimulation` hook for all state
- **Charts**: 
  - `src/components/compression-chart.tsx` - Smooth line chart for compression ratio
  - `src/components/opi-chart.tsx` - Weighted average OPI visualization
- **Program Visualization**: 
  - `src/components/program.tsx` - Individual program fragment display using centralized operation config
  - `src/components/virtual-fragment-list.tsx` - Virtualized list for large fragment counts
  - `src/components/operation-legend.tsx` - Visual legend using centralized operation config
- **Fragment Creator**: `src/components/fragment-creator.tsx` - Interactive editor for creating and testing fragments
- **Simulation Description**: `src/components/simulation-description.tsx` - Educational content explaining the simulation
- **UI Library**: `src/components/ui/` - Reusable components (Button, Stack, Tabs, Switch, etc.)

### Shared Resources

- **Operation Configuration**: `src/lib/operation-config.ts` - Centralized configuration for all operations including:
  - Operation values, icons, colors, labels
  - Category grouping (buffer, program, control)
  - Used by all components that display operations
- **Constants**: `src/lib/constants.ts` - All magic numbers and configuration values centralized:
  - Fragment/buffer sizes, bit configurations
  - Update intervals, limits, and thresholds
  - UI measurements and storage keys
  - Helper functions for validation

### Utilities

- **Number Formatting**: `src/lib/utils/format-number.ts` - Formats large numbers with k/M/B/T suffixes for clean display
- **Class Names**: `src/lib/utils/cn.ts` - Utility for merging Tailwind classes
- **Fragment Validation**: `src/lib/utils/validate-fragment-count.ts` - Validates user input for fragment count

### Testing

- Jest is configured with jsdom for testing
- Test files are co-located with implementation files
- Comprehensive test coverage including:
  - Core simulation logic (`src/lib/interact.test.ts`)
  - Compression verification (`src/lib/verify-compression.test.ts`)
  - Replicator behavior (`src/lib/replicator-simulation.test.ts`)
  - Example fragments (`src/lib/example-fragments.test.ts`)
  - Utility functions (`src/lib/utils/format-number.test.ts`, `src/lib/utils/validate-fragment-count.test.ts`)

## Implementation Details

The simulation works by:

1. **Initialization**: Generating configurable number of random 64-byte program fragments (default: 64, range: 2-1,048,576)
2. **Epoch-based Processing**: Programs interact in shuffled pairs each epoch
   - Parallel batch processing using configurable worker pool (1-16 workers)
   - Each fragment interacts twice per epoch on average
3. **Interaction Mechanism**: Two programs are selected to interact by:
   - Concatenating them into a 128-byte program
   - Executing the combined program on a Turing machine
   - Self-modification occurs since instruction and data tapes are unified
   - Splitting the result back into two 64-byte fragments
4. **Configurable Parameters**:
   - **Bits per position**: 4-8 bits (controls value space: 16-256 values)
   - **Mutation rate**: 0-0.192% per byte per epoch
   - **Population size**: Powers of 2 from 64 to 1M+
5. **Metrics Tracking**: 
   - **Compression Ratio**: Sampled every epoch to detect pattern emergence
   - **Per-Epoch OPI**: Tracks operations executed per interaction each epoch
   - **Weighted Average OPI**: Smoothed with exponential decay over 128 epochs
6. **Real-time Visualization**: UI updates with current statistics, charts, and program visualization

### Turing Machine Operations

The system uses 10 operations with visual symbols:
1. **Buffer Right/Left**: Move buffer pointer
2. **Buffer Increment/Decrement**: Modify buffer values  
3. **Program Right/Left**: Move program pointer
4. **Program Read/Write**: Copy between buffer and program (enables self-modification)
5. **Loop Start/End**: Conditional branching based on buffer values

### UI Features

- **Sidebar Controls**: 
  - Play/pause and reset controls with status indicator
  - Configurable parameters: mutation rate, population size, worker pool size, bits per position
  - Real-time metrics: epoch, interactions, speed, OPI, compression ratio
- **Tabbed Interface**:
  - **About**: Educational content explaining the simulation and research background
  - **Metrics**: Real-time charts showing compression ratio and smoothed OPI over time
  - **Programs**: Virtualized grid visualization of all program fragments with operation legend
  - **Cheat**: Fragment creator for designing, testing, and injecting custom programs
- **Debug Mode**: Optional debug logging with performance monitoring and error tracking

## Code Quality Best Practices

When making changes to this codebase, follow these principles to maintain code quality:

1. **Avoid Code Duplication**:
   - Core algorithms (like `interact()`) should have a single implementation shared across all consumers
   - Configuration data (operations, colors, labels) should be centralized in dedicated modules
   - Constants and magic numbers must be defined in `src/lib/constants.ts`
   - If you find yourself copying code, extract it into a shared function or module

2. **State Management**:
   - Keep React components focused on presentation; extract complex state logic into custom hooks
   - Worker-related logic should be encapsulated and not scattered across components
   - Use TypeScript interfaces to define clear contracts for state and actions
   - Avoid prop drilling - use hooks to provide state where needed

3. **Module Organization**:
   - Each module should have a single, clear responsibility
   - Shared logic between workers goes in `public/shared-*.js` files
   - TypeScript implementations for UI/testing go in `src/lib/`
   - Keep worker files focused on orchestration, not algorithm implementation

4. **Testing and Type Safety**:
   - Write tests for all core algorithms and utilities
   - Use TypeScript's type system to catch errors at compile time
   - Validate user inputs with proper type guards (see `validate-fragment-count.ts`)
   - Keep test files co-located with implementation files

5. **Performance Considerations**:
   - Use virtualization for large lists (see `VirtualFragmentList`)
   - Implement delta updates for frequently changing data
   - Cache expensive computations (like compression calculations)
   - Use Web Workers to keep the UI thread responsive

6. **Naming and Documentation**:
   - Use descriptive names that explain intent (e.g., `useSimulation` not `useData`)
   - Document complex algorithms and non-obvious design decisions
   - Keep this CLAUDE.md file updated when architecture changes

## Memories

- use bun