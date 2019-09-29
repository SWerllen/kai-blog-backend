const Sequelize = require('sequelize')
const sequelize = require('./sequelizeModel')
const User = require('./userModel')
class Tag extends Sequelize.Model{}

Tag.init({
    id:{
        type: Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    name:{
        type:Sequelize.STRING,
        allowNull:false,
        unique:true
    }
},{
    timestamps:false,
    sequelize,
    modelName:''
})

Tag.belongsTo(User,{
    foreignKey:'user_id',
    allowNull:false
})

Tag.sync().then(()=>{
    console.log("标签表同步成功！");
})
module.exports=Tag;
