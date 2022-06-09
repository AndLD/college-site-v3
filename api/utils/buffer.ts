import { Options } from './types'

function substractOptions(options: Options, bufferOptions: Options) {
    const substractedOptions: Options = {}

    for (const optionsFilename in options) {
        for (const optionsExtension of options[optionsFilename])
            if (!bufferOptions[optionsFilename].includes(optionsExtension)) {
                if (substractedOptions[optionsFilename]) {
                    substractedOptions[optionsFilename].push(optionsExtension)
                } else {
                    substractedOptions[optionsFilename] = [optionsExtension]
                }
            }
    }

    return substractedOptions
}

export const bufferUtils = {
    substractOptions
}
