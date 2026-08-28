'use client';

import { useRef } from 'react';
import Rating from '@/components/common/Rating';
import Search from '@/components/layout/Search';
import useDataList from '@/hooks/useDataList';
import DashboardDropdown from './DashboardDropdown';

const latestReviewsTableData = [
  {
    product: 'Fitbit Sense Advanced Smartwatch with Tools',
    productImage: '/products/1.png',
    customer: { name: 'Richard Dawkins', avatar: '' },
    rating: 5,
    review:
      'Very helpful to get going with rapid prototype development. Great support via email when I asked question.',
    status: { title: 'Approved', badge: 'success', icon: 'fas fa-check' },
    time: 'Just now'
  },
  {
    product: 'iPhone 13 pro max-Pacific Blue-128GB storage',
    productImage: '/products/2.png',
    customer: { name: 'Ashley Garrett', avatar: '/team/59.png' },
    rating: 3,
    review:
      'This template has allowed me to convert my existing web app into a great looking, easy to use UI in less than 2 weeks',
    status: { title: 'Approved', badge: 'success', icon: 'fas fa-check' },
    time: 'Just now'
  },
  {
    product: 'Apple MacBook Pro 13 inch-M1-8/256GB-space',
    productImage: '/products/3.png',
    customer: { name: 'Woodrow Burton', avatar: '/team/58.png' },
    rating: 4.5,
    review:
      'I have started using this theme in the last week and it has really impressed me very much, the support is second to none.',
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Just now'
  },
  {
    product: 'Apple iMac 24" 4K Retina Display M1 8 Core CPU...',
    productImage: '/products/4.png',
    customer: { name: 'Eric McGee', avatar: '/team/avatar-placeholder.png' },
    rating: 3,
    review:
      'The best experience we could hope for. Customer service team is amazing and the quality of their products is unsurpassed. Great theme too!',
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Nov 09, 3:23 AM'
  },
  {
    product: 'Razer kraken V3 X wired 7.1 surround sound ga...',
    productImage: '/products/5.png',
    customer: { name: 'Kim Carroll', avatar: '/team/avatar-placeholder.png' },
    rating: 4,
    review: 'Team is very responsive to inquiries. Love this theme!',
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Nov 09, 2:15 PM'
  },
  {
    product: 'PlayStation 5 DualSense Wireless Controller',
    productImage: '/products/6.png',
    customer: { name: 'Barbara Lucas', avatar: '/team/57.png' },
    rating: 4,
    review:
      'The response time and service I received when contacted the designers were Phenomenal!',
    status: { title: 'Approved', badge: 'success', icon: 'fas fa-check' },
    time: 'Nov 08, 8:53 AM'
  },
  {
    product: '2021 Apple 12.9-inch iPad Pro (Wi‑Fi, 128GB) - Space Gray',
    productImage: '/products/7.png',
    customer: { name: 'Ansolo Lazinatov', avatar: '/team/3.png' },
    rating: 4.5,
    review:
      'The response time and service I received when contacted the designers were Phenomenal!',
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Nov 07, 9:00 PM'
  },
  {
    product: 'Amazon Basics Matte Black Wired Keyboard - US Layout (QWERTY)',
    productImage: '/products/8.png',
    customer: { name: 'Emma watson', avatar: '/team/26.png' },
    rating: 3,
    review:
      'I have started using this theme in the last week and it has really impressed me very much, the support is second to none.',
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Nov 07, 11:20 AM'
  },
  {
    product:
      'Amazon Basics Mesh, Mid-Back, Swivel Office Desk Chair with Armrests, Black',
    productImage: '/products/9.png',
    customer: { name: 'Rowen Atkinson', avatar: '/team/29.png' },
    rating: 5,
    review:
      'The best experience we could hope for. Customer service team is amazing and the quality of their products is unsurpassed. Great theme too!',
    status: { title: 'Approved', badge: 'success', icon: 'fas fa-check' },
    time: 'Nov 07, 2:00 PM'
  },
  {
    product: 'Apple Magic Mouse (Wireless, Rechargable) - Silver',
    productImage: '/products/10.png',
    customer: { name: 'Anthony Hopkins', avatar: '' },
    rating: 4,
    review:
      'This template has allowed me to convert my existing web app into a great looking, easy to use UI in less than 2 weeks. Very easy to use and understand and has a wide range of ready to use elements. ',
    status: { title: 'Approved', badge: 'success', icon: 'fas fa-check' },
    time: 'Nov 06, 8:00 AM'
  },
  {
    product: 'Echo Dot (4th Gen) _ Smart speaker with Alexa _ Glacier White',
    productImage: '/products/11.png',
    customer: { name: 'Jennifer Schramm', avatar: '/team/8.png' },
    rating: 4.5,
    review:
      'The theme is really beautiful and the support answer very quickly and is friendly. Buy it, you will not regret it.',
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Nov 05, 4:00 AM'
  },
  {
    product: 'HORI Racing Wheel Apex for PlayStation 4_3, and PC',
    productImage: '/products/12.png',
    customer: { name: 'Raymond Mims', avatar: '/team/avatar-placeholder.png' },
    rating: 4,
    review:
      'As others mentioned, the team behind this theme is super responsive. I sent a message during the weekend, fully expecting a response after the weekend, but I got one within minutes, and I was unblocked.',
    status: { title: 'Approved', badge: 'success', icon: 'fas fa-check' },
    time: 'Nov 04, 6:53 PM'
  },
  {
    product:
      'Nintendo Switch with Neon Blue and Neon Red Joy‑Con - HAC-001(-01)',
    productImage: '/products/13.png',
    customer: { name: 'Michael Jenkins', avatar: '/team/9.png' },
    rating: 5,
    review:
      "I had a bit of a hard time at first but after I contacted the team they were able to help me set up the theme. It's really good and I highly recommend it to everyone.",
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Nov 04, 12:00 PM'
  },
  {
    product: 'Oculus Rift S PC-Powered VR Gaming Headset',
    productImage: '/products/14.png',
    customer: {
      name: 'Kristine Cadena',
      avatar: '/team/avatar-placeholder.png'
    },
    rating: 5,
    review:
      'Excellent. All my doubts were answered by the team quickly. I highly recommend it.',
    status: { title: 'Pending', badge: 'warning', icon: 'fas fa-stopwatch' },
    time: 'Nov 03, 8:53 AM'
  },
  {
    product: 'Sony X85J 75 Inch Sony 4K Ultra HD LED Smart Google TV',
    productImage: '/products/15.png',
    customer: { name: 'Suzanne Martinez', avatar: '/team/24.png' },
    rating: 3.5,
    review:
      "This theme is great. Clean and easy to understand. Perfect for those who don't have time to start everything from scratch. The support is simply phenomenal! Highly recommended!",
    status: { title: 'Approved', badge: 'success', icon: 'fas fa-check' },
    time: 'Nov 03, 10:43 AM'
  }
];

function truncate(text, max) {
  return `${text.slice(0, max)}${text.length > max ? '...' : ''}`;
}

function LatestReviewsTableRow({ data }) {
  return (
    <tr className="hover-actions-trigger btn-reveal-trigger position-static">
      <td className="fs--1 align-middle ps-0" style={{ width: 28 }}>
        <div className="form-check mb-0 fs-0">
          <input className="form-check-input" type="checkbox" />
        </div>
      </td>
      <td className="align-middle product white-space-nowrap py-0">
        <img src={`/assets/img${data.productImage}`} alt="" width={53} />
      </td>
      <td
        className="align-middle product white-space-nowrap"
        style={{ minWidth: 360 }}
      >
        <h6 className="fw-semi-bold mb-0">{truncate(data.product, 46)}</h6>
      </td>
      <td
        className="align-middle customer white-space-nowrap"
        style={{ minWidth: 200 }}
      >
        <div className="d-flex align-items-center">
          <div className="avatar avatar-l">
            {data.customer.avatar ? (
              <img
                className="rounded-circle"
                src={`/assets/img${data.customer.avatar}`}
                alt=""
              />
            ) : (
              <div className="avatar-name rounded-circle">
                <span>{data.customer.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>
          <h6 className="mb-0 ms-3 text-900">{data.customer.name}</h6>
        </div>
      </td>
      <td
        className="align-middle rating white-space-nowrap"
        style={{ minWidth: 110 }}
      >
        <Rating rating={data.rating} />
      </td>
      <td className="align-middle review" style={{ minWidth: 350, width: 500 }}>
        <p className="fs--1 fw-semi-bold text-1000 mb-0">
          {truncate(data.review, 117)}
          {data.review.length > 117 && (
            <>
              {' '}
              <a href="#!">See more</a>
            </>
          )}
        </p>
      </td>
      <td className="align-middle text-start ps-5 status">
        <span className={`badge fs--1 badge-light-${data.status.badge}`}>
          {data.status.title}
          <span className={`ms-2 ${data.status.icon}`} />
        </span>
      </td>
      <td className="align-middle text-end time white-space-nowrap">
        <div className="hover-hide">
          <h6 className="text-1000 mb-0">{data.time}</h6>
        </div>
      </td>
      <td className="align-middle white-space-nowrap text-end pe-0">
        <div className="position-relative">
          <div className="hover-actions">
            <button
              type="button"
              className="btn btn-sm btn-phoenix-secondary me-1 fs--2"
            >
              <span className="fas fa-check" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-phoenix-secondary fs--2"
            >
              <span className="fas fa-trash" />
            </button>
          </div>
        </div>
        <DashboardDropdown id={`latest-review-dropdown-${data.product}`} />
      </td>
    </tr>
  );
}

export default function LatestReviews() {
  const containerRef = useRef(null);

  useDataList(containerRef, {
    valueNames: ['product', 'customer', 'rating', 'review', 'time'],
    page: 6
  });

  return (
    <div ref={containerRef}>
      <div className="row align-items-end justify-content-between pb-5 g-3">
        <div className="col-auto">
          <h3>Latest reviews</h3>
          <p className="text-700 lh-sm mb-0">
            Payment received across all channels
          </p>
        </div>
        <div className="col-12 col-md-auto">
          <div className="row g-2">
            <div className="col-auto flex-1">
              <Search placeholder="Search" />
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-sm btn-phoenix-secondary bg-white hover-bg-100"
              >
                All products
              </button>
              <button
                type="button"
                className="btn btn-sm btn-phoenix-secondary ms-2 bg-white hover-bg-100"
              >
                <span className="fas fa-ellipsis-h fs--2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive mx-n1 px-1 scrollbar">
        <table className="table fs--2 mb-0">
          <thead>
            <tr>
              <th className="white-space-nowrap fs--1 border-top ps-0 align-middle py-1">
                <div className="form-check mb-0 fs-0">
                  <input className="form-check-input" type="checkbox" />
                </div>
              </th>
              <th
                className="sort border-top white-space-nowrap align-middle py-1"
                scope="col"
              />
              <th
                className="sort border-top white-space-nowrap align-middle py-1"
                scope="col"
                style={{ minWidth: 360 }}
                data-sort="product"
              >
                PRODUCT
              </th>
              <th
                className="sort border-top align-middle py-1"
                scope="col"
                data-sort="customer"
                style={{ minWidth: 200 }}
              >
                CUSTOMER
              </th>
              <th
                className="sort border-top align-middle py-1"
                scope="col"
                data-sort="rating"
                style={{ minWidth: 110 }}
              >
                RATING
              </th>
              <th
                className="sort border-top align-middle py-1"
                scope="col"
                style={{ maxWidth: 350 }}
                data-sort="review"
              >
                REVIEW
              </th>
              <th
                className="sort border-top text-start ps-5 align-middle py-1"
                scope="col"
                data-sort="status"
              >
                STATUS
              </th>
              <th
                className="sort border-top text-end align-middle py-1"
                scope="col"
                data-sort="time"
              >
                TIME
              </th>
              <th
                className="sort border-top text-end pe-0 align-middle py-1"
                scope="col"
              />
            </tr>
          </thead>
          <tbody className="list" id="table-latest-review-body">
            {latestReviewsTableData.map(row => (
              <LatestReviewsTableRow data={row} key={row.product} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="row align-items-center py-2">
        <div className="pagination d-none" />
        <div className="col d-flex fs--1">
          <p
            className="mb-0 d-none d-sm-block me-3 fw-semi-bold text-900"
            data-list-info=""
          />
          <a className="fw-semi-bold" href="#!" data-list-view="*">
            View all
            <span className="fas fa-angle-right ms-1" />
          </a>
          <a className="fw-semi-bold d-none" href="#!" data-list-view="less">
            View Less
          </a>
        </div>
        <div className="col-auto d-flex">
          <button
            type="button"
            title="Previous"
            data-list-pagination="prev"
            className="btn btn-link px-1 me-1"
          >
            <span className="fas fa-chevron-left me-2" />
            Previous
          </button>
          <button
            type="button"
            title="Next"
            data-list-pagination="next"
            className="btn btn-link px-1 ms-1"
          >
            Next
            <span className="fas fa-chevron-right ms-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
