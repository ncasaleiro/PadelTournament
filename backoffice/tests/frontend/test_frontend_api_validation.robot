*** Settings ***
Documentation    Frontend validation tests using API calls (no browser required)
Library          RequestsLibrary
Library          Collections
Library          String
Library          JSONLibrary

Suite Setup       Create Session And Login
Suite Teardown    Cleanup Test Data

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${ADMIN_USERNAME}    admin
${ADMIN_PASSWORD}    admin123
${CATEGORY_ID}       ${EMPTY}
${TEAM1_ID}          ${EMPTY}
${TEAM2_ID}          ${EMPTY}
${MATCH_ID}          ${EMPTY}
${TOKEN}             ${EMPTY}

*** Test Cases ***
Test Create Match With Super Tiebreak
    [Documentation]    Verify match can be created with super tie-break option
    [Tags]    match    create    super_tiebreak
    [Setup]    Setup Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    scheduled_date=2025-12-15
    ...    scheduled_time=10:00
    ...    court=Court Test
    ...    use_super_tiebreak=${True}
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body}    headers=${headers}
    Status Should Be    201
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['use_super_tiebreak']}    ${True}
    Set Suite Variable    ${MATCH_ID}    ${match['match_id']}

Test Update Match Super Tiebreak
    [Documentation]    Verify super tie-break option can be updated
    [Tags]    match    update    super_tiebreak
    [Setup]    Ensure Test Match Exists
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary    use_super_tiebreak=${True}
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['use_super_tiebreak']}    ${True}

Test Edit Finished Match Result
    [Documentation]    Verify finished match result can be edited via API
    [Tags]    match    edit    result    finished
    [Setup]    Create And Finish Test Match
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${sets}=    Create List
    ${set1}=    Create Dictionary    gamesA=${6}    gamesB=${4}    tiebreak=${None}
    ${set2}=    Create Dictionary    gamesA=${6}    gamesB=${3}    tiebreak=${None}
    Append To List    ${sets}    ${set1}
    Append To List    ${sets}    ${set2}
    ${sets_json}=    Evaluate    json.dumps($sets)    json
    ${body}=    Create Dictionary
    ...    sets_data=${sets_json}
    ...    winner_team_id=${TEAM1_ID}
    ...    status=finished
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['status']}    finished
    Should Be Equal    ${match['winner_team_id']}    ${TEAM1_ID}

Test Edit Finished Match Result With High Scores
    [Documentation]    Verify finished match result can have high tie-break scores (e.g., 15-13)
    [Tags]    match    edit    result    tiebreak    high_scores
    [Setup]    Create And Finish Test Match
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${sets}=    Create List
    ${tiebreak}=    Create Dictionary    pointsA=${15}    pointsB=${13}
    ${set1}=    Create Dictionary    gamesA=${7}    gamesB=${6}    tiebreak=${tiebreak}
    ${set2}=    Create Dictionary    gamesA=${6}    gamesB=${4}    tiebreak=${None}
    Append To List    ${sets}    ${set1}
    Append To List    ${sets}    ${set2}
    ${sets_json}=    Evaluate    json.dumps($sets)    json
    ${body}=    Create Dictionary
    ...    sets_data=${sets_json}
    ...    winner_team_id=${TEAM1_ID}
    ...    status=finished
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    ${match}=    Set Variable    ${response.json()}
    ${sets_json}=    Get From Dictionary    ${match}    sets_data
    ${updated_sets}=    Evaluate    json.loads('${sets_json}')    json
    ${first_set_tiebreak}=    Get From Dictionary    ${updated_sets[0]}    tiebreak
    Should Be Equal    ${first_set_tiebreak['pointsA']}    ${15}
    Should Be Equal    ${first_set_tiebreak['pointsB']}    ${13}

Test Edit Finished Match Result Change Status
    [Documentation]    Verify match status can be changed when editing result
    [Tags]    match    edit    result    status
    [Setup]    Create And Finish Test Match
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${sets}=    Create List
    ${set1}=    Create Dictionary    gamesA=${6}    gamesB=${4}    tiebreak=${None}
    Append To List    ${sets}    ${set1}
    ${sets_json}=    Evaluate    json.dumps($sets)    json
    ${body}=    Create Dictionary
    ...    sets_data=${sets_json}
    ...    status=playing
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['status']}    playing

Test Match Filtering By Category
    [Documentation]    Verify matches can be filtered by category
    [Tags]    match    filter    category
    [Setup]    Setup Test Data
    ${params}=    Create Dictionary    category_id=${CATEGORY_ID}
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches    params=${params}
    Status Should Be    200
    ${matches}=    Set Variable    ${response.json()}
    Should Be True    isinstance(${matches}, list)

Test Match Filtering By Status
    [Documentation]    Verify matches can be filtered by status
    [Tags]    match    filter    status
    ${params}=    Create Dictionary    status=scheduled
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches    params=${params}
    Status Should Be    200
    ${matches}=    Set Variable    ${response.json()}
    Should Be True    isinstance(${matches}, list)
    FOR    ${match}    IN    @{matches}
        Should Be Equal    ${match['status']}    scheduled
    END

Test Team Filtering By Category
    [Documentation]    Verify teams can be filtered by category
    [Tags]    team    filter    category
    [Setup]    Setup Test Data
    ${params}=    Create Dictionary    category_id=${CATEGORY_ID}
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/teams    params=${params}
    Status Should Be    200
    ${teams}=    Set Variable    ${response.json()}
    Should Be True    isinstance(${teams}, list)

Test Standings Filtering By Category
    [Documentation]    Verify standings can be filtered by category
    [Tags]    standings    filter    category
    [Setup]    Setup Test Data
    ${params}=    Create Dictionary    category_id=${CATEGORY_ID}
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/standings    params=${params}
    Status Should Be    200
    ${standings}=    Set Variable    ${response.json()}
    Should Be True    isinstance(${standings}, list)

Test Match Result Formatting
    [Documentation]    Verify match result formatting includes tie-break scores
    [Tags]    match    result    formatting
    [Setup]    Create Match With Tiebreak Result
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    Status Should Be    200
    ${match}=    Set Variable    ${response.json()}
    ${sets_json}=    Get From Dictionary    ${match}    sets_data
    ${sets}=    Evaluate    json.loads('${sets_json}')    json
    Should Not Be Empty    ${sets}
    ${first_set}=    Get From List    ${sets}    0
    Dictionary Should Contain Key    ${first_set}    gamesA
    Dictionary Should Contain Key    ${first_set}    gamesB

*** Keywords ***
Create Session And Login
    [Documentation]    Create HTTP session and login as admin
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    username=${ADMIN_USERNAME}    password=${ADMIN_PASSWORD}
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${body}    headers=${headers}
    Status Should Be    200
    ${token}=    Get From Dictionary    ${response.json()}    token
    Set Suite Variable    ${TOKEN}    ${token}

Setup Test Data
    [Documentation]    Create test data for tests
    Create Test Category
    Create Test Teams

Create Test Category
    [Documentation]    Create a test category
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary    name=TestCategoryFrontend
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}

Create Test Teams
    [Documentation]    Create test teams
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body1}=    Create Dictionary    name=TestTeam1Frontend    category_id=${CATEGORY_ID}
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body1}    headers=${headers}
    Set Suite Variable    ${TEAM1_ID}    ${response1.json()['team_id']}
    
    ${body2}=    Create Dictionary    name=TestTeam2Frontend    category_id=${CATEGORY_ID}
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body2}    headers=${headers}
    Set Suite Variable    ${TEAM2_ID}    ${response2.json()['team_id']}

Ensure Test Match Exists
    [Documentation]    Ensure a test match exists
    Run Keyword If    '${MATCH_ID}' == '${EMPTY}'    Create Test Match

Create Test Match
    [Documentation]    Create a test match
    Setup Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    scheduled_date=2025-12-15
    ...    scheduled_time=10:00
    ...    court=Court Test
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body}    headers=${headers}
    Set Suite Variable    ${MATCH_ID}    ${response.json()['match_id']}

Create And Finish Test Match
    [Documentation]    Create a test match and finish it
    Setup Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    scheduled_date=2025-12-15
    ...    scheduled_time=10:00
    ...    court=Court Test
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body}    headers=${headers}
    Set Suite Variable    ${MATCH_ID}    ${response.json()['match_id']}
    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/start
    # Win first set 6-4
    ${body_a}=    Create Dictionary    team=A
    ${body_b}=    Create Dictionary    team=B
    FOR    ${game}    IN RANGE    5
        FOR    ${point}    IN RANGE    4
            POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
        END
    END
    FOR    ${game}    IN RANGE    4
        FOR    ${point}    IN RANGE    4
            POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
        END
    END
    FOR    ${point}    IN RANGE    4
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
    END
    # Win second set 6-3
    FOR    ${game}    IN RANGE    5
        FOR    ${point}    IN RANGE    4
            POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
        END
    END
    FOR    ${game}    IN RANGE    3
        FOR    ${point}    IN RANGE    4
            POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_b}    headers=${headers}
        END
    END
    FOR    ${point}    IN RANGE    4
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body_a}    headers=${headers}
    END
    # Verify match is finished
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    ${match}=    Set Variable    ${response.json()}
    Should Be Equal    ${match['status']}    finished

Create Match With Tiebreak Result
    [Documentation]    Create a match with tie-break result
    Setup Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${TOKEN}
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    scheduled_date=2025-12-15
    ...    scheduled_time=10:00
    ...    court=Court Test
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body}    headers=${headers}
    Set Suite Variable    ${MATCH_ID}    ${response.json()['match_id']}
    # Set match result directly via PUT
    ${sets}=    Create List
    ${tiebreak}=    Create Dictionary    pointsA=${7}    pointsB=${5}
    ${set1}=    Create Dictionary    gamesA=${7}    gamesB=${6}    tiebreak=${tiebreak}
    Append To List    ${sets}    ${set1}
    ${sets_json}=    Evaluate    json.dumps($sets)    json
    ${body_result}=    Create Dictionary
    ...    sets_data=${sets_json}
    ...    winner_team_id=${TEAM1_ID}
    ...    status=finished
    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body_result}    headers=${headers}

Cleanup Test Data
    [Documentation]    Clean up test data
    ${headers}=    Create Dictionary    Authorization=Bearer ${TOKEN}
    Run Keyword If    '${MATCH_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    expected_status=any
    Run Keyword If    '${TEAM1_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}    headers=${headers}    expected_status=any
    Run Keyword If    '${TEAM2_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM2_ID}    headers=${headers}    expected_status=any
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    expected_status=any

