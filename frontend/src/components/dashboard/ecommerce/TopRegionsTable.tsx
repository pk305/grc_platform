const topRegionsTableData = [
  {
    country: { name: 'India', flag: '/img/country/india.png' },
    users: { number: 92896, percantage: '41.6%' },
    transactions: { number: 67, percantage: '34.3%' },
    revenue: { number: 7560, percantage: '36.9%' },
    convRate: '14.01%'
  },
  {
    country: { name: 'China', flag: '/img/country/china.png' },
    users: { number: 50496, percantage: '32.8%' },
    transactions: { number: 54, percantage: '23.8%' },
    revenue: { number: 6532, percantage: '26.5%' },
    convRate: '23.56%'
  },
  {
    country: { name: 'USA', flag: '/img/country/usa.png' },
    users: { number: 45679, percantage: '24.3%' },
    transactions: { number: 35, percantage: '19.7%' },
    revenue: { number: 5432, percantage: '16.9%' },
    convRate: '10.23%'
  },
  {
    country: { name: 'South Korea', flag: '/img/country/south-korea.png' },
    users: { number: 36453, percantage: '19.7%' },
    transactions: { number: 22, percantage: '9.54%' },
    revenue: { number: 4673, percantage: '11.6%' },
    convRate: '8.85%'
  },
  {
    country: { name: 'Vietnam', flag: '/img/country/vietnam.png' },
    users: { number: 15007, percantage: '11.9%' },
    transactions: { number: 17, percantage: '6.91%' },
    revenue: { number: 2456, percantage: '10.2%' },
    convRate: '6.01%'
  }
];

function TopRegionsTableRow({ data, index }) {
  return (
    <tr>
      <td className="white-space-nowrap ps-0" style={{ width: '32%' }}>
        <div className="d-flex align-items-center">
          <h6 className="mb-0 me-3">{`${index + 1}. `}</h6>
          <a href="#!">
            <div className="d-flex align-items-center">
              <img src={`/assets${data.country.flag}`} alt="" width={24} />
              <p className="mb-0 ps-3 text-primary fw-bold fs--1">
                {data.country.name}
              </p>
            </div>
          </a>
        </div>
      </td>
      <td className="align-middle" style={{ width: '17%' }}>
        <h6 className="mb-0">
          {data.users.number}
          <span className="text-700 fw-medium ms-2">{`(${data.users.percantage})`}</span>
        </h6>
      </td>
      <td className="align-middle text-end" style={{ width: '17%' }}>
        <h6 className="mb-0">
          {data.transactions.number}
          <span className="text-700 fw-medium ms-2">{`(${data.transactions.percantage})`}</span>
        </h6>
      </td>
      <td className="align-middle text-end" style={{ width: '17%' }}>
        <h6 className="mb-0">
          {`$${data.revenue.number}`}
          <span className="text-700 fw-medium ms-2">{`(${data.revenue.percantage})`}</span>
        </h6>
      </td>
      <td className="align-middle text-end pe-0" style={{ width: '17%' }}>
        <h6>{data.convRate}</h6>
      </td>
    </tr>
  );
}

export default function TopRegionsTable() {
  return (
    <>
      <div className="table-responsive scrollbar">
        <table className="table fs--2 mb-0">
          <thead>
            <tr>
              <th
                className="border-top border-200 ps-0 align-middle"
                scope="col"
                style={{ width: '32%' }}
              >
                COUNTRY
              </th>
              <th
                className="border-top border-200 align-middle"
                scope="col"
                style={{ width: '17%' }}
              >
                USERS
              </th>
              <th
                className="border-top border-200 text-end align-middle"
                scope="col"
                style={{ width: '16%' }}
              >
                TRANSACTIONS
              </th>
              <th
                className="border-top border-200 text-end align-middle"
                scope="col"
                style={{ width: '20%' }}
              >
                REVENUE
              </th>
              <th
                className="border-top border-200 text-end pe-0 align-middle"
                scope="col"
                style={{ width: '17%' }}
              >
                CONV. RATE
              </th>
            </tr>
          </thead>
          <tbody className="list">
            <tr>
              <td />
              <td className="align-middle py-4">
                <h4 className="mb-0 fw-normal">377,620</h4>
              </td>
              <td className="align-middle text-end py-4">
                <h4 className="mb-0 fw-normal">236</h4>
              </td>
              <td className="align-middle text-end py-4">
                <h4 className="mb-0 fw-normal">$15,758</h4>
              </td>
              <td className="align-middle text-end py-4 pe-0">
                <h4 className="mb-0 fw-normal">10.32%</h4>
              </td>
            </tr>
            {topRegionsTableData.map((row, index) => (
              <TopRegionsTableRow
                data={row}
                index={index}
                key={row.country.name}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex align-items-center justify-content-between py-2 fs--1 mb-1">
        <p className="mb-0 d-none d-sm-block me-3 fw-semi-bold text-900">
          1 to 5<span className="text-600"> Items of </span>15
        </p>
        <a className="fw-semi-bold" href="#!">
          View all
          <span className="fas fa-angle-right ms-2" />
        </a>
      </div>
    </>
  );
}
