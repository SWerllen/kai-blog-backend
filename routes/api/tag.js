const router = require('koa-router')();
const Article = require('../../database/articleModel')
const User = require('../../database/userModel')
const Tag = require('../../database/tagModel')
const ArticleTag = require('../../database/articleTagModel')
const sequelize = require('../../database/sequelizeModel')
router.prefix('/tag');

//检查用户是否登录
function checkUser(ctx,uname){
    if(!uname){
        ctx.body={
            success:false,
            info:"用户未登录",
            data:[]
        }
        return false;
    }
    return true;
}

//获取标签，如果存在参数size和page则返回分页标签，如果不存在其中一项，返回所有标签 （用户自己的）
router.get('/',async ctx=>{
    let uname = ctx.session.userName;
    let {size,page} = ctx.params;
    let tags;
    if(!checkUser(ctx,uname)) {
        tags =await Tag.findAll({
            include:[
                {model:User,attributes:['username']}
            ]
        });
    }
    else if(!size){
        tags =await Tag.findAll({
            include:[
                {model:User,where:{username:uname},attributes:['username']}
            ]
        });
    }else{
        tags =await Tag.findAll({
            include:[
                {model:User,where:{username:uname},attributes:['username']}
            ],
            offset:(page-1)*size,
            limit:size
        });
    }
    tags.forEach(ele=>{
        delete ele.dataValues.User;
    });
    ctx.body={
        success:true,
        info:"获取成功！",
        data:tags
    }
    return;
})

//新建一个标签
router.post('/',async ctx=>{
    let uname = ctx.session.userName;
    if(!checkUser(ctx,uname)) return;
    let user = await User.findOne({
        where:{username:uname}
    })
    let name = ctx.request.body.name;
    
    let res = await Tag.findOne({
        where:{name:name,user_id:user.id}
    })
    if(res){
        ctx.body={
            success:false,
            info:`${uname}添加标签 <${name}> 失败，该用户已有同名标签！` 
        }
        return;
    }

    let newTag = await Tag.create({ 
        name:name,
        user_id:user.id
    }).catch(err=>{
        ctx.body={
            success:false,
            info:`${uname}添加标签 <${name}> 失败,${err}` 
        }
        return;
    });
    ctx.body={
        success:true,
        info:`${uname}添加标签 <${name}> 成功` ,
        data:[newTag]
    }
})

//将某一个标签加在文章上，新建一个ArticleTag关系
router.post('/:article_id',async ctx=>{
    let uname = ctx.session.userName;
    if(!checkUser(ctx,uname)) return;
    let article_id = ctx.params.article_id;
    //判断对文章操作的权限
    let article = await Article.findOne({
        include:[
            {model:User,attributes:['username']}
        ],
        where:{id:article_id},
    });
    if(!article){
        ctx.body={
            success:false,
            info:`文章不存在！` 
        }
        return;
    }
    console.log(article);
    if(article.dataValues.User.dataValues.username!=uname){
        ctx.body={
            success:false,
            info:`对文章无管理权限！` 
        }
        return;
    }

    let {tags} = ctx.request.body;  //tags是个数组
    sequelize.transaction(async t=>{
        for(let tag of tags){
            let check = await ArticleTag.findOne({
                where:{
                    article_id:article_id,
                    tag_id:tag.id
                }
            })
            if(check) continue;
            await ArticleTag.create({
                article_id:article_id,
                tag_id:tag.id
            },{transaction:t}).catch(err=>{
                ctx.body={
                    success:false,
                    info:`文章《${article_id}》添加标签失败。可能因为<${tag.name}>不存在。也可能是其他原因。` 
                }
                //出现错误，会回滚
            })
        }
    });
    ctx.body={
        success:true,
        info:`文章《${article_id}》添加标签成功` 
    }
})

//删除某一个标签，会顺带删除以此标签为外键的文章标签关系
router.delete('/:id',async ctx=>{
    let uname = ctx.session.userName;
    if(!checkUser(ctx,uname)) return;
    let tagId=ctx.params.id;
    await Tag.destroy({
        where:{id:tagId}
    });
    ctx.body={
        success:true,
        info:`删除标签 "${tagId}" 成功`
    }
})

//修改某一个标签的名字
router.put('/:id',async ctx=>{
    let uname = ctx.session.userName;
    if(!checkUser(ctx,uname)) return;
    let tagId=ctx.params.id;
    let {name} = ctx.request.body;
    await Tag.update({
        name:name
    },{
        where:{id:tagId}
    });
    ctx.body={
        success:true,
        info:`修改标签 "${tagId}" 成功`
    }
})

module.exports = router