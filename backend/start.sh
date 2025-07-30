#!/bin/bash
echo "Starting Lokal Backend Server..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"
echo "Files in src directory: $(ls -la src/)"
echo "Starting server..."
node src/server.js 