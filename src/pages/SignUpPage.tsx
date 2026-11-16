import { SignUp } from '@clerk/react'
import { AuthShell } from './AuthShell'

// Solo se llega aquí desde el enlace de una invitación de Clerk.
export function SignUpPage() {
  return (
    <AuthShell>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </AuthShell>
  )
}
