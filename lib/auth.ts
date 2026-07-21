import { create } from 'zustand'
import Cookies from 'js-cookie'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth as fb } from './firebase'

export interface User { id: string; email: string; plano?: string }

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  esqueciSenha: (email: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

const msgs: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos',
  'auth/wrong-password': 'E-mail ou senha incorretos',
  'auth/user-not-found': 'Usuário não encontrado',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente entrar.',
  'auth/weak-password': 'A senha deve ter no mínimo 6 caracteres',
  'auth/invalid-email': 'E-mail inválido',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos',
  'auth/unauthorized-domain': 'Domínio não autorizado no Firebase',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet',
}

function salvar(set: any, uid: string, email: string | null, token: string) {
  const user = { id: uid, email: email || '' }
  Cookies.set('auth_token', token)
  Cookies.set('user', JSON.stringify(user))
  set({ user, token, isLoading: false, error: null })
}

let ouvindo = false

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const cred = await signInWithEmailAndPassword(fb, email, password)
      salvar(set, cred.user.uid, cred.user.email, await cred.user.getIdToken())
    } catch (e: any) {
      const m = msgs[e.code] || 'Erro ao fazer login'
      set({ error: m, isLoading: false })
      throw new Error(m)
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const cred = await createUserWithEmailAndPassword(fb, email, password)
      salvar(set, cred.user.uid, cred.user.email, await cred.user.getIdToken())
    } catch (e: any) {
      const m = msgs[e.code] || 'Erro ao criar a conta'
      set({ error: m, isLoading: false })
      throw new Error(m)
    }
  },

  esqueciSenha: async (email) => {
    try {
      await sendPasswordResetEmail(fb, email)
    } catch (e: any) {
      const m = msgs[e.code] || 'Erro ao enviar o e-mail de redefinição'
      throw new Error(m)
    }
  },

  logout: () => {
    Cookies.remove('auth_token')
    Cookies.remove('user')
    signOut(fb)
    set({ user: null, token: null })
  },

  hydrate: () => {
    if (typeof window === 'undefined' || ouvindo) return
    ouvindo = true
    onAuthStateChanged(fb, async (u) => {
      if (u) salvar(set, u.uid, u.email, await u.getIdToken())
      else set({ user: null, token: null })
    })
  },
}))
