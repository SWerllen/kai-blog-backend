const Sequelize = require('sequelize')

const sequelize = new Sequelize('blog','root','88888888',{
    host:'localhost',
    dialect: 'mysql'
})

module.exports=sequelize;
