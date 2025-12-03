*** Settings ***
Documentation    Common keywords for API testing
Library          RequestsLibrary
Library          Collections
Library          JSONLibrary

*** Keywords ***
Create API Session
    [Documentation]    Create a session for API requests
    Create Session    api    ${BASE_URL}    verify=True

Delete API Session
    [Documentation]    Delete the API session
    Delete All Sessions

Get Request And Check Status
    [Arguments]    ${endpoint}    ${expected_status}=200
    [Documentation]    Perform GET request and check status
    ${response}=    GET On Session    api    ${endpoint}
    Should Be Equal As Numbers    ${response.status_code}    ${expected_status}
    [Return]    ${response}

Post Request And Check Status
    [Arguments]    ${endpoint}    ${data}    ${expected_status}=201
    [Documentation]    Perform POST request and check status
    ${response}=    POST On Session    api    ${endpoint}    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    ${expected_status}
    [Return]    ${response}

Put Request And Check Status
    [Arguments]    ${endpoint}    ${data}    ${expected_status}=200
    [Documentation]    Perform PUT request and check status
    ${response}=    PUT On Session    api    ${endpoint}    json=${data}
    Should Be Equal As Numbers    ${response.status_code}    ${expected_status}
    [Return]    ${response}

Delete Request And Check Status
    [Arguments]    ${endpoint}    ${expected_status}=204
    [Documentation]    Perform DELETE request and check status
    ${response}=    DELETE On Session    api    ${endpoint}
    Should Be Equal As Numbers    ${response.status_code}    ${expected_status}
    [Return]    ${response}

Response Should Contain Key
    [Arguments]    ${response}    ${key}
    [Documentation]    Check if response contains a specific key
    ${json}=    Set Variable    ${response.json()}
    Dictionary Should Contain Key    ${json}    ${key}

Response Should Have Status
    [Arguments]    ${response}    ${expected_status}
    [Documentation]    Check response status code
    Should Be Equal As Numbers    ${response.status_code}    ${expected_status}

Get Response Json
    [Arguments]    ${response}
    [Documentation]    Get JSON from response
    [Return]    ${response.json()}

