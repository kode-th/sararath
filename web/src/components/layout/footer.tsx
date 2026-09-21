export function Footer() {
  return (
    <footer className="mt-10 flex flex-col gap-3 border-t border-line py-6 text-[11px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
      <span>สาระรัฐ · ข่าวจากหน่วยงานภาครัฐต้นทาง</span>
      <a
        href="https://thai-gov-news-api.onrender.com/reference"
        target="_blank"
        rel="noreferrer"
        className="font-mono hover:text-ink"
      >
        API
      </a>
    </footer>
  )
}
