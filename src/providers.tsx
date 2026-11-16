import { ClerkProvider, useAuth } from '@clerk/react'
import { esES } from '@clerk/localizations'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import type { ReactNode } from 'react'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

if (!convexUrl) throw new Error('Falta VITE_CONVEX_URL en el entorno')
if (!clerkKey) throw new Error('Falta VITE_CLERK_PUBLISHABLE_KEY en el entorno')

const convex = new ConvexReactClient(convexUrl)

const clerkAppearance = {
  variables: {
    colorPrimary: '#b8401f',
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, sans-serif",
    borderRadius: '0.9rem',
  },
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkKey!} localization={esES} appearance={clerkAppearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
