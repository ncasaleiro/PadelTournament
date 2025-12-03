*** Settings ***
Documentation    Test Suite for Padel Tournament Backoffice API
Library          RequestsLibrary
Library          Collections
Library          JSONLibrary
Variables        config.py

*** Variables ***
${BASE_URL}      http://localhost:3000
${API_PREFIX}    /api

