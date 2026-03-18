import { AnnotationItem, LabelDefinition } from '../types/annotation'

export type DraftSnapshot = {
  imageSrc?: string
  labels: LabelDefinition[]
  annotations: AnnotationItem[]
}

export function persistAnnotationDraft(storageKey: string, snapshot: DraftSnapshot, storage: Storage = window.localStorage) {
  storage.setItem(storageKey, JSON.stringify(snapshot))
}
