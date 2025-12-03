*** Settings ***
Documentation    Test Suite for Scoring API
Resource         keywords/common.robot
Test Setup       Setup Test Data
Test Teardown    Cleanup Test Data

*** Variables ***
${TEAM_A}    A
${TEAM_B}    B

*** Test Cases ***
Test Start Match
    [Documentation]    Test starting a match
    Create Test Match
    ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/start
    Should Be Equal As Numbers    ${response.status_code}    200
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[status]    playing

Test Increment Score Team A
    [Documentation]    Test incrementing score for team A
    Create Test Match And Start
    ${data}=    Create Dictionary    team=${TEAM_A}
    ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/score/increment    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    200
    ${json}=    Get Response Json    ${response}
    Response Should Contain Key    ${response}    current_game_data
    Response Should Contain Key    ${response}    current_set_data

Test Increment Score Team B
    [Documentation]    Test incrementing score for team B
    Create Test Match And Start
    ${data}=    Create Dictionary    team=${TEAM_B}
    ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/score/increment    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    200
    ${json}=    Get Response Json    ${response}
    Response Should Contain Key    ${response}    current_game_data

Test Decrement Score
    [Documentation]    Test decrementing score (undo)
    Create Test Match And Start
    ${data}=    Create Dictionary    team=${TEAM_A}
    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/score/increment    json=${data}
    ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/score/decrement    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    200

Test Increment Score Without Starting Match
    [Documentation]    Test incrementing score on scheduled match (should fail)
    Create Test Match
    ${data}=    Create Dictionary    team=${TEAM_A}
    ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/score/increment    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    500

Test Finish Match
    [Documentation]    Test finishing a match
    Create Test Match And Start
    ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/finish
    Should Be Equal As Numbers    ${response.status_code}    200
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[status]    finished

Test Score Increment Without Team
    [Documentation]    Test incrementing score without specifying team
    Create Test Match And Start
    ${data}=    Create Dictionary
    ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/score/increment    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    400

Test Multiple Score Increments
    [Documentation]    Test multiple score increments to win a game
    Create Test Match And Start
    ${data_a}=    Create Dictionary    team=${TEAM_A}
    FOR    ${i}    IN RANGE    4
        ${response}=    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/score/increment    json=${data_a}
        Should Be Equal As Numbers    ${response.status_code}    200
    END
    ${json}=    Get Response Json    ${response}
    ${current_set}=    Evaluate    json.loads(${json}[current_set_data])
    Should Be True    ${current_set}[gamesA] >= 1    Team A should have won at least 1 game

*** Keywords ***
Setup Test Data
    [Documentation]    Setup test data (create category and teams)
    Create API Session
    ${cat_data}=    Create Dictionary    name=Test Category for Scoring
    ${cat_response}=    Post Request And Check Status    ${API_PREFIX}/categories    ${cat_data}
    ${cat_json}=    Get Response Json    ${cat_response}
    Set Suite Variable    ${CATEGORY_ID}    ${cat_json}[category_id]
    
    ${team1_data}=    Create Dictionary    name=Team A    category_id=${CATEGORY_ID}    group_name=A
    ${team1_response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${team1_data}
    ${team1_json}=    Get Response Json    ${team1_response}
    Set Suite Variable    ${TEAM1_ID}    ${team1_json}[team_id]
    
    ${team2_data}=    Create Dictionary    name=Team B    category_id=${CATEGORY_ID}    group_name=A
    ${team2_response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${team2_data}
    ${team2_json}=    Get Response Json    ${team2_response}
    Set Suite Variable    ${TEAM2_ID}    ${team2_json}[team_id]

Cleanup Test Data
    [Documentation]    Cleanup test data
    Run Keyword If    '${MATCH_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/matches/${MATCH_ID}
    Run Keyword If    '${TEAM1_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/teams/${TEAM1_ID}
    Run Keyword If    '${TEAM2_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/teams/${TEAM2_ID}
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}
    Delete API Session

Create Test Match
    [Documentation]    Helper keyword to create a test match
    ${data}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    group_name=A
    ...    court=Court 1
    ${response}=    Post Request And Check Status    ${API_PREFIX}/matches    ${data}
    ${json}=    Get Response Json    ${response}
    Set Suite Variable    ${MATCH_ID}    ${json}[match_id]

Create Test Match And Start
    [Documentation]    Helper keyword to create and start a test match
    Create Test Match
    POST On Session    api    ${API_PREFIX}/matches/${MATCH_ID}/start

