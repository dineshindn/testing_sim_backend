# SIM Manager
SIM Manager Backend Repository.

#############################################################################################################################################################

## Steps to start local server
Clone the project and then make sure to do the following steps to start the backend server in your local.

1. Make sure you have installed NodeJs14
2. Install mysql latest and create a database with the name "<sim_manager_development>". Changable in db.config.js.
3. Make sure the database user and password matches the one in db.config.js
4. Run the mysql scripts (tables.sql) to create the Tables. `SOURCE <table.sql path>`
5. (Windows only step, Skip this step for Mac and Linux) `npm install -g win-node-env`
6. `npm install`
7. `npm run start:dev`

#############################################################################################################################################################

## mysql Database configuration
## Please do the following steps in mysql shell:-

1. `mysql -u root -p`
2. <enter your mysql password>
3. `create database sim_manager_development` . Changable in db.config.js.
4. `show databases;`
5. `use sim_manager_development`
6. `SOURCE <table.sql path>`


#############################################################################################################################################################


## Example insert query
1. `INSERT INTO networkProvider (name) VALUES ('airtel');`
2. `INSERT INTO status (name, description) VALUES ('pending', 'request pending');`
3. `INSERT INTO oem (name) VALUES ('Ashok Leyland');`

### Happy Coding !