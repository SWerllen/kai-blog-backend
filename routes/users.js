const router = require('koa-router')();
const UserTable = require('../database/userModel');

router.prefix('/users')

function isUserExist(name){
  return UserTable.findOne({
      where:{
          username:name,
      }
  });
}

router.post('/',async (ctx,next)=>{
  let {username,password,email} = ctx.request.body;
  let res = await isUserExist(username);
  if(res!=null){
    ctx.body={able:false,message:'Register failed because there has been same username!'}
    return;
  }
  await UserTable.create({
    username: username,
    password: password,
    email: email
  })
  ctx.body={success:true, message:"Register successfully!"};
})

//寻找是否有重名的用户
router.get('/',async (ctx,next)=>{
  let res = await isUserExist(ctx.query.username);
  console.log(res);
  ctx.body={able:res==null};
})

router.post('/signin',async (ctx,next)=>{
  console.log(ctx.request.body);
  let res = await isUserExist(ctx.request.body.username);
  if(res==null){
    ctx.body={success:false,message:'不存在该用户'}
    return;
  }
  if(res.password !== ctx.request.body.password){
    ctx.body={success:false,message:'密码错误！'}
    return;
  }
  ctx.body={success:true, message:"登陆成功!"};
  ctx.session.userName = ctx.request.body.username;
})

router.post('/state',async (ctx,next)=>{
  let uname=ctx.session.userName;
  if(!uname){
    ctx.body={success:false,info:"未登录",data:{}};
    return;
  }
  let user = await UserTable.findOne({
    attributes:['username','email'],
    where:{
      username:uname
    }
  });
  if(user)
    ctx.body={success:true,info:"已登录",data:user};
  else
    ctx.body={success:false,info:"未登录",data:{}};
})

router.post('/signout',async (ctx,next)=>{
  if(!ctx.session.userName){
    ctx.body={
      success:false,
      info:"用户未登录"
    };
    return;
  }
  ctx.body={
    success:true,
    info:`${ctx.session.userName}注销成功`
  };
  ctx.session = null;
  return;
})

module.exports = router;
