namespace h5build {

    export function build_ts() {
        var files: string[] = [];
        return fsTask.readDir({
            root: pasta_src,
            file_fn: (folder: string, file: string) => {
                if (/\.ts$/.test(file))
                    files.push(folder + file);
                return null;
            },
            folder_end_fn: function(folder) {
                if (folder == '') {
                    return tsc("build-ts " + pasta_src, "Compiler " + pasta_src + "/*.ts in *.js", files)
                }
            }
        });
    }

    export function tsc(name: string, description: string, files: string[]) {

        return task({
            name, description,
            fn: (done) => {
                var program = ts.createProgram(
                    [
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

                allDiagnostics.forEach((diagnostic: any) => {
                    var { line, character } = diagnostic.file ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : { line: 0, character: 0 };
                    var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    throw new Error(`${diagnostic.file ? diagnostic.file.fileName : '?'} (${line + 1},${character + 1}): ${message}`);
                });

                var exitCode = emitResult.emitSkipped ? 1 : 0;
                done();
            }
        });
    }
}
