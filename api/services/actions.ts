import { model } from '../model/model'
import {
    ActionStatus,
    AllowedFileExtension,
    Error,
    FileData,
    Filter,
    IAction,
    ModelResult
} from '../utils/types'
import { getLogger } from '../utils/logger'
import { articlesService } from './articles'
import { googleDriveService } from './googleDrive'
import { IArticle } from '../utils/interfaces/articles/articles'
import { notificationService } from './notification'
import { firebase } from '../configs/firebase-config'

const actionsCollection = 'actions'

const logger = getLogger('services/actions')

async function addAction(actionMetadata: IAction, file?: FileData) {
    // Wright action metadata to database
    const [modelResult, modelError] = (await model({
        action: 'add',
        collection: 'actions',
        obj: actionMetadata
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw 'Add action metadata to database failed with error: ' + modelError.msg
    }

    const actionId = modelResult?.mainResult?.id

    if (!actionId) {
        throw 'Action was not stored to database! Body: ' + JSON.stringify(actionMetadata)
    }

    if (file && actionMetadata.status === 'pending') {
        if (
            (actionMetadata.action === 'add' || actionMetadata.action === 'update') &&
            actionMetadata.entity === 'articles'
        ) {
            await _addPendedArticle(actionId, file)
        }
    }

    if (actionMetadata.status === 'pending') {
        notificationService.sendNewActionNotication(actionId, actionMetadata)
    }

    return actionId
}

async function updateActions(actionIds: string[], newStatus: ActionStatus) {
    const promises = []

    for (const actionId of actionIds) {
        promises.push(_updateActionMetadata(actionId, newStatus))
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
                        } else {
                            const ext = Object.keys(articleData)[0] as AllowedFileExtension

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
                            }
                        }
                    } else if (actionMetadata.action === 'delete') {
                        await articlesService.deleteArticles(actionMetadata.payloadIds)
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
    } catch (e) {
        const errorMsg = 'Error during action update: ' + e

        logger.error(errorMsg)
        logger.info('Reverting action metadata update...')

        const promises = []

        for (const actionId of actionIds) {
            promises.push(_updateActionMetadata(actionId, 'pending'))
        }

        await Promise.all(promises)
        logger.info('Action metadata update successfully reverted')

        throw errorMsg
    }
}

async function _updateActionMetadata(actionId: string, newStatus: ActionStatus) {
    const [modelResult, modelError] = (await model({
        action: 'update',
        collection: actionsCollection,
        docId: actionId,
        obj: {
            status: newStatus,
            lastUpdateTimestamp: Date.now()
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

async function _addPendedArticle(actionId: string, file: FileData) {
    await articlesService.addFileToGoogleDriveFlow(actionId, file, `${actionId}_pending`)
}

async function getConflicts({ actionId, articleId }: { actionId?: string; articleId?: string }) {
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
    } else if (articleId) {
        where.push(['payloadIds', 'array-contains', articleId])
    } else {
        throw '"actionId" or "articleId" missed'
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

export const actionsService = {
    addAction,
    updateActions,
    getConflicts
}
