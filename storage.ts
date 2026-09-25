// Простое хранилище на основе localStorage

export interface StoredUser {
  id: string
  name: string
  email: string
  avatar: string
}

export interface StoredContact {
  id: string
  name: string
  initials: string
  color: string
  online: boolean
}

export interface StoredChat {
  id: string
  contact: StoredContact
  lastMessage: string
  time: string
  unread: number
}

export interface StoredMessage {
  id: string
  chatId: string
  text: string
  sent: boolean
  time: string
  read: boolean
}

const KEYS = {
  user: 'pulse_user',
  chats: 'pulse_chats',
  messages: 'pulse_messages',
} as const

export function getUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(KEYS.user)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveUser(user: StoredUser) {
  localStorage.setItem(KEYS.user, JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem(KEYS.user)
}

export function getChats(): StoredChat[] {
  try {
    const raw = localStorage.getItem(KEYS.chats)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveChats(chats: StoredChat[]) {
  localStorage.setItem(KEYS.chats, JSON.stringify(chats))
}

export function getMessages(chatId: string): StoredMessage[] {
  try {
    const raw = localStorage.getItem(KEYS.messages)
    const all: StoredMessage[] = raw ? JSON.parse(raw) : []
    return all.filter(m => m.chatId === chatId)
  } catch {
    return []
  }
}

export function appendMessage(msg: StoredMessage) {
  try {
    const raw = localStorage.getItem(KEYS.messages)
    const all: StoredMessage[] = raw ? JSON.parse(raw) : []
    all.push(msg)
    localStorage.setItem(KEYS.messages, JSON.stringify(all))
  } catch {}
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
