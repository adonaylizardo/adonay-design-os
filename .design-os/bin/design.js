#!/usr/bin/env node

/**
 * Adonay Design OS CLI entry point.
 */

import { run } from '../core/cli/index.mjs';

run(process.argv.slice(2));
