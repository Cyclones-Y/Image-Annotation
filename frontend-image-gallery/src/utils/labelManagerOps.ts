export type OperationLog = {
  time: string
  user: string
  action: 'create' | 'update' | 'delete' | 'import'
  diff: string
}

export function createOperationLog(input: OperationLog): OperationLog {
  return { ...input }
}

export function buildCreateDiff(input: { name: string; parentId?: string; level: number }) {
  return `+ name=${input.name}, parentId=${input.parentId || 'root'}, level=${input.level}`
}

export function buildUpdateDiff(input: { labelId: number; before: string; after: string }) {
  return `~ labelId=${input.labelId}, name: ${input.before} -> ${input.after}`
}

export function buildDeleteDiff(input: { labelId: number; name: string }) {
  return `- labelId=${input.labelId}, name=${input.name}`
}

export function buildImportDiff(fileName: string) {
  return `+ import ${fileName}`
}
