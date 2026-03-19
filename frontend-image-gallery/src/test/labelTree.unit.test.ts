import { describe, expect, it } from 'vitest'
import {
  buildLabelTree,
  filterTreeByKeyword,
  findPath,
  getDescendantIds,
  toInitials,
  toPinyin
} from '../utils/labelTree'

const source = [
  { id: '1', name: '油松', level: 1 },
  { id: '2', name: '本体', parentId: '1', level: 2 },
  { id: '3', name: '主干', parentId: '2', level: 3 },
  { id: '4', name: '树皮颜色', parentId: '3', level: 4 },
  { id: '5', name: '正常', parentId: '4', level: 5, severity: ['轻微', '明显', '严重'] as const }
]

describe('标签树工具', () => {
  it('递归构建树并保留层级结构', () => {
    const tree = buildLabelTree(source as any)
    expect(tree).toHaveLength(1)
    expect(tree[0].children[0].children[0].children[0].children[0].name).toBe('正常')
  })

  it('获取后代ID包含当前节点', () => {
    const tree = buildLabelTree(source as any)
    const ids = getDescendantIds(tree[0])
    expect(ids).toEqual(['1', '2', '3', '4', '5'])
  })

  it('路径查找返回从根到目标节点', () => {
    const tree = buildLabelTree(source as any)
    expect(findPath(tree, '5')).toEqual(['1', '2', '3', '4', '5'])
    expect(findPath(tree, 'missing')).toEqual([])
  })

  it('支持中文拼音与首字母搜索', () => {
    expect(toPinyin('油松')).toContain('you')
    expect(toInitials('油松')).toBe('ys')
    const tree = buildLabelTree(source as any)
    expect(filterTreeByKeyword(tree, 'ys')).toHaveLength(1)
    expect(filterTreeByKeyword(tree, 'shupi')).toHaveLength(1)
  })
})
