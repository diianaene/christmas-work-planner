
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Tura = {
  persoana: "diana" | "iulia";
  ora_inceput: string;
  ora_sfarsit: string;
};

function calculeazaOre(inceput: string, sfarsit: string) {
  const [h1, m1] = inceput.split(":").map(Number);
  const [h2, m2] = sfarsit.split(":").map(Number);

  return (h2 * 60 + m2 - h1 * 60 - m1) / 60;
}

export default function Statistici({
  actualizare,
  lunaSelectata,
}: {
  actualizare: number;
  lunaSelectata: string;
}) {
  const [oreDiana, setOreDiana] = useState(0);
  const [oreIulia, setOreIulia] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState("");


  useEffect(() => {
    async function incarcaStatistici() {
     const [an, luna] = lunaSelectata.split("-").map(Number);

const primaZi = `${an}-${String(luna).padStart(2, "0")}-01`;

const lunaUrmatoare = new Date(
  Date.UTC(an, luna, 1)
).toISOString().slice(0, 10);

const { data, error } = await supabase
  .from("ture")
  .select("persoana, ora_inceput, ora_sfarsit")
  .gte("data", primaZi)
  .lt("data", lunaUrmatoare);

      if (error) {
        setEroare(error.message);
        setLoading(false);
        return;
      }

      let diana = 0;
      let iulia = 0;

      for (const tura of (data ?? []) as Tura[]) {
        const ore = calculeazaOre(
          tura.ora_inceput,
          tura.ora_sfarsit
        );

        if (tura.persoana === "diana") {
          diana += ore;
        } else if (tura.persoana === "iulia") {
          iulia += ore;
        }
      }

      setOreDiana(diana);
      setOreIulia(iulia);
      setLoading(false);
    }

    void incarcaStatistici();
}, [actualizare, lunaSelectata]);

  const diferenta = Math.abs(oreDiana - oreIulia);

  if (loading) {
    return <p className="mb-6 text-gray-600">Se calculează orele...</p>;
  }

  if (eroare) {
    return <p className="mb-6 text-red-700">Eroare: {eroare}</p>;
  }

return (
  <div className="mb-6">
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-[#F4B8CA] bg-[#FCE4EC] p-6 shadow-md">
       <p className="font-semibold text-[#9D174D]">❤️ Ore Diana</p>
        <p className="mt-2 text-3xl font-bold text-[#9D174D]">
          {oreDiana.toLocaleString("ro-RO", {
            maximumFractionDigits: 2,
          })} 
        </p>
      </div>

     <div className="rounded-2xl border border-[#B8D8C4] bg-[#E5F1E9] p-6 shadow-md">
        <p className="font-semibold text-[#166534]">💚 Ore Iulia</p>
        <p className="mt-2 text-3xl font-bold text-[#166534]">
          {oreIulia.toLocaleString("ro-RO", {
            maximumFractionDigits: 2,
          })} h
        </p>
      </div>

     <div className="rounded-2xl border border-[#E8D2A5] bg-[#FFF0D5] p-6 shadow-md">
        <p className="font-semibold text-[#92400E]">⚖️ Diferență de ore</p>
        <p className="mt-2 text-3xl font-bold text-[#92400E]">
          {diferenta.toLocaleString("ro-RO", {
            maximumFractionDigits: 2,
          })} h
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {diferenta === 0
            ? "Aveți același număr de ore ❤️"
            : oreDiana > oreIulia
              ? "Diana are mai multe ore."
              : "Iulia are mai multe ore."}
        </p>
      </div>
    </div>
  </div>
);
}