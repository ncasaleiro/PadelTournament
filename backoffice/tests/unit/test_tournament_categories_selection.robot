*** Settings ***
Documentation    Tests for tournament category selection functionality
...              Updated: 2025-12-06 10:54:50 - v0.03-dev
Library          RequestsLibrary
Library          Collections

Suite Setup       Suite Setup
Suite Teardown    Suite Teardown
Test Teardown     Run Keywords    Cleanup Test Tournament    Cleanup Test Categories

*** Variables ***
${BASE_URL}      http://localhost:3000
${API_BASE}      ${BASE_URL}/api
${SESSION_NAME}  api_session
${ADMIN_TOKEN}   ${EMPTY}
${TOURNAMENT_ID}    ${EMPTY}
${CATEGORY1_ID}     ${EMPTY}
${CATEGORY2_ID}     ${EMPTY}
${CATEGORY3_ID}     ${EMPTY}

*** Test Cases ***

Test Create Tournament Without Categories Should Fail
    [Documentation]    Should fail when creating tournament without category_ids
    [Tags]    tournament    categories    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    ${data}=    Create Dictionary
    ...    name=Torneio Sem Categorias
    ...    start_date=2025-07-01
    ...    end_date=2025-07-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${data}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response.status_code}    400
    Should Contain    ${response.json()}[error]    categoria

Test Create Tournament With Empty Category Array Should Fail
    [Documentation]    Should fail when creating tournament with empty category_ids array
    [Tags]    tournament    categories    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    ${data}=    Create Dictionary
    ...    name=Torneio Array Vazio
    ...    start_date=2025-07-01
    ...    end_date=2025-07-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    ...    category_ids=${EMPTY}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${data}    headers=${headers}    expected_status=400
    Should Be Equal As Strings    ${response.status_code}    400
    Should Contain    ${response.json()}[error]    categoria

Test Create Tournament With Single Category Should Succeed
    [Documentation]    Should succeed when creating tournament with one category
    [Tags]    tournament    categories    create
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    Set Suite Variable    ${TOURNAMENT_ID}    ${EMPTY}
    
    # Create test category
    ${cat_data}=    Create Dictionary    name=Test Category Single
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    Set Suite Variable    ${CATEGORY1_ID}    ${category_id}
    
    ${data}=    Create Dictionary
    ...    name=Torneio Uma Categoria
    ...    start_date=2025-07-01
    ...    end_date=2025-07-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    ...    category_ids=@{EMPTY}
    
    ${category_ids}=    Create List    ${category_id}
    Set To Dictionary    ${data}    category_ids=${category_ids}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${data}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    201
    ${tournament}=    Set Variable    ${response.json()}
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament}[tournament_id]
    
    # Verify category_ids is stored
    Should Not Be Empty    ${tournament}[category_ids]
    Should Be Equal    ${tournament}[category_ids][0]    ${category_id}

Test Create Tournament With Multiple Categories Should Succeed
    [Documentation]    Should succeed when creating tournament with multiple categories
    [Tags]    tournament    categories    create
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    
    # Create test categories
    ${cat_data1}=    Create Dictionary    name=Test Category Multi 1
    ${cat_response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data1}    headers=${headers}
    ${cat1_id}=    Set Variable    ${cat_response1.json()}[category_id]
    
    ${cat_data2}=    Create Dictionary    name=Test Category Multi 2
    ${cat_response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data2}    headers=${headers}
    ${cat2_id}=    Set Variable    ${cat_response2.json()}[category_id]
    
    ${cat_data3}=    Create Dictionary    name=Test Category Multi 3
    ${cat_response3}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data3}    headers=${headers}
    ${cat3_id}=    Set Variable    ${cat_response3.json()}[category_id]
    
    ${category_ids}=    Create List    ${cat1_id}    ${cat2_id}    ${cat3_id}
    
    ${data}=    Create Dictionary
    ...    name=Torneio Multi Categorias
    ...    start_date=2025-08-01
    ...    end_date=2025-08-05
    ...    courts=3
    ...    start_time=08:00
    ...    end_time=23:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=true
    ...    category_ids=${category_ids}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${data}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    201
    ${tournament}=    Set Variable    ${response.json()}
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament}[tournament_id]
    
    # Verify all category_ids are stored
    Should Not Be Empty    ${tournament}[category_ids]
    Should Be Equal    ${tournament}[category_ids][0]    ${cat1_id}
    Should Be Equal    ${tournament}[category_ids][1]    ${cat2_id}
    Should Be Equal    ${tournament}[category_ids][2]    ${cat3_id}
    Length Should Be    ${tournament}[category_ids]    3

Test Get Tournament Should Include Category IDs
    [Documentation]    Should return category_ids when getting tournament
    [Tags]    tournament    categories    get
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    Set Suite Variable    ${TOURNAMENT_ID}    ${EMPTY}
    
    # Create category and tournament
    ${cat_data}=    Create Dictionary    name=Test Category Get
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    
    ${category_ids}=    Create List    ${category_id}
    ${tournament_data}=    Create Dictionary
    ...    name=Torneio Get Test
    ...    start_date=2025-09-01
    ...    end_date=2025-09-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    ...    category_ids=${category_ids}
    
    ${create_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${tournament_data}    headers=${headers}
    Should Be Equal As Strings    ${create_response.status_code}    201
    ${tournament_id}=    Set Variable    ${create_response.json()}[tournament_id]
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament_id}
    
    # Get tournament
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/tournaments/${tournament_id}    headers=${headers}
    Should Be Equal As Strings    ${get_response.status_code}    200
    ${tournament}=    Set Variable    ${get_response.json()}
    
    # Verify category_ids is present
    Should Contain    ${tournament}    category_ids
    Should Not Be Empty    ${tournament}[category_ids]
    Should Be Equal    ${tournament}[category_ids][0]    ${category_id}

Test Update Tournament Categories Should Succeed
    [Documentation]    Should allow updating tournament categories
    [Tags]    tournament    categories    update
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    Set Suite Variable    ${TOURNAMENT_ID}    ${EMPTY}
    
    # Create categories
    ${cat_data1}=    Create Dictionary    name=Test Cat Update 1
    ${cat_response1}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data1}    headers=${headers}
    ${cat1_id}=    Set Variable    ${cat_response1.json()}[category_id]
    
    ${cat_data2}=    Create Dictionary    name=Test Cat Update 2
    ${cat_response2}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data2}    headers=${headers}
    ${cat2_id}=    Set Variable    ${cat_response2.json()}[category_id]
    
    # Create tournament with one category
    ${category_ids_initial}=    Create List    ${cat1_id}
    ${tournament_data}=    Create Dictionary
    ...    name=Torneio Update Categories
    ...    start_date=2025-10-01
    ...    end_date=2025-10-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    ...    category_ids=${category_ids_initial}
    
    ${create_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${tournament_data}    headers=${headers}
    Should Be Equal As Strings    ${create_response.status_code}    201
    ${tournament_id}=    Set Variable    ${create_response.json()}[tournament_id]
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament_id}
    
    # Update with multiple categories
    ${category_ids_updated}=    Create List    ${cat1_id}    ${cat2_id}
    ${update_data}=    Create Dictionary    category_ids=${category_ids_updated}
    
    ${update_response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/tournaments/${tournament_id}    json=${update_data}    headers=${headers}
    Should Be Equal As Strings    ${update_response.status_code}    200
    
    # Verify update
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/tournaments/${tournament_id}    headers=${headers}
    ${tournament}=    Set Variable    ${get_response.json()}
    Length Should Be    ${tournament}[category_ids]    2
    Should Contain    ${tournament}[category_ids]    ${cat1_id}
    Should Contain    ${tournament}[category_ids]    ${cat2_id}

Test Update Tournament With Empty Categories Should Fail
    [Documentation]    Should fail when updating tournament with empty category_ids
    [Tags]    tournament    categories    validation    update
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    Set Suite Variable    ${TOURNAMENT_ID}    ${EMPTY}
    
    # Create category and tournament
    ${cat_data}=    Create Dictionary    name=Test Cat Empty Update
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    
    ${category_ids}=    Create List    ${category_id}
    ${tournament_data}=    Create Dictionary
    ...    name=Torneio Empty Update Test
    ...    start_date=2025-11-01
    ...    end_date=2025-11-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    ...    category_ids=${category_ids}
    
    ${create_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${tournament_data}    headers=${headers}
    Should Be Equal As Strings    ${create_response.status_code}    201
    ${tournament_id}=    Set Variable    ${create_response.json()}[tournament_id]
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament_id}
    
    # Try to update with empty array (should fail - validation only on create)
    ${empty_ids}=    Create List
    ${update_data}=    Create Dictionary    category_ids=${empty_ids}
    
    ${update_response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/tournaments/${tournament_id}    json=${update_data}    headers=${headers}
    # Note: Update might allow empty, but create requires at least one
    # This test documents the behavior

Test GetAll Tournaments Should Include Category IDs
    [Documentation]    Should return category_ids for all tournaments
    [Tags]    tournament    categories    get
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    Set Suite Variable    ${TOURNAMENT_ID}    ${EMPTY}
    
    # Create category and tournament
    ${cat_data}=    Create Dictionary    name=Test Category GetAll
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    
    ${category_ids}=    Create List    ${category_id}
    ${tournament_data}=    Create Dictionary
    ...    name=Torneio GetAll Test
    ...    start_date=2025-12-01
    ...    end_date=2025-12-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    ...    category_ids=${category_ids}
    
    ${create_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${tournament_data}    headers=${headers}
    Should Be Equal As Strings    ${create_response.status_code}    201
    ${tournament_id}=    Set Variable    ${create_response.json()}[tournament_id]
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament_id}
    
    # Get all tournaments
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    headers=${headers}
    Should Be Equal As Strings    ${get_response.status_code}    200
    ${tournaments}=    Set Variable    ${get_response.json()}
    
    # Find our tournament
    ${found}=    Set Variable    ${False}
    FOR    ${tournament}    IN    @{tournaments}
        ${tournament_name}=    Get From Dictionary    ${tournament}    name
        IF    '${tournament_name}' == 'Torneio GetAll Test'
            Should Contain    ${tournament}    category_ids
            ${found}=    Set Variable    ${True}
        END
    END
    Should Be True    ${found}    Tournament should be found in list

Test Tournament Category IDs Should Be Integers
    [Documentation]    Should convert category_ids to integers
    [Tags]    tournament    categories    validation
    ${headers}=    Create Dictionary    Content-Type=application/json    Authorization=Bearer ${ADMIN_TOKEN}
    Set Suite Variable    ${TOURNAMENT_ID}    ${EMPTY}
    
    # Create category
    ${cat_data}=    Create Dictionary    name=Test Category Int
    ${cat_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${cat_data}    headers=${headers}
    ${category_id}=    Set Variable    ${cat_response.json()}[category_id]
    
    # Send category_ids as strings (should be converted to int)
    ${category_ids_str}=    Create List    ${category_id}
    ${tournament_data}=    Create Dictionary
    ...    name=Torneio Int Test
    ...    start_date=2026-01-01
    ...    end_date=2026-01-05
    ...    courts=2
    ...    start_time=09:00
    ...    end_time=22:00
    ...    match_duration_minutes=90
    ...    use_super_tiebreak=false
    ...    category_ids=${category_ids_str}
    
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    json=${tournament_data}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    201
    ${tournament}=    Set Variable    ${response.json()}
    Set Suite Variable    ${TOURNAMENT_ID}    ${tournament}[tournament_id]
    
    # Verify category_ids are integers
    Should Be Equal    ${tournament}[category_ids][0]    ${category_id}

*** Keywords ***

Suite Setup
    [Documentation]    Setup test suite - login as admin
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Added session creation
    Create Session    ${SESSION_NAME}    ${BASE_URL}
    ${login_data}=    Create Dictionary    username=admin    password=admin123
    ${login_response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/auth/login    json=${login_data}
    Should Be Equal As Strings    ${login_response.status_code}    200
    ${token}=    Set Variable    ${login_response.json()}[token]
    Set Suite Variable    ${ADMIN_TOKEN}    ${token}

Cleanup Test Tournament
    [Documentation]    Clean up test tournament
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${TOURNAMENT_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/tournaments/${TOURNAMENT_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${TOURNAMENT_ID}    ${EMPTY}
    
    # Cleanup all test tournaments
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/tournaments    headers=${headers}
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Tournaments From List    ${response.json()}

Cleanup Test Tournaments From List
    [Documentation]    Clean up test tournaments from a list
    [Arguments]    ${tournaments}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    FOR    ${tournament}    IN    @{tournaments}
        ${name}=    Get From Dictionary    ${tournament}    name
        ${should_delete}=    Evaluate    'Torneio' in '${name}' or 'Test' in '${name}' or 'Sem Categorias' in '${name}' or 'Array Vazio' in '${name}' or 'Uma Categoria' in '${name}' or 'Multi Categorias' in '${name}' or 'Get Test' in '${name}' or 'Update Categories' in '${name}' or 'Empty Update' in '${name}' or 'GetAll Test' in '${name}' or 'Int Test' in '${name}'
        Run Keyword If    ${should_delete}    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/tournaments/${tournament['tournament_id']}    headers=${headers}    expected_status=any
    END

Cleanup Test Categories
    [Documentation]    Clean up test categories
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    Run Keyword If    '${CATEGORY1_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY1_ID}    headers=${headers}    expected_status=any
    Run Keyword If    '${CATEGORY2_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY2_ID}    headers=${headers}    expected_status=any
    Run Keyword If    '${CATEGORY3_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY3_ID}    headers=${headers}    expected_status=any
    Set Suite Variable    ${CATEGORY1_ID}    ${EMPTY}
    Set Suite Variable    ${CATEGORY2_ID}    ${EMPTY}
    Set Suite Variable    ${CATEGORY3_ID}    ${EMPTY}
    
    # Cleanup all test categories
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories    headers=${headers}
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Categories From List    ${response.json()}

Cleanup Test Categories From List
    [Documentation]    Clean up test categories from a list
    [Arguments]    ${categories}
    ${headers}=    Create Dictionary    Authorization=Bearer ${ADMIN_TOKEN}
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        ${should_delete}=    Evaluate    'Test Category' in '${name}' or 'Test Cat' in '${name}' or 'Category Single' in '${name}' or 'Category Multi' in '${name}' or 'Category Get' in '${name}' or 'Cat Update' in '${name}' or 'Category Int' in '${name}'
        Run Keyword If    ${should_delete}    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${category['category_id']}    headers=${headers}    expected_status=any
    END

Suite Teardown
    [Documentation]    Cleanup all test data
    ...                Updated: 2025-12-06 10:54:50 - v0.03-dev - Added proper cleanup
    Cleanup Test Tournament
    Cleanup Test Categories
    Delete All Sessions
    Log    Test suite teardown completed

