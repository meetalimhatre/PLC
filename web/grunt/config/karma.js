'use strict'

const path = require('path')
var util = require('util')

module.exports = function (grunt, config) {
  var browsers = (config.sapui5 && config.sapui5.browsers) || []
  var optionsRunner = {
    autoWatch: true,
    browsers: browsers,
    exclude: [
      config.sapui5.resources + '/',
      config.sapui5.testResources + '',
      'node_modules/**/!(qunit|adapter).js',
      'jspm_packages/**/*',
      'bower_components/**/*'
    ]
  }
  var optionsCi = {
    browsers: browsers,
    singleRun: true
  }
  var optionsWatch = {
    autoWatch: false,
    browsers: browsers,
    exclude: [
      config.sapui5.resources + '/**/*',
      config.sapui5.testResources + '**/*',
      'node_modules/**/!(qunit|adapter).js',
      'jspm_packages/**/*',
      'bower_components/**/*'
    ],
    background: true,
    singleRun: false
  }
  var reporters = ['progress']
  if (grunt.option('code-coverage') === true) {
    reporters.push('coverage')
  }

  var taskName
  var tasks = {
    options: {
      failOnEmptyTestSuite: false,
      frameworks: ['openui5', 'qunit'],
      openui5: {
        path: 'http://localhost:9876/resources/sap-ui-core.js'
      },
      reporters: reporters,
      coverageReporter: {
        dir: 'reports/coverage',
        reporters: [
          {
            type: 'html',
            subdir: function (browser) {
              return 'html-report-' + browser.toLowerCase().split(/[ /-]/).join('-')
            }
          }, {
            type: 'cobertura', subdir: '.', file: 'cobertura.xml'
          }
        ]
      },
      customLaunchers: {
        ChromeHeadlessXmake: {
          base: 'ChromeHeadless',
          flags: ['--no-sandbox', '--disable-translate', '--disable-extensions', '--remote-debugging-port=9223']
        }
      },
      proxies: {
        '/resources': 'http://localhost:<%= connect.server.options.port %>/resources'
      }
    },
    'all-runner': {
      options: optionsRunner,
      files: []
    },
    'all-ci': {
      options: optionsCi,
      files: [],
      reporters: reporters.slice()
    },
    'all-watch': {
      options: optionsWatch,
      files: []
    }
  }

  if (grunt.profiles('xmake')) {
    tasks['all-ci'].reporters.push('junit')
    tasks['all-ci'].junitReporter = {
      outputDir: path.join(config.cwd, 'reports'),
      outputFile: 'junit.xml',
      suite: '',
      useBrowserName: false,
      nameFormatter: undefined,
      classNameFormatter: undefined,
      properties: {}
    }
  }

  const testrunnerSchemaName = grunt.option('schema') || 'default'

  config.sapui5.artifacts.forEach(function (artifact) {
    artifact.testrunnerSchema = artifact.testrunnerSchema || {}
    artifact.testrunnerSchema.default = artifact.testrunnerSchema.default || ['**/*.qunit.js']
    artifact.testrunnerSchema['default-ci'] = artifact.testrunnerSchema['default-ci'] || artifact.testrunnerSchema.default

    const testrunnerFiles = artifact.testrunnerSchema[testrunnerSchemaName] || []

    var watchedResources = {
      src: [artifact.resources + '/**/*.js', artifact.resources + '/**/*.xml', artifact.resources + '/**/**'],
      included: false,
      watched: true
    }
    var watchedTestResources = {
      src: [artifact.testResources + '/**/*.js', artifact.testResources + '/**/*.xml', artifact.testResources + '/**/**'],
      included: false,
      watched: true
    }
    var includedFiles = {
      src: testrunnerFiles.map(function (testrunnerFile) {
        const exclude = /^!/.test(testrunnerFile)
        testrunnerFile = exclude ? testrunnerFile.substr(1) : testrunnerFile
        return (exclude ? '!' : '') + artifact.testResources + '/' + testrunnerFile
      }),
      included: true
    }
    tasks['all-runner'].files.push(watchedResources, watchedTestResources, includedFiles)
    tasks['all-ci'].files.push(watchedResources, watchedTestResources, includedFiles)
    tasks['all-watch'].files.push(watchedResources, watchedTestResources, includedFiles)

    taskName = util.format('%s-runner-%s', artifact.artifactType, artifact.name)
    tasks[taskName] = { options: optionsRunner, files: [ watchedResources, watchedTestResources, includedFiles ] }

    taskName = util.format('%s-ci-%s', artifact.artifactType, artifact.name)
    tasks[taskName] = { options: optionsCi, files: [ watchedResources, watchedTestResources, includedFiles ] }
  })

  return tasks
}
