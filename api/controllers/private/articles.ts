import { Response } from 'express'
import JSZip from 'jszip'
import { actionsService } from '../../services/actions'
import { appSettingsService } from '../../services/app-settings'
import { articlesService } from '../../services/articles'
import { bufferFolderPath, bufferService } from '../../services/buffer'
import { googleDriveService } from '../../services/google-drive'
import { jobsService } from '../../services/jobs'
import { bufferUtils } from '../../utils/buffer'
import { articlesAllowedFileTypes } from '../../utils/constants'
import { getAllCompatibleInputForString } from '../../utils/keywords'
import {
    ArticleData,
    IArticle,
    IArticlePost,
    IArticlePut,
    IArticleUpdate
} from '../../utils/interfaces/articles/articles'
import { jobsUtils } from '../../utils/jobs'
import { getLogger } from '../../utils/logger'
import {
    ArticleFileData,
    ArticlesAllowedFileExtension,
    ArticlesAllowedFileType,
    IAction,
    IRequestFile,
    Options
} from '../../utils/types'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { tryCatch } from '../../utils/decorators'
import { getDocumentId } from '../../model/model'

const logger = getLogger('controller/private/articles')

function _processArticleFile(file: IRequestFile): ArticleFileData {
    const nameSplittedByDot = file.originalname.split('.')
    const ext = nameSplittedByDot[nameSplittedByDot.length - 1]

    if (!ext) {
        throw new Error('No file extension!')
    }

    if (!Object.keys(articlesAllowedFileTypes).includes(ext)) {
        throw new Error('Bad file extension!')
    }

    return {
        ext,
        mimetype: articlesAllowedFileTypes[
            ext as ArticlesAllowedFileExtension
        ] as ArticlesAllowedFileType,
        body: file.buffer,
        size: file.size
    }
}

async function getDownloadArticles(req: any, res: Response) {
    res.set('Access-Control-Expose-Headers', 'Content-Disposition')

    let ids = req.query.ids && req.query.ids.split(',')

    if (!ids)
        return res.status(400).json({
            error: '"ids" query param is missed!'
        })

    let options: Options | undefined =
        req.headers['download-options'] && JSON.parse(req.headers['download-options'])

    ;[ids, options] = (await articlesService.replaceOldIds(ids, options)) as [string[], Options]

    const bufferOptions =
        (options && bufferService.getBufferAvailableOptions('articles', ids, options)) || undefined

    const substractedOptions =
        (options && bufferOptions && bufferUtils.substractOptions(options, bufferOptions)) ||
        undefined

    const filenames: {
        path: string
        name: string
    }[] = []

    for (const id in bufferOptions) {
        for (const bufferOption of bufferOptions[id]) {
            const filename = `${id}.${bufferOption}`

            if (substractedOptions && !substractedOptions[id]?.includes(bufferOption)) {
                bufferService.recordDownload({ name: filename })
            }

            filenames.push({
                path: `${bufferFolderPath}/${filename}`,
                name: filename
            })
        }
    }

    if (substractedOptions && Object.keys(substractedOptions).length) {
        const downloadedFilenames = await googleDriveService.downloadFiles(
            ids,
            'articles',
            substractedOptions
        )

        if (!downloadedFilenames.length) {
            return res.sendStatus(404)
        }

        filenames.push(...downloadedFilenames)
    }

    // If we have single file we send it to download
    if (filenames.length === 1) {
        return res.download(filenames[0].path)
    } else if (filenames.length === 0) {
        return res.sendStatus(404)
    }

    // Else we create an archive, fill it with our files and send to download
    const zip = new JSZip()

    for (const filename of filenames) {
        zip.file(filename.name, fs.readFileSync(filename.path))
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipName = `${uuidv4()}.zip`

    bufferService.addFile(zipName, zipBuffer)

    res.download(`${bufferFolderPath}/${zipName}`, (err) => {
        if (err) {
            logger.error('Error sending file: ', err)
        }

        bufferService.deleteFile(zipName)
    })
}

async function postArticle(req: any, res: Response) {
    const user = {
        email: req.user.email,
        status: req.user._doc.status
    }

    const jobId = req.isSimulation
        ? null
        : jobsService.add(
              user.email,
              jobsUtils.templates.articles.post.title,
              jobsUtils.templates.articles.post.steps
          )

    const timestamp = Date.now()

    const body: IArticlePost = JSON.parse(req.body.json)

    jobId && jobsService.nextStep(jobId)

    if (!req.isSimulation && body.oldId) {
        // TODO: Rename the variable :)
        const sameOldIdArticleIds = await articlesService.checkOldIdUsage(body.oldId)
        if (sameOldIdArticleIds.length) {
            jobId && jobsService.error(jobId)
            return res.status(400).json({
                error: `"oldId" is used by articles [${sameOldIdArticleIds.join(', ')}]`
            })
        }
    }

    jobId && jobsService.nextStep(jobId)

    try {
        var file = req.file && _processArticleFile(req.file)

        if (!file) {
            throw new Error('File missed')
        }
    } catch (e: any) {
        jobId && jobsService.error(jobId)
        logger.error(e)
        return res.status(400).json({
            error: e.toString()
        })
    }

    jobId && jobsService.nextStep(jobId)

    const data: ArticleData = {}
    data[file.ext as ArticlesAllowedFileExtension] = true
    if (file.mimetype === articlesAllowedFileTypes.docx) {
        data.html = true
    }

    const docId = getDocumentId()
    jobId && jobsService.updateStepDescription(jobId, docId)

    const articleMetadata: IArticle = {
        ...body,
        publicTimestamp: body.publicTimestamp || timestamp,
        data,
        user: user.email
    }

    jobId && jobsService.nextStep(jobId)

    jobId && jobsService.updateTitle(jobId, `Article [${articleMetadata.title}, ${docId}] adding`)

    const actionId = getDocumentId()
    jobId && jobsService.updateStepDescription(jobId, actionId)

    const actionMetadata: IAction = {
        entity: 'articles',
        action: 'add',
        status: user.status === 'admin' ? 'approved' : 'pending',
        payload: articleMetadata,
        payloadIds: [docId],
        user: user.email,
        keywords: [
            ...getAllCompatibleInputForString(actionId),
            ...getAllCompatibleInputForString(docId)
        ],
        timestamp
    }

    jobId && jobsService.nextStep(jobId)

    // If action auto approve disabled for current admin
    if (
        user.status === 'admin' &&
        !(
            await appSettingsService[await appSettingsService.appSettingsMode].get()
        ).actionAutoApproveEnabledForAdmins?.includes(user.email)
    ) {
        actionMetadata.status = 'pending'
    }

    if (jobId && actionMetadata.status === 'pending') {
        jobsService.updateTitle(
            jobId,
            `Requesting to ADD Article [${articleMetadata.title}, ${docId}]`
        )
        jobsService.updateStepDescription(jobId, 'Auto approve unavailable')
    } else if (jobId) {
        jobsService.updateStepDescription(jobId, 'Auto approve available')
    }

    jobId && jobsService.nextStep(jobId)

    try {
        await actionsService.addAction(actionId, actionMetadata, file)

        if (actionMetadata.status === 'pending') {
            jobId && jobsService.removeNextSteps(jobId)
            jobId && jobsService.success(jobId)
            return res.json({
                result: { actionId }
            })
        }

        jobId && jobsService.nextStep(jobId)

        try {
            var result = await articlesService.addArticle(docId, articleMetadata, file)
        } catch (e) {
            await actionsService.deleteAction(actionId)
            throw e
        }
    } catch (e: any) {
        jobId && jobsService.error(jobId)
        logger.error(e)
        return res.status(500).json({
            error: e.toString()
        })
    }

    jobId && jobsService.success(jobId)

    return res.json({
        result
    })
}

async function putArticle(req: any, res: Response) {
    const user = {
        email: req.user.email,
        status: req.user._doc.status
    }
    let docId = req.params.id

    const checkedArticleIds = await articlesService.checkMetadatasExistance([docId])
    if (!checkedArticleIds.length) {
        return res.sendStatus(404)
    }

    ;[docId] = checkedArticleIds

    const body: IArticlePut = JSON.parse(req.body.json)

    if (body.oldId) {
        // TODO: Rename the variable :)
        const sameOldIdArticleIds = await articlesService.checkOldIdUsage(body.oldId)
        if (sameOldIdArticleIds.length) {
            return res.status(400).json({
                error: `"oldId" is used by articles [${sameOldIdArticleIds.join(', ')}]`
            })
        }
    }

    const articleMetadataUpdate: IArticleUpdate = {
        ...body
    }

    try {
        var file = req.file && _processArticleFile(req.file)
    } catch (e) {
        logger.error(e)
        return res.status(400).json({
            error: e
        })
    }

    if (file) {
        const data: any = {
            docx: false,
            html: false,
            pdf: false,
            json: false
        }
        data[file.ext] = true
        if (file.mimetype === articlesAllowedFileTypes.docx) {
            data.html = true
        }

        articleMetadataUpdate.data = data
    }

    const actionId = getDocumentId()

    const actionMetadata: IAction = {
        entity: 'articles',
        action: 'update',
        status: user.status === 'admin' ? 'approved' : 'pending',
        payload: articleMetadataUpdate,
        payloadIds: [docId],
        user: user.email,
        keywords: [
            ...getAllCompatibleInputForString(actionId),
            ...getAllCompatibleInputForString(docId)
        ],
        timestamp: Date.now()
    }

    // If action auto approve disabled for current admin
    if (
        user.status === 'admin' &&
        !(
            await appSettingsService[await appSettingsService.appSettingsMode].get()
        ).actionAutoApproveEnabledForAdmins?.includes(user.email)
    ) {
        actionMetadata.status = 'pending'
    }

    try {
        await actionsService.addAction(actionId, actionMetadata, file)

        if (actionMetadata.status === 'pending') {
            return res.json({
                result: { actionId }
            })
        }

        var result = await articlesService.updateArticle(docId, articleMetadataUpdate, file)
    } catch (e: any) {
        logger.error(e)
        return res.status(500).json({
            error: e
        })
    }

    return res.json({
        result
    })
}

async function deleteArticle(req: any, res: Response) {
    const user = {
        email: req.user.email,
        status: req.user._doc.status
    }

    let ids = req.query.ids && req.query.ids.split(',')

    if (!ids)
        return res.status(400).json({
            error: '"ids" query param is missed!'
        })

    ids = await articlesService.checkMetadatasExistance(ids)

    if (!ids.length) {
        return res.sendStatus(404)
    }

    const actionId = getDocumentId()

    const keywords = [...getAllCompatibleInputForString(actionId)]
    for (const id of ids) {
        keywords.push(...getAllCompatibleInputForString(id))
    }

    const actionMetadata: IAction = {
        entity: 'articles',
        action: 'delete',
        status: user.status === 'admin' ? 'approved' : 'pending',
        payload: {},
        payloadIds: ids,
        user: user.email,
        keywords,
        timestamp: Date.now()
    }

    // If action auto approve disabled for current admin
    if (
        user.status === 'admin' &&
        !(
            await appSettingsService[await appSettingsService.appSettingsMode].get()
        ).actionAutoApproveEnabledForAdmins?.includes(user.email)
    ) {
        actionMetadata.status = 'pending'
    }

    try {
        await actionsService.addAction(actionId, actionMetadata)

        if (actionMetadata.status === 'pending') {
            return res.json({
                result: { actionId }
            })
        }

        await articlesService.deleteArticles(ids)
    } catch (e) {
        logger.error(e)
        return res.status(500).json({
            error: e
        })
    }

    return res.json({
        result: null
    })
}

export const privateArticlesControllers = {
    getDownloadArticles: tryCatch(getDownloadArticles),
    postArticle: tryCatch(postArticle),
    putArticle: tryCatch(putArticle),
    deleteArticle: tryCatch(deleteArticle)
}
