*** Settings ***
Documentation    Test suite for Players API
Library    RequestsLibrary
Library    Collections
Resource    ../resources/common.robot

Suite Setup    Run Keywords
...    Create Session For API
...    Create Test Category And Team
Suite Teardown    Delete All Sessions

*** Variables ***
${CATEGORY_ID}    ${EMPTY}
${TEAM_ID}       ${EMPTY}
${PLAYER_ID}     ${EMPTY}

*** Keywords ***
Create Test Category And Team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${cat_body}=    Create Dictionary    name=TestCategory
    ${cat_response}=    POST    ${API_BASE}/categories    json=${cat_body}    headers=${headers}
    ${category_id}=    Get From Dictionary    ${cat_response.json()}    category_id
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}
    
    ${team_body}=    Create Dictionary    name=Test Team    category_id=${category_id}    group_name=A
    ${team_response}=    POST    ${API_BASE}/teams    json=${team_body}    headers=${headers}
    ${team_id}=    Get From Dictionary    ${team_response.json()}    team_id
    Set Suite Variable    ${TEAM_ID}    ${team_id}

*** Test Cases ***
Test Create Player
    [Documentation]    Test creating a new player
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=João Silva    team_id=${TEAM_ID}    contact_info=joao@example.com
    ${response}=    POST    ${API_BASE}/players    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    201
    Verify Response Contains    player_id
    Verify Response Contains    name    João Silva
    Verify Response Contains    team_id    ${TEAM_ID}
    ${player_id}=    Get From Dictionary    ${response.json()}    player_id
    Set Suite Variable    ${PLAYER_ID}    ${player_id}

Test Get All Players
    [Documentation]    Test retrieving all players
    ${response}=    GET    ${API_BASE}/players
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Should Be True    ${response.json()}    List is not empty

Test Get Player By ID
    [Documentation]    Test retrieving a player by ID
    [Tags]    requires_player
    ${response}=    GET    ${API_BASE}/players/${PLAYER_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    player_id    ${PLAYER_ID}
    Verify Response Contains    name    João Silva

Test Get Players By Team
    [Documentation]    Test retrieving players filtered by team
    [Tags]    requires_player
    ${response}=    GET    ${API_BASE}/players?team_id=${TEAM_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${players}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${players}
    FOR    ${player}    IN    @{players}
        Should Be Equal    ${player}[team_id]    ${TEAM_ID}
    END

Test Update Player
    [Documentation]    Test updating a player
    [Tags]    requires_player
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=João Silva Updated    team_id=${TEAM_ID}    contact_info=joao.updated@example.com
    ${response}=    PUT    ${API_BASE}/players/${PLAYER_ID}    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    name    João Silva Updated
    Verify Response Contains    contact_info    joao.updated@example.com

Test Delete Player
    [Documentation]    Test deleting a player
    [Tags]    requires_player
    ${response}=    DELETE    ${API_BASE}/players/${PLAYER_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    204
    # Verify player is deleted
    ${response}=    GET    ${API_BASE}/players/${PLAYER_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    404

Test Create Player Without Required Fields
    [Documentation]    Test creating a player without required fields
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=Player Without Team
    ${response}=    POST    ${API_BASE}/players    json=${body}    headers=${headers}    expected_status=400
    Set Test Variable    ${response}    ${response}
    Verify Response Status    400

Test Create Multiple Players For Team
    [Documentation]    Test creating multiple players for the same team
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${player1}=    Create Dictionary    name=Player 1    team_id=${TEAM_ID}
    ${player2}=    Create Dictionary    name=Player 2    team_id=${TEAM_ID}
    ${response1}=    POST    ${API_BASE}/players    json=${player1}    headers=${headers}
    ${response2}=    POST    ${API_BASE}/players    json=${player2}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    Should Be Equal As Strings    ${response2.status_code}    201
    ${player1_id}=    Get From Dictionary    ${response1.json()}    player_id
    ${player2_id}=    Get From Dictionary    ${response2.json()}    player_id
    Should Not Be Equal    ${player1_id}    ${player2_id}
    [Teardown]    Run Keywords
    ...    DELETE    ${API_BASE}/players/${player1_id}
    ...    AND    DELETE    ${API_BASE}/players/${player2_id}

