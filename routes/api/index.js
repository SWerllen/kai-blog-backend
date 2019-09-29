const router = require('koa-router')();
const articleRouter = require('./article');
const tagRouter = require('./tag');
router.prefix("/api");
router.use(articleRouter.routes(),articleRouter.allowedMethods())
router.use(tagRouter.routes(),tagRouter.allowedMethods())
module.exports = router;
