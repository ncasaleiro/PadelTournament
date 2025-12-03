*** Settings ***
Documentation    Simplified frontend tests using JavaScript execution (no Selenium)
Library          Collections
Library          String
Library          OperatingSystem
Library          Process

Suite Setup    Start Server
Suite Teardown    Stop Server

*** Variables ***
${SERVER_PORT}    3000
${BASE_URL}       http://localhost:${SERVER_PORT}
${NODE_PATH}      node

*** Test Cases ***
Test Frontend Files Exist
    [Documentation]    Verify all frontend files exist
    [Tags]    files    frontend
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/index.html
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/app.js
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/styles.css
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/match.html
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/match.js
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/referee.html
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/referee.js

Test Frontend HTML Structure
    [Documentation]    Verify HTML structure is correct
    [Tags]    html    structure
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    login-modal
    Should Contain    ${html_content}    dashboard-page
    Should Contain    ${html_content}    categories-page
    Should Contain    ${html_content}    teams-page
    Should Contain    ${html_content}    matches-page
    Should Contain    ${html_content}    standings-page
    Should Contain    ${html_content}    users-page

Test Frontend JavaScript Functions
    [Documentation]    Verify JavaScript functions exist
    [Tags]    javascript    functions
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    function handleLogin
    Should Contain    ${js_content}    function logout
    Should Contain    ${js_content}    function loadDashboard
    Should Contain    ${js_content}    function openCategoryModal
    Should Contain    ${js_content}    function openTeamModal
    Should Contain    ${js_content}    function openMatchModal
    Should Contain    ${js_content}    function openUserModal
    Should Contain    ${js_content}    function updateUIForRole

Test Frontend Role-Based Functions
    [Documentation]    Verify role-based access control functions exist
    [Tags]    javascript    roles    rbac
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    currentUser.role === 'admin'
    Should Contain    ${js_content}    currentUser.role === 'referee'
    Should Contain    ${js_content}    currentUser.role === 'viewer'

Test Referee JavaScript Functions
    [Documentation]    Verify referee.js has required functions
    [Tags]    javascript    referee
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/referee.js
    Should Contain    ${js_content}    function loadMatch
    Should Contain    ${js_content}    function recordPoint
    Should Contain    ${js_content}    function undoLastAction
    Should Contain    ${js_content}    function saveRefereeNotes

Test Match JavaScript Functions
    [Documentation]    Verify match.js has required functions
    [Tags]    javascript    match
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/match.js
    Should Contain    ${js_content}    function loadMatch
    Should Contain    ${js_content}    function updateScore
    Should Contain    ${js_content}    function renderMatch

Test CSS File Exists
    [Documentation]    Verify CSS file exists and has content
    [Tags]    css    styles
    OperatingSystem.File Should Exist    ${CURDIR}/../../public/styles.css
    ${css_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/styles.css
    Should Not Be Empty    ${css_content}
    Should Contain    ${css_content}    .modal
    Should Contain    ${css_content}    .btn

Test API Base URL Configuration
    [Documentation]    Verify API base URL is configured correctly
    [Tags]    javascript    api
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    const API_BASE = '/api'
    ${referee_js}=    OperatingSystem.Get File    ${CURDIR}/../../public/referee.js
    Should Contain    ${referee_js}    const API_BASE = '/api'
    ${match_js}=    OperatingSystem.Get File    ${CURDIR}/../../public/match.js
    Should Contain    ${match_js}    const API_BASE = '/api'

Test LocalStorage Usage
    [Documentation]    Verify localStorage is used for authentication
    [Tags]    javascript    storage
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    localStorage.getItem('currentUser')
    Should Contain    ${js_content}    localStorage.setItem('currentUser'
    Should Contain    ${js_content}    localStorage.removeItem('currentUser'

Test Event Handlers
    [Documentation]    Verify event handlers are set up
    [Tags]    javascript    events
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    DOMContentLoaded
    Should Contain    ${js_content}    addEventListener

Test Error Handling
    [Documentation]    Verify error handling exists
    [Tags]    javascript    errors
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    catch
    Should Contain    ${js_content}    console.error
    Should Contain    ${js_content}    alert

Test Form Validation
    [Documentation]    Verify form validation exists
    [Tags]    javascript    forms    validation
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    required
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    preventDefault

*** Keywords ***
Start Server
    [Documentation]    Start the Node.js server
    Start Process    ${NODE_PATH}    ${CURDIR}/../../src/server.js    shell=True
    Sleep    3s    # Wait for server to start

Stop Server
    [Documentation]    Stop the Node.js server
    Terminate All Processes    kill=True

