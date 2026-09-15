// Welcome block at the top of the landing page (catalog: HeroCard).
// The page's primary action goes below the card, not inside it.
export default function HeroCard({ heading, intro }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-text bg-action-subtle p-5 shadow-md">
      <div aria-hidden="true" data-testid="hero-bars" className="flex w-2/3 flex-col gap-2 rotate-tilt-sm">
        <span className="h-4 w-full rounded-full bg-action" />
        <span className="h-4 w-3/5 rounded-full bg-text" />
        <span className="h-4 w-1/3 rounded-full bg-border-strong" />
      </div>
      <h1 className="break-words text-3xl font-bold leading-tight text-text">{heading}</h1>
      <p className="text-base text-text">{intro}</p>
    </section>
  );
}
