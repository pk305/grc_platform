export function Tooltip({
  placement,
  text,
  className,
  htmlTitle
}: {
  placement: string;
  text: string;
  className?: string;
  htmlTitle?: string;
}) {
  return (
    <button
      className={`btn btn-secondary btn-sm m-1 ${className || ''}`.trim()}
      type="button"
      data-bs-toggle="tooltip"
      data-bs-placement={placement}
      data-bs-html={htmlTitle ? 'true' : undefined}
      title={htmlTitle || text}
    >
      {text}
    </button>
  );
}

export function TooltipExampleDemo() {
  return (
    <>
      <Tooltip placement="top" text="Tooltip on top" />
      <Tooltip placement="right" text="Tooltip on right" />
      <Tooltip placement="bottom" text="Tooltip on bottom" />
      <Tooltip placement="left" text="Tooltip on left" />
      <Tooltip
        placement="top"
        text="Tooltip with HTML"
        htmlTitle="<em>Tooltip</em> <u>with</u> <b>HTML</b>"
      />
    </>
  );
}
