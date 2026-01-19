*** Settings ***
Documentation    Test suite for Generate Matches button functionality
Library          SeleniumLibrary
Library          RequestsLibrary
Library          Collections
Library          DateTime

Suite Setup       Suite Setup
Suite Teardown    Suite Teardown
Test Teardown     Test Teardown

*** Variables ***
${BASE_URL}      http://localhost:3000
${BROWSER}       chrome
${ADMIN_USER}    admin
${ADMIN_PASS}    admin123
${ADMIN_TOKEN}   ${EMPTY}
${SESSION_NAME}  api_session
${TOURNAMENT_ID}    ${EMPTY}
${CATEGORY_ID_1}    ${EMPTY}
${CATEGORY_ID_2}    ${EMPTY}
@{TEAM_IDS_1}       
@{TEAM_IDS_2}       

*** Test Cases ***
Test Generate Matches Button Opens Modal
    [Documentation]    Test that clicking Generate Matches button opens the modal
    [Tags]    ui    generate-matches
    
    # Navigate to tournaments page
    Click Element    xpath=//a[@data-page='tournaments']
    Wait Until Page Contains    Torneios    10s
    
    # Wait for tournament card to appear
    Wait Until Element Is Visible    xpath=//button[contains(text(), 'Gerar Jogos')]    10s
    
    # Click Generate Matches button
    Click Button    xpath=//button[contains(text(), 'Gerar Jogos')]
    
    # Verify modal is open
    Wait Until Element Is Visible    id=generate-matches-modal    10s
    Element Should Be Visible    id=generate-matches-modal
    Page Should Contain    Gerar Jogos

Test Generate Matches With Single Category
    [Documentation]    Test generating matches for a single category
    [Tags]    ui    generate-matches    single-category
    
    # Navigate to tournaments page
    Click Element    xpath=//a[@data-page='tournaments']
    Wait Until Page Contains    Torneios    10s
    
    # Wait for tournament card and click Generate Matches button
    Wait Until Element Is Visible    xpath=//button[contains(text(), 'Gerar Jogos')]    10s
    Click Button    xpath=//button[contains(text(), 'Gerar Jogos')]
    
    # Wait for modal to open
    Wait Until Element Is Visible    id=generate-matches-modal    10s
    
    # Select first category checkbox
    Wait Until Element Is Visible    xpath=//input[@class='category-checkbox']    10s
    ${checkboxes}=    Get WebElements    xpath=//input[@class='category-checkbox']
    Should Not Be Empty    ${checkboxes}
    Click Element    ${checkboxes}[0]
    
    # Verify phase is Group
    ${phase_value}=    Get Value    id=generate-phase
    Should Be Equal    ${phase_value}    Group
    
    # Verify auto-schedule is checked
    ${auto_schedule}=    Checkbox Should Be Selected    id=generate-auto-schedule
    
    # Click Generate button
    Click Button    xpath=//button[@type='submit' and contains(text(), 'Gerar Jogos')]
    
    # Wait for success message or error
    Sleep    2s
    
    # Verify matches were created by checking API
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${response}=    GET On Session    ${SESSION_NAME}    /api/matches    params=tournament_id=${TOURNAMENT_ID}    headers=${headers}
    Should Be Equal As Integers    ${response.status_code}    200
    ${matches}=    Set Variable    ${response.json()}
    ${match_count}=    Get Length    ${matches}
    Should Be True    ${match_count} > 0

Test Generate Matches With Multiple Categories
    [Documentation]    Test generating matches for multiple categories
    [Tags]    ui    generate-matches    multi-category
    
    # Navigate to tournaments page (close modal first if open)
    Run Keyword And Ignore Error    Click Element    xpath=//span[@class='close' and contains(@onclick, 'generate-matches-modal')]
    Sleep    0.5s
    
    Click Element    xpath=//a[@data-page='tournaments']
    Wait Until Page Contains    Torneios    10s
    
    # Wait for tournament card and click Generate Matches button
    Wait Until Element Is Visible    xpath=//button[contains(text(), 'Gerar Jogos')]    10s
    Click Button    xpath=//button[contains(text(), 'Gerar Jogos')]
    
    # Wait for modal to open
    Wait Until Element Is Visible    id=generate-matches-modal    10s
    
    # Select multiple category checkboxes
    Wait Until Element Is Visible    xpath=//input[@class='category-checkbox']    10s
    ${checkboxes}=    Get WebElements    xpath=//input[@class='category-checkbox']
    ${count}=    Get Length    ${checkboxes}
    Should Be True    ${count} >= 2
    
    # Select first two categories
    Click Element    ${checkboxes}[0]
    Click Element    ${checkboxes}[1]
    
    # Verify teams-per-group-group is hidden (multiple categories)
    Element Should Not Be Visible    id=teams-per-group-group
    
    # Set teams per group for each category (if inputs exist)
    ${cat1_id}=    Get Element Attribute    ${checkboxes}[0]    value
    ${cat2_id}=    Get Element Attribute    ${checkboxes}[1]    value
    
    ${input1}=    Get WebElements    xpath=//input[@id='teams-per-group-${cat1_id}']
    ${input2}=    Get WebElements    xpath=//input[@id='teams-per-group-${cat2_id}']
    
    ${count1}=    Get Length    ${input1}
    ${count2}=    Get Length    ${input2}
    Run Keyword If    ${count1} > 0    Input Text    id=teams-per-group-${cat1_id}    4
    Run Keyword If    ${count2} > 0    Input Text    id=teams-per-group-${cat2_id}    4
    
    # Click Generate button
    Click Button    xpath=//button[@type='submit' and contains(text(), 'Gerar Jogos')]
    
    # Wait for success message or error
    Sleep    3s
    
    # Verify matches were created
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${response}=    GET On Session    ${SESSION_NAME}    /api/matches    params=tournament_id=${TOURNAMENT_ID}    headers=${headers}
    Should Be Equal As Integers    ${response.status_code}    200
    ${matches}=    Set Variable    ${response.json()}
    ${match_count}=    Get Length    ${matches}
    Should Be True    ${match_count} > 0

Test Generate Matches Button Validation
    [Documentation]    Test that validation works when no categories are selected
    [Tags]    ui    generate-matches    validation
    
    # Navigate to tournaments page (close modal first if open)
    Run Keyword And Ignore Error    Click Element    xpath=//span[@class='close' and contains(@onclick, 'generate-matches-modal')]
    Sleep    0.5s
    
    Click Element    xpath=//a[@data-page='tournaments']
    Wait Until Page Contains    Torneios    10s
    
    # Wait for tournament card and click Generate Matches button
    Wait Until Element Is Visible    xpath=//button[contains(text(), 'Gerar Jogos')]    10s
    Click Button    xpath=//button[contains(text(), 'Gerar Jogos')]
    
    # Wait for modal to open
    Wait Until Element Is Visible    id=generate-matches-modal    10s
    
    # Don't select any category - try to submit
    Click Button    xpath=//button[@type='submit' and contains(text(), 'Gerar Jogos')]
    
    # Should show validation alert
    Sleep    1s
    Alert Should Be Present    Por favor, selecione pelo menos uma categoria

*** Keywords ***
Suite Setup
    [Documentation]    Setup test suite: start browser, login, create test data
    Open Browser    ${BASE_URL}    ${BROWSER}
    Maximize Browser Window
    
    # Wait for page to load
    Wait Until Page Contains    Login    10s
    
    # Login as admin
    Wait Until Element Is Visible    id=login-modal    10s
    Input Text    id=login-username    ${ADMIN_USER}
    Input Password    id=login-password    ${ADMIN_PASS}
    Click Button    xpath=//form[@id='login-form']//button[@type='submit']
    
    # Wait for login to complete
    Wait Until Element Is Not Visible    id=login-modal    timeout=15s
    Wait Until Page Contains    Dashboard    timeout=15s
    
    # Create API session for backend verification
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    
    # Login via API to get token
    ${login_data}=    Create Dictionary
    ...    username=${ADMIN_USER}
    ...    password=${ADMIN_PASS}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/auth/login
    ...    json=${login_data}
    ...    expected_status=200
    
    ${token}=    Set Variable    ${response.json()}[token]
    Set Suite Variable    ${ADMIN_TOKEN}    ${token}
    
    # Create test categories with auth header
    ${headers}=    Create Dictionary    Authorization=Bearer ${token}
    ${timestamp}=    Get Current Date    result_format=%Y%m%d%H%M%S
    ${cat1_data}=    Create Dictionary
    ...    name=M5 Test ${timestamp}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/categories
    ...    json=${cat1_data}
    ...    headers=${headers}
    ...    expected_status=201
    
    ${cat1_id}=    Set Variable    ${response.json()}[category_id]
    Set Suite Variable    ${CATEGORY_ID_1}    ${cat1_id}
    
    ${cat2_data}=    Create Dictionary
    ...    name=M4 Test ${timestamp}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/categories
    ...    json=${cat2_data}
    ...    headers=${headers}
    ...    expected_status=201
    
    ${cat2_id}=    Set Variable    ${response.json()}[category_id]
    Set Suite Variable    ${CATEGORY_ID_2}    ${cat2_id}
    
    # Create test teams (8 teams per category)
    ${teams_cat1}=    Create List
    ${teams_cat2}=    Create List
    
    FOR    ${i}    IN RANGE    8
        ${team_data}=    Create Dictionary
        ...    name=Team ${i+1} Cat1 ${timestamp}
        ...    category_id=${cat1_id}
        
        ${response}=    POST On Session    ${SESSION_NAME}    /api/teams
        ...    json=${team_data}
        ...    headers=${headers}
        ...    expected_status=201
        
        Append To List    ${teams_cat1}    ${response.json()}[team_id]
        
        ${team_data}=    Create Dictionary
        ...    name=Team ${i+1} Cat2 ${timestamp}
        ...    category_id=${cat2_id}
        
        ${response}=    POST On Session    ${SESSION_NAME}    /api/teams
        ...    json=${team_data}
        ...    headers=${headers}
        ...    expected_status=201
        
        Append To List    ${teams_cat2}    ${response.json()}[team_id]
    END
    
    Set Suite Variable    ${TEAM_IDS_1}    ${teams_cat1}
    Set Suite Variable    ${TEAM_IDS_2}    ${teams_cat2}
    
    # Create tournament
    ${category_ids}=    Create List    ${cat1_id}    ${cat2_id}
    ${tournament_data}=    Create Dictionary
    ...    name=Test Tournament ${timestamp}
    ...    start_date=2025-06-01
    ...    end_date=2025-06-03
    ...    start_time=09:00
    ...    end_time=18:00
    ...    courts=2
    ...    match_duration_minutes=60
    ...    category_ids=${category_ids}
    
    ${response}=    POST On Session    ${SESSION_NAME}    /api/tournaments
    ...    json=${tournament_data}
    ...    headers=${headers}
    ...    expected_status=201
    
    ${tournament_id}=    Set Variable    ${response.json()}[tournament_id]
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament_id}
    
    # Refresh page to show tournament
    Reload Page
    Wait Until Page Contains    Torneios    10s

Suite Teardown
    [Documentation]    Cleanup: delete test data and close browser
    # Delete tournament and matches via API
    Run Keyword If    '${TOURNAMENT_ID}' != '${EMPTY}'    Delete Tournament And Matches
    
    # Delete teams
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${team_ids_1}=    Get Variable Value    ${TEAM_IDS_1}    @{EMPTY}
    ${team_ids_2}=    Get Variable Value    ${TEAM_IDS_2}    @{EMPTY}
    FOR    ${team_id}    IN    @{team_ids_1}
        DELETE On Session    ${SESSION_NAME}    /api/teams/${team_id}    headers=${headers}    expected_status=any
    END
    FOR    ${team_id}    IN    @{team_ids_2}
        DELETE On Session    ${SESSION_NAME}    /api/teams/${team_id}    headers=${headers}    expected_status=any
    END
    
    # Delete categories
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${CATEGORY_ID_1}' != '${EMPTY}'
    ...    DELETE On Session    ${SESSION_NAME}    /api/categories/${CATEGORY_ID_1}    headers=${headers}
    
    Run Keyword If    '${CATEGORY_ID_2}' != '${EMPTY}'
    ...    DELETE On Session    ${SESSION_NAME}    /api/categories/${CATEGORY_ID_2}    headers=${headers}
    
    Delete All Sessions
    Close Browser

Test Teardown
    [Documentation]    Cleanup after each test: delete matches
    Run Keyword If    '${TOURNAMENT_ID}' != '${EMPTY}'    Delete Tournament Matches

Delete Tournament And Matches
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    # Delete matches first
    ${response}=    GET On Session    ${SESSION_NAME}    /api/matches    params=tournament_id=${TOURNAMENT_ID}    headers=${headers}
    Run Keyword If    ${response.status_code} == 200    Delete Matches List    ${response.json()}    ${headers}
    
    # Delete tournament
    DELETE On Session    ${SESSION_NAME}    /api/tournaments/${TOURNAMENT_ID}    headers=${headers}    expected_status=any

Delete Tournament Matches
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    ${response}=    GET On Session    ${SESSION_NAME}    /api/matches    params=tournament_id=${TOURNAMENT_ID}    headers=${headers}
    Run Keyword If    ${response.status_code} == 200    Delete Matches List    ${response.json()}    ${headers}

Delete Matches
    [Arguments]    @{matches}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    FOR    ${match}    IN    @{matches}
        ${match_id}=    Get From Dictionary    ${match}    match_id
        DELETE On Session    ${SESSION_NAME}    /api/matches/${match_id}    headers=${headers}
    END

Delete Matches List
    [Arguments]    ${matches}    ${headers}
    FOR    ${match}    IN    @{matches}
        ${match_id}=    Get From Dictionary    ${match}    match_id
        DELETE On Session    ${SESSION_NAME}    /api/matches/${match_id}    headers=${headers}    expected_status=any
    END

Delete Teams
    [Arguments]    @{team_ids}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    FOR    ${team_id}    IN    @{team_ids}
        DELETE On Session    ${SESSION_NAME}    /api/teams/${team_id}    headers=${headers}
    END

Delete Teams List
    [Arguments]    ${team_ids}    ${headers}
    FOR    ${team_id}    IN    @{team_ids}
        DELETE On Session    ${SESSION_NAME}    /api/teams/${team_id}    headers=${headers}    expected_status=any
    END
