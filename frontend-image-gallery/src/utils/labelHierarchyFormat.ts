export type ParsedLabelNode = {
  name: string
  level: number
  path: string[]
  pathKey: string
  parentPathKey?: string
}

function normalizeLine(input: string) {
  return input.replace(/\u3000/g, ' ').trim()
}

export function parseHierarchyText(content: string): ParsedLabelNode[] {
  const lines = content.split(/\r?\n/)
  const levelPathMap = new Map<number, string[]>()
  const nodes: ParsedLabelNode[] = []
  const dedup = new Set<string>()

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine)
    if (!line) continue
    const match = line.match(/^(\|*)/)
    const leadingPipeCount = match?.[1]?.length || 0
    const body = line.slice(leadingPipeCount).trim()
    if (!body) continue
    const segments = body
      .split('|')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    if (segments.length === 0) continue

    for (let i = 0; i < segments.length; i++) {
      const name = segments[i]
      const levelZeroBased = leadingPipeCount + i
      const parentPath = levelZeroBased > 0 ? levelPathMap.get(levelZeroBased - 1) || [] : []
      const path = [...parentPath, name]
      const pathKey = path.join('/')
      const parentPathKey = parentPath.length > 0 ? parentPath.join('/') : undefined
      if (!dedup.has(pathKey)) {
        dedup.add(pathKey)
        nodes.push({
          name,
          level: levelZeroBased + 1,
          path,
          pathKey,
          parentPathKey
        })
      }
      levelPathMap.set(levelZeroBased, path)
      for (const key of Array.from(levelPathMap.keys())) {
        if (key > levelZeroBased) {
          levelPathMap.delete(key)
        }
      }
    }
  }

  return nodes
}

type FlatLabelLike = {
  labelId: number | string
  labelName: string
  labelCategory?: string
}

export function exportHierarchyText(labels: FlatLabelLike[]) {
  const grouped = labels.map((item) => {
    const [parentIdRaw = 'root', levelRaw = '1'] = String(item.labelCategory || 'root:1').split(':')
    return {
      id: String(item.labelId),
      name: item.labelName,
      parentId: parentIdRaw,
      level: Math.max(1, Number(levelRaw) || 1)
    }
  })
  const byParent = new Map<string, Array<{ id: string; name: string; level: number }>>()
  for (const row of grouped) {
    const parentKey = row.parentId || 'root'
    const bucket = byParent.get(parentKey) || []
    bucket.push({ id: row.id, name: row.name, level: row.level })
    byParent.set(parentKey, bucket)
  }
  for (const [key, rows] of byParent) {
    rows.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN') || a.id.localeCompare(b.id))
    byParent.set(key, rows)
  }

  const lines: string[] = []
  const walk = (parentId: string, depth: number) => {
    const children = byParent.get(parentId) || []
    for (const child of children) {
      lines.push(`${'|'.repeat(Math.max(0, depth))}${child.name}`)
      walk(child.id, depth + 1)
    }
  }
  walk('root', 0)
  return lines.join('\n')
}
