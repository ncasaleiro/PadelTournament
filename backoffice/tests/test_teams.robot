*** Settings ***
Documentation    Test Suite for Teams API
Resource         keywords/common.robot
Test Setup       Setup Test Data
Test Teardown    Cleanup Test Data

*** Variables ***
${TEAM_NAME}        Test Team Alpha
${UPDATED_TEAM}     Updated Team Alpha
${GROUP_A}          A
${GROUP_B}          B

*** Test Cases ***
Test Create Team
    [Documentation]    Test creating a new team
    ${data}=    Create Dictionary    name=${TEAM_NAME}    category_id=${CATEGORY_ID}    group_name=${GROUP_A}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${data}
    ${json}=    Get Response Json    ${response}
    Response Should Contain Key    ${response}    team_id
    Response Should Contain Key    ${response}    name
    Response Should Contain Key    ${response}    category_id
    Response Should Contain Key    ${response}    group_name
    Should Be Equal    ${json}[name]    ${TEAM_NAME}
    Should Be Equal As Numbers    ${json}[category_id]    ${CATEGORY_ID}
    Should Be Equal    ${json}[group_name]    ${GROUP_A}
    Set Suite Variable    ${TEAM_ID}    ${json}[team_id]

Test Get All Teams
    [Documentation]    Test getting all teams
    Create Test Team
    ${response}=    Get Request And Check Status    ${API_PREFIX}/teams
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Teams list should not be empty

Test Get Team By Id
    [Documentation]    Test getting a team by ID
    Create Test Team
    ${response}=    Get Request And Check Status    ${API_PREFIX}/teams/${TEAM_ID}
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[name]    ${TEAM_NAME}
    Should Be Equal As Numbers    ${json}[team_id]    ${TEAM_ID}

Test Get Teams By Category
    [Documentation]    Test getting teams filtered by category
    Create Test Team
    ${response}=    Get Request And Check Status    ${API_PREFIX}/teams?category_id=${CATEGORY_ID}
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Teams list should not be empty
    FOR    ${team}    IN    @{json}
        Should Be Equal As Numbers    ${team}[category_id]    ${CATEGORY_ID}
    END

Test Get Teams By Group
    [Documentation]    Test getting teams filtered by group
    Create Test Team
    ${response}=    Get Request And Check Status    ${API_PREFIX}/teams?category_id=${CATEGORY_ID}&group=${GROUP_A}
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Teams list should not be empty
    FOR    ${team}    IN    @{json}
        Should Be Equal    ${team}[group_name]    ${GROUP_A}
    END

Test Update Team
    [Documentation]    Test updating a team
    Create Test Team
    ${data}=    Create Dictionary    name=${UPDATED_TEAM}    category_id=${CATEGORY_ID}    group_name=${GROUP_B}
    ${response}=    Put Request And Check Status    ${API_PREFIX}/teams/${TEAM_ID}    ${data}
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[name]    ${UPDATED_TEAM}
    Should Be Equal    ${json}[group_name]    ${GROUP_B}

Test Delete Team
    [Documentation]    Test deleting a team
    Create Test Team
    Delete Request And Check Status    ${API_PREFIX}/teams/${TEAM_ID}
    ${response}=    Get Request And Check Status    ${API_PREFIX}/teams/${TEAM_ID}    expected_status=404

Test Create Team Without Required Fields
    [Documentation]    Test creating team without required fields
    ${data}=    Create Dictionary    name=${TEAM_NAME}
    ${response}=    POST On Session    api    ${API_PREFIX}/teams    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    400

*** Keywords ***
Setup Test Data
    [Documentation]    Setup test data (create category)
    Create API Session
    ${data}=    Create Dictionary    name=Test Category for Teams
    ${response}=    Post Request And Check Status    ${API_PREFIX}/categories    ${data}
    ${json}=    Get Response Json    ${response}
    Set Suite Variable    ${CATEGORY_ID}    ${json}[category_id]

Cleanup Test Data
    [Documentation]    Cleanup test data
    Run Keyword If    '${TEAM_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/teams/${TEAM_ID}
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}
    Delete API Session

Create Test Team
    [Documentation]    Helper keyword to create a test team
    ${data}=    Create Dictionary    name=${TEAM_NAME}    category_id=${CATEGORY_ID}    group_name=${GROUP_A}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${data}
    ${json}=    Get Response Json    ${response}
    Set Suite Variable    ${TEAM_ID}    ${json}[team_id]

