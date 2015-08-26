import * as fs from 'fs';
import * as path from 'path';

import {Task, task} from "./task";

export function readDir(
    info: {
        root: string,
        file_fn?: (folder: string, file: string) => Task,
        folder_start_fn?: (folder: string) => Task,
        folder_end_fn?: (folder: string) => Task,
        folder_not_exists_fn?: (folder: string) => Task
    }
): Task {

    if (!fs.existsSync(info.root)) {
        if (info.folder_not_exists_fn)
            return info.folder_not_exists_fn(info.root);
        return null;
    }
    return task_for_files('');

    function task_for_files(folder: string): Task {
        var task_start = info.folder_start_fn && info.folder_start_fn(folder);

        var task_files: Task[] = fs.readdirSync(path.join(info.root, folder))
            .map((file: string) => {
                var stat = fs.statSync(path.join(info.root, folder, file));
                if (stat.isFile()) {
                    var task_file = info.file_fn(folder, file);
                    if (task_start)
                        task_start.dep_tasks.push(task_file);
                    return task_file;
                }
                else if (stat.isDirectory()) {
                    return task_for_files(path.join(folder, file));
                }
                return (null as Task);
            });
        task_files = task_files.filter(task=> !!task)
        var task_end = info.folder_end_fn && info.folder_end_fn(folder);
        if (!task_end) {
            if (task_files.length) task_end = task({ name: null, description: null });
            else return task_start;
        }
        if (!task_end.dep_tasks) task_end.dep_tasks = [];
        if (task_start)
            task_end.dep_tasks.push(task_start);
        task_end.dep_tasks = task_end.dep_tasks.
            concat(task_files);
        return task_end;
    }
}

export function rmdir(root: string): Task {
    return readDir({
        root,
        file_fn: (folder: string, file: string) => rm(root, path.join(folder, file)),        
        folder_end_fn: (folder) => task({
            name: 'rmdir ' + folder,
            description: "Remove directory tree " + folder,
            fn: (done) => {
                fs.rmdirSync(path.join(root, folder));
                done();
            }
        })
    })
}

export function rm(root: string, file: string): Task {
    var fullname = path.join(root, file);
    if (fs.existsSync(fullname)) {
        return task({
            name: 'rm ' + fullname,
            description: "Remove file " + fullname,
            fn: (done) => {
                fs.unlink(fullname, done);
            }
        });
    }
    return null as Task;
}
