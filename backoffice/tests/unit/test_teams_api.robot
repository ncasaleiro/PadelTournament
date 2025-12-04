*** Settings ***
Documentation    Unit tests for Teams API - Full CRUD operations with cleanup
Library          RequestsLibrary
Library          Collections
Library          String

Suite Setup       Create Session For API
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test Teams    Cleanup Test Category

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${CATEGORY_ID}       ${EMPTY}
${TEAM1_ID}          ${EMPTY}
${TEAM2_ID}          ${EMPTY}

*** Test Cases ***
Test Get All Teams
    [Documentation]    Should get all teams
    [Tags]    team    get
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams
    Status Should Be    200
    Should Be True    isinstance(${response.json()}, list)

Test Create Team
    [Documentation]    Should create a new team
    [Tags]    team    create
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    name=TestTeam
    ...    category_id=${CATEGORY_ID}
    ...    group_name=A
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body}    headers=${headers}
    Status Should Be    201
    Should Contain    ${response.json()}    team_id
    Should Contain    ${response.json()}    name
    Set Suite Variable    ${TEAM1_ID}    ${response.json()['team_id']}
    Should Be Equal    ${response.json()['name']}    TestTeam
    Should Be Equal    ${response.json()['category_id']}    ${CATEGORY_ID}
    Should Be Equal    ${response.json()['group_name']}    A

Test Create Team Without Required Fields
    [Documentation]    Should return 400 when creating team without required fields
    [Tags]    team    create    error
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestTeam
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Get Team By ID
    [Documentation]    Should get team by id
    [Tags]    team    get
    [Setup]    Create Test Team
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}
    Status Should Be    200
    Should Be Equal    ${response.json()['team_id']}    ${TEAM1_ID}
    Should Be Equal    ${response.json()['name']}    TestTeam

Test Get Non-Existent Team
    [Documentation]    Should return 404 for non-existent team
    [Tags]    team    get    error
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/99999    expected_status=404
    Status Should Be    404
    Should Contain    ${response.json()['error']}    not found

Test Filter Teams By Category
    [Documentation]    Should filter teams by category
    [Tags]    team    filter
    [Setup]    Create Test Team
    ${params}=    Create Dictionary    category_id=${CATEGORY_ID}
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams    params=${params}
    Status Should Be    200
    Should Be True    len(${response.json()}) > 0
    FOR    ${team}    IN    @{response.json()}
        Should Be Equal    ${team['category_id']}    ${CATEGORY_ID}
    END

Test Filter Teams By Category And Group
    [Documentation]    Should filter teams by category and group
    [Tags]    team    filter
    [Setup]    Create Test Team
    ${params}=    Create Dictionary    category_id=${CATEGORY_ID}    group=A
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams    params=${params}
    Status Should Be    200
    Should Be True    len(${response.json()}) > 0
    FOR    ${team}    IN    @{response.json()}
        Should Be Equal    ${team['category_id']}    ${CATEGORY_ID}
        Should Be Equal    ${team['group_name']}    A
    END

Test Update Team
    [Documentation]    Should update team
    [Tags]    team    update
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    name=UpdatedTeam_${EMPTY.replace(' ', '_')}
    ...    category_id=${CATEGORY_ID}
    ...    group_name=B
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['name']}    UpdatedTeam_${EMPTY.replace(' ', '_')}
    Should Be Equal    ${response.json()['group_name']}    B
    Should Be Equal    ${response.json()['team_id']}    ${TEAM1_ID}

Test Update Team Without Required Fields
    [Documentation]    Should return 400 when updating team without required fields
    [Tags]    team    update    error
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=UpdatedTeam
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Update Non-Existent Team
    [Documentation]    Should return 404 when updating non-existent team
    [Tags]    team    update    error
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=UpdatedTeam    category_id=${CATEGORY_ID}    group_name=A
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/99999    json=${body}    headers=${headers}    expected_status=404
    Status Should Be    404

Test Delete Team
    [Documentation]    Should delete a team
    [Tags]    team    delete
    [Setup]    Create Test Team
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}
    Status Should Be    204
    # Verify deletion
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}    expected_status=404
    Status Should Be    404

Test Delete Non-Existent Team
    [Documentation]    Should return 404 when deleting non-existent team
    [Tags]    team    delete    error
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/99999    expected_status=404
    Status Should Be    404

*** Keywords ***
Create Session For API
    [Documentation]    Create HTTP session for API calls
    Create Session    ${SESSION_NAME}    ${BASE_URL}

Create Test Category
    [Documentation]    Create a test category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategory
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}

Create Test Team
    [Documentation]    Create a test team
    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    name=TestTeam
    ...    category_id=${CATEGORY_ID}
    ...    group_name=A
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body}    headers=${headers}
    Set Suite Variable    ${TEAM1_ID}    ${response.json()['team_id']}

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
    # Get all teams and delete test ones
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Teams From List    ${response.json()}
    # Get all categories and delete test ones
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Categories From List    ${response.json()}

Cleanup Test Teams From List
    [Documentation]    Clean up test teams from a list
    [Arguments]    ${teams}
    FOR    ${team}    IN    @{teams}
        ${name}=    Get From Dictionary    ${team}    name
        Run Keyword If    'TestTeam' in '${name}' or 'UpdatedTeam' in '${name}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/teams/${team['team_id']}
    END

Cleanup Test Categories From List
    [Documentation]    Clean up test categories from a list
    [Arguments]    ${categories}
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        Run Keyword If    'TestCategory' in '${name}' or 'UpdatedCategory' in '${name}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/categories/${category['category_id']}
    END

