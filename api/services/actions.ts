import { model } from '../model/model'
import {
    ActionStatus,
    ArticlesAllowedFileExtension,
    Error,
    ArticleFileData,
    Filter,
    IAction,
    ModelResult,
    NewsFileData
} from '../utils/types'
import { getLogger } from '../utils/logger'
import { articlesService } from './articles'
import { googleDriveService } from './googleDrive'
import { IArticle } from '../utils/interfaces/articles/articles'
import { notificationService } from './notification'
import { firebase } from '../configs/firebase-config'
import { newsService } from './news'

const actionsCollection = 'actions'

const logger = getLogger('services/actions')

async function addAction(
    actionId: string,
    actionMetadata: IAction,
    file?: ArticleFileData | NewsFileData,
    image?: NewsFileData
) {
    // Wright action metadata to database
    const [modelResult, modelError] = (await model({
        action: 'add',
        collection: 'actions',
        obj: actionMetadata,
        docId: actionId
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw 'Add action metadata to database failed with error: ' + modelError.msg
    }

    actionId = modelResult?.mainResult?.id

    if (!actionId) {
        throw 'Action was not stored to database! Body: ' + JSON.stringify(actionMetadata)
    }

    if (file && actionMetadata.status === 'pending') {
        if (actionMetadata.action === 'add' || actionMetadata.action === 'update') {
            if (actionMetadata.entity === 'articles') {
                await _addPendedArticle(actionId, file as ArticleFileData)
            } else if (actionMetadata.entity === 'news') {
                await _addPendedNews(actionId, file as NewsFileData, image)
            }
        }
    }

    if (actionMetadata.status === 'pending') {
        notificationService.sendNewActionNotification(actionId, actionMetadata)
    }

    return actionId
}

async function updateActions(actionIds: string[], newStatus: ActionStatus, email: string) {
    actionIds = await _filterPendingActionsByIds(actionIds)

    // Check each action by actionId for status === 'pending'. Remove actionIds whose action status != 'pending'
    const promises = []

    for (const actionId of actionIds) {
        promises.push(_updateActionMetadata(actionId, newStatus, email))
    }

    const actionMetadatas = await Promise.all(promises)

    const articleFilenamesToDelete: string[] = []

    try {
        for (const actionMetadata of actionMetadatas) {
            if (!actionMetadata.id) {
                continue
            }

            if (newStatus === 'approved') {
                if (actionMetadata.entity === 'articles') {
                    if (actionMetadata.action === 'add') {
                        const docId = actionMetadata.payloadIds[0]

                        await articlesService.addMetadataToDBFlow(
                            docId,
                            actionMetadata.payload as IArticle
                        )
                        const articleData = actionMetadata.payload.data
                        if (articleData.docx) {
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.docx`,
                                'articles',
                                { [`${actionMetadata.id}_pending`]: ['docx'] }
                            )
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.html`,
                                'articles',
                                { [`${actionMetadata.id}_pending`]: ['html'] }
                            )

                            // TODO: Update filename in the buffer if it exists
                        } else {
                            const ext = Object.keys(articleData)[0] as ArticlesAllowedFileExtension

                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.${ext}`,
                                'articles',
                                { [`${actionMetadata.id}_pending`]: [ext] }
                            )

                            // TODO: Update filename in the buffer if it exists
                        }
                    } else if (actionMetadata.action === 'update') {
                        const docId = actionMetadata.payloadIds[0]

                        await articlesService.updateMetadataToDBFlow(docId, actionMetadata.payload)

                        const fileMetadatas = await googleDriveService.getFilesMetadataByDocIds(
                            [actionMetadata.id + '_pending'],
                            'articles'
                        )
                        const isFileUpdated = fileMetadatas.length

                        if (isFileUpdated) {
                            await googleDriveService.deleteFiles([docId], 'articles')

                            for (const fileMetadata of fileMetadatas) {
                                await googleDriveService.updateFilename(
                                    `${actionMetadata.id}_pending`,
                                    `${docId}.${fileMetadata.fileExtension}`,
                                    'articles',
                                    { [fileMetadata.name]: [fileMetadata.fileExtension] },
                                    fileMetadata.id
                                )

                                // TODO: Update filename in the buffer if it exists
                            }
                        }
                    } else if (actionMetadata.action === 'delete') {
                        await articlesService.deleteArticles(actionMetadata.payloadIds)

                        // TODO: Remove file from the buffer if it exists
                    }
                } else if (actionMetadata.entity === 'news') {
                    if (actionMetadata.action === 'add') {
                    } else if (actionMetadata.action === 'update') {
                    } else if (actionMetadata.action === 'delete') {
                    }
                }
            } else if (
                newStatus === 'declined' &&
                (actionMetadata.action === 'add' || actionMetadata.action === 'update')
            ) {
                articleFilenamesToDelete.push(actionMetadata.id + '_pending')
            }
        }

        if (articleFilenamesToDelete.length) {
            await googleDriveService.deleteFiles(articleFilenamesToDelete, 'articles')
        }

        return actionIds
    } catch (e) {
        const errorMsg = 'Error during action update: ' + e

        logger.error(errorMsg)
        logger.info('Reverting action metadata update...')

        const promises = []

        for (const actionId of actionIds) {
            promises.push(_updateActionMetadata(actionId, 'pending', email))
        }

        await Promise.all(promises)
        logger.info('Action metadata update successfully reverted')

        throw errorMsg
    }
}

async function _filterPendingActionsByIds(actionIds: string[]) {
    let actionMetadatas = await _getMetadatasByIds(actionIds)

    actionIds = []

    for (const actionMetadata of actionMetadatas) {
        if (actionMetadata.status === 'pending' && actionMetadata.id) {
            actionIds.push(actionMetadata.id)
        }
    }

    return actionIds
}

async function _updateActionMetadata(actionId: string, newStatus: ActionStatus, email: string) {
    const [modelResult, modelError] = (await model({
        action: 'update',
        collection: actionsCollection,
        docId: actionId,
        obj: {
            status: newStatus,
            lastUpdateTimestamp: Date.now(),
            lastUpdateUser: email
        }
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw 'Action status update failed with error: ' + modelError.msg
    }

    if (!modelResult?.mainResult?.id) {
        throw `Something went wrong. No ID in result of action [${actionId}] status update`
    }

    const actionMetadata = modelResult.mainResult as IAction

    return actionMetadata
}

async function _addPendedArticle(actionId: string, file: ArticleFileData) {
    await articlesService.addFileToGoogleDriveFlow(actionId, file, `${actionId}_pending`)
}

async function _addPendedNews(actionId: string, file: NewsFileData, image?: NewsFileData) {
    await newsService.addFileToGoogleDriveFlow(actionId, file, `${actionId}_pending`)

    if (image) {
        await newsService.addFileToGoogleDriveFlow(actionId, image, `${actionId}_pending`)
    }
}

async function getConflicts({
    actionId,
    articleId,
    newsId
}: {
    actionId?: string
    articleId?: string
    newsId?: string
}) {
    type ActionConflictsWhereCondition = (
        | ['payloadIds', 'array-contains-any', string[]]
        | ['payloadIds', 'array-contains', string]
        | ['status', '==', 'pending']
        | [string, '!=', string]
    )[]

    const where: ActionConflictsWhereCondition = [['status', '==', 'pending']]

    if (actionId) {
        const actionMetadata = await _getMetadataById(actionId)

        if (actionMetadata.status != 'pending' || actionMetadata.action === 'add') {
            return []
        }

        const ids = actionMetadata.payloadIds

        where.push(
            [firebase.documentId.toString(), '!=', actionId],
            ['payloadIds', 'array-contains-any', ids]
        )
    } else if (articleId || newsId) {
        where.push(['payloadIds', 'array-contains', (articleId || newsId) as string])
    }

    const conflicts = await _getMetadatas(where)

    return conflicts
}

async function _getMetadataById(actionId: string) {
    const [modelResult, modelError] = (await model({
        collection: actionsCollection,
        action: 'get',
        docId: actionId
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw 'Error getting actionMetadata: ' + modelError.msg
    }

    if (!modelResult?.mainResult?.id) {
        throw `actionMetadata with ID [${actionId}] does not exist`
    }

    return modelResult.mainResult as IAction
}

async function _getMetadatas(where: Filter[]) {
    const [modelResult, modelError] = (await model({
        collection: actionsCollection,
        action: 'get',
        where
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw 'Error getting actionMetadata: ' + modelError.msg
    }

    if (!modelResult?.mainResult) {
        return []
    }

    return modelResult.mainResult as IAction[]
}

async function _getMetadatasByIds(docIds: string[]) {
    const [modelResult, modelError] = (await model({
        collection: actionsCollection,
        action: 'get',
        docIds
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw 'Error getting actionMetadatas: ' + modelError.msg
    }

    if (!modelResult?.mainResult) {
        return []
    }

    return modelResult.mainResult as IAction[]
}

export const actionsService = {
    addAction,
    updateActions,
    getConflicts
}
