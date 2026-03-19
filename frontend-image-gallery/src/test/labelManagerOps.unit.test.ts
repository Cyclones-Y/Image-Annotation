import { describe, expect, it } from 'vitest'
import {
  buildCreateDiff,
  buildDeleteDiff,
  buildImportDiff,
  buildUpdateDiff,
  createOperationLog
} from '../utils/labelManagerOps'

describe('标签管理写操作回归', () => {
  it('新增操作日志包含父子层级diff', () => {
    const diff = buildCreateDiff({ name: '树皮颜色', parentId: '3', level: 4 })
    const log = createOperationLog({ time: '2026-03-19 10:00:00', user: 'tester', action: 'create', diff })
    expect(log.diff).toContain('name=树皮颜色')
    expect(log.diff).toContain('parentId=3')
  })

  it('编辑操作日志包含前后值', () => {
    const diff = buildUpdateDiff({ labelId: 11, before: '树皮', after: '树皮颜色' })
    const log = createOperationLog({ time: '2026-03-19 10:00:00', user: 'tester', action: 'update', diff })
    expect(log.diff).toContain('树皮 -> 树皮颜色')
  })

  it('删除与导入操作日志格式稳定', () => {
    const remove = buildDeleteDiff({ labelId: 21, name: '异常' })
    const imported = buildImportDiff('labels.xlsx')
    expect(remove).toContain('labelId=21')
    expect(imported).toContain('labels.xlsx')
  })
})
