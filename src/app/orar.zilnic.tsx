
"use client";

type Persoana = "diana" | "iulia";

type Tura = {
  inceput: string;
  sfarsit: string;
};

type ProgramZi = {
  diana: Tura;
  iulia: Tura;
};

type Program = Record<string, ProgramZi>;

type IntervalFacultate = {
  id: number;
  persoana: Persoana;
  data: string;
  tip: "facultate" | "ocupata";
  ora_inceput: string;
  ora_sfarsit: string;
};

type Props = {
  zi: string;
  program: Program;
  facultate: IntervalFacultate[];
};

function inMinute(ora: string): number {
  const [ore, minute] = ora.split(":").map(Number);
  return ore * 60 + minute;
}

function esteInInterval(
  ora: number,
  inceput: string,
  sfarsit: string
): boolean {
  if (!inceput || !sfarsit) return false;

  return ora >= inMinute(inceput) &&
    ora < inMinute(sfarsit);
}

export default function OrarZilnic({
  zi,
  program,
  facultate,
}: Props) {
  const ore = Array.from({ length: 24 }, (_, i) => i);

  const programZi = program[zi];

  function activitati(
    persoana: Persoana,
    ora: number
  ) {
    const inceputOra = ora * 60;
    const sfarsitOra = inceputOra + 60;

    const tura = programZi?.[persoana];

    const laMunca =
      !!tura?.inceput &&
      !!tura?.sfarsit &&
      inMinute(tura.inceput) < sfarsitOra &&
      inMinute(tura.sfarsit) > inceputOra;

    const laFacultate = facultate.some(
      (interval) =>
        interval.data === zi &&
        interval.persoana === persoana &&
        interval.tip === "facultate" &&
        inMinute(interval.ora_inceput) < sfarsitOra &&
        inMinute(interval.ora_sfarsit) > inceputOra
    );
    const esteOcupata = facultate.some(
  (interval) =>
    interval.data === zi &&
    interval.persoana === persoana &&
    interval.tip === "ocupata" &&
    inMinute(interval.ora_inceput) < sfarsitOra &&
    inMinute(interval.ora_sfarsit) > inceputOra
);

    return { laMunca, laFacultate, esteOcupata };
  }

  function afiseazaActivitati(
    persoana: Persoana,
    ora: number
  ) {
    const { laMunca, laFacultate, esteOcupata } =
  activitati(persoana, ora);

    if (!laMunca && !laFacultate) {
      return (
        <span className="text-gray-400">
          Liberă
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {laFacultate && (
          <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
            🎓 Facultate (
{facultate
  .filter(
    (interval) =>
      interval.data === zi &&
      interval.persoana === persoana &&
            interval.tip === "facultate" &&
      inMinute(interval.ora_inceput) < (ora + 1) * 60 &&
      inMinute(interval.ora_sfarsit) > ora * 60
  )
  .map(
    (interval) =>
      `${interval.ora_inceput.slice(0, 5)} - ${interval.ora_sfarsit.slice(0, 5)}`
  )
  .join(", ")}
)
          </span>
        )}

{esteOcupata && (
  <span className="rounded-lg bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
    🔒 Ocupată (
    {facultate
      .filter(
        (interval) =>
          interval.data === zi &&
          interval.persoana === persoana &&
          interval.tip === "ocupata" &&
          inMinute(interval.ora_inceput) < (ora + 1) * 60 &&
          inMinute(interval.ora_sfarsit) > ora * 60
      )
      .map(
        (interval) =>
          `${interval.ora_inceput.slice(0, 5)} - ${interval.ora_sfarsit.slice(0, 5)}`
      )
      .join(", ")}
    )
  </span>
)}


        {laMunca && (
          <span
            className={`rounded-lg px-2 py-1 text-xs font-semibold ${
              persoana === "diana"
                ? "bg-pink-100 text-pink-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            🎄 Muncă ({programZi?.[persoana]?.inceput} - {programZi?.[persoana]?.sfarsit})
          </span>
        )}
      </div>
    );
  }

  const oreActive = ore.filter((ora) =>
    (["diana", "iulia"] as const).some(
      (persoana) => {
        const activitate = activitati(persoana, ora);

        return (
          activitate.laMunca ||
          activitate.laFacultate
        );
      }
    )
  );

  const primaOra =
    oreActive.length > 0
      ? Math.max(0, Math.min(...oreActive) - 1)
      : 8;

  const ultimaOra =
    oreActive.length > 0
      ? Math.min(23, Math.max(...oreActive) + 1)
      : 21;

  const oreAfisate = ore.filter(
    (ora) => ora >= primaOra && ora <= ultimaOra
  );

  return (
    <div className="mb-6 rounded-2xl border border-[#E8B8C8] bg-[#FFF8FB] p-5 shadow-md">
      <h3 className="mb-2 text-xl font-bold text-[#842D4B]">
        🎀 Orarul zilei
      </h3>

      <p className="mb-5 text-sm text-gray-600">
        📅 {zi}
      </p>

      <div className="grid grid-cols-[65px_1fr_1fr] gap-2">
        <div className="rounded-lg bg-gray-100 p-2 text-center text-sm font-bold">
          Ora
        </div>

        <div className="rounded-lg bg-[#FCE4EC] p-2 text-center text-sm font-bold text-[#9D174D]">
          ❤️ Diana
        </div>

        <div className="rounded-lg bg-[#E5F1E9] p-2 text-center text-sm font-bold text-[#166534]">
          💚 Iulia
        </div>

        {oreAfisate.map((ora) => (
          <div key={ora} className="contents">
            <div className="flex items-center justify-center rounded-lg bg-gray-50 p-2 text-xs font-semibold text-gray-600">
              {String(ora).padStart(2, "0")}:00
            </div>

            <div className="min-h-14 rounded-lg border border-pink-100 bg-white p-2 text-center">
              {afiseazaActivitati("diana", ora)}
            </div>

            <div className="min-h-14 rounded-lg border border-green-100 bg-white p-2 text-center">
              {afiseazaActivitati("iulia", ora)}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Activitățile sunt afișate pe intervale
        de câte o oră. Dacă o activitate ocupă
        doar o parte din oră, aceasta apare
        în intervalul respectiv.
      </p>
    </div>
  );
}
