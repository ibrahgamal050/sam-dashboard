export type SettingsState = Record<string, unknown>

export type UpdateSettingsFn = (section: string, updates: Record<string, unknown>) => void
