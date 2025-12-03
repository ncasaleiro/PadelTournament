# PadelTournamnt

## RUN backoffice
### 1. Install
cd backoffice
npm install

### 2. Run
npm start



## TESTS
### 1. Install requirements
cd tests
pip install -r requirements.txt

### 2. Run Server in other terminal
cd ../backoffice
npm start

### 3. Run tests
cd tests
./run_tests.sh

### Or other specific test
robot --outputdir results api/test_categories.robot
