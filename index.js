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
var ejs = require('ejs');
var extend = require('extend');

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
  var langList = [],
    langDefault = null;
  fs.readdirSync(fis.project.getProjectPath()+'/'+options.i18n).map(function(f){
    var langPrefix = /^(.*[^\s])\.json$/.exec(f);
    if(langPrefix && langPrefix[1]){
      langPrefix = langPrefix[1];
      try{
        langList[langPrefix] = JSON.parse(fs.readFileSync(fis.project.getProjectPath()+'/'+options.i18n+'/'+f));
        if ((options.default+'') === langPrefix) {
          langDefault = langPrefix;
        }
      }catch(e){
        console.error('\nparse json failed:'+ fis.project.getProjectPath()+'/'+options.i18n+'/'+f);
        throw e;
      }
    }
  });

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
              if (~fileSubpathSplit.indexOf(dirKeyword)) {
                needKeep = true;
                needKeepDirectoryName = dirKeyword;
                return;
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
};
