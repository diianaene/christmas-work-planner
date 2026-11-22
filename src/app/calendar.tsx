
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import OrarZilnic from "./orar.zilnic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
type Tura = {
  inceput: string;
  sfarsit: string;
};

type ProgramZi = {
  diana: Tura;
  iulia: Tura;
};

type Program = Record<string, ProgramZi>;

const zile = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

const turaGoala = (): ProgramZi => ({
  diana: { inceput: "", sfarsit: "" },
  iulia: { inceput: "", sfarsit: "" },
});

function dataLocala(an: number, luna: number, zi: number) {
  const y = String(an);
  const m = String(luna + 1).padStart(2, "0");
  const d = String(zi).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
type IntervalFacultate = {
  id: number;
  persoana: "diana" | "iulia";
  data: string;
  tip: "facultate" | "ocupata";
  ora_inceput: string;
  ora_sfarsit: string;
};
export default function Calendar({
  onProgramChange,
  onLunaChange,
}: {
  onProgramChange?: () => void;
  onLunaChange?: (luna: string) => void;
}) {
  const [luna, setLuna] = useState(new Date().getMonth());
  const [anul, setAnul] = useState(new Date().getFullYear());
  const [program, setProgram] = useState<Program>({});
  const [facultate, setFacultate] = useState<IntervalFacultate[]>([]);
  const [ziSelectata, setZiSelectata] = useState<string | null>(null);
  const [formular, setFormular] = useState<ProgramZi>(turaGoala());
  const [mesaj, setMesaj] = useState("");

async function incarcaFacultate() {
  const { data, error } = await supabase
    .from("facultate")
    .select("id, persoana, data, tip, ora_inceput, ora_sfarsit")

  if (error) {
    setMesaj("Eroare la încărcarea facultății: " + error.message);
    return;
  }

  setFacultate((data ?? []) as IntervalFacultate[]);
}

async function incarcaTure() {
  const { data, error } = await supabase
    .from("ture")
    .select("data, persoana, ora_inceput, ora_sfarsit");

  if (error) {
    setMesaj("Eroare Supabase: " + error.message);
    return;
  }

  const programNou: Program = {};

  for (const tura of data ?? []) {
    const dataZi = tura.data;
    const persoana = tura.persoana as "diana" | "iulia";

    if (!programNou[dataZi]) {
      programNou[dataZi] = turaGoala();
    }

    programNou[dataZi][persoana] = {
      inceput: tura.ora_inceput.slice(0, 5),
      sfarsit: tura.ora_sfarsit.slice(0, 5),
    };
  }

  setProgram(programNou);

  console.log("Ture încărcate din Supabase:", programNou);
}



useEffect(() => {
  void incarcaTure();
  void incarcaFacultate();
  // Ascultam modificarile din Supabase.
  const canal = supabase
    .channel("actualizari-ture")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ture",
      },
      () => {
        // Reincarcam calendarul.
        void incarcaTure();

        // Actualizam si statisticile.
        onProgramChange?.();
      }
    )
    .subscribe();

const canalFacultate = supabase
  .channel("actualizari-facultate")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "facultate",
    },
    () => {
      void incarcaFacultate();
    }
  )
  .subscribe();


  // Oprim ascultarea cand componenta se inchide.
  return () => {
    void supabase.removeChannel(canal);
    void supabase.removeChannel(canalFacultate);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const primaZi = (new Date(anul, luna, 1).getDay() + 6) % 7;
  const numarZile = new Date(anul, luna + 1, 0).getDate();

  const numeLuna = new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric",
  }).format(new Date(anul, luna, 1));

  
function schimbaLuna(directie: number) {
  const dataNoua = new Date(anul, luna + directie, 1);

  setLuna(dataNoua.getMonth());
  setAnul(dataNoua.getFullYear());
  setZiSelectata(null);
  setMesaj("");

  // Anuntam pagina principala ca luna s-a schimbat.
  const lunaNoua = `${dataNoua.getFullYear()}-${String(
    dataNoua.getMonth() + 1
  ).padStart(2, "0")}`;

  onLunaChange?.(lunaNoua);
}


  function selecteazaZi(zi: number) {
    const data = dataLocala(anul, luna, zi);
    setZiSelectata(data);
    setFormular(program[data] ?? turaGoala());
    setMesaj("");
  }

  function modificaTura(
    persoana: "diana" | "iulia",
    camp: "inceput" | "sfarsit",
    valoare: string
  ) {
    setFormular((anterior) => ({
      ...anterior,
      [persoana]: {
        ...anterior[persoana],
        [camp]: valoare,
      },
    }));
  }


async function salveaza() {
  if (!ziSelectata) return;

  setMesaj("");

  for (const persoana of ["diana", "iulia"] as const) {
    const { inceput, sfarsit } = formular[persoana];

    if ((inceput && !sfarsit) || (!inceput && sfarsit)) {
      setMesaj("Completează ambele ore sau lasă ambele câmpuri goale.");
      return;
    }

    if (inceput && sfarsit) {
      if (
        inceput < "10:00" ||
        sfarsit > "22:00" ||
        inceput >= sfarsit
      ) {
        setMesaj("Turele trebuie să fie între 10:00 și 22:00.");
        return;
      }
    }
  }

 

  for (const persoana of ["diana", "iulia"] as const) {
    const { inceput, sfarsit } = formular[persoana];

    if (inceput && sfarsit) {
      const { error } = await supabase.from("ture").upsert(
        {
          data: ziSelectata,
          persoana,
          ora_inceput: inceput,
          ora_sfarsit: sfarsit,
        },
        { onConflict: "data,persoana" }
      );

      if (error) {
        setMesaj("Eroare la salvare: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("ture")
        .delete()
        .eq("data", ziSelectata)
        .eq("persoana", persoana);

      if (error) {
        setMesaj("Eroare la ștergere: " + error.message);
        return;
      }
    }
  }

  await incarcaTure();
  setMesaj("Program salvat online cu succes! ❤️☁️");
  onProgramChange?.();
}


  return (
   <section className="rounded-3xl border border-[#E8B8C8] bg-[#FFF9FB] p-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => schimbaLuna(-1)}
         className="rounded-xl bg-[#842D4B] px-4 py-2 font-bold text-white shadow-sm transition hover:bg-[#A43B60]"
        >
          ←
        </button>

        <h3 className="text-center text-xl font-bold capitalize text-red-800">
          📅 {numeLuna}
        </h3>

        <button
          type="button"
          onClick={() => schimbaLuna(1)}
         className="rounded-xl bg-[#842D4B] px-4 py-2 font-bold text-white shadow-sm transition hover:bg-[#A43B60]"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {zile.map((zi) => (
          <div
            key={zi}
            className="text-center text-xs font-bold text-gray-600"
          >
            {zi}
          </div>
        ))}

        {Array.from({ length: primaZi }, (_, index) => (
          <div key={`gol-${index}`} />
        ))}

        {Array.from({ length: numarZile }, (_, index) => {
          const zi = index + 1;
          const data = dataLocala(anul, luna, zi);
          const tura = program[data];
          const facultateZi = facultate.filter(
  (interval) => interval.data === data
);

          return (
            <button
              type="button"
              key={data}
              onClick={() => selecteazaZi(zi)}
              className={`min-h-24 rounded-xl border p-2 text-left ${
                ziSelectata === data
                  ? "border-red-600 bg-red-100"
                  : "border-rose-100 bg-rose-50 hover:bg-rose-100"
              }`}
            >
              <p className="font-bold text-gray-800">{zi}</p>

              {tura?.diana.inceput && (
                <p className="mt-1 text-xs text-red-700">
                  Diana: {tura.diana.inceput}–{tura.diana.sfarsit}
                </p>
              )}

              {tura?.iulia.inceput && (
                <p className="mt-1 text-xs text-green-700">
                  Iulia: {tura.iulia.inceput}–{tura.iulia.sfarsit}
                </p>
              )}

{facultateZi.map((interval) => (
  <p
    key={interval.id}
    className={`mt-1 text-xs ${
      interval.persoana === "diana"
        ? "text-blue-700"
        : "text-purple-700"
    }`}
  >
    {interval.tip === "ocupata" ? "🔒" : "🎓"}{" "}
{interval.persoana === "diana" ? "Diana" : "Iulia"}:{" "}
    {interval.ora_inceput.slice(0, 5)}–
    {interval.ora_sfarsit.slice(0, 5)}
  </p>
))}

            </button>
          );
        })}
      </div>

<button
  type="button"
  onClick={incarcaTure}
  className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
>
  ☁️ Testează conexiunea Supabase
</button>
      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        <span className="text-red-700">● Diana</span>
        <span className="text-green-700">● Iulia</span>
      </div>

      {ziSelectata && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5">
          <h4 className="mb-5 text-lg font-bold text-gray-800">
            Program pentru {ziSelectata}
          </h4>
          <OrarZilnic
  zi={ziSelectata}
  program={program}
  facultate={facultate}
/>

          {(["diana", "iulia"] as const).map((persoana) => (
            <div key={persoana} className="mb-5">
              <h5
                className={`mb-2 font-bold ${
                  persoana === "diana" ? "text-red-700" : "text-green-700"
                }`}
              >
                {persoana === "diana" ? "❤️ Diana" : "💚 Iulia"}
              </h5>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-gray-700">
                  Ora de început
                  <input
                    type="time"
                    value={formular[persoana].inceput}
                    onChange={(e) =>
                      modificaTura(persoana, "inceput", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border bg-white p-2 text-gray-900"
                  />
                </label>

                <label className="text-sm text-gray-700">
                  Ora de sfârșit
                  <input
                    type="time"
                    value={formular[persoana].sfarsit}
                    onChange={(e) =>
                      modificaTura(persoana, "sfarsit", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border bg-white p-2 text-gray-900"
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={salveaza}
            className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800"
          >
            💾 Salvează programul
          </button>

          {mesaj && (
            <p className="mt-3 text-sm text-gray-700">{mesaj}</p>
          )}
        </div>
      )}
    </section>
  );
}
