const executeQuery = require("./database");

module.exports = (app) => {

    try{
    
        const result = executeQuery(`ALTER TABLE oem ADD test VARCHAR(10) NOT NULL AFTER updateUTC;`);
        const result = executeQuery("ALTER TABLE `oem` CHANGE `description` `description` VARCHAR(200)");
          console.log("table created ...!! "+ result );
    }catch{
        console.log("something error"); 
    }

}
