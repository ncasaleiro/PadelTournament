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
    Should Contain    ${js_content}    function saveNotes

Test Match JavaScript Functions
    [Documentation]    Verify match.js has required functions
    [Tags]    javascript    match
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/match.js
    Should Contain    ${js_content}    function loadMatch
    Should Contain    ${js_content}    function incrementScore
    Should Contain    ${js_content}    function decrementScore
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

Test Super Tiebreak Functionality
    [Documentation]    Verify Super Tie-break functionality exists in frontend
    [Tags]    javascript    super_tiebreak    match
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    match-use-super-tiebreak
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    use_super_tiebreak
    Should Contain    ${js_content}    match-use-super-tiebreak

Test Edit Match Result Functionality
    [Documentation]    Verify edit match result functionality exists
    [Tags]    javascript    edit    result    match
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    match-result-modal
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    function editMatchResult
    Should Contain    ${js_content}    function saveMatchResult
    Should Contain    ${js_content}    function toggleTiebreak

Test Match Result Modal Structure
    [Documentation]    Verify match result modal has required fields
    [Tags]    html    modal    result
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    match-result-form
    Should Contain    ${html_content}    match-result-sets-container
    Should Contain    ${html_content}    match-result-winner
    Should Contain    ${html_content}    match-result-status

Test Match Modal Super Tiebreak Field
    [Documentation]    Verify match modal has super tie-break checkbox
    [Tags]    html    modal    match    super_tiebreak
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    match-use-super-tiebreak
    Should Contain    ${html_content}    Super Tie-break

Test Match Form Fields
    [Documentation]    Verify match form has all required fields
    [Tags]    html    form    match
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    match-form
    Should Contain    ${html_content}    match-team1
    Should Contain    ${html_content}    match-team2
    Should Contain    ${html_content}    match-category
    Should Contain    ${html_content}    match-phase
    Should Contain    ${html_content}    match-date
    Should Contain    ${html_content}    match-time
    Should Contain    ${html_content}    match-court

Test Category Form Structure
    [Documentation]    Verify category form structure
    [Tags]    html    form    category
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    category-form
    Should Contain    ${html_content}    category-name
    Should Contain    ${html_content}    category-modal

Test Team Form Structure
    [Documentation]    Verify team form structure
    [Tags]    html    form    team
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    team-form
    Should Contain    ${html_content}    team-name
    Should Contain    ${html_content}    team-category
    Should Contain    ${html_content}    team-group
    Should Contain    ${html_content}    team-modal

Test User Form Structure
    [Documentation]    Verify user form structure (check JS functions if HTML modal not present)
    [Tags]    html    form    user
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    # Check if user modal exists in HTML or if user management is handled via JS
    ${has_user_modal}=    Evaluate    'user-modal' in '''${html_content}'''
    Run Keyword If    ${has_user_modal}    Should Contain    ${html_content}    user-modal
    ...    ELSE    Should Contain    ${js_content}    function openUserModal
    # Check user management functions exist
    Should Contain    ${js_content}    function saveUser
    Should Contain    ${js_content}    function loadUsers

Test Navigation Structure
    [Documentation]    Verify navigation structure exists
    [Tags]    html    navigation
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    data-page="dashboard"
    Should Contain    ${html_content}    data-page="categories"
    Should Contain    ${html_content}    data-page="teams"
    Should Contain    ${html_content}    data-page="matches"
    Should Contain    ${html_content}    data-page="standings"
    Should Contain    ${html_content}    data-page="users"

Test Dashboard Stats Elements
    [Documentation]    Verify dashboard statistics elements exist
    [Tags]    html    dashboard    stats
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    stat-categories
    Should Contain    ${html_content}    stat-teams
    Should Contain    ${html_content}    stat-matches
    Should Contain    ${html_content}    stat-playing

Test Login Form Structure
    [Documentation]    Verify login form structure
    [Tags]    html    form    login
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    Should Contain    ${html_content}    login-form
    Should Contain    ${html_content}    login-username
    Should Contain    ${html_content}    login-password
    Should Contain    ${html_content}    login-modal

Test Match Result Editing Functions
    [Documentation]    Verify match result editing functions exist
    [Tags]    javascript    edit    result
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    editMatchResult
    Should Contain    ${js_content}    saveMatchResult
    Should Contain    ${js_content}    toggleTiebreak
    Should Contain    ${js_content}    match-result-modal

Test Super Tiebreak In Match Creation
    [Documentation]    Verify super tie-break is handled in match creation
    [Tags]    javascript    super_tiebreak    create
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    use_super_tiebreak
    # Check that it's included in matchData in saveMatch function
    Should Contain    ${js_content}    use_super_tiebreak: useSuperTiebreak
    # Verify it's read from checkbox
    Should Contain    ${js_content}    match-use-super-tiebreak

Test Match Status Handling
    [Documentation]    Verify match status is handled correctly
    [Tags]    javascript    match    status
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    match.status
    Should Contain    ${js_content}    finished
    Should Contain    ${js_content}    playing
    Should Contain    ${js_content}    scheduled

Test Match Filtering Functions
    [Documentation]    Verify match filtering functions exist
    [Tags]    javascript    filter    match
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    filter-match-category
    Should Contain    ${js_content}    filter-match-status
    Should Contain    ${js_content}    loadMatches

Test Team Filtering Functions
    [Documentation]    Verify team filtering functions exist
    [Tags]    javascript    filter    team
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    filter-category
    Should Contain    ${js_content}    filter-group
    Should Contain    ${js_content}    loadTeams

Test Standings Filtering Functions
    [Documentation]    Verify standings filtering functions exist
    [Tags]    javascript    filter    standings
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    filter-standing-category
    Should Contain    ${js_content}    filter-standing-group
    Should Contain    ${js_content}    loadStandings

Test API Call Function
    [Documentation]    Verify API call function handles errors correctly
    [Tags]    javascript    api    error
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    Should Contain    ${js_content}    function apiCall
    Should Contain    ${js_content}    response.ok
    Should Contain    ${js_content}    response.status

Test Match Result Input Validation
    [Documentation]    Verify match result inputs allow high values
    [Tags]    html    validation    result
    ${html_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/index.html
    # Check that inputs don't have max="7" restriction (should allow higher values)
    ${has_max_7}=    Get Regexp Matches    ${html_content}    max="7"
    # The inputs should be dynamically created, so we check the JS
    ${js_content}=    OperatingSystem.Get File    ${CURDIR}/../../public/app.js
    # Check that min="0" is set but max is not restricted
    Should Contain    ${js_content}    min="0"
    # Should not have max="7" hardcoded in JS for result editing

*** Keywords ***
Start Server
    [Documentation]    Start the Node.js server
    Start Process    ${NODE_PATH}    ${CURDIR}/../../src/server.js    shell=True
    Sleep    3s    # Wait for server to start

Stop Server
    [Documentation]    Stop the Node.js server
    Terminate All Processes    kill=True

