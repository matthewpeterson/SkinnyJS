/* globals require, module */
var generateHomepage = require("./site/generate-homepage");
var addDocsLinks = require("./site/add-docs-links");
var fs = require("fs");

function getFilesSync(directory, buffer)
{
    if (!buffer)
    {
        buffer = [];
    }

    var files = fs.readdirSync(directory);
    for (var i=0; i<files.length; i++)
    {
        var file = directory + "/" + files[i];
        if (fs.lstatSync(file).isDirectory())
        {
            getFilesSync(file, buffer);
        }
        else
        {
            buffer.push(file);
        }
    }

    return buffer;
}

function getUglifyConfig()
{
    var ret = {};

    var files = getFilesSync("dist");
    for (var i=0; i<files.length; i++)
    {
        var minFile = files[i].replace(".js", ".min.js");
        ret[minFile] = [ files[i] ];
    }

    return ret;
}

function getCopyConfig()
{
    var ret = [];

    var files = getFilesSync("js");
    for (var i=0; i<files.length; i++)
    {
        if (files[i].indexOf("js/jquery.modalDialog") === 0)
        {
            continue;
        }

        ret.push({
            expand: true,
            src: [files[i]],
            dest: "dist/",
            flatten: true
        });
    }

    return ret;
}

module.exports = function(grunt)
{
    var config = 
    {
        pkg: grunt.file.readJSON('package.json'),
        jshint:
        {
            uses_defaults: ['gruntfile.js', 'js/**/*.js'],
            with_overrides: 
            {
                options:
                {
                    globals: {
                        "$": true,
                        "module": true,
                        "test": true,
                        "equal": true,
                        "jQuery": true
                    }
                },
                files: 
                {
                    src: ['test/**/*.js']
                }
            },
            options:
            {
                jshintrc: '.jshintrc'
            }
        },
        qunit: {
          all: ['test/**/*.html']
        },
        groc:
        {
            javascript: ["js/**/*.js"],
            options: 
            {
                out: ".git/docs-temp/"
            }
        },
        copy: 
        {
          dist: 
          {
            files: getCopyConfig()
          },
          docs: 
          {
            files: 
            [
                { expand: true, flatten: true, src: ["site/images/*"], dest: ".git/docs-temp/images/" },
                { expand: true, flatten: true, src: ["site/javascripts/*"], dest: ".git/docs-temp/javascripts/" },
                { expand: true, flatten: true, src: ["site/stylesheets/*"], dest: ".git/docs-temp/stylesheets/" }
            ]
          }
        },
        concat: 
        {
            options: 
            {
              separator: '\n'
            },
            modalDialog: 
            {
              src: ['js/jquery.modalDialog.common.js', 'js/jquery.modalDialog.js', 'js/jquery.modalDialog.deviceFixes.js', 'js/jquery.modalDialog.unobtrusive.js'],
              dest: 'dist/jquery.modalDialog.js'
            },
            modalDialogContent: 
            {
              src: ['js/jquery.modalDialog.common.js', 'js/jquery.modalDialogContent.js'],
              dest: 'dist/jquery.modalDialogContent.js'
            }
        },
        uglify:
        {
            dist:
            {
                files: getUglifyConfig()
            }
        }            
    };

    // Project configuration.
    grunt.initConfig(config);

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-groc');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'qunit', 'copy:dist', 'concat', 'uglify']);

    // Travis CI task.
    grunt.registerTask('travis', 'default');

    // Documentation task(s).
    grunt.registerTask('gen-homepage', "Generates index.html from README.md", generateHomepage);
    grunt.registerTask('add-docs-links', "Adds links to documentation pages", addDocsLinks);
    grunt.registerTask('docs', ['gen-homepage', 'groc', 'add-docs-links', 'copy:docs']);
};