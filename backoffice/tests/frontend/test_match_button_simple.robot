*** Settings ***
Documentation    Simple tests for match button functionality (no browser required)
Library          Collections
Library          String
Library          OperatingSystem

*** Test Cases ***
Test OpenMatchPage Function Exists
    [Documentation]    Verify openMatchPage function exists in app.js
    [Tags]    match    button    function
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    function openMatchPage
    Should Contain    ${js_content}    window.openMatchPage = openMatchPage

Test OpenMatchPage Function Logic
    [Documentation]    Verify openMatchPage function has correct logic
    [Tags]    match    button    logic
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    window.location.href
    Should Contain    ${js_content}    referee.html
    Should Contain    ${js_content}    match.html
    Should Contain    ${js_content}    currentUser.role === 'referee'

Test StartMatch Function Exists
    [Documentation]    Verify startMatch function exists in app.js
    [Tags]    match    start    function
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    async function startMatch
    Should Contain    ${js_content}    window.startMatch

Test Match Button Onclick Attribute
    [Documentation]    Verify match buttons have onclick attribute
    [Tags]    match    button    onclick
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    onclick="openMatchPage
    Should Contain    ${js_content}    onclick="startMatch

Test CurrentUser Check In OpenMatchPage
    [Documentation]    Verify openMatchPage checks for currentUser
    [Tags]    match    button    security
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    if (!currentUser)
    Should Contain    ${js_content}    localStorage.getItem('currentUser')

Test Match ID Validation
    [Documentation]    Verify match ID is validated in openMatchPage
    [Tags]    match    button    validation
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    if (!id || isNaN(id))
    Should Contain    ${js_content}    Invalid match ID

Test Error Handling In OpenMatchPage
    [Documentation]    Verify error handling exists in openMatchPage
    [Tags]    match    button    error
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    try
    Should Contain    ${js_content}    catch
    Should Contain    ${js_content}    console.error

Test Match HTML Files Exist
    [Documentation]    Verify match.html and referee.html files exist
    [Tags]    match    files
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/match.html
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/referee.html

