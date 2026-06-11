// ─────────────────────────────────────────────
// File: app/terms/page.tsx
// Purpose: Terms of Service page. Full legal text converted from
//          docs/legal/TERMS_OF_SERVICE.md. Rendered inside the shared
//          LegalPageShell official document panel.
// Depends on: components/layout/legal-page-shell.tsx
// ─────────────────────────────────────────────

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/layout/legal-page-shell'

export const metadata: Metadata = {
  title: 'Terms of Service - LangTap',
}

export default function TermsPage(): ReactNode {
  return (
    <LegalPageShell
      title="Terms of Service"
      lastUpdated="11 June 2026"
      intro={<p>Effective date: [To be set on deployment]</p>}
    >
      <section className="space-y-2">
        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing or using LangTap ("the Service"), you agree to be bound by these Terms of
          Service ("Terms"). If you do not agree to these Terms, do not use the Service.
        </p>
        <p>
          LangTap is operated by [Legal Entity Name], registered in England and Wales (company
          number [TBD]), with registered address at [TBD] ("we", "us", "our", "LangTap").
        </p>
        <p>
          These Terms, together with our <a href="/privacy">Privacy Policy</a>,{' '}
          <a href="/acceptable-use">Acceptable Use Policy</a>, and any other policies referenced
          herein, constitute the entire agreement between you and LangTap regarding your use of the
          Service.
        </p>
      </section>

      <section className="space-y-2">
        <h2>2. Description of Service</h2>
        <p>
          LangTap is a web-based Japanese typing fluency application. It helps you build speed and
          comfort typing Japanese characters on physical and mobile keyboards. LangTap is a typing
          practice tool. It is not a language course, tutoring service, or exam preparation tool. We
          make no guarantees about language learning outcomes, proficiency improvements, or JLPT
          examination results.
        </p>
      </section>

      <section className="space-y-2">
        <h2>3. Eligibility and Age Restrictions</h2>
        <p>
          You must be at least 13 years old to use LangTap. If you are between 13 and 18 years of
          age, you must have the consent of a parent or legal guardian to use the Service.
        </p>
        <p>By creating an account, you confirm that:</p>
        <ul>
          <li>You are at least 13 years old</li>
          <li>If you are under 18, you have obtained parental or guardian consent</li>
          <li>You have the legal capacity to enter into a binding agreement</li>
        </ul>
        <p>
          If we learn that an account belongs to a person under 13, we will delete the account and
          all associated data immediately without notice.
        </p>
      </section>

      <section className="space-y-2">
        <h2>4. Account Responsibilities</h2>
        <p>You are responsible for:</p>
        <ul>
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activity that occurs under your account</li>
          <li>
            Choosing a username that is not your real name or personally identifying information
          </li>
          <li>
            Notifying us immediately at security@langtap.com if you suspect unauthorized access to
            your account
          </li>
        </ul>
        <p>You may not:</p>
        <ul>
          <li>Share your account credentials with others</li>
          <li>
            Create multiple accounts for the purpose of manipulating the leaderboard or
            circumventing restrictions
          </li>
          <li>Transfer your account to another person without our written consent</li>
        </ul>
        <p>
          We may remove or require you to change any username that we determine, at our sole
          discretion, to be offensive, misleading, or in violation of our{' '}
          <a href="/acceptable-use">Acceptable Use Policy</a>.
        </p>
      </section>

      <section className="space-y-2">
        <h2>5. Guest Mode</h2>
        <p>
          Guest mode allows you to use LangTap without creating an account, subject to a 30-metre
          practice cap. Guest practice progress (scores, mastery data) is stored in your browser's
          localStorage. A minimal server-side record is created to enforce the guest usage cap
          (distance travelled). Standard server access logs (IP address, browser type) are also
          generated. See our <a href="/privacy">Privacy Policy</a> for details.
        </p>
        <p>You acknowledge that:</p>
        <ul>
          <li>
            Guest data is permanently lost if you clear your browser data, switch devices, or use
            private/incognito browsing
          </li>
          <li>We are not responsible for lost guest data under any circumstances</li>
          <li>Guest mode is subject to functional limitations compared to registered accounts</li>
          <li>Creating an account is the only way to save progress permanently to our servers</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>6. Acceptable Use</h2>
        <p>
          You agree to comply with our <a href="/acceptable-use">Acceptable Use Policy</a>, which
          forms part of these Terms. In summary, you agree not to:
        </p>
        <ul>
          <li>Attempt to access other users' accounts, data, or personal information</li>
          <li>
            Submit false, manipulated, or artificially generated practice data to the leaderboard
          </li>
          <li>
            Use automated tools, bots, scripts, browser extensions, or any non-human means to
            interact with the Service
          </li>
          <li>
            Exploit bugs, vulnerabilities, or security weaknesses (report them to
            security@langtap.com instead)
          </li>
          <li>
            Reverse-engineer, decompile, disassemble, or attempt to derive the source code of the
            Service
          </li>
          <li>
            Scrape, crawl, or use automated means to collect or extract content or data from the
            Service
          </li>
          <li>
            Use the Service or any data obtained from it to develop, enhance, or operate a product
            or service that competes with LangTap
          </li>
          <li>Circumvent security measures, rate limits, access controls, or usage restrictions</li>
          <li>Interfere with the Service's infrastructure or other users' experience</li>
          <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
        </ul>
        <p>
          Full details are in the <a href="/acceptable-use">Acceptable Use Policy</a>.
        </p>
      </section>

      <section className="space-y-2">
        <h2>7. Intellectual Property</h2>

        <h3>7.1 Ownership</h3>
        <p>
          All intellectual property rights in LangTap, including but not limited to the software,
          algorithms, user interface design, game mechanics, selection engine, mastery system,
          progression logic, visual design, branding, and documentation, are owned by [Legal Entity
          Name] or its licensors. The Service is licensed to you, not sold.
        </p>

        <h3>7.2 Limited Licence</h3>
        <p>
          Subject to your compliance with these Terms, we grant you a limited, non-exclusive,
          non-transferable, revocable licence to access and use LangTap for personal, non-commercial
          typing practice purposes only.
        </p>

        <h3>7.3 Restrictions</h3>
        <p>You may not:</p>
        <ul>
          <li>
            Copy, modify, distribute, sell, lease, sublicence, or create derivative works from any
            part of the Service
          </li>
          <li>
            Use any data mining, robots, scraping, or similar data-gathering tools on the Service
          </li>
          <li>
            Reproduce the Service's content compilation, arrangement, or presentation for any
            purpose
          </li>
          <li>Remove, alter, or obscure any copyright, trademark, or proprietary notices</li>
          <li>
            Use LangTap content or data to build, train, or improve any competing product or
            service, including artificial intelligence or machine learning models
          </li>
          <li>Frame or mirror any portion of the Service without our written consent</li>
          <li>Use the LangTap name, logo, or branding without our express written permission</li>
        </ul>

        <h3>7.4 Third-Party Content</h3>
        <p>
          LangTap incorporates third-party content under open-source and Creative Commons licences.
          These licences apply to the original works as specified on our{' '}
          <a href="/credits">Credits</a> page. Our specific arrangement, selection, and presentation
          of openly licensed data constitutes a separate protectable work. Your access to LangTap
          does not grant you rights to extract or redistribute that arrangement.
        </p>
        <p>
          Nothing in these Terms restricts your rights under the original licences of third-party
          content where those licences grant you independent rights. These Terms restrict only
          LangTap's proprietary elements: the software, algorithms, UI design, compilation choices,
          branding, and the specific arrangement and selection of content within the Service.
        </p>

        <h3>7.5 Feedback</h3>
        <p>
          If you provide us with feedback, suggestions, or ideas about the Service, you grant us a
          perpetual, irrevocable, worldwide, royalty-free licence to use, modify, and incorporate
          that feedback without obligation to you.
        </p>
      </section>

      <section className="space-y-2">
        <h2>8. Subscription and Payment Terms</h2>

        <h3>8.1 Free Tier</h3>
        <p>
          LangTap offers a free tier with certain usage limitations. The free tier may be modified
          or discontinued at our discretion with reasonable notice.
        </p>

        <h3>8.2 Paid Subscriptions</h3>
        <p>
          Paid subscription plans ("Premium") are available with additional features and
          capabilities. By subscribing to a paid plan:
        </p>
        <ul>
          <li>
            You authorise us to charge your chosen payment method at the beginning of each billing
            period
          </li>
          <li>
            Your subscription renews automatically at the end of each billing period unless you
            cancel before the renewal date
          </li>
          <li>
            Prices are displayed in your local currency where supported, or in GBP. You are
            responsible for any applicable taxes, duties, or levies in your jurisdiction
          </li>
          <li>Subscription fees are charged in advance for the upcoming billing period</li>
        </ul>

        <h3>8.3 Price Changes</h3>
        <p>
          We may change subscription prices at any time. Price increases will be communicated to you
          at least 30 days before they take effect. The new price applies at your next renewal date
          after the notice period. If you do not agree to the new price, you must cancel before the
          renewal date.
        </p>

        <h3>8.4 Failed Payments</h3>
        <p>If a payment fails, we may:</p>
        <ul>
          <li>Retry the payment method up to 3 times over a 7-day period</li>
          <li>Notify you via email and within the application</li>
          <li>Suspend your access to paid features after 7 days of failed payment</li>
          <li>Downgrade your account to the free tier after 14 days of failed payment</li>
        </ul>
        <p>
          We are not responsible for any fees, charges, or penalties imposed by your payment
          provider in connection with failed payments.
        </p>

        <h3>8.5 Payment Processing</h3>
        <p>
          Payments are processed by Stripe, Inc. We do not store your full payment card details on
          our servers. Your payment information is handled in accordance with Stripe's security
          standards and PCI DSS compliance. By providing payment details, you also agree to Stripe's
          Services Agreement.
        </p>
      </section>

      <section className="space-y-2">
        <h2>9. Refund and Cancellation Policy</h2>

        <h3>9.1 How to Cancel</h3>
        <p>You may cancel your subscription at any time through:</p>
        <ul>
          <li>Your account settings within LangTap</li>
          <li>The Stripe customer billing portal</li>
          <li>Emailing billing@langtap.com with your account email address</li>
        </ul>
        <p>Cancellation must be as easy as subscribing.</p>

        <h3>9.2 Effect of Cancellation</h3>
        <p>After cancellation (without refund):</p>
        <ul>
          <li>You retain access to paid features until the end of your current billing period</li>
          <li>Your account reverts to the free tier at the end of the paid period</li>
          <li>Your practice data, scores, and progress are retained on the free tier</li>
          <li>
            We do not provide prorated refunds for unused time in a billing period, except where
            required by applicable law
          </li>
        </ul>
        <p>After cancellation with refund (withdrawal):</p>
        <ul>
          <li>Premium access ends immediately upon refund processing</li>
          <li>Your account reverts to the free tier</li>
          <li>Your practice data, scores, and progress are retained on the free tier</li>
        </ul>

        <h3>9.3 Refund Policy</h3>
        <p>
          <strong>Within 14 days of initial purchase:</strong> If you cancel within 14 days of your
          first subscription payment, you may request a full refund by emailing billing@langtap.com.
          If you gave express consent to begin receiving the service immediately and used paid
          features during the refund period, we may deduct a proportional amount for the days of
          service used. The daily rate is calculated as: subscription price divided by the number of
          days in the billing period. Days used is the number of calendar days from the purchase
          date to the date we receive the cancellation request (inclusive, UTC timezone). Partial
          days count as full days. This deduction is in accordance with UK Consumer Contracts
          Regulations 2013 and the EU Consumer Rights Directive.
        </p>
        <p>
          We reserve the right to refuse refund requests from users who repeatedly subscribe and
          cancel within the withdrawal period. Refund abuse (three or more withdrawal refund
          requests within 12 months) may result in loss of future refund eligibility, except where
          required by applicable consumer protection law.
        </p>
        <p>
          <strong>After 14 days:</strong> No refunds are provided for the current billing period
          after the initial 14-day window, unless required by your local consumer protection laws.
        </p>
        <p>
          <strong>Renewal payments:</strong> Refunds for renewal payments are available within 48
          hours of the renewal charge, provided you have not used the Service since the renewal.
          After 48 hours, no refund is available for that billing period.
        </p>
        <p>
          <strong>How refunds are processed:</strong> Refunds are issued to the original payment
          method within 14 days of the cancellation or refund request being confirmed. No fee is
          charged for the refund.
        </p>

        <h3>9.4 EU/UK Right of Withdrawal</h3>
        <p>
          If you are a consumer in the EU or UK, you have a 14-day right of withdrawal from the date
          of purchase under the Consumer Rights Directive (EU) and Consumer Contracts Regulations
          2013 (UK).
        </p>
        <p>
          Before we supply any paid digital content during the withdrawal period, we will ask you to
          give express consent to begin receiving the service immediately and to acknowledge that
          you will lose your right of withdrawal once the digital content has been fully provided.
          If you withdraw after giving this consent but before the end of the billing period, we may
          charge you proportionally for the service rendered up to the date of withdrawal,
          calculated on a pro-rata basis.
        </p>

        <h3>9.5 No Refund for Termination for Cause</h3>
        <p>
          If your account is terminated due to violation of these Terms or the{' '}
          <a href="/acceptable-use">Acceptable Use Policy</a>, no refund will be provided for any
          remaining subscription period, except where a refund is required by applicable consumer
          protection law in your jurisdiction.
        </p>
      </section>

      <section className="space-y-2">
        <h2>10. Content and Attribution</h2>
        <p>LangTap uses third-party content under open licences, including but not limited to:</p>
        <ul>
          <li>Openly licensed vocabulary data sources</li>
          <li>VOICEVOX for pronunciation audio</li>
          <li>HoliznaCC0 (CC0) for background music</li>
          <li>Google Noto Sans JP (SIL Open Font Licence 1.1)</li>
        </ul>
        <p>
          Full attribution is available on our <a href="/credits">Credits</a> page. You may not
          redistribute any content from LangTap separately from the Service, whether or not it was
          originally published under an open licence, except as expressly permitted by the original
          licence terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2>11. Availability and Modifications</h2>
        <p>
          We aim to keep LangTap available but do not guarantee uninterrupted, timely, secure, or
          error-free access. We may, at any time and without liability:
        </p>
        <ul>
          <li>Modify, update, or discontinue features of the Service</li>
          <li>Perform maintenance that causes temporary downtime</li>
          <li>Change the user interface, functionality, or content</li>
          <li>Impose new or change existing usage limits</li>
        </ul>
        <p>
          Where reasonably practicable, we will provide advance notice of material changes that
          significantly affect your use of the Service. We are not liable for any modification,
          suspension, or discontinuation of the Service or any part thereof.
        </p>
      </section>

      <section className="space-y-2">
        <h2>12. Account Suspension and Termination</h2>

        <h3>12.1 Termination by You</h3>
        <p>
          You may delete your account at any time from the Profile screen. Deletion is permanent and
          removes your personal data from our servers in accordance with our{' '}
          <a href="/privacy">Privacy Policy</a>, subject to the retention exceptions described
          therein (tax records, fraud investigation, active legal claims, and backup overwrite
          cycles).
        </p>

        <h3>12.2 Termination by Us</h3>
        <p>We may suspend or terminate your account if:</p>
        <ul>
          <li>
            You violate these Terms or the <a href="/acceptable-use">Acceptable Use Policy</a>
          </li>
          <li>You engage in conduct that is harmful to other users, us, or third parties</li>
          <li>Your account has been inactive for 12 months (with prior email notice)</li>
          <li>We are required to do so by law</li>
          <li>We discontinue the Service</li>
        </ul>

        <h3>12.3 Graduated Enforcement</h3>
        <p>
          For less severe violations, we will generally attempt to notify you and give you a
          reasonable opportunity to remedy the issue before taking action. For severe violations,
          including but not limited to harassment, illegal activity, security threats, fraud, or
          repeated offences, we may terminate your account immediately without prior notice.
        </p>

        <h3>12.4 Effect of Termination</h3>
        <p>Upon termination:</p>
        <ul>
          <li>Your right to access LangTap ceases immediately</li>
          <li>
            We will delete your personal data in accordance with our{' '}
            <a href="/privacy">Privacy Policy</a> retention schedule
          </li>
          <li>
            If terminated for cause, no refund is provided for any remaining subscription period,
            except where required by applicable consumer protection law
          </li>
          <li>
            Sections of these Terms that by their nature should survive termination will survive,
            including Intellectual Property, Limitation of Liability, Indemnification, and Dispute
            Resolution
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>13. Warranty Disclaimer</h2>
        <p>
          THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY
          KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED
          WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
          NON-INFRINGEMENT.
        </p>
        <p>We do not warrant that:</p>
        <ul>
          <li>
            The Service will be uninterrupted, error-free, secure, or free from viruses or harmful
            components
          </li>
          <li>
            The results obtained from using the Service will be accurate, reliable, or meet your
            expectations
          </li>
          <li>Any errors in the Service will be corrected</li>
          <li>The Service will be compatible with your device, browser, or operating system</li>
        </ul>
        <p>
          LangTap is a typing practice tool. We make no representations or warranties regarding
          language learning outcomes, typing speed improvements, vocabulary retention, or
          performance on any external examination including JLPT.
        </p>
        <p>
          Nothing in this section excludes warranties which cannot be excluded or limited under
          applicable law, including the statutory rights of consumers in the UK and EU under the
          Consumer Rights Act 2015 and equivalent legislation.
        </p>
      </section>

      <section className="space-y-2">
        <h2>14. Limitation of Liability</h2>

        <h3>14.1 Exclusion of Certain Damages</h3>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LANGTAP, ITS
          OPERATORS, DIRECTORS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY:
        </p>
        <ul>
          <li>Indirect, incidental, special, consequential, or punitive damages</li>
          <li>Loss of data, practice progress, or practice streaks</li>
          <li>Loss of profits, revenue, or business opportunity</li>
          <li>Interruption of service or loss of access</li>
          <li>Cost of procurement of substitute services</li>
          <li>Damages arising from unauthorized access to or alteration of your data</li>
        </ul>
        <p>
          WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY
          OTHER LEGAL THEORY, AND WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH
          DAMAGES. THIS SECTION 14.1 IS SUBJECT TO THE CARVE-OUTS IN SECTION 14.3 AND DOES NOT
          EXCLUDE LIABILITY FOR LOSSES CAUSED BY OUR FAILURE TO USE REASONABLE CARE AND SKILL WHERE
          SUCH EXCLUSION IS NOT PERMITTED BY APPLICABLE LAW.
        </p>

        <h3>14.2 Liability Cap</h3>
        <p>
          Our total aggregate liability for all claims arising from or relating to these Terms or
          your use of the Service shall not exceed the greater of:
        </p>
        <ul>
          <li>(a) The amounts you have paid to us in the 12 months preceding the claim, or</li>
          <li>(b) Fifty pounds sterling (GBP 50)</li>
        </ul>

        <h3>14.3 Consumer Protection Carve-Out</h3>
        <p>Nothing in these Terms excludes or limits our liability for:</p>
        <ul>
          <li>Death or personal injury caused by our negligence</li>
          <li>Fraud or fraudulent misrepresentation</li>
          <li>
            Breaches of data protection law where liability cannot be excluded (including UK GDPR
            Art. 82 and EU GDPR Art. 82 compensation rights)
          </li>
          <li>
            Any liability which cannot be excluded or limited under applicable law, including
            mandatory consumer protection rights under UK or EU law
          </li>
        </ul>
        <p>
          If you are a consumer in the UK or EU, these limitations apply only to the extent
          permitted by the Consumer Rights Act 2015 (UK) or equivalent consumer protection
          legislation in your jurisdiction. Your statutory rights are not affected.
        </p>
      </section>

      <section className="space-y-2">
        <h2>15. Indemnification</h2>
        <p>
          To the extent permitted by applicable law, you agree to indemnify and hold harmless
          LangTap, its operators, directors, employees, and affiliates from claims, damages, losses,
          and reasonable legal costs arising directly from:
        </p>
        <ul>
          <li>
            Your deliberate violation of these Terms or the{' '}
            <a href="/acceptable-use">Acceptable Use Policy</a>
          </li>
          <li>Your deliberate infringement of any third party's intellectual property rights</li>
          <li>Your use of the Service for illegal purposes</li>
          <li>
            Content you deliberately submit in violation of these Terms (including offensive or
            unlawful usernames)
          </li>
        </ul>
        <p>This indemnification:</p>
        <ul>
          <li>
            Does not apply to the extent the claim arises from our own negligence, wilful
            misconduct, or breach of these Terms
          </li>
          <li>
            Does not require you to indemnify us for claims arising from your ordinary, good-faith
            use of the Service
          </li>
          <li>Is subject to the consumer protection carve-outs in Section 14.3</li>
          <li>
            Does not apply to consumers in the UK or EU where such indemnification would be deemed
            an unfair contract term under the Consumer Rights Act 2015 or equivalent legislation
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2>16. Dispute Resolution</h2>

        <h3>16.1 Informal Resolution</h3>
        <p>
          If you have a dispute or concern about the Service, please contact us first at
          hello@langtap.com. We will attempt to resolve the matter informally within 30 days.
        </p>

        <h3>16.2 Jurisdiction</h3>
        <p>
          If we cannot resolve the dispute informally, it shall be subject to the exclusive
          jurisdiction of the courts of England and Wales.
        </p>

        <h3>16.3 Consumer Protection</h3>
        <p>
          If you are a consumer resident in the UK (including Scotland or Northern Ireland), the EU,
          or another jurisdiction with mandatory consumer protection laws, nothing in this section
          prevents you from bringing proceedings in the courts of your country or territory of
          residence in accordance with those laws.
        </p>
        <p>
          EU and UK residents may also contact their national consumer protection body or European
          Consumer Centre for assistance with cross-border disputes.
        </p>

        <h3>16.4 Time Limitation</h3>
        <p>
          Any claim arising from or relating to these Terms or the Service must be brought within
          one (1) year after the cause of action accrues, except where a longer period is required
          by applicable law.
        </p>
      </section>

      <section className="space-y-2">
        <h2>17. Copyright and DMCA</h2>
        <p>
          If you believe that content on LangTap infringes your copyright, please send a written
          notice to copyright@langtap.com containing:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Identification of the copyrighted work claimed to have been infringed</li>
          <li>
            Identification of the allegedly infringing material and its location on the Service
          </li>
          <li>Your contact information (name, address, telephone number, and email)</li>
          <li>
            A statement that you have a good faith belief that the use is not authorised by the
            copyright owner, its agent, or the law
          </li>
          <li>
            A statement, under penalty of perjury, that the information in your notice is accurate
            and that you are the copyright owner or authorised to act on behalf of the owner
          </li>
          <li>Your physical or electronic signature</li>
        </ol>
        <p>
          We respond to valid notices in accordance with the Digital Millennium Copyright Act (DMCA)
          and will remove or disable access to allegedly infringing material expeditiously. Repeat
          infringers will have their accounts terminated. See our{' '}
          <a href="/copyright">Copyright Policy</a> for the full procedure.
        </p>
        <p>
          <strong>Counter-Notification:</strong> If you believe your content was removed in error,
          you may submit a counter-notification with the information required under 17 U.S.C.
          Section 512(g)(3).
        </p>
      </section>

      <section className="space-y-2">
        <h2>18. Electronic Communications</h2>
        <p>
          By creating an account, you consent to receive electronic communications from us
          regarding:
        </p>
        <ul>
          <li>Account security (password resets, suspicious activity alerts)</li>
          <li>Service changes that affect your account</li>
          <li>Billing and payment confirmations (for paid users)</li>
          <li>Account status notifications (approaching limits, inactivity warnings)</li>
        </ul>
        <p>
          These are transactional communications necessary for the operation of the Service. We will
          not send marketing or promotional emails unless you explicitly opt in. You can manage your
          notification preferences in Settings.
        </p>
      </section>

      <section className="space-y-2">
        <h2>19. Third-Party Links and Services</h2>
        <p>
          LangTap may contain links to third-party websites, services, or resources (including
          payment processing by Stripe). We do not control and are not responsible for the content,
          privacy practices, availability, or security of those third-party services. Your
          interactions with third-party services are governed by their own terms and policies.
        </p>
      </section>

      <section className="space-y-2">
        <h2>20. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of England and
          Wales, without regard to conflict of law principles.
        </p>
        <p>
          If you are a consumer in the EU or UK, nothing in these Terms affects your rights under
          the mandatory consumer protection laws of your country of residence, including your right
          to bring proceedings in your local courts.
        </p>
      </section>

      <section className="space-y-2">
        <h2>21. General Provisions</h2>

        <h3>21.1 Severability</h3>
        <p>
          If any provision of these Terms is found to be invalid, illegal, or unenforceable by a
          court of competent jurisdiction, the remaining provisions shall continue in full force and
          effect. The invalid provision shall be modified to the minimum extent necessary to make it
          valid and enforceable while preserving its original intent.
        </p>

        <h3>21.2 Waiver</h3>
        <p>
          Our failure to enforce any right or provision of these Terms shall not be deemed a waiver
          of that right or provision. Any waiver must be in writing and signed by us.
        </p>

        <h3>21.3 Assignment</h3>
        <p>
          We may assign or transfer these Terms and our rights and obligations hereunder to a
          successor entity in connection with a merger, acquisition, reorganisation, or sale of all
          or substantially all of our assets. You may not assign your rights or obligations under
          these Terms without our prior written consent.
        </p>

        <h3>21.4 Entire Agreement</h3>
        <p>
          These Terms, together with our <a href="/privacy">Privacy Policy</a>,{' '}
          <a href="/acceptable-use">Acceptable Use Policy</a>, and any other policies or agreements
          referenced herein, constitute the entire agreement between you and LangTap regarding your
          use of the Service, superseding any prior agreements or understandings.
        </p>

        <h3>21.5 Force Majeure</h3>
        <p>
          We shall not be liable for any failure or delay in performing our obligations under these
          Terms where such failure or delay results from circumstances beyond our reasonable
          control, including but not limited to natural disasters, war, terrorism, riots, government
          actions, internet failures, power outages, or failure of third-party services.
        </p>

        <h3>21.6 No Third-Party Beneficiaries</h3>
        <p>
          These Terms do not confer any rights on any third party, except as expressly stated
          herein.
        </p>
      </section>

      <section className="space-y-2">
        <h2>22. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. We will notify you of material changes by:
        </p>
        <ul>
          <li>Posting the updated Terms on this page with a new "Last updated" date</li>
          <li>Sending an email to your registered email address (for significant changes)</li>
          <li>Displaying a notice within the application</li>
        </ul>
        <p>
          Your continued use of the Service after any changes constitutes acceptance of the updated
          Terms. If you do not agree to the updated Terms, you must stop using the Service and may
          delete your account.
        </p>
        <p>
          For changes that materially reduce your rights, we will provide at least 30 days' notice
          before the changes take effect.
        </p>
      </section>

      <section className="space-y-2">
        <h2>23. Contact</h2>
        <p>If you have questions about these Terms, contact us at:</p>
        <ul>
          <li>
            General enquiries: <a href="mailto:hello@langtap.com">hello@langtap.com</a>
          </li>
          <li>
            Billing and refunds: <a href="mailto:billing@langtap.com">billing@langtap.com</a>
          </li>
          <li>
            Security concerns: <a href="mailto:security@langtap.com">security@langtap.com</a>
          </li>
          <li>
            Copyright claims: <a href="mailto:copyright@langtap.com">copyright@langtap.com</a>
          </li>
        </ul>
        <p>Postal address: [To be added]</p>
      </section>

      <section className="space-y-2">
        <p>
          <strong>DISCLAIMER:</strong> These Terms of Service are drafted for informational purposes
          and should be reviewed by a qualified UK solicitor specialising in technology and consumer
          law before deployment. They do not constitute legal advice.
        </p>
      </section>
    </LegalPageShell>
  )
}
