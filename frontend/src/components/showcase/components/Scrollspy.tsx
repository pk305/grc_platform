const sections = [
  { title: 'Home' },
  { title: 'Profile' },
  { title: 'Messages' },
  { title: 'Settings' }
];

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipisicing elit. A accusantium, alias autem beatae blanditiis corporis debitis eligendi, enim error excepturi exercitationem odit porro quasi reiciendis saepe sapiente veritatis? Aliquam assumenda beatae, cumque delectus dolorem enim, eveniet facere fugit harum illum iure magnam nemo neque nisi omnis, pariatur tenetur vel? Accusantium aut cum deleniti dolor doloribus eum, molestiae nulla officiis quasi. At cupiditate dolor explicabo id nesciunt placeat unde voluptates. Asperiores cum doloremque esse fugit labore quia reprehenderit similique.';

export function SpyExampleItem({ section }) {
  return (
    <>
      <h3 id={`v-pills-${section.title.toLowerCase()}`}>{section.title}</h3>
      <p className="mb-6">{LOREM}</p>
    </>
  );
}

export function ScrollspyDemo() {
  return (
    <div className="row">
      <div className="col-sm-auto">
        <div
          className="sticky-top"
          style={{ marginTop: '-72px', paddingTop: '72px' }}
        >
          <div id="v-pills" className="nav flex-column nav-pills">
            {sections.map(section => (
              <a
                key={section.title}
                href={`#v-pills-${section.title.toLowerCase()}`}
                className="ps-0 ps-sm-3"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="col-sm">
        {sections.map(section => (
          <SpyExampleItem key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
}
