// ─────────────────────────────────────────────
// File: app/copyright/page.tsx
// Purpose: Copyright and DMCA Policy page. Full legal text converted
//          from docs/legal/COPYRIGHT_POLICY.md. Rendered inside the
//          shared LegalPageShell official document panel.
// Depends on: components/layout/legal-page-shell.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/layout/legal-page-shell'

export const metadata: Metadata = {
  title: 'Copyright Policy - LangTap',
}

export default function CopyrightPage(): ReactNode {
  return (
    <LegalPageShell
      title="Copyright and DMCA Policy"
      lastUpdated="11 June 2026"
      intro={<p>Effective date: [To be set on deployment]</p>}
    >
      <section className="space-y-2">
        <h2>1. Intellectual Property Statement</h2>
        <p>
          All intellectual property rights in the LangTap service, including but not limited to the
          software, source code, algorithms, user interface design, game mechanics, selection
          engine, mastery system, progression logic, visual design, illustrations, animations,
          branding, and documentation, are owned by [Legal Entity Name] or its licensors.
        </p>
        <p>
          The compilation, arrangement, and specific presentation of content within LangTap
          (including the grouping of kana characters, word selection sequences, level structures,
          and practice algorithms) constitutes a protectable creative work, even where individual
          data elements are derived from openly licensed sources.
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. Third-Party Content Licences</h2>
        <p>
          LangTap incorporates the following third-party content under their respective licences:
        </p>
        <table>
          <thead>
            <tr>
              <th>Content</th>
              <th>Source</th>
              <th>Licence</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vocabulary data (definitions, readings, JLPT classifications)</td>
              <td>Openly licensed sources</td>
              <td>Creative Commons</td>
              <td>Attribution provided on Credits page.</td>
            </tr>
            <tr>
              <td>Pronunciation audio</td>
              <td>VOICEVOX</td>
              <td>VOICEVOX Terms (attribution required)</td>
              <td>Pre-generated offline, not runtime synthesis.</td>
            </tr>
            <tr>
              <td>Background music</td>
              <td>HoliznaCC0</td>
              <td>CC0 (Public Domain)</td>
              <td>No attribution required, but provided on Credits page.</td>
            </tr>
            <tr>
              <td>Japanese font (Noto Sans JP)</td>
              <td>Google Fonts</td>
              <td>SIL Open Font Licence 1.1</td>
              <td>Free for commercial use.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Full attribution is available on our <a href="/credits">Credits</a> page at
          langtap.com/credits.
        </p>

        <h3>2.1 Vocabulary Data</h3>
        <p>
          The vocabulary data used in LangTap (word definitions, kana readings, and JLPT level
          classifications) is sourced from openly licensed projects. Full attribution for each
          source is provided on the <a href="/credits">Credits</a> page.
        </p>
        <p>
          Our specific arrangement, selection, and presentation of vocabulary data within the
          LangTap application constitutes a separate protectable work.
        </p>

        <h3>2.2 VOICEVOX Obligations</h3>
        <p>
          Word pronunciation audio is generated using VOICEVOX, an open-source Japanese
          text-to-speech engine. Audio files are pre-generated offline and served as static assets.
        </p>
        <p>Specific voice characters and their individual terms:</p>
        <ul>
          <li>
            [Voice character names and their specific commercial use terms to be confirmed before
            deployment]
          </li>
        </ul>
        <p>
          Each VOICEVOX voice character may have different terms for commercial use. We verify that
          the specific voices used in LangTap are permitted for use in a freemium web application
          context.
        </p>
        <p>
          Attribution is provided on the <a href="/credits">Credits</a> page as required by VOICEVOX
          terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2>3. DMCA Takedown Procedure</h2>

        <h3>3.1 Filing a Copyright Infringement Notice</h3>
        <p>
          If you believe that content available through LangTap infringes your copyright, you may
          submit a written notification (a "DMCA Notice") to our designated copyright agent.
        </p>
        <p>Your DMCA Notice must contain all of the following:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Identification of the copyrighted work</strong> claimed to have been infringed,
            or, if multiple works are covered by a single notification, a representative list of
            such works
          </li>
          <li>
            <strong>Identification of the material</strong> that is claimed to be infringing or to
            be the subject of infringing activity, and information reasonably sufficient to permit
            us to locate the material (e.g., URL or description of where the material appears)
          </li>
          <li>
            <strong>Your contact information</strong>, including your name, postal address,
            telephone number, and email address
          </li>
          <li>
            <strong>A statement</strong> that you have a good faith belief that use of the material
            in the manner complained of is not authorised by the copyright owner, its agent, or the
            law
          </li>
          <li>
            <strong>A statement, made under penalty of perjury</strong>, that the information in
            your notification is accurate and that you are the copyright owner or authorised to act
            on behalf of the copyright owner
          </li>
          <li>
            <strong>Your physical or electronic signature</strong> (or the signature of a person
            authorised to act on behalf of the copyright owner)
          </li>
        </ol>

        <h3>3.2 Designated Copyright Agent</h3>
        <p>Send DMCA Notices to:</p>
        <p>
          <strong>Email:</strong> <a href="mailto:copyright@langtap.com">copyright@langtap.com</a>
          <br />
          <strong>Subject line:</strong> DMCA Takedown Notice
        </p>
        <p>Postal address: [To be added]</p>
        <p>
          DMCA agent registration with the US Copyright Office: [To be completed - USD 6
          registration fee, renewal every 3 years]
        </p>

        <h3>3.3 Our Response</h3>
        <p>Upon receipt of a valid DMCA Notice, we will:</p>
        <ul>
          <li>Acknowledge receipt within 48 hours</li>
          <li>Investigate the claim expeditiously</li>
          <li>
            Remove or disable access to the allegedly infringing material if the notice is valid
          </li>
          <li>Notify the affected user (if applicable) of the takedown</li>
        </ul>

        <h3>3.4 Counter-Notification</h3>
        <p>
          If you believe your content was removed or access was disabled in error or
          misidentification, you may submit a written counter-notification containing:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Identification of the material</strong> that has been removed or to which access
            has been disabled, and the location where the material appeared before removal
          </li>
          <li>
            <strong>A statement under penalty of perjury</strong> that you have a good faith belief
            that the material was removed or disabled as a result of mistake or misidentification
          </li>
          <li>
            <strong>Your name, address, and telephone number</strong>, and a statement that you
            consent to the jurisdiction of the federal district court for the judicial district in
            which your address is located (or, if outside the United States, any judicial district
            in which LangTap may be found), and that you will accept service of process from the
            person who provided the original notification
          </li>
          <li>
            <strong>Your physical or electronic signature</strong>
          </li>
        </ol>
        <p>
          Send counter-notifications to{' '}
          <a href="mailto:copyright@langtap.com">copyright@langtap.com</a> with the subject line
          "DMCA Counter-Notification".
        </p>
        <p>Upon receipt of a valid counter-notification, we will:</p>
        <ul>
          <li>Forward the counter-notification to the original complainant</li>
          <li>
            Inform the complainant that the removed material may be restored in 10-14 business days
          </li>
          <li>
            Restore the material within 10-14 business days unless the complainant files a court
            action
          </li>
        </ul>

        <h3>3.5 Repeat Infringer Policy</h3>
        <p>
          In accordance with the DMCA and our <a href="/terms">Terms of Service</a>, we maintain a
          policy of terminating the accounts of users who are repeat infringers of copyright in
          appropriate circumstances.
        </p>
      </section>

      <section className="space-y-2">
        <h2>4. Trademark</h2>
        <p>
          The LangTap name, logo, and associated branding are proprietary marks of [Legal Entity
          Name]. You may not use these marks without our express written permission, except as
          necessary to refer to the Service in a descriptive, non-misleading manner (e.g., in a
          review or news article).
        </p>
      </section>

      <section className="space-y-2">
        <h2>5. Permitted Uses</h2>
        <p>You may:</p>
        <ul>
          <li>Use LangTap for personal, non-commercial typing practice</li>
          <li>
            Share screenshots or recordings of your own practice sessions on social media, provided
            you do not misrepresent the source
          </li>
          <li>Link to LangTap from your own website or social media</li>
          <li>Refer to LangTap by name in reviews, articles, or educational materials</li>
        </ul>
        <p>You may not:</p>
        <ul>
          <li>
            Reproduce, distribute, or publicly display the Service or its proprietary content
            compilation
          </li>
          <li>Use automated tools to extract, download, or scrape content</li>
          <li>Use LangTap content to build, train, or improve competing products</li>
          <li>Rebrand, white-label, or resell the Service or any part of it</li>
          <li>
            Use our trademarks in a way that suggests endorsement or affiliation without permission
          </li>
        </ul>
        <p>
          Nothing in these restrictions limits your rights under the original open-source or
          Creative Commons licences of third-party content as obtained from their original sources.
          These restrictions apply to LangTap's proprietary arrangement, selection, presentation,
          and compilation of such data within the Service.
        </p>
      </section>

      <section className="space-y-2">
        <h2>6. Content Removal Requests (Non-DMCA)</h2>
        <p>
          For content removal requests that do not involve copyright infringement (e.g., privacy
          concerns, defamation), please contact{' '}
          <a href="mailto:hello@langtap.com">hello@langtap.com</a> with:
        </p>
        <ul>
          <li>A description of the content and its location</li>
          <li>The reason for your removal request</li>
          <li>Your contact information</li>
        </ul>
        <p>We will review all requests and respond within 14 days.</p>
      </section>

      <section className="space-y-2">
        <h2>7. Contact</h2>
        <p>For copyright and intellectual property enquiries:</p>
        <ul>
          <li>
            <strong>Copyright claims:</strong>{' '}
            <a href="mailto:copyright@langtap.com">copyright@langtap.com</a>
          </li>
          <li>
            <strong>General IP enquiries:</strong>{' '}
            <a href="mailto:hello@langtap.com">hello@langtap.com</a>
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <p>
          <strong>DISCLAIMER:</strong> This Copyright Policy is drafted for informational purposes
          and should be reviewed by a qualified solicitor specialising in intellectual property law
          before deployment.
        </p>
      </section>
    </LegalPageShell>
  )
}
