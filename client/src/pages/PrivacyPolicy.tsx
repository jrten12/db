import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-slate-700/50">
          <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>
                Infarill LLC and LVI Properties, LLC, together with their affiliates, subsidiaries, officers, directors, employees, agents, partners,
                licensors, and service providers (collectively, the "Company Parties" or "Company", "we", "our", or "us")
                respects your privacy and is committed to protecting your personal information. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you use our website and services. By using
                our service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
                IF YOU DO NOT AGREE WITH THE TERMS OF THIS PRIVACY POLICY, PLEASE DO NOT ACCESS OR USE THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.1 Personal Information</h3>
              <p>We may collect personal information that you voluntarily provide to us, including:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials (username, password)</li>
                <li>Profile information</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.2 Automatically Collected Information</h3>
              <p>When you access our service, we may automatically collect:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, actions taken)</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Log data (access times, error logs)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.3 User-Generated Content</h3>
              <p>
                Information you provide while using our platform, including simulation data, preferences, and
                settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
              <p>We use the collected information for:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Providing, maintaining, and improving our services</li>
                <li>Processing transactions and managing your account</li>
                <li>Sending administrative information, updates, and security alerts</li>
                <li>Responding to your inquiries and providing customer support</li>
                <li>Monitoring and analyzing usage patterns and trends</li>
                <li>Detecting, preventing, and addressing technical issues and security threats</li>
                <li>Personalizing your experience and delivering relevant content</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">4. Information Sharing and Disclosure</h2>
              <p>We may share your information in the following circumstances:</p>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1 Service Providers</h3>
              <p>
                We may share information with third-party service providers who perform services on our behalf, such as
                hosting, analytics, payment processing, and customer support.
              </p>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2 Legal Requirements</h3>
              <p>
                We may disclose your information if required by law or in response to valid requests by public authorities,
                including to meet national security or law enforcement requirements.
              </p>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.3 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the
                acquiring entity.
              </p>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.4 With Your Consent</h3>
              <p>
                We may share your information for any other purpose with your consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">5. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our service and hold certain
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
                sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">6. Data Security</h2>
              <p>
                While we implement commercially reasonable technical and organizational security measures designed to protect
                your personal information against unauthorized access, alteration, disclosure, or destruction, YOU ACKNOWLEDGE
                AND AGREE THAT NO SECURITY MEASURES ARE PERFECT OR IMPENETRABLE. NO METHOD OF TRANSMISSION OVER THE INTERNET
                OR ELECTRONIC STORAGE IS 100% SECURE, AND THE COMPANY PARTIES CANNOT AND DO NOT GUARANTEE OR WARRANT THE
                SECURITY OF ANY INFORMATION YOU TRANSMIT TO OR FROM THE SERVICE. YOU TRANSMIT ALL INFORMATION AT YOUR OWN RISK.
                THE COMPANY PARTIES DISCLAIM ALL LIABILITY FOR ANY UNAUTHORIZED ACCESS TO, USE OF, OR DISCLOSURE OF YOUR
                PERSONAL INFORMATION, DATA BREACHES, HACKING, IDENTITY THEFT, OR ANY OTHER SECURITY-RELATED INCIDENTS. YOU ARE
                SOLELY RESPONSIBLE FOR PROTECTING YOUR ACCOUNT CREDENTIALS AND FOR ALL ACTIVITIES THAT OCCUR UNDER YOUR ACCOUNT.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this
                Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">8. Your Rights and Choices</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate or incomplete information</li>
                <li>Deletion of your personal information</li>
                <li>Restriction or objection to processing</li>
                <li>Data portability</li>
                <li>Withdrawal of consent</li>
                <li>Opting out of marketing communications</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">9. Third-Party Links</h2>
              <p>
                Our service may contain links to third-party websites or services that are not owned or controlled by
                the Company. We are not responsible for the privacy practices of these third parties. We encourage you
                to review the privacy policies of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">10. Children's Privacy</h2>
              <p>
                Our service is not intended for children under the age of 13. We do not knowingly collect personal
                information from children under 13. If you become aware that a child has provided us with personal
                information, please contact us, and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">11. California Privacy Rights</h2>
              <p>
                If you are a California resident, you have specific rights regarding your personal information under the
                California Consumer Privacy Act (CCPA), including the right to know, delete, and opt-out of the sale of
                your personal information. We do not sell your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">12. International Data Transfers</h2>
              <p>
                Your information may be transferred to and maintained on computers located outside of your state, province,
                country, or other governmental jurisdiction where data protection laws may differ. By using our service,
                you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">13. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy
                Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">14. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY PARTIES SHALL NOT BE LIABLE FOR ANY DAMAGES
                WHATSOEVER, INCLUDING BUT NOT LIMITED TO DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR
                PUNITIVE DAMAGES, ARISING OUT OF OR RELATING TO THIS PRIVACY POLICY, YOUR PERSONAL INFORMATION, OR OUR PRIVACY
                PRACTICES, INCLUDING BUT NOT LIMITED TO ANY UNAUTHORIZED ACCESS TO, USE OF, OR DISCLOSURE OF YOUR PERSONAL
                INFORMATION, DATA BREACHES, IDENTITY THEFT, OR ANY OTHER PRIVACY-RELATED HARM. YOU ACKNOWLEDGE AND AGREE THAT
                YOUR SOLE AND EXCLUSIVE REMEDY FOR ANY DISPUTE WITH THE COMPANY PARTIES REGARDING PRIVACY MATTERS IS TO STOP
                USING THE SERVICE. IN NO EVENT SHALL THE AGGREGATE LIABILITY OF THE COMPANY PARTIES EXCEED ONE HUNDRED DOLLARS
                ($100). SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OR EXCLUSION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL
                DAMAGES, SO THE ABOVE LIMITATION OR EXCLUSION MAY NOT APPLY TO YOU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">15. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless the Company Parties from and against any and all claims,
                damages, obligations, losses, liabilities, costs, debt, and expenses (including but not limited to attorney's
                fees) arising from: (a) your use of and access to the service; (b) your violation of any term of this Privacy
                Policy; (c) your violation of any third party right, including without limitation any privacy right; or (d) any
                claim that your use of the service caused damage to a third party. This indemnification obligation will survive
                termination of this Privacy Policy and your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">16. Severability</h2>
              <p>
                If any provision of this Privacy Policy is held to be invalid, illegal, or unenforceable, the remaining
                provisions shall continue in full force and effect. The invalidity of any provision shall not affect the
                validity or enforceability of any other provision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">17. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our privacy practices, please contact:
              </p>
              <div className="mt-2 ml-4">
                <p className="font-semibold text-white">Infarill LLC & LVI Properties, LLC</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
