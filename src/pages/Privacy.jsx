/*
 * Privacy Policy — TEMPLATE COPY ONLY.
 * NOT legal advice. Have UAE-licensed legal counsel review and adapt before
 * publishing. Cross-check against current UAE PDPL, GDPR, and CCPA requirements.
 */
import LegalLayout from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What we collect, how we use it, and your rights over your data. Kitabi operates from the UAE and complies with UAE data-protection law, plus GDPR and CCPA where applicable."
      lastUpdated="2026-05-02"
    >
      <h2>1. Data We Collect</h2>
      <p>Kitabi collects and processes:</p>
      <ul>
        <li>Email address</li>
        <li>Google account information (if using OAuth)</li>
        <li>User-generated content (chapters, stories, edits)</li>
        <li>Usage analytics (which features are used and when)</li>
        <li>IP address and device information</li>
        <li>Chapter metadata (title, genre, date created)</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <p>Data is used <strong>only</strong> for:</p>
      <ul>
        <li>Providing the service</li>
        <li>Improving the AI model (anonymized)</li>
        <li>Responding to user inquiries</li>
        <li>Preventing fraud and abuse</li>
        <li>Legal compliance and law enforcement cooperation</li>
      </ul>
      <p>Data is <strong>not</strong> used for:</p>
      <ul>
        <li>Selling to third parties</li>
        <li>Marketing to users beyond service notifications</li>
        <li>Training commercial models without consent</li>
        <li>Sharing user content publicly</li>
      </ul>

      <h2>3. Data Security</h2>
      <ul>
        <li>All data encrypted in transit (TLS/SSL)</li>
        <li>All data encrypted at rest</li>
        <li>Firebase security protocols enforced</li>
        <li>Regular security audits</li>
        <li>No unencrypted backups</li>
        <li>Access logs maintained</li>
      </ul>

      <h2>4. Data Retention</h2>
      <ul>
        <li>User account data: kept until account deletion</li>
        <li>Generated chapters: kept in user's account</li>
        <li>Usage logs: retained for one year for analytics</li>
        <li>Payment information: securely deleted after payment processing</li>
      </ul>

      <h2>5. Your Rights</h2>
      <p>Users may:</p>
      <ul>
        <li>Download all their data in a standard format</li>
        <li>Delete their account and all associated data</li>
        <li>Request what data we hold about them</li>
        <li>Opt out of analytics tracking</li>
      </ul>
      <p>Users <strong>cannot</strong>:</p>
      <ul>
        <li>Require deletion of legal or compliance records</li>
        <li>Restrict law-enforcement data access</li>
      </ul>

      <h2>6. International Compliance</h2>
      <p>While Kitabi operates in the UAE and complies with UAE law:</p>
      <ul>
        <li>For EU users: GDPR-compliant</li>
        <li>For California users: CCPA-compliant</li>
        <li>For all users: standard international privacy protections</li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        Privacy inquiries and data requests:{' '}
        <a href="mailto:privacy@kitabi.ink">privacy@kitabi.ink</a>
      </p>
    </LegalLayout>
  );
}
