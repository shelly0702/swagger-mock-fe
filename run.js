const swaggerMock = require('./index');
new swaggerMock({
    host: '192.168.62.146',//此处是swagger文档服务ip
    projectName: 'jxi',
    mockPos: './',
    mockPort: 3000,
    headers: {
        'host': 'youai.jd.com'
    }
});
