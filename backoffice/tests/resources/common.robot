*** Settings ***
Library    RequestsLibrary
Library    Collections
Library    JSONLibrary
Library    String

*** Variables ***
${BASE_URL}    http://localhost:3000
${API_BASE}    ${BASE_URL}/api

*** Keywords ***
Create Session For API
    Create Session    api    ${BASE_URL}

Delete All Test Data
    [Documentation]    Clean up test data (categories, teams, players, matches, standings)
    ${categories}=    Get Request    api    ${API_BASE}/categories
    ${category_list}=    Set Variable If    ${categories.status_code} == 200    ${categories.json()}    []
    FOR    ${category}    IN    @{category_list}
        Delete Request    api    ${API_BASE}/categories/${category}[category_id]
    END
    
    ${teams}=    Get Request    api    ${API_BASE}/teams
    ${team_list}=    Set Variable If    ${teams.status_code} == 200    ${teams.json()}    []
    FOR    ${team}    IN    @{team_list}
        Delete Request    api    ${API_BASE}/teams/${team}[team_id]
    END

Verify Response Status
    [Arguments]    ${expected_status}
    Should Be Equal As Strings    ${response.status_code}    ${expected_status}

Verify Response Contains
    [Arguments]    ${key}    ${expected_value}=${EMPTY}
    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    ${key}
    Run Keyword If    '${expected_value}' != '${EMPTY}'    Should Be Equal    ${json}[${key}]    ${expected_value}

