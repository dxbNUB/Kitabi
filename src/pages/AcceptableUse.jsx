/*
 * Acceptable Use Policy — TEMPLATE COPY ONLY.
 * NOT legal advice. Have UAE-licensed legal counsel review before publishing.
 */
import { Link } from 'react-router-dom';
import LegalLayout from '../components/LegalLayout';

export default function AcceptableUse() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Acceptable Use Policy"
      intro="What you can and cannot do with Kitabi. Read alongside our Terms of Service — both apply."
      lastUpdated="2026-05-02"
    >
      <h2>You Agree Not To</h2>
      <ul>
        <li>Use automated tools to generate content at scale</li>
        <li>Use Kitabi for academic plagiarism or cheating</li>
        <li>Create content to impersonate others</li>
        <li>Harass, bully, or threaten other users</li>
        <li>Distribute malware or engage in hacking</li>
        <li>Spam or flood the platform</li>
        <li>Use VPNs to bypass geographic restrictions</li>
        <li>Circumvent payment or licensing requirements</li>
      </ul>

      <h2>Compliance with UAE Law</h2>
      <p>Kitabi complies with, and requires its users to comply with:</p>
      <ul>
        <li><strong>UAE Federal Law No. (5) of 1985 (Penal Code)</strong> — no content promoting crime or violence; no terrorism, drugs, or weapons trafficking content</li>
        <li><strong>UAE Federal Law No. (12) of 1992 (Trade Marks Law)</strong> — no trademark infringement</li>
        <li><strong>UAE Federal Law No. (7) of 2002 (Intellectual Property)</strong> — copyright, patent, and piracy protection</li>
        <li><strong>UAE Federal Law No. (34) of 2021 (Combating Discrimination & Hatred)</strong> — zero tolerance for hate speech</li>
        <li><strong>UAE Federal Law No. (5) of 2012 (Anti-Money Laundering & Terrorist Financing)</strong> — cooperation with financial-crime investigations</li>
        <li><strong>UAE Cybercrime Law</strong> — data security and privacy measures</li>
        <li><strong>UAE Federal Law No. (27) of 1992 (Obscenity Law)</strong> — compliance with UAE cultural standards</li>
        <li><strong>Islamic Sharia Principles</strong> — respect for Islamic teachings and values</li>
      </ul>

      <h2>Reporting Abuse</h2>
      <p>
        Users who encounter content violating these terms must report it immediately. Use our{' '}
        <Link to="/report-abuse">abuse report form</Link> or email{' '}
        <a href="mailto:abuse@kitabi.ink">abuse@kitabi.ink</a> with:
      </p>
      <ul>
        <li>Specific content description</li>
        <li>User account (if applicable)</li>
        <li>Why it violates these terms</li>
        <li>Any evidence or screenshots</li>
      </ul>
      <p>Kitabi will:</p>
      <ul>
        <li>Review within 24 hours</li>
        <li>Take action within 48 hours</li>
        <li>Report to UAE authorities if illegal</li>
        <li>Preserve evidence for law enforcement</li>
      </ul>

      <h2>Enforcement</h2>
      <p>
        Violations of this policy may result in immediate suspension or termination of your account
        without refund, removal of content, and — for illegal activity — referral to UAE authorities.
        See our <Link to="/terms">Terms of Service</Link> for full enforcement details.
      </p>
    </LegalLayout>
  );
}
