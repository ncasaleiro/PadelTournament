#!/bin/bash

# Frontend Tests Runner
# Runs Robot Framework tests for frontend

echo "🧪 Running Frontend Unit Tests"
echo "================================"

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "⚠️  Server is not running. Starting server..."
    cd ../..
    npm start &
    SERVER_PID=$!
    sleep 5
    echo "✅ Server started (PID: $SERVER_PID)"
fi

# Run simple frontend tests (no browser required)
echo ""
echo "📄 Running file structure and code tests..."
robot test_frontend_simple.robot

# Check if Selenium/Chrome is available for browser tests
if command -v chromedriver &> /dev/null || command -v google-chrome &> /dev/null; then
    echo ""
    echo "🌐 Running browser-based tests..."
    robot test_frontend.robot
else
    echo ""
    echo "⚠️  ChromeDriver not found. Skipping browser tests."
    echo "   Install ChromeDriver to run full frontend tests:"
    echo "   sudo apt-get install chromium-chromedriver"
fi

echo ""
echo "✅ Frontend tests completed!"
echo "📊 Check results in: results/"






