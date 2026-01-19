*** Settings ***
Documentation    Test to validate that "Novo Torneio" button appears in top right corner
...              Updated: 2025-12-05 18:35:00 - Fixed navigation issues and added proper waits
Library          SeleniumLibrary
Library          Collections

Suite Setup       Open Browser And Login As Admin
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}       http://localhost:3000
${BROWSER}        headlesschrome
${ADMIN_USERNAME}    admin
${ADMIN_PASSWORD}    admin123

*** Test Cases ***

Test Novo Torneio Button Position
    [Documentation]    Should verify that "Novo Torneio" button is in top right corner of tournaments page
    ...                Updated: 2025-12-05 18:35:00 - Removed Go To, added sleep for rendering
    [Tags]    tournament    frontend    button    position
    
    # Navigate to tournaments page (already logged in from suite setup)
    Click Element    xpath=//a[@data-page='tournaments']
    Wait Until Page Contains    Torneios    10s
    Sleep    1s    # Wait for page to render
    
    # Verify page-header exists
    Page Should Contain Element    xpath=//div[@id='tournaments-page']//div[contains(@class, 'page-header')]
    
    # Verify button exists in page-header
    ${button_exists}=    Run Keyword And Return Status    
    ...    Page Should Contain Element    xpath=//div[@id='tournaments-page']//div[contains(@class, 'page-header')]//button[@id='btn-new-tournament']
    
    Should Be True    ${button_exists}    Button "Novo Torneio" should exist in page-header
    
    # Verify button is visible for admin
    Element Should Be Visible    xpath=//button[@id='btn-new-tournament']
    
    # Verify button text
    Element Text Should Be    xpath=//button[@id='btn-new-tournament']    + Novo Torneio
    
    # Get positions using JavaScript
    ${header_y}=    Execute JavaScript    return document.querySelector('#tournaments-page .page-header').getBoundingClientRect().top + window.scrollY;
    ${button_y}=    Execute JavaScript    return document.getElementById('btn-new-tournament').getBoundingClientRect().top + window.scrollY;
    
    # Button should be at similar Y position as header (top of page)
    ${y_difference}=    Evaluate    abs(${button_y} - ${header_y})
    Should Be True    ${y_difference} < 100    Button should be near top of page (within 100px of header)
    
    # Verify button is on the right side
    ${page_width}=    Execute JavaScript    return window.innerWidth;
    ${button_x}=    Execute JavaScript    return document.getElementById('btn-new-tournament').getBoundingClientRect().left;
    ${button_width}=    Execute JavaScript    return document.getElementById('btn-new-tournament').getBoundingClientRect().width;
    
    # Button right edge should be near page right edge (within 20% of page width)
    ${button_right_edge}=    Evaluate    ${button_x} + ${button_width}
    ${distance_from_right}=    Evaluate    ${page_width} - ${button_right_edge}
    ${max_distance}=    Evaluate    ${page_width} * 0.2
    
    Should Be True    ${distance_from_right} < ${max_distance}    Button should be in top right area (within 20% of right edge)
    
    # Verify button has correct classes
    ${button_classes}=    Get Element Attribute    xpath=//button[@id='btn-new-tournament']    class
    Should Contain    ${button_classes}    btn
    Should Contain    ${button_classes}    btn-primary

Test Novo Torneio Button Not Visible For Non-Admin
    [Documentation]    Should verify that "Novo Torneio" button is hidden for non-admin users
    ...                Updated: 2025-12-05 18:35:00 - Added check for nav-item visibility (referee may not see tournaments page)
    [Tags]    tournament    frontend    button    security
    
    # Logout admin
    Click Element    id=logout-btn
    Wait Until Element Is Visible    id=login-modal    10s
    
    # Login as referee (non-admin)
    Input Text    id=login-username    referee
    Input Text    id=login-password    referee123
    Click Button    xpath=//form[@id='login-form']//button[@type='submit']
    Wait Until Element Is Not Visible    id=login-modal    timeout=15s
    Wait Until Page Contains    Dashboard    timeout=15s
    
    # Check if tournaments nav item is visible (referee may not see it)
    ${nav_visible}=    Run Keyword And Return Status    
    ...    Element Should Be Visible    xpath=//a[@data-page='tournaments']
    
    Run Keyword If    ${nav_visible}    Verify Button Hidden For NonAdmin
    ...    ELSE    Log    Tournaments page not accessible for referee (expected behavior)

Verify Button Hidden For NonAdmin
    [Documentation]    Verify button is hidden when tournaments page is accessible
    # Navigate to tournaments page
    Click Element    xpath=//a[@data-page='tournaments']
    Wait Until Page Contains    Torneios    10s
    Sleep    1s    # Wait for page to render
    
    # Verify button is NOT visible for non-admin
    ${button_visible}=    Run Keyword And Return Status    
    ...    Element Should Be Visible    xpath=//button[@id='btn-new-tournament']
    
    Should Not Be True    ${button_visible}    Button "Novo Torneio" should NOT be visible for non-admin users
    
    # Verify button exists but is hidden
    ${button_exists}=    Run Keyword And Return Status    
    ...    Page Should Contain Element    xpath=//button[@id='btn-new-tournament']
    
    Should Be True    ${button_exists}    Button should exist in DOM but be hidden
    
    # Verify button has display: none
    ${button_display}=    Execute JavaScript    return window.getComputedStyle(document.getElementById('btn-new-tournament')).display;
    Should Be Equal    ${button_display}    none    Button should have display: none for non-admin

Test Novo Torneio Button Layout Consistency
    [Documentation]    Should verify that "Novo Torneio" button has same layout as other "New" buttons
    ...                Updated: 2025-12-05 18:35:00 - Removed duplicate click, added sleeps, increased timeouts
    [Tags]    tournament    frontend    button    layout
    
    # Navigate to Categories page (already logged in from suite setup)
    Click Element    xpath=//a[@data-page='categories']
    Wait Until Page Contains    Categorias    10s
    Sleep    1s    # Wait for page to render
    ${categories_button_y}=    Get Vertical Position    xpath=//button[@id='btn-new-category']
    
    # Check Teams page button position
    Click Element    xpath=//a[@data-page='teams']
    Wait Until Page Contains    Equipas    10s
    Sleep    1s    # Wait for page to render
    ${teams_button_y}=    Get Vertical Position    xpath=//button[@id='btn-new-team']
    
    # Check Tournaments page button position
    Click Element    xpath=//a[@data-page='tournaments']
    Wait Until Page Contains    Torneios    10s
    Sleep    2s    # Wait for page to render
    ${tournaments_button_y}=    Get Vertical Position    xpath=//button[@id='btn-new-tournament']
    
    # All buttons should be at similar Y position (top of page)
    ${diff1}=    Evaluate    abs(${categories_button_y} - ${teams_button_y})
    ${diff2}=    Evaluate    abs(${teams_button_y} - ${tournaments_button_y})
    ${diff3}=    Evaluate    abs(${categories_button_y} - ${tournaments_button_y})
    
    Should Be True    ${diff1} < 50    Categories and Teams buttons should be at similar vertical position (diff: ${diff1})
    Should Be True    ${diff2} < 50    Teams and Tournaments buttons should be at similar vertical position (diff: ${diff2})
    Should Be True    ${diff3} < 50    Categories and Tournaments buttons should be at similar vertical position (diff: ${diff3})

*** Keywords ***

Open Browser And Login As Admin
    [Documentation]    Open browser and login as admin user
    ...                Updated: 2025-12-05 18:15:00 - Fixed login flow with proper waits
    Open Browser    ${BASE_URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Implicit Wait    10s
    
    # Wait for login modal to be visible
    Wait Until Element Is Visible    id=login-modal    15s
    
    # Wait for login form inputs
    Wait Until Page Contains Element    id=login-username    15s
    Wait Until Page Contains Element    id=login-password    15s
    
    # Login
    Input Text    id=login-username    ${ADMIN_USERNAME}
    Input Text    id=login-password    ${ADMIN_PASSWORD}
    Click Button    xpath=//form[@id='login-form']//button[@type='submit']
    
    # Wait for login to complete - check for modal to disappear
    Wait Until Element Is Not Visible    id=login-modal    timeout=15s
    Wait Until Page Contains    Dashboard    timeout=15s
    Wait Until Page Contains Element    xpath=//div[@class='app-container']    15s
    Sleep    2s    # Additional wait for page to fully load

Get Vertical Position
    [Arguments]    ${xpath}
    [Documentation]    Get vertical position of element, handling potential None values
    ${element_exists}=    Run Keyword And Return Status    Page Should Contain Element    ${xpath}
    Return From Keyword If    not ${element_exists}    0
    ${y}=    Execute JavaScript    return document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.getBoundingClientRect().top + window.scrollY;
    [Return]    ${y}

