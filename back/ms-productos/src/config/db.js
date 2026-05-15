// Importamos Sequelize
const { Sequelize } = require('sequelize');

// Leemos las variables del archivo .env
const sequelize = new Sequelize(
  process.env.DB_NAME,      // drgueria_productos
  process.env.DB_USER,      // root
  process.env.DB_PASSWORD,  // vacío en XAMPP
  {
    host: process.env.DB_HOST, // localhost
    port: process.env.DB_PORT,
    dialect: 'mysql',          // le decimos que es MySQL
    logging: false             // no muestra los SQL en consola
  }
);

module.exports = sequelize;