import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LegalNotice() {
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
          <h1 className="text-4xl font-bold mb-8 text-center">Aviso Legal</h1>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Datos identificativos</h2>
              <div className="bg-white/10 p-4 rounded-lg">
                <p><strong>Denominación social:</strong> [Nombre de tu empresa]</p>
                <p><strong>NIF/CIF:</strong> [Tu NIF o CIF]</p>
                <p><strong>Domicilio social:</strong> [Tu dirección completa]</p>
                <p><strong>Teléfono:</strong> [Tu número de contacto]</p>
                <p><strong>Email:</strong> legal@aicompanions.com</p>
                <p><strong>Sitio web:</strong> www.aicompanions.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Objeto social</h2>
              <p className="mb-4">
                [Nombre de tu empresa] es una empresa dedicada al desarrollo y comercialización
                de servicios de inteligencia artificial para compañía virtual y entretenimiento
                a través de plataformas digitales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Condiciones generales de uso</h2>
              <p className="mb-4">
                El acceso y uso de la plataforma AI Companions implica la aceptación plena
                de las condiciones establecidas en este aviso legal y en nuestros términos y condiciones.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Propiedad intelectual e industrial</h2>
              <div className="space-y-3">
                <p>Todos los contenidos de la plataforma, incluyendo:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Textos, imágenes, sonidos, animaciones, software</li>
                  <li>Diseño gráfico, código fuente, estructura de navegación</li>
                  <li>Marcas, nombres comerciales, signos distintivos</li>
                  <li>Modelos de inteligencia artificial y algoritmos</li>
                </ul>
                <p>Están protegidos por derechos de propiedad intelectual e industrial y son titularidad de [Nombre de tu empresa].</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Responsabilidad del usuario</h2>
              <p className="mb-4">El usuario se compromete a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Hacer un uso adecuado y lícito de la plataforma</li>
                <li>No utilizar la plataforma para fines ilícitos o prohibidos</li>
                <li>No introducir virus, malware o códigos dañinos</li>
                <li>Respetar los derechos de propiedad intelectual</li>
                <li>No realizar actividades que puedan dañar la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Limitación de responsabilidad</h2>
              <p className="mb-4">
                [Nombre de tu empresa] no se hace responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Interrupciones del servicio por causas técnicas</li>
                <li>Contenido generado por la IA que pueda ser inapropiado</li>
                <li>Daños derivados del uso indebido de la plataforma</li>
                <li>Pérdida de datos por fallos técnicos</li>
                <li>Actuaciones de terceros que afecten al servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Protección de datos</h2>
              <p className="mb-4">
                El tratamiento de datos personales se realiza conforme a la Ley Orgánica 3/2018,
                de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos
                digitales (LOPDGDD) y el Reglamento General de Protección de Datos (RGPD).
              </p>
              <p className="mb-4">
                Para más información, consulta nuestra <a href="/privacy-policy" className="text-blue-300 hover:underline">Política de Privacidad</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
              <p className="mb-4">
                Esta plataforma utiliza cookies para mejorar la experiencia del usuario.
                Para más información, consulta nuestra <a href="/cookie-policy" className="text-blue-300 hover:underline">Política de Cookies</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Modificaciones</h2>
              <p className="mb-4">
                [Nombre de tu empresa] se reserva el derecho de modificar este aviso legal
                en cualquier momento, sin previo aviso. Las modificaciones entrarán en vigor
                desde su publicación en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Legislación aplicable</h2>
              <p className="mb-4">
                Este aviso legal se rige por la legislación española. Para la resolución
                de cualquier controversia, las partes se someten a los Juzgados y Tribunales
                de [Tu ciudad/región], renunciando expresamente a cualquier otro fuero.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contacto</h2>
              <p className="mb-4">
                Para cualquier consulta relacionada con este aviso legal:
              </p>
              <div className="bg-white/10 p-4 rounded-lg">
                <p><strong>Email:</strong> legal@aicompanions.com</p>
                <p><strong>Dirección:</strong> [Tu dirección completa]</p>
                <p><strong>Teléfono:</strong> [Tu número de contacto]</p>
                <p><strong>Horario de atención:</strong> Lunes a Viernes, 9:00 - 18:00</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Registro mercantil</h2>
              <p className="mb-4">
                [Si aplica] Inscrita en el Registro Mercantil de [Ciudad], Tomo [X], Libro [X],
                Folio [X], Hoja [X], Inscripción [X].
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





