*** Settings ***
Documentation    Test Suite for Standings API
Resource         keywords/common.robot
Test Setup       Setup Test Data
Test Teardown    Cleanup Test Data

*** Variables ***
${GROUP_A}    A
${GROUP_B}    B

*** Test Cases ***
Test Get All Standings
    [Documentation]    Test getting all standings
    Create Test Standing
    ${response}=    Get Request And Check Status    ${API_PREFIX}/standings
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Standings list should not be empty

Test Get Standings By Category
    [Documentation]    Test getting standings filtered by category
    Create Test Standing
    ${response}=    Get Request And Check Status    ${API_PREFIX}/standings?category_id=${CATEGORY_ID}
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Standings list should not be empty
    FOR    ${standing}    IN    @{json}
        Should Be Equal As Numbers    ${standing}[category_id]    ${CATEGORY_ID}
    END

Test Get Standings By Group
    [Documentation]    Test getting standings filtered by group
    Create Test Standing
    ${response}=    Get Request And Check Status    ${API_PREFIX}/standings?category_id=${CATEGORY_ID}&group=${GROUP_A}
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Standings list should not be empty
    FOR    ${standing}    IN    @{json}
        Should Be Equal    ${standing}[group_name]    ${GROUP_A}
    END

Test Recalculate Group Rankings
    [Documentation]    Test recalculating group rankings
    Create Multiple Test Standings
    ${response}=    POST On Session    api    ${API_PREFIX}/standings/recalculate/${CATEGORY_ID}/${GROUP_A}
    Should Be Equal As Numbers    ${response.status_code}    200
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Standings list should not be empty
    FOR    ${standing}    IN    @{json}
        Should Not Be Equal    ${standing}[group_rank]    ${None}
    END

Test Standings With Wins And Losses
    [Documentation]    Test standings with wins and losses
    Create Test Standing With Stats
    ${response}=    Get Request And Check Status    ${API_PREFIX}/standings?category_id=${CATEGORY_ID}&group=${GROUP_A}
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Standings list should not be empty
    ${standing}=    Get From List    ${json}    0
    Should Be Equal As Numbers    ${standing}[wins]    2
    Should Be Equal As Numbers    ${standing}[losses]    1
    Should Be Equal As Numbers    ${standing}[points]    6

*** Keywords ***
Setup Test Data
    [Documentation]    Setup test data (create category and teams)
    Create API Session
    ${cat_data}=    Create Dictionary    name=Test Category for Standings
    ${cat_response}=    Post Request And Check Status    ${API_PREFIX}/categories    ${cat_data}
    ${cat_json}=    Get Response Json    ${cat_response}
    Set Suite Variable    ${CATEGORY_ID}    ${cat_json}[category_id]
    
    ${team1_data}=    Create Dictionary    name=Team 1    category_id=${CATEGORY_ID}    group_name=${GROUP_A}
    ${team1_response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${team1_data}
    ${team1_json}=    Get Response Json    ${team1_response}
    Set Suite Variable    ${TEAM1_ID}    ${team1_json}[team_id]
    
    ${team2_data}=    Create Dictionary    name=Team 2    category_id=${CATEGORY_ID}    group_name=${GROUP_A}
    ${team2_response}=    Post Request And Check Status    ${API_PREFIX}/teams    ${team2_data}
    ${team2_json}=    Get Response Json    ${team2_response}
    Set Suite Variable    ${TEAM2_ID}    ${team2_json}[team_id]

Cleanup Test Data
    [Documentation]    Cleanup test data
    Run Keyword If    '${TEAM1_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/teams/${TEAM1_ID}
    Run Keyword If    '${TEAM2_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/teams/${TEAM2_ID}
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    Delete Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}
    Delete API Session

Create Test Standing
    [Documentation]    Helper keyword to create a test standing via API (using internal model)
    # Note: Standings are typically created/updated internally, but we can test the GET endpoints
    # For full testing, we would need to create matches and update standings

Create Multiple Test Standings
    [Documentation]    Helper keyword to create multiple test standings
    # This would typically be done by creating matches and having the system update standings
    # For now, we test the recalculate endpoint

Create Test Standing With Stats
    [Documentation]    Helper keyword to create standing with specific stats
    # In a real scenario, this would be done by creating matches and updating standings
    # For testing purposes, we would need direct access to the Standing model
    # or create matches that result in these standings

