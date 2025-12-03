*** Settings ***
Documentation    Test Suite for Matches API
Resource         keywords/common.robot
Test Setup       Setup Test Data
Test Teardown    Cleanup Test Data

*** Variables ***
${COURT}            Court 1
${SCHEDULED_DATE}   2025-12-10
${SCHEDULED_TIME}   14:00
${PHASE_GROUP}      Group
${PHASE_SEMI}       Semi-final

*** Test Cases ***
Test Create Match
    [Documentation]    Test creating a new match
    ${data}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=${PHASE_GROUP}
    ...    group_name=A
    ...    scheduled_date=${SCHEDULED_DATE}
    ...    scheduled_time=${SCHEDULED_TIME}
    ...    court=${COURT}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/matches    ${data}
    ${json}=    Get Response Json    ${response}
    Response Should Contain Key    ${response}    match_id
    Response Should Contain Key    ${response}    team1_id
    Response Should Contain Key    ${response}    team2_id
    Response Should Contain Key    ${response}    status
    Should Be Equal    ${json}[status]    scheduled
    Should Be Equal    ${json}[court]    ${COURT}
    Set Suite Variable    ${MATCH_ID}    ${json}[match_id]

Test Get All Matches
    [Documentation]    Test getting all matches
    Create Test Match
    ${response}=    Get Request And Check Status    ${API_PREFIX}/matches
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Matches list should not be empty

Test Get Match By Id
    [Documentation]    Test getting a match by ID
    Create Test Match
    ${response}=    Get Request And Check Status    ${API_PREFIX}/matches/${MATCH_ID}
    ${json}=    Get Response Json    ${response}
    Should Be Equal As Numbers    ${json}[match_id]    ${MATCH_ID}
    Should Be Equal As Numbers    ${json}[team1_id]    ${TEAM1_ID}
    Should Be Equal As Numbers    ${json}[team2_id]    ${TEAM2_ID}

Test Get Matches By Category
    [Documentation]    Test getting matches filtered by category
    Create Test Match
    ${response}=    Get Request And Check Status    ${API_PREFIX}/matches?category_id=${CATEGORY_ID}
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Matches list should not be empty
    FOR    ${match}    IN    @{json}
        Should Be Equal As Numbers    ${match}[category_id]    ${CATEGORY_ID}
    END

Test Get Matches By Status
    [Documentation]    Test getting matches filtered by status
    Create Test Match
    ${response}=    Get Request And Check Status    ${API_PREFIX}/matches?status=scheduled
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Matches list should not be empty
    FOR    ${match}    IN    @{json}
        Should Be Equal    ${match}[status]    scheduled
    END

Test Update Match
    [Documentation]    Test updating a match
    Create Test Match
    ${data}=    Create Dictionary    court=Court 2
    ${response}=    Put Request And Check Status    ${API_PREFIX}/matches/${MATCH_ID}    ${data}
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[court]    Court 2

Test Delete Match
    [Documentation]    Test deleting a match
    Create Test Match
    Delete Request And Check Status    ${API_PREFIX}/matches/${MATCH_ID}
    ${response}=    Get Request And Check Status    ${API_PREFIX}/matches/${MATCH_ID}    expected_status=404

*** Keywords ***
Setup Test Data
    [Documentation]    Setup test data (create category and teams)
    Create API Session
    ${cat_data}=    Create Dictionary    name=Test Category for Matches
    ${cat_response}=    Post Request And Check Status    ${API_PREFIX}/categories    ${cat_data}
    ${cat_json}=    Get Response Json    ${cat_response}
    Set Suite Variable    ${CATEGORY_ID}    ${cat_json}[category_id]
    
    ${team1_data}=    Create Dictionary    name=Team 1    category_id=${CATEGORY_ID}    group_name=A
    ${team1_response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${team1_data}
    ${team1_json}=    Get Response Json    ${team1_response}
    Set Suite Variable    ${TEAM1_ID}    ${team1_json}[team_id]
    
    ${team2_data}=    Create Dictionary    name=Team 2    category_id=${CATEGORY_ID}    group_name=A
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
    ...    phase=${PHASE_GROUP}
    ...    group_name=A
    ...    scheduled_date=${SCHEDULED_DATE}
    ...    scheduled_time=${SCHEDULED_TIME}
    ...    court=${COURT}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/matches    ${data}
    ${json}=    Get Response Json    ${response}
    Set Suite Variable    ${MATCH_ID}    ${json}[match_id]

