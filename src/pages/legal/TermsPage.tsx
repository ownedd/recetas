import { Link } from 'react-router'
import { Email, LegalLayout } from './LegalLayout'

export function TermsPage() {
  return (
    <LegalLayout title="Términos del servicio">
      <p>Al usar Recetario aceptas estos términos. Son cortos porque la app es sencilla.</p>

      <h2>Qué es Recetario</h2>
      <p>
        Una app personal y gratuita para guardar, organizar y consultar recetas de cocina. El acceso es solo por
        invitación: no hay registro abierto.
      </p>

      <h2>Tu cuenta</h2>
      <ul>
        <li>La cuenta es personal. No compartas tu acceso con otras personas.</li>
        <li>Eres responsable de lo que hagas con tu cuenta.</li>
      </ul>

      <h2>Tu contenido</h2>
      <ul>
        <li>Las recetas y fotos que subes siguen siendo tuyas.</li>
        <li>Solo las usamos para guardarlas y mostrártelas a ti.</li>
        <li>
          No subas contenido ilegal, ofensivo o que infrinja derechos de otras personas (por ejemplo, fotos ajenas sin
          permiso).
        </li>
      </ul>

      <h2>Disponibilidad</h2>
      <p>
        La app se ofrece «tal cual», sin garantías. Hacemos lo posible por que funcione bien y no pierda datos, pero no
        podemos asegurar que esté siempre disponible ni libre de errores. Te recomendamos guardar aparte las recetas
        que no quieras perder.
      </p>

      <h2>Acceso</h2>
      <p>
        Podemos retirar una invitación o cerrar una cuenta si se usa en contra de estos términos, o dejar de ofrecer la
        app. Si eso ocurre, avisaremos con tiempo para que puedas pedir una copia de tus recetas.
      </p>

      <h2>Privacidad</h2>
      <p>
        Cómo tratamos tus datos se explica en la{' '}
        <Link to="/privacidad" className="font-semibold text-pimenton underline">
          Política de privacidad
        </Link>
        .
      </p>

      <h2>Cambios</h2>
      <p>Si cambian estos términos, actualizaremos esta página y la fecha de arriba.</p>

      <h2>Contacto</h2>
      <p>
        Para cualquier duda: <Email />.
      </p>
    </LegalLayout>
  )
}
