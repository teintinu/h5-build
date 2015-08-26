
import {args, charm, success} from "./main";

var named_tasks: { [name: string]: Task } = {};

export type TaskFunction = (done: DoneFunction) => void|Task;
export type TaskState = { [name: string]: number };
export type DoneFunction = () => void;

export interface Task {
    name: string,
    description: string,
    fn?: TaskFunction,
    dep_names?: string[],
    dep_fn?: () => Task|Task[],
    dep_tasks?: Task[],
    weight?: number,
};

export function task(t: Task) {
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

export function start(name: string, done: DoneFunction) {
    process.nextTick(function() {
        var task_state: TaskState = {}
        var task = getTask(name);
        var count = count_tasks(task);
        exec_task(task_state, '', task, done);
    })
}

function exec_task(state: TaskState, ident: string, task: Task, done: DoneFunction) {
    if (task.name) {
        if (state[task.name] === 1) throw new Error("Circular reference " + task.name);
        if (state[task.name] === 2) return done();
        state[task.name] = 1;
    }
    if (args.verbose) {
        charm.display('dim');
        charm.write(ident + (task.description?task.description:'-'));
        charm.write('\n');
        charm.display('reset')
    }
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
                    exec_task(state, depident, dep, run_dep);
                }
            });
        }
    }

    function after_deps() {
        if (task.fn) {
            var subtask: Task = task.fn(task_finish) as Task;
            if (subtask) {
                exec_task(state, depident, subtask, task_finish)
            }
        }
        else task_finish();
    }

    function task_finish() {
        if (task.name && state[task.name] === 2)
            throw new Error("task was fnished");
        // if ((commander as any).verbose) {
        //     charm.display('dim');
        //     charm.write(ident + 'end: ' + task.description);
        //     charm.write('\n');
        //     charm.display('reset')
        // }
        if (task.name)
            state[task.name] = 2;
        done();
    }
}

export function getTask(name: string) {
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
