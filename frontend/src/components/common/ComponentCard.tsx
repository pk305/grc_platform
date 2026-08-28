/**
 * Ported from src/pug/mixins/common/Card.pug's `ComponentCard` mixin.
 * The original also had a "View code"/"Copy code" toolbar that worked by
 * escaping the mixin's raw HTML block at pug-compile time — there's no
 * equivalent build-time source-extraction step here, so that toolbar is
 * dropped; this renders the demo card itself.
 */
export default function ComponentCard({
  title,
  titleEl,
  description,
  descriptionEl,
  descriptionClass,
  cardHeaderClass,
  bodyClass,
  anchor = true,
  className,
  children
}) {
  return (
    <div
      className={`card shadow-none border border-300 ${className || ''}`.trim()}
    >
      <div
        className={`card-header p-4 border-bottom border-300 bg-soft ${cardHeaderClass || ''}`.trim()}
      >
        <div
          className={`row g-3 justify-content-between ${description ? 'align-items-end' : 'align-items-center'}`}
        >
          <div className="col-12 col-md">
            {title && (
              <h3 className="text-900 mb-0" data-anchor={anchor || undefined}>
                {title}
              </h3>
            )}
            {titleEl}
            {description && <p className="mb-0 mt-2 text-800">{description}</p>}
            {descriptionEl && (
              <div className={`mt-2 text-800 ${descriptionClass || ''}`.trim()}>
                {descriptionEl}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`card-body p-0 ${bodyClass || ''}`.trim()}>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
