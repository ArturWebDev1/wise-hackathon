import { ConnectionCheck } from "@/features/status/components/connection-check";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">TEAM WORKSPACE / READY TO BUILD</p>
      <h1>One team.<br />One working prototype.</h1>
      <p className="intro">
        The foundation is ready. Check the connection, then build the first feature.
      </p>
      <ConnectionCheck />
      <footer>Next.js · Spring Boot · PostgreSQL</footer>
    </main>
  );
}
