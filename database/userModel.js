const Sequelize = require('sequelize')
const sequelize = require('./sequelizeModel')
class User extends Sequelize.Model{}

User.init({
    id:{
        type: Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    username:{
        type: Sequelize.STRING,
        unique:true
    },
    password:{
        type:Sequelize.STRING,
        allowNull:false
    },
    email:{
        type:Sequelize.STRING,
        allowNull:false
    }
},{
    timestamps:false,
    sequelize,
    modelName:'User'
})

User.sync().then(()=>{
    console.log("用户表同步成功！");
})
module.exports=User;
