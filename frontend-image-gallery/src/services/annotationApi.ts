import request from './request'

type SubmitPayload = {
  taskItemId: number
  resultJson: Record<string, any>
  submit?: boolean
  schemaVersion?: number
  changeReason?: string
}

function ensureBizSuccess(body: any) {
  const hasCode = typeof body?.code === 'number'
  const codeFailed = hasCode && body.code !== 200
  const successFailed = body?.success === false
  if (codeFailed || successFailed) {
    throw new Error(body?.msg || '请求失败')
  }
}

export async function submitAnnotationDraft(payload: SubmitPayload) {
  const res = await request.post<any, any>('/api/annotation/submit', payload)
  const body = res?.data ?? res
  ensureBizSuccess(body)
  return body
}
