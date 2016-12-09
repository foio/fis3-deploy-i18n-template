/**
 * A i18n deploy plugin for i18n
 * Copyright (c) 2016
 * All rights reserved
 *
 * Author: syszhpe@gmail.com
 * Modifier: tonyc726@gmail.com
 */

'use strict';

var fs = require('fs');
var path = require('path');
var walk = require('walk');
var ejs = require('ejs');
var extend = require('extend');

function propDeepVerifier (obj, propsPath, i, content) {
  if (obj[propsPath[i]] === undefined) {
    obj[propsPath[i]] = {}
  }
  var next = i + 1
  if (next < propsPath.length) {
    propDeepVerifier(obj[propsPath[i]], propsPath, next, content)
  } else if (next === propsPath.length) {
    obj[propsPath[i]] = content
  }
}

module.exports = function(srcOptions, modified, total, next) {
  var options = {
    'open': '<%',
    'close': '%>',
    'i18n': 'lang',
    'dist': 'html/$lang/$file',
    'default': '',
    'keepParentDirectoryList': []
  };
  extend(options,srcOptions);

  //read i18n language json file
  var langList = {},
    langDefault = options['default'] || null;

  var i18nResourcePath = path.join(fis.project.getProjectPath(), options.i18n)

  var walker = walk.walk(i18nResourcePath, { followLinks: false })

  walker.on('file', (root, fileStat, next) => {
    var propsPath = root.replace(i18nResourcePath, '').replace(/^\//, '').replace(/\/$/, '').split('/')
    propsPath.push(fileStat.name.replace(/\.(json|js)$/, ''))
    propsPath = propsPath.filter(function (propPath) {
      return propPath && propPath.length !== 0
    })
    var filePath = path.join(root, fileStat.name)
    var content = null
    if (/\.js$/.test(fileStat.name)) {
      content = require(filePath)
    } else if (/\.json$/.test(fileStat.name)) {
      content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
    propDeepVerifier(langList, propsPath, 0, content)
    next()
  });

  walker.on("errors", (root, nodeStatsArray, next) => {
    console.error('\nparse json failed:'+ root);
  });

  walker.on("end", () => {
    //generate html file from i18n file and template file
    var distHtmlFiles = [];
    modified.forEach(function(file) {
      if(file.isHtmlLike){
        if (!/^_/.test(file.filename)) {
          var template = ejs.compile(file.getContent(),{'open':options.open,'close':options.close});

          for(var lang in langList){
            var path = /([^\/]+)(?=\.html)/.exec(file.subpath);
            var distfile = options.dist.replace('$lang',((langDefault!==null && ~lang.indexOf(langDefault))?'':lang));
            var fileReplace = path[0];
            if (options.keepParentDirectoryList && options.keepParentDirectoryList.length !== 0) {
              var needKeep = false,
                needKeepDirectoryName = '',
                fileSubpathSplit = file.subpath.split('/');

              options.keepParentDirectoryList.forEach(function (dirKeyword) {
                // 多层目录的判断
                if (~dirKeyword.indexOf('/')){
                  if (~file.subpath.indexOf(dirKeyword.replace(/\/$/, '')+'/')){
                    needKeep = true;
                    needKeepDirectoryName = dirKeyword;
                    return;
                  }
                } else {
                  if (~fileSubpathSplit.indexOf(dirKeyword)) {
                    needKeep = true;
                    needKeepDirectoryName = dirKeyword;
                    return;
                  }
                }
              })

              if (needKeep === true) {
                fileReplace = needKeepDirectoryName + '/' + path[0];
              }
            }

            distfile = distfile.replace('$file', fileReplace);

            var htmlFile = fis.file(fis.project.getProjectPath(),'/'+distfile+'.html');
            htmlFile.setContent(template(langList[lang]));
            distHtmlFiles.push(htmlFile);
          }
        }
      }
    });

    //add to deplay file array
    distHtmlFiles.forEach(function(file){
      modified.push(file);
    });

    //invoke the next deploy plugin
    next();
  });
};
