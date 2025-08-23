"use client";

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen font-sans bg-[#fff8f3] relative">
      {/* Header */}
      <header className="w-full bg-white border-b shadow-sm">
        <div className="w-[90vw] max-w-7xl mx-auto flex items-center justify-between py-4">
          <Link href="/" className="text-2xl font-extrabold text-orange-500 tracking-tight">
            HÜNGY
          </Link>
          <Link href="/login" className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-gray-900 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            Log in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto py-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-black mb-6" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
              Privacy Policy
            </h1>
            <p className="text-lg text-black/80 max-w-2xl mx-auto">
              At Hungy, we're committed to protecting your privacy and ensuring the security of your organization's data. 
              This policy explains how we collect, use, and safeguard your information.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12 text-black/80">
            
            {/* Overview Section */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                About Hungy
              </h2>
              <p className="mb-4">
                Hungy is a comprehensive food management platform designed specifically for community kitchens, food banks, 
                and nonprofit organizations. Our platform helps organizations streamline food distribution, manage volunteers, 
                track inventory, and analyze impact through powerful dashboards and analytics tools.
              </p>
              <p className="mb-4">
                We understand that your organization handles sensitive information about food donations, volunteer data, 
                and operational details. This privacy policy outlines how we protect this information and ensure your 
                organization's data remains secure and private.
              </p>
              
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <h3 className="text-lg font-semibold text-black mb-2">Organization Access</h3>
                <p className="text-black/80 mb-3">
                  <strong>Important:</strong> Organizations cannot register themselves on the platform. To access Hungy's 
                  services, organizations must contact our team to complete the onboarding process and receive account credentials.
                </p>
                <p className="text-black/80">
                  This controlled process ensures proper setup, security, and support for all organizations using our platform.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">Organization Information</h3>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Organization name, address, and contact details</li>
                <li>Email addresses for administrative users</li>
                <li>Operational preferences and settings</li>
                <li>Food donation categories and inventory configurations</li>
                <li><strong>Important:</strong> Organizations cannot register themselves - they must contact us to create an account</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">User Account Information</h3>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Name, email address, and role within the organization</li>
                <li>Login credentials and authentication data</li>
                <li>User permissions and access levels</li>
                <li>Activity logs and usage patterns</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">Operational Data</h3>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Food donation records and inventory tracking</li>
                <li>Volunteer shift schedules and attendance</li>
                <li>Donor information and donation history</li>
                <li>Analytics and reporting data</li>
                <li>Shift categories and recurring schedules</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">Technical Information</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Usage analytics and performance data</li>
                <li>Error logs and system diagnostics</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                How We Use Your Information
              </h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">Platform Operations</h3>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Provide and maintain the Hungy platform</li>
                <li>Process and store your organization's data</li>
                <li>Generate reports and analytics dashboards</li>
                <li>Manage user accounts and permissions</li>
                <li>Send important service notifications</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">Service Improvement</h3>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Analyze usage patterns to improve functionality</li>
                <li>Develop new features based on user needs</li>
                <li>Optimize platform performance and reliability</li>
                <li>Provide customer support and training</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">Communication</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li>Send service updates and maintenance notices</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Share important platform announcements</li>
                <li>Request feedback on platform features</li>
              </ul>
            </section>

            {/* Data Sharing and Disclosure */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Data Sharing and Disclosure
              </h2>
              
              <p className="mb-4">
                <strong>We do not sell, trade, or rent your organization's data to third parties.</strong> 
                Your data is used exclusively to provide and improve the Hungy platform.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Limited Sharing Circumstances</h3>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, data may be transferred as part of the business assets</li>
                <li><strong>Consent:</strong> We will only share data with your explicit consent</li>
              </ul>

              <p>
                We are committed to protecting your data and will only share information in the limited circumstances outlined above.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Data Security
              </h2>
              
              <p className="mb-4">
                We implement industry-standard security measures to protect your organization's data:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using AES-256 encryption</li>
                <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access controls</li>
                <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                <li><strong>Data Backups:</strong> Regular backups with disaster recovery procedures</li>
                <li><strong>Employee Training:</strong> Security awareness training for all staff</li>
                <li><strong>Incident Response:</strong> 24/7 monitoring and rapid response procedures</li>
              </ul>

              <p>
                While we implement robust security measures, no method of transmission over the internet is 100% secure. 
                We continuously work to improve our security practices and respond to emerging threats.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Data Retention
              </h2>
              
              <p className="mb-4">
                We retain your organization's data for as long as your account is active or as needed to provide services:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li><strong>Active Accounts:</strong> Data is retained while your organization actively uses the platform</li>
                <li><strong>Backup Data:</strong> Encrypted backups are retained for disaster recovery purposes</li>
              </ul>

              <p>
                Upon request, we can delete your organization's data, subject to legal and contractual obligations.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Your Rights and Choices
              </h2>
              
              <p className="mb-4">
                Your organization has full control over your data within the Hungy platform:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li><strong>Full Access:</strong> View, manage, and analyze all your organization's data through the platform</li>
                <li><strong>Direct Management:</strong> Update, correct, and modify data directly within the system</li>
                <li><strong>Data Export:</strong> Download and export your data in various formats for reporting and analysis</li>
                <li><strong>User Control:</strong> Manage user accounts, permissions, and access levels within your organization</li>
                <li><strong>Real-time Updates:</strong> Make changes that are immediately reflected across the platform</li>
                <li><strong>Complete Ownership:</strong> Your data belongs to you and you have full operational control</li>
              </ul>

              <p>
                Since you have full control over your data within the platform, you can perform most operations directly. 
                For account-level changes or technical support, contact us at <a href="mailto:contact@hungy.ca" className="text-orange-500 hover:text-orange-600 underline">contact@hungy.ca</a>.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Cookies and Tracking Technologies
              </h2>
              
              <p className="mb-4">
                We use cookies and similar technologies to:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Maintain your login session and preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized features and content</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>

              <p>
                You can control cookie settings through your browser preferences. However, disabling certain cookies may 
                affect platform functionality.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Third-Party Services
              </h2>
              
              <p className="mb-4">
                Our platform integrates with third-party services to provide enhanced functionality:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li><strong>Cloud Hosting:</strong> Secure cloud infrastructure for data storage</li>
                <li><strong>Email Services:</strong> For notifications and communications</li>
                <li><strong>Analytics Tools:</strong> To improve platform performance and user experience</li>
                <li><strong>Payment Processors:</strong> For subscription and billing services</li>
              </ul>

              <p>
                All third-party services are carefully selected and bound by strict data protection agreements.
              </p>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                International Data Transfers
              </h2>
              
              <p>
                Your data may be processed and stored in countries other than your own. We ensure that all data transfers 
                comply with applicable data protection laws and implement appropriate safeguards to protect your information.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Children's Privacy
              </h2>
              
              <p>
                Our platform is designed for use by organizations and their authorized users. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected such information, please 
                contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Changes to This Privacy Policy
              </h2>
              
              <p className="mb-4">
                We may update this privacy policy from time to time to reflect changes in our practices or applicable laws. 
                We will notify you of any material changes by:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Posting the updated policy on our platform</li>
                <li>Sending email notifications to administrative users</li>
                <li>Displaying prominent notices on the platform</li>
              </ul>

              <p>
                Your continued use of the platform after changes become effective constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Contact Us
              </h2>
              
              <p className="mb-4">
                If you have questions about this privacy policy or our data practices, please contact us:
              </p>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div>
                    <strong className="text-black">Email:</strong>
                    <a href="mailto:contact@hungy.ca" className="text-orange-500 hover:text-orange-600 underline ml-2">
                      contact@hungy.ca
                    </a>
                  </div>
                  <div>
                    <strong className="text-black">Website:</strong>
                    <a href="https://hungy.ca" className="text-orange-500 hover:text-orange-600 underline ml-2">
                      https://hungy.ca
                    </a>
                  </div>
                  <div>
                    <strong className="text-black">Response Time:</strong>
                    <span className="ml-2">We aim to respond to all inquiries within 24-48 hours</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Compliance */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Compliance and Standards
              </h2>
              
              <p className="mb-4">
                Hungy is committed to maintaining the highest standards of data protection and privacy:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Compliance with applicable data protection laws and regulations</li>
                <li>Regular privacy impact assessments and audits</li>
                <li>Employee training on data protection and privacy</li>
                <li>Transparent data practices and clear communication</li>
                <li>Continuous improvement of privacy and security measures</li>
              </ul>

              <p>
                We regularly review and update our privacy practices to ensure compliance with evolving legal requirements 
                and industry best practices.
              </p>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="mt-16 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Contact Us
              </Link>
              <Link href="/" className="bg-gray-100 hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-semibold transition-colors">
                Back to Home
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Thank you for trusting Hungy with your organization's data. We're committed to protecting your privacy 
              and ensuring the security of your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
