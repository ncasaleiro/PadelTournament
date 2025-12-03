*** Settings ***
Documentation    Test Suite for Categories API
Resource         keywords/common.robot
Test Setup       Create API Session
Test Teardown    Delete API Session

*** Variables ***
${CATEGORY_NAME}    Test Category M3
${UPDATED_NAME}     Updated Category M3

*** Test Cases ***
Test Create Category
    [Documentation]    Test creating a new category
    ${data}=    Create Dictionary    name=${CATEGORY_NAME}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/categories    ${data}
    ${json}=    Get Response Json    ${response}
    Response Should Contain Key    ${response}    category_id
    Response Should Contain Key    ${response}    name
    Should Be Equal    ${json}[name]    ${CATEGORY_NAME}
    Set Suite Variable    ${CATEGORY_ID}    ${json}[category_id]

Test Get All Categories
    [Documentation]    Test getting all categories
    ${response}=    Get Request And Check Status    ${API_PREFIX}/categories
    ${json}=    Get Response Json    ${response}
    Should Be True    ${json}    Categories list should not be empty
    List Should Contain Value    ${json}    ${CATEGORY_NAME}

Test Get Category By Id
    [Documentation]    Test getting a category by ID
    [Setup]    Create Test Category
    ${response}=    Get Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[name]    ${CATEGORY_NAME}
    Should Be Equal As Numbers    ${json}[category_id]    ${CATEGORY_ID}

Test Update Category
    [Documentation]    Test updating a category
    [Setup]    Create Test Category
    ${data}=    Create Dictionary    name=${UPDATED_NAME}
    ${response}=    Put Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}    ${data}
    ${json}=    Get Response Json    ${response}
    Should Be Equal    ${json}[name]    ${UPDATED_NAME}

Test Delete Category
    [Documentation]    Test deleting a category
    [Setup]    Create Test Category
    Delete Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}
    ${response}=    Get Request And Check Status    ${API_PREFIX}/categories/${CATEGORY_ID}    expected_status=404

Test Create Category Without Name
    [Documentation]    Test creating category without required field
    ${data}=    Create Dictionary
    ${response}=    POST On Session    api    ${API_PREFIX}/categories    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    400

Test Get Non Existent Category
    [Documentation]    Test getting a category that doesn't exist
    ${response}=    GET On Session    api    ${API_PREFIX}/categories/99999
    Should Be Equal As Numbers    ${response.status_code}    404

*** Keywords ***
Create Test Category
    [Documentation]    Helper keyword to create a test category
    ${data}=    Create Dictionary    name=${CATEGORY_NAME}
    ${response}=    Post Request And Check Status    ${API_PREFIX}/categories    ${data}
    ${json}=    Get Response Json    ${response}
    Set Suite Variable    ${CATEGORY_ID}    ${json}[category_id]

