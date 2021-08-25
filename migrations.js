const executeQuery = require("./database");

module.exports = (app) => {

    try{
        const result = executeQuery("ALTER TABLE oem ADD test VARCHAR(10) NOT NULL AFTER updateUTC;");
        const result = executeQuery("ALTER TABLE `oem` CHANGE `description` `description` VARCHAR(200)");
        const result = executeQuery(`CREATE TABLE IF NOT EXISTS test_table2 (
            id bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            userName varchar(30) NOT NULL,
            uuid varchar(250) NOT NULL,
            role tinyint(20) NOT NULL,
            insertUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updateUTC TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            email varchar(50) NOT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=latin1`);
          console.log("table created ...!! "+ result );
    }catch{
        console.log("something error"); 
    } 

}
