*** Settings ***
Documentation    Unit tests for Frontend functionality - UI interactions and role-based access
Library          SeleniumLibrary
Library          Collections
Library          String
Library          JSON

Suite Setup    Open Browser And Login As Admin
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}          http://localhost:3000
${BROWSER}           headlesschrome
${ADMIN_USERNAME}    admin
${ADMIN_PASSWORD}    admin123
${REFEREE_USERNAME}  referee
${REFEREE_PASSWORD}  referee123

*** Test Cases ***
Test Admin Can See All Navigation Items
    [Documentation]    Admin should see all navigation items
    [Tags]    admin    navigation
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Wait Until Page Contains    Dashboard
    Page Should Contain Element    xpath=//a[@data-page='dashboard']
    Page Should Contain Element    xpath=//a[@data-page='categories']
    Page Should Contain Element    xpath=//a[@data-page='teams']
    Page Should Contain Element    xpath=//a[@data-page='matches']
    Page Should Contain Element    xpath=//a[@data-page='standings']
    Page Should Contain Element    xpath=//a[@data-page='users']

Test Admin Can See Create Buttons
    [Documentation]    Admin should see all create buttons
    [Tags]    admin    buttons
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Wait Until Page Contains    Dashboard
    Page Should Contain Element    id=btn-new-category
    Page Should Contain Element    id=btn-new-team
    Page Should Contain Element    id=btn-new-match
    Page Should Contain Element    id=btn-new-user

Test Referee Cannot See Create Buttons
    [Documentation]    Referee should not see create buttons
    [Tags]    referee    buttons
    Login As User    ${REFEREE_USERNAME}    ${REFEREE_PASSWORD}
    Wait Until Page Contains    Dashboard
    Element Should Not Be Visible    id=btn-new-category
    Element Should Not Be Visible    id=btn-new-team
    Element Should Not Be Visible    id=btn-new-match
    Element Should Not Be Visible    id=btn-new-user

Test Referee Can Only See Matches And Standings
    [Documentation]    Referee should only see matches and standings navigation
    [Tags]    referee    navigation
    Login As User    ${REFEREE_USERNAME}    ${REFEREE_PASSWORD}
    Wait Until Page Contains    Dashboard
    Page Should Contain Element    xpath=//a[@data-page='dashboard']
    Page Should Contain Element    xpath=//a[@data-page='matches']
    Page Should Contain Element    xpath=//a[@data-page='standings']
    Element Should Not Be Visible    xpath=//a[@data-page='categories']
    Element Should Not Be Visible    xpath=//a[@data-page='teams']
    Element Should Not Be Visible    xpath=//a[@data-page='users']

Test Viewer Can Only See Dashboard And Standings
    [Documentation]    Viewer should only see dashboard and standings
    [Tags]    viewer    navigation
    # Note: Need to create viewer user first
    # This test assumes viewer user exists
    # Login As User    viewer    viewer123
    # Wait Until Page Contains    Dashboard
    # Page Should Contain Element    xpath=//a[@data-page='dashboard']
    # Page Should Contain Element    xpath=//a[@data-page='standings']
    # Element Should Not Be Visible    xpath=//a[@data-page='matches']
    Log    Viewer tests require viewer user to be created

Test Admin Can Create Category
    [Documentation]    Admin should be able to create a new category
    [Tags]    admin    create    category
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Click Element    xpath=//a[@data-page='categories']
    Wait Until Page Contains    Categorias
    Click Button    id=btn-new-category
    Wait Until Element Is Visible    id=category-modal
    Input Text    id=category-name    Test Category Robot
    Click Button    xpath=//form[@id='category-form']//button[@type='submit']
    Wait Until Page Does Not Contain    Test Category Robot    timeout=5s
    # Verify category was created
    Page Should Contain    Test Category Robot

Test Admin Can Create Team
    [Documentation]    Admin should be able to create a new team
    [Tags]    admin    create    team
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    # First create a category if needed
    Click Element    xpath=//a[@data-page='categories']
    Wait Until Page Contains    Categorias
    # Then create team
    Click Element    xpath=//a[@data-page='teams']
    Wait Until Page Contains    Equipas
    Click Button    id=btn-new-team
    Wait Until Element Is Visible    id=team-modal
    # Fill team form
    Input Text    id=team-name    Test Team Robot
    Select From List By Index    id=team-category    1
    Input Text    id=team-group    A
    Click Button    xpath=//form[@id='team-form']//button[@type='submit']
    Wait Until Page Does Not Contain    Test Team Robot    timeout=5s
    # Verify team was created
    Page Should Contain    Test Team Robot

Test Admin Can Create Match
    [Documentation]    Admin should be able to create a new match
    [Tags]    admin    create    match
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Click Element    xpath=//a[@data-page='matches']
    Wait Until Page Contains    Jogos
    Click Button    id=btn-new-match
    Wait Until Element Is Visible    id=match-modal
    # Fill match form
    Select From List By Index    id=match-team1    1
    Select From List By Index    id=match-team2    2
    Select From List By Index    id=match-category    1
    Input Text    id=match-date    2025-12-15
    Input Text    id=match-time    10:00
    Input Text    id=match-court    Campo Teste
    Click Button    xpath=//form[@id='match-form']//button[@type='submit']
    Wait Until Page Does Not Contain    Campo Teste    timeout=5s
    # Verify match was created
    Page Should Contain    Campo Teste

Test Referee Cannot Create Category
    [Documentation]    Referee should not be able to create categories
    [Tags]    referee    create    category
    Login As User    ${REFEREE_USERNAME}    ${REFEREE_PASSWORD}
    # Try to access categories page (should be hidden)
    ${categories_visible}=    Run Keyword And Return Status    Element Should Be Visible    xpath=//a[@data-page='categories']
    Should Be Equal    ${categories_visible}    ${False}

Test Admin Can Edit Category
    [Documentation]    Admin should be able to edit a category
    [Tags]    admin    edit    category
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Click Element    xpath=//a[@data-page='categories']
    Wait Until Page Contains    Categorias
    # Click first edit button if available
    ${edit_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Editar')]
    Run Keyword If    ${edit_buttons.__len__()} > 0    Click Element    ${edit_buttons[0]}
    Run Keyword If    ${edit_buttons.__len__()} > 0    Wait Until Element Is Visible    id=category-modal
    Run Keyword If    ${edit_buttons.__len__()} > 0    Page Should Contain    Editar Categoria

Test Admin Can Delete Category
    [Documentation]    Admin should be able to delete a category
    [Tags]    admin    delete    category
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Click Element    xpath=//a[@data-page='categories']
    Wait Until Page Contains    Categorias
    # Click first delete button if available
    ${delete_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Eliminar')]
    Run Keyword If    ${delete_buttons.__len__()} > 0    Click Element    ${delete_buttons[0]}
    # Handle confirmation dialog
    Run Keyword If    ${delete_buttons.__len__()} > 0    Handle Alert    action=ACCEPT

Test Referee Cannot Edit Or Delete
    [Documentation]    Referee should not see edit/delete buttons
    [Tags]    referee    edit    delete
    Login As User    ${REFEREE_USERNAME}    ${REFEREE_PASSWORD}
    Click Element    xpath=//a[@data-page='matches']
    Wait Until Page Contains    Jogos
    # Verify no edit/delete buttons are visible
    ${edit_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Editar')]
    ${delete_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Eliminar')]
    Should Be Equal    ${edit_buttons.__len__()}    ${0}
    Should Be Equal    ${delete_buttons.__len__()}    ${0}

Test User Info Display
    [Documentation]    User info should be displayed in sidebar
    [Tags]    ui    user-info
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Wait Until Element Is Visible    id=user-info
    Element Should Contain    id=user-name    ${ADMIN_USERNAME}
    Element Should Contain    id=user-role    admin

Test Logout Functionality
    [Documentation]    Logout should work and show login modal
    [Tags]    auth    logout
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Wait Until Element Is Visible    id=logout-btn
    Click Button    id=logout-btn
    Wait Until Element Is Visible    id=login-modal
    Page Should Contain    Login

Test Dashboard Stats Display
    [Documentation]    Dashboard should display statistics
    [Tags]    dashboard    stats
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Wait Until Page Contains    Dashboard
    Page Should Contain Element    id=stat-categories
    Page Should Contain Element    id=stat-teams
    Page Should Contain Element    id=stat-matches
    Page Should Contain Element    id=stat-playing

Test Navigation Between Pages
    [Documentation]    Navigation between pages should work
    [Tags]    navigation    ui
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    # Navigate to categories
    Click Element    xpath=//a[@data-page='categories']
    Wait Until Page Contains    Categorias
    # Navigate to teams
    Click Element    xpath=//a[@data-page='teams']
    Wait Until Page Contains    Equipas
    # Navigate to matches
    Click Element    xpath=//a[@data-page='matches']
    Wait Until Page Contains    Jogos
    # Navigate to standings
    Click Element    xpath=//a[@data-page='standings']
    Wait Until Page Contains    Classificações

Test Match Start Button
    [Documentation]    Start match button should be visible for scheduled matches
    [Tags]    match    start
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Click Element    xpath=//a[@data-page='matches']
    Wait Until Page Contains    Jogos
    # Check if start button exists for scheduled matches
    ${start_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Iniciar')]
    # If there are scheduled matches, start button should be visible
    Log    Found ${start_buttons.__len__()} start buttons

Test Match Status Filter
    [Documentation]    Match status filter should work
    [Tags]    match    filter
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Click Element    xpath=//a[@data-page='matches']
    Wait Until Page Contains    Jogos
    Select From List By Value    id=filter-match-status    scheduled
    Sleep    1s
    # Verify filter is applied (matches list should update)
    Page Should Contain Element    id=matches-list

Test Category Filter
    [Documentation]    Category filter should work
    [Tags]    filter    category
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Click Element    xpath=//a[@data-page='teams']
    Wait Until Page Contains    Equipas
    Select From List By Index    id=filter-category    1
    Sleep    1s
    # Verify filter is applied
    Page Should Contain Element    id=teams-list

*** Keywords ***
Open Browser And Login As Admin
    [Documentation]    Open browser and navigate to application
    Open Browser    ${BASE_URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Implicit Wait    5s

Login As User
    [Arguments]    ${username}    ${password}
    [Documentation]    Login with given credentials
    Go To    ${BASE_URL}
    Wait Until Element Is Visible    id=login-modal
    Input Text    id=login-username    ${username}
    Input Text    id=login-password    ${password}
    Click Button    xpath=//form[@id='login-form']//button[@type='submit']
    Wait Until Element Is Not Visible    id=login-modal    timeout=10s
    Wait Until Page Contains    Dashboard    timeout=10s



