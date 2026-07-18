import { create } from 'zustand'
import Cookies from 'js-cookie'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth as firebaseAuth } from './firebase'

export interface User {
  id: string
  email: string
  plano?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

const mensagens: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos',
  'auth/wrong-password': 'E-mail ou senha incorretos',
  'auth/user-not-found': 'Usuário não encontrado',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado',
  'auth/weak-password': 'A senha deve ter no mínimo 6 caracteres',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos',
  'auth/unauthorized-domain': 'Domínio não autorizado no Firebase',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet',
}

function traduzErro(code: string): string {
  return mensagens[code] || 'Erro ao fazer login'
}

function
