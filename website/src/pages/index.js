import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home() {
  return (
    <Layout
      title="Programming assignment platform"
      description="CS3227 MP4 implementation status and project links"
    >
      <main className="home">
        <section className="hero">
          <p className="eyebrow">CS3227 · Mini Project 4</p>
          <h1>Practice programming. Learn from your work.</h1>
          <p className="lead">
            A student and instructor platform in development, with local Python
            and Java practice running in the browser.
          </p>
          <div className="actions">
            <Link
              className="button button--primary button--lg"
              to="/docs/overview"
            >
              See project status
            </Link>
            <a
              className="button button--secondary button--lg"
              href="https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4"
            >
              Browse source
            </a>
          </div>
        </section>
        <section className="status" aria-labelledby="status-heading">
          <h2 id="status-heading">Current implementation</h2>
          <p>
            The repository includes an opt-in local browser runner and synthetic
            student preview. Sign-in, submissions, instructor workflows, AI, and
            hosted services are still in development.
          </p>
        </section>
      </main>
    </Layout>
  );
}
