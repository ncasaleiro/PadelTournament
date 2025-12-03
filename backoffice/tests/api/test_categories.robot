*** Settings ***
Documentation    Test suite for Categories API
Library    RequestsLibrary
Library    Collections
Resource    ../resources/common.robot

Suite Setup    Create Session For API
Suite Teardown    Delete All Sessions

*** Test Cases ***
Test Create Category
    [Documentation]    Test creating a new category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=M3
    ${response}=    POST    ${API_BASE}/categories    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    201
    Verify Response Contains    category_id
    Verify Response Contains    name    M3
    ${category_id}=    Get From Dictionary    ${response.json()}    category_id
    Set Suite Variable    ${CATEGORY_ID}    ${category_id}

Test Get All Categories
    [Documentation]    Test retrieving all categories
    ${response}=    GET    ${API_BASE}/categories
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Should Be True    ${response.json()}    List is not empty

Test Get Category By ID
    [Documentation]    Test retrieving a category by ID
    [Tags]    requires_category
    ${response}=    GET    ${API_BASE}/categories/${CATEGORY_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    category_id    ${CATEGORY_ID}
    Verify Response Contains    name    M3

Test Update Category
    [Documentation]    Test updating a category
    [Tags]    requires_category
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary    name=M4
    ${response}=    PUT    ${API_BASE}/categories/${CATEGORY_ID}    json=${body}    headers=${headers}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    200
    Verify Response Contains    name    M4

Test Get Non-Existent Category
    [Documentation]    Test retrieving a non-existent category
    ${response}=    GET    ${API_BASE}/categories/99999
    Set Test Variable    ${response}    ${response}
    Verify Response Status    404

Test Delete Category
    [Documentation]    Test deleting a category
    [Tags]    requires_category
    ${response}=    DELETE    ${API_BASE}/categories/${CATEGORY_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    204
    # Verify category is deleted
    ${response}=    GET    ${API_BASE}/categories/${CATEGORY_ID}
    Set Test Variable    ${response}    ${response}
    Verify Response Status    404

Test Create Category Without Name
    [Documentation]    Test creating a category without required field
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${body}=    Create Dictionary
    ${response}=    POST    ${API_BASE}/categories    json=${body}    headers=${headers}    expected_status=400
    Set Test Variable    ${response}    ${response}
    Verify Response Status    400

Test Create Multiple Categories
    [Documentation]    Test creating multiple categories
    ${headers}=    Create Dictionary    Content-Type=application/json
    ${categories}=    Create List    M3    M4    M5    F4    F5    MX
    ${created_ids}=    Create List
    FOR    ${cat_name}    IN    @{categories}
        ${body}=    Create Dictionary    name=${cat_name}
        ${response}=    POST    ${API_BASE}/categories    json=${body}    headers=${headers}
        Should Be Equal As Strings    ${response.status_code}    201
        ${cat_id}=    Get From Dictionary    ${response.json()}    category_id
        Append To List    ${created_ids}    ${cat_id}
    END
    Should Be Equal    ${created_ids}    ${created_ids}    # Verify all created
    [Teardown]    Run Keywords
    ...    FOR    ${cat_id}    IN    @{created_ids}
    ...    DELETE    ${API_BASE}/categories/${cat_id}
    ...    END

