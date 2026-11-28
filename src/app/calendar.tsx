
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import OrarZilnic from "./orar.zilnic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Persoana = "diana" | "iulia";

type Tura = {
  id?: number;
  inceput: string;
  sfarsit: string;
};

type ProgramZi = {
  diana: Tura[];
  iulia: Tura[];
};

type Program = Record<string, ProgramZi>;

const zile = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

const turaGoala = (): ProgramZi => ({
  diana: [],
  iulia: [],
});

function dataLocala(an: number, luna: number, zi: number) {
  const y = String(an);
  const m = String(luna + 1).padStart(2, "0");
  const d = String(zi).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type IntervalFacultate = {
  id: number;
  persoana: Persoana;
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
  const [salvare, setSalvare] = useState(false);
  const [incarcat, setIncarcat] = useState(false);

  async function incarcaFacultate() {
    const { data, error } = await supabase
      .from("facultate")
      .select("id, persoana, data, tip, ora_inceput, ora_sfarsit");

    if (error) {
      setMesaj("Eroare la încărcarea facultății: " + error.message);
      return;
    }

    setFacultate((data ?? []) as IntervalFacultate[]);
  }

  async function incarcaTure() {
    const { data, error } = await supabase
      .from("ture")
      .select("id, data, persoana, ora_inceput, ora_sfarsit")
      .order("ora_inceput");

    if (error) {
      setMesaj("Eroare Supabase: " + error.message);
      return false;
    }

    const programNou: Program = {};

    for (const tura of data ?? []) {
      const dataZi = tura.data;
      const persoana = tura.persoana as Persoana;

      if (!programNou[dataZi]) {
        programNou[dataZi] = turaGoala();
      }

      programNou[dataZi][persoana].push({
        id: tura.id,
        inceput: tura.ora_inceput.slice(0, 5),
        sfarsit: tura.ora_sfarsit.slice(0, 5),
      });
    }

    setProgram(programNou);
    setIncarcat(true);
    return true;
  }

  useEffect(() => {
    void incarcaTure();
    void incarcaFacultate();

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
          void incarcaTure();
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

    const lunaNoua = `${dataNoua.getFullYear()}-${String(
      dataNoua.getMonth() + 1
    ).padStart(2, "0")}`;

    onLunaChange?.(lunaNoua);
  }

  function selecteazaZi(zi: number) {
    const data = dataLocala(anul, luna, zi);

    setZiSelectata(data);

    const programZi = program[data] ?? turaGoala();

    setFormular({
      diana: programZi.diana.map((tura) => ({ ...tura })),
      iulia: programZi.iulia.map((tura) => ({ ...tura })),
    });

    setMesaj("");
  }

  function modificaTura(
    persoana: Persoana,
    index: number,
    camp: "inceput" | "sfarsit",
    valoare: string
  ) {
    setFormular((anterior) => ({
      ...anterior,
      [persoana]: anterior[persoana].map((tura, i) =>
        i === index
          ? { ...tura, [camp]: valoare }
          : tura
      ),
    }));
  }

  function adaugaInterval(persoana: Persoana) {
    setFormular((anterior) => ({
      ...anterior,
      [persoana]: [
        ...anterior[persoana],
        { inceput: "", sfarsit: "" },
      ],
    }));
  }

  function eliminaInterval(
    persoana: Persoana,
    index: number
  ) {
    setFormular((anterior) => ({
      ...anterior,
      [persoana]: anterior[persoana].filter(
        (_, i) => i !== index
      ),
    }));
  }

  async function salveaza() {
    if (!ziSelectata || salvare || !incarcat) return;

    setMesaj("");

    const intervale: {
      id: number | null;
      persoana: Persoana;
      ora_inceput: string;
      ora_sfarsit: string;
    }[] = [];

    for (const persoana of ["diana", "iulia"] as const) {
      const ture = [...formular[persoana]].sort(
        (a, b) => a.inceput.localeCompare(b.inceput)
      );

      for (let i = 0; i < ture.length; i++) {
        const tura = ture[i];

        if (
          !tura.inceput ||
          !tura.sfarsit ||
          tura.inceput < "10:00" ||
          tura.sfarsit > "22:00" ||
          tura.inceput >= tura.sfarsit
        ) {
          setMesaj(
            "Completează intervalele corect, între 10:00 și 22:00."
          );
          return;
        }

        if (
          i > 0 &&
          ture[i - 1].sfarsit > tura.inceput
        ) {
          setMesaj(
            "Intervalele aceleiași persoane nu se pot suprapune."
          );
          return;
        }

        intervale.push({
          id: tura.id ?? null,
          persoana,
          ora_inceput: tura.inceput,
          ora_sfarsit: tura.sfarsit,
        });
      }
    }

    const tureEliminate = [
      ...(program[ziSelectata]?.diana ?? []),
      ...(program[ziSelectata]?.iulia ?? []),
    ].some(
      (tura) =>
        tura.id !== undefined &&
        !intervale.some((interval) => interval.id === tura.id)
    );

    if (
      tureEliminate &&
      !window.confirm("Sigur vrei să ștergi intervalele eliminate?")
    ) {
      return;
    }

    setSalvare(true);

    try {
      const { error } = await supabase.rpc(
        "salveaza_program_zi",
        {
          p_data: ziSelectata,
          p_intervale: intervale,
        }
      );

      if (error) {
        setMesaj("Eroare la salvare: " + error.message);
        return;
      }

      const succes = await incarcaTure();

      onProgramChange?.();

      if (!succes) {
        setZiSelectata(null);
        setMesaj("Programul a fost salvat, dar calendarul nu s-a putut reîncărca.");
        return;
      }

      setZiSelectata(null);
      setMesaj("Program salvat online cu succes! ❤️☁️");
    } catch (error) {
      setMesaj("Eroare: " + String(error));
    } finally {
      setSalvare(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[#E8B8C8] bg-[#FFF9FB] p-6 shadow-lg">

      <div className="mb-5 flex items-center justify-between gap-3">

        <button
          type="button"
          disabled={salvare}
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
          disabled={salvare}
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
              disabled={salvare || !incarcat}
              onClick={() => selecteazaZi(zi)}
              className={`min-h-24 rounded-xl border p-2 text-left ${
                ziSelectata === data
                  ? "border-red-600 bg-red-100"
                  : "border-rose-100 bg-rose-50 hover:bg-rose-100"
              }`}
            >
              <p className="font-bold text-gray-800">
                {zi}
              </p>

              {(["diana", "iulia"] as const).flatMap(
                (persoana) =>
                  (tura?.[persoana] ?? []).map(
                    (interval, index) => (
                      <p
                        key={`${persoana}-${interval.id ?? index}`}
                        className={`mt-1 text-xs ${
                          persoana === "diana"
                            ? "text-red-700"
                            : "text-green-700"
                        }`}
                      >
                        {persoana === "diana" ? "Diana" : "Iulia"}:{" "}
                        {interval.inceput}–{interval.sfarsit}
                      </p>
                    )
                  )
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
        disabled={salvare}
        onClick={() => void incarcaTure()}
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
            <div
              key={persoana}
              className={`mb-5 rounded-2xl border p-4 ${
                persoana === "diana"
                  ? "border-pink-200 bg-[#FCE4EC]"
                  : "border-green-200 bg-[#E5F1E9]"
              }`}
            >

              <h5
                className={`mb-3 font-bold ${
                  persoana === "diana"
                    ? "text-red-700"
                    : "text-green-700"
                }`}
              >
                {persoana === "diana" ? "❤️ Diana" : "💚 Iulia"}
              </h5>

              {formular[persoana].length === 0 && (
                <p className="mb-3 text-sm text-gray-500">
                  Nu există intervale de muncă.
                </p>
              )}

              {formular[persoana].map((interval, index) => (
                <div
                  key={interval.id ?? `nou-${index}`}
                  className="mb-3 rounded-xl border border-rose-200 bg-white p-3"
                >

                  <p className="mb-2 text-sm font-semibold text-gray-600">
                    Intervalul {index + 1}
                  </p>

                  <div className="grid grid-cols-2 gap-3">

                    <label className="text-sm text-gray-700">
                      Ora de început

                      <input
                        type="time"
                        min="10:00"
                        max="22:00"
                        value={interval.inceput}
                        disabled={salvare}
                        onChange={(e) =>
                          modificaTura(
                            persoana,
                            index,
                            "inceput",
                            e.target.value
                          )
                        }
                        className="mt-1 w-full rounded-lg border bg-white p-2 text-gray-900"
                      />

                    </label>

                    <label className="text-sm text-gray-700">
                      Ora de sfârșit

                      <input
                        type="time"
                        min="10:00"
                        max="22:00"
                        value={interval.sfarsit}
                        disabled={salvare}
                        onChange={(e) =>
                          modificaTura(
                            persoana,
                            index,
                            "sfarsit",
                            e.target.value
                          )
                        }
                        className="mt-1 w-full rounded-lg border bg-white p-2 text-gray-900"
                      />

                    </label>

                  </div>

                  <button
                    type="button"
                    disabled={salvare}
                    onClick={() =>
                      eliminaInterval(persoana, index)
                    }
                    className="mt-3 text-sm font-semibold text-red-700 hover:text-red-900"
                  >
                    🗑️ Elimină intervalul
                  </button>

                </div>
              ))}

              <button
                type="button"
                disabled={salvare}
                onClick={() => adaugaInterval(persoana)}
                className={`rounded-xl border border-dashed bg-white px-4 py-2 font-semibold ${
                  persoana === "diana"
                    ? "border-rose-400 text-[#842D4B]"
                    : "border-green-400 text-green-800"
                }`}
              >
                ＋ Adaugă interval
              </button>

            </div>
          ))}

          <button
            type="button"
            onClick={salveaza}
            disabled={salvare || !incarcat}
            className="rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {salvare
              ? "Se salvează..."
              : "💾 Salvează programul"}
          </button>

        </div>
      )}

      {mesaj && (
        <p className="mt-3 text-sm font-semibold text-gray-700">
          {mesaj}
        </p>
      )}

    </section>
  );
}
