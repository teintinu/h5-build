
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var jaect = require('jaect');
var ts = require("typescript");
var commander = require("commander");
var success = false;

namespace h5build {

    var named_tasks: { [name: string]: Task } = {}
    export var pasta_src = process.cwd() + '/src'
    export var pasta_build = process.cwd() + '/build';

    commander
        .version(require(__dirname + '/package.json').version)
        .option('-v, --verbose', 'Verbose mode')

    task({
        name: 'clear',
        description: "Remove builded files",
        dep_fn: limpar_build
    }, true);

    task({
        name: 'build-jade',
        description: "Transform jade files into typescript files",
        dep_names: ['clear'],
        dep_fn: build_jade
    }, true);

    task({
        name: 'build-ts',
        description: "Transform ts files into javacript files",
        dep_names: ['build-jade'],
        fn: build_ts
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
                console.log("Success!");
                success = true;
            });
        });

    commander.parse(process.argv);

    export type TaskFunction = (done: DoneFunction) => void|Task;
    export type DoneFunction = () => void;

    export interface Task {
        name: string,
        description: string,
        fn?: TaskFunction,
        dep_names?: string[],
        dep_fn?: () => Task|Task[],
        dep_tasks?: Task[],
        weight?: number,
        state?: number
    };

    export function task(t: Task, cmd?: boolean) {
        if (cmd)
            commander
                .command(t.name)
                .description(t.description)
                .action(function() {
                    start(t.name, () => {
                        console.log('Success')
                        success = true;
                    });
                });
        return named_tasks[t.name] = t;
    }

    export function tasks(...list: Task[]) {
        if (list) {
            list = list.filter(t=> t != null);
            if (list.length) {
                return task({
                    name: null,
                    description: null,
                    dep_tasks: list
                })
            }
        }
        return null
    }

    function start(name: string, done: DoneFunction) {
        process.nextTick(function() {
            var task = getTask(name);
            var count = count_tasks(task);
            exec_task('', task, done);
        })
    }

    function exec_task(ident: string, task: Task, done: DoneFunction) {
        if (task.state === 1) throw new Error("Circular reference");
        if (task.state === 2) done();
        task.state = 1;
        if (commander.verbose)
            console.log(ident + 'start: ' + task.description);
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
                    if (dep == null) {
                        run_dep();
                    }
                    else {
                        exec_task(depident, dep, run_dep);
                    }
                });
            }
        }

        function after_deps() {
            if (task.fn) {
                var subtask: Task = task.fn(task_finish) as Task;
                if (subtask) {
                    exec_task(depident, subtask, task_finish)
                }
            }
            else task_finish();
        }

        function task_finish() {
            if (task.state === 2)
                throw new Error("task was fnished");
            if (commander.verbose)
                console.log(ident + 'end: ' + task.description);
            task.state = 2;
            done();
        }
    }

    function getTask(name: string) {
        var task = named_tasks[name];
        if (!task)
            throw "Invalid task: " + name;
        return task;
    }

    function count_tasks(task: Task) {
        var count = task.weight || task.fn ? 1 : 0;
        if (!task.dep_tasks)
            task.dep_tasks = [];
        if (task.dep_fn) {
            var deps = task.dep_fn();
            if (Array.isArray(deps))
                task.dep_tasks = task.dep_tasks.concat(deps);
            else
                task.dep_tasks.push(deps);
        }
        if (task.dep_names) {
            task.dep_tasks = task.dep_names.map((dep) => {
                return getTask(dep);
            }).concat(task.dep_tasks);
        }
        task.dep_tasks.forEach((dep) => {
            if (dep) {
                count += count_tasks(dep);
            }
        });
        return count;
    }

}

process.on('exit', function(code: number) {
    if (!success)
        console.log('ANORMAL EXIT');
});
