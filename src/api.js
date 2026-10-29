import axios from 'axios'

const http = axios.create({ baseURL: '/api', timeout: 15000 })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('wb_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function login(mobile, password) {
  const { data } = await http.post('/auth/login', { mobile, password })
  return data
}

export async function overview() {
  const { data } = await http.get('/admin/overview')
  return data
}

export async function listEntries() {
  const { data } = await http.get('/admin/entries')
  return data
}

export async function listFeedback() {
  const { data } = await http.get('/cm/cases')
  return data
}

export async function fetchFeedback(id) {
  const { data } = await http.get(`/cm/cases/${id}`)
  return data
}

export async function replyFeedback(id, body) {
  const { data } = await http.post(`/cm/cases/${id}/notes`, { body })
  return data
}

export async function transitionFeedback(id, status) {
  const { data } = await http.post(`/cm/cases/${id}/transition`, { status })
  return data
}

export default http
