import {pasta_src, pasta_build} from "./main";
import {Task, tasks} from "./task";
import * as fsTask from "./fstasks";
import * as path from 'path';

export function limpar_build(): Task[] {
    var src_clean =
        fsTask.readDir({
            root: pasta_src,
            file_fn: (folder, file) => {
                var ext = path.extname(file)
                var n = path.join(folder, path.basename(file, ext));
                if (ext === '.jade') {
                    return tasks(
                        fsTask.rm(pasta_src, n + '.ts'),
                        fsTask.rm(pasta_src, n + '.d.ts'),
                        fsTask.rm(pasta_src, n + '.js'),
                        fsTask.rm(pasta_src, n + '.jademap'),
                        fsTask.rm(pasta_src, n + '.tsmap'),
                        fsTask.rm(pasta_src, n + '.map')
                    )
                }
                else if (ext === '.ts') {
                    return tasks(
                        fsTask.rm(pasta_src, n + '.d.ts'),
                        fsTask.rm(pasta_src, n + '.js'),
                        fsTask.rm(pasta_src, n + '.map')
                    )
                }
                return null as Task;
            }
        });
    return [fsTask.rmdir(pasta_build), src_clean];
}
