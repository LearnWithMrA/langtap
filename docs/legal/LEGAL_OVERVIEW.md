# LangTap - Legal Documents Overview

**Last updated:** 1 June 2026

---

## Documents in This Folder

| Document | File | Status | Priority |
|----------|------|--------|----------|
| Terms of Service | `TERMS_OF_SERVICE.md` | Draft | Must-have before launch |
| Privacy Policy | `PRIVACY_POLICY.md` | Draft | Must-have before launch |
| Acceptable Use Policy | `ACCEPTABLE_USE_POLICY.md` | Draft | Must-have before launch |
| Copyright and DMCA Policy | `COPYRIGHT_POLICY.md` | Draft | Must-have before launch |
| Refund and Cancellation Policy | Included in Terms of Service (Section 9) | Draft | Must-have before paid tier |

---

## Current vs. Deployed Pages

The currently deployed pages at `/terms` and `/privacy` are lightweight placeholders. These draft documents are the source of truth for the comprehensive versions that will replace them.

| Page | Current State | Gaps |
|------|--------------|------|
| `/terms` | 9 sections, basic coverage | Missing: governing law, IP protection, payment terms, refund policy, DMCA, indemnification, dispute resolution, severability, assignment, warranty details, liability specifics, age restriction |
| `/privacy` | 11 sections, plain language | Missing: lawful basis, data subject rights (only deletion), retention periods, international transfers, sub-processor table, CCPA, automated decision-making, ICO registration |
| `/credits` | 6 attribution entries | Adequate for Phase 1 |
| AUP | 5 bullet points in Terms | Missing: username policy, graduated enforcement, security violations, scraping, competitive use, responsible disclosure, appeals |
| Copyright/DMCA | Not present | Entirely missing |

---

## Action Items Before Launch

### Legally Required (Do Before Going Live)

1. [ ] Assess ICO registration requirement and register if applicable (GBP 52 or GBP 78/year depending on tier, ico.org.uk). Check exemptions at ico.org.uk/for-organisations/register/self-assessment
2. [ ] Establish a legal entity (or confirm sole trader/partnership status)
3. [ ] Confirm Supabase database region and update sub-processor table
4. [ ] Accept/sign Supabase DPA (supabase.com/legal/dpa)
5. [ ] Accept/sign Vercel DPA (vercel.com/legal/dpa)
6. [ ] Verify VOICEVOX commercial use terms cover LangTap's freemium model
7. [ ] Verify vocabulary data source licence obligations (consult solicitor on ShareAlike scope)
8. [ ] Have all documents reviewed by a UK solicitor specialising in tech/SaaS law
9. [ ] Replace all [TBD] placeholders with actual values

9b. [ ] Add age-gate to registration flow (COPPA compliance, launch-critical)
9c. [ ] Add Terms acceptance checkbox to sign-up flow (launch-critical)
9d. [ ] Appoint EU representative (GDPR Art. 27) or document exemption

### Before Paid Tier Launches

10. [ ] Accept/sign Stripe DPA
11. [ ] Register DMCA designated agent with US Copyright Office (USD 6)
12. [ ] Implement self-service cancellation (EU requirement)
13. [ ] Implement checkout flow with express consent for digital content during withdrawal period
14. [ ] Implement cookie table display (specific cookie names and durations)

### Implementation Tasks (Sprint Work)

15. [ ] Build comprehensive Terms of Service page from `TERMS_OF_SERVICE.md`
16. [ ] Build comprehensive Privacy Policy page from `PRIVACY_POLICY.md`
17. [ ] Build Acceptable Use Policy page from `ACCEPTABLE_USE_POLICY.md`
18. [ ] Build Copyright Policy page from `COPYRIGHT_POLICY.md`
19. [ ] Add landing-page top bar to all legal/static pages (logo links to landing page)
20. [ ] Add sign-up age-gate checkbox ("I confirm I am 13 or older")
21. [ ] Add Terms acceptance checkbox to sign-up flow
22. [ ] Add data export feature (GDPR Art. 20 right to portability)
23. [ ] Update landing footer links to point to new legal pages

---

## Key Legal Considerations

### Governing Law
England and Wales, with consumer protection carve-outs for EU/UK consumers.

### GDPR Compliance (UK GDPR and EU GDPR)
- Lawful basis mapped for every data processing activity
- Full data subject rights documented and actionable
- Sub-processors disclosed with DPAs in place
- International transfer mechanisms documented (SCCs)
- Retention periods specified

### Consumer Protection (UK Consumer Rights Act 2015)
- Digital content must be of satisfactory quality, fit for purpose, and as described
- 14-day right of withdrawal for paid subscriptions
- Warranty disclaimer does not override statutory consumer rights
- Liability limitations include mandatory consumer protection carve-outs

### COPPA (Children's Online Privacy Protection Act)
- Age restriction (13+) in Terms and Privacy Policy
- Age-gate during registration
- Immediate deletion if under-13 user discovered

### CCPA/CPRA (California)
- Categories of collected data disclosed
- "Do not sell" status clearly stated (we do not sell data)
- Rights to know, delete, correct, and opt-out documented

### Payments and Refunds
- Stripe handles payment processing (PCI DSS compliant)
- 14-day refund window on initial purchase (UK/EU consumer law)
- 48-hour refund window on renewal charges
- No refund for termination for cause
- Self-service cancellation required

---

## Professional Legal Review

These documents are drafted as comprehensive starting points but must be reviewed by a qualified UK solicitor specialising in technology, SaaS, and consumer law before deployment. Key areas requiring professional review:

1. The governing law and jurisdiction clauses
2. UK Consumer Rights Act 2015 compliance of the warranty disclaimer and liability cap
3. GDPR lawful basis mapping (particularly contract performance vs legitimate interest)
4. Creative Commons ShareAlike obligations for vocabulary data in a web application context
5. VOICEVOX commercial use terms verification
6. Age restriction enforcement adequacy for COPPA compliance
7. International data transfer mechanisms post-Brexit

---

**NOTE:** These are draft documents, not legal advice. Do not deploy without professional legal review.
