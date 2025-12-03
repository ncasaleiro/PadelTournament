*** Settings ***
Documentation    Test match button functionality - clicking on match buttons
Library          SeleniumLibrary
Library          Collections
Library          String

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
Test Match Button Click As Admin
    [Documentation]    Admin should be able to click on match button and navigate to match page
    [Tags]    match    button    admin
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Navigate To Matches Page
    Wait Until Page Contains    Jogos
    ${match_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Ver Jogo')]
    Run Keyword If    ${match_buttons.__len__()} > 0    Click Match Button And Verify Navigation    ${match_buttons[0]}
    Run Keyword If    ${match_buttons.__len__()} == 0    Log    No matches available to test

Test Match Button Click As Referee
    [Documentation]    Referee should be able to click on match button and navigate to referee tool
    [Tags]    match    button    referee
    Login As User    ${REFEREE_USERNAME}    ${REFEREE_PASSWORD}
    Navigate To Matches Page
    Wait Until Page Contains    Jogos
    ${match_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Árbitro') or contains(text(), 'Ver Jogo')]
    Run Keyword If    ${match_buttons.__len__()} > 0    Click Match Button And Verify Referee Navigation    ${match_buttons[0]}
    Run Keyword If    ${match_buttons.__len__()} == 0    Log    No matches available to test

Test Start Match Button As Admin
    [Documentation]    Admin should be able to click start match button
    [Tags]    match    start    admin
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Navigate To Matches Page
    Wait Until Page Contains    Jogos
    ${start_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Iniciar')]
    Run Keyword If    ${start_buttons.__len__()} > 0    Click Element    ${start_buttons[0]}
    Run Keyword If    ${start_buttons.__len__()} > 0    Sleep    2s
    Run Keyword If    ${start_buttons.__len__()} > 0    Page Should Contain    Em Curso
    Run Keyword If    ${start_buttons.__len__()} == 0    Log    No scheduled matches available to test

Test Start Match Button As Referee
    [Documentation]    Referee should be able to click start match button
    [Tags]    match    start    referee
    Login As User    ${REFEREE_USERNAME}    ${REFEREE_PASSWORD}
    Navigate To Matches Page
    Wait Until Page Contains    Jogos
    ${start_buttons}=    Get WebElements    xpath=//button[contains(text(), 'Iniciar')]
    Run Keyword If    ${start_buttons.__len__()} > 0    Click Element    ${start_buttons[0]}
    Run Keyword If    ${start_buttons.__len__()} > 0    Sleep    2s
    Run Keyword If    ${start_buttons.__len__()} > 0    Page Should Contain    Em Curso
    Run Keyword If    ${start_buttons.__len__()} == 0    Log    No scheduled matches available to test

Test Match Button Exists For Scheduled Matches
    [Documentation]    Verify match buttons exist for scheduled matches
    [Tags]    match    button    ui
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Navigate To Matches Page
    Wait Until Page Contains    Jogos
    Select From List By Value    id=filter-match-status    scheduled
    Sleep    1s
    ${match_cards}=    Get WebElements    class:match-card
    Run Keyword If    ${match_cards.__len__()} > 0    Verify Match Buttons Exist
    Run Keyword If    ${match_cards.__len__()} == 0    Log    No scheduled matches available

Test Match Button Exists For Playing Matches
    [Documentation]    Verify match buttons exist for playing matches
    [Tags]    match    button    ui
    Login As User    ${ADMIN_USERNAME}    ${ADMIN_PASSWORD}
    Navigate To Matches Page
    Wait Until Page Contains    Jogos
    Select From List By Value    id=filter-match-status    playing
    Sleep    1s
    ${match_cards}=    Get WebElements    class:match-card
    Run Keyword If    ${match_cards.__len__()} > 0    Verify Match Buttons Exist
    Run Keyword If    ${match_cards.__len__()} == 0    Log    No playing matches available

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
    Wait Until Element Is Visible    id=login-modal    timeout=10s
    Input Text    id=login-username    ${username}
    Input Text    id=login-password    ${password}
    Click Button    xpath=//form[@id='login-form']//button[@type='submit']
    Wait Until Element Is Not Visible    id=login-modal    timeout=10s
    Wait Until Page Contains    Dashboard    timeout=10s

Navigate To Matches Page
    [Documentation]    Navigate to matches page
    Click Element    xpath=//a[@data-page='matches']
    Wait Until Page Contains    Jogos    timeout=10s
    Sleep    1s    # Wait for matches to load

Click Match Button And Verify Navigation
    [Arguments]    ${button}
    [Documentation]    Click match button and verify navigation to match page
    ${current_url}=    Get Location
    Click Element    ${button}
    Sleep    2s    # Wait for navigation
    ${new_url}=    Get Location
    Should Not Be Equal    ${current_url}    ${new_url}
    Should Contain    ${new_url}    match.html
    Log    Successfully navigated to match page

Click Match Button And Verify Referee Navigation
    [Arguments]    ${button}
    [Documentation]    Click match button and verify navigation to referee tool
    ${current_url}=    Get Location
    ${button_text}=    Get Text    ${button}
    Log    Clicking button: ${button_text}
    Click Element    ${button}
    Sleep    3s    # Wait for navigation
    ${new_url}=    Get Location
    Log    Current URL: ${current_url}, New URL: ${new_url}
    Should Not Be Equal    ${current_url}    ${new_url}
    Should Contain    ${new_url}    referee.html
    Log    Successfully navigated to referee tool

Verify Match Buttons Exist
    [Documentation]    Verify that match buttons exist in match cards
    ${match_cards}=    Get WebElements    class:match-card
    FOR    ${card}    IN    @{match_cards}
        ${buttons}=    Get WebElements    ${card}    xpath=.//button
        Should Be True    ${buttons.__len__()} > 0    No buttons found in match card
    END

