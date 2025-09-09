import { useState } from "react";
import { Button } from "@/components/ui/button"; // usa tu botón
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionEmail(data.user?.email ?? null);
    });
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ID de precio de Stripe (mensual) – lo creas en Stripe “Products”
          priceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
          // adónde volver cuando paga o cancela
          successUrl: window.location.origin + "/upgrade?status=success",
          cancelUrl: window.location.origin + "/upgrade?status=cancel",
        }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url; // redirige a Stripe Checkout
    } catch (e) {
      console.error(e);
      alert("Error iniciando pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Hazte Premium</h1>
      <p className="text-muted-foreground mb-8">
        • Modelos premium • Chat ilimitado • Imágenes AI • Funciones especiales
        <br/>Plan mensual: <strong>9,99€/mes</strong> (puedes cancelar cuando quieras).
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold mb-2">Qué incluye</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Acceso a <strong>todas</strong> las companions premium</li>
            <li>Chats sin límite</li>
            <li>Eventos y funciones especiales</li>
            <li>Soporte prioritario</li>
          </ul>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold mb-2">Tu cuenta</h2>
          <p className="text-sm mb-4">
            {sessionEmail ? (
              <>Vas a suscribir <strong>{sessionEmail}</strong>.</>
            ) : (
              <>Inicia sesión para suscribirte.</>
            )}
          </p>
          <Button className="w-full" onClick={handleSubscribe} disabled={loading || !sessionEmail}>
            {loading ? "Redirigiendo…" : "Suscribirme por 9,99€/mes"}
          </Button>
        </div>
      </div>
    </div>
  );
}