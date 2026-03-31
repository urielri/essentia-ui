'use client'

import { useEffect } from 'react'
import { useKnot, useThread } from '@repo/telar/react'
import {
  themeKnot, profileKnot, editingKnot, draftKnot, previewThread,
} from '../../state/profile-demo'
import type { ProfileDraft } from '../../state/profile-demo'
import './profile-demo.css'

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return <div className={`pd-avatar pd-avatar--${size}`}>{initials}</div>
}

// ─── Stat ─────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number }) {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  return (
    <div className="pd-stat">
      <span className="pd-stat-value">{fmt(value)}</span>
      <span className="pd-stat-label">{label}</span>
    </div>
  )
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard() {
  const [profile]          = useKnot(profileKnot)
  const [editing, setEditing] = useKnot(editingKnot)
  const [, setDraft]       = useKnot(draftKnot)

  function startEditing() {
    setDraft({ name: profile.name, bio: profile.bio, website: profile.website })
    setEditing(true)
  }

  return (
    <div className="pd-card">
      <span className="pd-card-badge">Datos del servidor</span>

      <div className="pd-card-header">
        <Avatar name={profile.name} size="lg" />
        <div>
          <h2 className="pd-card-name">{profile.name}</h2>
          <p className="pd-card-role">{profile.role}</p>
          {profile.location && <p className="pd-card-location">↓ {profile.location}</p>}
        </div>
      </div>

      {profile.bio && <p className="pd-card-bio">{profile.bio}</p>}
      {profile.website && <p className="pd-card-website">→ {profile.website}</p>}

      <div className="pd-stats">
        <Stat label="Seguidores" value={profile.followers} />
        <Stat label="Siguiendo"  value={profile.following} />
        <Stat label="Posts"      value={profile.posts} />
      </div>

      {!editing && (
        <button className="pd-btn pd-btn--primary" onClick={startEditing}>
          Editar perfil
        </button>
      )}
    </div>
  )
}

// ─── Profile Editor ───────────────────────────────────────────────────────────

function ProfileEditor() {
  const [editing, setEditing] = useKnot(editingKnot)
  const [draft, setDraft]     = useKnot(draftKnot)
  const [, setProfile]        = useKnot(profileKnot)

  if (!editing) return null

  function save() {
    setProfile(p => ({
      ...p,
      name:    draft.name    || p.name,
      bio:     draft.bio     !== '' ? draft.bio     : p.bio,
      website: draft.website !== '' ? draft.website : p.website,
    }))
    setEditing(false)
  }

  function update(field: keyof ProfileDraft) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(d => ({ ...d, [field]: e.target.value }))
  }

  return (
    <div className="pd-editor">
      <p className="pd-section-label">Editar perfil</p>

      <div className="pd-field">
        <label className="pd-field-label">Nombre</label>
        <input
          className="pd-input"
          value={draft.name}
          onChange={update('name')}
          placeholder="Tu nombre"
        />
      </div>

      <div className="pd-field">
        <label className="pd-field-label">Biografía</label>
        <textarea
          className="pd-input pd-textarea"
          value={draft.bio}
          onChange={update('bio')}
          placeholder="Contá algo sobre vos..."
        />
      </div>

      <div className="pd-field">
        <label className="pd-field-label">Sitio web</label>
        <input
          className="pd-input"
          value={draft.website}
          onChange={update('website')}
          placeholder="tudominio.com"
        />
      </div>

      <div className="pd-editor-actions">
        <button className="pd-btn pd-btn--primary" onClick={save}>Guardar</button>
        <button className="pd-btn pd-btn--ghost"   onClick={() => setEditing(false)}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Profile Preview ──────────────────────────────────────────────────────────

function ProfilePreview() {
  const [editing] = useKnot(editingKnot)
  const preview   = useThread(previewThread)

  if (!editing) return null

  return (
    <div className="pd-preview">
      <p className="pd-section-label">Vista previa en tiempo real</p>
      <div className="pd-preview-card">
        <div className="pd-preview-header">
          <Avatar name={preview.name} size="sm" />
          <div>
            <p className="pd-preview-name">{preview.name}</p>
            <p className="pd-preview-role">{preview.role}</p>
          </div>
        </div>
        {preview.bio     && <p className="pd-preview-bio">{preview.bio}</p>}
        {preview.website && <p className="pd-preview-website">→ {preview.website}</p>}
      </div>
    </div>
  )
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const [theme, setTheme] = useKnot(themeKnot)
  return (
    <div className="pd-theme-toggle">
      <div className="pd-theme-btns">
        <button
          className={`pd-theme-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
        >
          Dark
        </button>
        <button
          className={`pd-theme-btn ${theme === 'soft' ? 'active' : ''}`}
          onClick={() => setTheme('soft')}
        >
          Soft
        </button>
      </div>
      <span className="pd-theme-hint">Persiste en sessionStorage</span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ProfileSkeleton() {
  return (
    <div className="pd-page pd-page--skeleton">
      <div className="pd-inner">
        <header className="pd-header">
          <div>
            <div className="pd-skel pd-skel--title" />
            <div className="pd-skel pd-skel--subtitle" />
          </div>
          <div className="pd-skel pd-skel--toggle" />
        </header>
        <div className="pd-grid">
          <div className="pd-card">
            <div className="pd-card-header">
              <div className="pd-skel pd-skel--avatar" />
              <div>
                <div className="pd-skel pd-skel--name" />
                <div className="pd-skel pd-skel--role" />
              </div>
            </div>
            <div className="pd-skel pd-skel--bio" />
            <div className="pd-stats">
              <div className="pd-skel pd-skel--stat" />
              <div className="pd-skel pd-skel--stat" />
              <div className="pd-skel pd-skel--stat" />
            </div>
          </div>
          <div className="pd-right">
            <div className="pd-skel pd-skel--placeholder" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Demo content ─────────────────────────────────────────────────────────────

export function ProfileDemoContent() {
  const [theme]   = useKnot(themeKnot)
  const [editing] = useKnot(editingKnot)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    return () => { document.documentElement.removeAttribute('data-theme') }
  }, [theme])

  return (
    <div className="pd-page">
      <div className="pd-inner">

        <header className="pd-header">
          <div>
            <h1 className="pd-title">Perfil + Preview</h1>
            <p className="pd-subtitle">
              Perfil prefetcheado del servidor · Theme persistido en sessionStorage sin flash
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="pd-grid">
          <ProfileCard />
          <div className="pd-right">
            <ProfileEditor />
            <ProfilePreview />
            {!editing && (
              <div className="pd-placeholder">
                <p className="pd-placeholder-text">
                  Hacé click en "Editar perfil" para ver la preview en tiempo real
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

