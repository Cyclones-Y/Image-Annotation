import { describe, expect, it } from 'vitest'
import { exportHierarchyText, parseHierarchyText } from '../utils/labelHierarchyFormat'

describe('层级标签文本格式', () => {
  it('解析带缩进与多段路径的文本', () => {
    const raw = `
油松|待专业核验
|本体|主干|树皮颜色|正常
||||轻微异常
`
    const rows = parseHierarchyText(raw)
    const paths = rows.map((item) => item.pathKey)
    expect(paths).toContain('油松')
    expect(paths).toContain('油松/本体/主干/树皮颜色/正常')
    expect(paths).toContain('油松/本体/主干/树皮颜色/轻微异常')
  })

  it('导出后可再次解析得到结构路径', () => {
    const exported = exportHierarchyText([
      { labelId: 1, labelName: '油松', labelCategory: 'root:1' },
      { labelId: 2, labelName: '本体', labelCategory: '1:2' },
      { labelId: 3, labelName: '主干', labelCategory: '2:3' }
    ])
    const parsed = parseHierarchyText(exported)
    expect(parsed.map((item) => item.pathKey)).toEqual(['油松', '油松/本体', '油松/本体/主干'])
  })
})
