import Link from "next/link"

/** The repository's one card: a soft panel with an icon centred in it, the
 * name and a line of detail beneath, all inside an outline. On hover the
 * card gains a surface and the outline darkens. Batches and projects both use it. */
export function Tile({
  href,
  icon,
  title,
  meta,
  badge,
  align = "center",
}: {
  href: string
  icon: React.ReactNode
  title: string
  meta?: React.ReactNode
  badge?: React.ReactNode
  align?: "center" | "left"
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border p-2 pb-4 transition-[background-color,border-color] duration-fast-02 ease-standard hover:border-foreground/25 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
    >
      <span className="relative flex aspect-[16/10] items-center justify-center rounded-xl bg-muted">
        {badge && <span className="absolute top-2.5 left-2.5">{badge}</span>}
        {icon}
      </span>
      <span className={`px-2 ${align === "center" ? "text-center" : "text-left"}`}>
        <span className="line-clamp-2 block text-subhead text-foreground">
          {title}
        </span>
        {meta && (
          <span className="mt-0.5 block text-caption text-muted-foreground">
            {meta}
          </span>
        )}
      </span>
    </Link>
  )
}

/** A small glass folder: back with tab, paper peeking out, frosted front.
 * The paper rises when its card is hovered. */
export function GlassFolder({ empty = false }: { empty?: boolean }) {
  return (
    <span className="relative block aspect-[5/4] w-2/5 max-w-36">
      <span className="absolute top-0 left-0 h-1/4 w-2/5 rounded-t-lg bg-brand-600/90" />
      <span className="absolute inset-x-0 top-[12%] bottom-0 rounded-lg rounded-tl-none bg-gradient-to-br from-brand-600/90 to-brand-400/80" />
      {!empty && (
        <span className="absolute inset-x-[10%] top-[22%] bottom-[12%] rounded-sm bg-white shadow-sm transition-transform duration-fast-02 ease-standard group-hover:-translate-y-1.5" />
      )}
      <span className="absolute inset-x-0 top-[34%] bottom-0 rounded-lg border border-white/40 bg-gradient-to-b from-brand-400/60 via-brand-400/35 to-brand-600/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_6px_14px_-6px_rgb(0_0_0/0.35)] backdrop-blur-md" />
    </span>
  )
}

/** A project as two glass sheets with ruled lines, in the same family. On
 * hover they fan apart from their base, without moving or changing colour. */
export function GlassSheet() {
  const motion =
    "origin-bottom transition-[rotate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
  return (
    <span className="relative block aspect-[4/5] w-1/4 max-w-24">
      <span
        className={`absolute inset-0 rotate-6 rounded-md bg-brand-400/50 group-hover:rotate-[14deg] ${motion}`}
      />
      <span className={`absolute inset-0 group-hover:-rotate-3 ${motion} flex flex-col gap-[9%] rounded-md border border-white/50 bg-gradient-to-b from-brand-400/70 to-brand-600/80 px-[16%] pt-[22%] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_6px_14px_-6px_rgb(0_0_0/0.35)] backdrop-blur-md`}>
        <span className="h-[5%] w-full rounded-full bg-white/80" />
        <span className="h-[5%] w-3/4 rounded-full bg-white/60" />
        <span className="h-[5%] w-5/6 rounded-full bg-white/60" />
      </span>
    </span>
  )
}

