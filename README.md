#fis3-deploy-i18n-template
A i18n deploy plugin for [fis3](http://fis.baidu.com/) using [ejs](https://www.npmjs.com/package/ejs)

## Usage

### i18n

```
src
├── fis-conf.js
├── i18n-folder-name
│   ├── en.json
│   ├── zh.json
│   └── ...
├── template-folder
│   ├── index.tpl
│   ├── detail.tpl
│   └── ...
├── package.json
└── views
```

### fis-conf.js

``` javascript

fis.match('*.tpl',{
    isHtmlLike: true
});

fis.match('**', {
    deploy: [
        fis.plugin('i18n-template', {
        open: '<%',
        close: '%>',
        i18n: 'i18n-folder-name',
        dist: 'html/$lang/$file',  //destination: $lang(en,zh....),$file
    }),
    fis.plugin('local-deliver'),
    ]
});
```

## Example

### i18n

- lang/en.json

```
{
    "hello": "hello",
    "world": "world"
}
```

- lang/zh.json

```
{
    "hello": "你好",
    "world": "世界"
}
```

### tpl

- tpl/index.tpl

```
<html>
<head>
    <meta charset="UTF-8">
    <title>index.html</title>
</head>
<body>
    <p><%=hello%></p>
    <p><%=world%></p>
</body>
</html>
```

### output
- dist/html/en/index.html

```
<html>
<head>
    <meta charset="UTF-8">
    <title>index.html</title>
</head>
<body>
    <p>hello</p>
    <p>world</p>
</body>
</html>
```

- dist/html/zh/index.html

```
<html>
<head>
    <meta charset="UTF-8">
    <title>index.html</title>
</head>
<body>
    <p>你好</p>
    <p>世界</p>
</body>
</html>
```

## More

Since we using [ejs](https://www.npmjs.com/package/ejs) as the template engin, any syntax supported by ejs is supported by this plugin.
