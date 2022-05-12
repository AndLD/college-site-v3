export interface IAppSettings {
    selectedMenuId: string | null
    pinnedNewsIds: string[]
    actionAutoApproveEnabledForAdmins: string[]
}

export interface IAppSettingsPut {
    selectedMenuId?: string | null
    pinnedNewsIds?: string[]
    actionAutoApproveEnabledForAdmins?: string
}
