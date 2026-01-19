#!/bin/bash
# Script to run all Robot Framework unit tests
# Updated: 2025-12-06 10:54:50 - v0.03-dev

# Don't exit on error - continue running all tests
set +e

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

# Initialize counters
PASSED=0
FAILED=0

# Run all test files
echo ""
echo "Running test_auth_api.robot..."
robot --outputdir results --log log.html --report report.html test_auth_api.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_auth_api.robot failed"
fi

echo ""
echo "Running test_categories_api.robot..."
robot --outputdir results --log log.html --report report.html test_categories_api.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_categories_api.robot failed"
fi

echo ""
echo "Running test_duplicate_names_validation.robot..."
robot --outputdir results --log log.html --report report.html test_duplicate_names_validation.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_duplicate_names_validation.robot failed"
fi

echo ""
echo "Running test_match_api.robot..."
robot --outputdir results --log log.html --report report.html test_match_api.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_match_api.robot failed"
fi

echo ""
echo "Running test_match_persistence.robot..."
robot --outputdir results --log log.html --report report.html test_match_persistence.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_match_persistence.robot failed"
fi

echo ""
echo "Running test_players_api.robot..."
robot --outputdir results --log log.html --report report.html test_players_api.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_players_api.robot failed"
fi

echo ""
echo "Running test_score_engine.robot..."
robot --outputdir results --log log.html --report report.html test_score_engine.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_score_engine.robot failed"
fi

echo ""
echo "Running test_teams_api.robot..."
robot --outputdir results --log log.html --report report.html test_teams_api.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_teams_api.robot failed"
fi

echo ""
echo "Running test_tournament_api.robot..."
robot --outputdir results --log log.html --report report.html test_tournament_api.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_tournament_api.robot failed"
fi

echo ""
echo "Running test_tournament_button_position.robot..."
robot --outputdir results --log log.html --report report.html test_tournament_button_position.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_tournament_button_position.robot failed (may require ChromeDriver)"
fi

echo ""
echo "Running test_tournament_button_structure.robot..."
robot --outputdir results --log log.html --report report.html test_tournament_button_structure.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_tournament_button_structure.robot failed"
fi

echo ""
echo "Running test_tournament_categories_selection.robot..."
robot --outputdir results --log log.html --report report.html test_tournament_categories_selection.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_tournament_categories_selection.robot failed"
fi

echo ""
echo "Running test_tournament_multi_category_generation.robot..."
robot --outputdir results --log log.html --report report.html test_tournament_multi_category_generation.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_tournament_multi_category_generation.robot failed"
fi

echo ""
echo "Running test_generate_matches_button.robot..."
robot --outputdir results --log log.html --report report.html test_generate_matches_button.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_generate_matches_button.robot failed (may require ChromeDriver)"
fi

echo ""
echo "Running test_generate_matches_button.robot..."
robot --outputdir results --log log.html --report report.html test_generate_matches_button.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_generate_matches_button.robot failed"
fi

echo ""
echo "Running test_users_api.robot..."
robot --outputdir results --log log.html --report report.html test_users_api.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_users_api.robot failed"
fi

echo ""
echo "Running test_match_minimum_points.robot..."
robot --outputdir results --log log.html --report report.html test_match_minimum_points.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_match_minimum_points.robot failed"
fi

echo ""
echo "Running test_tournament_knockout_placeholders.robot..."
robot --outputdir results --log log.html --report report.html test_tournament_knockout_placeholders.robot
if [ $? -eq 0 ]; then
    ((PASSED++))
else
    ((FAILED++))
    echo "⚠️  test_tournament_knockout_placeholders.robot failed"
fi

echo ""
echo "=========================================="
echo "All tests completed!"
echo "=========================================="
echo ""
echo "Summary:"
TOTAL=$((PASSED + FAILED))
echo "  - Total test files: ${TOTAL}"
echo "  - Passed: ${PASSED}"
echo "  - Failed: ${FAILED}"
echo ""
echo "Results are in: results/"
echo "  - Log: results/log.html"
echo "  - Report: results/report.html"
echo "  - Output: results/output.xml"
echo ""
if [ ${FAILED} -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Some tests failed. Check the logs above for details."
fi
echo "=========================================="


