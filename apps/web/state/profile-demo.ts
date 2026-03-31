import { knot, thread } from '@repo/telar'
import type { ServerKnotDef } from '@repo/telar/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'soft'

export type Profile = {
  name:      string
  role:      string
  bio:       string
  location:  string
  website:   string
  followers: number
  following: number
  posts:     number
}

export type ProfileDraft = {
  name:    string
  bio:     string
  website: string
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

/**
 * Tema de la UI.
 * uiCache: true → se hidrata desde sessionStorage antes del primer render.
 * Al recargar la página no hay flash: el tema correcto aplica de entrada.
 */
export const themeKnot = knot<Theme>({
  key:     'pd-theme',
  default: 'dark',
})

const DEFAULT_PROFILE: Profile = {
  name:      'Nombre',
  role:      'Rol',
  bio:       '',
  location:  '',
  website:   '',
  followers: 0,
  following: 0,
  posts:     0,
}

/**
 * Perfil del usuario.
 * ServerKnotDef → la función `server` corre en el servidor (Next.js RSC /
 * getServerSideProps) y el resultado viaja como `initialValues` a TelarRoot.
 * En el cliente se hidrata antes del primer render: no hay estado "loading".
 */
export const profileKnot: ServerKnotDef<Profile> = {
  _brand:  'knot',
  key:     'pd-profile',
  default: DEFAULT_PROFILE,
  server:  async () => {
    // Simula latencia de red — permite ver el skeleton durante la carga
    await new Promise(r => setTimeout(r, 1500))
    return {
    name:      'María García',
    role:      'Product Designer',
    bio:       'Diseñando interfaces que las personas disfrutan usar. Amante del buen café y los sistemas de diseño bien pensados.',
    location:  'Buenos Aires, Argentina',
    website:   'maria.design',
    followers: 1284,
    following: 347,
    posts:     92,
    }
  },
}

/** Controla si el panel de edición está abierto. */
export const editingKnot = knot<boolean>({
  key:     'pd-editing',
  default: false,
})

/** Borrador de edición — valores mientras el usuario escribe. */
export const draftKnot = knot<ProfileDraft>({
  key:     'pd-draft',
  default: { name: '', bio: '', website: '' },
})

/**
 * Perfil fusionado con el borrador.
 * Cuando el editor está abierto, la preview refleja los cambios en tiempo real.
 * Es un thread puro: no hay efectos, no hay DOM — solo aritmética sobre knots.
 */
export const previewThread = thread<Profile>({
  key: 'pd-preview',
  get: ({ read }) => {
    const profile = read(profileKnot)
    const draft   = read(draftKnot)
    const editing = read(editingKnot)
    if (!editing) return profile
    return {
      ...profile,
      name:    draft.name    || profile.name,
      bio:     draft.bio     !== '' ? draft.bio     : profile.bio,
      website: draft.website !== '' ? draft.website : profile.website,
    }
  },
})
