#!/bin/bash
sudo chmod -R 777 /home/ubuntu/nodejs-express
#navifate into our worling directory where we have all our github files
cd /home/ubuntu/nodejs-express

#add npm and node to path
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # loads nvm bash_copletion (node is in)
#mysql create table
# sudo mysql;
# use sim_manager_development;

# CREATE TABLE IF NOT EXISTS `test1` (
#   `id` bigint(20) NOT NULL PRIMARY KEY,
#   `name` varchar(30) NOT NULL
# ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
# exit;
#install node modules
npm install 
pm2 restart npm --name "myApp" -- run "start:dev" 
#start our node app in the background
node app.js > app.out.log 2> app.err.log < /dev/null &


