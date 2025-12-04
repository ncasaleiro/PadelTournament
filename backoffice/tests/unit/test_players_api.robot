*** Settings ***
Documentation    Unit tests for Players API - Full CRUD operations with cleanup
Library          RequestsLibrary
Library          Collections
Library          String

Suite Setup       Create Session And Login As Admin
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test Players    Cleanup Test Team    Cleanup Test Category

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${CATEGORY_ID}       ${EMPTY}
${TEAM_ID}           ${EMPTY}
${PLAYER1_ID}        ${EMPTY}
${PLAYER2_ID}        ${EMPTY}
${ADMIN_TOKEN}       ${EMPTY}
${ADMIN_USERNAME}    admin
${ADMIN_PASSWORD}    admin123

*** Test Cases ***
Test Get All Players
    [Documentation]    Should get all players
    [Tags]    player    get
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/players
    Status Should Be    200
    Should Be True    isinstance(${response.json()}, list)

Test Create Player
    [Documentation]    Should create a new player
    [Tags]    player    create
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    name=TestPlayer
    ...    team_id=${TEAM_ID}
    ...    contact_info=test@example.com
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/players    json=${body}    headers=${headers}
    Status Should Be    201
    Should Contain    ${response.json()}    player_id
    Should Contain    ${response.json()}    name
    Set Suite Variable    ${PLAYER1_ID}    ${response.json()['player_id']}
    Should Be Equal    ${response.json()['name']}    TestPlayer
    Should Be Equal    ${response.json()['team_id']}    ${TEAM_ID}
    Should Be Equal    ${response.json()['contact_info']}    test@example.com

Test Create Player Without Required Fields
    [Documentation]    Should return 400 when creating player without required fields
    [Tags]    player    create    error
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestPlayer
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/players    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Get Player By ID
    [Documentation]    Should get player by id
    [Tags]    player    get
    [Setup]    Create Test Player
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/players/${PLAYER1_ID}
    Status Should Be    200
    Should Be Equal    ${response.json()['player_id']}    ${PLAYER1_ID}
    Should Be Equal    ${response.json()['name']}    TestPlayer

Test Get Non-Existent Player
    [Documentation]    Should return 404 for non-existent player
    [Tags]    player    get    error
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/players/99999    expected_status=404
    Status Should Be    404
    Should Contain    ${response.json()['error']}    not found

Test Filter Players By Team
    [Documentation]    Should filter players by team
    [Tags]    player    filter
    [Setup]    Create Test Player
    ${params}=    Create Dictionary    team_id=${TEAM_ID}
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/players    params=${params}
    Status Should Be    200
    Should Be True    len(${response.json()}) > 0
    FOR    ${player}    IN    @{response.json()}
        Should Be Equal    ${player['team_id']}    ${TEAM_ID}
    END

Test Update Player
    [Documentation]    Should update player
    [Tags]    player    update
    [Setup]    Create Test Player
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    name=UpdatedPlayer
    ...    team_id=${TEAM_ID}
    ...    contact_info=updated@example.com
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/players/${PLAYER1_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['name']}    UpdatedPlayer
    Should Be Equal    ${response.json()['contact_info']}    updated@example.com
    Should Be Equal    ${response.json()['player_id']}    ${PLAYER1_ID}

Test Update Player Without Required Fields
    [Documentation]    Should return 400 when updating player without required fields
    [Tags]    player    update    error
    [Setup]    Create Test Player
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=UpdatedPlayer
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/players/${PLAYER1_ID}    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Update Non-Existent Player
    [Documentation]    Should return 404 when updating non-existent player
    [Tags]    player    update    error
    [Setup]    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=UpdatedPlayer    team_id=${TEAM_ID}
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/players/99999    json=${body}    headers=${headers}    expected_status=404
    Status Should Be    404

Test Delete Player
    [Documentation]    Should delete a player
    [Tags]    player    delete
    [Setup]    Create Test Player
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/players/${PLAYER1_ID}
    Status Should Be    204
    # Verify deletion
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/players/${PLAYER1_ID}    expected_status=404
    Status Should Be    404

Test Delete Non-Existent Player
    [Documentation]    Should return 404 when deleting non-existent player
    [Tags]    player    delete    error
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/players/99999    expected_status=404
    Status Should Be    404

*** Keywords ***
Create Session And Login As Admin
    [Documentation]    Create HTTP session and login as admin
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    username=${ADMIN_USERNAME}    password=${ADMIN_PASSWORD}
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}
    ${token}=    Get From Dictionary    ${response.json()}    token
    Set Suite Variable    ${ADMIN_TOKEN}    ${token}

Create Test Category
    [Documentation]    Create a test category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategory
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}

Create Test Team
    [Documentation]    Create a test team
    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    ${body}=    Create Dictionary
    ...    name=TestTeam
    ...    category_id=${CATEGORY_ID}
    ...    group_name=A
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body}    headers=${headers}
    Set Suite Variable    ${TEAM_ID}    ${response.json()['team_id']}

Create Test Player
    [Documentation]    Create a test player
    Create Test Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    name=TestPlayer
    ...    team_id=${TEAM_ID}
    ...    contact_info=test@example.com
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/players    json=${body}    headers=${headers}
    Set Suite Variable    ${PLAYER1_ID}    ${response.json()['player_id']}

Cleanup Test Players
    [Documentation]    Clean up test players created during tests
    Run Keyword If    '${PLAYER1_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/players/${PLAYER1_ID}    expected_status=any
    Run Keyword If    '${PLAYER2_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/players/${PLAYER2_ID}    expected_status=any
    Set Suite Variable    ${PLAYER1_ID}    ${EMPTY}
    Set Suite Variable    ${PLAYER2_ID}    ${EMPTY}

Cleanup Test Team
    [Documentation]    Clean up test team
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${TEAM_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${TEAM_ID}    ${EMPTY}

Cleanup Test Category
    [Documentation]    Clean up test category
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    expected_status=any
    Set Suite Variable    ${CATEGORY_ID}    ${EMPTY}

Cleanup Test Data
    [Documentation]    Clean up all test data
    # Get all players and delete test ones
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/players
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Players From List    ${response.json()}
    # Get all teams and delete test ones
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Teams From List    ${response.json()}
    # Get all categories and delete test ones
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Categories From List    ${response.json()}

Cleanup Test Players From List
    [Documentation]    Clean up test players from a list
    [Arguments]    ${players}
    FOR    ${player}    IN    @{players}
        ${name}=    Get From Dictionary    ${player}    name
        Run Keyword If    'TestPlayer' in '${name}' or 'UpdatedPlayer' in '${name}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/players/${player['player_id']}    expected_status=any
    END

Cleanup Test Teams From List
    [Documentation]    Clean up test teams from a list
    [Arguments]    ${teams}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    FOR    ${team}    IN    @{teams}
        ${name}=    Get From Dictionary    ${team}    name
        Run Keyword If    'TestTeam' in '${name}' or 'UpdatedTeam' in '${name}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${team['team_id']}    headers=${headers}    expected_status=any
    END

Cleanup Test Categories From List
    [Documentation]    Clean up test categories from a list
    [Arguments]    ${categories}
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        Run Keyword If    'TestCategory' in '${name}' or 'UpdatedCategory' in '${name}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${category['category_id']}    expected_status=any
    END

