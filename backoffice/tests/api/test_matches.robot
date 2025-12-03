*** Settings ***
Documentation    Test suite for Matches API
Library    RequestsLibrary
Library    Collections
Resource    ../resources/common.robot

Suite Setup    Run Keywords
...    Create Session For API
...    Create Test Data
Suite Teardown    Delete All Sessions

*** Variables ***
${CATEGORY_ID}    ${EMPTY}
${TEAM1_ID}      ${EMPTY}
${TEAM2_ID}      ${EMPTY}
${MATCH_ID}      ${EMPTY}

*** Keywords ***
Create Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json
    # Create category
    ${cat_body}=    Create Dictionary    name=TestCategory
    ${cat_response}=    POST    ${API_BASE}/categories    json=${cat_body}    headers=${headers}
    ${category_id}=    Get From Dictionary    ${cat_response.json()}    category_id
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}
    
    # Create teams
    ${team1_body}=    Create Dictionary    name=Team 1    category_id=${category_id}    group_name=A
    ${team2_body}=    Create Dictionary    name=Team 2    category_id=${category_id}    group_name=A
    ${team1_response}=    POST    ${API_BASE}/teams    json=${team1_body}    headers=${headers}
    ${team2_response}=    POST    ${API_BASE}/teams    json=${team2_body}    headers=${headers}
    ${team1_id}=    Get From Dictionary    ${team1_response.json()}    team_id
    ${team2_id}=    Get From Dictionary    ${team2_response.json()}    team_id
    Set Suite Variable    ${TEAM1_ID}    ${team1_id}
    Set Suite Variable    ${TEAM2_ID}    ${team2_id}

*** Test Cases ***
Test Create Match
    [Documentation]    Test creating a new match
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
    ${response}=    POST    ${API_BASE}/matches    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    201
    Verify Response Contains    match_id
    Verify Response Contains    team1_id    ${TEAM1_ID}
    Verify Response Contains    team2_id    ${TEAM2_ID}
    Verify Response Contains    status    scheduled
    ${match_id}=    Get From Dictionary    ${response.json()}    match_id
    Set Suite Variable    ${MATCH_ID}    ${match_id}

Test Get All Matches
    [Documentation]    Test retrieving all matches
    ${response}=    GET    ${API_BASE}/matches
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Should Be True    ${response.json()}    List is not empty

Test Get Match By ID
    [Documentation]    Test retrieving a match by ID
    [Tags]    requires_match
    ${response}=    GET    ${API_BASE}/matches/${MATCH_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    match_id    ${MATCH_ID}
    Verify Response Contains    team1_name    Team 1
    Verify Response Contains    team2_name    Team 2

Test Get Matches By Category
    [Documentation]    Test retrieving matches filtered by category
    [Tags]    requires_match
    ${response}=    GET    ${API_BASE}/matches?category_id=${CATEGORY_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${matches}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${matches}
    FOR    ${match}    IN    @{matches}
        Should Be Equal    ${match}[category_id]    ${CATEGORY_ID}
    END

Test Get Matches By Status
    [Documentation]    Test retrieving matches filtered by status
    [Tags]    requires_match
    ${response}=    GET    ${API_BASE}/matches?status=scheduled
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${matches}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${matches}
    FOR    ${match}    IN    @{matches}
        Should Be Equal    ${match}[status]    scheduled
    END

Test Update Match
    [Documentation]    Test updating a match
    [Tags]    requires_match
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    group_name=A
    ...    scheduled_date=2025-12-11
    ...    scheduled_time=14:00
    ...    court=Court 2
    ${response}=    PUT    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    scheduled_time    14:00
    Verify Response Contains    court    Court 2

Test Delete Match
    [Documentation]    Test deleting a match
    [Tags]    requires_match
    ${response}=    DELETE    ${API_BASE}/matches/${MATCH_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    204
    # Verify match is deleted
    ${response}=    GET    ${API_BASE}/matches/${MATCH_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    404

Test Create Match With Different Phases
    [Documentation]    Test creating matches for different tournament phases
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${phases}=    Create List    Group    Semi-final    Final
    ${created_ids}=    Create List
    FOR    ${phase}    IN    @{phases}
        ${body}=    Create Dictionary
        ...    team1_id=${TEAM1_ID}
        ...    team2_id=${TEAM2_ID}
        ...    category_id=${CATEGORY_ID}
        ...    phase=${phase}
        ${response}=    POST    ${API_BASE}/matches    json=${body}    headers=${headers}
        Should Be Equal As Strings    ${response.status_code}    201
        ${match_id}=    Get From Dictionary    ${response.json()}    match_id
        Append To List    ${created_ids}    ${match_id}
    END
    [Teardown]    Run Keywords
    ...    FOR    ${match_id}    IN    @{created_ids}
    ...    DELETE    ${API_BASE}/matches/${match_id}
    ...    END

