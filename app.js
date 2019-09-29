const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const session = require("koa-session");

const index = require('./routes/index')
const users = require('./routes/users')
const api = require('./routes/api')
// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))

// logger
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin","http://localhost:4200");
  ctx.set("Access-Control-Allow-Methods","GET,POST,PUT,OPTIONS,DELETE");
  ctx.set("Access-Control-Allow-Headers","origin, X-Custom-Header,Content-Type,Access-Token");
  ctx.set("Access-Control-Allow-Credentials","true");
  if(ctx.method=="OPTIONS"){
      ctx.body="200";
      return;
  }
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})
app.keys = ['some secret hurr'];

const CONFIG = {
  key: 'blog:koa:sess', /** (string) cookie key (default is koa:sess) */
  /** (number || 'session') maxAge in ms (default is 1 days) */
  /** 'session' will result in a cookie that expires when session/browser is closed */
  /** Warning: If a session cookie is stolen, this cookie will never expire */
  maxAge: 86400000
};

app.use(session(CONFIG, app));

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())
app.use(api.routes(),api.allowedMethods())
// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
