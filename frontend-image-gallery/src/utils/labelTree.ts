export type FlatLabelItem = {
  id: string
  name: string
  parentId?: string
  level: number
  severity?: Array<'轻微' | '明显' | '严重'>
}

export type LabelTreeNode = FlatLabelItem & {
  children: LabelTreeNode[]
}

const PINYIN_CHAR_MAP: Record<string, string> = {
  油: 'you',
  松: 'song',
  本: 'ben',
  体: 'ti',
  主: 'zhu',
  干: 'gan',
  树: 'shu',
  皮: 'pi',
  颜: 'yan',
  色: 'se',
  正: 'zheng',
  常: 'chang',
  轻: 'qing',
  微: 'wei',
  明: 'ming',
  显: 'xian',
  严: 'yan',
  重: 'zhong',
  缺: 'que',
  陷: 'xian',
  枝: 'zhi',
  叶: 'ye'
}

export function toPinyin(name: string) {
  return name
    .split('')
    .map((char) => PINYIN_CHAR_MAP[char] || char.toLowerCase())
    .join('')
}

export function toInitials(name: string) {
  return name
    .split('')
    .map((char) => {
      const py = PINYIN_CHAR_MAP[char]
      return py ? py[0] : /[a-zA-Z]/.test(char) ? char.toLowerCase() : ''
    })
    .join('')
}

export function buildLabelTree(source: FlatLabelItem[]) {
  const map = new Map<string, LabelTreeNode>()
  source.forEach((item) => {
    map.set(item.id, { ...item, children: [] })
  })
  const roots: LabelTreeNode[] = []
  source.forEach((item) => {
    const current = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(current)
      return
    }
    roots.push(current)
  })
  const sortNode = (nodes: LabelTreeNode[]) => {
    nodes.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'zh-CN'))
    nodes.forEach((node) => sortNode(node.children))
  }
  sortNode(roots)
  return roots
}

export function getDescendantIds(node: LabelTreeNode): string[] {
  const ids: string[] = [node.id]
  node.children.forEach((child) => {
    ids.push(...getDescendantIds(child))
  })
  return ids
}

export function findPath(nodes: LabelTreeNode[], targetId: string): string[] {
  for (const node of nodes) {
    if (node.id === targetId) return [node.id]
    if (node.children.length > 0) {
      const childPath = findPath(node.children, targetId)
      if (childPath.length > 0) {
        return [node.id, ...childPath]
      }
    }
  }
  return []
}

export function filterTreeByKeyword(nodes: LabelTreeNode[], keyword: string): LabelTreeNode[] {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return nodes
  const match = (name: string) => {
    const lower = name.toLowerCase()
    return lower.includes(normalized) || toPinyin(name).includes(normalized) || toInitials(name).includes(normalized)
  }
  const dfs = (current: LabelTreeNode[]): LabelTreeNode[] => {
    const result: LabelTreeNode[] = []
    for (const node of current) {
      const children = dfs(node.children)
      if (match(node.name) || children.length > 0) {
        result.push({ ...node, children })
      }
    }
    return result
  }
  return dfs(nodes)
}

export function flattenTree(nodes: LabelTreeNode[]): LabelTreeNode[] {
  const rows: LabelTreeNode[] = []
  const walk = (current: LabelTreeNode[]) => {
    current.forEach((item) => {
      rows.push(item)
      walk(item.children)
    })
  }
  walk(nodes)
  return rows
}
