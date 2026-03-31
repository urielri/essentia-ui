import { Suspense } from 'react'
import type { Metadata } from 'next'
import { TelarRoot } from '@repo/telar/react-server'
import { profileKnot } from '../../state/profile-demo'
import { ProfileDemoContent, ProfileSkeleton } from './ProfileDemoApp'

export const metadata: Metadata = {
  title: 'Profile Demo — Telar',
  description: 'SSR prefetch + Suspense streaming',
}

export default function ProfileDemoPage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <TelarRoot prefetchNodes={[profileKnot]}>
        <ProfileDemoContent />
      </TelarRoot>
    </Suspense>
  )
}
