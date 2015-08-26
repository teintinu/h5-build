import * as fs from 'fs';
import * as ts from "typescript";
import {pasta_src} from "./main";
import {task} from "./task";
import * as fsTask from "./fstasks";

export function build_ts() {
    var files: string[] = [];
    return fsTask.readDir({
        root: pasta_src,
        file_fn: (folder: string, file: string) => {
            if (/\.ts$/.test(file)) {
                files.push(folder + file);
            }
            return null;
        },
        folder_end_fn: function(folder) {
            if (folder == '') {
                return tsc(pasta_src, files)
            }
        }
    });
}

export function tsc(project: string, files: string[]) {

    return task({
        name: "tsc -p " + project,
        description: "Compiles typescript from " + project + " into javascript",
        weight: 10,
        fn: (done) => {
            var tsconfig = {
                "compilerOptions": {
                    sourceMap: true,
                    module: "commonjs",
                    //experimentalAsyncFunctions: true,
                    declaration: true,
                    noEmitOnError: true,
                    noImplicitAny: true,
                    target: "es5"
                }, files: [
                    __dirname + '/typings/node/node.d.ts',
                    __dirname + '/typings/react/react.d.ts',
                    __dirname + '/typings/bluebird/bluebird.d.ts',
                    __dirname + '/node_modules/h5-flux/lib/h5flux.d.ts'
                ].concat(files)
            };
            fs.writeFileSync(project + '/tsconfig.json', JSON.stringify(tsconfig, null, 2));

            var program = ts.createProgram([], { project: project });

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
