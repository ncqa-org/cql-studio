#!/usr/bin/env node
// Cross-platform replacement for `envsubst`, which isn't available on Windows.
const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '..', 'public', 'configuration.template.js');
const destPath = path.resolve(__dirname, '..', 'public', 'configuration.js');

const template = fs.readFileSync(srcPath, 'utf8');
const output = template.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (match, name) => process.env[name] ?? '');

fs.writeFileSync(destPath, output);
