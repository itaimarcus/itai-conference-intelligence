import Link from "next/link";

type HubCard = {
  href: string;
  title: string;
  tagline: string;
  bullets: string[];
  accent: string;
  cloud: string;
  position: string;
  tilt: string;
};

const CARDS: HubCard[] = [
  {
    href: "/conferences",
    title: "Conferences",
    tagline: "Find where your buyers gather.",
    bullets: ["ICP fit scores", "Filters & tiers", "Add to your plan"],
    accent: "from-sky-50 to-white border-sky-200/80",
    cloud: "left-[-0.75rem] top-[-1.25rem]",
    position: "lg:left-[4%] lg:top-[8%]",
    tilt: "lg:-rotate-2",
  },
  {
    href: "/planner",
    title: "Planner",
    tagline: "See the year at a glance.",
    bullets: ["Quarter coverage", "Trip stacks", "Rep assignments"],
    accent: "from-indigo-50/90 to-white border-indigo-200/70",
    cloud: "right-[-0.5rem] top-[-1rem]",
    position: "lg:left-[52%] lg:top-[4%]",
    tilt: "lg:rotate-1",
  },
  {
    href: "/capture",
    title: "Capture",
    tagline: "Log leads on the show floor.",
    bullets: ["Email-first on mobile", "Contact matching", "ICP & lifecycle"],
    accent: "from-emerald-50 to-white border-emerald-200/80",
    cloud: "left-[-0.5rem] bottom-[-1.1rem]",
    position: "lg:left-[8%] lg:top-[42%]",
    tilt: "lg:rotate-2",
  },
  {
    href: "/contacts",
    title: "Contacts",
    tagline: "One place for every relationship.",
    bullets: ["Search & journey", "HubSpot push", "AI summaries"],
    accent: "from-violet-50/90 to-white border-violet-200/70",
    cloud: "right-[-0.75rem] top-[-1rem]",
    position: "lg:right-[6%] lg:top-[38%]",
    tilt: "lg:-rotate-1",
  },
  {
    href: "/settings",
    title: "Settings",
    tagline: "Wire up your stack.",
    bullets: ["Team members", "HubSpot token", "Gemini API key"],
    accent: "from-amber-50/80 to-white border-amber-200/70",
    cloud: "left-[40%] top-[-1.2rem]",
    position: "lg:left-[38%] lg:top-[72%]",
    tilt: "lg:rotate-1",
  },
];

function CardClouds({ placement }: { placement: string }) {
  return (
    <div
      className={["pointer-events-none absolute z-0 flex gap-1", placement].join(" ")}
      aria-hidden
    >
      <span className="h-5 w-8 rounded-full bg-white/90 shadow-sm" />
      <span className="-ml-2 mt-1 h-4 w-6 rounded-full bg-white/80 shadow-sm" />
      <span className="-ml-1 -mt-0.5 h-3 w-5 rounded-full bg-white/70 shadow-sm" />
    </div>
  );
}

function HubCardLink({ card }: { card: HubCard }) {
  return (
    <Link
      href={card.href}
      className={[
        "group relative z-10 block max-w-[17.5rem] rounded-2xl border bg-gradient-to-br p-4 shadow-md transition",
        "hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
        "max-lg:mx-auto max-lg:rotate-0",
        "lg:absolute lg:w-[17.5rem]",
        card.accent,
        card.position,
        card.tilt,
      ].join(" ")}
    >
      <CardClouds placement={card.cloud} />
      <h2 className="relative text-lg font-semibold tracking-tight text-slate-900">
        {card.title}
      </h2>
      <p className="relative mt-1 text-sm leading-snug text-slate-600">{card.tagline}</p>
      <ul className="relative mt-2.5 space-y-1 text-xs text-slate-600">
        {card.bullets.map((b) => (
          <li key={b} className="flex gap-1.5">
            <span className="mt-0.5 text-blue-500" aria-hidden>
              •
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <span className="relative mt-3 inline-flex text-xs font-semibold text-blue-700 group-hover:underline">
        Open →
      </span>
    </Link>
  );
}

export function HomeLanding() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-gradient-to-b from-sky-50/90 via-white to-slate-50/50 px-4 py-8 shadow-sm sm:px-8 sm:py-10">
      <div
        className="pointer-events-none absolute -right-16 -top-10 h-40 w-40 rounded-full bg-sky-200/30 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-blue-200/25 blur-2xl"
        aria-hidden
      />

      <header className="relative mx-auto max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600/90">
          Itai Conference Intelligence
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Plan events. Capture leads. Grow relationships.
        </h1>
      </header>

      <div className="relative mx-auto mt-10 max-w-4xl max-lg:flex max-lg:flex-col max-lg:items-center max-lg:gap-8 lg:min-h-[34rem]">
        {CARDS.map((card, i) => (
          <div
            key={card.href}
            className={[
              "max-lg:w-full max-lg:max-w-sm",
              i % 2 === 1 ? "max-lg:-rotate-1" : "max-lg:rotate-1",
            ].join(" ")}
          >
            <HubCardLink card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}
