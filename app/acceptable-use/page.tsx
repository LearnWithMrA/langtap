// ─────────────────────────────────────────────
// File: app/acceptable-use/page.tsx
// Purpose: Acceptable Use Policy page. Full legal text converted from
//          docs/legal/ACCEPTABLE_USE_POLICY.md. Rendered inside the
//          shared LegalPageShell official document panel.
// Depends on: components/layout/legal-page-shell.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/layout/legal-page-shell'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy - LangTap',
}

export default function AcceptableUsePage(): ReactNode {
  return (
    <LegalPageShell
      title="Acceptable Use Policy"
      lastUpdated="11 June 2026"
      intro={
        <p>
          Effective date: [To be set on deployment]. This Acceptable Use Policy ("AUP") forms part
          of our <a href="/terms">Terms of Service</a>. By using LangTap, you agree to comply with
          this policy.
        </p>
      }
    >
      <section className="space-y-2">
        <h2>1. Purpose</h2>
        <p>
          This policy exists to protect the LangTap community, the integrity of the leaderboard, and
          the security of the Service. Violations may result in account suspension or termination.
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. Prohibited Username Content</h2>
        <p>
          Your username is publicly visible on the leaderboard. You may not use a username that:
        </p>
        <ul>
          <li>
            Contains offensive, discriminatory, racist, sexist, homophobic, or hateful language
          </li>
          <li>Impersonates another user, public figure, LangTap staff, or any real person</li>
          <li>Contains sexually explicit, violent, or disturbing references</li>
          <li>
            Contains the real name or personally identifying information of another person without
            their consent
          </li>
          <li>Contains spam, promotional content, or URLs</li>
          <li>
            Is designed to be misleading about your identity or status (e.g., "admin", "moderator",
            "official")
          </li>
          <li>Contains profanity or slurs in any language</li>
        </ul>
        <p>We may change or remove any username that violates this policy without prior notice.</p>
      </section>

      <section className="space-y-2">
        <h2>3. Prohibited Conduct</h2>
        <p>You agree not to engage in any of the following:</p>

        <h3>3.1 Account Abuse</h3>
        <ul>
          <li>Accessing or attempting to access another user's account or personal data</li>
          <li>
            Creating multiple accounts to manipulate the leaderboard, circumvent restrictions, or
            evade enforcement actions
          </li>
          <li>Sharing your account credentials with others</li>
          <li>Using another person's account without their authorisation</li>
        </ul>

        <h3>3.2 Leaderboard and Data Manipulation</h3>
        <ul>
          <li>
            Submitting false, manipulated, fabricated, or artificially generated practice data
          </li>
          <li>Using scripts, macros, or automated tools to inflate scores</li>
          <li>Exploiting timing, scoring, or progression bugs to gain unfair advantage</li>
          <li>Coordinating with others to manipulate leaderboard rankings</li>
        </ul>

        <h3>3.3 Automated Access and Scraping</h3>
        <ul>
          <li>
            Using bots, scripts, crawlers, spiders, scrapers, or any automated means to interact
            with the Service
          </li>
          <li>
            Using browser extensions, plugins, or third-party tools that automate interactions,
            scrape content, tamper with data, or manipulate results (this does not prohibit
            accessibility tools, password managers, input method editors, ad blockers, or assistive
            technology)
          </li>
          <li>
            Systematically downloading, collecting, or extracting content or data from the Service
          </li>
          <li>
            Accessing the Service's API or backend systems outside of the intended user interface
          </li>
        </ul>

        <h3>3.4 Security Violations</h3>
        <ul>
          <li>
            Attempting to probe, scan, or test the vulnerability of the Service or any related
            system without authorisation (see Section 5 for our responsible disclosure programme)
          </li>
          <li>
            Attempting to circumvent security measures, authentication mechanisms, rate limits, or
            access controls
          </li>
          <li>Attempting to interfere with the Service's infrastructure, networks, or servers</li>
          <li>
            Attempting to disrupt other users' access to or experience of the Service (denial of
            service)
          </li>
          <li>Introducing malware, viruses, worms, trojans, or any harmful code</li>
          <li>Intercepting or monitoring network traffic not intended for you</li>
        </ul>
        <p>
          If you discover a security vulnerability, please report it responsibly to{' '}
          <a href="mailto:security@langtap.com">security@langtap.com</a> rather than exploiting it.
        </p>

        <h3>3.5 Intellectual Property Violations</h3>
        <ul>
          <li>
            Reverse-engineering, decompiling, disassembling, or attempting to derive the source code
            of the Service
          </li>
          <li>
            Copying, reproducing, distributing, or publicly displaying any part of the Service
            without authorisation
          </li>
          <li>
            Using LangTap content, data, or materials to build, train, enhance, or operate a
            competing product or service
          </li>
          <li>
            Removing, altering, or obscuring any copyright notices, trademarks, or proprietary
            labels
          </li>
          <li>
            Framing, mirroring, or embedding any part of the Service on another website or
            application without written permission
          </li>
        </ul>

        <h3>3.6 General Misconduct</h3>
        <ul>
          <li>
            Using the Service for any unlawful purpose or in violation of any applicable law or
            regulation
          </li>
          <li>Harassing, threatening, bullying, or intimidating other users</li>
          <li>Engaging in conduct that is harmful, fraudulent, deceptive, or misleading</li>
          <li>Facilitating any of the above activities by others</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>4. Enforcement</h2>

        <h3>4.1 Investigation</h3>
        <p>
          We may investigate suspected violations of this policy. We reserve the right to access and
          review account activity and data as necessary to investigate potential violations, in
          accordance with our <a href="/privacy">Privacy Policy</a> and applicable law.
        </p>

        <h3>4.2 Enforcement Actions</h3>
        <p>
          Depending on the severity and nature of the violation, we may take one or more of the
          following actions at our sole discretion:
        </p>
        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Minor (first offence)</td>
              <td>Written warning via email</td>
            </tr>
            <tr>
              <td>Moderate</td>
              <td>Temporary account suspension (7-30 days)</td>
            </tr>
            <tr>
              <td>Severe</td>
              <td>Permanent account termination</td>
            </tr>
            <tr>
              <td>Illegal activity</td>
              <td>Account termination and referral to law enforcement</td>
            </tr>
          </tbody>
        </table>
        <p>Additional actions may include:</p>
        <ul>
          <li>Username removal or forced change</li>
          <li>Removal of manipulated leaderboard entries</li>
          <li>Restriction of specific features</li>
          <li>IP-based access restrictions</li>
        </ul>

        <h3>4.3 Immediate Action</h3>
        <p>
          For severe violations, including but not limited to harassment, illegal activity, security
          threats, fraud, or attempts to compromise other users' data, we may terminate your account
          immediately without prior notice or warning.
        </p>

        <h3>4.4 Appeals</h3>
        <p>
          If you believe enforcement action was taken in error, you may appeal by emailing{' '}
          <a href="mailto:hello@langtap.com">hello@langtap.com</a> within 14 days of the action.
          Include your username and a clear explanation of why you believe the action was incorrect.
          We will review your appeal and respond within 14 days.
        </p>
      </section>

      <section className="space-y-2">
        <h2>5. Responsible Disclosure</h2>
        <p>
          We value security researchers who help keep LangTap safe. If you discover a security
          vulnerability:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Email <a href="mailto:security@langtap.com">security@langtap.com</a> with details of the
            vulnerability
          </li>
          <li>Provide sufficient information for us to reproduce the issue</li>
          <li>Do not access, modify, or delete other users' data</li>
          <li>
            Do not publicly disclose the vulnerability until we have had a reasonable opportunity to
            address it
          </li>
          <li>Do not exploit the vulnerability beyond what is necessary to demonstrate it</li>
        </ol>
        <p>We will acknowledge receipt within 48 hours and provide updates on remediation.</p>

        <h3>Safe Harbour</h3>
        <p>
          Security researchers who comply with this responsible disclosure policy will not face
          legal action from us for their good-faith security research. We consider good-faith
          security research conducted in compliance with this policy to be authorised activity. We
          will not pursue civil claims or support criminal prosecution against researchers who
          follow these guidelines.
        </p>
        <p>This safe harbour does not extend to activities that:</p>
        <ul>
          <li>Involve accessing, copying, or exfiltrating other users' personal data</li>
          <li>Involve persistent access or installation of backdoors</li>
          <li>Use social engineering, phishing, or physical attacks</li>
          <li>Constitute denial of service (DoS/DDoS)</li>
          <li>Involve extortion or threats</li>
          <li>
            Are disclosed publicly before we have had reasonable time to remediate (minimum 90 days)
          </li>
          <li>Target third-party systems or services (even if connected to LangTap)</li>
          <li>Violate any applicable law regardless of intent</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>6. Reporting Violations</h2>
        <p>
          If you encounter another user violating this policy (offensive username, leaderboard
          manipulation, etc.), please report it to{' '}
          <a href="mailto:hello@langtap.com">hello@langtap.com</a> with:
        </p>
        <ul>
          <li>The username or account involved</li>
          <li>A description of the violation</li>
          <li>Any relevant evidence (screenshots, timestamps)</li>
        </ul>
        <p>
          We take reports seriously and will investigate promptly. Reports are handled
          confidentially.
        </p>
      </section>

      <section className="space-y-2">
        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this AUP from time to time. Material changes will be communicated in
          accordance with our <a href="/terms">Terms of Service</a>. Your continued use of the
          Service after changes constitutes acceptance.
        </p>
      </section>

      <section className="space-y-2">
        <p>
          <strong>DISCLAIMER:</strong> This Acceptable Use Policy is drafted for informational
          purposes and should be reviewed by a qualified solicitor before deployment.
        </p>
      </section>
    </LegalPageShell>
  )
}
