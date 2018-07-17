let swaggerMock = require('./index');
new swaggerMock({
    host: 'xxxxx',
    path: '/zv2/api-docs',
    projectName: 'youli',
    mockPos: './',
    headers: {
        'host': 'xxx.xxx.com'
    }
})