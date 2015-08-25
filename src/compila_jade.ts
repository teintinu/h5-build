
namespace h5build {

    var todos_ts: string[] = [];

    export function compila_jades() {
        process.chdir(pasta_src);

        lista_arquivos('.', function(raiz: string, subpasta: string, arquivo: string) {
          if (/\.ts$/.test(arquivo)) {
            todos_ts.push(subpasta+arquivo);
          }});

        lista_arquivos('.', function(raiz: string, subpasta: string, arquivo: string) {
            if (/\.jade$/.test(arquivo)) {

                mkdirp.sync(pasta_build + subpasta);
                var jadesrc = subpasta + arquivo;
                var tssrc = subpasta + arquivo.replace(/\.jade$/, '.ts');
                var jssrc = subpasta + arquivo.replace(/\.jade$/, '.js');
                var jademap = tssrc.replace(/\.ts$/, '.jademap');
                var tsmap = tssrc.replace(/\.ts$/, '.tsmap');
                var jsmap = tssrc.replace(/\.ts$/, '.map');

                jade2ts(jadesrc, tssrc, jademap);

                tsc(tssrc, jssrc, tsmap);
                //repaear tsmap usando jademap para map

                //fs.unlink(tssrc);
                //fs.unlink(jademap);
                //fs.unlink(tsmap);
            }
        });
        return [null as Task]
    }

    export function jade2ts(jadesrc: string, tssrc: string, jademap: string) {

        console.log('Compilando: ' + jadesrc);
        var src = fs.readFileSync(jadesrc, 'utf-8')

        var gen = jaect.compileComponent(src, {
            sourceFileName: jadesrc,
            sourceContent: src
        })

        fs.writeFileSync(tssrc, gen.code, 'utf8')
        fs.writeFileSync(jademap, gen.map, 'utf8')

    }

    export function tsc(tssrc: string, jssrc: string, tsmap: string) {

        var program = ts.createProgram(
           [ tssrc,
             __dirname+'/typings/node/node.d.ts',
             __dirname+'/typings/react/react.d.ts',
             __dirname+'/typings/bluebird/bluebird.d.ts'
           ].concat(todos_ts), {
          //  out: jssrc,
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
            var { line, character } =diagnostic.file? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start):{line:0,character:0};
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(`${diagnostic.file?diagnostic.file.fileName:'?'} (${line + 1},${character + 1}): ${message}`);
        });

        var exitCode = emitResult.emitSkipped ? 1 : 0;
        console.log(`Process exiting with code '${exitCode}'.`);

    }
}
