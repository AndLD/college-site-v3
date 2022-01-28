export interface IAppSettings {
    selectedMenuId: string | null
    pinnedNewsIds: string[]
}

export interface IAppSettingsPut {
    selectedMenuId?: string | null
    pinnedNewsIds?: string[]
}
