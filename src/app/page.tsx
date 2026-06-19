import Link from "next/link";
import { PROPOSAL_TYPE_METADATA, SUPPORTED_PROPOSAL_TYPE_NAMES } from "@/domain/proposals/metadata";
import styles from "./home.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.heroPanel} aria-labelledby="home-title">
        <p className={styles.eyebrow}>OLManager Data Manager</p>
        <h1 className={styles.title} id="home-title">Typed data proposals before production integrations.</h1>
        <p className={styles.lede}>
          Create fixture-backed player proposals, inspect deterministic diffs, and record stub
          reviewer decisions without writing to Discord, GitHub, production storage, assets, or ZIP
          exports.
        </p>
        <div className={styles.ctaRow}>
          <Link className={styles.primaryCta} href="/proposals">
            Open proposal workbench
          </Link>
          <Link className={styles.secondaryCta} href={PROPOSAL_TYPE_METADATA.AddPlayer.href}>
            Create first proposal
          </Link>
        </div>
      </section>

      <section className={styles.contentPanel} aria-labelledby="mvp-title">
        <p className={styles.eyebrow}>MVP boundary</p>
        <h2 className={styles.sectionTitle} id="mvp-title">A safe review loop, not a production pipeline</h2>
        <div className={styles.boundaryGrid}>
          <article className={styles.boundaryCard}>
            <h3 className={styles.cardTitle}>Typed inputs</h3>
            <p className={styles.boundaryCopy}>Only {SUPPORTED_PROPOSAL_TYPE_NAMES} are available.</p>
          </article>
          <article className={styles.boundaryCard}>
            <h3 className={styles.cardTitle}>Fixture validation</h3>
            <p className={styles.boundaryCopy}>Domain rules validate against bundled OLManager-like players, teams, and competitions.</p>
          </article>
          <article className={styles.boundaryCard}>
            <h3 className={styles.cardTitle}>Stub review</h3>
            <p className={styles.boundaryCopy}>Approvals and rejections use explicit non-production reviewer metadata.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
