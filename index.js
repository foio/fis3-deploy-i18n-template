/*
 * A i18n deploy plugin for i18n
 * by syszhpe@gmail.com
 */

'use strict';

var fs = require('fs');
var ejs = require('ejs');
var extend = require('extend');

module.exports = function(srcOptions, modified, total, next) {
    var options = {'open':'<%','close':'%>','i18n':'lang','dist':'html/$lang/$file'};
    extend(options,srcOptions);

    //read i18n language json file
    var langList = [];
    fs.readdirSync(fis.project.getProjectPath()+'/'+options.i18n).map(function(f){
        var langPrefix = /^(.*[^\s])\.json$/.exec(f);
        if(langPrefix && langPrefix[1]){
            langPrefix = langPrefix[1];
            try{
                langList[langPrefix] = JSON.parse(fs.readFileSync(fis.project.getProjectPath()+'/'+options.i18n+'/'+f));
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
            var template = ejs.compile(file.getContent(),{'open':options.open,'close':options.close});
            for(var lang in langList){
                var path = /([^\/]+)(?=\.html)/.exec(file.subpath);
                var distfile = options.dist.replace('$lang',lang);
                distfile = distfile.replace('$file',path[0]);
                var htmlFile = fis.file(fis.project.getProjectPath(),'/'+distfile+'.html');
                htmlFile.setContent(template(langList[lang]));
                distHtmlFiles.push(htmlFile); 
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
