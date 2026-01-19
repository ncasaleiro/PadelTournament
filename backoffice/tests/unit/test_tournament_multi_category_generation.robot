*** Settings ***
Documentation    Test suite for multi-category tournament match generation
Library          RequestsLibrary
Library          Collections
Library          DateTime

Suite Setup       Suite Setup
Suite Teardown    Suite Teardown
Test Teardown     Test Teardown

*** Variables ***
${BASE_URL}      http://localhost:3000
${SESSION_NAME}  backoffice_session
${ADMIN_USER}    admin
${ADMIN_PASS}    admin123
${ADMIN_TOKEN}   ${EMPTY}
${TOURNAMENT_ID}    ${EMPTY}
${CATEGORY_ID_1}    ${EMPTY}
${CATEGORY_ID_2}    ${EMPTY}
@{TEAM_IDS_1}       
@{TEAM_IDS_2}       
@{CATEGORY_IDS}     
&{TEAMS_PER_GROUP_BY_CATEGORY}    
@{TOP_TEAMS_CAT1}   
@{TOP_TEAMS_CAT2}   
&{DAY_1_OVERRIDE}   
&{DAY_2_OVERRIDE}   

*** Test Cases ***
Test Generate Group Stage Multi Category Success
    [Documentation]    Test successful generation of group stage matches for multiple categories
    [Tags]    multi-category    generation
    
    # Create tournament
    ${category_ids_list}=    Create List    ${CATEGORY_ID_1}    ${CATEGORY_ID_2}
    ${tournament_data}=    Create Dictionary
    ...    name=Multi Category Test Tournament
    ...    start_date=2025-06-01
    ...    end_date=2025-06-03
    ...    start_time=09:00
    ...    end_time=18:00
    ...    courts=2
    ...    match_duration_minutes=60
    ...    category_ids=${category_ids_list}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/tournaments
    ...    json=${tournament_data}
    ...    expected_status=201
    
    ${tournament_id}=    Set Variable    ${response.json()}[tournament_id]
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament_id}
    
    # Generate matches for multiple categories
    ${generate_data}=    Create Dictionary
    ...    category_ids=${CATEGORY_IDS}
    ...    teams_per_group_by_category=${TEAMS_PER_GROUP_BY_CATEGORY}
    ...    auto_schedule=${False}
    ...    use_super_tiebreak=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}
    ...    /api/tournaments/${tournament_id}/generate-group-stage-multiple
    ...    json=${generate_data}
    ...    expected_status=200
    
    Should Be Equal As Strings    ${response.json()}[success]    True
    Should Be True    ${response.json()}[total_matches_created] > 0
    Should Be Equal As Integers    ${response.json()}[categories_processed]    2
    
    # Verify matches were created
    ${matches}=    Set Variable    ${response.json()}[matches]
    Length Should Be    ${matches}    ${response.json()}[total_matches_created]
    
    # Verify matches belong to correct categories
    FOR    ${match}    IN    @{matches}
        Should Contain    ${match}[category_id]    ${CATEGORY_ID_1}    ${CATEGORY_ID_2}
        Should Be Equal As Strings    ${match}[phase]    Group
        Should Contain    ${match}[status]    draft    scheduled
    END

Test Generate Group Stage Multi Category With Auto Schedule
    [Documentation]    Test generation with auto-scheduling enabled
    [Tags]    multi-category    auto-schedule
    
    ${generate_data}=    Create Dictionary
    ...    category_ids=${CATEGORY_IDS}
    ...    teams_per_group_by_category=${TEAMS_PER_GROUP_BY_CATEGORY}
    ...    auto_schedule=${True}
    ...    use_super_tiebreak=${False}
    ...    start_date=2025-06-01
    ...    start_time=10:00
    
    ${response}=    POST On Session    ${SESSION_NAME}
    ...    /api/tournaments/${TOURNAMENT_ID}/generate-group-stage-multiple
    ...    json=${generate_data}
    ...    expected_status=200
    
    Should Be Equal As Strings    ${response.json()}[success]    True
    Should Be True    ${response.json()}[auto_scheduled]
    
    # Verify matches have scheduled dates and times
    ${matches}=    Set Variable    ${response.json()}[matches]
    FOR    ${match}    IN    @{matches}
        Should Not Be Empty    ${match}[scheduled_date]
        Should Not Be Empty    ${match}[scheduled_time]
        Should Not Be Empty    ${match}[court]
        Should Be Equal As Strings    ${match}[status]    scheduled
    END

Test Generate Group Stage Multi Category With Day Time Overrides
    [Documentation]    Test generation with day-specific time overrides
    [Tags]    multi-category    day-overrides
    
    ${day_overrides}=    Create Dictionary
    ...    2025-06-01=${DAY_1_OVERRIDE}
    ...    2025-06-02=${DAY_2_OVERRIDE}
    
    ${generate_data}=    Create Dictionary
    ...    category_ids=${CATEGORY_IDS}
    ...    teams_per_group_by_category=${TEAMS_PER_GROUP_BY_CATEGORY}
    ...    auto_schedule=${True}
    ...    start_date=2025-06-01
    ...    start_time=18:00
    ...    day_time_overrides=${day_overrides}
    
    ${response}=    POST On Session    ${SESSION_NAME}
    ...    /api/tournaments/${TOURNAMENT_ID}/generate-group-stage-multiple
    ...    json=${generate_data}
    ...    expected_status=200
    
    Should Be Equal As Strings    ${response.json()}[success]    True
    
    # Verify matches respect start time
    ${matches}=    Set Variable    ${response.json()}[matches]
    FOR    ${match}    IN    @{matches}
        ${scheduled_date}=    Set Variable    ${match}[scheduled_date]
        ${scheduled_time}=    Set Variable    ${match}[scheduled_time]
        
        Run Keyword If    '${scheduled_date}' == '2025-06-01'
        ...    Should Be True    '${scheduled_time}' >= '18:00'
    END

Test Generate Group Stage Multi Category With Top Teams
    [Documentation]    Test generation with top teams specified per category
    [Tags]    multi-category    top-teams
    
    ${top_teams_by_category}=    Create Dictionary
    ...    ${CATEGORY_ID_1}=${TOP_TEAMS_CAT1}
    ...    ${CATEGORY_ID_2}=${TOP_TEAMS_CAT2}
    
    ${generate_data}=    Create Dictionary
    ...    category_ids=${CATEGORY_IDS}
    ...    teams_per_group_by_category=${TEAMS_PER_GROUP_BY_CATEGORY}
    ...    top_team_ids_by_category=${top_teams_by_category}
    ...    auto_schedule=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}
    ...    /api/tournaments/${TOURNAMENT_ID}/generate-group-stage-multiple
    ...    json=${generate_data}
    ...    expected_status=200
    
    Should Be Equal As Strings    ${response.json()}[success]    True
    
    # Verify top teams are distributed correctly
    ${matches}=    Set Variable    ${response.json()}[matches]
    ${groups_cat1}=    Create List
    ${groups_cat2}=    Create List
    
    FOR    ${match}    IN    @{matches}
        Run Keyword If    ${match}[category_id] == ${CATEGORY_ID_1}
        ...    Append To List    ${groups_cat1}    ${match}[group_name]
        Run Keyword If    ${match}[category_id] == ${CATEGORY_ID_2}
        ...    Append To List    ${groups_cat2}    ${match}[group_name]
    END
    
    # Top teams should be in different groups
    ${unique_groups_cat1}=    Remove Duplicates    ${groups_cat1}
    ${unique_groups_cat2}=    Remove Duplicates    ${groups_cat2}
    Length Should Be Greater Than    ${unique_groups_cat1}    1
    Length Should Be Greater Than    ${unique_groups_cat2}    1

Test Generate Group Stage Multi Category Invalid Category
    [Documentation]    Test error handling for invalid category IDs
    [Tags]    multi-category    error-handling
    
    ${invalid_category_ids}=    Create List    99999    99998
    
    ${generate_data}=    Create Dictionary
    ...    category_ids=${invalid_category_ids}
    ...    teams_per_group_by_category=${TEAMS_PER_GROUP_BY_CATEGORY}
    ...    auto_schedule=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}
    ...    /api/tournaments/${TOURNAMENT_ID}/generate-group-stage-multiple
    ...    json=${generate_data}
    ...    expected_status=200
    
    # Should succeed but create 0 matches
    Should Be Equal As Strings    ${response.json()}[success]    True
    Should Be Equal As Integers    ${response.json()}[total_matches_created]    0
    Should Be Equal As Integers    ${response.json()}[categories_processed]    0

Test Generate Group Stage Multi Category Empty Category List
    [Documentation]    Test error handling for empty category list
    [Tags]    multi-category    error-handling
    
    ${empty_list}=    Create List
    ${generate_data}=    Create Dictionary
    ...    category_ids=${empty_list}
    ...    auto_schedule=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}
    ...    /api/tournaments/${TOURNAMENT_ID}/generate-group-stage-multiple
    ...    json=${generate_data}
    ...    expected_status=400
    
    Should Contain    ${response.json()}[error]    category_ids

Test Generate Group Stage Multi Category Different Teams Per Group
    [Documentation]    Test generation with different teams per group for each category
    [Tags]    multi-category    teams-per-group
    
    ${teams_per_group}=    Create Dictionary
    ...    ${CATEGORY_ID_1}=3
    ...    ${CATEGORY_ID_2}=4
    
    ${generate_data}=    Create Dictionary
    ...    category_ids=${CATEGORY_IDS}
    ...    teams_per_group_by_category=${teams_per_group}
    ...    auto_schedule=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}
    ...    /api/tournaments/${TOURNAMENT_ID}/generate-group-stage-multiple
    ...    json=${generate_data}
    ...    expected_status=200
    
    Should Be Equal As Strings    ${response.json()}[success]    True
    
    # Verify correct number of matches per category
    ${matches}=    Set Variable    ${response.json()}[matches]
    ${cat1_matches}=    Create List
    ${cat2_matches}=    Create List
    
    FOR    ${match}    IN    @{matches}
        Run Keyword If    ${match}[category_id] == ${CATEGORY_ID_1}
        ...    Append To List    ${cat1_matches}    ${match}
        Run Keyword If    ${match}[category_id] == ${CATEGORY_ID_2}
        ...    Append To List    ${cat2_matches}    ${match}
    END
    
    # Category 1: 8 teams, 3 per group = 3 groups, 3 matches per group = 9 matches
    # Category 2: 8 teams, 4 per group = 2 groups, 6 matches per group = 12 matches
    Length Should Be Greater Than    ${cat1_matches}    8
    Length Should Be Greater Than    ${cat2_matches}    11

*** Keywords ***
Suite Setup
    [Documentation]    Setup test suite: create session, login, create test data
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    
    # Login as admin
    ${login_data}=    Create Dictionary
    ...    username=${ADMIN_USER}
    ...    password=${ADMIN_PASS}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/auth/login
    ...    json=${login_data}
    ...    expected_status=200
    
    ${token}=    Set Variable    ${response.json()}[token]
    Set Suite Variable    ${ADMIN_TOKEN}    ${token}
    
    # Set authorization header
    Set Headers    ${SESSION_NAME}    Authorization=Bearer ${token}
    
    # Create test categories with unique names
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat1_data}=    Create Dictionary
    ...    name=M5 Test ${timestamp}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/categories
    ...    json=${cat1_data}
    ...    expected_status=201
    
    ${cat1_id}=    Set Variable    ${response.json()}[category_id]
    Set Suite Variable    ${CATEGORY_ID_1}    ${cat1_id}
    
    ${cat2_data}=    Create Dictionary
    ...    name=M4 Test ${timestamp}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/categories
    ...    json=${cat2_data}
    ...    expected_status=201
    
    ${cat2_id}=    Set Variable    ${response.json()}[category_id]
    Set Suite Variable    ${CATEGORY_ID_2}    ${cat2_id}
    
    # Create test teams (8 teams per category)
    ${teams_cat1}=    Create List
    ${teams_cat2}=    Create List
    
    FOR    ${i}    IN RANGE    8
        ${team_data}=    Create Dictionary
        ...    name=Team ${i+1} Cat1
        ...    category_id=${cat1_id}
        
        ${response}=    POST On Session    ${SESSION_NAME}    /api/teams
        ...    json=${team_data}
        ...    expected_status=201
        
        Append To List    ${teams_cat1}    ${response.json()}[team_id]
        
        ${team_data}=    Create Dictionary
        ...    name=Team ${i+1} Cat2
        ...    category_id=${cat2_id}
        
        ${response}=    POST On Session    ${SESSION_NAME}    /api/teams
        ...    json=${team_data}
        ...    expected_status=201
        
        Append To List    ${teams_cat2}    ${response.json()}[team_id]
    END
    
    Set Suite Variable    ${TEAM_IDS_1}    ${teams_cat1}
    Set Suite Variable    ${TEAM_IDS_2}    ${teams_cat2}
    
    # Set up variables for tests
    ${category_ids}=    Create List    ${cat1_id}    ${cat2_id}
    Set Suite Variable    ${CATEGORY_IDS}    ${category_ids}
    
    ${teams_per_group}=    Create Dictionary
    ...    ${cat1_id}=4
    ...    ${cat2_id}=4
    Set Suite Variable    ${TEAMS_PER_GROUP_BY_CATEGORY}    ${teams_per_group}
    
    ${top_teams_cat1}=    Create List    ${teams_cat1}[0]    ${teams_cat1}[1]
    ${top_teams_cat2}=    Create List    ${teams_cat2}[0]    ${teams_cat2}[1]
    Set Suite Variable    ${TOP_TEAMS_CAT1}    ${top_teams_cat1}
    Set Suite Variable    ${TOP_TEAMS_CAT2}    ${top_teams_cat2}
    
    ${day1_override}=    Create Dictionary
    ...    startTime=18:00
    ...    endTime=23:00
    Set Suite Variable    ${DAY_1_OVERRIDE}    ${day1_override}
    
    ${day2_override}=    Create Dictionary
    ...    startTime=09:00
    ...    endTime=18:00
    Set Suite Variable    ${DAY_2_OVERRIDE}    ${day2_override}

Suite Teardown
    [Documentation]    Cleanup: delete all test data
    # Delete tournament and matches
    Run Keyword If    '${TOURNAMENT_ID}' != '${EMPTY}'
    ...    DELETE On Session    ${SESSION_NAME}    /api/tournaments/${TOURNAMENT_ID}
    
    # Delete teams
    Run Keyword If    '${TEAM_IDS_1}' != '@{EMPTY}'
    ...    Delete Teams    ${TEAM_IDS_1}
    
    Run Keyword If    '${TEAM_IDS_2}' != '@{EMPTY}'
    ...    Delete Teams    ${TEAM_IDS_2}
    
    # Delete categories
    Run Keyword If    '${CATEGORY_ID_1}' != '${EMPTY}'
    ...    DELETE On Session    ${SESSION_NAME}    /api/categories/${CATEGORY_ID_1}
    
    Run Keyword If    '${CATEGORY_ID_2}' != '${EMPTY}'
    ...    DELETE On Session    ${SESSION_NAME}    /api/categories/${CATEGORY_ID_2}
    
    Delete All Sessions

Test Teardown
    [Documentation]    Cleanup after each test: delete matches from tournament
    Run Keyword If    '${TOURNAMENT_ID}' != '${EMPTY}'    Delete Tournament Matches

Delete Teams
    [Arguments]    @{team_ids}
    FOR    ${team_id}    IN    @{team_ids}
        DELETE On Session    ${SESSION_NAME}    /api/teams/${team_id}
    END

Delete Tournament Matches
    ${response}=    GET On Session    ${SESSION_NAME}
    ...    /api/matches    params=tournament_id=${TOURNAMENT_ID}
    
    Run Keyword If    ${response.status_code} == 200    Delete Matches    ${response.json()}

Delete Matches
    [Arguments]    @{matches}
    FOR    ${match}    IN    @{matches}
        DELETE On Session    ${SESSION_NAME}    /api/matches/${match}[match_id]
    END
