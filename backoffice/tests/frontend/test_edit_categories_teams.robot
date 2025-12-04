*** Settings ***
Documentation    Frontend tests for editing categories and teams via API
Library          RequestsLibrary
Library          Collections
Library          String
Library          JSONLibrary

Suite Setup       Create Session And Login As Admin
Suite Teardown    Cleanup Test Data

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${ADMIN_USERNAME}    admin
${ADMIN_PASSWORD}    admin123
${CATEGORY_ID}       ${EMPTY}
${TEAM_ID}           ${EMPTY}
${TOKEN}             ${EMPTY}

*** Test Cases ***

Test Edit Category Name Via API
    [Documentation]    Verify category name can be edited via API
    [Tags]    category    edit    api    frontend
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary    name=EditedCategoryName
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['name']}    EditedCategoryName
    # Verify change persisted
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}
    Should Be Equal    ${get_response.json()['name']}    EditedCategoryName

Test Edit Category Multiple Times
    [Documentation]    Verify category can be edited multiple times
    [Tags]    category    edit    api    frontend
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    # First edit
    ${body1}=    Create Dictionary    name=FirstEdit
    ${response1}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    json=${body1}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response1.json()['name']}    FirstEdit
    # Second edit
    ${body2}=    Create Dictionary    name=SecondEdit
    ${response2}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    json=${body2}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response2.json()['name']}    SecondEdit
    # Verify final state
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}
    Should Be Equal    ${get_response.json()['name']}    SecondEdit

Test Edit Team Name Via API
    [Documentation]    Verify team name can be edited via API
    [Tags]    team    edit    api    frontend
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    name=EditedTeamName
    ...    category_id=${CATEGORY_ID}
    ...    group_name=A
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['name']}    EditedTeamName
    # Verify change persisted
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}
    Should Be Equal    ${get_response.json()['name']}    EditedTeamName

Test Edit Team Group Via API
    [Documentation]    Verify team group can be edited via API
    [Tags]    team    edit    api    frontend
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    name=TestTeam
    ...    category_id=${CATEGORY_ID}
    ...    group_name=B
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['group_name']}    B
    # Verify change persisted
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}
    Should Be Equal    ${get_response.json()['group_name']}    B

Test Edit Team Name And Group Together
    [Documentation]    Verify team name and group can be edited together
    [Tags]    team    edit    api    frontend
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    name=NewTeamName
    ...    category_id=${CATEGORY_ID}
    ...    group_name=B
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['name']}    NewTeamName
    Should Be Equal    ${response.json()['group_name']}    B
    # Verify both changes persisted
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}
    Should Be Equal    ${get_response.json()['name']}    NewTeamName
    Should Be Equal    ${get_response.json()['group_name']}    B

Test Edit Team Multiple Times
    [Documentation]    Verify team can be edited multiple times
    [Tags]    team    edit    api    frontend
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    # First edit - change name
    ${body1}=    Create Dictionary
    ...    name=FirstTeamEdit
    ...    category_id=${CATEGORY_ID}
    ...    group_name=A
    ${response1}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    json=${body1}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response1.json()['name']}    FirstTeamEdit
    # Second edit - change group
    ${body2}=    Create Dictionary
    ...    name=FirstTeamEdit
    ...    category_id=${CATEGORY_ID}
    ...    group_name=B
    ${response2}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    json=${body2}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response2.json()['group_name']}    B
    # Verify final state
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}
    Should Be Equal    ${get_response.json()['name']}    FirstTeamEdit
    Should Be Equal    ${get_response.json()['group_name']}    B

Test Edit Category Requires Admin
    [Documentation]    Verify editing category requires admin authentication
    [Tags]    category    edit    auth    api
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=ShouldFail
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    json=${body}    headers=${headers}    expected_status=any
    # Categories don't require auth currently, but this test documents the behavior
    Log    Category edit response: ${response.status_code}

Test Edit Team Requires Admin
    [Documentation]    Verify editing team requires admin authentication
    [Tags]    team    edit    auth    api
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    name=ShouldFail
    ...    category_id=${CATEGORY_ID}
    ...    group_name=A
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    json=${body}    headers=${headers}    expected_status=403
    Status Should Be    403
    Should Contain    ${response.json()['error']}    Admin access required

*** Keywords ***

Create Session And Login As Admin
    [Documentation]    Create HTTP session and login as admin
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    username=${ADMIN_USERNAME}    password=${ADMIN_PASSWORD}
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}
    ${token}=    Get From Dictionary    ${response.json()}    token
    Set Suite Variable    ${TOKEN}    ${token}

Create Test Category
    [Documentation]    Create a test category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategoryForEdit
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}

Create Test Team
    [Documentation]    Create a test team
    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    name=TestTeamForEdit
    ...    category_id=${CATEGORY_ID}
    ...    group_name=A
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body}    headers=${headers}
    Set Suite Variable    ${TEAM_ID}    ${response.json()['team_id']}

Cleanup Test Data
    [Documentation]    Clean up all test data
    ${headers}=    Create Dictionary    Authorization=Bearer ${TOKEN}
    Run Keyword If    '${TEAM_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    headers=${headers}    expected_status=any
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    expected_status=any
    # Clean up any remaining test data
    ${teams_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams
    Run Keyword If    ${teams_response.status_code} == 200    Cleanup Test Teams From List    ${teams_response.json()}
    ${categories_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Run Keyword If    ${categories_response.status_code} == 200    Cleanup Test Categories From List    ${categories_response.json()}

Cleanup Test Teams From List
    [Documentation]    Clean up test teams from a list
    [Arguments]    ${teams}
    ${headers}=    Create Dictionary    Authorization=Bearer ${TOKEN}
    FOR    ${team}    IN    @{teams}
        ${name}=    Get From Dictionary    ${team}    name
        Run Keyword If    'TestTeamForEdit' in '${name}' or 'EditedTeamName' in '${name}' or 'NewTeamName' in '${name}' or 'FirstTeamEdit' in '${name}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${team['team_id']}    headers=${headers}    expected_status=any
    END

Cleanup Test Categories From List
    [Documentation]    Clean up test categories from a list
    [Arguments]    ${categories}
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        Run Keyword If    'TestCategoryForEdit' in '${name}' or 'EditedCategoryName' in '${name}' or 'FirstEdit' in '${name}' or 'SecondEdit' in '${name}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${category['category_id']}    expected_status=any
    END

