*** Settings ***
Documentation    Unit tests for Authentication API - Login functionality
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
${TEST_USERNAME}     testuser_auth
${JWT_TOKEN}        ${EMPTY}

*** Test Cases ***
Test Login With Valid Credentials
    [Documentation]    Should login with valid credentials and return JWT token
    [Tags]    auth    login
    [Setup]    Create Test User
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=${TEST_USERNAME}
    ...    password=testpass123
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}
    Status Should Be    200
    Should Contain    ${response.json()}    token
    Should Contain    ${response.json()}    user
    Set Suite Variable    ${JWT_TOKEN}    ${response.json()['token']}
    Should Be Equal    ${response.json()['user']['username']}    ${TEST_USERNAME}
    Should Be Equal    ${response.json()['user']['role']}    viewer
    Should Contain    ${response.json()['user']}    user_id

Test Login With Invalid Username
    [Documentation]    Should return 401 when login with invalid username
    [Tags]    auth    login    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=invaliduser
    ...    password=testpass123
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}    expected_status=401
    Status Should Be    401
    Should Contain    ${response.json()['error']}    Invalid credentials

Test Login With Invalid Password
    [Documentation]    Should return 401 when login with invalid password
    [Tags]    auth    login    error
    [Setup]    Create Test User
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=${TEST_USERNAME}
    ...    password=wrongpassword
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}    expected_status=401
    Status Should Be    401
    Should Contain    ${response.json()['error']}    Invalid credentials

Test Login Without Username
    [Documentation]    Should return 400 when login without username
    [Tags]    auth    login    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    password=testpass123
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Login Without Password
    [Documentation]    Should return 400 when login without password
    [Tags]    auth    login    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    username=testuser
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Login With Admin Credentials
    [Documentation]    Should login with admin credentials
    [Tags]    auth    login    admin
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=admin
    ...    password=admin123
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}
    Status Should Be    200
    Should Contain    ${response.json()}    token
    Should Be Equal    ${response.json()['user']['username']}    admin
    Should Be Equal    ${response.json()['user']['role']}    admin

Test Login With Referee Credentials
    [Documentation]    Should login with referee credentials
    [Tags]    auth    login    referee
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=referee
    ...    password=referee123
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}
    Status Should Be    200
    Should Contain    ${response.json()}    token
    Should Be Equal    ${response.json()['user']['username']}    referee
    Should Be Equal    ${response.json()['user']['role']}    referee

Test JWT Token Structure
    [Documentation]    Should return valid JWT token structure
    [Tags]    auth    login    jwt
    [Setup]    Create Test User
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    username=${TEST_USERNAME}
    ...    password=testpass123
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}
    Status Should Be    200
    ${token}=    Get From Dictionary    ${response.json()}    token
    Should Not Be Empty    ${token}
    Should Match Regexp    ${token}    ^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+$

*** Keywords ***
Create Session For API
    [Documentation]    Create HTTP session for API calls
    Create Session    ${SESSION_NAME}    ${BASE_URL}

Create Test User
    [Documentation]    Create a test user for authentication tests
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
        Run Keyword If    'testuser_auth' in '${username}'    Delete Request    ${SESSION_NAME}    ${API_BASE}/users/${user['user_id']}
    END

