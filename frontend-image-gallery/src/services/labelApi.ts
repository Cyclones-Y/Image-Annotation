import request from './request'

function ensureBizSuccess(body: any) {
  const hasCode = typeof body?.code === 'number'
  const codeFailed = hasCode && body.code !== 200
  const successFailed = body?.success === false
  if (codeFailed || successFailed) {
    throw new Error(body?.msg || '请求失败')
  }
}

export type LabelDto = {
  labelId: number
  projectId: number
  labelName: string
  labelType: string
  labelCategory: string
  labelColor: string
  usageCount: number
  lastUsedAt?: string
  createTime?: string
  updateTime?: string
}

export type LabelTemplateDto = {
  templateId: number
  templateCode: string
  projectId: number
  templateName: string
  templateCategory: string
  templateVersion: number
  visibility: 'private' | 'project' | 'public'
  isLatest: boolean
  ownerId?: number
  labels: LabelDto[]
  createTime?: string
  updateTime?: string
}

export async function fetchLabels(projectId: number, keyword?: string) {
  const res = await request.get<any, any>('/api/annotation/labels', {
    params: { projectId, keyword, pageNum: 1, pageSize: 200 }
  })
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return (body.rows || []) as LabelDto[]
}

export async function createLabel(payload: {
  projectId: number
  labelName: string
  labelType: string
  labelCategory: string
  labelColor: string
}) {
  const res = await request.post<any, any>('/api/annotation/labels', payload)
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body.data as LabelDto
}

export async function updateLabel(payload: {
  labelId: number
  labelName?: string
  labelType?: string
  labelCategory?: string
  labelColor?: string
}) {
  const res = await request.put<any, any>('/api/annotation/labels', payload)
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body.data as LabelDto
}

export async function deleteLabel(labelId: number) {
  const res = await request.delete<any, any>('/api/annotation/labels', {
    params: { labelId }
  })
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body
}

export async function importLabels(
  payload: { projectId: number; file: File },
  onProgress?: (percent: number) => void
) {
  const formData = new FormData()
  formData.append('projectId', String(payload.projectId))
  formData.append('file', payload.file)
  const res = await request.post<any, any>('/api/annotation/labels/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
  })
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body
}

export async function fetchTemplates(projectId: number, keyword?: string) {
  const res = await request.get<any, any>('/api/annotation/templates', {
    params: { projectId, keyword, pageNum: 1, pageSize: 200 }
  })
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return (body.rows || []) as LabelTemplateDto[]
}

export async function createTemplate(payload: {
  projectId: number
  templateName: string
  templateCategory: string
  visibility: 'private' | 'project' | 'public'
  labelIds: number[]
  description?: string
}) {
  const res = await request.post<any, any>('/api/annotation/templates', payload)
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body.data as LabelTemplateDto
}

export async function updateTemplate(payload: {
  templateId: number
  templateName?: string
  templateCategory?: string
  visibility?: 'private' | 'project' | 'public'
  labelIds?: number[]
  description?: string
}) {
  const res = await request.put<any, any>('/api/annotation/templates', payload)
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body.data as LabelTemplateDto
}

export async function deleteTemplate(templateId: number) {
  const res = await request.delete<any, any>('/api/annotation/templates', {
    params: { templateId }
  })
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body
}
