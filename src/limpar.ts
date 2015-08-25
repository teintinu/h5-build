
namespace h5build {
    export function limpar_build(): Task[] {
        var src_clean =
            fstasks.readDir({
                root: pasta_src,
                file_fn: (folder, file) => {
                    var ext = path.extname(file)
                    var n = path.join(folder, path.basename(file, ext));
                    if (ext === '.jade') {
                        return task({
                            name: null,
                            description: null,
                            dep_tasks: [
                                fstasks.rm(pasta_src, n + '.ts'),
                                fstasks.rm(pasta_src, n + '.js'),
                                fstasks.rm(pasta_src, n + '.jademap'),
                                fstasks.rm(pasta_src, n + '.tsmap'),
                                fstasks.rm(pasta_src, n + '.map')
                            ]
                        })
                    }
                    else if (ext === '.ts') {
                        return task({
                            name: null,
                            description: null,
                            dep_tasks: [
                                fstasks.rm(pasta_src, n + '.js'),
                                fstasks.rm(pasta_src, n + '.map')
                            ]
                        })
                    }
                    return null as Task;
                }
            });
        return [fstasks.rmdir(pasta_build), src_clean];
    }
}
