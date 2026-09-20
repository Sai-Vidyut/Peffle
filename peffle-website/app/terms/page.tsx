import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — Peffle",
  description:
    "Terms of Use for the Peffle website and documentation. The Peffle software is licensed separately under Apache-2.0.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(20,20,19,0.92)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-4 px-6 py-3.5">
          <Link
            href="/"
            className="font-display text-[17px] font-semibold leading-none text-[var(--text)]"
          >
            peffle
          </Link>
          <Link
            href="/"
            className="text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-14 md:py-20">
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="mb-2 text-[clamp(28px,5vw,40px)] font-semibold tracking-tight text-[var(--text)]">
          Terms of Use
        </h1>
        <p className="mb-8 text-[13px] text-[var(--muted)]">Last updated: 20 September 2026</p>

        <p className="mb-8 rounded-[12px] border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-[13px] text-[var(--muted)]">
          These Terms apply to this website and its documentation. The{" "}
          <strong className="text-[var(--text)]">Peffle software</strong> (npm package, source
          code, and CLI) is licensed separately under the{" "}
          <a
            href="https://github.com/Sai-Vidyut/Peffle/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--info)] underline underline-offset-2"
          >
            Apache License 2.0
          </a>
          . This page is an adapted template for an early open-source project and is not a
          substitute for legal advice. Have counsel review before you rely on it in production.
        </p>

        <div className="legal-prose space-y-8 text-[15px] leading-relaxed text-[var(--muted)]">
          <section>
            <p>
              These Terms of Use (&quot;Terms&quot;) govern your access to and use of the Peffle
              website, documentation, and related online materials (the &quot;Site&quot;), operated
              by the Peffle project maintainers — Sai Vidyut, Josh Jiby, and Fathima Rinaya C
              (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;). By using the Site, you agree to
              these Terms. If you don&apos;t agree, don&apos;t use the Site.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">1. Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Site. The Site does not knowingly
              collect personal information from children. If you believe a child has provided us
              information through the Site, contact us via the channels in Section 12.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">2. Accounts</h2>
            <p>
              The Site does not require an account. Third-party services you use with Peffle
              (for example GitHub or npm) are governed by those providers&apos; own terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">3. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Use the Site for any unlawful purpose</li>
              <li>
                Attempt to gain unauthorized access to our systems, hosting infrastructure, or
                other users&apos; accounts on third-party platforms
              </li>
              <li>
                Upload malicious code, spam, or content that infringes others&apos; rights through
                Site feedback channels
              </li>
              <li>
                Scrape, overload, or disrupt the Site in a way that impairs availability for others
              </li>
              <li>Impersonate any person or entity when contacting the maintainers</li>
              <li>
                Misrepresent Peffle as a hosted security product, payments rail, or substitute for
                proper application security review
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">4. Open-source software</h2>
            <p>
              Use, modification, and distribution of the Peffle library and related source code
              are governed by the Apache License 2.0 included in the repository, not by these
              website Terms. Nothing here limits rights you have under that license.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">5. User content</h2>
            <p>
              If you submit feedback, issues, or pull requests via GitHub or other channels you
              choose, you retain ownership of your submissions subject to the terms of those
              platforms and any contributor license applicable to the repository. You are
              responsible for ensuring you have the rights to material you submit.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">
              6. Payments and subscriptions
            </h2>
            <p>
              The Site and the Peffle open-source package do not currently charge fees or offer
              paid subscriptions through this Site. If that changes, we will update these Terms
              with clear pricing, cancellation, and refund terms before collecting payment.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">
              7. Intellectual property
            </h2>
            <p>
              The Site&apos;s design, copy, logos, and brand assets are owned by the Peffle
              maintainers unless otherwise noted. These Terms don&apos;t grant you rights to our
              trademarks, logos, or brand assets beyond what&apos;s needed to use the Site as
              intended or as allowed by the Apache License for software and documentation covered
              by that license.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">
              8. Third-party services
            </h2>
            <p>
              The Site may link to third-party services such as GitHub, npm, and documentation
              hosts. We aren&apos;t responsible for the content, privacy practices, or terms of
              third-party services. Peffle may optionally integrate with Model Context Protocol
              tooling; those integrations remain your responsibility to configure and secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">9. Disclaimers</h2>
            <p className="mb-3 uppercase">
              The Site is provided &quot;as is&quot; and &quot;as available&quot; without warranties
              of any kind, express or implied, including merchantability, fitness for a particular
              purpose, and non-infringement. We don&apos;t guarantee the Site will be uninterrupted,
              secure, or error-free.
            </p>
            <p>
              Peffle is a local policy-enforcement library for developer-controlled agent tool
              calls. It is <strong className="font-semibold text-[var(--text)]">not</strong> a
              hosted security service, sandbox, identity provider, payments processor, or
              substitute for professional security, legal, or compliance advice. Agent identifiers
              are self-asserted by your application; any code path that bypasses{" "}
              <code className="font-mono text-[13px] text-[var(--text)]">guard()</code> bypasses
              Peffle. Software warranties and liability for the library itself are as stated in
              the Apache License 2.0.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">
              10. Limitation of liability
            </h2>
            <p className="uppercase">
              To the maximum extent permitted by law, the Peffle maintainers will not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Site. Our total liability for any claim related to the Site will not
              exceed one hundred U.S. dollars (US $100). Liability related to the software is
              governed by the Apache License 2.0. Some jurisdictions limit how far these clauses
              can go; where they do, our liability is limited to the fullest extent allowed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold the Peffle maintainers harmless from claims, damages,
              or expenses arising from your violation of these Terms or misuse of the Site,
              including claims arising from agent systems you build that incorporate Peffle.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">12. Termination</h2>
            <p>
              We may suspend or terminate access to the Site at any time, with or without cause,
              with or without notice. You may stop using the Site at any time. Your rights to the
              open-source software under Apache-2.0 continue according to that license.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">
              13. Governing law and dispute resolution
            </h2>
            <p>
              Until a formal legal entity and jurisdiction are designated for the project, disputes
              arising from these website Terms will be handled in good faith through the contact
              channels below. Software licensing disputes are governed by the Apache License 2.0.
              This section will be updated when a governing law and venue are selected with legal
              counsel.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">
              14. Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. Material changes will be reflected by
              updating the &quot;Last updated&quot; date on this page. Continued use of the Site
              after changes take effect constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[18px] font-semibold text-[var(--text)]">15. Contact</h2>
            <p className="mb-2">Questions about these Terms:</p>
            <ul className="list-none space-y-1 pl-0">
              <li>Peffle project maintainers</li>
              <li>
                <a
                  href="https://github.com/Sai-Vidyut/Peffle/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--info)] underline underline-offset-2"
                >
                  GitHub Issues
                </a>
              </li>
              <li>
                Repository:{" "}
                <a
                  href="https://github.com/Sai-Vidyut/Peffle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--info)] underline underline-offset-2"
                >
                  github.com/Sai-Vidyut/Peffle
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
