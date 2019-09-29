const router = require('koa-router')();
const Article = require('../../database/articleModel')
const User = require('../../database/userModel')
const ArticleTag = require("../../database/articleTagModel")
const Tag = require("../../database/tagModel")
const sequelize = require('../../database/sequelizeModel')
router.prefix('/article');

//按size和page获取文章，返回的data是Article[]
router.get('/',async  (ctx,next)=>{
    let page=+ctx.query.page;
    let size= +ctx.query.size;
    if(isNaN(page)||isNaN(size)){
        page=1;
        size=5;
    }
    console.log(ctx.session.userName,"访问了文章",`第${page}页, 共${size}项`);

    let articles = await Article.findAll({
        include:[
            {model:User,attributes:['username']},
            {model:Tag,attributes:['id','name','user_id']}
        ],
        offset:(page-1)*size,
        limit:size,
        order:[['date','DESC']]
    });
    let results_length = await Article.count();
    articles.forEach(ele=>{
        ele.dataValues.username=ele.User.username;
        ele.content = ele.content.slice(0,100)+((ele.content.length>100)?".......":"");
        ele.dataValues.tags = ele.Tags;
        ele.dataValues.tags.forEach(ele2=>{
            delete ele2.dataValues.ArticleTag;
        })
        delete ele.dataValues.Tags;
        delete ele.dataValues.User;
        delete ele.dataValues.user_id;
    })
    ctx.body = {
        success:true,
        info:`用户 ${ctx.session.userName} 获取文章 ${size}/${results_length} 成功`,
        data: articles,
        results_length:results_length
    }
})

//按size和page获取 自己的 文章，返回的data是Article[]
router.get('/own',async  (ctx,next)=>{
    let uname=ctx.session.userName;
    if(!uname){
        ctx.body = {
            success:true,
            info:`用户未登录`,
            data: null,
            results_length:0
        }
    }
    let page=+ctx.query.page;
    let size= +ctx.query.size;
    if(isNaN(page)||isNaN(size)){
        page=1;
        size=5;
    }
    console.log(uname,"访问了自己的文章",`第${page}页, 共${size}项`);
    let articles = await Article.findAll({
        include:[
            {model:User,attributes:['username'],where:{username:uname}},
            {model:Tag,attributes:['id','name','user_id']}
        ],
        offset:(page-1)*size,
        limit:size,
        order:[['date','DESC']],
    });
    let results_length = await Article.count({
        include:[
            {model:User,attributes:['username'],where:{username:uname}}
        ],
    });
    articles.forEach(ele=>{
        ele.dataValues.username=ele.User.username;
        ele.content = ele.content.slice(0,100)+((ele.content.length>100)?".......":"");
        ele.dataValues.tags = ele.Tags;
        ele.dataValues.tags.forEach(ele2=>{
            delete ele2.dataValues.ArticleTag;
        })
        delete ele.dataValues.Tags;
        delete ele.dataValues.User;
        delete ele.dataValues.user_id;
    })
    ctx.body = {
        success:true,
        info:`用户 ${ctx.session.userName} 获取文章 ${size}/${results_length} 成功`,
        data: articles,
        results_length:results_length
    }
})

//获取热门文章,y
router.get('/hottest',async ctx=>{
    let articles = await Article.findAll({
        include:[
            {model:User,attributes:['username']},
            {model:Tag,attributes:['id','name','user_id']}
        ],
        limit:5,
        order:[['clicktime','DESC']]
    });
    let results_length = await Article.count();
    articles.forEach(ele=>{
        ele.dataValues.username=ele.User.username;
        ele.content = ele.content.slice(0,100)+((ele.content.length>100)?".......":"");
        ele.dataValues.tags = ele.Tags;
        ele.dataValues.tags.forEach(ele2=>{
            delete ele2.dataValues.ArticleTag;
        })
        delete ele.dataValues.Tags;
        delete ele.dataValues.User;
        delete ele.dataValues.user_id;
    })
    ctx.body = {
        success:true,
        info:`用户 ${ctx.session.userName} 获取热门文章成功`,
        data: articles,
        results_length:results_length
    }
})

//获取一篇指定文章的具体内容
router.get('/:id',async (ctx,next)=>{
    console.log(ctx.params)
    let article = await Article.findOne({
        where:{
            id:ctx.params.id
        },
        include:[
            {model:User,attributes:['username']},
            {model:Tag,attributes:['id','name','user_id']}
        ],
    });
    if(!article){
        ctx.body={
            success:true,
            info:`用户 ${ctx.session.userName} 获取文章失败`,
            data:{}
        }
        return;
    }
    article.dataValues.username=article.User.dataValues.username;
    article.dataValues.tags = article.dataValues.Tags;
    delete article.dataValues.Tags;
    article.dataValues.tags.forEach(ele=>{
        delete ele.dataValues.ArticleTag;
    })
    delete article.dataValues.User;
    delete article.dataValues.user_id;
    console.log(article);
    ctx.body={
        success:true,
        info:`用户 ${ctx.session.userName} 获取文章 ${article.title} 成功`,
        data:article
    }
})

//新建一篇文章
router.post('/',async (ctx,next)=>{
    if(!ctx.session.userName){
        ctx.body = {
            success:false,
            info:"用户未登录，请先登录",
            data:{}
        }
        return;
    }
    let {title,target,content,tags}=ctx.request.body;
    console.log(content);
    let userFind= await User.findOne({
        where:{
            username:ctx.session.userName,
        }
    })
    console.log(userFind);
    let newArticle = await Article.create({
        title:title,
        target:target,
        clicktime:0,
        date:new Date(),
        content:content,
        user_id:userFind.id
    }).catch(err=>{
        ctx.body={
            success:false,
            info:"出现了点问题，上传失败",
            data:{title:title,author:ctx.session.userName}
        }
        throw err;
    });

    await sequelize.transaction(async t=>{
        for(let tag of tags){
            await ArticleTag.create({
                article_id:newArticle.id,
                tag_id:tag.id
            },{transaction:t}).catch(err=>{
                ctx.body={
                    success:false,
                    info:`文章《${newArticle.id}》添加标签失败。可能因为<${tag.name}>不存在。也可能是其他原因。` 
                }
                //出现错误，会回滚
            })
        }
    });

    ctx.body={
        success:true,
        info:"上传成功",
        data:{title:title,author:ctx.session.userName}
    }
})

//删除某一篇文章
router.delete('/:id',async (ctx,next)=>{
    let uname = ctx.session.userName;
    if(!uname){
        ctx.body={
            success:false,
            info:"用户未登录"
        }
        return;
    }
    let userFind = await User.findOne({
        where:{username:uname}
    });
    if(!userFind){
        ctx.body={
            success:false,
            info:"用户未登录"
        }
        return;
    }
    let pid = ctx.params.id;
    let articleFind = await  Article.findOne({
        where:{id:pid}
    });
    if(!articleFind){
        ctx.body={
            success:false,
            info:"文章不存在"
        }
        return;
    }
    if(userFind.id!=articleFind.user_id){
        ctx.body={
            success:false,
            info:"用户无权限操作"
        }
        return;
    }
    Article.destroy({
        where:{
            id:articleFind.id
        }
    })
    ctx.body={
        success:true,
        info:"文章删除成功！"
    }
})

//修改某一篇文章
router.put('/:id',async (ctx,next)=>{
    let uname = ctx.session.userName;
    if(!uname){
        ctx.body={
            success:false,
            info:"用户未登录"
        }
        return;
    }
    let userFind = await User.findOne({
        where:{username:uname}
    });
    if(!userFind){
        ctx.body={
            success:false,
            info:"用户未登录"
        }
        return;
    }
    let aid = ctx.params.id;
    let articleFind = await  Article.findOne({
        where:{id:aid}
    });
    if(!articleFind){
        ctx.body={
            success:false,
            info:"文章不存在"
        }
        return;
    }
    if(userFind.id!=articleFind.user_id){
        ctx.body={
            success:false,
            info:"用户无权限操作"
        }
        return;
    }
    let {title,target,content,tags}=ctx.request.body;
    await Article.update({
        title:title,
        target:target,
        content:content
    },{
        where:{
            id:aid
        }
    });
    await sequelize.transaction(async t=>{
        await ArticleTag.destroy({
            where:{article_id:aid}
        },{transaction:t}).catch(err=>{
            ctx.body={
                success:false,
                info:`文章《${aid}》添加标签失败。在清空标签时出错。` 
            }
            //出现错误，会回滚
        });
        for(let tag of tags){
            let r= await ArticleTag.create({
                article_id:aid,
                tag_id:tag.id
            },{transaction:t}).catch(err=>{
                ctx.body={
                    success:false,
                    info:`文章《${aid}》添加标签失败。可能因为<${tag.name}>不存在。也可能是其他原因。` 
                }
                //出现错误，会回滚
            });
        }
        ctx.body={
            success:true,
            info:"文章修改成功！"
        }
    });

})

//当用户点开文章，n秒后发送一个增加点击的请求
router.post('/click/:id',async ctx=>{
    let id=ctx.params.id;

    let curClick=await Article.findOne({
        attributes:['clicktime'],
        where:{id:id}
    });
    curClick=curClick.clicktime;

    await Article.update({
        clicktime:curClick+1
    },{
        where:{id:id}
    }).catch(err=>{
        ctx.body={
            success:false,
            info:"增加点击量时出现错误！"
        }
    });
    ctx.body={
        success:true,
        info:`文章《${id}》增加点击量成功！`,
        data:curClick+1
    }
})

//获取按照某一标签分类的所有文章
router.get('/divided/:tagetId',async  (ctx,next)=>{
    let uname=ctx.session.userName;
    if(!uname){
        ctx.body = {
            success:true,
            info:`用户未登录`,
            data: null,
            results_length:0
        }
        return;
    }
    let page= +ctx.query.page;
    let size= +ctx.query.size;
    if(isNaN(page)||isNaN(size)){
        page=1;
        size=5;
    }
    let tagetId=ctx.params.tagetId;
    console.log(`${uname}访问了标签 <${tagetId}> 的文章`);
    let articles = await Article.findAll({
        include:[
            {model:User,attributes:['username']},
            {model:Tag,attributes:['id','name','user_id'],where:{id:tagetId}}
        ],
        offset:(page-1)*size,
        limit:size,
        order:[['date','DESC']],
    });
    let results_length = await Article.count({
        include:[
            {model:User,attributes:['username'],where:{username:uname}},
            {model:Tag,attributes:['id','name','user_id'],where:{id:tagetId}}
        ],
    });
    articles.forEach(ele=>{
        ele.dataValues.username=ele.User.username;
        ele.content = ele.content.slice(0,100)+((ele.content.length>100)?".......":"");
        ele.dataValues.tags = ele.Tags;
        ele.dataValues.tags.forEach(ele2=>{
            delete ele2.dataValues.ArticleTag;
        })
        delete ele.dataValues.Tags;
        delete ele.dataValues.User;
        delete ele.dataValues.user_id;
    })
    ctx.body = {
        success:true,
        info:`用户 ${ctx.session.userName} 获取文章 ${size}/${results_length} 成功`,
        data: articles,
        results_length:results_length
    }
})
module.exports = router;
