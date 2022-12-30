export interface IAppSettings {
    selectedMenuId: string | null
    pinnedNewsIds: string[]
    actionAutoApproveEnabledForAdmins: string[]
    notificationsService: boolean
}

export interface IAppSettingsPut {
    selectedMenuId?: string | null
    pinnedNewsIds?: string
    actionAutoApproveEnabledForAdmins?: string
    notificationsService?: boolean
}
