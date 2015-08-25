
namespace h5build {
    export function lista_arquivos(raiz: string, callback: (raiz: string, subpasta: string, arquivo: string) => void, subpasta: string = '') {
        fs.readdirSync(path.join(raiz, subpasta)).forEach((file: string) => {
            var stat = fs.statSync(path.join(raiz,subpasta,file));
            if (stat.isFile())
                callback(raiz, subpasta, file);
            if (stat.isDirectory())
                lista_arquivos(raiz, callback, path.join(subpasta, file)+'/')
        })
    }
}
