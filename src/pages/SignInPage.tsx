import { SignIn } from '@clerk/react'
import { AuthShell } from './AuthShell'

// Sin enlace de registro: las cuentas se crean solo por invitación.
const appearance = { elements: { footerAction: { display: 'none' } } }

export function SignInPage() {
  return (
    <AuthShell>
      <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/" appearance={appearance} />
    </AuthShell>
  )
}
