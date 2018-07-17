<div align="center">
  <h1>Swagger Mock FE</h1>
  <p>分析Swagger文档，输出相应的mock数据，并启动node服务，供前端开发时调试使用，提高前端开发效率</p>
</div>

<h2 align="center">Install</h2>

```bash
npm install --save-dev swagger-mock-fe
```

<h2 align="center">Usage</h2>

```js
const swaggerMock = require('swagger-mock-fe');
new swaggerMock({
    host: '10.xxx.xxx.15',//此处是swagger文档服务ip
    projectName: 'test'
});
```

<h2 align="center">运行</h2>
<p>
将上面的代码放置于安装了依赖后的项目中的某个js中，如run.js,执行如下命令
</p>
```js
node run.js
```