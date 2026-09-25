import { useState, useEffect, useRef } from 'react'
import {
  getUser, saveUser, clearAll,
  getChats, saveChats,
  getMessages, appendMessage,
  type StoredUser, type StoredChat, type StoredMessage,
} from './storage'
import { initGoogleAuth, triggerGoogleSignIn, type GoogleUser } from './google-auth'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'splash' | 'login' | 'main' | 'chat' | 'settings'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function nowTime() { return new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) }

const COLORS = ['#6b4fd4', '#2d6fa8', '#7c3aed', '#be185d', '#0f766e', '#c2410c', '#b45309', '#0369a1']

function toInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  initials, color, size = 42, online, src,
}: { initials: string; color: string; size?: number; online?: boolean; src?: string }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} referrerPolicy="no-referrer" alt={initials}
          className="rounded-full object-cover w-full h-full"
          style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="flex items-center justify-center rounded-full font-semibold text-white w-full h-full"
          style={{ background: `linear-gradient(135deg, ${color}cc, ${color}88)`, border: '1.5px solid rgba(255,255,255,0.12)', fontSize: size * 0.34 }}>
          {initials}
        </div>
      )}
      {online && <div className="online-dot absolute" style={{ bottom: 0, right: 0 }} />}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <div className={`toggle-track ${value ? 'on' : ''}`} onClick={onChange}>
      <div className="toggle-thumb" />
    </div>
  )
}

// ─── Splash ──────────────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'icon' | 'text' | 'bar' | 'out'>('icon')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 500)
    const t2 = setTimeout(() => setPhase('bar'), 1000)
    const t3 = setTimeout(() => setPhase('out'), 2400)
    const t4 = setTimeout(() => onDone(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div className="mesh-bg min-h-screen flex flex-col items-center justify-center"
      style={{ transition: 'opacity 0.4s ease', opacity: phase === 'out' ? 0 : 1 }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(107,79,212,0.22)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '18%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(60,25,160,0.28)', filter: 'blur(70px)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div style={{ transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease', transform: phase === 'icon' ? 'scale(0.4)' : 'scale(1)', opacity: phase === 'icon' ? 0 : 1 }}>
          <div className="flex items-center justify-center rounded-3xl" style={{ width: 96, height: 96, background: 'linear-gradient(135deg, #8b6fee 0%, #4c2dad 100%)', boxShadow: '0 0 60px rgba(107,79,212,0.55), 0 20px 40px rgba(0,0,0,0.4)' }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <path d="M10 10 C10 6.7 12.7 4 16 4 L36 4 C39.3 4 42 6.7 42 10 L42 30 C42 33.3 39.3 36 36 36 L26 36 L20 44 L20 36 L16 36 C12.7 36 10 33.3 10 30 Z" fill="white" opacity="0.95"/>
              <circle cx="19" cy="20" r="3" fill="#6b4fd4"/>
              <circle cx="26" cy="20" r="3" fill="#8b6fee"/>
              <circle cx="33" cy="20" r="3" fill="#b09af5"/>
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1" style={{ transition: 'transform 0.5s ease, opacity 0.5s ease', transform: phase === 'icon' ? 'translateY(12px)' : 'translateY(0)', opacity: phase === 'icon' ? 0 : 1 }}>
          <h1 className="text-4xl font-bold text-white tracking-tight">Pulse</h1>
          <p className="text-sm font-light" style={{ color: 'rgba(240,238,255,0.45)', letterSpacing: '0.12em' }}>СООБЩЕНИЯ НОВОГО ПОКОЛЕНИЯ</p>
        </div>

        <div style={{ width: 180, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 16, transition: 'opacity 0.4s ease', opacity: phase === 'bar' || phase === 'out' ? 1 : 0 }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #6b4fd4, #b09af5)', boxShadow: '0 0 10px rgba(139,111,238,0.9)', transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)', width: phase === 'bar' || phase === 'out' ? '100%' : '0%' }} />
        </div>

        <div className="flex items-center gap-2" style={{ opacity: phase === 'bar' || phase === 'out' ? 1 : 0, transition: 'opacity 0.4s ease' }}>
          {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s`, width: 6, height: 6 }} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: StoredUser) => void }) {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const hasGoogleId = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID'

  useEffect(() => {
    if (!hasGoogleId) return
    initGoogleAuth(GOOGLE_CLIENT_ID, (g: GoogleUser) => {
      const user: StoredUser = { id: g.id, name: g.name, email: g.email, avatar: g.avatar }
      saveUser(user)
      onLogin(user)
    })
  }, [hasGoogleId, onLogin])

  useEffect(() => {
    if (!hasGoogleId) return
    const timer = setTimeout(() => triggerGoogleSignIn(googleBtnRef.current), 300)
    return () => clearTimeout(timer)
  }, [hasGoogleId, tab])

  function handleSubmit() {
    setError('')
    if (!email.trim() || !password.trim()) { setError('Заполните все поля'); return }
    if (tab === 'signup' && !name.trim()) { setError('Введите имя'); return }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }

    const user: StoredUser = {
      id: uid(),
      name: tab === 'signup' ? name.trim() : email.split('@')[0],
      email: email.trim(),
      avatar: '',
    }
    saveUser(user)
    onLogin(user)
  }

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-6">
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(107,79,212,0.18)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(60,30,140,0.25)', filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="glass-strong rounded-2xl flex items-center justify-center mb-4" style={{ width: 64, height: 64 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.56.677 4.962 1.86 7.038L2 30l7.154-1.842A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2Z" fill="url(#lg1)"/>
              <circle cx="10" cy="16" r="2" fill="white" opacity=".9"/>
              <circle cx="16" cy="16" r="2" fill="white" opacity=".9"/>
              <circle cx="22" cy="16" r="2" fill="white" opacity=".9"/>
              <defs><linearGradient id="lg1" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#8b6fee"/><stop offset="1" stopColor="#4c2dad"/></linearGradient></defs>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pulse</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(240,238,255,0.45)' }}>Сообщения нового поколения</p>
        </div>

        <div className="glass rounded-2xl p-1 flex mb-6">
          {(['login', 'signup'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} className="flex-1 py-2 rounded-2xl text-sm font-medium transition-all duration-200"
              style={tab === t ? { background: 'rgba(107,79,212,0.6)', color: 'white' } : { color: 'rgba(240,238,255,0.45)', background: 'transparent' }}>
              {t === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        <div className="glass rounded-3xl p-6 flex flex-col gap-4">
          {tab === 'signup' && (
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(240,238,255,0.5)' }}>Имя</label>
              <input className="input-field w-full rounded-2xl px-4 py-3 text-sm" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(240,238,255,0.5)' }}>Email</label>
            <input className="input-field w-full rounded-2xl px-4 py-3 text-sm" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(240,238,255,0.5)' }}>Пароль</label>
            <input className="input-field w-full rounded-2xl px-4 py-3 text-sm" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {error && <p className="text-xs text-center" style={{ color: '#f87171' }}>{error}</p>}

          {tab === 'login' && (
            <div className="flex justify-end -mt-1">
              <button className="text-xs" style={{ color: '#8b6fee' }}>Забыли пароль?</button>
            </div>
          )}

          <button onClick={handleSubmit}
            className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6b4fd4 0%, #8b6fee 100%)', boxShadow: '0 4px 24px rgba(107,79,212,0.4)' }}>
            {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs" style={{ color: 'rgba(240,238,255,0.3)' }}>или</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google button — настоящий если есть Client ID, иначе заглушка */}
          {hasGoogleId ? (
            <div ref={googleBtnRef} className="w-full rounded-2xl overflow-hidden" style={{ minHeight: 44 }} />
          ) : (
            <div className="glass-btn w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2" style={{ color: 'rgba(240,238,255,0.4)', cursor: 'default' }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58Z"/>
              </svg>
              <span>Войти через Google</span>
              <span className="text-xs ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', fontSize: 9 }}>нужен Client ID</span>
            </div>
          )}

          {!hasGoogleId && (
            <p className="text-center" style={{ color: 'rgba(240,238,255,0.25)', fontSize: 10, lineHeight: 1.5 }}>
              Добавьте <code style={{ color: '#8b6fee', fontFamily: 'monospace' }}>VITE_GOOGLE_CLIENT_ID</code> в <code style={{ color: '#8b6fee' }}>.env</code><br/>
              Получить бесплатно: console.cloud.google.com
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function MainScreen({
  user, chats, onChatOpen, onNewChat, onSettings,
}: {
  user: StoredUser
  chats: StoredChat[]
  onChatOpen: (chat: StoredChat) => void
  onNewChat: () => void
  onSettings: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = chats.filter(c =>
    c.contact.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mesh-bg min-h-screen flex flex-col" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="glass px-5 pt-12 pb-4 sticky top-0 z-10" style={{ borderRadius: '0 0 24px 24px' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Avatar initials={toInitials(user.name)} color="#6b4fd4" size={36} src={user.avatar} online />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Привет, {user.name.split(' ')[0]}</h1>
              <p className="text-xs" style={{ color: 'rgba(240,238,255,0.4)' }}>
                {chats.reduce((s, c) => s + c.unread, 0) > 0
                  ? `${chats.reduce((s, c) => s + c.unread, 0)} непрочитанных`
                  : 'Нет новых сообщений'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onNewChat} className="glass-btn w-9 h-9 rounded-2xl flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="rgba(240,238,255,0.7)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button onClick={onSettings} className="glass-btn w-9 h-9 rounded-2xl flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="rgba(240,238,255,0.7)" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" fill="none" stroke="rgba(240,238,255,0.3)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="input-field w-full rounded-2xl pl-9 pr-4 py-2.5 text-sm" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 px-3 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="glass rounded-3xl flex items-center justify-center" style={{ width: 72, height: 72 }}>
              <svg width="32" height="32" fill="none" stroke="rgba(240,238,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white mb-1">{search ? 'Ничего не найдено' : 'Нет сообщений'}</p>
              <p className="text-xs" style={{ color: 'rgba(240,238,255,0.35)' }}>{search ? 'Другой запрос' : 'Нажмите + чтобы начать'}</p>
            </div>
            {!search && <button onClick={onNewChat} className="glass-btn px-5 py-2.5 rounded-2xl text-sm font-medium text-white">Новый чат</button>}
          </div>
        ) : filtered.map(chat => (
          <button key={chat.id} onClick={() => onChatOpen(chat)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1 transition-all duration-150 text-left"
            style={chat.unread ? { background: 'rgba(107,79,212,0.1)' } : {}}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(107,79,212,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = chat.unread ? 'rgba(107,79,212,0.1)' : 'transparent')}
          >
            <Avatar initials={chat.contact.initials} color={chat.contact.color} size={48} online={chat.contact.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-white truncate">{chat.contact.name}</span>
                <span className="text-xs flex-shrink-0 ml-2" style={{ color: chat.unread ? '#8b6fee' : 'rgba(240,238,255,0.35)' }}>{chat.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm truncate" style={{ color: 'rgba(240,238,255,0.45)' }}>{chat.lastMessage}</span>
                {chat.unread > 0 && (
                  <span className="flex-shrink-0 ml-2 w-5 h-5 rounded-full flex items-center justify-center font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6b4fd4,#8b6fee)', fontSize: 10 }}>
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="glass sticky bottom-0 px-4 py-3 flex justify-around" style={{ borderRadius: '24px 24px 0 0' }}>
        {[
          { path: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, label: 'Чаты', active: true },
          { path: <><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></>, label: 'Звонки', active: false },
          { path: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, label: 'Каналы', active: false },
          { path: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>, label: 'Профиль', active: false },
        ].map((item, i) => (
          <button key={i} className="flex flex-col items-center gap-1">
            <svg width="20" height="20" fill="none" stroke={item.active ? '#8b6fee' : 'rgba(240,238,255,0.35)'} strokeWidth="1.8" viewBox="0 0 24 24">{item.path}</svg>
            <span style={{ color: item.active ? '#8b6fee' : 'rgba(240,238,255,0.35)', fontSize: 10 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────

function NewChatModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="glass-strong w-full rounded-t-3xl p-6 flex flex-col gap-4" style={{ maxWidth: 420 }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Новый чат</h2>
          <button onClick={onClose} className="glass-btn w-8 h-8 rounded-2xl flex items-center justify-center">
            <svg width="14" height="14" fill="none" stroke="rgba(240,238,255,0.7)" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(240,238,255,0.5)' }}>Имя контакта</label>
          <input autoFocus className="input-field w-full rounded-2xl px-4 py-3 text-sm" placeholder="Введите имя..." value={name}
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && onCreate(name.trim())} />
        </div>
        <button onClick={() => name.trim() && onCreate(name.trim())}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
          style={{ background: name.trim() ? 'linear-gradient(135deg, #6b4fd4, #8b6fee)' : 'rgba(255,255,255,0.08)', color: name.trim() ? 'white' : 'rgba(240,238,255,0.3)' }}>
          Начать чат
        </button>
      </div>
    </div>
  )
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

function ChatScreen({
  chat, messages, onBack, onSend,
}: {
  chat: StoredChat
  messages: StoredMessage[]
  onBack: () => void
  onSend: (text: string) => void
}) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  function send() {
    const t = input.trim()
    if (!t) return
    onSend(t)
    setInput('')
  }

  return (
    <div className="mesh-bg min-h-screen flex flex-col" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="glass px-4 pt-10 pb-3 sticky top-0 z-10" style={{ borderRadius: '0 0 20px 20px' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="glass-btn w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" fill="none" stroke="rgba(240,238,255,0.8)" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <Avatar initials={chat.contact.initials} color={chat.contact.color} size={38} online={chat.contact.online} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{chat.contact.name}</p>
            <p className="text-xs" style={{ color: chat.contact.online ? '#4ade80' : 'rgba(240,238,255,0.4)' }}>
              {chat.contact.online ? 'онлайн' : 'не в сети'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="glass-btn w-8 h-8 rounded-2xl flex items-center justify-center">
              <svg width="15" height="15" fill="none" stroke="rgba(240,238,255,0.7)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.11h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.9 5.9l.89-.89a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
            </button>
            <button className="glass-btn w-8 h-8 rounded-2xl flex items-center justify-center">
              <svg width="15" height="15" fill="none" stroke="rgba(240,238,255,0.7)" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="13" height="10" rx="2"/><path d="m22 7-5 3.5L22 14V7Z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
            <div className="glass rounded-3xl flex items-center justify-center" style={{ width: 60, height: 60 }}>
              <svg width="26" height="26" fill="none" stroke="rgba(240,238,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-xs" style={{ color: 'rgba(240,238,255,0.3)' }}>Начните переписку</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <span className="text-xs px-3 py-1 rounded-full glass" style={{ color: 'rgba(240,238,255,0.35)' }}>Сегодня</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                {!msg.sent && (
                  <div className="mr-2 mt-auto flex-shrink-0">
                    <Avatar initials={chat.contact.initials} color={chat.contact.color} size={26} />
                  </div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  <div className={msg.sent ? 'message-bubble-sent' : 'message-bubble-recv'} style={{ padding: '10px 14px' }}>
                    <p className="text-sm text-white leading-snug">{msg.text}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                    <span style={{ color: 'rgba(240,238,255,0.3)', fontSize: 10 }}>{msg.time}</span>
                    {msg.sent && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={msg.read ? '#8b6fee' : 'rgba(240,238,255,0.3)'} strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="glass px-4 py-3 sticky bottom-0" style={{ borderRadius: '20px 20px 0 0' }}>
        <div className="flex items-center gap-2">
          <button className="glass-btn w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" fill="none" stroke="rgba(240,238,255,0.6)" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input className="input-field flex-1 rounded-2xl px-4 py-2.5 text-sm" placeholder="Сообщение..."
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button onClick={send}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #6b4fd4, #8b6fee)', boxShadow: '0 2px 12px rgba(107,79,212,0.5)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7Z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsScreen({ user, onBack, onLogout }: { user: StoredUser; onBack: () => void; onLogout: () => void }) {
  const [notif, setNotif] = useState(true)
  const [sounds, setSounds] = useState(false)
  const [dark, setDark] = useState(true)
  const [twofa, setTwofa] = useState(false)

  return (
    <div className="mesh-bg min-h-screen flex flex-col" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="glass px-5 pt-10 pb-4 sticky top-0 z-10" style={{ borderRadius: '0 0 24px 24px' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="glass-btn w-8 h-8 rounded-2xl flex items-center justify-center">
            <svg width="16" height="16" fill="none" stroke="rgba(240,238,255,0.8)" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 className="text-lg font-bold text-white">Настройки</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        <div className="glass-strong rounded-3xl p-5 flex items-center gap-4">
          <div className="avatar-ring">
            <Avatar initials={toInitials(user.name)} color="#6b4fd4" size={56} src={user.avatar} online />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">{user.name}</p>
            <p className="text-sm" style={{ color: 'rgba(240,238,255,0.45)' }}>{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="online-dot" style={{ width: 7, height: 7 }} />
              <span className="text-xs" style={{ color: '#4ade80' }}>онлайн</span>
            </div>
          </div>
          <button className="glass-btn px-4 py-2 rounded-2xl text-xs font-medium text-white">Изменить</button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(240,238,255,0.35)' }}>Уведомления</p>
          </div>
          {[
            { label: 'Push-уведомления', sub: 'Новые сообщения и звонки', value: notif, toggle: () => setNotif(v => !v) },
            { label: 'Звуки', sub: 'Звук при получении сообщения', value: sounds, toggle: () => setSounds(v => !v) },
          ].map((item, i) => (
            <div key={i} className="settings-row px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(240,238,255,0.4)' }}>{item.sub}</p>
              </div>
              <Toggle value={item.value} onChange={item.toggle} />
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(240,238,255,0.35)' }}>Интерфейс</p>
          </div>
          <div className="settings-row px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Тёмная тема</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(240,238,255,0.4)' }}>Тёмный фон интерфейса</p>
            </div>
            <Toggle value={dark} onChange={() => setDark(v => !v)} />
          </div>
          <div className="settings-row px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Акцент</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(240,238,255,0.4)' }}>Основной цвет</p>
            </div>
            <div className="flex items-center gap-1.5">
              {COLORS.slice(0, 5).map((c, i) => (
                <button key={c} className="w-5 h-5 rounded-full border-2 transition-all" style={{ background: c, borderColor: i === 0 ? 'white' : 'transparent' }} />
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(240,238,255,0.35)' }}>Безопасность</p>
          </div>
          <div className="settings-row px-4 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Двухфакторная аутентификация</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(240,238,255,0.4)' }}>SMS или приложение</p>
            </div>
            <Toggle value={twofa} onChange={() => setTwofa(v => !v)} />
          </div>
          {[
            { label: 'Активные сессии', sub: 'Управление устройствами' },
            { label: 'Конфиденциальность', sub: 'Управление данными' },
          ].map((item, i) => (
            <div key={i} className="settings-row px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(240,238,255,0.4)' }}>{item.sub}</p>
              </div>
              <svg width="14" height="14" fill="none" stroke="rgba(240,238,255,0.35)" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
        </div>

        <button onClick={onLogout} className="glass rounded-2xl px-4 py-4 w-full text-left flex items-center gap-3 transition-all"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
          <div className="w-8 h-8 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <svg width="15" height="15" fill="none" stroke="#f87171" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <span className="text-sm font-medium" style={{ color: '#f87171' }}>Выйти из аккаунта</span>
        </button>

        <p className="text-center text-xs pb-4" style={{ color: 'rgba(240,238,255,0.2)' }}>Pulse v1.0.0</p>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [user, setUser] = useState<StoredUser | null>(null)
  const [chats, setChats] = useState<StoredChat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [messages, setMessages] = useState<StoredMessage[]>([])

  // Восстановление сессии из localStorage
  useEffect(() => {
    const saved = getUser()
    if (saved) {
      setUser(saved)
      setChats(getChats())
    }
  }, [])

  const activeChat = chats.find(c => c.id === activeChatId) ?? null

  function handleLogin(u: StoredUser) {
    setUser(u)
    setChats(getChats())
    setScreen('main')
  }

  function handleLogout() {
    clearAll()
    setUser(null)
    setChats([])
    setActiveChatId(null)
    setMessages([])
    setScreen('login')
  }

  function openChat(chat: StoredChat) {
    setActiveChatId(chat.id)
    setMessages(getMessages(chat.id))
    // сбросить непрочитанные
    const updated = chats.map(c => c.id === chat.id ? { ...c, unread: 0 } : c)
    setChats(updated)
    saveChats(updated)
    setScreen('chat')
  }

  function createChat(name: string) {
    const initials = toInitials(name)
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const contact = { id: uid(), name, initials, color, online: true }
    const chat: StoredChat = { id: uid(), contact, lastMessage: '', time: nowTime(), unread: 0 }
    const updated = [chat, ...chats]
    setChats(updated)
    saveChats(updated)
    setShowNewChat(false)
    setActiveChatId(chat.id)
    setMessages([])
    setScreen('chat')
  }

  function sendMessage(text: string) {
    if (!activeChatId) return
    const msg: StoredMessage = { id: uid(), chatId: activeChatId, text, sent: true, time: nowTime(), read: false }
    appendMessage(msg)
    setMessages(prev => [...prev, msg])
    const updated = chats.map(c =>
      c.id === activeChatId ? { ...c, lastMessage: text, time: nowTime() } : c
    )
    setChats(updated)
    saveChats(updated)
  }

  if (screen === 'splash') {
    return <SplashScreen onDone={() => setScreen(getUser() ? 'main' : 'login')} />
  }

  if (screen === 'login' || !user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (screen === 'settings') {
    return <SettingsScreen user={user} onBack={() => setScreen('main')} onLogout={handleLogout} />
  }

  if (screen === 'chat' && activeChat) {
    return (
      <ChatScreen chat={activeChat} messages={messages} onBack={() => setScreen('main')} onSend={sendMessage} />
    )
  }

  return (
    <>
      <MainScreen user={user} chats={chats} onChatOpen={openChat} onNewChat={() => setShowNewChat(true)} onSettings={() => setScreen('settings')} />
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onCreate={createChat} />}
    </>
  )
}
