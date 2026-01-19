*** Settings ***
Documentation    Tests to verify that a game has minimum 4 points
...              Updated: 2025-12-06 10:54:50 - v0.03-dev
Library          RequestsLibrary
Library          Collections

Suite Setup       Create Session And Login As Admin
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test Match    Cleanup Test Teams    Cleanup Test Category

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${MATCH_ID}          ${EMPTY}
${TEAM1_ID}          ${EMPTY}
${TEAM2_ID}          ${EMPTY}
${CATEGORY_ID}       ${EMPTY}
${ADMIN_TOKEN}       ${EMPTY}
${ADMIN_USERNAME}    admin
${ADMIN_PASSWORD}    admin123

*** Test Cases ***

Test Game Won With 4 Points Should Have Correct Statistics
    [Documentation]    When a team wins a game 40-0, statistics should show minimum 4 points
    [Tags]    statistics    points    minimum
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category and teams
    Create Test Category And Teams
    
    # Create match
    ${match_data}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    status=scheduled
    ${match_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${match_data}    headers=${headers}
    Should Be Equal As Strings    ${match_response.status_code}    201
    ${match_id}=    Set Variable    ${match_response.json()}[match_id]
    Set Suite Variable    ${MATCH_ID}    ${match_id}
    
    # Start match
    ${empty_dict}=    Create Dictionary
    ${start_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/start    json=${empty_dict}    headers=${headers}
    Should Be Equal As Strings    ${start_response.status_code}    200
    
    # Score 4 points for team1 to win game (0-15-30-40-Game)
    ${body}=    Create Dictionary    team=A
    FOR    ${i}    IN RANGE    4
        ${score_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/score/increment    json=${body}    headers=${headers}
        Should Be Equal As Strings    ${score_response.status_code}    200
    END
    
    # Finish match
    ${finish_data}=    Create Dictionary    status=finished
    ${finish_response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}    json=${finish_data}    headers=${headers}
    Should Be Equal As Strings    ${finish_response.status_code}    200
    
    # Get statistics
    ${stats_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/statistics    headers=${headers}
    Should Be Equal As Strings    ${stats_response.status_code}    200
    ${statistics}=    Set Variable    ${stats_response.json()}[statistics]
    
    # Verify minimum 4 points per game won
    ${games_won_team1}=    Get From Dictionary    ${statistics}    totalGamesTeam1
    ${points_team1}=    Get From Dictionary    ${statistics}    totalPointsTeam1
    
    # Team1 won at least 1 game, so should have at least 4 points
    Run Keyword If    ${games_won_team1} > 0    Should Be True    ${points_team1} >= ${games_won_team1 * 4}    Team1 should have minimum 4 points per game won

Test Multiple Games Won Should Have Correct Minimum Points
    [Documentation]    When a team wins multiple games, each should have minimum 4 points
    [Tags]    statistics    points    minimum    multiple
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category and teams
    Create Test Category And Teams
    
    # Create match
    ${match_data}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    status=scheduled
    ${match_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${match_data}    headers=${headers}
    Should Be Equal As Strings    ${match_response.status_code}    201
    ${match_id}=    Set Variable    ${match_response.json()}[match_id]
    Set Suite Variable    ${MATCH_ID}    ${match_id}
    
    # Start match
    ${empty_dict}=    Create Dictionary
    ${start_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/start    json=${empty_dict}    headers=${headers}
    Should Be Equal As Strings    ${start_response.status_code}    200
    
    # Score points to win 3 games for team1 (each game needs 4 points minimum)
    ${body}=    Create Dictionary    team=A
    FOR    ${game}    IN RANGE    3
        FOR    ${point}    IN RANGE    4
            ${score_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/score/increment    json=${body}    headers=${headers}
            Should Be Equal As Strings    ${score_response.status_code}    200
        END
    END
    
    # Finish match
    ${finish_data}=    Create Dictionary    status=finished
    ${finish_response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}    json=${finish_data}    headers=${headers}
    Should Be Equal As Strings    ${finish_response.status_code}    200
    
    # Get statistics
    ${stats_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/statistics    headers=${headers}
    Should Be Equal As Strings    ${stats_response.status_code}    200
    ${statistics}=    Set Variable    ${stats_response.json()}[statistics]
    
    # Verify minimum 4 points per game won
    ${games_won_team1}=    Get From Dictionary    ${statistics}    totalGamesTeam1
    ${points_team1}=    Get From Dictionary    ${statistics}    totalPointsTeam1
    
    # Team1 won 3 games, so should have at least 12 points (3 * 4)
    Should Be True    ${games_won_team1} >= 3    Team1 should have won at least 3 games
    Should Be True    ${points_team1} >= 12    Team1 should have minimum 12 points (3 games * 4 points)

Test Game Statistics Should Reflect Minimum Points Per Game
    [Documentation]    Statistics should always show minimum 4 points per game won, even if score_history is incomplete
    [Tags]    statistics    points    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category and teams
    Create Test Category And Teams
    
    # Create match
    ${match_data}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    status=scheduled
    ${match_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${match_data}    headers=${headers}
    Should Be Equal As Strings    ${match_response.status_code}    201
    ${match_id}=    Set Variable    ${match_response.json()}[match_id]
    Set Suite Variable    ${MATCH_ID}    ${match_id}
    
    # Start match
    ${empty_dict}=    Create Dictionary
    ${start_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/start    json=${empty_dict}    headers=${headers}
    Should Be Equal As Strings    ${start_response.status_code}    200
    
    # Win a set for team1 (6 games, each needs 4 points minimum = 24 points)
    ${body}=    Create Dictionary    team=A
    FOR    ${game}    IN RANGE    6
        FOR    ${point}    IN RANGE    4
            ${score_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/score/increment    json=${body}    headers=${headers}
            Should Be Equal As Strings    ${score_response.status_code}    200
        END
    END
    
    # Finish match
    ${finish_data}=    Create Dictionary    status=finished
    ${finish_response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}    json=${finish_data}    headers=${headers}
    Should Be Equal As Strings    ${finish_response.status_code}    200
    
    # Get statistics
    ${stats_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id}/statistics    headers=${headers}
    Should Be Equal As Strings    ${stats_response.status_code}    200
    ${statistics}=    Set Variable    ${stats_response.json()}[statistics]
    
    # Verify minimum 4 points per game won
    ${games_won_team1}=    Get From Dictionary    ${statistics}    totalGamesTeam1
    ${points_team1}=    Get From Dictionary    ${statistics}    totalPointsTeam1
    
    # Team1 won 6 games, so should have at least 24 points (6 * 4)
    Should Be True    ${games_won_team1} >= 6    Team1 should have won at least 6 games
    Should Be True    ${points_team1} >= 24    Team1 should have minimum 24 points (6 games * 4 points)
    
    # Verify average points per game is at least 4
    ${avg_points}=    Get From Dictionary    ${statistics}    averagePointsPerGame
    ${avg_points_float}=    Convert To Number    ${avg_points}
    Should Be True    ${avg_points_float} >= 4.0    Average points per game should be at least 4.0

*** Keywords ***

Create Session And Login As Admin
    [Documentation]    Create API session and login as admin
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    
    # Login
    ${login_data}=    Create Dictionary    username=${ADMIN_USERNAME}    password=${ADMIN_PASSWORD}
    ${login_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${login_data}
    Should Be Equal As Strings    ${login_response.status_code}    200
    
    ${token}=    Set Variable    ${login_response.json()}[token]
    Set Suite Variable    ${ADMIN_TOKEN}    ${token}

Create Test Category And Teams
    [Documentation]    Create test category and teams for match
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category
    ${cat_data}=    Create Dictionary    name=Test Category Points
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}
    
    # Create teams
    ${team1_data}=    Create Dictionary    name=Team Points Test 1    category_id=${category_id}
    ${team1_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team1_data}    headers=${headers}
    Should Be Equal As Strings    ${team1_response.status_code}    201
    ${team1_id}=    Set Variable    ${team1_response.json()}[team_id]
    Set Suite Variable    ${TEAM1_ID}    ${team1_id}
    
    ${team2_data}=    Create Dictionary    name=Team Points Test 2    category_id=${category_id}
    ${team2_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team2_data}    headers=${headers}
    Should Be Equal As Strings    ${team2_response.status_code}    201
    ${team2_id}=    Set Variable    ${team2_response.json()}[team_id]
    Set Suite Variable    ${TEAM2_ID}    ${team2_id}

Cleanup Test Match
    [Documentation]    Clean up test match
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${MATCH_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${MATCH_ID}    ${EMPTY}

Cleanup Test Teams
    [Documentation]    Clean up test teams
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${TEAM1_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}    headers=${headers}    expected_status=any
    Run Keyword If    '${TEAM2_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM2_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${TEAM1_ID}    ${EMPTY}
    Set Suite Variable    ${TEAM2_ID}    ${EMPTY}

Cleanup Test Category
    [Documentation]    Clean up test category
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${CATEGORY_ID}    ${EMPTY}

Cleanup Test Data
    [Documentation]    Clean up all test data
    Cleanup Test Match
    Cleanup Test Teams
    Cleanup Test Category
    Delete All Sessions
    Log    Test data cleanup completed

