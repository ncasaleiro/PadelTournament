*** Settings ***
Documentation    Unit tests for Match API endpoints - All match features
Library          RequestsLibrary
Library          Collections
Library          String

Suite Setup       Create Session For API
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test Match    Cleanup Test Teams    Cleanup Test Category

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${CATEGORY_ID}       ${EMPTY}
${TEAM1_ID}          ${EMPTY}
${TEAM2_ID}          ${EMPTY}
${MATCH_ID}          ${EMPTY}

*** Test Cases ***

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
    ${matches}=    Set Variable    ${response.json()}
    Should Be True    isinstance(${matches}, list)    # Should be a list

Test Filter Matches By Status
    [Documentation]    Should filter matches by status
    [Tags]    match    filter
    ${params}=    Create Dictionary    status=scheduled
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches    params=${params}
    Status Should Be    200
    FOR    ${match}    IN    @{response.json()}
        Should Be Equal    ${match['status']}    scheduled
    END

Test Filter Matches By Category
    [Documentation]    Should filter matches by category
    [Tags]    match    filter
    ${params}=    Create Dictionary    category_id=${CATEGORY_ID}
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches    params=${params}
    Status Should Be    200
    FOR    ${match}    IN    @{response.json()}
        Should Be Equal    ${match['category_id']}    ${CATEGORY_ID}
    END

Test Get Match By ID
    [Documentation]    Should get match by id
    [Tags]    match    get
    [Setup]    Ensure Test Match Exists
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    Status Should Be    200
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['match_id']}    ${MATCH_ID}

Test Get Non-Existent Match
    [Documentation]    Should return 404 for non-existent match
    [Tags]    match    get    error
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/99999    expected_status=404
    Status Should Be    404

Test Start Match
    [Documentation]    Should start a match
    [Tags]    match    start
    [Setup]    Ensure Test Match Exists
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/start
    Status Should Be    200
    Should Be Equal    ${response.json()['status']}    playing

Test Increment Point Team A
    [Documentation]    Should increment point for team A
    [Tags]    match    scoring
    [Setup]    Ensure Test Match Started
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
    [Setup]    Ensure Test Match Started
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
    [Setup]    Ensure Test Match Started
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    
    # Score 4 points for team A
    FOR    ${i}    IN RANGE    4
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    END
    
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    ${set_json}=    Get From Dictionary    ${match}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be Equal    ${set['gamesA']}    ${1}
    ${game_json}=    Get From Dictionary    ${match}    current_game_data
    ${game}=    Evaluate    json.loads('${game_json}')    json
    Should Be Equal    ${game['pointsA']}    ${0}    # Game reset

Test Start Tiebreak At 6-6
    [Documentation]    Should start tiebreak at 6-6
    [Tags]    match    scoring    tiebreak
    [Setup]    Ensure Test Match Started
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body_a}=    Create Dictionary    team=A
    ${body_b}=    Create Dictionary    team=B
    
    # Verify match is in playing status
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['status']}    playing
    
    # Reach 5-5 first (5 games for each team)
    # Team A wins 5 games
    FOR    ${game}    IN RANGE    5
        FOR    ${point}    IN RANGE    4
            ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
            Status Should Be    200
        END
    END
    # Team B wins 5 games
    FOR    ${game}    IN RANGE    5
        FOR    ${point}    IN RANGE    4
            ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
            Status Should Be    200
        END
    END
    # Now 6-5 (Team A wins one more game)
    FOR    ${point}    IN RANGE    4
        ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
        Status Should Be    200
    END
    # Finally 6-6 (Team B wins one more game, starting tiebreak)
    FOR    ${point}    IN RANGE    4
        ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
        Status Should Be    200
    END
    
    # Verify we reached 6-6 and tiebreak started
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    ${set_json}=    Get From Dictionary    ${match}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    # After scoring 6 games for each team, we should have 6-6 and tiebreak
    ${games_a}=    Set Variable    ${set['gamesA']}
    ${games_b}=    Set Variable    ${set['gamesB']}
    Log    Final state: Games A=${games_a}, Games B=${games_b}, Tiebreak=${set.get('tiebreak')}
    # Both teams should have exactly 6 games
    Should Be Equal    ${games_a}    ${6}    Expected gamesA = 6, got ${games_a}
    Should Be Equal    ${games_b}    ${6}    Expected gamesB = 6, got ${games_b}
    # Tiebreak should exist
    ${tiebreak}=    Get From Dictionary    ${set}    tiebreak
    Should Not Be Equal    ${tiebreak}    ${None}    Tiebreak should exist but is None

Test Win Tiebreak And Set
    [Documentation]    Should win tiebreak and set
    [Tags]    match    scoring    tiebreak
    [Setup]    Ensure Test Match Started
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body_a}=    Create Dictionary    team=A
    ${body_b}=    Create Dictionary    team=B
    
    # Verify match is in playing status
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['status']}    playing
    
    # Set up tiebreak first: 5-5, then 6-5, then 6-6
    # Reach 5-5 first (5 games for each team)
    FOR    ${game}    IN RANGE    5
        FOR    ${point}    IN RANGE    4
            ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
            Status Should Be    200
        END
    END
    FOR    ${game}    IN RANGE    5
        FOR    ${point}    IN RANGE    4
            ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
            Status Should Be    200
        END
    END
    # Now 6-5 (Team A wins one more game)
    FOR    ${point}    IN RANGE    4
        ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
        Status Should Be    200
    END
    # Finally 6-6 (Team B wins one more game, starting tiebreak)
    FOR    ${point}    IN RANGE    4
        ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
        Status Should Be    200
    END
    
    # Verify we're in tiebreak
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    ${set_json}=    Get From Dictionary    ${match}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    ${tiebreak}=    Get From Dictionary    ${set}    tiebreak
    Should Not Be Equal    ${tiebreak}    ${None}    Tiebreak should exist after reaching 6-6
    
    # Win tiebreak 7-5 (team A wins) - need 2-point margin
    # Score 7 points for A
    FOR    ${i}    IN RANGE    7
        ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
        Status Should Be    200
    END
    # Score 5 points for B
    FOR    ${i}    IN RANGE    5
        ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
        Status Should Be    200
    END
    # Final point to win (A reaches 8, B has 5, so 8-5 = 3 point margin, but tiebreak needs 2)
    # Actually, at 7-5, A already has 2-point margin, so one more point wins
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
    Status Should Be    200
    
    # Verify set was completed
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    ${sets_json}=    Get From Dictionary    ${match}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_json}')    json
    # Verify set was completed (should have at least one completed set)
    Should Be True    len($sets) > 0    Set should be completed and added to sets_data
    # The last set should be 7-6 (winner has 7, loser has 6)
    ${last_set}=    Set Variable    ${sets[-1]}
    ${games_a}=    Set Variable    ${last_set['gamesA']}
    ${games_b}=    Set Variable    ${last_set['gamesB']}
    Log    Completed set: Games A=${games_a}, Games B=${games_b}
    Should Be True    ${games_a} == 7 or ${games_b} == 7    Winner should have 7 games
    Should Be True    ${games_a} == 6 or ${games_b} == 6    Loser should have 6 games

Test Decrement Point
    [Documentation]    Should decrement point
    [Tags]    match    scoring    undo
    [Setup]    Ensure Test Match Started
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
    [Setup]    Ensure Test Match Started
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    team=A
    
    # Win a game
    FOR    ${i}    IN RANGE    4
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    END
    
    # Undo
    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/decrement    json=${body}    headers=${headers}
    
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    ${set_json}=    Get From Dictionary    ${match}    current_set_data
    ${set}=    Evaluate    json.loads('${set_json}')    json
    Should Be True    ${set['gamesA']} < 1

Test Finish Match
    [Documentation]    Should finish a match
    [Tags]    match    finish
    [Setup]    Ensure Test Match Exists
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/finish
    Status Should Be    200
    Should Be Equal    ${response.json()['status']}    finished

Test Update Match
    [Documentation]    Should update match
    [Tags]    match    update
    [Setup]    Ensure Test Match Exists
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
    [Setup]    Ensure Test Match Exists
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    referee_notes=Test notes
    
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['referee_notes']}    Test notes

Test Update Events Data
    [Documentation]    Should update events data
    [Tags]    match    update    events
    [Setup]    Ensure Test Match Exists
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${events}=    Create List
    ${event_data}=    Create Dictionary    team=A
    ${event}=    Create Dictionary    type=point    data=${event_data}    timestamp=2025-12-10T10:00:00Z
    Append To List    ${events}    ${event}
    ${body}=    Create Dictionary    events_data=${events}
    
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Contain    ${response.json()}    events_data

Test Delete Match
    [Documentation]    Should delete a match
    [Tags]    match    delete
    [Setup]    Ensure Test Match Exists
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    Status Should Be    204

*** Keywords ***
Create Session For API
    [Documentation]    Create HTTP session for API calls
    Create Session    ${SESSION_NAME}    ${BASE_URL}

Setup Test Data
    [Documentation]    Create test data for match tests
    Create Test Category
    Create Test Teams

Ensure Test Match Exists
    [Documentation]    Ensure a test match exists, create if needed
    Run Keyword If    '${MATCH_ID}' == '${EMPTY}'    Create Test Match

Ensure Test Match Started
    [Documentation]    Ensure a test match exists and is started
    Ensure Test Match Exists
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    ${status}=    Get From Dictionary    ${match}    status
    Run Keyword If    '${status}' != 'playing'    Start Test Match
    # Verify match is started
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    ${status}=    Get From Dictionary    ${match}    status
    Should Be Equal    ${status}    playing

Create Test Match
    [Documentation]    Create a test match
    Setup Test Data
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
    Set Suite Variable    ${MATCH_ID}    ${response.json()['match_id']}

Start Test Match
    [Documentation]    Start the test match
    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/start

Create Test Category
    [Documentation]    Create a test category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategory
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}

Create Test Teams
    [Documentation]    Create test teams
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body1}=    Create Dictionary    name=TestTeam1    category_id=${CATEGORY_ID}    group_name=A
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body1}    headers=${headers}
    Set Suite Variable    ${TEAM1_ID}    ${response1.json()['team_id']}
    
    ${body2}=    Create Dictionary    name=TestTeam2    category_id=${CATEGORY_ID}    group_name=A
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body2}    headers=${headers}
    Set Suite Variable    ${TEAM2_ID}    ${response2.json()['team_id']}

Cleanup Test Match
    [Documentation]    Clean up test match created during tests
    Run Keyword If    '${MATCH_ID}' != '${EMPTY}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    Set Suite Variable    ${MATCH_ID}    ${EMPTY}

Cleanup Test Teams
    [Documentation]    Clean up test teams created during tests
    Run Keyword If    '${TEAM1_ID}' != '${EMPTY}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}
    Run Keyword If    '${TEAM2_ID}' != '${EMPTY}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM2_ID}
    Set Suite Variable    ${TEAM1_ID}    ${EMPTY}
    Set Suite Variable    ${TEAM2_ID}    ${EMPTY}

Cleanup Test Category
    [Documentation]    Clean up test category
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}
    Set Suite Variable    ${CATEGORY_ID}    ${EMPTY}

Cleanup Test Data
    [Documentation]    Clean up all test data
    Run Keyword And Ignore Error    Cleanup All Test Data Safely
    Delete All Sessions

Cleanup All Test Data Safely
    [Documentation]    Safely clean up all test data
    # Get all matches and delete test ones
    ${response}=    Run Keyword And Return Status    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches
    Run Keyword If    ${response}    Cleanup Test Matches Safely
    # Get all teams and delete test ones
    ${response}=    Run Keyword And Return Status    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams
    Run Keyword If    ${response}    Cleanup Test Teams Safely
    # Get all categories and delete test ones
    ${response}=    Run Keyword And Return Status    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Run Keyword If    ${response}    Cleanup Test Categories Safely

Cleanup Test Matches Safely
    [Documentation]    Safely clean up test matches
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches
    Run Keyword If    '${response.status_code}' == '200'    Cleanup Test Matches From List    ${response.json()}

Cleanup Test Teams Safely
    [Documentation]    Safely clean up test teams
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams
    Run Keyword If    '${response.status_code}' == '200'    Cleanup Test Teams From List    ${response.json()}

Cleanup Test Categories Safely
    [Documentation]    Safely clean up test categories
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Run Keyword If    '${response.status_code}' == '200'    Cleanup Test Categories From List    ${response.json()}

Cleanup Test Matches From List
    [Documentation]    Clean up test matches from a list
    [Arguments]    ${matches}
    FOR    ${match}    IN    @{matches}
        ${category_id}=    Get From Dictionary    ${match}    category_id
        Run Keyword If    '${category_id}' == '${CATEGORY_ID}'    Run Keyword And Ignore Error    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match['match_id']}
    END

Cleanup Test Teams From List
    [Documentation]    Clean up test teams from a list
    [Arguments]    ${teams}
    FOR    ${team}    IN    @{teams}
        ${name}=    Get From Dictionary    ${team}    name
        Run Keyword If    'TestTeam' in '${name}'    Run Keyword And Ignore Error    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${team['team_id']}
    END

Cleanup Test Categories From List
    [Documentation]    Clean up test categories from a list
    [Arguments]    ${categories}
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        Run Keyword If    'TestCategory' in '${name}'    Run Keyword And Ignore Error    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${category['category_id']}
    END

