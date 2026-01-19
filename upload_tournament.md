# Upload Tournament

## 1. Objective
Allow the creation of a padel tournament on the platform using categories and matches previously defined in a CSV file, ensuring data validation, flexibility, and ease of management.

## 2. Scope
This requirement covers:
- Data import via CSV
- Automatic creation of categories and matches
- Data validation
- Tournament management and visualization

## 3. Functional Requirements

### 3.1 Tournament Creation
- The platform must allow the creation of a new padel tournament.
- The user must define the basic tournament information:
  - Tournament name
  - Location
  - Dates (start and end)
  - Organizer
  - Number of available courts

### 3.2 CSV Upload
- The platform must allow uploading a CSV file.
- The CSV must contain, at minimum, the following columns:
  - Category
  - Match phase (e.g. groups, quarterfinals, semifinals, final)
  - Team/Player A
  - Team/Player B
  - Date (optional)
  - Time (optional)
  - Court (optional)

### 3.3 Category Management
- The platform must automatically create categories based on the CSV content.
- If a category already exists, the system must associate the matches with the existing category.
- It must be possible to enable or disable categories individually.

### 3.4 Match Creation
- The platform must automatically create matches defined in the CSV.
- Each match must be associated with:
  - A category
  - A tournament phase
- The system must allow manual editing of matches after import.

### 3.5 Data Validation
- The platform must validate:
  - CSV structure
  - Missing mandatory fields
  - Duplicate matches
- In case of errors, the system must display clear and actionable error messages to the user.

### 3.6 Tournament Visualization
- The platform must allow visualization of:
  - Category list
  - Matches per category
  - Match schedule
- It must be possible to filter matches by category, date, or court.

## 4. Non-Functional Requirements

### 4.1 Usability
- The CSV upload process must be simple and guided.
- The user must be able to download a CSV template.

### 4.2 Performance
- CSV import must be processed within an acceptable time (< 5 seconds for up to 500 matches).

### 4.3 Security
- Only authorized users may create or edit tournaments.
- The CSV file must be validated to prevent malicious content.

### 4.4 Auditability
- The system must record:
  - Who created the tournament
  - Date/time of the CSV upload
  - Manual changes made to matches

## 5. Maintenance Requirements
- It must be possible to re-upload a CSV file to update existing matches.
- The platform must allow deleting or replacing a tournament created via CSV.

## 6. Acceptance Criteria
- The tournament is successfully created from a valid CSV file.
- All categories and matches are correctly associated.
- CSV errors are identified and clearly reported to the user.
- The user can edit and visualize the tournament without errors.