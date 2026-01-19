*** Settings ***
Documentation    Tests for duplicate name validation - Categories and Teams
...              Updated: 2025-12-06 10:54:50 - v0.03-dev
Library          RequestsLibrary
Library          Collections
Library          String

Suite Setup       Create Session And Login As Admin
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test Teams    Cleanup Test Categories

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${CATEGORY_ID}       ${EMPTY}
${TEAM1_ID}          ${EMPTY}
${TEAM2_ID}          ${EMPTY}
${ADMIN_TOKEN}       ${EMPTY}
${ADMIN_USERNAME}    admin
${ADMIN_PASSWORD}    admin123

*** Test Cases ***

Test Create Category With Duplicate Name Should Fail
    [Documentation]    Should fail when creating a category with duplicate name
    [Tags]    category    duplicate    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create first category
    ${data1}=    Create Dictionary    name=Test Category Duplicate
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${data1}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    
    # Try to create duplicate (case-insensitive)
    ${data2}=    Create Dictionary    name=test category duplicate
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${data2}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response2.status_code}    400
    Should Contain    ${response2.json()}[error]    Já existe uma categoria
    
    # Try with different case variations
    ${data3}=    Create Dictionary    name=TEST CATEGORY DUPLICATE
    ${response3}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${data3}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response3.status_code}    400
    Should Contain    ${response3.json()}[error]    Já existe uma categoria

Test Update Category With Duplicate Name Should Fail
    [Documentation]    Should fail when updating a category to duplicate name
    [Tags]    category    duplicate    validation    update
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create two categories
    ${data1}=    Create Dictionary    name=Category A
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${data1}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    ${cat1_id}=    Set Variable    ${response1.json()}[category_id]
    
    ${data2}=    Create Dictionary    name=Category B
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${data2}    headers=${headers}
    Should Be Equal As Strings    ${response2.status_code}    201
    ${cat2_id}=    Set Variable    ${response2.json()}[category_id]
    
    # Try to update Category B to Category A name
    ${update_data}=    Create Dictionary    name=Category A
    ${response3}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/${cat2_id}    json=${update_data}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response3.status_code}    400
    Should Contain    ${response3.json()}[error]    Já existe uma categoria

Test Create Team With Duplicate Name In Same Category Should Fail
    [Documentation]    Should fail when creating a team with duplicate name in same category
    [Tags]    team    duplicate    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category first
    ${cat_data}=    Create Dictionary    name=Test Category Teams
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}
    
    # Create first team
    ${team_data1}=    Create Dictionary    name=Team Duplicate Test    category_id=${category_id}
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data1}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    
    # Try to create duplicate (case-insensitive)
    ${team_data2}=    Create Dictionary    name=team duplicate test    category_id=${category_id}
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data2}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response2.status_code}    400
    Should Contain    ${response2.json()}[error]    Já existe uma equipa
    
    # Try with different case
    ${team_data3}=    Create Dictionary    name=TEAM DUPLICATE TEST    category_id=${category_id}
    ${response3}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data3}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response3.status_code}    400
    Should Contain    ${response3.json()}[error]    Já existe uma equipa

Test Create Team With Same Name In Different Category Should Succeed
    [Documentation]    Should allow same team name in different categories
    [Tags]    team    duplicate    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create two categories
    ${cat_data1}=    Create Dictionary    name=Category 1 Teams
    ${cat_response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data1}    headers=${headers}
    Should Be Equal As Strings    ${cat_response1.status_code}    201
    ${cat1_id}=    Set Variable    ${cat_response1.json()}[category_id]
    
    ${cat_data2}=    Create Dictionary    name=Category 2 Teams
    ${cat_response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data2}    headers=${headers}
    Should Be Equal As Strings    ${cat_response2.status_code}    201
    ${cat2_id}=    Set Variable    ${cat_response2.json()}[category_id]
    
    # Create team in first category
    ${team_data1}=    Create Dictionary    name=Same Team Name    category_id=${cat1_id}
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data1}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    
    # Create team with same name in second category (should succeed)
    ${team_data2}=    Create Dictionary    name=Same Team Name    category_id=${cat2_id}
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data2}    headers=${headers}
    Should Be Equal As Strings    ${response2.status_code}    201

Test Update Team With Duplicate Name In Same Category Should Fail
    [Documentation]    Should fail when updating a team to duplicate name in same category
    [Tags]    team    duplicate    validation    update
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category
    ${cat_data}=    Create Dictionary    name=Category Update Test
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    Should Be Equal As Strings    ${cat_response.status_code}    201
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    
    # Create two teams
    ${team_data1}=    Create Dictionary    name=Team Update A    category_id=${category_id}
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data1}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    ${team1_id}=    Set Variable    ${response1.json()}[team_id]
    
    ${team_data2}=    Create Dictionary    name=Team Update B    category_id=${category_id}
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data2}    headers=${headers}
    Should Be Equal As Strings    ${response2.status_code}    201
    ${team2_id}=    Set Variable    ${response2.json()}[team_id]
    
    # Try to update Team B to Team A name
    ${update_data}=    Create Dictionary    name=Team Update A    category_id=${category_id}
    ${response3}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${team2_id}    json=${update_data}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response3.status_code}    400
    Should Contain    ${response3.json()}[error]    Já existe uma equipa

Test Update Team Name To Existing Name In Different Category Should Succeed
    [Documentation]    Should allow updating team name if duplicate exists in different category
    [Tags]    team    duplicate    validation    update
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create two categories
    ${cat_data1}=    Create Dictionary    name=Cat Update 1
    ${cat_response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data1}    headers=${headers}
    ${cat1_id}=    Set Variable    ${cat_response1.json()}[category_id]
    
    ${cat_data2}=    Create Dictionary    name=Cat Update 2
    ${cat_response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data2}    headers=${headers}
    ${cat2_id}=    Set Variable    ${cat_response2.json()}[category_id]
    
    # Create team in category 1
    ${team_data1}=    Create Dictionary    name=Team Cross Category    category_id=${cat1_id}
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data1}    headers=${headers}
    ${team1_id}=    Set Variable    ${response1.json()}[team_id]
    
    # Create team in category 2
    ${team_data2}=    Create Dictionary    name=Team Different    category_id=${cat2_id}
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data2}    headers=${headers}
    ${team2_id}=    Set Variable    ${response2.json()}[team_id]
    
    # Update team 2 to same name as team 1 (different category - should succeed)
    ${update_data}=    Create Dictionary    name=Team Cross Category    category_id=${cat2_id}
    ${response3}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/teams/${team2_id}    json=${update_data}    headers=${headers}
    Should Be Equal As Strings    ${response3.status_code}    200

Test Category Name With Whitespace Should Be Trimmed
    [Documentation]    Should trim whitespace from category names
    [Tags]    category    validation    whitespace
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category with leading/trailing whitespace
    ${name_with_spaces}=    Set Variable     Category With Spaces  
    ${data1}=    Create Dictionary    name=${name_with_spaces}
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${data1}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    ${cat_id}=    Set Variable    ${response1.json()}[category_id]
    
    # Verify name is trimmed
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories/${cat_id}
    Should Be Equal    ${get_response.json()}[name]    Category With Spaces
    
    # Try to create duplicate without spaces (should fail)
    ${name_no_spaces}=    Set Variable    Category With Spaces
    ${data2}=    Create Dictionary    name=${name_no_spaces}
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${data2}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response2.status_code}    400

Test Team Name With Whitespace Should Be Trimmed
    [Documentation]    Should trim whitespace from team names
    [Tags]    team    validation    whitespace
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create category
    ${cat_data}=    Create Dictionary    name=Category Whitespace Test
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    
    # Create team with leading/trailing whitespace
    ${team_name_with_spaces}=    Set Variable     Team With Spaces    
    ${team_data1}=    Create Dictionary    name=${team_name_with_spaces}    category_id=${category_id}
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data1}    headers=${headers}
    Should Be Equal As Strings    ${response1.status_code}    201
    ${team_id}=    Set Variable    ${response1.json()}[team_id]
    
    # Verify name is trimmed
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams/${team_id}
    Should Be Equal    ${get_response.json()}[name]    Team With Spaces
    
    # Try to create duplicate without spaces (should fail)
    ${team_name_no_spaces}=    Set Variable    Team With Spaces
    ${team_data2}=    Create Dictionary    name=${team_name_no_spaces}    category_id=${category_id}
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${team_data2}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response2.status_code}    400

*** Keywords ***

Create Session And Login As Admin
    [Documentation]    Create API session and login as admin
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    
    # Login
    ${login_data}=    Create Dictionary    username=${ADMIN_USERNAME}    password=${ADMIN_PASSWORD}
    ${login_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${login_data}
    Should Be Equal As Strings    ${login_response.status_code}    200
    
    ${token}=    Set Variable    ${login_response.json()}[token]
    Set Suite Variable    ${ADMIN_TOKEN}    ${token}

Cleanup Test Categories
    [Documentation]    Clean up test categories created during tests
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${CATEGORY_ID}    ${EMPTY}
    
    # Cleanup all test categories
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Categories From List    ${response.json()}

Cleanup Test Categories From List
    [Documentation]    Clean up test categories from a list
    [Arguments]    ${categories}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        ${should_delete}=    Evaluate    'Test' in '${name}' or 'Duplicate' in '${name}' or 'Category' in '${name}' or 'Update' in '${name}' or 'Whitespace' in '${name}' or 'Cross' in '${name}' or 'A' in '${name}' or 'B' in '${name}' or '1' in '${name}' or '2' in '${name}'
        Run Keyword If    ${should_delete}    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${category['category_id']}    headers=${headers}    expected_status=any
    END

Cleanup Test Teams
    [Documentation]    Clean up test teams created during tests
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${TEAM1_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}    headers=${headers}    expected_status=any
    Run Keyword If    '${TEAM2_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM2_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${TEAM1_ID}    ${EMPTY}
    Set Suite Variable    ${TEAM2_ID}    ${EMPTY}
    
    # Cleanup all test teams
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Teams From List    ${response.json()}

Cleanup Test Teams From List
    [Documentation]    Clean up test teams from a list
    [Arguments]    ${teams}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    FOR    ${team}    IN    @{teams}
        ${name}=    Get From Dictionary    ${team}    name
        ${should_delete}=    Evaluate    'Test' in '${name}' or 'Duplicate' in '${name}' or 'Team' in '${name}' or 'Update' in '${name}' or 'Whitespace' in '${name}' or 'Cross' in '${name}' or 'Spaces' in '${name}' or 'Same' in '${name}' or 'Different' in '${name}' or 'A' in '${name}' or 'B' in '${name}'
        Run Keyword If    ${should_delete}    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${team['team_id']}    headers=${headers}    expected_status=any
    END

Cleanup Test Data
    [Documentation]    Clean up all test data created during tests
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Added proper cleanup
    Cleanup Test Teams
    Cleanup Test Categories
    Delete All Sessions
    Log    Test data cleanup completed

