import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold mb-8 text-center">Política de Privacidad</h1>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Información que recopilamos</h2>
              <p className="mb-4">
                Recopilamos la siguiente información cuando utilizas nuestra plataforma:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Información de cuenta:</strong> Email, contraseña (encriptada)</li>
                <li><strong>Datos de pago:</strong> Información de facturación procesada por Stripe</li>
                <li><strong>Mensajes de chat:</strong> Conversaciones con las modelos AI</li>
                <li><strong>Preferencias:</strong> Configuraciones de chat y personalización</li>
                <li><strong>Datos de uso:</strong> Patrones de uso y estadísticas anónimas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Cómo utilizamos tu información</h2>
              <p className="mb-4">Utilizamos tu información para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Procesar pagos y suscripciones</li>
                <li>Personalizar tu experiencia de chat</li>
                <li>Enviar notificaciones importantes sobre tu cuenta</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Compartir información</h2>
              <p className="mb-4">
                No vendemos ni compartimos tu información personal con terceros, excepto:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> Para procesar pagos de forma segura</li>
                <li><strong>Supabase:</strong> Para almacenar datos de forma segura</li>
                <li><strong>OpenAI:</strong> Para generar respuestas de chat (datos anonimizados)</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Seguridad de datos</h2>
              <p className="mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Autenticación segura y control de acceso</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Cumplimiento con estándares de la industria</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Tus derechos</h2>
              <p className="mb-4">Tienes derecho a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceder a tu información personal</li>
                <li>Rectificar datos incorrectos</li>
                <li>Solicitar la eliminación de tu cuenta</li>
                <li>Exportar tus datos</li>
                <li>Retirar tu consentimiento en cualquier momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Cookies y tecnologías similares</h2>
              <p className="mb-4">
                Utilizamos cookies para mejorar tu experiencia, recordar preferencias y analizar el uso de la plataforma.
                Puedes gestionar las cookies en la configuración de tu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Retención de datos</h2>
              <p className="mb-4">
                Conservamos tu información durante el tiempo necesario para cumplir con los propósitos descritos
                en esta política, a menos que la ley requiera un período de retención más largo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cambios en esta política</h2>
              <p className="mb-4">
                Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios
                significativos a través de la plataforma o por email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contacto</h2>
              <p className="mb-4">
                Si tienes preguntas sobre esta política de privacidad, puedes contactarnos en:
              </p>
              <p className="bg-white/10 p-4 rounded-lg">
                <strong>Email:</strong> privacy@aicompanions.com<br/>
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





