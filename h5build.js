var h5build;
(function (h5build) {
    function build_jade() {
        process.chdir(h5build.pasta_src);
        return h5build.fsTask.readDir({
            root: h5build.pasta_src,
            file_fn: function (folder, file) {
                if (!/\.jade$/.test(file))
                    return null;
                var jadesrc = folder + file;
                var tssrc = jadesrc.replace(/\.jade$/, '.ts');
                var jademap = tssrc.replace(/\.ts$/, '.jademap');
                return jade2ts(jadesrc, tssrc, jademap);
            }
        });
    }
    h5build.build_jade = build_jade;
    function jade2ts(jadesrc, tssrc, jademap) {
        return h5build.task({
            name: 'jade2ts ' + jadesrc,
            description: "Transform " + jadesrc + " into typescript",
            fn: function (done) {
                var src = fs.readFileSync(jadesrc, 'utf-8');
                var gen = jaect.compileComponent(src, {
                    sourceFileName: jadesrc,
                    sourceContent: src
                });
                fs.writeFileSync(tssrc, gen.code, 'utf8');
                fs.writeFileSync(jademap, gen.map, 'utf8');
                done();
            }
        });
    }
    h5build.jade2ts = jade2ts;
})(h5build || (h5build = {}));
var h5build;
(function (h5build) {
    function build_ts() {
        var files = [];
        return h5build.fsTask.readDir({
            root: h5build.pasta_src,
            file_fn: function (folder, file) {
                if (/\.ts$/.test(file))
                    files.push(folder + file);
                return null;
            },
            folder_end_fn: function (folder) {
                if (folder == '') {
                    return tsc("build-ts " + h5build.pasta_src, "Compiler " + h5build.pasta_src + "/*.ts in *.js", files);
                }
            }
        });
    }
    h5build.build_ts = build_ts;
    function tsc(name, description, files) {
        return h5build.task({
            name: name, description: description,
            fn: function (done) {
                var program = ts.createProgram([
                    __dirname + '/typings/node/node.d.ts',
                    __dirname + '/typings/react/react.d.ts',
                    __dirname + '/typings/bluebird/bluebird.d.ts'
                ].concat(files), {
                    mapfile: true,
                    module: ts.ModuleKind.CommonJS,
                    experimentalAsyncFunctions: true,
                    declaration: true,
                    noEmitOnError: true,
                    noImplicitAny: true,
                    target: ts.ScriptTarget.ES5
                });
                var emitResult = program.emit();
                var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
                allDiagnostics.forEach(function (diagnostic) {
                    var _a = diagnostic.file ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : { line: 0, character: 0 }, line = _a.line, character = _a.character;
                    var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    throw new Error((diagnostic.file ? diagnostic.file.fileName : '?') + " (" + (line + 1) + "," + (character + 1) + "): " + message);
                });
                var exitCode = emitResult.emitSkipped ? 1 : 0;
                done();
            }
        });
    }
    h5build.tsc = tsc;
})(h5build || (h5build = {}));
var h5build;
(function (h5build) {
    var fsTask;
    (function (fsTask) {
        function readDir(info) {
            if (!fs.existsSync(info.root)) {
                if (info.folder_not_exists_fn)
                    return info.folder_not_exists_fn(info.root);
                return null;
            }
            return task_for_files('');
            function task_for_files(folder) {
                var task_start = info.folder_start_fn && info.folder_start_fn(folder);
                var task_files = fs.readdirSync(path.join(info.root, folder))
                    .map(function (file) {
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
                    return null;
                });
                task_files = task_files.filter(function (task) { return !!task; });
                var task_end = info.folder_end_fn && info.folder_end_fn(folder);
                if (!task_end) {
                    if (task_files.length)
                        task_end = h5build.task({ name: null, description: null });
                    else
                        return task_start;
                }
                if (!task_end.dep_tasks)
                    task_end.dep_tasks = [];
                if (task_start)
                    task_end.dep_tasks.push(task_start);
                task_end.dep_tasks = task_end.dep_tasks.
                    concat(task_files);
                return task_end;
            }
        }
        fsTask.readDir = readDir;
        function rmdir(root) {
            return readDir({
                root: root,
                file_fn: function (folder, file) { return rm(root, path.join(folder, file)); },
                folder_start_fn: function (folder) { return null; },
                folder_end_fn: function (folder) { return h5build.task({
                    name: 'rmdir ' + folder,
                    description: "Remove directory tree " + folder,
                    fn: function (done) {
                        fs.rmdirSync(path.join(root, folder));
                        done();
                    }
                }); }
            });
        }
        fsTask.rmdir = rmdir;
        function rm(root, file) {
            var fullname = path.join(root, file);
            if (fs.existsSync(fullname)) {
                return h5build.task({
                    name: 'rm ' + fullname,
                    description: "Remove file " + fullname,
                    fn: function (done) {
                        fs.unlink(fullname, done);
                    }
                });
            }
            return null;
        }
        fsTask.rm = rm;
    })(fsTask = h5build.fsTask || (h5build.fsTask = {}));
})(h5build || (h5build = {}));
var h5build;
(function (h5build) {
    function limpar_build() {
        var src_clean = h5build.fsTask.readDir({
            root: h5build.pasta_src,
            file_fn: function (folder, file) {
                var ext = path.extname(file);
                var n = path.join(folder, path.basename(file, ext));
                if (ext === '.jade') {
                    return h5build.tasks(h5build.fsTask.rm(h5build.pasta_src, n + '.ts'), h5build.fsTask.rm(h5build.pasta_src, n + '.d.ts'), h5build.fsTask.rm(h5build.pasta_src, n + '.js'), h5build.fsTask.rm(h5build.pasta_src, n + '.jademap'), h5build.fsTask.rm(h5build.pasta_src, n + '.tsmap'), h5build.fsTask.rm(h5build.pasta_src, n + '.map'));
                }
                else if (ext === '.ts') {
                    return h5build.tasks(h5build.fsTask.rm(h5build.pasta_src, n + '.d.ts'), h5build.fsTask.rm(h5build.pasta_src, n + '.js'), h5build.fsTask.rm(h5build.pasta_src, n + '.map'));
                }
                return null;
            }
        });
        return [h5build.fsTask.rmdir(h5build.pasta_build), src_clean];
    }
    h5build.limpar_build = limpar_build;
})(h5build || (h5build = {}));
var h5build;
(function (h5build) {
    function lista_arquivos(raiz, callback, subpasta) {
        if (subpasta === void 0) { subpasta = ''; }
        fs.readdirSync(path.join(raiz, subpasta)).forEach(function (file) {
            var stat = fs.statSync(path.join(raiz, subpasta, file));
            if (stat.isFile())
                callback(raiz, subpasta, file);
            if (stat.isDirectory())
                lista_arquivos(raiz, callback, path.join(subpasta, file) + '/');
        });
    }
    h5build.lista_arquivos = lista_arquivos;
})(h5build || (h5build = {}));
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var jaect = require('jaect');
var ts = require("typescript");
var commander = require("commander");
var success = false;
var h5build;
(function (h5build) {
    var named_tasks = {};
    h5build.pasta_src = process.cwd() + '/src';
    h5build.pasta_build = process.cwd() + '/build';
    commander
        .version(require(__dirname + '/package.json').version)
        .option('-v, --verbose', 'Verbose mode');
    task({
        name: 'clear',
        description: "Remove builded files",
        dep_fn: h5build.limpar_build
    }, true);
    task({
        name: 'build-jade',
        description: "Transform jade files into typescript files",
        dep_names: ['clear'],
        dep_fn: h5build.build_jade
    }, true);
    task({
        name: 'build-ts',
        description: "Transform ts files into javacript files",
        dep_names: ['build-jade'],
        fn: h5build.build_ts
    }, true);
    task({
        name: 'default',
        description: "default task",
        dep_names: ['clear']
    }, true);
    commander
        .command('*')
        .description('clear/build/test/coverage/lint/deploy')
        .action(function () {
        start('default', function () {
            console.log("Success!");
            success = true;
        });
    });
    commander.parse(process.argv);
    ;
    function task(t, cmd) {
        if (cmd)
            commander
                .command(t.name)
                .description(t.description)
                .action(function () {
                start(t.name, function () {
                    console.log('Success');
                    success = true;
                });
            });
        return named_tasks[t.name] = t;
    }
    h5build.task = task;
    function tasks() {
        var list = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            list[_i - 0] = arguments[_i];
        }
        if (list) {
            list = list.filter(function (t) { return t != null; });
            if (list.length) {
                return task({
                    name: null,
                    description: null,
                    dep_tasks: list
                });
            }
        }
        return null;
    }
    h5build.tasks = tasks;
    function start(name, done) {
        process.nextTick(function () {
            var task = getTask(name);
            var count = count_tasks(task);
            exec_task('', task, done);
        });
    }
    function exec_task(ident, task, done) {
        if (task.state === 1)
            throw new Error("Circular reference");
        if (task.state === 2)
            done();
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
                process.nextTick(function () {
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
                var subtask = task.fn(task_finish);
                if (subtask) {
                    exec_task(depident, subtask, task_finish);
                }
            }
            else
                task_finish();
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
    function getTask(name) {
        var task = named_tasks[name];
        if (!task)
            throw "Invalid task: " + name;
        return task;
    }
    function count_tasks(task) {
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
            task.dep_tasks = task.dep_names.map(function (dep) {
                return getTask(dep);
            }).concat(task.dep_tasks);
        }
        task.dep_tasks.forEach(function (dep) {
            if (dep) {
                count += count_tasks(dep);
            }
        });
        return count;
    }
})(h5build || (h5build = {}));
process.on('exit', function (code) {
    if (!success)
        console.log('ANORMAL EXIT');
});
//# sourceMappingURL=h5build.js.map