*** Settings ***
Documentation    Unit tests for Categories API - Full CRUD operations with cleanup
Library          RequestsLibrary
Library          Collections
Library          String

Suite Setup       Create Session For API
Suite Teardown    Cleanup Test Data
Test Teardown     Run Keywords    Cleanup Test Categories

*** Variables ***
${BASE_URL}          http://localhost:3000
${API_BASE}          ${BASE_URL}/api
${SESSION_NAME}      api_session
${CATEGORY_ID}       ${EMPTY}

*** Test Cases ***
Test Get All Categories
    [Documentation]    Should get all categories
    [Tags]    category    get
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Status Should Be    200
    Should Be True    isinstance(${response.json()}, list)

Test Create Category
    [Documentation]    Should create a new category
    [Tags]    category    create
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategory
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Status Should Be    201
    Should Contain    ${response.json()}    category_id
    Should Contain    ${response.json()}    name
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}
    Should Be Equal    ${response.json()['name']}    TestCategory

Test Create Category Without Name
    [Documentation]    Should return 400 when creating category without name
    [Tags]    category    create    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Get Category By ID
    [Documentation]    Should get category by id
    [Tags]    category    get
    [Setup]    Create Test Category
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}
    Status Should Be    200
    Should Be Equal    ${response.json()['category_id']}    ${CATEGORY_ID}
    Should Be Equal    ${response.json()['name']}    TestCategory

Test Get Non-Existent Category
    [Documentation]    Should return 404 for non-existent category
    [Tags]    category    get    error
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories/99999    expected_status=404
    Status Should Be    404
    Should Contain    ${response.json()['error']}    not found

Test Update Category
    [Documentation]    Should update category name
    [Tags]    category    update    edit
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=UpdatedCategory
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    json=${body}    headers=${headers}
    Status Should Be    200
    Should Be Equal    ${response.json()['name']}    UpdatedCategory
    Should Be Equal    ${response.json()['category_id']}    ${CATEGORY_ID}
    # Verify update persisted
    ${get_response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}
    Should Be Equal    ${get_response.json()['name']}    UpdatedCategory

Test Update Category Without Name
    [Documentation]    Should return 400 when updating category without name
    [Tags]    category    update    error
    [Setup]    Create Test Category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    json=${body}    headers=${headers}    expected_status=400
    Status Should Be    400
    Should Contain    ${response.json()['error']}    required

Test Update Non-Existent Category
    [Documentation]    Should return 404 when updating non-existent category
    [Tags]    category    update    error
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=UpdatedCategory
    ${response}=    PUT On Session    ${SESSION_NAME}    ${API_BASE}/categories/99999    json=${body}    headers=${headers}    expected_status=404
    Status Should Be    404

Test Delete Category
    [Documentation]    Should delete a category
    [Tags]    category    delete
    [Setup]    Create Test Category
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}
    Status Should Be    204
    # Verify deletion
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    expected_status=404
    Status Should Be    404

Test Delete Non-Existent Category
    [Documentation]    Should return 404 when deleting non-existent category
    [Tags]    category    delete    error
    ${response}=    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/99999    expected_status=404
    Status Should Be    404

*** Keywords ***
Create Session For API
    [Documentation]    Create HTTP session for API calls
    Create Session    ${SESSION_NAME}    ${BASE_URL}

Create Test Category
    [Documentation]    Create a test category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=TestCategory
    ${response}=    POST On Session    ${SESSION_NAME}    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Suite Variable    ${CATEGORY_ID}    ${response.json()['category_id']}

Cleanup Test Categories
    [Documentation]    Clean up test categories created during tests
    Run Keyword If    '${CATEGORY_ID}' != '${EMPTY}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${CATEGORY_ID}    expected_status=any
    Set Suite Variable    ${CATEGORY_ID}    ${EMPTY}

Cleanup Test Data
    [Documentation]    Clean up all test data
    [Arguments]
    # Get all categories and delete test ones
    ${response}=    GET On Session    ${SESSION_NAME}    ${API_BASE}/categories
    Run Keyword If    ${response.status_code} == 200    Cleanup Test Categories From List    ${response.json()}

Cleanup Test Categories From List
    [Documentation]    Clean up test categories from a list
    [Arguments]    ${categories}
    FOR    ${category}    IN    @{categories}
        ${name}=    Get From Dictionary    ${category}    name
        Run Keyword If    'TestCategory' in '${name}' or 'UpdatedCategory' in '${name}'    DELETE On Session    ${SESSION_NAME}    ${API_BASE}/categories/${category['category_id']}    expected_status=any
    END

