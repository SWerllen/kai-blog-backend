const Sequelize = require('sequelize')
const sequelize = require('./sequelizeModel')
const User = require('./userModel')
class Article extends Sequelize.Model{}

Article.init({
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    title:{
        type:Sequelize.STRING,
        allowNull:false
    },
    target:{
        type:Sequelize.STRING,
        allowNull:true
    },
    date:{
        type:Sequelize.DATE,
        allowNull:false
    },
    clicktime:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    content:{
        type:Sequelize.TEXT,
        allowNull:false
    }
},{
    timestamps:false,
    sequelize,
    modelName:'Article'
})

Article.belongsTo(User,{
    foreignKey:'user_id',
    allowNull:false
})

Article.sync().then(()=>{
    console.log("文章表同步成功！");
})

module.exports=Article;
