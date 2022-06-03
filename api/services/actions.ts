import { model } from '../model/model'
import {
    ActionStatus,
    ArticlesAllowedFileExtension,
    Error,
    ArticleFileData,
    Filter,
    IAction,
    ModelResult,
    NewsFileData,
    NewsAllowedFileExtension
} from '../utils/types'
import { getLogger } from '../utils/logger'
import { articlesService } from './articles'
import { googleDriveService } from './google-drive'
import { ArticleData, IArticle } from '../utils/interfaces/articles/articles'
import { notificationService } from './notification'
import { firebase } from '../configs/firebase-config'
import { newsService } from './news'
import { INews, NewsData } from '../utils/interfaces/news/news'

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
        throw new Error('Add action metadata to database failed with error: ' + modelError.msg)
    }

    actionId = modelResult?.mainResult?.id

    if (!actionId) {
        throw new Error(
            'Action was not stored to database! Body: ' + JSON.stringify(actionMetadata)
        )
    }

    if ((file || image) && actionMetadata.status === 'pending') {
        if (actionMetadata.action === 'add' || actionMetadata.action === 'update') {
            if (actionMetadata.entity === 'articles') {
                await _addPendedArticle(actionId, file as ArticleFileData)
            } else if (actionMetadata.entity === 'news') {
                await _addPendedNews(actionId, file as NewsFileData | undefined, image)
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
                        const articleData: ArticleData = actionMetadata.payload.data
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
                        } else {
                            const ext = Object.keys(articleData)[0] as ArticlesAllowedFileExtension

                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.${ext}`,
                                'articles',
                                { [`${actionMetadata.id}_pending`]: [ext] }
                            )
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
                        const docId = actionMetadata.payloadIds[0]

                        await newsService.addMetadataToDBFlow(
                            docId,
                            actionMetadata.payload as INews
                        )
                        const newsData: NewsData = actionMetadata.payload.data
                        if (newsData.docx) {
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.docx`,
                                'news',
                                { [`${actionMetadata.id}_pending`]: ['docx'] }
                            )
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.html`,
                                'news',
                                { [`${actionMetadata.id}_pending`]: ['html'] }
                            )
                        } else if (newsData.html) {
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.html`,
                                'news',
                                { [`${actionMetadata.id}_pending`]: ['html'] }
                            )
                        }

                        if (newsData.png) {
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.png`,
                                'news',
                                { [`${actionMetadata.id}_pending`]: ['png'] }
                            )
                        }
                    } else if (actionMetadata.action === 'update') {
                        const docId = actionMetadata.payloadIds[0]

                        const { docBeforeUpdate: newsMetadata } =
                            await newsService.updateMetadataToDBFlow(docId, actionMetadata.payload)

                        const fileMetadatas = await googleDriveService.getFilesMetadataByDocIds(
                            [actionMetadata.id + '_pending'],
                            'news'
                        )

                        const areFilesUpdated = fileMetadatas.length

                        if (areFilesUpdated) {
                            const updatedFileExtensions: NewsAllowedFileExtension[] =
                                fileMetadatas.map((fileMetadata) => fileMetadata.fileExtension)

                            const fileExtensionsToDelete: NewsAllowedFileExtension[] = []

                            // If we have docx, we should also delete html
                            if (
                                updatedFileExtensions.includes('docx') ||
                                (newsMetadata.data.docx && !updatedFileExtensions.includes('docx'))
                            ) {
                                fileExtensionsToDelete.push('docx', 'html')
                            }

                            if (updatedFileExtensions.includes('png')) {
                                fileExtensionsToDelete.push('png')
                            }

                            await googleDriveService.deleteFiles([docId], 'news', {
                                [docId]: fileExtensionsToDelete
                            })

                            for (const fileMetadata of fileMetadatas) {
                                await googleDriveService.updateFilename(
                                    `${actionMetadata.id}_pending`,
                                    `${docId}.${fileMetadata.fileExtension}`,
                                    'news',
                                    { [fileMetadata.name]: [fileMetadata.fileExtension] },
                                    fileMetadata.id
                                )

                                // TODO: Update filename in the buffer if it exists
                            }
                        }
                    } else if (actionMetadata.action === 'delete') {
                        await newsService.deleteNews(actionMetadata.payloadIds)

                        // TODO: Remove file from the buffer if it exists
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

        throw new Error(errorMsg)
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
        throw new Error('Action status update failed with error: ' + modelError.msg)
    }

    if (!modelResult?.mainResult?.id) {
        throw new Error(
            `Something went wrong. No ID in result of action [${actionId}] status update`
        )
    }

    const actionMetadata = modelResult.mainResult as IAction

    return actionMetadata
}

async function _addPendedArticle(actionId: string, file: ArticleFileData) {
    await articlesService.addFileToGoogleDriveFlow(actionId, file, `${actionId}_pending`)
}

async function _addPendedNews(actionId: string, file?: NewsFileData, image?: NewsFileData) {
    if (file) {
        await newsService.addFileToGoogleDriveFlow(actionId, file, `${actionId}_pending`)
    }

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
        throw new Error('Error getting actionMetadata: ' + modelError.msg)
    }

    if (!modelResult?.mainResult?.id) {
        throw new Error(`actionMetadata with ID [${actionId}] does not exist`)
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
        throw new Error('Error getting actionMetadata: ' + modelError.msg)
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
        throw new Error('Error getting actionMetadatas: ' + modelError.msg)
    }

    if (!modelResult?.mainResult) {
        return []
    }

    return modelResult.mainResult as IAction[]
}

async function deleteAction(actionId: string) {
    const [_, deleteModelError] = await model({
        action: 'delete',
        docId: actionId,
        collection: actionsCollection
    })

    if (deleteModelError) {
        throw new Error('Deleting action metadata failed with error: ' + deleteModelError.msg)
    }
}

export const actionsService = {
    addAction,
    updateActions,
    getConflicts,
    deleteAction
}
