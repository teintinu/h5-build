
namespace h5build {

    export function build_jade() {
        process.chdir(pasta_src);

        return fsTask.readDir(
            {
                root: pasta_src,
                file_fn: (folder: string, file: string) => {
                    if (!/\.jade$/.test(file)) return null;

                    var jadesrc = folder + file;
                    var tssrc = jadesrc.replace(/\.jade$/, '.ts');
                    var jademap = tssrc.replace(/\.ts$/, '.jademap');

                    return jade2ts(jadesrc, tssrc, jademap);
                }
            }
        );

        // lista_arquivos('.', function(raiz: string, subpasta: string, arquivo: string) {
        //     if (/\.jade$/.test(arquivo)) {
        //
        //         mkdirp.sync(pasta_build + subpasta);
        //         var jadesrc = subpasta + arquivo;
        //         var tssrc = subpasta + arquivo.replace(/\.jade$/, '.ts');
        //         var jssrc = subpasta + arquivo.replace(/\.jade$/, '.js');
        //         var jademap = tssrc.replace(/\.ts$/, '.jademap');
        //         var tsmap = tssrc.replace(/\.ts$/, '.tsmap');
        //         var jsmap = tssrc.replace(/\.ts$/, '.map');
        //
        //         jade2ts(jadesrc, tssrc, jademap);
        //
        //         tsc(tssrc, jssrc, tsmap);
        //         //repaear tsmap usando jademap para map
        //
        //         //fs.unlink(tssrc);
        //         //fs.unlink(jademap);
        //         //fs.unlink(tsmap);
        //     }
        // });
        // return [null as Task]
    }

    export function jade2ts(jadesrc: string, tssrc: string, jademap: string) {

        return task({
            name: 'jade2ts ' + jadesrc,
            description: "Transform " + jadesrc + " into typescript",
            fn: function(done) {
                var src = fs.readFileSync(jadesrc, 'utf-8')

                var gen = jaect.compileComponent(src, {
                    sourceFileName: jadesrc,
                    sourceContent: src
                })

                fs.writeFileSync(tssrc, gen.code, 'utf8')
                fs.writeFileSync(jademap, gen.map, 'utf8')
                done();
            }
        })
    }
}
