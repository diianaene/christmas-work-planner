
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Vanzare = {
  id: number;
  data: string;
  suma: number;
};
export default function Vanzari() {
  const [suma, setSuma] = useState("");
  const [mesaj, setMesaj] = useState("");
const [salvare, setSalvare] = useState(false);
const [vanzariSalvate, setVanzariSalvate] = useState<Vanzare[]>([]);

  const [data, setData] = useState(() => {
  const acum = new Date();
  const an = acum.getFullYear();
  const luna = String(acum.getMonth() + 1).padStart(2, "0");
  const zi = String(acum.getDate()).padStart(2, "0");

  return `${an}-${luna}-${zi}`;
});
useEffect(() => {
  const vanzareExistenta = vanzariSalvate.find(
    (vanzare) => vanzare.data === data
  );

  if (vanzareExistenta) {
    setSuma(String(vanzareExistenta.suma));
  } else {
    setSuma("");
  }
}, [data, vanzariSalvate]);
  const vanzari = Number(suma) || 0;
  const comision = vanzari * 0.02;


async function stergeVanzare(id: number) {
  const confirmare = window.confirm(
    "Sigur vrei să ștergi vânzările acestei zile? 💗"
  );

  if (!confirmare) return;

  const { error } = await supabase
    .from("vanzari")
    .delete()
    .eq("id", id);

  if (error) {
    setMesaj("Eroare la ștergere: " + error.message);
    return;
  }

  setMesaj("Vânzările au fost șterse! 💗");
  await incarcaVanzari();
}

async function incarcaVanzari() {
  const { data: randuri, error } = await supabase
    .from("vanzari")
    .select("id, data, suma")
    .order("data", { ascending: false });

  if (error) {
    setMesaj("Eroare la încărcare: " + error.message);
    return;
  }

  setVanzariSalvate((randuri ?? []) as Vanzare[]);
}

useEffect(() => {
  void incarcaVanzari();
}, []);
async function salveazaVanzari() {
  if (!data || suma.trim() === "" || !Number.isFinite(Number(suma)) || Number(suma) < 0) {
    setMesaj("Introdu o dată și o sumă validă. ❤️");
    return;
  }

  setSalvare(true);
  setMesaj("");

  const { error } = await supabase
    .from("vanzari")
    .upsert(
      {
        data,
        suma: Number(suma),
      },
      { onConflict: "data" }
    );

  setSalvare(false);

  if (error) {
    setMesaj("Eroare la salvare: " + error.message);
    return;
  }

  setMesaj("Vânzările au fost salvate cu succes! 💗");
  await incarcaVanzari();
}

const lunaCurenta = data.slice(0, 7);

const totalVanzariLuna = vanzariSalvate
  .filter((vanzare) => vanzare.data.startsWith(lunaCurenta))
  .reduce((total, vanzare) => total + Number(vanzare.suma), 0);

const comisionLunar = totalVanzariLuna * 0.02;
  const formatLei = (valoare: number) =>
    valoare.toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <section className="rounded-3xl border border-pink-200 bg-white p-5 shadow-sm">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-[#842D4B]">
          💰 Vânzări & Câștiguri
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          💗
        </p>
      </div>

      <div className="rounded-2xl bg-pink-50 p-4">
        <label className="mb-4 block text-sm font-semibold text-[#842D4B]">
  📅 Data vânzărilor

  <input
    type="date"
    value={data}
    onChange={(e) => setData(e.target.value)}
    className="mt-2 w-full rounded-xl border border-pink-200 bg-white p-3 text-gray-900 outline-none focus:border-pink-400"
  />
</label>
        <label className="block text-sm font-semibold text-[#842D4B]">
          🛍️ Vânzările magazinului (lei)
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={suma}
          onChange={(e) => setSuma(e.target.value)}
          placeholder="Ex: 5000"
          className="mt-3 w-full rounded-xl border border-pink-200 bg-white p-3 text-gray-900 outline-none focus:border-pink-400"
        />
      </div>


<div className="mt-4">
  <button
    type="button"
    onClick={salveazaVanzari}
    disabled={salvare}
    className="w-full rounded-xl bg-[#842D4B] px-5 py-3 font-bold text-white shadow-md transition hover:bg-[#6D2340] disabled:opacity-50"
  >
    {salvare ? "Se salvează... 💗" : "💗 Salvează vânzările"}
  </button>

  {mesaj && (
    <p className="mt-3 text-center text-sm font-medium text-[#842D4B]">
      {mesaj}
    </p>
  )}
</div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
          <p className="text-lg font-bold text-rose-700">
            ❤️ Diana
          </p>
          <p className="mt-2 text-3xl font-extrabold text-rose-700">
            {formatLei(comision)} lei
          </p>
          <p className="mt-1 text-xs text-rose-500">
            2% din vânzările totale
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-lg font-bold text-emerald-700">
            💚 Iulia
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-700">
            {formatLei(comision)} lei
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            2% din vânzările totale
          </p>
        </div>
      </div>


<div className="mt-8 rounded-3xl border border-pink-200 bg-gradient-to-br from-[#FFF1F5] to-white p-5 shadow-sm">
  <div className="mb-5 text-center">
    <h3 className="text-xl font-bold text-[#842D4B]">
      💎 Câștigurile noastre lunare
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Luna {lunaCurenta.split("-").reverse().join(".")} 💗
    </p>
  </div>

  <div className="mb-4 rounded-2xl bg-white p-4 text-center shadow-sm">
    <p className="text-sm text-gray-500">
      🛍️ Total vânzări magazin
    </p>
    <p className="mt-1 text-2xl font-extrabold text-[#842D4B]">
      {formatLei(totalVanzariLuna)} lei
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
      <p className="text-lg font-bold text-rose-700">
        ❤️ Diana
      </p>
      <p className="mt-2 text-3xl font-extrabold text-rose-700">
        {formatLei(comisionLunar)} lei
      </p>
      <p className="mt-1 text-xs text-rose-500">
        Comision lunar · 2%
      </p>
    </div>

    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
      <p className="text-lg font-bold text-emerald-700">
        💚 Iulia
      </p>
      <p className="mt-2 text-3xl font-extrabold text-emerald-700">
        {formatLei(comisionLunar)} lei
      </p>
      <p className="mt-1 text-xs text-emerald-600">
        Comision lunar · 2%
      </p>
    </div>
  </div>
</div>

<details className="mt-8 rounded-2xl border border-pink-200 bg-pink-50/50 p-4">
  <summary className="cursor-pointer text-lg font-bold text-[#842D4B]">
    🎀 Vezi istoricul vânzărilor
  </summary>

  <div className="mt-5">

  {vanzariSalvate.length === 0 ? (
    <p className="rounded-2xl bg-pink-50 p-4 text-center text-sm text-gray-600">
      Încă nu avem vânzări salvate. 💗
    </p>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2">
      {vanzariSalvate.map((vanzare) => (
        <div
          key={vanzare.id}
          className="rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5 shadow-sm"
        >
          <p className="font-bold text-[#842D4B]">
            📅 {vanzare.data.split("-").reverse().join(".")}
          </p>

          <p className="mt-3 text-sm text-gray-600">
            🛍️ Vânzări magazin
          </p>
          <p className="text-2xl font-extrabold text-[#842D4B]">
            {formatLei(vanzare.suma)} lei
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-rose-100 p-3 text-center">
              <p className="text-sm font-semibold text-rose-700">
                ❤️ Diana
              </p>
              <p className="font-bold text-rose-800">
                +{formatLei(vanzare.suma * 0.02)} lei
              </p>
            </div>

            <div className="rounded-xl bg-emerald-100 p-3 text-center">
              <p className="text-sm font-semibold text-emerald-700">
                💚 Iulia
              </p>
              <p className="font-bold text-emerald-800">
                +{formatLei(vanzare.suma * 0.02)} lei
              </p>
            </div>
          </div>

<button
  type="button"
  onClick={() => stergeVanzare(vanzare.id)}
  className="mt-4 w-full rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
>
  🗑️ Șterge această zi
</button>

        </div>
      ))}
    </div>
  )}
  
</div>
</details>
      <p className="mt-5 text-center text-xs text-gray-500">
        ✨
      </p>
    </section>
  );
}
