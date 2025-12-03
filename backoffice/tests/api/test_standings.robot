*** Settings ***
Documentation    Test suite for Standings API
Library    RequestsLibrary
Library    Collections
Resource    ../resources/common.robot

Suite Setup    Run Keywords
...    Create Session For API
...    Create Test Data
Suite Teardown    Delete All Sessions

*** Variables ***
${CATEGORY_ID}    ${EMPTY}
${TEAM1_ID}      ${EMPTY}
${TEAM2_ID}      ${EMPTY}

*** Keywords ***
Create Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json
    # Create category
    ${cat_body}=    Create Dictionary    name=TestCategory
    ${cat_response}=    POST    ${API_BASE}/categories    json=${cat_body}    headers=${headers}
    ${category_id}=    Get From Dictionary    ${cat_response.json()}    category_id
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}
    
    # Create teams
    ${team1_body}=    Create Dictionary    name=Team 1    category_id=${category_id}    group_name=A
    ${team2_body}=    Create Dictionary    name=Team 2    category_id=${category_id}    group_name=A
    ${team1_response}=    POST    ${API_BASE}/teams    json=${team1_body}    headers=${headers}
    ${team2_response}=    POST    ${API_BASE}/teams    json=${team2_body}    headers=${headers}
    ${team1_id}=    Get From Dictionary    ${team1_response.json()}    team_id
    ${team2_id}=    Get From Dictionary    ${team2_response.json()}    team_id
    Set Suite Variable    ${TEAM1_ID}    ${team1_id}
    Set Suite Variable    ${TEAM2_ID}    ${team2_id}

*** Test Cases ***
Test Get All Standings
    [Documentation]    Test retrieving all standings
    ${response}=    GET    ${API_BASE}/standings
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200

Test Get Standings By Category
    [Documentation]    Test retrieving standings filtered by category
    ${response}=    GET    ${API_BASE}/standings?category_id=${CATEGORY_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${standings}=    Set Variable    ${response.json()}
    FOR    ${standing}    IN    @{standings}
        Should Be Equal    ${standing}[category_id]    ${CATEGORY_ID}
    END

Test Get Standings By Group
    [Documentation]    Test retrieving standings filtered by group
    ${response}=    GET    ${API_BASE}/standings?category_id=${CATEGORY_ID}&group=A
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${standings}=    Set Variable    ${response.json()}
    FOR    ${standing}    IN    @{standings}
        Should Be Equal    ${standing}[group_name]    A
    END

Test Recalculate Group Rankings
    [Documentation]    Test recalculating group rankings
    ${response}=    POST    ${API_BASE}/standings/recalculate/${CATEGORY_ID}/A
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${standings}=    Set Variable    ${response.json()}
    Should Not Be Empty    ${standings}
    # Verify rankings are assigned
    FOR    ${standing}    IN    @{standings}
        Should Not Be None    ${standing}[group_rank]
    END

Test Standings Structure
    [Documentation]    Test that standings have all required fields
    ${response}=    GET    ${API_BASE}/standings?category_id=${CATEGORY_ID}&group=A
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    ${standings}=    Set Variable    ${response.json()}
    Run Keyword If    ${standings}    Run Keywords
    ...    ${standing}=    Get From List    ${standings}    0
    ...    Dictionary Should Contain Key    ${standing}    team_id
    ...    Dictionary Should Contain Key    ${standing}    category_id
    ...    Dictionary Should Contain Key    ${standing}    group_name
    ...    Dictionary Should Contain Key    ${standing}    matches_played
    ...    Dictionary Should Contain Key    ${standing}    wins
    ...    Dictionary Should Contain Key    ${standing}    losses
    ...    Dictionary Should Contain Key    ${standing}    points
    ...    Dictionary Should Contain Key    ${standing}    games_won
    ...    Dictionary Should Contain Key    ${standing}    games_lost

