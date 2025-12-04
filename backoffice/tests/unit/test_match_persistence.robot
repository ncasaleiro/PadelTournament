*** Settings ***
Documentation    Unit tests for Match Persistence - Validates that matches are saved to matches.json separately
Library          RequestsLibrary
Library          Collections
Library          String
Library          JSONLibrary
Library          OperatingSystem
Library          Process

Suite Setup       Create Session For API    Setup Test Data
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test Match    Cleanup Test Teams    Cleanup Test Category

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${CATEGORY_ID}       ${EMPTY}
${TEAM1_ID}          ${EMPTY}
${TEAM2_ID}          ${EMPTY}
${MATCH_ID}          ${EMPTY}
${MATCHES_FILE}      ${CURDIR}/../../data/matches.json
${DATABASE_FILE}     ${CURDIR}/../../data/database.json

*** Test Cases ***

Test Match Is Saved To Separate File
    [Documentation]    Should save match to matches.json file, not database.json
    [Tags]    match    persistence    create
    [Setup]    Setup Test Data
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    group_name=A
    ...    scheduled_date=2025-12-10
    ...    scheduled_time=10:00
    ...    court=Court 1
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body}    headers=${headers}
    Status Should Be    201
    Set Suite Variable    ${MATCH_ID}    ${response.json()['match_id']}
    
    # Verify match is in matches.json
    ${matches_content}=    Get File    ${MATCHES_FILE}
    ${matches_json}=    Evaluate    json.loads(r'''${matches_content}''')    json
    ${match_found}=    Evaluate    any(m['match_id'] == ${MATCH_ID} for m in ${matches_json})
    Should Be True    ${match_found}    Match should be in matches.json
    
    # Verify match is NOT in database.json
    ${db_content}=    Get File    ${DATABASE_FILE}
    ${db_json}=    Evaluate    json.loads(r'''${db_content}''')    json
    ${matches_array}=    Get From Dictionary    ${db_json}    matches
    Should Be Empty    ${matches_array}    Matches array should be empty in database.json

Test Match Update Persists To Separate File
    [Documentation]    Should update match in matches.json file
    [Tags]    match    persistence    update
    [Setup]    Setup Test Data    create_match=True
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    court=Court 2 Updated
    ...    scheduled_date=2025-12-11
    
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['court']}    Court 2 Updated
    
    # Verify update is persisted in matches.json
    ${matches_content}=    Get File    ${MATCHES_FILE}
    ${matches_json}=    Evaluate    json.loads(r'''${matches_content}''')    json
    ${match}=    Evaluate    next((m for m in ${matches_json} if m['match_id'] == ${MATCH_ID}), None)    json
    Should Not Be Equal    ${match}    ${None}    Match should exist in matches.json
    ${court_value}=    Get From Dictionary    ${match}    court
    Should Be Equal    ${court_value}    Court 2 Updated    Court should be updated in matches.json

Test Match Score History Is Persisted
    [Documentation]    Should save score_history to matches.json when scoring
    [Tags]    match    persistence    scoring
    [Setup]    Setup Test Data    create_match=True    start_match=True
    ${headers}=    Create Dictionary    Content-Type=application/json
    
    # Increment a point
    ${body}=    Create Dictionary    team=A
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    Status Should Be    200
    
    # Verify score_history is saved in matches.json
    ${matches_content}=    Get File    ${MATCHES_FILE}
    ${matches_json}=    Evaluate    json.loads(r'''${matches_content}''')    json
    ${match}=    Evaluate    next((m for m in ${matches_json} if m['match_id'] == ${MATCH_ID}), None)    json
    Should Not Be Equal    ${match}    ${None}    Match should exist in matches.json
    ${score_history_str}=    Get From Dictionary    ${match}    score_history
    ${score_history}=    Evaluate    json.loads(r'''${score_history_str}''')    json
    ${history_length}=    Get Length    ${score_history}
    Should Be True    ${history_length} > 0    Score history should contain entries
    ${last_entry}=    Get From List    ${score_history}    -1
    Dictionary Should Contain Key    ${last_entry}    timestamp    Score history entry should have timestamp
    Dictionary Should Contain Key    ${last_entry}    team_scored    Score history entry should have team_scored

Test Match Deletion Removes From Separate File
    [Documentation]    Should remove match from matches.json when deleted
    [Tags]    match    persistence    delete
    [Setup]    Setup Test Data    create_match=True
    
    # Verify match exists in matches.json before deletion
    ${matches_content_before}=    Get File    ${MATCHES_FILE}
    ${matches_json_before}=    Evaluate    json.loads(r'''${matches_content_before}''')    json
    ${match_count_before}=    Get Length    ${matches_json_before}
    
    # Delete match
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}
    Status Should Be    204
    
    # Verify match is removed from matches.json
    ${matches_content_after}=    Get File    ${MATCHES_FILE}
    ${matches_json_after}=    Evaluate    json.loads(r'''${matches_content_after}''')    json
    ${match_count_after}=    Get Length    ${matches_json_after}
    ${expected_count}=    Evaluate    ${match_count_before} - 1
    Should Be Equal As Integers    ${match_count_after}    ${expected_count}    Match count should decrease
    
    ${match_found}=    Evaluate    any(m['match_id'] == ${MATCH_ID} for m in ${matches_json_after})
    Should Not Be True    ${match_found}    Match should not exist in matches.json after deletion

Test Multiple Matches Are Persisted Correctly
    [Documentation]    Should save multiple matches to matches.json
    [Tags]    match    persistence    multiple
    [Setup]    Setup Test Data
    
    # Create first match
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body1}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body1}    headers=${headers}
    Status Should Be    201
    ${match_id1}=    Set Variable    ${response1.json()['match_id']}
    
    # Create second match
    ${body2}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Semi-final
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body2}    headers=${headers}
    Status Should Be    201
    ${match_id2}=    Set Variable    ${response2.json()['match_id']}
    
    # Verify both matches are in matches.json
    ${matches_content}=    Get File    ${MATCHES_FILE}
    ${matches_json}=    Evaluate    json.loads(r'''${matches_content}''')    json
    ${match1_found}=    Evaluate    any(m['match_id'] == ${match_id1} for m in ${matches_json})
    ${match2_found}=    Evaluate    any(m['match_id'] == ${match_id2} for m in ${matches_json})
    Should Be True    ${match1_found}    First match should be in matches.json
    Should Be True    ${match2_found}    Second match should be in matches.json
    
    # Cleanup
    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id1}
    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${match_id2}

Test Match Sets Data Is Persisted
    [Documentation]    Should save sets_data to matches.json when sets are completed
    [Tags]    match    persistence    sets
    [Setup]    Setup Test Data    create_match=True    start_match=True
    
    # Simulate winning a set (simplified - would need actual scoring)
    ${headers}=    Create Dictionary    Content-Type=application/json
    
    # Win enough games to complete a set (simplified test)
    FOR    ${i}    IN RANGE    0    24
        ${body}=    Create Dictionary    team=A
        POST On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}/score/increment    json=${body}    headers=${headers}
    END
    
    # Verify sets_data is saved in matches.json
    ${matches_content}=    Get File    ${MATCHES_FILE}
    ${matches_json}=    Evaluate    json.loads(r'''${matches_content}''')    json
    ${match}=    Evaluate    next((m for m in ${matches_json} if m['match_id'] == ${MATCH_ID}), None)    json
    Should Not Be Equal    ${match}    ${None}    Match should exist in matches.json
    ${sets_data_str}=    Get From Dictionary    ${match}    sets_data
    ${sets_data}=    Evaluate    json.loads(r'''${sets_data_str}''')    json
    Should Be True    isinstance(${sets_data}, list)    Sets data should be a list

Test Match File Structure Is Valid JSON
    [Documentation]    Should ensure matches.json is valid JSON format
    [Tags]    match    persistence    validation
    ${matches_content}=    Get File    ${MATCHES_FILE}
    ${matches_json}=    Evaluate    json.loads(r'''${matches_content}''')    json
    Should Be True    isinstance(${matches_json}, list)    matches.json should contain a JSON array

Test Database File Does Not Contain Matches
    [Documentation]    Should ensure database.json does not contain matches array with data
    [Tags]    match    persistence    separation
    ${db_content}=    Get File    ${DATABASE_FILE}
    ${db_json}=    Evaluate    json.loads(r'''${db_content}''')    json
    Dictionary Should Contain Key    ${db_json}    matches    database.json should have matches key
    ${matches_array}=    Get From Dictionary    ${db_json}    matches
    Should Be Empty    ${matches_array}    Matches array should be empty in database.json

*** Keywords ***

Create Session For API
    [Arguments]    ${setup_data}=${EMPTY}
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    IF    '${setup_data}' != '${EMPTY}' and '${setup_data}' != 'False'
        Setup Test Data
    END

Setup Test Data
    [Arguments]    ${create_match}=False    ${start_match}=False
    # Create category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategoryPersistence
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}
    
    # Create teams
    ${body1}=    Create Dictionary    name=TestTeam1Persistence    category_id=${CATEGORY_ID}    group_name=A
    ${response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body1}    headers=${headers}
    Set Suite Variable    ${TEAM1_ID}    ${response1.json()['team_id']}
    
    ${body2}=    Create Dictionary    name=TestTeam2Persistence    category_id=${CATEGORY_ID}    group_name=A
    ${response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/teams    json=${body2}    headers=${headers}
    Set Suite Variable    ${TEAM2_ID}    ${response2.json()['team_id']}
    
    IF    '${create_match}' == 'True' or '${create_match}' == '${True}'
        Create Test Match
        IF    '${start_match}' == 'True' or '${start_match}' == '${True}'
            Start Test Match
        END
    END

Create Test Match
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ...    team1_id=${TEAM1_ID}
    ...    team2_id=${TEAM2_ID}
    ...    category_id=${CATEGORY_ID}
    ...    phase=Group
    ...    group_name=A
    ...    scheduled_date=2025-12-10
    ...    scheduled_time=10:00
    ...    court=Court Test
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/matches    json=${body}    headers=${headers}
    Set Suite Variable    ${MATCH_ID}    ${response.json()['match_id']}

Start Test Match
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    status=playing
    PUT On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    json=${body}    headers=${headers}

Cleanup Test Match
    IF    '${MATCH_ID}' != '${EMPTY}'
        DELETE On Session    ${SESSION_NAME}    ${API_BASE}/matches/${MATCH_ID}    expected_status=any
    END

Cleanup Test Teams
    IF    '${TEAM1_ID}' != '${EMPTY}'
        DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM1_ID}    expected_status=any
    END
    IF    '${TEAM2_ID}' != '${EMPTY}'
        DELETE On Session    ${SESSION_NAME}    ${API_BASE}/teams/${TEAM2_ID}    expected_status=any
    END

Cleanup Test Category
    IF    '${CATEGORY_ID}' != '${EMPTY}'
        DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    expected_status=any
    END

Cleanup Test Data
    Cleanup Test Match
    Cleanup Test Teams
    Cleanup Test Category

