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
              <h2 className="text-2xl font-semibold text-white mb-3">4. Educational Purpose and No Financial Advice</h2>
              <p>
                THE INFORMATION, TOOLS, SIMULATIONS, CALCULATORS, AND ALL CONTENT PROVIDED ON THIS PLATFORM ARE FOR EDUCATIONAL,
                ENTERTAINMENT, AND SIMULATION PURPOSES ONLY. THEY DO NOT CONSTITUTE AND SHOULD NOT BE CONSTRUED AS FINANCIAL,
                INVESTMENT, TAX, LEGAL, ACCOUNTING, OR PROFESSIONAL ADVICE OF ANY KIND. THE INFARILL PARTIES DO NOT RECOMMEND
                OR ENDORSE ANY SPECIFIC INVESTMENTS, SECURITIES, PROPERTIES, OR STRATEGIES. PAST PERFORMANCE SIMULATED ON THE
                PLATFORM IS NOT INDICATIVE OF FUTURE RESULTS. YOU ACKNOWLEDGE THAT ANY INVESTMENT, BUSINESS, OR FINANCIAL
                DECISIONS YOU MAKE ARE MADE SOLELY AT YOUR OWN RISK AND BASED ON YOUR OWN EVALUATION AND JUDGMENT. YOU SHOULD
                CONSULT WITH QUALIFIED FINANCIAL, TAX, LEGAL, AND ACCOUNTING PROFESSIONALS BEFORE MAKING ANY INVESTMENT OR
                FINANCIAL DECISIONS. THE INFARILL PARTIES EXPRESSLY DISCLAIM ALL LIABILITY FOR ANY FINANCIAL LOSSES, INVESTMENT
                LOSSES, OR DAMAGES RESULTING FROM YOUR USE OF OR RELIANCE ON THE SERVICE.
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
                logos, icons, images, and software, are the exclusive property of Infarill LLC, its affiliates, licensors,
                and service providers, and are protected by copyright, trademark, and other intellectual property laws.
                No right, title, or interest in any content is transferred to you as a result of using this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">7. Disclaimer of Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR
                NON-INFRINGEMENT. NEITHER INFARILL LLC NOR ITS AFFILIATES, SUBSIDIARIES, OFFICERS, DIRECTORS, EMPLOYEES,
                AGENTS, PARTNERS, LICENSORS, OR SERVICE PROVIDERS (COLLECTIVELY, THE "INFARILL PARTIES") MAKE ANY WARRANTY
                THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
                NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED FROM THE INFARILL PARTIES OR THROUGH THE SERVICE
                WILL CREATE ANY WARRANTY NOT EXPRESSLY MADE HEREIN. YOU ASSUME ALL RISK FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM
                OR LOSS OF DATA THAT RESULTS FROM OBTAINING ANY CONTENT FROM THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE INFARILL PARTIES BE LIABLE TO YOU
                OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES,
                INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, GOODWILL, USE, DATA, OR OTHER INTANGIBLE
                LOSSES (EVEN IF THE INFARILL PARTIES HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES), WHETHER BASED ON
                CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE, RESULTING FROM:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Your access to, use of, or inability to access or use the service</li>
                <li>Any conduct or content of any third party on the service, including without limitation any defamatory, offensive, or illegal conduct</li>
                <li>Any content obtained from the service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                <li>Any errors, mistakes, or inaccuracies of content or information</li>
                <li>Personal injury or property damage resulting from your use of the service</li>
                <li>Any interruption or cessation of transmission to or from the service</li>
                <li>Any bugs, viruses, trojan horses, or the like transmitted through the service by any third party</li>
                <li>Any investment, business, or financial decisions made in reliance on the service</li>
              </ul>
              <p className="mt-3">
                IN NO EVENT SHALL THE AGGREGATE LIABILITY OF THE INFARILL PARTIES EXCEED THE GREATER OF ONE HUNDRED DOLLARS
                ($100) OR THE AMOUNT YOU PAID TO INFARILL LLC, IF ANY, IN THE PAST SIX MONTHS FOR THE SERVICE GIVING RISE
                TO THE CLAIM. THE LIMITATIONS OF THIS SECTION SHALL APPLY TO ANY THEORY OF LIABILITY, WHETHER BASED ON WARRANTY,
                CONTRACT, STATUTE, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, AND WHETHER OR NOT THE INFARILL PARTIES HAVE BEEN
                INFORMED OF THE POSSIBILITY OF ANY SUCH DAMAGE, AND EVEN IF A REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED
                OF ITS ESSENTIAL PURPOSE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">9. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless the Infarill Parties from and against any and all claims,
                damages, obligations, losses, liabilities, costs, debt, and expenses (including but not limited to attorney's
                fees, expert fees, and court costs) arising from or related to: (a) your use of and access to the service;
                (b) your violation of any term of these Terms; (c) your violation of any third party right, including without
                limitation any copyright, property, privacy, or other intellectual property right; (d) any claim that your use
                of the service caused damage to a third party; (e) any content you submit, post, transmit, or make available
                through the service; (f) your willful misconduct or negligence; or (g) any investment, business, or financial
                decisions you make based on information obtained through the service. This indemnification obligation will
                survive termination of these Terms and your use of the service. You agree that the Infarill Parties shall have
                the right to control the defense of any such claim, action, or proceeding, and you agree to cooperate fully with
                the Infarill Parties in such defense.
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
                The Infarill Parties may terminate or suspend your account and access to the service immediately, without
                prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
                Upon termination, your right to use the service will immediately cease. All provisions of these Terms which
                by their nature should survive termination shall survive, including without limitation ownership provisions,
                warranty disclaimers, indemnification obligations, and limitations of liability. Termination of your access
                to the service will not limit any of the Infarill Parties' other rights or remedies at law or in equity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">13. Severability</h2>
              <p>
                If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent
                jurisdiction, such provision shall be modified and interpreted to accomplish the objectives of such provision
                to the greatest extent possible under applicable law, and the remaining provisions shall continue in full
                force and effect. The invalidity or unenforceability of any provision shall not affect the validity or
                enforceability of any other provision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">14. Entire Agreement and Waiver</h2>
              <p>
                These Terms, together with any amendments and any additional agreements you may enter into with Infarill LLC
                in connection with the service, shall constitute the entire agreement between you and Infarill LLC concerning
                the service. No failure or delay by the Infarill Parties in exercising any right, power, or privilege under
                these Terms shall operate as a waiver thereof, nor shall any single or partial exercise of any right, power,
                or privilege preclude any other or further exercise thereof or the exercise of any other right, power, or
                privilege.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">15. Assignment</h2>
              <p>
                You may not assign or transfer these Terms or your rights hereunder, in whole or in part, by operation of law
                or otherwise, without our prior written consent. We may assign these Terms and any rights hereunder at any time
                without notice or consent. Any attempted assignment in violation of this section shall be null and void. Subject
                to the foregoing, these Terms will bind and inure to the benefit of the parties and their respective successors
                and permitted assigns.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">16. Class Action Waiver</h2>
              <p>
                YOU AND INFARILL LLC AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY
                AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. UNLESS
                BOTH YOU AND INFARILL LLC AGREE OTHERWISE, THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON'S CLAIMS,
                AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF A REPRESENTATIVE, CLASS, OR CONSOLIDATED PROCEEDING. IF THIS
                SPECIFIC PROVISION IS FOUND TO BE UNENFORCEABLE, THEN THE ENTIRETY OF THIS ARBITRATION PROVISION SHALL BE NULL
                AND VOID.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">17. Force Majeure</h2>
              <p>
                The Infarill Parties shall not be liable for any failure or delay in performance under these Terms due to
                causes beyond their reasonable control, including but not limited to acts of God, war, terrorism, riots, embargoes,
                acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation
                facilities, fuel, energy, labor, or materials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">18. Contact Information</h2>
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
