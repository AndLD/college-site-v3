import { Response, Router } from 'express'
import { model } from '../../model/model'
import { googleDriveService } from '../../services/googleDrive'
import { AllowedFileExtension, Error, ModelResult } from '../../utils/types'

export default Router()
    // Получение статьи по id
    .get('/:id', async (req: any, res: Response) => {
        const entity = req.entity
        const id = req.params.id

        if (!id)
            return res.status(400).json({
                error: '"id" param is missed!'
            })

        const options: {
            [key: string]: [
                AllowedFileExtension,
                AllowedFileExtension?,
                AllowedFileExtension?,
                AllowedFileExtension?
            ]
        } = JSON.parse(req.headers['download-options'])

        const filenames = await googleDriveService.downloadFiles([], options)

        if (!filenames.length) {
            res.sendStatus(500)
        }

        const [modelResult, modelError] = (await model({
            collection: entity,
            action: 'get',
            docId: id
        })) as [ModelResult | null, Error | null]

        if (modelError)
            return res.status(modelError.code || 500).json({
                error: modelError.msg
            })

        if (!modelResult?.mainResult)
            return res.status(500).json({
                error: 'Article info was not found in DB!'
            })

        const publicArticleMetadata = {
            id: modelResult.mainResult.id,
            oldId: modelResult.mainResult.oldId,
            title: modelResult.mainResult.title,
            description: modelResult.mainResult.description,
            tags: modelResult.mainResult.tags,
            timestamp: modelResult.mainResult.publicTimestamp,
            data: modelResult.mainResult.data
        }

        res.set('article-metadata', encodeURI(JSON.stringify(publicArticleMetadata)))
        res.set('Access-Control-Expose-Headers', 'Content-Disposition')

        res.download(filenames[0].path)
    })