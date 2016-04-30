#!/usr/bin/env node
'use strict'

var fs = require('fs')
var util = require('util')
var pump = require('pump')
var menu = require('appendable-cli-menu')
var log = require('single-line-log').stdout
var chalk = require('chalk')
var bonjour = require('bonjour')()
var spy = require('ipp-spy')
var gunzip = require('gunzip-maybe')
var peek = require('peek-stream')
var isPostScript = require('is-postscript')
var isPjl = require('is-pjl')
var isPdf = require('is-pdf')
var C = require('ipp-encoder/constants')

var logFile = (process.argv[2] || '').split('=')
logFile = logFile[0] === '--log' ? logFile[1] : null

var printers = menu('Select a printer', function (printer) {
  browser.stop()
  hijack(printer)
})

var browser = bonjour.find({ type: 'ipp' }, function (printer) {
  printers.add({ name: printer.name, value: printer })
})

function hijack (printer) {
  var state = { printer: printer, ops: 0, docs: [] }
  render(state)

  var opts = {
    port: 3001,
    forwardHost: printer.host,
    forwardPort: printer.port
  }

  spy(opts, function (operation, doc) {
    if (logFile) {
      fs.appendFileSync(logFile,
        '-------------------------------------------\n' +
        util.inspect(operation, { depth: null }) + '\n')
    }

    state.ops++
    render(state)

    if (operation.operationId === C.PRINT_JOB || operation.operationId === C.SEND_DOCUMENT) {
      var file = toFile('job-' + Date.now())
      pump(doc, gunzip(), file, function (err) {
        if (err) throw err
        state.docs.push(file.name)
        render(state)
      })
    }
  })

  bonjour.publish({ type: printer.type, name: printer.name, port: 3001, txt: printer.txt, probe: false })
}

function toFile (name) {
  var stream = peek({ newline: false, maxBuffer: 10 }, function (data, swap) {
    if (isPostScript(data)) name += '.ps'
    else if (isPjl(data)) name += '-pjl.ps' // Preview.app on OS X will be able to read some PJL documents if opened as .ps
    else if (isPdf(data)) name += '.pdf'
    else name += '.bin'
    stream.name = name
    swap(null, fs.createWriteStream(name))
  })
  return stream
}

function render (state) {
  var len = state.docs.length
  log('Target printer:       ' + chalk.yellow(state.printer.name) + chalk.grey(' [' + state.printer.host + ':' + state.printer.port + ']\n') +
      'Requests intercepted: ' + chalk.green(state.ops) + '\n' +
      'Documents printed:    ' + chalk.green(len) + '\n' +
      'Latest document:      ' + (len ? chalk.cyan(state.docs[len - 1]) : chalk.grey('waiting...')) + '\n')
}
