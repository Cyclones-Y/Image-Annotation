import request from './request'

export interface UserSelectOption {
  label: string
  value: string
}

function ensureBizSuccess(body: any) {
  const hasCode = typeof body?.code === 'number'
  const codeFailed = hasCode && body.code !== 200
  const successFailed = body?.success === false
  if (codeFailed || successFailed) {
    throw new Error(body?.msg || '请求失败')
  }
}

export async function listUserOptions() {
  const res = await request.get<any, any>('/system/user/list', {
    params: { pageNum: 1, pageSize: 1000 }
  })
  const body = res?.data ?? res
  ensureBizSuccess(body)
  const payload = body?.data ?? body
  const rows = Array.isArray(payload?.rows) ? payload.rows : []
  const options = rows
    .map((item: any) => {
      const userName = String(item?.userName ?? item?.user_name ?? '').trim()
      if (!userName) return null
      const nickName = String(item?.nickName ?? item?.nick_name ?? '').trim()
      return {
        value: userName,
        label: nickName ? `${nickName}（${userName}）` : userName
      }
    })
    .filter(Boolean) as UserSelectOption[]
  return options
}
