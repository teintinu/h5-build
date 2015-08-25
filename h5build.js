var h5build;
(function (h5build) {
    var todos_ts = [];
    function compila_jades() {
        process.chdir(h5build.pasta_src);
        h5build.lista_arquivos('.', function (raiz, subpasta, arquivo) {
            if (/\.ts$/.test(arquivo)) {
                todos_ts.push(subpasta + arquivo);
            }
        });
        h5build.lista_arquivos('.', function (raiz, subpasta, arquivo) {
            if (/\.jade$/.test(arquivo)) {
                mkdirp.sync(h5build.pasta_build + subpasta);
                var jadesrc = subpasta + arquivo;
                var tssrc = subpasta + arquivo.replace(/\.jade$/, '.ts');
                var jssrc = subpasta + arquivo.replace(/\.jade$/, '.js');
                var jademap = tssrc.replace(/\.ts$/, '.jademap');
                var tsmap = tssrc.replace(/\.ts$/, '.tsmap');
                var jsmap = tssrc.replace(/\.ts$/, '.map');
                jade2ts(jadesrc, tssrc, jademap);
                tsc(tssrc, jssrc, tsmap);
            }
        });
        return [null];
    }
    h5build.compila_jades = compila_jades;
    function jade2ts(jadesrc, tssrc, jademap) {
        console.log('Compilando: ' + jadesrc);
        var src = fs.readFileSync(jadesrc, 'utf-8');
        var gen = jaect.compileComponent(src, {
            sourceFileName: jadesrc,
            sourceContent: src
        });
        fs.writeFileSync(tssrc, gen.code, 'utf8');
        fs.writeFileSync(jademap, gen.map, 'utf8');
    }
    h5build.jade2ts = jade2ts;
    function tsc(tssrc, jssrc, tsmap) {
        var program = ts.createProgram([tssrc,
            __dirname + '/typings/node/node.d.ts',
            __dirname + '/typings/react/react.d.ts',
            __dirname + '/typings/bluebird/bluebird.d.ts'
        ].concat(todos_ts), {
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
            console.log((diagnostic.file ? diagnostic.file.fileName : '?') + " (" + (line + 1) + "," + (character + 1) + "): " + message);
        });
        var exitCode = emitResult.emitSkipped ? 1 : 0;
        console.log("Process exiting with code '" + exitCode + "'.");
    }
    h5build.tsc = tsc;
})(h5build || (h5build = {}));
var h5build;
(function (h5build) {
    var fstasks;
    (function (fstasks) {
        function readDir(info) {
            if (!fs.existsSync(info.root)) {
                if (info.folder_not_exists_fn)
                    return info.folder_not_exists_fn(info.root);
                return h5build.task({ name: null, description: null });
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
                var task_end = info.folder_end_fn && info.folder_end_fn(folder);
                if (!task_end)
                    task_end = h5build.task({ name: null, description: null });
                if (!task_end.dep_tasks)
                    task_end.dep_tasks = [];
                task_end.dep_tasks = task_end.dep_tasks.
                    concat(task_files.filter(function (task) { return !!task; }));
                return task_end;
            }
        }
        fstasks.readDir = readDir;
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
        fstasks.rmdir = rmdir;
        function rm(root, file) {
            return h5build.task({
                name: 'rm ' + file,
                description: "Remove file " + file,
                fn: function (done) {
                    fs.rmSync(path.join(root, file));
                    done();
                }
            });
        }
        fstasks.rm = rm;
    })(fstasks = h5build.fstasks || (h5build.fstasks = {}));
})(h5build || (h5build = {}));
var h5build;
(function (h5build) {
    function limpar_build() {
        var src_clean = h5build.fstasks.readDir({
            root: h5build.pasta_src,
            file_fn: function (folder, file) {
                var ext = path.extname(file);
                var n = path.join(folder, path.basename(file, ext));
                if (ext === '.jade') {
                    return h5build.task({
                        name: null,
                        description: null,
                        dep_tasks: [
                            h5build.fstasks.rm(h5build.pasta_src, n + '.ts'),
                            h5build.fstasks.rm(h5build.pasta_src, n + '.js'),
                            h5build.fstasks.rm(h5build.pasta_src, n + '.jademap'),
                            h5build.fstasks.rm(h5build.pasta_src, n + '.tsmap'),
                            h5build.fstasks.rm(h5build.pasta_src, n + '.map')
                        ]
                    });
                }
                else if (ext === '.ts') {
                    return h5build.task({
                        name: null,
                        description: null,
                        dep_tasks: [
                            h5build.fstasks.rm(h5build.pasta_src, n + '.js'),
                            h5build.fstasks.rm(h5build.pasta_src, n + '.map')
                        ]
                    });
                }
                return null;
            }
        });
        return [h5build.fstasks.rmdir(h5build.pasta_build), src_clean];
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
var h5build;
(function (h5build) {
    var tasks = {};
    h5build.pasta_src = process.cwd() + '/src';
    h5build.pasta_build = process.cwd() + '/build';
    commander
        .version(require(__dirname + '/package.json').version);
    task({
        name: 'clear',
        description: "Remove builded files",
        dep_fn: h5build.limpar_build
    }, true);
    task({
        name: 'build',
        description: "Build files",
        dep_names: ['clear'],
        dep_fn: h5build.compila_jades
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
            console.log("END");
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
                    console.log('END');
                });
            });
        return tasks[t.name] = t;
    }
    h5build.task = task;
    function start(name, done) {
        process.nextTick(function () {
            var task = getTask(name);
            var count = count_tasks(task);
            exec_task('', task, done);
        });
    }
    function exec_task(ident, task, done) {
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
                process.nextTick(function () {
                    exec_task(depident, dep, run_dep);
                });
            }
        }
        function after_deps() {
            console.log(ident + 'end: ' + task.name);
            done();
        }
    }
    function getTask(name) {
        var task = tasks[name];
        if (!task)
            throw "Invalid task: " + name;
        return task;
    }
    function count_tasks(task) {
        var count = task.weight || task.fn ? 1 : 0;
        if (!task.dep_tasks)
            task.dep_tasks = [];
        if (task.dep_fn) {
            task.dep_tasks = task.dep_tasks.concat(task.dep_fn());
        }
        if (task.dep_names)
            task.dep_names.forEach(function (dep) {
                task.dep_tasks.push(getTask(dep));
            });
        task.dep_tasks.forEach(function (dep) {
            count += count_tasks(dep);
        });
        return count;
    }
})(h5build || (h5build = {}));
//# sourceMappingURL=h5build.js.map