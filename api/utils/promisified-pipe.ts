import { Readable } from 'stream'
import { WriteStream } from 'fs'

export function promisifiedPipe(input: Readable, output: WriteStream) {
    let ended = false
    function end() {
        if (!ended) {
            ended = true
            output.close && output.close()
            return true
        }
    }

    return new Promise((resolve, reject) => {
        input.pipe(output)
        input.on('error', errorEnding)

        function niceEnding() {
            if (end()) resolve(null)
        }

        function errorEnding(error: any) {
            if (end()) reject(error)
        }

        output.on('finish', niceEnding)
        output.on('end', niceEnding)
        output.on('error', errorEnding)
    })
}
