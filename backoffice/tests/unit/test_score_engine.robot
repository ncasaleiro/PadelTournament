*** Settings ***
Documentation    Unit tests for ScoreEngine - All scoring functionality including tiebreak and undo
Library          Collections
Library          String
Library          OperatingSystem
Library          Process
Library          JSON

*** Variables ***
${SCORE_ENGINE_TEST_SCRIPT}    ${CURDIR}/score_engine_test_helper.py
${NODE_PATH}                   node

*** Test Cases ***
Test Increment Point From 0 To 15
    [Documentation]    Should increment point from 0 to 15
    ${result}=    Run Score Engine Test    increment_point_basic
    Should Be Equal    ${result['pointsA']}    ${1}

Test Progress 0 To 15 To 30 To 40
    [Documentation]    Should progress 0 -> 15 -> 30 -> 40
    ${result}=    Run Score Engine Test    progress_points
    Should Be Equal    ${result['pointsA']}    ${3}

Test Win Game At 40-30
    [Documentation]    Should win game at 40-30
    ${result}=    Run Score Engine Test    win_game_40_30
    Should Be Equal    ${result['set']['gamesA']}    ${1}
    Should Be Equal    ${result['set']['gamesB']}    ${0}
    Should Be Equal    ${result['game']['pointsA']}    ${0}
    Should Be Equal    ${result['game']['pointsB']}    ${0}

Test Handle Deuce 40-40
    [Documentation]    Should handle deuce (40-40)
    ${result}=    Run Score Engine Test    handle_deuce
    Should Be Equal    ${result['game']['pointsA']}    ${3}
    Should Be Equal    ${result['game']['pointsB']}    ${3}
    ${result2}=    Run Score Engine Test    handle_deuce_advantage
    Should Be Equal    ${result2['game']['deuceState']}    A

Test Win Game After Advantage
    [Documentation]    Should win game after advantage
    ${result}=    Run Score Engine Test    win_game_after_advantage
    Should Be Equal    ${result['set']['gamesA']}    ${1}

Test Win Set At 6-4
    [Documentation]    Should win set at 6-4
    ${result}=    Run Score Engine Test    win_set_6_4
    ${sets_json}=    Get From Dictionary    ${result}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_json}')    json
    Should Be Equal    ${sets[0]['gamesA']}    ${6}
    Should Be Equal    ${sets[0]['gamesB']}    ${4}

Test Start Tiebreak At 6-6
    [Documentation]    Should start tiebreak at 6-6
    ${result}=    Run Score Engine Test    start_tiebreak_6_6
    ${set_json}=    Get From Dictionary    ${result}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['gamesA']}    ${6}
    Should Be Equal    ${set['gamesB']}    ${6}
    Should Not Be Equal    ${set['tiebreak']}    ${None}
    Should Be Equal    ${set['tiebreak']['pointsA']}    ${0}
    Should Be Equal    ${set['tiebreak']['pointsB']}    ${0}

Test Increment Tiebreak Points
    [Documentation]    Should increment tiebreak points
    ${result}=    Run Score Engine Test    increment_tiebreak_points
    ${set_json}=    Get From Dictionary    ${result}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['tiebreak']['pointsA']}    ${1}
    Should Be Equal    ${set['tiebreak']['pointsB']}    ${0}

Test Win Tiebreak At 7-5 And Finish Set
    [Documentation]    Should win tiebreak at 7-5 and finish set
    ${result}=    Run Score Engine Test    win_tiebreak_7_5
    ${sets_json}=    Get From Dictionary    ${result}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_json}')    json
    Should Be Equal    ${sets[0]['gamesA']}    ${7}
    Should Be Equal    ${sets[0]['gamesB']}    ${6}
    Should Not Be Equal    ${sets[0]['tiebreak']}    ${None}

Test Require 2-Point Margin In Tiebreak
    [Documentation]    Should require 2-point margin in tiebreak
    ${result}=    Run Score Engine Test    tiebreak_2_point_margin
    ${set_json}=    Get From Dictionary    ${result}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['tiebreak']['pointsA']}    ${7}
    Should Be Equal    ${set['tiebreak']['pointsB']}    ${6}
    ${sets_json}=    Get From Dictionary    ${result}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_json}')    json
    Should Be Equal    ${len($sets)}    ${0}

Test Finish Match After 2 Sets Won
    [Documentation]    Should finish match after 2 sets won
    ${result}=    Run Score Engine Test    finish_match_2_sets
    Should Be Equal    ${result['status']}    finished
    Should Be Equal    ${result['winner_team_id']}    ${1}

Test Decrement Normal Point
    [Documentation]    Should decrement normal point
    ${result}=    Run Score Engine Test    decrement_normal_point
    ${game_json}=    Get From Dictionary    ${result}    current_game_data
    ${game}=    Evaluate    json.loads('${game_json}')    json
    Should Be Equal    ${game['pointsA']}    ${1}

Test Undo Game Win
    [Documentation]    Should undo game win
    ${result}=    Run Score Engine Test    undo_game_win
    ${set_json}=    Get From Dictionary    ${result}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['gamesA']}    ${0}
    ${game_json}=    Get From Dictionary    ${result}    current_game_data
    ${game}=    Evaluate    json.loads('${game_json}')    json
    Should Be True    ${game['pointsA']} > 0

Test Decrement Tiebreak Point
    [Documentation]    Should decrement tiebreak point
    ${result}=    Run Score Engine Test    decrement_tiebreak_point
    ${set_json}=    Get From Dictionary    ${result}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['tiebreak']['pointsA']}    ${1}

Test Undo Tiebreak Win
    [Documentation]    Should undo tiebreak win
    ${result}=    Run Score Engine Test    undo_tiebreak_win
    ${sets_json}=    Get From Dictionary    ${result}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_json}')    json
    Should Be Equal    ${len($sets)}    ${0}
    ${set_json}=    Get From Dictionary    ${result}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Not Be Equal    ${set['tiebreak']}    ${None}

Test Not Allow Scoring When Match Not Playing
    [Documentation]    Should not allow scoring when match is not playing
    ${result}=    Run Score Engine Test    match_not_playing
    Should Contain    ${result}    Match is not in playing status

Test Handle Empty JSON Strings
    [Documentation]    Should handle empty JSON strings
    ${result}=    Run Score Engine Test    handle_empty_json
    Should Not Be Equal    ${result['sets_data']}    ${None}
    Should Not Be Equal    ${result['current_set_data']}    ${None}
    Should Not Be Equal    ${result['current_game_data']}    ${None}

*** Keywords ***
Run Score Engine Test
    [Arguments]    ${test_name}
    [Documentation]    Run a ScoreEngine test via Node.js helper script
    ${script}=    Set Variable    ${CURDIR}/score_engine_test_helper.js
    ${result}=    Run Process    ${NODE_PATH}    ${script}    ${test_name}    shell=True
    Should Be Equal As Integers    ${result.rc}    ${0}    Test ${test_name} failed: ${result.stderr}
    ${json_result}=    Evaluate    json.loads($result.stdout)    json
    [Return]    ${json_result}

