// Google Identity Services (GSI) — работает без бекенда
// Пользователь должен подставить свой GOOGLE_CLIENT_ID в .env

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void
          prompt: () => void
          renderButton: (el: HTMLElement, cfg: object) => void
        }
      }
    }
  }
}

export interface GoogleUser {
  id: string
  name: string
  email: string
  avatar: string
}

type GoogleCallback = (user: GoogleUser) => void

let _callback: GoogleCallback | null = null

export function initGoogleAuth(clientId: string, onSuccess: GoogleCallback) {
  _callback = onSuccess

  if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') return

  const load = () => {
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
    })
  }

  if (window.google) {
    load()
  } else {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = load
    document.head.appendChild(script)
  }
}

export function triggerGoogleSignIn(buttonEl: HTMLElement | null) {
  if (!buttonEl || !window.google) return
  window.google.accounts.id.renderButton(buttonEl, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    width: buttonEl.offsetWidth || 340,
    logo_alignment: 'left',
  })
}

function handleCredential(response: { credential: string }) {
  try {
    // Декодируем JWT payload (без верификации — для прод нужен бекенд)
    const payload = JSON.parse(atob(response.credential.split('.')[1]))
    _callback?.({
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      avatar: payload.picture,
    })
  } catch (e) {
    console.error('Google auth error', e)
  }
}
