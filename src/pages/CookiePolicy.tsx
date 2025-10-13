import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CookiePolicy() {
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
          <h1 className="text-4xl font-bold mb-8 text-center">Política de Cookies</h1>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. ¿Qué son las cookies?</h2>
              <p className="mb-4">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas
                un sitio web. Nos ayudan a recordar tus preferencias y mejorar tu experiencia de usuario.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Tipos de cookies que utilizamos</h2>
              
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Cookies esenciales</h3>
                  <p className="mb-2">Necesarias para el funcionamiento básico del sitio:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Autenticación:</strong> Mantener tu sesión iniciada</li>
                    <li><strong>Seguridad:</strong> Proteger contra ataques CSRF</li>
                    <li><strong>Preferencias:</strong> Recordar configuraciones básicas</li>
                  </ul>
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Cookies de funcionalidad</h3>
                  <p className="mb-2">Mejoran la funcionalidad del sitio:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Preferencias de chat:</strong> Recordar configuraciones de conversación</li>
                    <li><strong>Idioma:</strong> Mantener tu idioma preferido</li>
                    <li><strong>Tema:</strong> Recordar preferencias de visualización</li>
                  </ul>
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Cookies analíticas</h3>
                  <p className="mb-2">Nos ayudan a entender cómo usas el sitio:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Google Analytics:</strong> Estadísticas de uso anónimas</li>
                    <li><strong>Métricas de rendimiento:</strong> Tiempos de carga y errores</li>
                    <li><strong>Comportamiento del usuario:</strong> Patrones de navegación (anonimizados)</li>
                  </ul>
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Cookies de marketing</h3>
                  <p className="mb-2">Para personalizar anuncios y contenido:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Remarketing:</strong> Mostrar anuncios relevantes</li>
                    <li><strong>Segmentación:</strong> Personalizar contenido</li>
                    <li><strong>Conversiones:</strong> Medir efectividad de campañas</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Cookies de terceros</h2>
              <p className="mb-4">Utilizamos servicios de terceros que pueden establecer cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Proveedor de pagos:</strong> Para procesar pagos de forma segura (cuando esté habilitado)</li>
                <li><strong>Supabase:</strong> Para autenticación y base de datos</li>
                <li><strong>Google Analytics:</strong> Para análisis de tráfico</li>
                <li><strong>OpenAI:</strong> Para funcionalidad de chat (sin cookies)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Duración de las cookies</h2>
              <div className="space-y-3">
                <p><strong>Cookies de sesión:</strong> Se eliminan cuando cierras el navegador</p>
                <p><strong>Cookies persistentes:</strong> Permanecen durante un tiempo determinado:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Cookies de autenticación: 30 días</li>
                  <li>Cookies de preferencias: 90 días</li>
                  <li>Cookies analíticas: 2 años</li>
                  <li>Cookies de marketing: 1 año</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cómo gestionar las cookies</h2>
              <div className="space-y-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">En tu navegador:</h3>
                    <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies</li>
                    <li><strong>Firefox:</strong> Opciones &gt; Privacidad y seguridad &gt; Cookies</li>
                    <li><strong>Safari:</strong> Preferencias &gt; Privacidad &gt; Cookies</li>
                    <li><strong>Edge:</strong> Configuración &gt; Cookies y permisos del sitio</li>
                  </ul>
                </div>

                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">En nuestra plataforma:</h3>
                  <p>Puedes gestionar tus preferencias de cookies en la configuración de tu cuenta.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Consentimiento</h2>
              <p className="mb-4">
                Al continuar usando nuestro sitio, consientes al uso de cookies según se describe
                en esta política. Puedes retirar tu consentimiento en cualquier momento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies estrictamente necesarias</h2>
              <p className="mb-4">
                Algunas cookies son esenciales para el funcionamiento del sitio y no requieren consentimiento.
                Estas incluyen cookies de autenticación, seguridad y funcionalidad básica.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Actualizaciones de esta política</h2>
              <p className="mb-4">
                Podemos actualizar esta política de cookies ocasionalmente. Te notificaremos sobre
                cambios significativos a través de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contacto</h2>
              <p className="mb-4">
                Si tienes preguntas sobre nuestra política de cookies:
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

