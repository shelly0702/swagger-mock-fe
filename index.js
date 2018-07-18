const express = require('express');
const app = express();
const http = require('http');
const fs = require('fs');
const path = require('path');
const types = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'];
class SwaggerMock {
    constructor(options) {
        this.options = Object.assign({
            hostname: '', //接口文档域名
            host: '', //接口文档ip
            port: 80, //接口文档端口
            path: '/v2/api-docs',
            method: 'GET',
            projectName: 'swagger', //项目名称
            mockPort: 3001, //模块数据服务端口
            mockPos: '../../', //mock文档生成的相对位置
        }, options);
        this.main();
    }

    main() {
        const req = http.request(this.options, (res) => {
            console.log(`状态码: ${res.statusCode}`);
            console.log(`响应头: ${JSON.stringify(res.headers)}`);

            res.setEncoding('utf8');
            if (res.statusCode != 200) {
                console.log('请检查配置是否设置正确！');
                return;
            }
            // 所有的url数据
            let urlsReal = {}; //真实路径
            let urlsRealJian = {};
            let global = {};
            res.on('data', (chunk) => {
                global += chunk;
            });

            res.on('end', () => {
                let jsonGlobal = JSON.parse(global.replace('[object Object]', ''));
                let tags = jsonGlobal.tags; //业务模块
                let paths = jsonGlobal.paths; //所有路径
                let mockDirName = `${this.options.mockPos}${this.options.projectName}mock`;
                let promiseArray = [];
                let globalDefinitions = jsonGlobal.definitions; //数据模型

                deleteall(path.resolve(__dirname, mockDirName)); //删除目录
                createMock(mockDirName); //创建目录
                //遍历tags
                for (let i = 0; i < tags.length; i++) {
                    let tagName = tags[i].name; //模块名
                    let urlMockKey = tagName.toLowerCase(); //按模块对象key
                    urlsReal[urlMockKey] = {};
                    for (let key in paths) {
                        if (isHasTagName(tagName, paths[key])) {
                            
                            for (let typekey in paths[key]) {
                                let http_path = key; //请求url
                                let http_type = ''; //请求类型数组，一个请求可能支持多种类型
                                let http_desc = '';
                                let objkey = '';
                                let pathKey = '';
                                http_type = typekey;
                                http_desc = paths[key][typekey].summary;
                                pathKey = paths[key][typekey].operationId;
                                objkey = paths[key][typekey].responses['200'].schema ? paths[key][typekey].responses['200'].schema['$ref'] : '';

                                //真实数据拼装
                                urlsReal[urlMockKey][pathKey] = {
                                    url: http_path,
                                    type: http_type,
                                    desc: `${tags[i].description} -> ${http_desc}`
                                };
                                urlsRealJian[pathKey] = {
                                    url: http_path,
                                    type: http_type,
                                };

                                if (objkey) {
                                    //生成文件
                                    let mockDir = `${mockDirName}/${pathKey}.json`;
                                    var filePath = path.resolve(__dirname, mockDir);
                                    let jsonData = {};
                                    // objkey = '#/definitions/统一返回数据处理«List«MenuDto»»';
                                    let tempkey = queryData(objkey);
                                    jsonData = dealModel(globalDefinitions[tempkey], globalDefinitions);
                                    promiseArray.push(createMockJson(filePath, JSON.stringify(jsonData, null, 2), function() {
                                        createServer(http_path, mockDir, http_type);
                                    }, function() {
                                        // createServer(http_path, mockDir, http_type);
                                    }));

                                }
                            }


                        }
                    }
                }

                promiseArray.push(createMockJson(path.resolve(__dirname, `${mockDirName}/urlsReal.json`), JSON.stringify(urlsReal, null, 2)));
                let hostname = this.options.headers.host?this.options.headers.host:this.options.hostname;
                let host = hostname?hostname:this.options.host;
                promiseArray.push(createMockJson(path.resolve(__dirname, `${mockDirName}/urlsReal.js`), 
                    jsTpl(urlsRealJian,this.options.mockPort,host)));
                Promise.all(promiseArray).then((values) => { //文件创建完成后，再启动服务
                    app.listen(this.options.mockPort, () => {
                        console.log(`【${new Date()}】服务器启动!`);
                        console.log(`http://127.0.0.1:${this.options.mockPort}`);
                    });
                });

                console.log('响应中已无数据。');
            });
        });

        req.on('error', (e) => {
            console.error(`请求遇到问题: ${e.message}`);
        });

        req.end();
    }

};

function jsTpl(urlsRealJian,port,hostname) {
    let tpl =  `let isDebug = (window.location.href).indexOf('debug') > -1;
let host = isDebug?'127.0.0.1:${port}':'${hostname}';
let url = {
    `;
for (let key in urlsRealJian) {
    tpl += `'${key}':{
        url:host + '${urlsRealJian[key].url}',
        type: '${urlsRealJian[key].type}'
    },
    `;
}
tpl +=`}`;
    return tpl;
}

//处理数据模型
function dealModel(definitions, globalDefinitions) {
    let result = {};
    let type = definitions && definitions.type ? definitions.type : '';
    if (type) {
        if (type == 'string') {
            result = 'string';
        }
        if (type == 'integer') {
            result = 0;
        }
        if (type == 'boolean') {
            result = false;
        }
        if (type == 'object') {
            if (definitions.properties) {
                result = definitions.properties;
                for (let key in result) {
                    result[key] = dealModel(result[key], globalDefinitions);
                }
            } else {
                result = {};
            }
        }
        if (type == 'array') {
            let items = definitions.items;
            if (items.type) {
                dealModel(items, globalDefinitions);
            } else {
                let objkey = queryData(definitions.items['$ref']);
                //防止递归数据造成死循环
                result = [dealModel(globalDefinitions[objkey], globalDefinitions)];
            }

        }
    } else {
        let goObject = definitions['$ref'];
        if (goObject) {
            let objkey = queryData(goObject);
            result = dealModel(globalDefinitions[objkey], globalDefinitions);
        }

    }
    return result;
}

//数据查找路径
function queryData(hash) {
    let result = '';
    result = (hash.substring(2, hash.length)).split('/');
    return result[1];
}

//tagName是否包含在本条数据中
function isHasTagName(tagName, item) {
    let flag = false;
    for (let i = 0; i < types.length; i++) {
        if (item[types[i].toLowerCase()] && item[types[i].toLowerCase()].tags[0] && (item[types[i].toLowerCase()].tags[0] == tagName)) {
            flag = true;
        }
    }
    return flag;
}

//删除文件夹及文件
function deleteall(path) {
    var files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

//文件夹创建过程
function createMock(mockName) {
    let dir = path.resolve(__dirname, `${mockName}`);
    console.log(`创建目录：${dir}`);
    //创建mock文件夹
    createDir(dir);
}

//文件创建
function createMockJson(filePath, jsonData, suc, err) {
    return createFile(filePath, jsonData).then(function(e) {
        if (suc) suc(e);
        console.log(filePath + ' 文件创建成功！');
    }, function(e) {
        if (err) err(e);
        console.log(e)
    });
}

//目录创建
function createDir(dir) {
    var stat = fs.existsSync(dir);
    if (!stat) { //为true的话那么存在，如果为false不存在
        fs.mkdirSync(dir);
    }
}

//文件创建
function createFile(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, (err) => {
            if (!err) {
                resolve(filePath);
            } else {
                reject(err);
            }
        });
        var stat = fs.existsSync(filePath);
        if (stat) { //为true的话那么存在，如果为false不存在
            reject(`${filePath} 已存在，内容已覆盖`);
        }
    });
}

//创建server

function createServer(url, mockDir, type) {
    let requreMockJson = require(mockDir);
    app[type](dealUrl(url), function(req, res) {
        console.log('请求时间：' + new Date());
        console.log('请求路径：' + url);
        console.log('请求方式：' + type);
        console.log('请求参数：' + JSON.stringify(req.params));
        res.header('Content-type', 'application/json');
        res.header('Charset', 'utf8');
        // res.send(req.query.callback + '(' + JSON.stringify(requreMockJson) + ');');
        res.send(JSON.stringify(requreMockJson));
    });
}

//将含有花括号的url，替换成对应的数据
function dealUrl(url) {
    return url.replace(/\{.*?\}/g, function(d) {
        let key = d.substring(1, d.length - 1);
        return `:${key}`;
    }); //此正则很重要
}

module.exports = SwaggerMock