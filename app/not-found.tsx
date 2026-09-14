import Link from 'next/link';

export const metadata = { title: '404' };

export default function NotFound() {
  return (
    <section className="notfound section">
      <div className="measure">
        <p className="eyebrow">
          <span className="eyebrow-num">404</span> Page not found
        </p>
        <h1 className="notfound__title display">
          Dead
          <br />
          <span>link.</span>
        </h1>
        <p className="prose">
          That route never shipped. The browser I built handles bad URLs more gracefully than this
          one does — but here we are.
        </p>
        <Link className="btn btn--signal notfound__cta" href="/">
          <span>Back to the work</span>
        </Link>
      </div>
    </section>
  );
}
