export default function Rating({
  rating,
  className
}: {
  rating: number;
  className?: string;
}) {
  const stars = [];
  for (let i = 0; i < 5; i += 1) {
    if (i < Math.floor(rating)) {
      stars.push(
        <span
          key={i}
          className={`fa fa-star text-warning ${className || ''}`.trim()}
        />
      );
    } else if (rating > i && rating < i + 1) {
      stars.push(
        <span
          key={i}
          className={`fa fa-star-half-alt text-warning star-icon ${className || ''}`.trim()}
        />
      );
    } else {
      stars.push(
        <span
          key={i}
          className={`fa fa-star text-300 ${className || ''}`.trim()}
        />
      );
    }
  }
  return <>{stars}</>;
}
