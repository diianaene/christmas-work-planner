
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type IntervalFacultate = {
  id: number;
  persoana: "diana" | "iulia";
  data: string;
  tip: "facultate" | "ocupata";
  ora_inceput: string;
  ora_sfarsit: string;
};

export default function Facultate() {
  const [persoana, setPersoana] = useState<"diana" | "iulia">("diana");
  const [data, setData] = useState("");
  const [inceput, setInceput] = useState("");
  const [sfarsit, setSfarsit] = useState("");
  const [tip, setTip] = useState<"facultate" | "ocupata">("facultate");

  const [intervale, setIntervale] = useState<IntervalFacultate[]>([]);
  const [mesaj, setMesaj] = useState("");
  const [loading, setLoading] = useState(false);

  async function incarcaIntervale() {
    const { data: randuri, error } = await supabase
      .from("facultate")
      .select("id, persoana, data, tip, ora_inceput, ora_sfarsit")
      .order("data", { ascending: true })
      .order("ora_inceput", { ascending: true });

    if (error) {
      setMesaj("Eroare la încărcare: " + error.message);
      return;
    }

    setIntervale((randuri ?? []) as IntervalFacultate[]);
  }

  useEffect(() => {
    void incarcaIntervale();
  }, []);

  async function salveaza(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMesaj("");

    if (inceput >= sfarsit) {
      setMesaj("Ora de sfârșit trebuie să fie după ora de început.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("facultate").insert({
  persoana,
  data,
  tip,
  ora_inceput: inceput,
  ora_sfarsit: sfarsit,
});

    setLoading(false);

    if (error) {
      setMesaj("Eroare la salvare: " + error.message);
      return;
    }

    setMesaj("Interval salvat cu succes! ❤️");
    setInceput("");
    setSfarsit("");

    await incarcaIntervale();
  }

  async function sterge(id: number) {
    if (!window.confirm("Sigur vrei să ștergi acest interval?")) {
      return;
    }

    const { error } = await supabase
      .from("facultate")
      .delete()
      .eq("id", id);

    if (error) {
      setMesaj("Eroare la ștergere: " + error.message);
      return;
    }

    setMesaj("Interval șters cu succes.");
    await incarcaIntervale();
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      <h3 className="mb-2 text-2xl font-bold text-red-700">
        📅 Disponibilitate
      </h3>

      <p className="mb-6 text-gray-600">
        Adăugați intervalele în care sunteți ocupate.
      </p>

      <form
        onSubmit={salveaza}
        className="grid gap-4 md:grid-cols-2"
      >
        <label className="text-sm font-medium text-gray-700">
          Persoana
          <select
            value={persoana}
            onChange={(e) =>
              setPersoana(e.target.value as "diana" | "iulia")
            }
            className="mt-1 w-full rounded-xl border p-3 text-gray-900"
          >
            <option value="diana">❤️ Diana</option>
            <option value="iulia">💚 Iulia</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
  Tipul intervalului
  <select
    value={tip}
    onChange={(e) =>
      setTip(e.target.value as "facultate" | "ocupata")
    }
    className="mt-1 w-full rounded-xl border p-3 text-gray-900"
  >
    <option value="facultate">🎓 Facultate</option>
    <option value="ocupata">🔒 Ocupată</option>
  </select>
</label>

        <label className="text-sm font-medium text-gray-700">
          Data
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border p-3 text-gray-900"
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          De la ora
          <input
            type="time"
            value={inceput}
            onChange={(e) => setInceput(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border p-3 text-gray-900"
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Până la ora
          <input
            type="time"
            value={sfarsit}
            onChange={(e) => setSfarsit(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border p-3 text-gray-900"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-800 disabled:opacity-50 md:col-span-2"
        >
          {loading ? "Se salvează..." : "💾 Salvează intervalul"}
        </button>
      </form>

      {mesaj && (
        <p className="mt-4 text-sm text-gray-700">{mesaj}</p>
      )}

      <h4 className="mb-4 mt-8 text-xl font-bold text-gray-800">
        Intervale ocupate
      </h4>
      <details className="mt-4">
  <summary className="cursor-pointer rounded-xl border border-[#E8B8C8] bg-[#FCE4EC] px-5 py-3 font-semibold text-[#842D4B] hover:bg-[#F9DDE7]">
    📋 Vezi intervalele salvate
  </summary>

      {intervale.length === 0 ? (
        <p className="text-gray-500">
          Nu există încă intervale salvate.
        </p>
      ) : (
        <div className="space-y-3">
          {intervale.map((interval) => (
            <div
              key={interval.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4"
            >
              <div>
                <p
                  className={`font-bold ${
                    interval.persoana === "diana"
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {interval.persoana === "diana"
                    ? "❤️ Diana"
                    : "💚 Iulia"}
                </p>

                <p className="text-sm text-gray-800">
                  {interval.data} ·{" "}
                  {interval.ora_inceput.slice(0, 5)}–
                  {interval.ora_sfarsit.slice(0, 5)}
                </p>
                <p className="mt-1 text-sm font-medium text-[#842D4B]">
  {interval.tip === "ocupata" ? "🔒 Ocupată" : "🎓 Facultate"}
</p>
              </div>

              <button
                type="button"
                onClick={() => sterge(interval.id)}
                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-200"
              >
                Șterge
              </button>
            </div>
          ))}
        </div>
            )}
      </details>
    </section>
  );
}
