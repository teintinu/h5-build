
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var jaect = require('jaect');
var ts = require("typescript");
var commander = require("commander");

namespace h5build {

    var tasks: { [name: string]: Task } = {}
    export var pasta_src = process.cwd() + '/src'
    export var pasta_build = process.cwd() + '/build';

    commander
        .version(require(__dirname + '/package.json').version)
    //      .option('-C, --chdir <path>', 'change the working directory')

    task({
        name: 'clear',
        description: "Remove builded files",
        dep_fn: limpar_build
    }, true);

    task({
        name: 'build',
        description: "Build files",
        dep_names: ['clear'],
        dep_fn: compila_jades
    }, true);

    task({
        name: 'default',
        description: "default task",
        dep_names: ['clear'],
    }, true);

    commander
        .command('*')
        .description('clear/build/test/coverage/lint/deploy')
        .action(function() {
            start('default', () => {
                console.log("END")
            });
        });

    commander.parse(process.argv);

    export type TaskFunction = (done: DoneFunction) => void;
    export type DoneFunction = () => void;

    export interface Task {
        name: string,
        description: string,
        fn?: TaskFunction,
        dep_names?: string[],
        dep_fn?: () => Task[],
        dep_tasks?: Task[],
        weight?: number
    };

    export function task(t: Task, cmd?: boolean) {
        if (cmd)
            commander
                .command(t.name)
                .description(t.description)
                .action(function() {
                    start(t.name, () => {
                        console.log('END')
                    });
                });
        return tasks[t.name] = t;
    }

    function start(name: string, done: DoneFunction) {
        process.nextTick(function() {
            var task = getTask(name);
            var count = count_tasks(task);
            exec_task('', task, done);
        })
    }

    function exec_task(ident: string, task: Task, done: DoneFunction) {
        console.log(ident + 'start: ' + task.name);
        var depident = ident + '  ';

        var dep_idx = 0;

        run_dep();

        function run_dep() {
            if (dep_idx >= task.dep_tasks.length) {
                after_deps();
            }
            else {
                var dep = task.dep_tasks[dep_idx];
                dep_idx++;
                process.nextTick(() => {
                    exec_task(depident, dep, run_dep);
                });
            }
        }

        function after_deps() {
            console.log(ident + 'end: ' + task.name);
            done();
        }
    }

    function getTask(name: string) {
        var task = tasks[name];
        if (!task)
            throw "Invalid task: " + name;
        return task;
    }

    function count_tasks(task: Task) {
        var count = task.weight || task.fn ? 1 : 0;
        if (!task.dep_tasks)
            task.dep_tasks = [];
        if (task.dep_fn) {
            task.dep_tasks = task.dep_tasks.concat(task.dep_fn());
        }
        if (task.dep_names)
            task.dep_names.forEach((dep) => {
                task.dep_tasks.push(getTask(dep));
            });
        task.dep_tasks.forEach((dep) => {
            count += count_tasks(dep);
        });
        return count;
    }

}
