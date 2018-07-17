<div align="center">
  <h1>Swagger Mock FE</h1>
  <p>分析Swagger文档，输出相应的mock数据，并启动node服务，供前端开发时调试使用，提高前端开发效率</p>
</div>

<h2 align="center">安装</h2>

```bash
npm install --save-dev swagger-mock-fe
```

<h2 align="center">用法</h2>

```js
const swaggerMock = require('swagger-mock-fe');
new swaggerMock({
    host: '10.xxx.xxx.15',//此处是swagger文档服务ip
    projectName: 'test'
});
```

<h2 align="center">参数</h2>
|Attributes|forma|describe
|---|---|---|
|host| string| swagger文档地址ip,必填
|hostname|string| swagger文档访问域名，如果此处传入任何值，host字段则不生效
|port| integer| swagger文档地址端口号, 默认80
|projectName| string| 项目名，默认值swaggermock
|mockPort| string| 本地mock服务启动后的端口，默认为3001
|mockPos| string| mock文档生成的相对位置，默认为./


<h2 align="center">运行</h2>
<p>
将上面的代码放置于安装了依赖后的项目中的某个js中，如run.js,执行如下命令
</p>
```js
node run.js
```

<h2 align="center">使用</h2>
<p>
访问如下形式的真实地址，即可看到模拟数据,端口默认为3000，可配置为其他值
</p>
```js
http://127.0.0.1:3000/xxx/xxx/xxx.do
```
