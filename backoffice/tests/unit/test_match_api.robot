*** Settings ***
Documentation    Unit tests for Match API endpoints - All match features
Library          RequestsLibrary
Library          Collections
Library          String
Library          JSON

Suite Setup    Create Session For API
Suite Teardown    Delete All Sessions

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${CATEGORY_ID}       ${EMPTY}
${TEAM1_ID}          ${EMPTY}
${TEAM2_ID}          ${EMPTY}
${MATCH_ID}          ${EMPTY}

*** Test Cases ***
Create Session For API
    [Documentation]    Create HTTP session for API calls
    Create Session    ${SESSION_NAME}    ${BASE_URL}

Delete All Sessions
    [Documentation]    Delete all HTTP sessions
    Delete All Sessions

Setup Test Data
    [Documentation]    Create test data for match tests
    [Tags]    setup
    Create Test Category
    Create Test Teams

Test Create Match
    [Documentation]    Should create a new match
    [Tags]    match    create
    [Setup]    Setup Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    group_name=A
    ...    scheduled_date=2025-12-10
    ...    scheduled_time=10:00
    ...    court=Court 1
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body}    headers=${headers}
    Status Should Be    201
    Should Contain    ${response.json()}    match_id
    Set Suite Variable    ${MATCH_ID}    ${response.json()['match_id']}
    Should Be Equal    ${response.json()['status']}    scheduled

Test Get All Matches
    [Documentation]    Should get all matches
    [Tags]    match    get
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches
    Status Should Be    200
    Should Be True    ${response.json()}    # Should be a list

Test Filter Matches By Status
    [Documentation]    Should filter matches by status
    [Tags]    match    filter
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches?status=scheduled
    Status Should Be    200
    FOR    ${match}    IN    @{response.json()}
        Should Be Equal    ${match['status']}    scheduled
    END

Test Filter Matches By Category
    [Documentation]    Should filter matches by category
    [Tags]    match    filter
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches?category_id=${CATEGORY_ID}
    Status Should Be    200
    FOR    ${match}    IN    @{response.json()}
        Should Be Equal    ${match['category_id']}    ${CATEGORY_ID}
    END

Test Get Match By ID
    [Documentation]    Should get match by id
    [Tags]    match    get
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    Status Should Be    200
    Should Be Equal    ${response.json()['match_id']}    ${MATCH_ID}

Test Get Non-Existent Match
    [Documentation]    Should return 404 for non-existent match
    [Tags]    match    get    error
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/99999    expected_status=404
    Status Should Be    404

Test Start Match
    [Documentation]    Should start a match
    [Tags]    match    start
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/start
    Status Should Be    200
    Should Be Equal    ${response.json()['status']}    playing

Test Increment Point Team A
    [Documentation]    Should increment point for team A
    [Tags]    match    scoring
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment
    ...    json=${body}    headers=${headers}
    Status Should Be    200
    ${game_json}=    Get From Dictionary    ${response.json()}    current_game_data
    ${game}=    Evaluate    json.loads('${game_json}')    json
    Should Be Equal    ${game['pointsA']}    ${1}

Test Increment Point Team B
    [Documentation]    Should increment point for team B
    [Tags]    match    scoring
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=B
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment
    ...    json=${body}    headers=${headers}
    Status Should Be    200
    ${game_json}=    Get From Dictionary    ${response.json()}    current_game_data
    ${game}=    Evaluate    json.loads('${game_json}')    json
    Should Be True    ${game['pointsB']} > 0

Test Win Game After 4 Points
    [Documentation]    Should win game after 4 points
    [Tags]    match    scoring
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    
    # Score 4 points for team A
    FOR    ${i}    IN RANGE    4
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    END
    
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${set_json}=    Get From Dictionary    ${response.json()}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['gamesA']}    ${1}
    ${game_json}=    Get From Dictionary    ${response.json()}    current_game_data
    ${game}=    Evaluate    json.loads('${game_json}')    json
    Should Be Equal    ${game['pointsA']}    ${0}    # Game reset

Test Start Tiebreak At 6-6
    [Documentation]    Should start tiebreak at 6-6
    [Tags]    match    scoring    tiebreak
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body_a}=    Create Dictionary    team=A
    ${body_b}=    Create Dictionary    team=B
    
    # Win 6 games for each team
    FOR    ${game}    IN RANGE    6
        FOR    ${point}    IN RANGE    4
            POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
        END
    END
    FOR    ${game}    IN RANGE    6
        FOR    ${point}    IN RANGE    4
            POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
        END
    END
    
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${set_json}=    Get From Dictionary    ${response.json()}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['gamesA']}    ${6}
    Should Be Equal    ${set['gamesB']}    ${6}
    Should Not Be Equal    ${set['tiebreak']}    ${None}

Test Win Tiebreak And Set
    [Documentation]    Should win tiebreak and set
    [Tags]    match    scoring    tiebreak
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body_a}=    Create Dictionary    team=A
    ${body_b}=    Create Dictionary    team=B
    
    # Ensure we're in tiebreak (6-6)
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${set_json}=    Get From Dictionary    ${response.json()}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    
    IF    not ${set['tiebreak']} or ${set['gamesA']} != 6 or ${set['gamesB']} != 6
        # Set up tiebreak first
        FOR    ${game}    IN RANGE    6
            FOR    ${point}    IN RANGE    4
                POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
            END
        END
        FOR    ${game}    IN RANGE    6
            FOR    ${point}    IN RANGE    4
                POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
            END
        END
    END
    
    # Win tiebreak 7-5
    FOR    ${i}    IN RANGE    7
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
    END
    FOR    ${i}    IN RANGE    5
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
    END
    # Final point to win
    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
    
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${sets_json}=    Get From Dictionary    ${response.json()}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_json}')    json
    Should Be True    len($sets) > 0
    Should Be Equal    ${sets[-1]['gamesA']}    ${7}
    Should Be Equal    ${sets[-1]['gamesB']}    ${6}

Test Decrement Point
    [Documentation]    Should decrement point
    [Tags]    match    scoring    undo
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    
    # First increment
    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    
    # Then decrement
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/decrement    json=${body}    headers=${headers}
    Status Should Be    200
    ${game_json}=    Get From Dictionary    ${response.json()}    current_game_data
    ${game}=    Evaluate    json.loads('${game_json}')    json
    Should Be Equal    ${game['pointsA']}    ${0}

Test Undo Game Win
    [Documentation]    Should undo game win
    [Tags]    match    scoring    undo
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    
    # Win a game
    FOR    ${i}    IN RANGE    4
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    END
    
    # Undo
    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/decrement    json=${body}    headers=${headers}
    
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${set_json}=    Get From Dictionary    ${response.json()}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be True    ${set['gamesA']} < 1

Test Finish Match
    [Documentation]    Should finish a match
    [Tags]    match    finish
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/finish
    Status Should Be    200
    Should Be Equal    ${response.json()['status']}    finished

Test Update Match
    [Documentation]    Should update match
    [Tags]    match    update
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    scheduled_time=14:00
    ...    court=Court 2
    
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['scheduled_time']}    14:00
    Should Be Equal    ${response.json()['court']}    Court 2

Test Update Referee Notes
    [Documentation]    Should update referee notes
    [Tags]    match    update    referee
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    referee_notes=Test notes
    
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['referee_notes']}    Test notes

Test Update Events Data
    [Documentation]    Should update events data
    [Tags]    match    update    events
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${events}=    Create List
    ${event}=    Create Dictionary    type=point    data=${{"team": "A"}}    timestamp=2025-12-10T10:00:00Z
    Append To List    ${events}    ${event}
    ${body}=    Create Dictionary    events_data=${events}
    
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Contain    ${response.json()}    events_data

Test Delete Match
    [Documentation]    Should delete a match
    [Tags]    match    delete
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    Status Should Be    204

*** Keywords ***
Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategory
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}

Create Test Teams
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body1}=    Create Dictionary    name=Team 1    category_id=${CATEGORY_ID}    group_name=A
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body1}    headers=${headers}
    Set Suite Variable    ${TEAM1_ID}    ${response1.json()['team_id']}
    
    ${body2}=    Create Dictionary    name=Team 2    category_id=${CATEGORY_ID}    group_name=A
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body2}    headers=${headers}
    Set Suite Variable    ${TEAM2_ID}    ${response2.json()['team_id']}

