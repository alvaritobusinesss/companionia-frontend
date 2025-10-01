import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ConsentStatus = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cookie_consent_status");
      if (saved === "accepted" || saved === "rejected") {
        setStatus(saved as ConsentStatus);
      }
    } catch {}
  }, []);

  function handle(choice: Exclude<ConsentStatus, null>) {
    try {
      localStorage.setItem("cookie_consent_status", choice);
    } catch {}
    setStatus(choice);
  }

  if (status) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/15 bg-black/70 backdrop-blur-md text-white p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm leading-relaxed">
            Usamos cookies esenciales para que la web funcione y cookies opcionales para
            analizar el uso y personalizar tu experiencia. Puedes cambiar tu decisión en
            cualquier momento. Lee más en nuestra {" "}
            <a href="/cookie-policy" className="underline underline-offset-2 hover:text-blue-300">Política de Cookies</a>.
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20" onClick={() => handle("rejected")}>Rechazar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handle("accepted")}>Aceptar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}






