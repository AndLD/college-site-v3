import { model } from '../model/model'
import { ActionStatus, Error, FileData, IAction, ModelResult } from '../utils/types'
import { getLogger } from '../utils/logger'
import { Response } from 'express'
import { articlesService } from './articles'
import { googleDriveService } from './googleDrive'
import { IArticle } from '../utils/interfaces/articles/articles'

const actionsCollection = 'actions'

const logger = getLogger('services/actions')

async function addAction(actionMetadata: IAction, file: FileData | null) {
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
        if (actionMetadata.action === 'add' && actionMetadata.entity === 'articles') {
            await _addPendedArticle(actionId, file)
        }
    }

    return actionId
}

async function updateActions(actionIds: string[], newStatus: ActionStatus) {
    const promises = []

    for (const actionId of actionIds) {
        promises.push(_updateActionMetadata(actionId, newStatus))
    }

    const actionMetadatas = await Promise.all(promises)

    const filenamesToDelete: string[] = []

    try {
        for (const actionMetadata of actionMetadatas) {
            if (!actionMetadata.id) {
                continue
            }

            if (newStatus === 'approved') {
                if (actionMetadata.action === 'add') {
                    if (actionMetadata.entity === 'articles') {
                        const docId = await articlesService.addMetadataToDBFlow(
                            actionMetadata.payload as IArticle
                        )
                        const articleData = actionMetadata.payload.data
                        if (articleData.docx) {
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.docx`,
                                { [`${actionMetadata.id}_pending`]: ['docx'] }
                            )
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.html`,
                                { [`${actionMetadata.id}_pending`]: ['html'] }
                            )
                        } else {
                            const ext = Object.keys(articleData)[0]
                            // TODO: Investigate the problem of extensions in filenames
                            await googleDriveService.updateFilename(
                                `${actionMetadata.id}_pending`,
                                `${docId}.${ext}`
                            )
                        }
                    }
                } else if (actionMetadata.action === 'update') {
                } else if (actionMetadata.action === 'delete') {
                }
            } else if (
                newStatus === 'declined' &&
                (actionMetadata.action === 'add' || actionMetadata.action === 'update')
            ) {
                filenamesToDelete.push(actionMetadata.id + '_pending')
            }
        }

        if (filenamesToDelete.length) {
            await googleDriveService.deleteFiles(filenamesToDelete)
        }
    } catch (e) {
        const promises = []
        if (newStatus === 'approved') {
            for (const actionId of actionIds) {
                promises.push(_updateActionMetadata(actionId, 'declined'))
            }
        } else if (newStatus === 'declined') {
            for (const actionId of actionIds) {
                promises.push(_updateActionMetadata(actionId, 'approved'))
            }
        }
        await Promise.all(promises)
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

export const actionsService = {
    addAction,
    updateActions
}
