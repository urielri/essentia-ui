import { Suspense } from 'react'
import type { Metadata } from 'next'
import { TelarRoot } from '@repo/telar/react-server'
import { TelarPersistence } from '@repo/telar/react'
import { profileKnot, themeKnot } from '../../state/profile-demo'
import { ProfileDemoContent, ProfileSkeleton } from './ProfileDemoApp'

export const metadata: Metadata = {
  title: 'Profile Demo — Telar',
  description: 'SSR prefetch + uiCache sessionStorage demo',
}

/**
 * TelarRoot suspende su subárbol mientras ejecuta el prefetch.
 * El Suspense muestra el skeleton durante ese tiempo.
 * Cuando TelarRoot resuelve, el primer render de ProfileDemoContent
 * ocurre directamente con los datos del servidor — sin flash de defaults.
 */
export default async function ProfileDemoPage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <TelarRoot prefetchNodes={[profileKnot]}>
        <TelarPersistence persistedNodes={[themeKnot]}>
          <ProfileDemoContent />
        </TelarPersistence>
      </TelarRoot>
    </Suspense>
  )
}
