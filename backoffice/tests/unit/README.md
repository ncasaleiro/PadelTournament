# Unit Tests - Robot Framework

This directory contains unit tests for the Padel Tournament Backoffice, converted from JavaScript/Jest to Robot Framework.

## Test Files

- `test_score_engine.robot` - Tests for ScoreEngine scoring logic
- `test_match_api.robot` - Tests for Match API endpoints
- `score_engine_test_helper.js` - Node.js helper script to test ScoreEngine

## Running Tests

### Prerequisites

1. Install Robot Framework and dependencies:
```bash
cd backoffice/tests
pip install -r requirements.txt
```

2. Ensure the server is running:
```bash
cd backoffice
npm start
```

### Run All Unit Tests

```bash
cd backoffice/tests/unit
robot test_score_engine.robot test_match_api.robot
```

### Run Specific Test Suite

```bash
# ScoreEngine tests only
robot test_score_engine.robot

# Match API tests only
robot test_match_api.robot
```

### Run with Tags

```bash
# Run only scoring tests
robot --include scoring test_match_api.robot

# Run only tiebreak tests
robot --include tiebreak test_match_api.robot

# Run only undo tests
robot --include undo test_match_api.robot
```

## Test Coverage

### ScoreEngine Tests
- ✅ Normal point scoring (0, 15, 30, 40)
- ✅ Game win conditions
- ✅ Deuce and advantage handling
- ✅ Set completion (6-4, 6-3, etc.)
- ✅ Tiebreak at 6-6
- ✅ Tiebreak scoring (first to 7 with 2-point margin)
- ✅ Match completion (best of 3 sets)
- ✅ Decrement/undo functionality
- ✅ Edge cases (empty JSON, match not playing)

### Match API Tests
- ✅ Create match
- ✅ Get all matches
- ✅ Filter matches by status/category
- ✅ Get match by ID
- ✅ Start match
- ✅ Increment/decrement points
- ✅ Win game after 4 points
- ✅ Start tiebreak at 6-6
- ✅ Win tiebreak and set
- ✅ Finish match
- ✅ Update match (time, court, referee notes, events)
- ✅ Delete match

## Notes

- The ScoreEngine tests use a Node.js helper script (`score_engine_test_helper.js`) since ScoreEngine is a JavaScript class
- Match API tests use the RequestsLibrary to make HTTP calls to the running server
- All tests are tagged for easy filtering and organization

