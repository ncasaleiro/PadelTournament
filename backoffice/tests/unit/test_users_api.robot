*** Settings ***
Documentation    Unit tests for Users API - Full CRUD operations with cleanup
Library          RequestsLibrary
Library          Collections
Library          String

Suite Setup       Create Session For API
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test User

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${USER_ID}           ${EMPTY}
${TEST_USERNAME}     testuser_${EMPTY.replace(' ', '_')}

*** Test Cases ***
Test Get All Users
    [Documentation]    Should get all users
    [Tags]    user    get
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/users
    Status Should Be    200
    Should Be True    isinstance(${response.json()}, list)

Test Create User
    [Documentation]    Should create a new user
    [Tags]    user    create
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=${TEST_USERNAME}
    ...    password=testpass123
    ...    role=viewer
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/users    json=${body}    headers=${headers}
    Status Should Be    201
    Should Contain    ${response.json()}    user_id
    Should Contain    ${response.json()}    username
    Set Suite Variable    ${USER_ID}    ${response.json()['user_id']}
    Should Be Equal    ${response.json()['username']}    ${TEST_USERNAME}
    Should Be Equal    ${response.json()['role']}    viewer

Test Create User Without Required Fields
    [Documentation]    Should return 400 when creating user without required fields
    [Tags]    user    create    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    username=testuser
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/users    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Create User With Invalid Role
    [Documentation]    Should return 400 when creating user with invalid role
    [Tags]    user    create    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=testuser_invalid
    ...    password=testpass123
    ...    role=invalid_role
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/users    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400

Test Get User By ID
    [Documentation]    Should get user by id
    [Tags]    user    get
    [Setup]    Create Test User
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/users/${USER_ID}
    Status Should Be    200
    Should Be Equal    ${response.json()['user_id']}    ${USER_ID}
    Should Be Equal    ${response.json()['username']}    ${TEST_USERNAME}

Test Get Non-Existent User
    [Documentation]    Should return 404 for non-existent user
    [Tags]    user    get    error
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/users/99999    expected_status=404
    Status Should Be    404
    Should Contain    ${response.json()['error']}    not found

Test Update User
    [Documentation]    Should update user
    [Tags]    user    update
    [Setup]    Create Test User
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=updateduser_${EMPTY.replace(' ', '_')}
    ...    password=newpass123
    ...    role=referee
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/users/${USER_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['username']}    updateduser_${EMPTY.replace(' ', '_')}
    Should Be Equal    ${response.json()['role']}    referee
    Should Be Equal    ${response.json()['user_id']}    ${USER_ID}

Test Update Non-Existent User
    [Documentation]    Should return 404 when updating non-existent user
    [Tags]    user    update    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=updateduser
    ...    password=newpass123
    ...    role=viewer
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/users/99999    json=${body}    headers=${headers}    expected_status=404
    Status Should Be    404

Test Delete User
    [Documentation]    Should delete a user
    [Tags]    user    delete
    [Setup]    Create Test User
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/users/${USER_ID}
    Status Should Be    204
    # Verify deletion
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/users/${USER_ID}    expected_status=404
    Status Should Be    404

Test Delete Non-Existent User
    [Documentation]    Should return 404 when deleting non-existent user
    [Tags]    user    delete    error
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/users/99999    expected_status=404
    Status Should Be    404

*** Keywords ***
Create Session For API
    [Documentation]    Create HTTP session for API calls
    Create Session    ${SESSION_NAME}    ${BASE_URL}

Create Test User
    [Documentation]    Create a test user
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=${TEST_USERNAME}
    ...    password=testpass123
    ...    role=viewer
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/users    json=${body}    headers=${headers}
    Set Suite Variable    ${USER_ID}    ${response.json()['user_id']}

Cleanup Test User
    [Documentation]    Clean up test user created during tests
    Run Keyword If    '${USER_ID}' != '${EMPTY}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/users/${USER_ID}
    Set Suite Variable    ${USER_ID}    ${EMPTY}

Cleanup Test Data
    [Documentation]    Clean up all test data
    # Get all users and delete test ones
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/users
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Users From List    ${response.json()}

Cleanup Test Users From List
    [Documentation]    Clean up test users from a list
    [Arguments]    ${users}
    FOR    ${user}    IN    @{users}
        ${username}=    Get From Dictionary    ${user}    username
        Run Keyword If    'testuser' in '${username}' or 'updateduser' in '${username}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/users/${user['user_id']}
    END












