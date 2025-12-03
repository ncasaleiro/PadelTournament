*** Settings ***
Documentation    Test suite for Scoring API
Library    RequestsLibrary
Library    Collections
Resource    ../resources/common.robot

Suite Setup    Run Keywords
...    Create Session For API
...    Create Test Match
Suite Teardown    Delete All Sessions

*** Variables ***
${CATEGORY_ID}    ${EMPTY}
${TEAM1_ID}      ${EMPTY}
${TEAM2_ID}      ${EMPTY}
${MATCH_ID}      ${EMPTY}

*** Keywords ***
Create Test Match
    ${headers}=    Create Dictionary    Content-Type=application/json
    # Create category
    ${cat_body}=    Create Dictionary    name=TestCategory
    ${cat_response}=    POST    ${API_BASE}/categories    json=${cat_body}    headers=${headers}
    ${category_id}=    Get From Dictionary    ${cat_response.json()}    category_id
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}
    
    # Create teams
    ${team1_body}=    Create Dictionary    name=Team A    category_id=${category_id}    group_name=A
    ${team2_body}=    Create Dictionary    name=Team B    category_id=${category_id}    group_name=A
    ${team1_response}=    POST    ${API_BASE}/teams    json=${team1_body}    headers=${headers}
    ${team2_response}=    POST    ${API_BASE}/teams    json=${team2_body}    headers=${headers}
    ${team1_id}=    Get From Dictionary    ${team1_response.json()}    team_id
    ${team2_id}=    Get From Dictionary    ${team2_response.json()}    team_id
    Set Suite Variable    ${TEAM1_ID}    ${team1_id}
    Set Suite Variable    ${TEAM2_ID}    ${team2_id}
    
    # Create match
    ${match_body}=    Create Dictionary
    ...    team1_id=${team1_id}
    ...    team2_id=${team2_id}
    ...    category_id=${category_id}
    ...    phase=Group
    ...    group_name=A
    ${match_response}=    POST    ${API_BASE}/matches    json=${match_body}    headers=${headers}
    ${match_id}=    Get From Dictionary    ${match_response.json()}    match_id
    Set Suite Variable    ${MATCH_ID}    ${match_id}

*** Test Cases ***
Test Start Match
    [Documentation]    Test starting a match
    ${response}=    POST    ${API_BASE}/matches/${MATCH_ID}/start
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    status    playing
    # Verify initial score state
    ${current_game_str}=    Get From Dictionary    ${response.json()}    current_game_data
    ${current_game}=    Evaluate    json.loads('${current_game_str}')    json
    Should Be Equal    ${current_game}[pointsA]    ${0}
    Should Be Equal    ${current_game}[pointsB]    ${0}

Test Increment Point Team A
    [Documentation]    Test incrementing a point for Team A
    [Tags]    requires_started_match
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    ${response}=    POST    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${current_game_str}=    Get From Dictionary    ${response.json()}    current_game_data
    ${current_game}=    Evaluate    json.loads('${current_game_str}')    json
    Should Be Equal    ${current_game}[pointsA]    ${1}

Test Increment Point Team B
    [Documentation]    Test incrementing a point for Team B
    [Tags]    requires_started_match
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=B
    ${response}=    POST    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${current_game_str}=    Get From Dictionary    ${response.json()}    current_game_data
    ${current_game}=    Evaluate    json.loads('${current_game_str}')    json
    Should Be Equal    ${current_game}[pointsB]    ${1}

Test Score Progression 0-15-30-40
    [Documentation]    Test score progression from 0 to 40
    [Tags]    requires_started_match
    ${headers}=    Create Dictionary    Content-Type=application/json
    # Score 4 points for Team A (should win the game)
    FOR    ${i}    IN RANGE    4
        ${body}=    Create Dictionary    team=A
        ${response}=    POST    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
        Should Be Equal As Strings    ${response.status_code}    200
    END
    # Verify game was won (current game reset, set games incremented)
    ${response}=    GET    ${API_BASE}/matches/${MATCH_ID}
    ${current_set_str}=    Get From Dictionary    ${response.json()}    current_set_data
    ${current_set}=    Evaluate    json.loads('${current_set_str}')    json
    Should Be Equal    ${current_set}[gamesA]    ${1}
    Should Be Equal    ${current_set}[gamesB]    ${0}

Test Decrement Point
    [Documentation]    Test decrementing a point (undo)
    [Tags]    requires_started_match
    ${headers}=    Create Dictionary    Content-Type=application/json
    # First increment
    ${body}=    Create Dictionary    team=A
    ${response1}=    POST    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    ${current_game1_str}=    Get From Dictionary    ${response1.json()}    current_game_data
    ${current_game1}=    Evaluate    json.loads('${current_game1_str}')    json
    ${points_before}=    Set Variable    ${current_game1}[pointsA]
    # Then decrement
    ${response2}=    POST    ${API_BASE}/matches/${MATCH_ID}/score/decrement    json=${body}    headers=${headers}
    ${current_game2_str}=    Get From Dictionary    ${response2.json()}    current_game_data
    ${current_game2}=    Evaluate    json.loads('${current_game2_str}')    json
    ${points_after}=    Set Variable    ${current_game2}[pointsA]
    Should Be True    ${points_after} < ${points_before}

Test Finish Match
    [Documentation]    Test finishing a match
    [Tags]    requires_started_match
    ${response}=    POST    ${API_BASE}/matches/${MATCH_ID}/finish
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    status    finished

Test Score Increment Without Starting Match
    [Documentation]    Test that scoring requires match to be in playing status
    ${headers}=    Create Dictionary    Content-Type=application/json
    # Create a new match (status: scheduled)
    ${match_body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ${match_response}=    POST    ${API_BASE}/matches    json=${match_body}    headers=${headers}
    ${new_match_id}=    Get From Dictionary    ${match_response.json()}    match_id
    # Try to score without starting
    ${body}=    Create Dictionary    team=A
    ${response}=    POST    ${API_BASE}/matches/${new_match_id}/score/increment    json=${body}    headers=${headers}    expected_status=500
    Verify Response Status    500
    [Teardown]    DELETE    ${API_BASE}/matches/${new_match_id}

Test Complete Set
    [Documentation]    Test completing a set (6 games with 2-game margin)
    [Tags]    requires_started_match
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    # Score 4 points * 6 games = 24 points to win 6 games
    FOR    ${game}    IN RANGE    6
        FOR    ${point}    IN RANGE    4
            ${response}=    POST    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
            Should Be Equal As Strings    ${response.status_code}    200
        END
    END
    # Verify set is completed
    ${response}=    GET    ${API_BASE}/matches/${MATCH_ID}
    ${sets_str}=    Get From Dictionary    ${response.json()}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_str}')    json
    Should Not Be Empty    ${sets}
    ${first_set}=    Get From List    ${sets}    0
    Should Be Equal    ${first_set}[gamesA]    ${6}
    Should Be Equal    ${first_set}[gamesB]    ${0}

