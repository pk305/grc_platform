import { siteConfig } from '@/lib/site-config';

export function UtilitiesText() {
  return (
    <p>
      <a
        href={`https://getbootstrap.com/docs/${siteConfig.bootstrapVersion}/utilities/spacing/`}
        target="_blank"
        rel="noreferrer"
      >
        Margin utilities
      </a>{' '}
      are the easiest way to add some structure to forms. They provide basic
      grouping of labels, controls, optional form text, and form validation
      messaging. We recommend sticking to <code>margin-bottom</code> utilities,
      and using a single direction throughout the form for consistency.
    </p>
  );
}

export function UtilitiesExample() {
  return (
    <>
      <div className="mb-3">
        <label className="form-label" htmlFor="formGroupExampleInput">
          Example label
        </label>
        <input
          id="formGroupExampleInput"
          className="form-control"
          type="text"
          placeholder="Example input placeholder"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="formGroupExampleInput2">
          Another label
        </label>
        <input
          id="formGroupExampleInput2"
          className="form-control"
          type="text"
          placeholder="Another input placeholder"
        />
      </div>
    </>
  );
}

export function BasicForm() {
  return (
    <form>
      <div className="mb-3">
        <label className="form-label" htmlFor="basic-form-name">
          Name
        </label>
        <input
          id="basic-form-name"
          className="form-control"
          type="text"
          placeholder="Name"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="basic-form-email">
          Email address
        </label>
        <input
          id="basic-form-email"
          className="form-control"
          type="email"
          placeholder="name@example.com"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="basic-form-password">
          Password
        </label>
        <input
          id="basic-form-password"
          className="form-control"
          type="password"
          placeholder="Password"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="basic-form-dob">
          Date of Birth
        </label>
        <input id="basic-form-dob" className="form-control" type="date" />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="basic-form-gender">
          Gender
        </label>
        <select
          id="basic-form-gender"
          className="form-select"
          aria-label="Default select example"
          defaultValue=""
        >
          <option value="">Select your gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="mb-3">
        <div className="form-check">
          <input
            id="flexRadioDefault1"
            className="form-check-input"
            type="radio"
            name="flexRadioDefault"
          />
          <label className="form-check-label mb-0" htmlFor="flexRadioDefault1">
            Personal Account
          </label>
        </div>
        <div className="form-check">
          <input
            id="flexRadioDefault2"
            className="form-check-input"
            type="radio"
            name="flexRadioDefault"
            defaultChecked
          />
          <label className="form-check-label mb-0" htmlFor="flexRadioDefault2">
            Business Account
          </label>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Upload Image</label>
        <input className="form-control" type="file" />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="basic-form-textarea">
          Description
        </label>
        <textarea
          id="basic-form-textarea"
          className="form-control"
          rows={3}
          placeholder="Description"
        />
      </div>
      <div className="mb-3 form-check">
        <input
          id="basic-form-checkbox"
          className="form-check-input"
          type="checkbox"
        />
        <label className="form-check-label" htmlFor="basic-form-checkbox">
          Remember me
        </label>
      </div>
      <button className="btn btn-primary" type="submit">
        Submit
      </button>
    </form>
  );
}

export function FormGridText() {
  return (
    <p>
      More complex forms can be built using our grid classes. Use these for form
      layouts that require multiple columns, varied widths, and additional
      alignment options.{' '}
      <strong>
        Requires the <code>$enable-grid-classes</code> Sass variable to be
        enabled
      </strong>{' '}
      (on by default).
    </p>
  );
}

export function FormGridExample() {
  return (
    <div className="row">
      <div className="col">
        <input
          className="form-control"
          type="text"
          placeholder="First name"
          aria-label="First name"
        />
      </div>
      <div className="col">
        <input
          className="form-control"
          type="text"
          placeholder="Last name"
          aria-label="Last name"
        />
      </div>
    </div>
  );
}

export function FormGridComplexExample() {
  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label" htmlFor="inputEmail4">
          Email
        </label>
        <input id="inputEmail4" className="form-control" type="email" />
      </div>
      <div className="col-md-6">
        <label className="form-label" htmlFor="inputPassword4">
          Password
        </label>
        <input id="inputPassword4" className="form-control" type="password" />
      </div>
      <div className="col-12">
        <label className="form-label" htmlFor="inputAddress">
          Address
        </label>
        <input
          id="inputAddress"
          className="form-control"
          type="text"
          placeholder="1234 Main St"
        />
      </div>
      <div className="col-12">
        <label className="form-label" htmlFor="inputAddress2">
          Address 2
        </label>
        <input
          id="inputAddress2"
          className="form-control"
          type="text"
          placeholder="Apartment, studio, or floor"
        />
      </div>
      <div className="col-md-6">
        <label className="form-label" htmlFor="inputCity">
          City
        </label>
        <input id="inputCity" className="form-control" type="text" />
      </div>
      <div className="col-md-4">
        <label className="form-label" htmlFor="inputState">
          State
        </label>
        <select id="inputState" className="form-select" defaultValue="">
          <option value="">Choose...</option>
          <option>...</option>
        </select>
      </div>
      <div className="col-md-2">
        <label className="form-label" htmlFor="inputZip">
          Zip
        </label>
        <input id="inputZip" className="form-control" type="text" />
      </div>
      <div className="col-12">
        <div className="form-check">
          <input id="gridCheck" className="form-check-input" type="checkbox" />
          <label className="form-check-label" htmlFor="gridCheck">
            Check me out
          </label>
        </div>
      </div>
      <div className="col-12">
        <button className="btn btn-primary" type="submit">
          Sign in
        </button>
      </div>
    </form>
  );
}

export function GridColumnSizingExample() {
  return (
    <div className="row g-3">
      <div className="col-sm-7">
        <input
          className="form-control"
          type="text"
          placeholder="City"
          aria-label="City"
        />
      </div>
      <div className="col-sm">
        <input
          className="form-control"
          type="text"
          placeholder="State"
          aria-label="State"
        />
      </div>
      <div className="col-sm">
        <input
          className="form-control"
          type="text"
          placeholder="Zip"
          aria-label="Zip"
        />
      </div>
    </div>
  );
}

export function GridAutoSizingExample() {
  return (
    <form className="row gy-2 gx-3 align-items-center">
      <div className="col-auto">
        <label className="visually-hidden" htmlFor="autoSizingInput">
          Name
        </label>
        <input
          id="autoSizingInput"
          className="form-control"
          type="text"
          placeholder="Jane Doe"
        />
      </div>
      <div className="col-auto">
        <label className="visually-hidden" htmlFor="autoSizingInputGroup">
          Username
        </label>
        <div className="input-group">
          <span className="input-group-text">@</span>
          <input
            id="autoSizingInputGroup"
            className="form-control"
            type="text"
            placeholder="Username"
          />
        </div>
      </div>
      <div className="col-auto">
        <label className="visually-hidden" htmlFor="autoSizingSelect">
          Preference
        </label>
        <select id="autoSizingSelect" className="form-select" defaultValue="">
          <option value="">Choose...</option>
          <option value="1">One</option>
          <option value="2">Two</option>
          <option value="3">Three</option>
        </select>
      </div>
      <div className="col-auto">
        <div className="form-check mb-0">
          <input
            id="autoSizingCheck"
            className="form-check-input"
            type="checkbox"
          />
          <label className="form-check-label mb-0" htmlFor="autoSizingCheck">
            Remember me
          </label>
        </div>
      </div>
      <div className="col-auto">
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </div>
    </form>
  );
}

export function GuttersText() {
  return (
    <p>
      By adding{' '}
      <a
        href="https://getbootstrap.com/docs/5.1/layout/grid/#gutters"
        target="_blank"
        rel="noreferrer"
      >
        gutter modifier classes
      </a>
      , you can have control over the gutter width in as well the inline as
      block direction.{' '}
      <strong>
        Also requires the <code>$enable-grid-classes</code> Sass variable to be
        enabled
      </strong>{' '}
      (on by default).
    </p>
  );
}

export function GuttersExample() {
  return (
    <div className="row g-3">
      <div className="col">
        <input
          className="form-control"
          type="text"
          placeholder="First name"
          aria-label="First name"
        />
      </div>
      <div className="col">
        <input
          className="form-control"
          type="text"
          placeholder="Last name"
          aria-label="Last name"
        />
      </div>
    </div>
  );
}

export function HorizontalformText() {
  return (
    <>
      <p className="mt-2">
        Create horizontal forms with the grid by adding the <code>.row</code>{' '}
        class to form groups and using the <code>.col-*-*</code> classes to
        specify the width of your labels and controls. Be sure to add{' '}
        <code>.col-form-label</code> to your <code>&lt;label&gt;</code>s as well
        so they&apos;re vertically centered with their associated form controls.
      </p>
      <p className="mb-0">
        At times, you maybe need to use margin or padding utilities to create
        that perfect alignment you need. For example, we&apos;ve removed the{' '}
        <code>padding-top</code> on our stacked radio inputs label to better
        align the text baseline.
      </p>
    </>
  );
}

export function HorizontalformExample() {
  return (
    <form>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label" htmlFor="inputEmail3">
          Email
        </label>
        <div className="col-sm-10">
          <input id="inputEmail3" className="form-control" type="email" />
        </div>
      </div>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label" htmlFor="inputPassword3">
          Password
        </label>
        <div className="col-sm-10">
          <input id="inputPassword3" className="form-control" type="password" />
        </div>
      </div>
      <fieldset>
        <div className="row mb-3">
          <label className="col-form-label col-sm-2 pt-0">Radios</label>
          <div className="col-sm-10">
            <div className="form-check">
              <input
                id="gridRadios1"
                className="form-check-input"
                type="radio"
                name="gridRadios"
                value="option1"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="gridRadios1">
                First radio
              </label>
            </div>
            <div className="form-check">
              <input
                id="gridRadios2"
                className="form-check-input"
                type="radio"
                name="gridRadios"
                value="option2"
              />
              <label className="form-check-label" htmlFor="gridRadios2">
                Second radio
              </label>
            </div>
            <div className="form-check disabled">
              <input
                id="gridRadios3"
                className="form-check-input"
                type="radio"
                name="gridRadios"
                value="option3"
                disabled
              />
              <label className="form-check-label" htmlFor="gridRadios3">
                Third disabled radio
              </label>
            </div>
          </div>
        </div>
      </fieldset>
      <div className="row mb-3">
        <label className="col-form-label col-sm-2 pt-0">Checkbox</label>
        <div className="col-sm-10">
          <div className="form-check">
            <input
              id="gridCheck1"
              className="form-check-input"
              type="checkbox"
            />
            <label className="form-check-label" htmlFor="gridCheck1">
              Example checkbox
            </label>
          </div>
        </div>
      </div>
      <button className="btn btn-primary" type="submit">
        Sign in
      </button>
    </form>
  );
}

export function HorizontalSizing() {
  return (
    <p>
      Be sure to use <code>.col-form-label-sm</code> or{' '}
      <code>.col-form-label-lg</code> to your <code>&lt;label&gt;</code>s or{' '}
      <code>&lt;legend&gt;</code>s to correctly follow the size of{' '}
      <code>.form-control-lg</code> and <code>.form-control-sm</code>.
    </p>
  );
}

export function HorizontalSizingExample() {
  return (
    <>
      <div className="row mb-3">
        <label
          className="col-sm-2 col-form-label col-form-label-sm"
          htmlFor="colFormLabelSm"
        >
          Email
        </label>
        <div className="col-sm-10">
          <input
            id="colFormLabelSm"
            className="form-control form-control-sm"
            type="email"
            placeholder="col-form-label-sm"
          />
        </div>
      </div>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label" htmlFor="colFormLabel">
          Email
        </label>
        <div className="col-sm-10">
          <input
            id="colFormLabel"
            className="form-control"
            type="email"
            placeholder="col-form-label"
          />
        </div>
      </div>
      <div className="row">
        <label
          className="col-sm-2 col-form-label col-form-label-lg"
          htmlFor="colFormLabelLg"
        >
          Email
        </label>
        <div className="col-sm-10">
          <input
            id="colFormLabelLg"
            className="form-control form-control-lg"
            type="email"
            placeholder="col-form-label-lg"
          />
        </div>
      </div>
    </>
  );
}

export function InlineForms() {
  return (
    <p>
      Use the <code>.col-auto</code> class to create horizontal layouts. By
      adding{' '}
      <a
        href={`https://getbootstrap.com/docs/${siteConfig.bootstrapVersion}/layout/grid/#gutters`}
        target="_blank"
        rel="noreferrer"
      >
        gutter modifier classes
      </a>
      , we&apos;ll have gutters in horizontal and vertical directions. The{' '}
      <code>.align-items-center</code> aligns the form elements to the middle,
      making the <code>.form-checkbox</code> align properly. Be sure to always
      include a <code>label</code> with each form control, even if you need to
      hide it from non-screenreader visitors with <code>.sr-only</code>.
    </p>
  );
}

export function InlineformsExample() {
  return (
    <form className="row row-cols-lg-5 g-3 align-items-center">
      <div className="col-12">
        <label className="sr-only" htmlFor="inlineFormInputName">
          Name
        </label>
        <input
          id="inlineFormInputName"
          className="form-control"
          type="text"
          placeholder="Jane Doe"
        />
      </div>
      <div className="col-12">
        <label className="sr-only" htmlFor="inlineFormInputGroupUsername">
          Username
        </label>
        <div className="input-group">
          <span className="input-group-text">@</span>
          <input
            id="inlineFormInputGroupUsername"
            className="form-control"
            type="text"
            placeholder="Username"
          />
        </div>
      </div>
      <div className="col-12">
        <label className="sr-only" htmlFor="inlineFormSelectPref">
          Preference
        </label>
        <select
          id="inlineFormSelectPref"
          className="form-select"
          defaultValue=""
        >
          <option value="">Choose...</option>
          <option value="1">One</option>
          <option value="2">Two</option>
          <option value="3">Three</option>
        </select>
      </div>
      <div className="col-12">
        <div className="form-check mb-0">
          <input
            id="inlineFormCheck"
            className="form-check-input"
            type="checkbox"
          />
          <label className="mb-0 form-check-label" htmlFor="inlineFormCheck">
            Remember me
          </label>
        </div>
      </div>
      <div className="col-12">
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </div>
    </form>
  );
}
