*** Settings ***
Documentation    Test suite for Teams API
Library    RequestsLibrary
Library    Collections
Resource    ../resources/common.robot

Suite Setup    Run Keywords
...    Create Session For API
...    Create Test Category
Suite Teardown    Delete All Sessions

*** Variables ***
${CATEGORY_ID}    ${EMPTY}
${TEAM_ID}       ${EMPTY}

*** Keywords ***
Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategory
    ${response}=    POST    ${API_BASE}/categories    json=${body}    headers=${headers}
    ${category_id}=    Get From Dictionary    ${response.json()}    category_id
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}

*** Test Cases ***
Test Create Team
    [Documentation]    Test creating a new team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=Team A    category_id=${CATEGORY_ID}    group_name=A
    ${response}=    POST    ${API_BASE}/teams    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    201
    Verify Response Contains    team_id
    Verify Response Contains    name    Team A
    Verify Response Contains    category_id    ${CATEGORY_ID}
    Verify Response Contains    group_name    A
    ${team_id}=    Get From Dictionary    ${response.json()}    team_id
    Set Suite Variable    ${TEAM_ID}    ${team_id}

Test Get All Teams
    [Documentation]    Test retrieving all teams
    ${response}=    GET    ${API_BASE}/teams
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Should Be True    ${response.json()}    List is not empty

Test Get Team By ID
    [Documentation]    Test retrieving a team by ID
    [Tags]    requires_team
    ${response}=    GET    ${API_BASE}/teams/${TEAM_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    team_id    ${TEAM_ID}
    Verify Response Contains    name    Team A

Test Get Teams By Category
    [Documentation]    Test retrieving teams filtered by category
    [Tags]    requires_team
    ${response}=    GET    ${API_BASE}/teams?category_id=${CATEGORY_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${teams}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${teams}
    FOR    ${team}    IN    @{teams}
        Should Be Equal    ${team}[category_id]    ${CATEGORY_ID}
    END

Test Get Teams By Group
    [Documentation]    Test retrieving teams filtered by group
    [Tags]    requires_team
    ${response}=    GET    ${API_BASE}/teams?category_id=${CATEGORY_ID}&group=A
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${teams}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${teams}
    FOR    ${team}    IN    @{teams}
        Should Be Equal    ${team}[group_name]    A
    END

Test Update Team
    [Documentation]    Test updating a team
    [Tags]    requires_team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=Team B Updated    category_id=${CATEGORY_ID}    group_name=B
    ${response}=    PUT    ${API_BASE}/teams/${TEAM_ID}    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    name    Team B Updated
    Verify Response Contains    group_name    B

Test Delete Team
    [Documentation]    Test deleting a team
    [Tags]    requires_team
    ${response}=    DELETE    ${API_BASE}/teams/${TEAM_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    204
    # Verify team is deleted
    ${response}=    GET    ${API_BASE}/teams/${TEAM_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    404

Test Create Team Without Required Fields
    [Documentation]    Test creating a team without required fields
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=Team C
    ${response}=    POST    ${API_BASE}/teams    json=${body}    headers=${headers}    expected_status=400
    Set Test Variable    ${response}    ${response}
    Verify Response Status    400

Test Create Teams For Both Groups
    [Documentation]    Test creating teams for Group A and Group B
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${team_a}=    Create Dictionary    name=Group A Team    category_id=${CATEGORY_ID}    group_name=A
    ${team_b}=    Create Dictionary    name=Group B Team    category_id=${CATEGORY_ID}    group_name=B
    ${response_a}=    POST    ${API_BASE}/teams    json=${team_a}    headers=${headers}
    ${response_b}=    POST    ${API_BASE}/teams    json=${team_b}    headers=${headers}
    Should Be Equal As Strings    ${response_a.status_code}    201
    Should Be Equal As Strings    ${response_b.status_code}    201
    ${team_a_id}=    Get From Dictionary    ${response_a.json()}    team_id
    ${team_b_id}=    Get From Dictionary    ${response_b.json()}    team_id
    Should Not Be Equal    ${team_a_id}    ${team_b_id}
    [Teardown]    Run Keywords
    ...    DELETE    ${API_BASE}/teams/${team_a_id}
    ...    AND    DELETE    ${API_BASE}/teams/${team_b_id}

