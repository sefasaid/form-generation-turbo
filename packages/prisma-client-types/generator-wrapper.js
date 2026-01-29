#!/usr/bin/env node

// Wrapper script to run generator from root
const path = require('path');
const Module = require('module');

// Get the root directory (two levels up from this file)
const rootDir = path.resolve(__dirname, '../..');
const rootNodeModules = path.join(rootDir, 'node_modules');

// Add root node_modules to module resolution path
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      // Try resolving from root node_modules
      try {
        const resolved = path.join(rootNodeModules, request);
        return originalResolveFilename.call(this, resolved, parent, isMain, options);
      } catch (e) {
        // If still not found, try with @prisma scope
        if (request.startsWith('@prisma/')) {
          try {
            const resolved = path.join(rootNodeModules, request);
            return originalResolveFilename.call(this, resolved, parent, isMain, options);
          } catch (e2) {
            throw err;
          }
        }
        throw err;
      }
    }
    throw err;
  }
};

// Now require and run the generator
require('./generator.js');