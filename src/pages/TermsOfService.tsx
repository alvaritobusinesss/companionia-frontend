import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 text-white hover:bg-white/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-8 text-center">Términos y Condiciones de Uso</h1>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los términos</h2>
              <p className="mb-4">
                Al acceder y utilizar AI Companions, aceptas estar sujeto a estos términos y condiciones.
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestro servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Descripción del servicio</h2>
              <p className="mb-4">
                AI Companions es una plataforma que permite a los usuarios interactuar con modelos de inteligencia
                artificial diseñados para proporcionar compañía virtual y entretenimiento a través de chat.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Cuentas de usuario</h2>
              <div className="space-y-3">
                <p>Para utilizar nuestros servicios, debes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Proporcionar información veraz y actualizada</li>
                  <li>Mantener la confidencialidad de tu cuenta</li>
                  <li>Ser responsable de todas las actividades en tu cuenta</li>
                  <li>Notificarnos inmediatamente sobre uso no autorizado</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Uso aceptable</h2>
              <p className="mb-4">Está prohibido:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar el servicio para actividades ilegales o no autorizadas</li>
                <li>Intentar acceder a sistemas o datos no autorizados</li>
                <li>Interferir con el funcionamiento del servicio</li>
                <li>Crear contenido ofensivo, abusivo o inapropiado</li>
                <li>Intentar ingeniería inversa o descompilar el software</li>
                <li>Usar el servicio para spam o actividades comerciales no autorizadas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Suscripciones y pagos</h2>
              <div className="space-y-3">
                <p><strong>Modelo de suscripción:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Plan gratuito: Limitado a 5 mensajes diarios</li>
                  <li>Plan Premium: €19.99/mes, mensajes ilimitados</li>
                  <li>Los pagos se procesan a través de Stripe</li>
                  <li>Las suscripciones se renuevan automáticamente</li>
                </ul>
                <p><strong>Política de reembolsos:</strong> Los reembolsos se evalúan caso por caso dentro de los primeros 7 días.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Propiedad intelectual</h2>
              <p className="mb-4">
                Todo el contenido de la plataforma, incluyendo pero no limitado a texto, gráficos, logos,
                imágenes y software, es propiedad de AI Companions y está protegido por leyes de derechos de autor.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitación de responsabilidad</h2>
              <p className="mb-4">
                AI Companions no será responsable por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Interrupciones del servicio o pérdida de datos</li>
                <li>Daños indirectos, incidentales o consecuenciales</li>
                <li>Contenido generado por las IA que pueda ser inapropiado</li>
                <li>Uso indebido del servicio por parte de terceros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Privacidad y protección de datos</h2>
              <p className="mb-4">
                El tratamiento de datos personales se rige por nuestra Política de Privacidad,
                que forma parte integral de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Terminación</h2>
              <p className="mb-4">
                Podemos suspender o terminar tu cuenta si:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violas estos términos y condiciones</li>
                <li>Usas el servicio de manera inapropiada</li>
                <li>No pagas las suscripciones adeudadas</li>
                <li>Por razones de seguridad o legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Modificaciones</h2>
              <p className="mb-4">
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Los cambios entrarán en vigor inmediatamente después de su publicación en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Ley aplicable</h2>
              <p className="mb-4">
                Estos términos se rigen por las leyes de España. Cualquier disputa será resuelta
                en los tribunales competentes de [Tu ciudad/región].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contacto</h2>
              <p className="mb-4">
                Para preguntas sobre estos términos, contacta con nosotros:
              </p>
              <p className="bg-white/10 p-4 rounded-lg">
                <strong>Email:</strong> legal@aicompanions.com<br/>
                <strong>Dirección:</strong> [Tu dirección de empresa]<br/>
                <strong>Teléfono:</strong> [Tu número de contacto]
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-white/80">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





