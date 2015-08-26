
import * as mkdirp from 'mkdirp';
import * as ts from 'typescript';
import * as yargs from "yargs";
import {task, Task, start, getTask} from './task';
import {limpar_build} from "./limpar";
import {build_jade} from "./compila_jade";
import {build_ts} from "./compila_ts";

import charm_constructor = require("charm");

export var pasta_src = process.cwd() + '/src'
export var pasta_build = process.cwd() + '/build';
export var charm = charm_constructor(process.stdout);

yargs.
    demand(0).
    version(require(__dirname + '/../package.json').version).

    boolean('v').
    alias('v', 'verbose').
    describe('v', 'Verbose mode').

    boolean('t').
    alias('t', 'tree').
    describe('t', 'Show task tree dependences');

command({
    name: 'clear',
    description: "Remove builded files",
    dep_fn: limpar_build
});

command({
    name: 'build-jade',
    description: "Transform jade files into typescript files",
    dep_names: ['clear'],
    dep_fn: build_jade
});

command({
    name: 'build-ts',
    description: "Transform ts files into javacript files",
    dep_names: ['build-jade'],
    fn: build_ts
});

command({
    name: 'test-decl',
    description: "Link Gherkin files from tests/features to tests/steps",
    dep_names: ['build-ts'],
    fn: build_ts
});

command({
    name: 'all',
    description: "default task",
    dep_names: ['clear', 'build-jade', 'build-ts'],
});

yargs.
    strict().
    showHelpOnFail(true).
    help('help').alias('h', 'help');

export var args = yargs.parse(process.argv);

var exit_state = 1;

export function success() {
    exit_state = 0;
}

process.on('exit', function(code: number) {
    if (exit_state === 0) {
        charm.foreground("green");
        charm.write('Success\n');
        charm.display('reset')
    }
    if (exit_state === 1) {
        charm.foreground("red");
        charm.write('ABNORMAL FINALIZATION!!!\n');
        charm.display('reset')
    }
});

(function init() {
    if (args.help)
        return showHelp();
    if (args.tree) {
        showTree(args._.length >= 3 ? args._[2] : 'all', '');
        exit_state = 2;
        return;
    }
    var command = args._[2];
    var t = getTask(command ? command : 'all');
    if (t)
        start(t.name, () => {
            success();
        });
    else showHelp()
})();

function command(t: Task) {
    task(t);
    yargs.command(t.name, t.description);
}

function showHelp() {
    yargs.showHelp();
    exit_state = 2;
}

function showTree(n: string, ident: string) {
    var t = getTask(n);
    charm.display('dim');
    charm.write(ident);
    if (t.dep_names)
    {
       charm.write('+');
    }
    else {
      charm.write(' ');
    }
    charm.display('reset');
    charm.write(' '+t.name + '\n');
    if (t.dep_names) {
        ident += '| ';
        t.dep_names.forEach(d=> {
            showTree(d, ident);
        });
    }
}
