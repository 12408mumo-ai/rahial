import { ALL_CATEGORY, CATEGORY_FILTERS } from '../lib/catalog.js'

export default function CategoryFilter({
  activeCategory = ALL_CATEGORY,
  onChange,
  resultCount,
}) {
  return (
    <div className="category-toolbar">
      <div
        className="category-list"
        role="group"
        aria-label="Filter products by category"
      >
        {CATEGORY_FILTERS.map((category) => {
          const isActive = activeCategory === category.slug

          return (
            <button
              className={`category-button${isActive ? ' is-active' : ''}`}
              key={category.slug}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(category.slug)}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      <p className="result-count" aria-live="polite">
        {String(resultCount).padStart(2, '0')} pieces
      </p>
    </div>
  )
}
