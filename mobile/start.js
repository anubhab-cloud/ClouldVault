#!/usr/bin/env node
// Automatically suppress telemetry to prevent Windows EPERM permission errors on ~/.expo
process.env.EXPO_NO_TELEMETRY = '1';
require('expo/bin/cli');
