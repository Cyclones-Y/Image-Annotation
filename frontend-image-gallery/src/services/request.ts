import axios from 'axios'
import Cookies from 'js-cookie'

const TOKEN_KEY = 'Admin-Token'

export const apiBaseURL = import.meta.env.VITE_APP_BASE_API as string

const service = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000
})

service.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY)
  const headers = config.headers ?? {}
  const isToken = (headers as any).isToken === false
  if (token && !isToken) {
    ;(headers as any).Authorization = `Bearer ${token}`
  }
  config.headers = headers
  return config
})

service.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      Cookies.remove(TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default service
