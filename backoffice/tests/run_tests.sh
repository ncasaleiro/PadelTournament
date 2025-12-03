#!/bin/bash

# Robot Framework Test Runner Script
# This script runs all test suites for the Padel Tournament Backoffice

echo "🧪 Starting Robot Framework Tests..."
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ Error: Server is not running on http://localhost:3000"
    echo "   Please start the server with: npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Run all test suites
robot --outputdir results \
      --log log.html \
      --report report.html \
      --loglevel INFO \
      --variable BASE_URL:http://localhost:3000 \
      --variable API_BASE:http://localhost:3000/api \
      api/

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo "📊 Results available in: results/"
    echo "📄 Log: results/log.html"
    echo "📄 Report: results/report.html"
else
    echo ""
    echo "❌ Some tests failed. Check results/log.html for details."
    exit 1
fi
