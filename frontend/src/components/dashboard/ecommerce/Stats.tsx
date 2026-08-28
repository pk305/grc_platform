const stats = [
  {
    icon: 'illustrations/4.png',
    title: '57 new orders',
    subTitle: 'Awating processing'
  },
  { icon: 'illustrations/2.png', title: '5 orders', subTitle: 'On hold' },
  {
    icon: 'illustrations/3.png',
    title: '15 products',
    subTitle: 'Out of stock'
  }
];

function SingleStat({ stat }) {
  return (
    <div className="d-flex align-items-center">
      <img
        src={`/assets/img/icons/${stat.icon}`}
        alt=""
        height={46}
        width={46}
      />
      <div className="ms-3">
        <h4 className="mb-0">{stat.title}</h4>
        <p className="text-800 fs--1 mb-0">{stat.subTitle}</p>
      </div>
    </div>
  );
}

export default function Stats() {
  return (
    <div className="row align-items-center g-4">
      {stats.map(stat => (
        <div className="col-12 col-md-auto" key={stat.title}>
          <SingleStat stat={stat} />
        </div>
      ))}
    </div>
  );
}
