/* Geometric page banner — consistent masthead-style header for all non-dashboard pages.
   Each page passes a `shapes` SVG snippet (as a JSX element) and an accent `color`. */

export default function PageHero({ title, subtitle, color, children }) {
  return (
    <div className="page-hero">
      <div className="page-hero-l">
        <span className="page-hero-title">{title}</span>
        {subtitle && <span className="page-hero-sub">{subtitle}</span>}
      </div>
      <div className="page-hero-r" style={{ background: color }}>
        {children}
      </div>
    </div>
  )
}
