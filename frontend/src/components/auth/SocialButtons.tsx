export default function SocialButtons({
  title,
  className
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <button type="button" className="btn btn-phoenix-secondary w-100 mb-3">
        <span className="fab fa-google text-danger me-2 fs--1" />
        {title} with google
      </button>
      <button type="button" className="btn btn-phoenix-secondary w-100">
        <span className="fab fa-facebook text-primary me-2 fs--1" />
        {title} with facebook
      </button>
    </div>
  );
}
