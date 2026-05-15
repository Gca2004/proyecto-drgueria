// Importamos Sequelize, que es el puente entre Node.js y MySQL
const { Sequelize } = require('sequelize');

// datos de conexión del archivo .env
const sequelize = new Sequelize(
  process.env.DB_NAME,      
  process.env.DB_USER,      
  process.env.DB_PASSWORD,  
  {
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT,
    dialect: 'mysql',          
    logging: false            
  }
);

module.exports = sequelize;