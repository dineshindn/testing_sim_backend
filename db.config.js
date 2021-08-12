CONFIG = {
  development: {
    user: "simmanager",
    password: "admin@2021",
    database: "sim_manager_development",
    host: "localhost",
    port: 3306,
    connectionLimit : 100
  },
  test: {
    user: "root",
    password: "admin",
    database: "sim_manager_test",
    host: "localhost",
    port: 3306,
    connectionLimit : 100
  },
  production: {
    user: process.env.SIM_MANAGER_DB_USER,
    password: process.env.SIM_MANAGER_DB_PASSWORD,
    database: process.env.SIM_MANAGER_DB_NAME,
    host: process.env.ESIM_MANAGER_DB_HOST,
    port: process.env.ESIM_MANAGER_DB_PORT,
    connectionLimit: process.env.SIM_MANAGER_DBB_CONNECTION_LIMIT,
  }
};

module.exports = CONFIG[process.env.NODE_ENV]