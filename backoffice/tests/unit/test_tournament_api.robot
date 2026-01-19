*** Settings ***
Documentation    Tournament Scheduler API Tests - v0.03-dev
...              Updated: 2025-12-06 10:54:50 - Added category_ids requirement
Library          RequestsLibrary
Library          Collections
Library          DateTime

Suite Setup       Suite Setup
Suite Teardown    Cleanup All Test Data

*** Variables ***
${BASE_URL}      http://localhost:3000
${ADMIN_TOKEN}   ${EMPTY}
${TOURNAMENT_ID}    ${EMPTY}
${CREATED_CATEGORIES}    ${EMPTY}
${CREATED_TEAMS}    ${EMPTY}
${CREATED_TOURNAMENTS}    ${EMPTY}
${SESSION_NAME}    api_session

*** Test Cases ***

Test Create Tournament
    [Documentation]    Should create a new tournament
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Added category_ids requirement
    [Tags]    tournament    create
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create a test category first with unique name
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=Test Category Tournament ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    ${category_ids}=    Create List    ${category_id}
    # Track for cleanup
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    ${data}=    Create Dictionary
    ...    name=Torneio de Padel 2025
    ...    start_date=2025-06-01
    ...    end_date=2025-06-15
    ...    courts=4
    ...    start_time=08:00
    ...    end_time=23:00
    ...    match_duration_minutes=90
    ...    category_ids=${category_ids}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments    json=${data}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    201
    ${tournament}=    Set Variable    ${response.json()}
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament}[tournament_id]
    # Track for cleanup
    Append To List    ${CREATED_TOURNAMENTS}    ${tournament}[tournament_id]
    Should Be Equal    ${tournament}[name]    Torneio de Padel 2025
    Should Be Equal    ${tournament}[courts]    ${4}
    Should Be Equal    ${tournament}[match_duration_minutes]    ${90}

Test Get All Tournaments
    [Documentation]    Should get all tournaments
    [Tags]    tournament    read
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    200
    ${tournaments}=    Set Variable    ${response.json()}
    Should Be True    isinstance(${tournaments}, list)    Tournaments should be a list
    # Note: List might be empty if no tournaments exist yet, but should contain at least the one created in previous test

Test Get Tournament By ID
    [Documentation]    Should get a tournament by ID
    [Tags]    tournament    read
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    200
    ${tournament}=    Set Variable    ${response.json()}
    Should Be Equal    ${tournament}[tournament_id]    ${TOURNAMENT_ID}
    Should Be Equal    ${tournament}[name]    Torneio de Padel 2025

Test Update Tournament
    [Documentation]    Should update tournament details
    [Tags]    tournament    update
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    ${data}=    Create Dictionary    name=Torneio de Padel 2025 - Atualizado    courts=6
    ${response}=    PUT On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}    json=${data}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    200
    ${tournament}=    Set Variable    ${response.json()}
    Should Be Equal    ${tournament}[name]    Torneio de Padel 2025 - Atualizado
    Should Be Equal    ${tournament}[courts]    ${6}

Test Create Tournament Validation
    [Documentation]    Should return 400 when required fields are missing
    [Tags]    tournament    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    ${data}=    Create Dictionary    name=Torneio Incompleto
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments    json=${data}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response.status_code}    400

Test Create Tournament Invalid Dates
    [Documentation]    Should return 400 when start date is after end date
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Added category_ids requirement
    [Tags]    tournament    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create a test category first with unique name
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=Test Category Invalid Dates ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    ${category_ids}=    Create List    ${category_id}
    # Track for cleanup
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    ${data}=    Create Dictionary
    ...    name=Torneio Inválido
    ...    start_date=2025-06-15
    ...    end_date=2025-06-01
    ...    courts=4
    ...    start_time=08:00
    ...    end_time=23:00
    ...    match_duration_minutes=90
    ...    category_ids=${category_ids}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments    json=${data}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response.status_code}    400

Test Create Tournament Invalid Time Frame
    [Documentation]    Should return 400 when start time is after end time
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Added category_ids requirement
    [Tags]    tournament    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create a test category first with unique name
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=Test Category Invalid Time ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    ${category_ids}=    Create List    ${category_id}
    # Track for cleanup
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    ${data}=    Create Dictionary
    ...    name=Torneio Inválido
    ...    start_date=2025-06-01
    ...    end_date=2025-06-15
    ...    courts=4
    ...    start_time=23:00
    ...    end_time=08:00
    ...    match_duration_minutes=90
    ...    category_ids=${category_ids}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments    json=${data}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response.status_code}    400

Test Generate Group Stage Matches
    [Documentation]    Should generate group stage matches for a category
    [Tags]    tournament    generate
    # First, create a category and teams
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category with unique name
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=M5 Test ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category}=    Set Variable    ${cat_response.json()}
    ${category_id}=    Set Variable    ${category}[category_id]
    # Track for cleanup
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    # Create teams
    ${team1_data}=    Create Dictionary    name=Equipa A ${timestamp}    category_id=${category_id}
    ${team2_data}=    Create Dictionary    name=Equipa B ${timestamp}    category_id=${category_id}
    ${team3_data}=    Create Dictionary    name=Equipa C ${timestamp}    category_id=${category_id}
    ${team4_data}=    Create Dictionary    name=Equipa D ${timestamp}    category_id=${category_id}
    
    ${team1_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team1_data}    headers=${headers}
    ${team2_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team2_data}    headers=${headers}
    ${team3_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team3_data}    headers=${headers}
    ${team4_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team4_data}    headers=${headers}
    
    ${team1}=    Set Variable    ${team1_response.json()}
    ${team2}=    Set Variable    ${team2_response.json()}
    ${team3}=    Set Variable    ${team3_response.json()}
    ${team4}=    Set Variable    ${team4_response.json()}
    # Track for cleanup
    Append To List    ${CREATED_TEAMS}    ${team1}[team_id]    ${team2}[team_id]    ${team3}[team_id]    ${team4}[team_id]
    
    # Generate group stage matches
    ${top_team_ids}=    Create List    ${team1}[team_id]    ${team2}[team_id]
    ${generate_data}=    Create Dictionary
    ...    category_id=${category_id}
    ...    teams_per_group=4
    ...    top_team_ids=${top_team_ids}
    ...    auto_schedule=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-group-stage
    ...    json=${generate_data}    headers=${headers}
    
    Should Be Equal As Strings    ${response.status_code}    200
    ${result}=    Set Variable    ${response.json()}
    Should Be Equal    ${result}[success]    ${True}
    Should Be True    ${result}[matches_created] > 0
    Should Be Equal    ${result}[groups]    ${1}
    Should Be Equal    ${result}[auto_scheduled]    ${False}
    
    # Verify matches were created with tournament info
    ${matches_response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/matches    headers=${headers}
    Should Be Equal As Strings    ${matches_response.status_code}    200
    ${matches}=    Set Variable    ${matches_response.json()}
    Should Be True    ${matches}    Matches list should not be empty
    
    # Verify each match has tournament_id and tournament_name
    FOR    ${match}    IN    @{matches}
        Should Be Equal    ${match}[tournament_id]    ${TOURNAMENT_ID}
        Should Not Be Equal    ${match}[tournament_name]    N/A
    END

Test Generate Group Stage With Auto Schedule
    [Documentation]    Should generate and auto-schedule group stage matches
    [Tags]    tournament    generate    schedule
    # Skip if TOURNAMENT_ID is not set
    Run Keyword If    '${TOURNAMENT_ID}' == '${EMPTY}' or '${TOURNAMENT_ID}' == 'None'
    ...    Fail    TOURNAMENT_ID is not set. Run Test Create Tournament first.
    
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create a new category with teams for this test
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=M5 Auto Schedule ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    # Track for cleanup
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    # Create teams for this category
    ${team1_data}=    Create Dictionary    name=Auto Team A ${timestamp}    category_id=${category_id}
    ${team2_data}=    Create Dictionary    name=Auto Team B ${timestamp}    category_id=${category_id}
    ${team3_data}=    Create Dictionary    name=Auto Team C ${timestamp}    category_id=${category_id}
    ${team4_data}=    Create Dictionary    name=Auto Team D ${timestamp}    category_id=${category_id}
    
    ${team1_resp}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team1_data}    headers=${headers}
    ${team2_resp}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team2_data}    headers=${headers}
    ${team3_resp}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team3_data}    headers=${headers}
    ${team4_resp}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams    json=${team4_data}    headers=${headers}
    # Track for cleanup
    Append To List    ${CREATED_TEAMS}    ${team1_resp.json()}[team_id]    ${team2_resp.json()}[team_id]    ${team3_resp.json()}[team_id]    ${team4_resp.json()}[team_id]
    
    # Generate with auto-schedule
    ${empty_list}=    Create List
    ${generate_data}=    Create Dictionary
    ...    category_id=${category_id}
    ...    teams_per_group=4
    ...    top_team_ids=${empty_list}
    ...    auto_schedule=${True}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-group-stage
    ...    json=${generate_data}    headers=${headers}
    
    Should Be Equal As Strings    ${response.status_code}    200
    ${result}=    Set Variable    ${response.json()}
    Should Be Equal    ${result}[success]    ${True}
    Should Be Equal    ${result}[auto_scheduled]    ${True}
    Should Be True    ${result}[matches_created] > 0
    
    # Verify matches have scheduled_date, scheduled_time, and court
    ${matches_response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/matches    headers=${headers}
    Should Be Equal As Strings    ${matches_response.status_code}    200
    ${matches}=    Set Variable    ${matches_response.json()}
    
    # Filter matches from this generation (should have scheduled info)
    ${scheduled_matches}=    Filter Matches With Schedule    ${matches}
    ${scheduled_count}=    Get Length    ${scheduled_matches}
    Should Be True    ${scheduled_count} > 0    At least some matches should be scheduled. Found ${scheduled_count} scheduled out of ${matches} total matches.
    
    # Verify scheduled matches have all required fields
    FOR    ${match}    IN    @{scheduled_matches}
        Should Not Be Empty    ${match}[scheduled_date]
        Should Not Be Empty    ${match}[scheduled_time]
        Should Not Be Empty    ${match}[court]
        Should Be Equal As Strings    ${match}[status]    scheduled
    END

Test Generate Knockout Stage Matches
    [Documentation]    Should generate knockout stage matches
    [Tags]    tournament    generate
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Get teams from a category
    ${teams_response}=    GET    ${BASE_URL}/api/teams    headers=${headers}
    ${all_teams}=    Set Variable    ${teams_response.json()}
    
    # Need at least 2 teams
    Skip If    len(${all_teams}) < 2    Need at least 2 teams for knockout stage
    
    # Get category_id from first team
    ${category_id}=    Set Variable    ${all_teams}[0][category_id]
    ${category_teams}=    Filter Teams By Category    ${all_teams}    ${category_id}
    
    # Need at least 2 teams in this category
    Skip If    len(${category_teams}) < 2    Need at least 2 teams in category for knockout stage
    
    ${qualified_team_ids}=    Get Team IDs    ${category_teams}[0:2]
    
    ${generate_data}=    Create Dictionary
    ...    category_id=${category_id}
    ...    phase=Semi-final
    ...    qualified_team_ids=${qualified_team_ids}
    ...    auto_schedule=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-knockout-stage
    ...    json=${generate_data}    headers=${headers}
    
    Should Be Equal As Strings    ${response.status_code}    200
    ${result}=    Set Variable    ${response.json()}
    Should Be Equal    ${result}[success]    ${True}
    Should Be Equal    ${result}[phase]    Semi-final
    Should Be True    ${result}[matches_created] > 0

Test Get Tournament Matches
    [Documentation]    Should get all matches for a tournament
    [Tags]    tournament    read
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/matches    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    200
    ${matches}=    Set Variable    ${response.json()}
    Should Not Be None    ${matches}    Matches list should exist
    Should Be True    isinstance(${matches}, list)    Matches should be a list
    
    # Verify all matches belong to this tournament (if any exist)
    FOR    ${match}    IN    @{matches}
        Should Be Equal    ${match}[tournament_id]    ${TOURNAMENT_ID}
    END

Test Filter Matches By Tournament
    [Documentation]    Should filter matches by tournament_id
    [Tags]    tournament    read    filter
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${params}=    Create Dictionary    tournament_id=${TOURNAMENT_ID}
    ${response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/matches    headers=${headers}    params=${params}
    Should Be Equal As Strings    ${response.status_code}    200
    ${matches}=    Set Variable    ${response.json()}
    
    # Verify all matches belong to this tournament
    FOR    ${match}    IN    @{matches}
        Should Be Equal    ${match}[tournament_id]    ${TOURNAMENT_ID}
    END

Test Tournament Admin Access Required
    [Documentation]    Should require admin access for creating tournaments
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Added category_ids requirement
    [Tags]    tournament    security
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${empty_list}=    Create List
    ${data}=    Create Dictionary
    ...    name=Torneio Não Autorizado
    ...    start_date=2025-06-01
    ...    end_date=2025-06-15
    ...    courts=4
    ...    start_time=08:00
    ...    end_time=23:00
    ...    match_duration_minutes=90
    ...    category_ids=${empty_list}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments    json=${data}    headers=${headers}    expected_status=403
    Should Be Equal As Strings    ${response.status_code}    403

Test Delete Tournament
    [Documentation]    Should delete a tournament
    [Tags]    tournament    delete
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    204

*** Keywords ***
Filter Matches With Schedule
    [Arguments]    ${matches}
    ${scheduled}=    Create List
    FOR    ${match}    IN    @{matches}
        ${has_date}=    Run Keyword And Return Status    Should Not Be Empty    ${match}[scheduled_date]
        ${has_time}=    Run Keyword And Return Status    Should Not Be Empty    ${match}[scheduled_time]
        ${has_court}=    Run Keyword And Return Status    Should Not Be Empty    ${match}[court]
        ${is_scheduled}=    Evaluate    ${has_date} and ${has_time} and ${has_court}
        Run Keyword If    ${is_scheduled}    Append To List    ${scheduled}    ${match}
    END
    [Return]    ${scheduled}

Filter Teams By Category
    [Arguments]    ${all_teams}    ${category_id}
    ${filtered}=    Create List
    FOR    ${team}    IN    @{all_teams}
        IF    '${team}[category_id]' == '${category_id}'
            Append To List    ${filtered}    ${team}
        END
    END
    [Return]    ${filtered}

Get Team IDs
    [Arguments]    ${teams}
    ${ids}=    Create List
    FOR    ${team}    IN    @{teams}
        Append To List    ${ids}    ${team}[team_id]
    END
    [Return]    ${ids}

Suite Setup
    [Documentation]    Setup: Login as admin and get token
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Fixed endpoint and moved to Keywords section
    # Create session first
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    ${login_data}=    Create Dictionary    username=admin    password=admin123
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/auth/login    json=${login_data}
    Should Be Equal As Strings    ${response.status_code}    200
    ${token}=    Set Variable    ${response.json()}[token]
    Set Suite Variable    ${ADMIN_TOKEN}    ${token}
    # Initialize cleanup lists
    ${empty_list}=    Create List
    Set Suite Variable    ${CREATED_CATEGORIES}    ${empty_list}
    Set Suite Variable    ${CREATED_TEAMS}    ${empty_list}
    Set Suite Variable    ${CREATED_TOURNAMENTS}    ${empty_list}

Cleanup All Test Data
    [Documentation]    Clean up all test data: tournaments, matches, teams, and categories
    Run Keyword If    '${ADMIN_TOKEN}' == '${EMPTY}'    Return From Keyword
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Delete tournament and all its matches
    Run Keyword If    '${TOURNAMENT_ID}' != '${EMPTY}' and '${TOURNAMENT_ID}' != 'None' and '${TOURNAMENT_ID}' != ''    Delete Tournament And Matches    ${TOURNAMENT_ID}    ${headers}
    
    # Delete all created tournaments
    ${tournaments}=    Get Variable Value    ${CREATED_TOURNAMENTS}    @{EMPTY}
    FOR    ${tournament_id}    IN    @{tournaments}
        Run Keyword If    '${tournament_id}' != '${EMPTY}' and '${tournament_id}' != 'None' and '${tournament_id}' != ''    Delete Tournament And Matches    ${tournament_id}    ${headers}
    END
    
    # Delete all created teams
    ${teams}=    Get Variable Value    ${CREATED_TEAMS}    @{EMPTY}
    FOR    ${team_id}    IN    @{teams}
        Run Keyword If    '${team_id}' != '${EMPTY}' and '${team_id}' != 'None' and '${team_id}' != ''    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams/${team_id}    headers=${headers}    expected_status=any
    END
    
    # Delete all created categories (only test categories, not the original ones)
    ${categories}=    Get Variable Value    ${CREATED_CATEGORIES}    @{EMPTY}
    FOR    ${category_id}    IN    @{categories}
        Run Keyword If    '${category_id}' != '${EMPTY}' and '${category_id}' != 'None' and '${category_id}' != ''    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories/${category_id}    headers=${headers}    expected_status=any
    END
    
    # Also clean up any test categories by name pattern
    Cleanup Test Categories By Name Pattern    ${headers}
    
    # Delete session
    Delete All Sessions

Delete Tournament And Matches
    [Arguments]    ${tournament_id}    ${headers}
    # Get all matches for this tournament
    ${matches_response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${tournament_id}/matches    headers=${headers}
    Run Keyword If    '${matches_response}' != 'None' and ${matches_response.status_code} == 200    Delete All Tournament Matches    ${matches_response.json()}    ${headers}
    # Delete the tournament
    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${tournament_id}    headers=${headers}    expected_status=any

Delete All Tournament Matches
    [Arguments]    ${matches}    ${headers}
    FOR    ${match}    IN    @{matches}
        ${match_id}=    Get From Dictionary    ${match}    match_id
        Run Keyword If    '${match_id}' != 'None' and '${match_id}' != ''    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/matches/${match_id}    headers=${headers}    expected_status=any
    END

Cleanup Test Categories By Name Pattern
    [Arguments]    ${headers}
    # Get all categories
    ${response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    headers=${headers}
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Categories From List    ${response.json()}    ${headers}

Cleanup Test Categories From List
    [Arguments]    ${categories}    ${headers}
    # Original categories to keep: M3, M4, M5, F4, F5, MX
    ${keep_names}=    Create List    M3    M4    M5    F4    F5    MX
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        ${should_delete}=    Evaluate    '${name}' not in ${keep_names} and ('Test' in '${name}' or 'Auto' in '${name}' or 'Invalid' in '${name}' or 'Tournament' in '${name}')
        Run Keyword If    ${should_delete}    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories/${category}[category_id]    headers=${headers}    expected_status=any
    END
