import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <a className="text-purple-400 hover:text-purple-300 transition-colors">
              ← Back to Home
            </a>
          </Link>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-slate-700/50">
          <h1 className="text-4xl font-bold text-white mb-6">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using this website and services provided by Infarill LLC ("Company", "we", "our", or "us"),
                you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these
                Terms of Service, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>
                Infarill LLC provides an online real estate investment simulation and educational platform. The service is
                provided "as is" and we reserve the right to modify, suspend, or discontinue the service at any time without
                notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">3. User Accounts</h2>
              <p>
                You may need to create an account to access certain features. You are responsible for:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your account information is accurate and current</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">4. Educational Purpose</h2>
              <p>
                The information and tools provided on this platform are for educational and simulation purposes only.
                They do not constitute financial, investment, or professional advice. Any investment decisions should be
                made after consulting with qualified financial professionals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">5. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Attempt to gain unauthorized access to any portion of the service</li>
                <li>Use automated means to access the service without permission</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">6. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the service, including but not limited to text, graphics,
                logos, icons, images, and software, are the exclusive property of Infarill LLC and are protected by
                copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">7. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
                BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, INFARILL LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY
                OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Your access to or use of or inability to access or use the service</li>
                <li>Any conduct or content of any third party on the service</li>
                <li>Any content obtained from the service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">9. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Infarill LLC, its officers, directors, employees, and
                agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable
                attorney's fees, arising out of or in any way connected with your access to or use of the service or
                your violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">10. Modifications to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by
                posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the service
                after such modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States, without
                regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will
                be brought exclusively in the courts located in the United States.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">12. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the service immediately, without prior notice or
                liability, for any reason, including if you breach these Terms. Upon termination, your right to use the
                service will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact:
              </p>
              <div className="mt-2 ml-4">
                <p className="font-semibold text-white">Infarill LLC</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
