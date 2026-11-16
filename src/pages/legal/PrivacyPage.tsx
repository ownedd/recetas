import { Email, LegalLayout } from './LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      <p>
        Recetario es un recetario personal en línea. El acceso es solo por invitación. Esta página explica qué datos
        guarda la app, para qué y cómo puedes pedir que se borren.
      </p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>
          <strong>Datos de tu cuenta:</strong> tu nombre, tu correo electrónico y, si entras con Google, tu foto de
          perfil. Los gestiona Clerk, el servicio de inicio de sesión que usa la app.
        </li>
        <li>
          <strong>Tu contenido:</strong> las recetas que escribes (título, ingredientes, pasos, etiquetas, notas,
          enlaces de origen) y las fotos que subes. Se guardan en Convex, el servicio de base de datos de la app.
        </li>
      </ul>
      <p>
        Si entras con Google, la app solo pide permiso para ver tu nombre, tu correo y tu foto de perfil (los permisos
        básicos <code>openid</code>, <code>email</code> y <code>profile</code>). No accede a tu Gmail, tus contactos,
        tus archivos ni ningún otro dato de tu cuenta de Google.
      </p>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Para que puedas iniciar sesión y solo tú veas tus recetas.</li>
        <li>Para guardar y mostrarte tus recetas en cualquier dispositivo.</li>
      </ul>
      <p>No usamos tus datos para publicidad, no los vendemos y no hacemos perfiles sobre ti.</p>

      <h2>Quién más los ve</h2>
      <p>
        Tus recetas son privadas: ningún otro usuario de la app puede verlas. Tus datos solo los procesan los servicios
        que hacen funcionar la app, y únicamente para eso:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> (inicio de sesión) y, si lo eliges, <strong>Google</strong> para identificarte.
        </li>
        <li>
          <strong>Convex</strong> (base de datos y almacenamiento de fotos).
        </li>
        <li>
          <strong>Vercel</strong> (aloja la página web).
        </li>
      </ul>

      <h2>Cookies y almacenamiento local</h2>
      <p>
        La app usa solo las cookies y el almacenamiento necesarios para mantener tu sesión iniciada y para que funcione
        como app instalable. No usa cookies de análisis ni de publicidad.
      </p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>
        Tus recetas y fotos se guardan mientras tengas cuenta. Si borras una receta, se borran también su foto y sus
        datos. Si cierras tu cuenta, se borra todo tu contenido.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes pedir en cualquier momento una copia de tus datos, corregirlos o que se borren por completo tu cuenta y
        todas tus recetas. Escribe a <Email /> y lo atenderemos en un plazo máximo de 30 días.
      </p>

      <h2>Cambios en esta política</h2>
      <p>Si cambia algo importante, actualizaremos esta página y la fecha de arriba.</p>

      <h2>Contacto</h2>
      <p>
        Para cualquier duda sobre tus datos: <Email />.
      </p>
    </LegalLayout>
  )
}
