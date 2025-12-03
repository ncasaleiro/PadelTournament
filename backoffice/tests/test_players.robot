*** Settings ***
Documentation    Test Suite for Players API
Resource         keywords/common.robot
Test Setup       Setup Test Data
Test Teardown    Cleanup Test Data

*** Variables ***
${PLAYER_NAME}        João Silva
${UPDATED_PLAYER}     João Silva Updated
${CONTACT_INFO}       joao@example.com

*** Test Cases ***
Test Create Player
    [Documentation]    Test creating a new player
    ${data}=    Create Dictionary    name=${PLAYER_NAME}    team_id=${TEAM_ID}    contact_info=${CONTACT_INFO}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/players    ${data}
    ${json}=    Get Response Json    ${response}
    Response Should Contain Key    ${response}    player_id
    Response Should Contain Key    ${response}    name
    Response Should Contain Key    ${response}    team_id
    Should Be Equal    ${json}[name]    ${PLAYER_NAME}
    Should Be Equal As Numbers    ${json}[team_id]    ${TEAM_ID}
    Should Be Equal    ${json}[contact_info]    ${CONTACT_INFO}
    Set Suite Variable    ${PLAYER_ID}    ${json}[player_id]

Test Get All Players
    [Documentation]    Test getting all players
    Create Test Player
    ${response}=    Get Request And Check Status    ${API_PREFIX}/players
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Players list should not be empty

Test Get Player By Id
    [Documentation]    Test getting a player by ID
    Create Test Player
    ${response}=    Get Request And Check Status    ${API_PREFIX}/players/${PLAYER_ID}
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[name]    ${PLAYER_NAME}
    Should Be Equal As Numbers    ${json}[player_id]    ${PLAYER_ID}

Test Get Players By Team
    [Documentation]    Test getting players filtered by team
    Create Test Player
    ${response}=    Get Request And Check Status    ${API_PREFIX}/players?team_id=${TEAM_ID}
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Players list should not be empty
    FOR    ${player}    IN    @{json}
        Should Be Equal As Numbers    ${player}[team_id]    ${TEAM_ID}
    END

Test Update Player
    [Documentation]    Test updating a player
    Create Test Player
    ${data}=    Create Dictionary    name=${UPDATED_PLAYER}    team_id=${TEAM_ID}    contact_info=${CONTACT_INFO}
    ${response}=    Put Request And Check Status    ${API_PREFIX}/players/${PLAYER_ID}    ${data}
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[name]    ${UPDATED_PLAYER}

Test Delete Player
    [Documentation]    Test deleting a player
    Create Test Player
    Delete Request And Check Status    ${API_PREFIX}/players/${PLAYER_ID}
    ${response}=    Get Request And Check Status    ${API_PREFIX}/players/${PLAYER_ID}    expected_status=404

Test Create Player Without Required Fields
    [Documentation]    Test creating player without required fields
    ${data}=    Create Dictionary    name=${PLAYER_NAME}
    ${response}=    POST On Session    api    ${API_PREFIX}/players    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    400

*** Keywords ***
Setup Test Data
    [Documentation]    Setup test data (create category and team)
    Create API Session
    ${cat_data}=    Create Dictionary    name=Test Category for Players
    ${cat_response}=    Post Request And Check Status    ${API_PREFIX}/categories    ${cat_data}
    ${cat_json}=    Get Response Json    ${cat_response}
    Set Suite Variable    ${CATEGORY_ID}    ${cat_json}[category_id]
    
    ${team_data}=    Create Dictionary    name=Test Team for Players    category_id=${CATEGORY_ID}    group_name=A
    ${team_response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${team_data}
    ${team_json}=    Get Response Json    ${team_response}
    Set Suite Variable    ${TEAM_ID}    ${team_json}[team_id]

Cleanup Test Data
    [Documentation]    Cleanup test data
    Run Keyword If    '${PLAYER_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/players/${PLAYER_ID}
    Run Keyword If    '${TEAM_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/teams/${TEAM_ID}
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}
    Delete API Session

Create Test Player
    [Documentation]    Helper keyword to create a test player
    ${data}=    Create Dictionary    name=${PLAYER_NAME}    team_id=${TEAM_ID}    contact_info=${CONTACT_INFO}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/players    ${data}
    ${json}=    Get Response Json    ${response}
    Set Suite Variable    ${PLAYER_ID}    ${json}[player_id]

