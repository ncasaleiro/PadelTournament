*** Settings ***
Documentation    Test to validate that "Novo Torneio" button structure is correct (no browser required)
Library          Collections
Library          String
Library          OperatingSystem

*** Variables ***
${HTML_FILE}     ${CURDIR}/../../public/index.html
${JS_FILE}       ${CURDIR}/../../public/app.js

*** Test Cases ***

Test Novo Torneio Button Exists In HTML
    [Documentation]    Should verify that "Novo Torneio" button exists in HTML structure
    [Tags]    tournament    frontend    button    structure
    
    ${html_content}=    OperatingSystem.Get File    ${HTML_FILE}
    
    # Verify button exists
    Should Contain    ${html_content}    btn-new-tournament
    Should Contain    ${html_content}    + Novo Torneio
    
    # Verify button is in tournaments-page
    Should Contain    ${html_content}    tournaments-page
    Should Contain    ${html_content}    id="tournaments-page"
    
    # Verify button is in page-header
    ${page_header_pattern}=    Set Variable    tournaments-page.*?page-header.*?btn-new-tournament
    ${matches}=    Get Regexp Matches    ${html_content}    (?s)${page_header_pattern}
    Should Not Be Empty    ${matches}    Button should be inside page-header within tournaments-page

Test Novo Torneio Button Has Correct Attributes
    [Documentation]    Should verify that button has correct HTML attributes
    [Tags]    tournament    frontend    button    attributes
    
    ${html_content}=    OperatingSystem.Get File    ${HTML_FILE}
    
    # Verify button has id
    Should Contain    ${html_content}    id="btn-new-tournament"
    
    # Verify button has onclick handler
    Should Contain    ${html_content}    onclick="openTournamentModal()"
    
    # Verify button has correct classes
    Should Contain    ${html_content}    class="btn btn-primary"
    
    # Verify button text
    Should Contain    ${html_content}    >+ Novo Torneio<

Test Novo Torneio Button Function Exists
    [Documentation]    Should verify that openTournamentModal function exists
    [Tags]    tournament    frontend    button    function
    
    ${js_content}=    OperatingSystem.Get File    ${JS_FILE}
    
    # Verify function exists (definition)
    Should Contain    ${js_content}    function openTournamentModal
    
    # Verify function is called in onclick (check HTML)
    ${html_content}=    OperatingSystem.Get File    ${HTML_FILE}
    Should Contain    ${html_content}    onclick="openTournamentModal()"

Test Novo Torneio Button Visibility Logic
    [Documentation]    Should verify that button visibility is controlled by user role
    [Tags]    tournament    frontend    button    visibility    role
    
    ${js_content}=    OperatingSystem.Get File    ${JS_FILE}
    
    # Verify role-based visibility logic exists
    Should Contain    ${js_content}    btn-new-tournament
    Should Contain    ${js_content}    currentUser.role === 'admin'
    Should Contain    ${js_content}    style.display
    Should Contain    ${js_content}    updateUIForRole

Test Page Header Structure
    [Documentation]    Should verify that page-header structure is correct
    [Tags]    tournament    frontend    structure    layout
    
    ${html_content}=    OperatingSystem.Get File    ${HTML_FILE}
    
    # Verify tournaments-page exists
    Should Contain    ${html_content}    id="tournaments-page"
    
    # Verify page-header exists within tournaments-page
    ${pattern}=    Set Variable    (?s)id="tournaments-page".*?class="page-header"
    ${matches}=    Get Regexp Matches    ${html_content}    ${pattern}
    Should Not Be Empty    ${matches}    page-header should exist within tournaments-page
    
    # Verify h2 title exists
    Should Contain    ${html_content}    <h2>Torneios</h2>

Test Button Position Relative To Header
    [Documentation]    Should verify that button appears after h2 in page-header (top right position)
    [Tags]    tournament    frontend    button    position
    
    ${html_content}=    OperatingSystem.Get File    ${HTML_FILE}
    
    # Verify h2 comes before button in the structure
    ${h2_before_btn}=    Get Regexp Matches    ${html_content}    (?s)id="tournaments-page".*?<h2>Torneios</h2>.*?btn-new-tournament
    Should Not Be Empty    ${h2_before_btn}    Button should appear after h2 title in page-header
    
    # Verify both are in page-header
    ${both_in_header}=    Get Regexp Matches    ${html_content}    (?s)class="page-header".*?<h2>Torneios</h2>.*?btn-new-tournament
    Should Not Be Empty    ${both_in_header}    Both h2 and button should be in page-header

Test Button Consistency With Other Pages
    [Documentation]    Should verify that button structure matches other "New" buttons
    [Tags]    tournament    frontend    button    consistency
    
    ${html_content}=    OperatingSystem.Get File    ${HTML_FILE}
    
    # Verify tournaments button follows same pattern as categories button
    Should Contain    ${html_content}    btn-new-category
    Should Contain    ${html_content}    btn-new-team
    Should Contain    ${html_content}    btn-new-tournament
    
    # All should have same class pattern
    Should Contain    ${html_content}    class="btn btn-primary"
    
    # All should have onclick handlers
    Should Contain    ${html_content}    onclick="openCategoryModal()
    Should Contain    ${html_content}    onclick="openTeamModal()
    Should Contain    ${html_content}    onclick="openTournamentModal()


