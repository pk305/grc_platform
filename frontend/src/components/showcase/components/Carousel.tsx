export function CarouselBasicDemo() {
  return (
    <div
      id="carouselExampleControls"
      className="carousel slide"
      data-bs-ride="carousel"
    >
      <div className="carousel-indicators">
        <button
          type="button"
          className="active"
          data-bs-target="#carouselExampleControls"
          data-bs-slide-to="0"
          aria-current="true"
          aria-label="Slide 1"
        />
        <button
          type="button"
          data-bs-target="#carouselExampleControls"
          data-bs-slide-to="1"
          aria-label="Slide 2"
        />
        <button
          type="button"
          data-bs-target="#carouselExampleControls"
          data-bs-slide-to="2"
          aria-label="Slide 3"
        />
      </div>
      <div className="carousel-inner rounded">
        <div className="carousel-item active">
          <img
            className="d-block w-100"
            src="/assets/img/generic/6.jpg"
            alt="First slide"
          />
        </div>
        <div className="carousel-item">
          <img
            className="d-block w-100"
            src="/assets/img/generic/7.jpg"
            alt="Second slide"
          />
        </div>
        <div className="carousel-item">
          <img
            className="d-block w-100"
            src="/assets/img/generic/8.jpg"
            alt="Third slide"
          />
        </div>
      </div>
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleControls"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="sr-only">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleControls"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="sr-only">Next</span>
      </button>
    </div>
  );
}

export function CarouselStyledDemo() {
  return (
    <div
      id="controlStyledExample"
      className="carousel slide theme-slider text-center"
      data-bs-ride="carousel"
    >
      <div className="carousel-indicators">
        <button
          type="button"
          className="active"
          data-bs-target="#controlStyledExample"
          data-bs-slide-to="0"
          aria-current="true"
          aria-label="Slide 1"
        />
        <button
          type="button"
          data-bs-target="#controlStyledExample"
          data-bs-slide-to="1"
          aria-label="Slide 2"
        />
        <button
          type="button"
          data-bs-target="#controlStyledExample"
          data-bs-slide-to="2"
          aria-label="Slide 3"
        />
      </div>
      <div className="carousel-inner rounded">
        <div className="carousel-item active">
          <img
            className="d-block w-100"
            src="/assets/img/generic/6.jpg"
            alt="First slide"
          />
        </div>
        <div className="carousel-item">
          <img
            className="d-block w-100"
            src="/assets/img/generic/7.jpg"
            alt="Second slide"
          />
        </div>
        <div className="carousel-item">
          <img
            className="d-block w-100"
            src="/assets/img/generic/8.jpg"
            alt="Third slide"
          />
        </div>
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#controlStyledExample"
          data-bs-slide="prev"
        >
          <span className="fas fa-angle-left" />
          <span className="sr-only">Previous</span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#controlStyledExample"
          data-bs-slide="next"
        >
          <span className="fas fa-angle-right" />
          <span className="sr-only">Next</span>
        </button>
      </div>
    </div>
  );
}

export function CarouselWithCaptionDemo() {
  const slides = [
    { img: '/assets/img/generic/5.jpg', heading: 'First Slide Heading' },
    { img: '/assets/img/generic/28.jpg', heading: 'Second Slide Heading' },
    { img: '/assets/img/generic/9.jpg', heading: 'Third Slide Heading' }
  ];
  return (
    <div
      id="carouselExampleCaptions"
      className="carousel slide"
      data-bs-ride="carousel"
    >
      <div className="carousel-indicators">
        {slides.map((slide, index) => (
          <button
            key={slide.heading}
            type="button"
            className={index === 0 ? 'active' : ''}
            data-bs-target="#carouselExampleCaptions"
            data-bs-slide-to={index}
            aria-current={index === 0 ? 'true' : undefined}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
      <div className="carousel-inner rounded-1 light">
        {slides.map((slide, index) => (
          <div
            key={slide.heading}
            className={`carousel-item ${index === 0 ? 'active' : ''}`.trim()}
          >
            <img
              className="d-block w-100"
              src={slide.img}
              alt={`Slide ${index + 1}`}
            />
            <div className="carousel-caption d-none d-md-block">
              <h5 className="text-white">{slide.heading}</h5>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
            </div>
          </div>
        ))}
      </div>
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleCaptions"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="sr-only">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleCaptions"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="sr-only">Next</span>
      </button>
    </div>
  );
}

export function CarouselFadeDemo() {
  return (
    <div
      id="carouselExampleFade"
      className="carousel slide carousel-fade"
      data-bs-ride="carousel"
    >
      <div className="carousel-inner rounded">
        <div className="carousel-item active">
          <img
            className="d-block w-100"
            src="/assets/img/generic/8.jpg"
            alt="First slide"
          />
        </div>
        <div className="carousel-item">
          <img
            className="d-block w-100"
            src="/assets/img/generic/7.jpg"
            alt="Second slide"
          />
        </div>
        <div className="carousel-item">
          <img
            className="d-block w-100"
            src="/assets/img/generic/6.jpg"
            alt="Third slide"
          />
        </div>
      </div>
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleFade"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="sr-only">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleFade"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="sr-only">Next</span>
      </button>
    </div>
  );
}
