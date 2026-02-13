import Link from "next/link";

const experiments = [
  {
    id: 1,
    title: "Page Split + Text Reveal",
    href: "/lab/1",
    description: "Horizontal split overlay with open/close, character-level text reveal.",
  },
  {
    id: 2,
    title: "Stagger Reveal",
    href: "/lab/2",
    description: "List items animate in with configurable stagger and offset.",
  },
  {
    id: 3,
    title: "Typography",
    href: "/lab/typography",
    description: "GSAP typography motion patterns: line, char, word, scramble, typewriter, emphasis.",
  },
  {
    id: 4,
    title: "Transitions",
    href: "/lab/transitions",
    description: "Codrops-style multi-layer page reveal: triple swoosh, simple, duo, content.",
  },
  {
    id: 5,
    title: "Rapid Layers",
    href: "/lab/transitions/rapid-layers",
    description: "Rapid image layers animation with opposite-direction transforms.",
  },
  {
    id: 6,
    title: "Grain",
    href: "/lab/grain",
    description: "Procedural animated grain overlay using Canvas 2D.",
  },
] as const;

export default function LabPage() {
  return (
    <main className="flex min-h-screen flex-col px-6 py-16">
      <h1 className="text-3xl font-bold">MCB Motion Lab</h1>
      <p className="mt-2 text-foreground/70">Reusable GSAP motion primitives.</p>

      <ul className="mt-12 flex flex-col gap-6">
        {experiments.map(({ id, title, href, description }) => (
          <li key={id}>
            <Link
              href={href}
              className="block rounded-lg border border-foreground/10 p-6 transition-colors hover:border-foreground/30 hover:bg-foreground/5"
            >
              <span className="font-medium">Experiment #{id}</span>
              <h2 className="mt-1 text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm text-foreground/70">{description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
