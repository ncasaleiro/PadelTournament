#!/bin/bash
# Script to run all Robot Framework unit tests

set -e

cd "$(dirname "$0")"
BASE_DIR="$(pwd)/../.."

echo "=========================================="
echo "Running Robot Framework Unit Tests"
echo "=========================================="

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "ERROR: Server is not running on http://localhost:3000"
    echo "Please start the server with: cd $BASE_DIR && npm start"
    exit 1
fi

# Run all test files
echo ""
echo "Running test_categories_api.robot..."
robot --outputdir results --log log.html --report report.html test_categories_api.robot

echo ""
echo "Running test_teams_api.robot..."
robot --outputdir results --log log.html --report report.html test_teams_api.robot

echo ""
echo "Running test_players_api.robot..."
robot --outputdir results --log log.html --report report.html test_players_api.robot

echo ""
echo "Running test_users_api.robot..."
robot --outputdir results --log log.html --report report.html test_users_api.robot

echo ""
echo "Running test_auth_api.robot..."
robot --outputdir results --log log.html --report report.html test_auth_api.robot

echo ""
echo "Running test_match_api.robot..."
robot --outputdir results --log log.html --report report.html test_match_api.robot

echo ""
echo "Running test_score_engine.robot..."
robot --outputdir results --log log.html --report report.html test_score_engine.robot

echo ""
echo "Running test_match_persistence.robot..."
robot --outputdir results --log log.html --report report.html test_match_persistence.robot

echo ""
echo "=========================================="
echo "All tests completed!"
echo "Results are in: results/"
echo "=========================================="


