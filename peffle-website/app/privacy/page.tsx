import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Peffle",
  description:
    "How Peffle and the Peffle website handle information. The core library is local with zero telemetry.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      {/*
        PRIVACY POLICY — FILLED FROM CURRENT PRODUCT BEHAVIOR (March 2026).
        Re-audit before launch if you add analytics, accounts, forms, payments,
        or a production host with different logging. Have a lawyer review
        before relying on this at scale.
      */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(20,20,19,0.92)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-4 px-6 py-3.5">
          <Link
            href="/"
            className="font-display text-[17px] font-semibold text-[var(--text)]"
          >
            peffle
          </Link>
          <Link
            href="/"
            className="text-[13px] text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
        <p className="eyebrow mb-3">Legal</p>
        <h1 className="mb-3 text-[clamp(32px,5vw,44px)] font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mb-10 text-[14px] text-[var(--muted)]">
          Last updated: September 20, 2026
        </p>

        <div className="prose-peffle space-y-8 text-[15px] leading-relaxed text-[var(--muted)] [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[var(--text)] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-[var(--text)] [&_strong]:text-[var(--text)] [&_a]:text-[var(--info)] [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--panel)] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[13px] [&_th]:text-[var(--text)] [&_td]:border [&_td]:border-[var(--border)] [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-[13px]">
          <p>
            Peffle (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) is an open-source Node.js
            library that wraps AI agent tool calls in local <code className="font-mono text-[var(--text)]">guard()</code>{" "}
            checks — policy, budgets, approvals, kill switch, and a SQLite audit ledger — plus this
            marketing website that describes the project. This Privacy Policy explains what
            information we collect, how we use it, who we share it with, and the choices you have.
          </p>
          <p>
            By using Peffle or this website, you agree to the collection and use of information as
            described here. If you don&apos;t agree, please don&apos;t use the software or the site.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>The Peffle library (npm package)</h3>
          <p>
            The core Peffle library runs locally in your process. It does not make network calls and
            does not send telemetry, analytics, or usage data to us. Policy files, SQLite ledger
            databases, approvals, and related data stay on systems you control. We do not receive
            that data unless you choose to share it with us (for example, by opening a GitHub issue
            and attaching logs).
          </p>

          <h3>Information you provide directly</h3>
          <p>
            This website does not offer accounts, sign-in, payments, uploads, booking tools, or
            chatbots. We do not collect name, email, phone number, payment card data, or uploaded
            content through forms on this site.
          </p>
          <p>
            If you contact us through{" "}
            <a
              href="https://github.com/Sai-Vidyut/Peffle/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Issues
            </a>{" "}
            or other public GitHub features, GitHub processes that information under GitHub&apos;s
            own privacy policy. We may see whatever you choose to include in an issue, pull request,
            or comment (for example, a name, email address shown on your GitHub profile, or
            diagnostic logs you paste).
          </p>

          <h3>Information collected automatically</h3>
          <ul>
            <li>
              <strong>Device / usage analytics on this site:</strong> We do not run first-party
              analytics SDKs, advertising pixels, or session recorders on this website.
            </li>
            <li>
              <strong>Hosting and delivery logs:</strong> When this site is published on a hosting
              or CDN provider, that provider may automatically process standard request data (such
              as IP address, user agent, requested URL, and timestamps) to deliver pages and keep
              the service running. We do not use that data for advertising. Exact retention depends
              on the host&apos;s settings once a production deployment exists.
            </li>
            <li>
              <strong>Location:</strong> We do not collect precise GPS location. An IP address in
              host logs may imply an approximate location; we do not use it to map visitors.
            </li>
            <li>
              <strong>Cookies:</strong> This site does not set advertising or analytics cookies. The
              browser may still store ordinary technical state needed to load the page (for example,
              cached assets).
            </li>
          </ul>

          <h3>Information from third parties</h3>
          <p>
            We do not offer &quot;Sign in with Google/Apple&quot; or other social login. We do not
            receive profile data from identity providers for this product.
          </p>

          <h2>2. Third-Party Tools and Trackers</h2>
          <p>
            As of the date above, this marketing site does not embed analytics, advertising, CRM,
            chatbot, email-marketing, or LLM API tools that collect visitor data on our behalf.
            Fonts are bundled at build time via Next.js font loading and are not fetched from Google
            at runtime in the visitor&apos;s browser.
          </p>

          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>What it collects</th>
                  <th>Why we use it</th>
                  <th>Data shared with them</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>None on this site</td>
                  <td>N/A — no analytics or ad pixels are installed</td>
                  <td>N/A</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Site host / CDN (when deployed)</td>
                  <td>Standard HTTP request logs (IP, user agent, URL, time)</td>
                  <td>Serve the website and operate infrastructure</td>
                  <td>Whatever that provider processes as part of hosting</td>
                </tr>
                <tr>
                  <td>GitHub (linked destination)</td>
                  <td>Whatever you submit on github.com</td>
                  <td>Source code, issues, documentation</td>
                  <td>Per GitHub&apos;s terms when you use GitHub</td>
                </tr>
                <tr>
                  <td>npm (linked destination)</td>
                  <td>Whatever npm collects when you visit or install packages</td>
                  <td>Package distribution</td>
                  <td>Per npm&apos;s terms when you use npm</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Links to GitHub and npm leave this site. Their privacy practices are governed by their
            own policies, not this one.
          </p>

          <h2>3. How We Use Information</h2>
          <p>We use information only as follows:</p>
          <ul>
            <li>Provide and maintain this website and the open-source project</li>
            <li>
              Respond to messages and support requests you send us (for example, via GitHub Issues)
            </li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do not use visitor data for marketing email lists, ad targeting, or retargeting. We
            do not operate paid advertising pixels on this site.
          </p>

          <h2>4. How We Share Information</h2>
          <p>We do not sell your personal information. We share information only with:</p>
          <ul>
            <li>
              <strong>Service providers</strong> who help us operate the website (for example,
              hosting), limited to providing those services to us.
            </li>
            <li>
              <strong>Legal requirements</strong> — if required by law, subpoena, or to protect
              rights, safety, or property.
            </li>
            <li>
              <strong>Business transfers</strong> — if the project or associated assets are acquired
              or merge with another organization, information held by us (such as issue
              correspondence we retain) may transfer as part of that deal.
            </li>
          </ul>

          <h2>5. Data Retention</h2>
          <ul>
            <li>
              <strong>Library / local ledger:</strong> Retained on your machines under your control.
              We do not host a copy.
            </li>
            <li>
              <strong>Website host logs:</strong> Retained according to the hosting provider&apos;s
              configuration once the site is deployed to production.
            </li>
            <li>
              <strong>GitHub communications:</strong> Retained on GitHub under GitHub&apos;s
              retention practices; we may also keep copies of issue content we need to maintain the
              project.
            </li>
          </ul>

          <h2>6. Your Rights</h2>
          <p>
            <strong>If you are in the EU/UK (GDPR):</strong> You may have the right to access,
            correct, delete, restrict, or port personal data we hold about you, and to object to
            certain processing. Contact us via the channel in Section 10. Note that data that exists
            only on your own systems (local Peffle ledgers) is under your control, not ours.
          </p>
          <p>
            <strong>If you are a California resident (CCPA/CPRA):</strong> You have the right to
            know what personal information we collect and to request deletion. We do not sell
            personal information, and we do not share personal information for cross-context
            behavioral advertising as those terms are commonly understood under CCPA/CPRA for this
            site (we do not run ad-tech pixels).
          </p>
          <p>
            <strong>All users:</strong> There is no user account on this website. To ask about
            information related to a GitHub issue or other contact with us, use the contact method
            in Section 10.
          </p>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            Peffle and this website are not directed at children under 13, and we do not knowingly
            collect personal information from children under 13. The software is intended for
            developers and operators of AI agent systems.
          </p>

          <h2>8. Security</h2>
          <p>
            For the library, security depends on how you deploy it (your host, filesystem, and
            database permissions). For this website, we rely on HTTPS when served over a production
            host and on the security practices of that host. No method of transmission or storage is
            100% secure.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated policy on
            this page and revise the &quot;Last updated&quot; date. Continued use of the website or
            software after changes take effect constitutes acceptance of the updated policy.
          </p>

          <h2>10. Contact Us</h2>
          <p>Questions about this policy? Contact the Peffle maintainers through:</p>
          <ul>
            <li>
              GitHub Issues:{" "}
              <a
                href="https://github.com/Sai-Vidyut/Peffle/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/Sai-Vidyut/Peffle/issues
              </a>
            </li>
          </ul>
          <p>
            Project credits: Sai Vidyut, Josh Jiby, and Fathima Rinaya C. There is no separate
            registered business mailing address published for Peffle at this time.
          </p>
        </div>
      </main>
    </>
  );
}
