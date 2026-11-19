
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import Calendar from "./calendar";
import Statistici from "./statistici";
import Facultate from "./facultate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function Home() {
  const [utilizator, setUtilizator] = useState<User | null>(null);
  const [verificare, setVerificare] = useState(true);
  const [actualizare, setActualizare] = useState(0);
  const [lunaComuna, setLunaComuna] = useState(
  () => {
    const acum = new Date();
    return `${acum.getFullYear()}-${String(
      acum.getMonth() + 1
    ).padStart(2, "0")}`;
  }
);
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [inregistrare, setInregistrare] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificam daca exista deja un utilizator conectat.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUtilizator(data.user);
      setVerificare(false);
    });

    // Detectam conectarea si deconectarea.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUtilizator(session?.user ?? null);
        setVerificare(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Conectare sau inregistrare.
  async function autentificare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMesaj("");

    try {
      if (inregistrare) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: parola,
        });

        if (error) {
          setMesaj(error.message);
        } else if (!data.session) {
          setMesaj("Verifica emailul pentru confirmarea contului!");
        } else {
          setMesaj("Cont creat cu succes!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: parola,
        });

        if (error) {
          setMesaj(error.message);
        }
      }
    } catch {
      setMesaj("A aparut o eroare. Incearca din nou.");
    } finally {
      setLoading(false);
    }
  }

  // Deconectare.
  async function deconectare() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
    }
  }

  if (verificare) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-rose-50 text-gray-800">
        Se verifica autentificarea...
      </main>
    );
  }

  // Pagina de conectare.
  if (!utilizator) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-rose-50 p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="mb-3 text-center text-3xl font-bold text-red-800">
            🎄 Christmas Work Planner
          </h1>

          <p className="mb-8 text-center text-gray-600">
            Programul nostru de munca si facultate ❤️
          </p>

          <h2 className="mb-5 text-center text-xl font-semibold text-gray-800">
            {inregistrare ? "Creeaza cont" : "Conectare"}
          </h2>

          <form onSubmit={autentificare} className="space-y-4">
            <input
              type="email"
              placeholder="Adresa de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 p-3 text-gray-900"
            />

            <input
              type="password"
              placeholder="Parola"
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-300 p-3 text-gray-900"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-700 p-3 font-bold text-white hover:bg-red-800 disabled:opacity-50"
            >
              {loading
                ? "Se incarca..."
                : inregistrare
                ? "Inregistrare"
                : "Conectare"}
            </button>
          </form>

          {mesaj && (
            <p className="mt-4 text-center text-sm text-gray-700">
              {mesaj}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setInregistrare(!inregistrare);
              setMesaj("");
            }}
            className="mt-6 w-full text-center text-red-700 underline"
          >
            {inregistrare
              ? "Ai deja cont? Conecteaza-te"
              : "Nu ai cont? Inregistreaza-te"}
          </button>
        </div>
      </main>
    );
  }

  // Pagina principala dupa autentificare.
  return (
   <main className="min-h-screen bg-gradient-to-br from-[#FFF8F6] via-[#FCE7EF] to-[#F9DDE7] p-6 text-gray-800">
      <div className="mx-auto max-w-5xl">
       
<header className="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-[#D8A7B1] bg-[#842D4B] p-6 shadow-xl md:p-8">
  <div>
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#E8C58C]">
      ✨ Our Christmas Season ✨
    </p>

    <h1 className="text-3xl font-bold text-white md:text-4xl">
      🎄 Diana & Iulia
    </h1>

    <p className="mt-2 text-sm text-[#FCE7EF]">
      Christmas Work Planner 🎀
    </p>

    <p className="mt-3 text-xs text-[#F9DDE7]">
      Bine ai venit, {utilizator.email}!
    </p>
  </div>

  <button
    type="button"
    onClick={deconectare}
    className="rounded-xl border border-[#F8DDE5] bg-[#FFF8F6] px-5 py-3 font-semibold text-[#842D4B] shadow-sm transition hover:bg-[#FCE7EF]"
  >
    Deconectare ♡
  </button>
</header>


        <h2 className="mb-5 text-2xl font-bold text-red-900">
          Panoul nostru de organizare ❤️
        </h2>

       <Statistici
  actualizare={actualizare}
  lunaSelectata={lunaComuna}
/>
<div className="mb-6">
  
<Calendar
  onProgramChange={() =>
    setActualizare((valoare) => valoare + 1)
  }
  onLunaChange={setLunaComuna}
/>

<div className="mb-6">
  <Facultate />
</div>
</div>
      
        <footer className="mt-12 text-center text-gray-500">
          Made with ❤️ for our Christmas season
        </footer>
      </div>
    </main>
  );
}
