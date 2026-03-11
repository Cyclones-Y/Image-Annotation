import request from './request'

export interface LoginParams {
  username: string
  password: string
  code?: string
  uuid?: string
}

export interface RegisterParams {
  username: string
  password: string
  confirmPassword: string
  code?: string
  uuid?: string
}

export interface LoginResult {
  token: string
}

export interface CaptchaResult {
  captchaEnabled: boolean
  registerEnabled: boolean
  uuid: string
  img: string
}

export async function login(data: LoginParams) {
  const formData = new FormData()
  formData.append('username', data.username)
  formData.append('password', data.password)
  if (data.code) {
    formData.append('code', data.code)
  }
  if (data.uuid) {
    formData.append('uuid', data.uuid)
  }
  return request.post<any, any>('/login', formData)
}

export async function register(data: RegisterParams) {
  return request.post<any, any>('/register', data)
}

export async function getCaptchaImage() {
  return request.get<any, CaptchaResult>('/captchaImage')
}

export async function getInfo() {
  return request.get('/getInfo')
}
