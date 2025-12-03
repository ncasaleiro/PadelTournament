*** Settings ***
Documentation    Test Suite for Health Check API
Resource         keywords/common.robot
Test Setup       Create API Session
Test Teardown    Delete API Session

*** Test Cases ***
Test Health Check
    [Documentation]    Test the health check endpoint
    ${response}=    Get Request And Check Status    /api/health
    ${json}=    Get Response Json    ${response}
    Response Should Contain Key    ${response}    status
    Response Should Contain Key    ${response}    timestamp
    Should Be Equal    ${json}[status]    ok
    Should Not Be Empty    ${json}[timestamp]

