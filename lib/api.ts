import axios from 'axios'
import Cookies from 'js-cookie'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, limpa e redireciona
      Cookies.remove('auth_token')
      Cookies.remove('user')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
// ============ AUTH ============
export const auth = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => {
    Cookies.remove('auth_token')
    Cookies.remove('user')
  },
}
// ============ CATALOG ============
export const catalog = {
  home: () => api.get('/api/catalogo/home'),
  search: (q: string, limit = 20) =>
    api.get('/api/catalogo/buscar', { params: { q, limit } }),
  getFile: (id: string) => api.get(`/api/catalogo/arquivo/${id}`),
  download: (id: string) => api.post(`/api/catalogo/arquivo/${id}/download`, {}),
  favorites: () => api.get('/api/catalogo/favoritos'),
  addFavorite: (id: string) => api.post(`/api/catalogo/arquivo/${id}/favoritar`, {}),
  removeFavorite: (id: string) =>
    api.delete(`/api/catalogo/arquivo/${id}/favoritar`),
}
// ============ COMPROVANTES ============
export const comprovantes = {
  enviar: (nomeArquivo: string, mime: string, conteudoBase64: string) =>
    api.post('/api/comprovante', { nomeArquivo, mime, conteudoBase64 }),
  meus: () => api.get('/api/comprovante'),
  doUsuario: (uid: string) => api.get(`/admin/usuarios/${uid}/comprovantes`),
  url: (uid: string, id: string) => api.get(`/admin/usuarios/${uid}/comprovantes/${id}/url`),
}
// ============ ADMIN ============
export const admin = {
  authGoogle: () => api.get('/admin/auth/google'),
  drives: () => api.get('/admin/drives'),
  importar: (driveId: string, driveNome: string) =>
    api.post('/admin/importar', { driveId, driveNome }),
  jobStatus: (jobId: string) => api.get(`/admin/job/${jobId}`),
  jobPause: (jobId: string) => api.post(`/admin/job/${jobId}/pausar`, {}),
  jobResume: (jobId: string) => api.post(`/admin/job/${jobId}/retomar`, {}),
  stats: () => api.get('/admin/stats'),
  jobs: () => api.get('/admin/jobs'),
  usuarios: () => api.get('/admin/usuarios'),
  setStatusUsuario: (uid: string, status: string, meses?: number) =>
    api.post(`/admin/usuarios/${uid}/status`, { status, meses }),
  excluirUsuario: (uid: string) => api.post(`/admin/usuarios/${uid}/excluir`, {}),
  iniciarBackup: () => api.post('/admin/backup/iniciar', {}),
}
export default api
