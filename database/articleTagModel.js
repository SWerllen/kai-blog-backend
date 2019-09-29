const Sequelize = require('sequelize')
const sequelize = require('./sequelizeModel')
const Tag = require('./tagModel')
const Article = require('./articleModel')

class ArticleTag extends Sequelize.Model{}

ArticleTag.init({
    // article_id:{
    //     type: Sequelize.INTEGER,
    //     references: {
    //         model: Article,
    //         key: 'id',
    //         deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
    //     }
    // },
    // tag_id:{
    //     type: Sequelize.INTEGER,
    //     references: {
    //         model: Tag,
    //         key: 'id',
    //         deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
    //     }
    // }
},{
    timestamps:false,
    sequelize,
    modelName:'ArticleTag'
})

Article.belongsToMany(Tag,{through:ArticleTag,foreignKey:'article_id'})
Tag.belongsToMany(Article,{through:ArticleTag,foreignKey:'tag_id'}) 

ArticleTag.sync().then(res=>{
    console.log("文章标签表同步成功!");
})

module.exports = ArticleTag; 