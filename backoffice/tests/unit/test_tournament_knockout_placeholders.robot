*** Settings ***
Documentation    Test tournament knockout stage placeholder generation
...              Tests generating semi-finals and final matches without qualified teams (placeholder slots)
Library          RequestsLibrary
Library          Collections
Library          DateTime

Suite Setup       Suite Setup
Suite Teardown    Cleanup All Test Data

*** Variables ***
${BASE_URL}      http://localhost:3000
${ADMIN_TOKEN}   ${EMPTY}
${TOURNAMENT_ID}    ${EMPTY}
@{CREATED_CATEGORIES}    ${EMPTY}
@{CREATED_TEAMS}    ${EMPTY}
@{CREATED_TOURNAMENTS}    ${EMPTY}
@{CREATED_MATCHES}    ${EMPTY}
${SESSION_NAME}    api_session

*** Test Cases ***

Test Generate Semi Finals Placeholders For Category
    [Documentation]    Should generate 2 semi-final placeholder matches for a category without teams
    [Tags]    tournament    knockout    placeholders
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create a test category
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=Test Category Semi Final ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    # Generate semi-finals with placeholders
    ${generate_data}=    Create Dictionary
    ...    category_id=${category_id}
    ...    phase=Semi-final
    ...    create_placeholders=${True}
    ...    auto_schedule=${True}
    ...    use_super_tiebreak=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-knockout-stage
    ...    json=${generate_data}    headers=${headers}
    
    Should Be Equal As Strings    ${response.status_code}    200
    ${result}=    Set Variable    ${response.json()}
    Should Be Equal    ${result}[success]    ${True}
    Should Be Equal    ${result}[phase]    Semi-final
    Should Be Equal    ${result}[matches_created]    ${2}
    
    # Verify matches are placeholders
    ${matches}=    Set Variable    ${result}[matches]
    Should Be Equal    ${matches}[0][team1_id]    ${None}
    Should Be Equal    ${matches}[0][team2_id]    ${None}
    Should Be Equal    ${matches}[1][team1_id]    ${None}
    Should Be Equal    ${matches}[1][team2_id]    ${None}
    
    # Verify matches have scheduled slots if auto_schedule was true
    FOR    ${match}    IN    @{matches}
        Should Not Be Empty    ${match}[scheduled_date]
        Should Not Be Empty    ${match}[scheduled_time]
        Should Not Be Empty    ${match}[court]
        Should Be Equal As Strings    ${match}[status]    scheduled
        Should Be Equal    ${match}[phase]    Semi-final
        Should Be Equal    ${match}[category_id]    ${category_id}
    END
    
    # Track matches for cleanup
    FOR    ${match}    IN    @{matches}
        Append To List    ${CREATED_MATCHES}    ${match}[match_id]
    END

Test Generate Final Placeholder For Category
    [Documentation]    Should generate 1 final placeholder match for a category without teams
    [Tags]    tournament    knockout    placeholders
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create a test category
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=Test Category Final ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    # Generate final with placeholder
    ${generate_data}=    Create Dictionary
    ...    category_id=${category_id}
    ...    phase=Final
    ...    create_placeholders=${True}
    ...    auto_schedule=${True}
    ...    use_super_tiebreak=${False}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-knockout-stage
    ...    json=${generate_data}    headers=${headers}
    
    Should Be Equal As Strings    ${response.status_code}    200
    ${result}=    Set Variable    ${response.json()}
    Should Be Equal    ${result}[success]    ${True}
    Should Be Equal    ${result}[phase]    Final
    Should Be Equal    ${result}[matches_created]    ${1}
    
    # Verify match is placeholder
    ${matches}=    Set Variable    ${result}[matches]
    Should Be Equal    ${matches}[0][team1_id]    ${None}
    Should Be Equal    ${matches}[0][team2_id]    ${None}
    
    # Verify match has scheduled slot
    Should Not Be Empty    ${matches}[0][scheduled_date]
    Should Not Be Empty    ${matches}[0][scheduled_time]
    Should Not Be Empty    ${matches}[0][court]
    Should Be Equal As Strings    ${matches}[0][status]    scheduled
    Should Be Equal    ${matches}[0][phase]    Final
    Should Be Equal    ${matches}[0][category_id]    ${category_id}
    
    # Track match for cleanup
    Append To List    ${CREATED_MATCHES}    ${matches}[0][match_id]

Test Generate Semi Finals And Final Placeholders Multiple Categories
    [Documentation]    Should generate semi-finals and final placeholders for multiple categories
    [Tags]    tournament    knockout    placeholders    multi-category
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create 2 test categories
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat1_data}=    Create Dictionary    name=Test Category SF1 ${timestamp}
    ${cat1_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat1_data}    headers=${headers}
    ${category1_id}=    Set Variable    ${cat1_response.json()}[category_id]
    Append To List    ${CREATED_CATEGORIES}    ${category1_id}
    
    ${cat2_data}=    Create Dictionary    name=Test Category SF2 ${timestamp}
    ${cat2_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat2_data}    headers=${headers}
    ${category2_id}=    Set Variable    ${cat2_response.json()}[category_id]
    Append To List    ${CREATED_CATEGORIES}    ${category2_id}
    
    # Generate semi-finals for category 1
    ${sf1_data}=    Create Dictionary
    ...    category_id=${category1_id}
    ...    phase=Semi-final
    ...    create_placeholders=${True}
    ...    auto_schedule=${True}
    
    ${sf1_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-knockout-stage
    ...    json=${sf1_data}    headers=${headers}
    Should Be Equal As Strings    ${sf1_response.status_code}    200
    Should Be Equal    ${sf1_response.json()}[matches_created]    ${2}
    
    # Generate semi-finals for category 2
    ${sf2_data}=    Create Dictionary
    ...    category_id=${category2_id}
    ...    phase=Semi-final
    ...    create_placeholders=${True}
    ...    auto_schedule=${True}
    
    ${sf2_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-knockout-stage
    ...    json=${sf2_data}    headers=${headers}
    Should Be Equal As Strings    ${sf2_response.status_code}    200
    Should Be Equal    ${sf2_response.json()}[matches_created]    ${2}
    
    # Generate final for category 1
    ${final1_data}=    Create Dictionary
    ...    category_id=${category1_id}
    ...    phase=Final
    ...    create_placeholders=${True}
    ...    auto_schedule=${True}
    
    ${final1_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-knockout-stage
    ...    json=${final1_data}    headers=${headers}
    Should Be Equal As Strings    ${final1_response.status_code}    200
    Should Be Equal    ${final1_response.json()}[matches_created]    ${1}
    
    # Generate final for category 2
    ${final2_data}=    Create Dictionary
    ...    category_id=${category2_id}
    ...    phase=Final
    ...    create_placeholders=${True}
    ...    auto_schedule=${True}
    
    ${final2_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/generate-knockout-stage
    ...    json=${final2_data}    headers=${headers}
    Should Be Equal As Strings    ${final2_response.status_code}    200
    Should Be Equal    ${final2_response.json()}[matches_created]    ${1}
    
    # Verify total: 2 semi-finals + 1 final per category = 6 matches total
    ${all_matches_response}=    GET On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments/${TOURNAMENT_ID}/matches    headers=${headers}
    ${all_matches}=    Set Variable    ${all_matches_response.json()}
    ${category1_matches}=    Filter Matches By Category    ${all_matches}    ${category1_id}
    ${category2_matches}=    Filter Matches By Category    ${all_matches}    ${category2_id}
    
    Should Be Equal    ${category1_matches}[0][phase]    Semi-final
    Should Be Equal    ${category1_matches}[1][phase]    Semi-final
    Should Be Equal    ${category1_matches}[2][phase]    Final
    
    Should Be Equal    ${category2_matches}[0][phase]    Semi-final
    Should Be Equal    ${category2_matches}[1][phase]    Semi-final
    Should Be Equal    ${category2_matches}[2][phase]    Final

*** Keywords ***

Suite Setup
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    ${login_data}=    Create Dictionary    username=admin    password=admin123
    ${login_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/auth/login    json=${login_data}
    Should Be Equal As Strings    ${login_response.status_code}    200
    Set Suite Variable    ${ADMIN_TOKEN}    ${login_response.json()}[token]
    
    # Create a tournament for testing
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat_data}=    Create Dictionary    name=Test Category Tournament ${timestamp}
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    ${category_ids}=    Create List    ${category_id}
    Append To List    ${CREATED_CATEGORIES}    ${category_id}
    
    ${tournament_data}=    Create Dictionary
    ...    name=Test Tournament Placeholders ${timestamp}
    ...    start_date=2025-12-15
    ...    end_date=2025-12-17
    ...    courts=4
    ...    start_time=08:00
    ...    end_time=23:00
    ...    match_duration_minutes=90
    ...    category_ids=${category_ids}
    ...    knockout_stage_type=semi_final
    
    ${tournament_response}=    POST On Session    ${SESSION_NAME}    ${BASE_URL}/api/tournaments    json=${tournament_data}    headers=${headers}
    Should Be Equal As Strings    ${tournament_response.status_code}    201
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament_response.json()}[tournament_id]
    Append To List    ${CREATED_TOURNAMENTS}    ${TOURNAMENT_ID}

Cleanup All Test Data
    Run Keyword If    '${ADMIN_TOKEN}' == '${EMPTY}'    Return From Keyword
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Delete tournament and all its matches first
    Run Keyword If    '${TOURNAMENT_ID}' != '${EMPTY}' and '${TOURNAMENT_ID}' != 'None' and '${TOURNAMENT_ID}' != ''    Delete Tournament And Matches    ${TOURNAMENT_ID}    ${headers}
    
    # Delete all created tournaments
    FOR    ${tournament_id}    IN    @{CREATED_TOURNAMENTS}
        Run Keyword If    '${tournament_id}' != '${EMPTY}' and '${tournament_id}' != 'None' and '${tournament_id}' != ''    Delete Tournament And Matches    ${tournament_id}    ${headers}
    END
    
    # Delete all created teams
    FOR    ${team_id}    IN    @{CREATED_TEAMS}
        Run Keyword If    '${team_id}' != '${EMPTY}' and '${team_id}' != 'None' and '${team_id}' != ''    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/teams/${team_id}    headers=${headers}    expected_status=any
    END
    
    # Delete all created categories
    FOR    ${category_id}    IN    @{CREATED_CATEGORIES}
        Run Keyword If    '${category_id}' != '${EMPTY}' and '${category_id}' != 'None' and '${category_id}' != ''    DELETE On Session    ${SESSION_NAME}    ${BASE_URL}/api/categories/${category_id}    headers=${headers}    expected_status=any
    END
    
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

Filter Matches By Category
    [Arguments]    ${matches}    ${category_id}
    ${filtered}=    Create List
    FOR    ${match}    IN    @{matches}
        ${match_cat_id}=    Get From Dictionary    ${match}    category_id
        Run Keyword If    ${match_cat_id} == ${category_id}    Append To List    ${filtered}    ${match}
    END
    [Return]    ${filtered}

