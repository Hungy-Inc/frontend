"use client";

import Link from 'next/link';

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="text-lg text-black/80 max-w-2xl mx-auto">
              These terms govern your use of the Hungy platform. By using our services, you agree to these terms 
              and our commitment to helping organizations streamline food operations.
            </p>
            <div className="mt-6 text-sm text-gray-500">
              <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-12 text-black/80">
            
            {/* Agreement Section */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Agreement to Terms
              </h2>
              <p className="mb-4">
                By accessing or using the Hungy platform ("Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
              <p>
                These Terms apply to all users of the Service, including organizations, administrators, volunteers, 
                and any other users who access or use the Service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Description of Service
              </h2>
              <p className="mb-4">
                Hungy is a comprehensive food management platform designed for community kitchens, food banks, 
                and nonprofit organizations. Our platform provides:
              </p>
              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Food inventory and donation tracking</li>
                <li>Volunteer management and shift scheduling</li>
                <li>Analytics dashboards and reporting tools</li>
                <li>User management and role-based access controls</li>
                <li>Real-time data synchronization across devices</li>
                <li>Customizable donation categories and workflows</li>
              </ul>
              <p>
                The Service is designed to help organizations streamline their food operations, reduce administrative 
                burden, and focus on their mission of serving communities.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                User Accounts and Registration
              </h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">Account Creation</h3>
              <p className="mb-4">
                To access certain features of the Service, you must have an account created by Hungy. <strong>Organizations 
                cannot register themselves - they must contact us to create an account.</strong> Once an account is created, 
                you agree to provide accurate, current, and complete information and to update such information to keep it 
                accurate, current, and complete.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Account Security</h3>
              <p className="mb-4">
                You are responsible for safeguarding your account credentials and for all activities that occur under 
                your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Organization Accounts</h3>
              <p className="mb-4">
                Organization accounts may have multiple users with different permission levels. The organization 
                administrator is responsible for managing user access and ensuring compliance with these Terms.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Account Termination</h3>
              <p>
                We reserve the right to terminate or suspend accounts that violate these Terms or for any other 
                reason at our sole discretion.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Organization Onboarding Process</h3>
              <p className="mb-4">
                <strong>Important:</strong> Organizations cannot create accounts themselves through the platform. 
                To access Hungy's services, organizations must:
              </p>
              <ol className="list-decimal ml-6 mb-4 space-y-2">
                <li>Contact our team at <a href="mailto:contact@hungy.ca" className="text-orange-500 hover:text-orange-600 underline">contact@hungy.ca</a></li>
                <li>Provide organization details and requirements</li>
                <li>Complete our onboarding process</li>
                <li>Receive account credentials from our team</li>
              </ol>
              <p>
                This controlled onboarding process ensures proper setup, training, and security for all organizations 
                using the platform.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Acceptable Use Policy
              </h2>
              
              <p className="mb-4">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload or transmit viruses, malware, or other harmful code</li>
                <li>Use the Service to send spam or unsolicited communications</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
              </ul>

              <p>
                Violation of this Acceptable Use Policy may result in immediate account termination and legal action.
              </p>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Data and Privacy
              </h2>
              
              <p className="mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our 
                Privacy Policy, which is incorporated into these Terms by reference.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Data Ownership</h3>
              <p className="mb-4">
                You retain ownership of all data you input into the Service. We process and store your data solely 
                to provide and improve the Service.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Data Accuracy</h3>
              <p className="mb-4">
                You are responsible for the accuracy and completeness of data entered into the Service. We are not 
                responsible for any errors or omissions in your data.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Data Backup</h3>
              <p>
                While we implement regular backup procedures, you are responsible for maintaining your own backups 
                of important data.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Intellectual Property Rights
              </h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">Service Ownership</h3>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by Hungy and are protected 
                by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Your Content</h3>
              <p className="mb-4">
                You retain ownership of content you create or upload to the Service. By using the Service, you grant 
                us a limited license to use, store, and process your content to provide the Service.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Feedback</h3>
              <p>
                If you provide feedback, suggestions, or ideas about the Service, you grant us the right to use 
                such feedback without restriction or compensation.
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Service Availability and Maintenance
              </h2>
              
              <p className="mb-4">
                We strive to provide reliable and continuous access to the Service, but we cannot guarantee uninterrupted 
                availability. The Service may be temporarily unavailable due to:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Scheduled maintenance and updates</li>
                <li>Technical issues or system failures</li>
                <li>Network connectivity problems</li>
                <li>Force majeure events beyond our control</li>
              </ul>

              <p>
                We will provide reasonable notice for scheduled maintenance and work to minimize service disruptions.
              </p>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Payment Terms
              </h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">Subscription Plans</h3>
              <p className="mb-4">
                The Service may offer various subscription plans with different features and pricing. All fees are 
                billed in advance and are non-refundable except as required by law.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Payment Processing</h3>
              <p className="mb-4">
                Payments are processed through secure third-party payment processors. You agree to provide accurate 
                payment information and authorize us to charge your payment method.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">Price Changes</h3>
              <p>
                We may change our pricing with 30 days' notice. Price changes will not affect your current billing 
                cycle but will apply to subsequent renewals.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Limitation of Liability
              </h2>
              
              <p className="mb-4">
                To the maximum extent permitted by law, Hungy shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Loss of profits, revenue, or data</li>
                <li>Business interruption or downtime</li>
                <li>Cost of substitute services</li>
                <li>Any damages resulting from use of the Service</li>
              </ul>

              <p>
                Our total liability to you for any claims arising from these Terms or the Service shall not exceed 
                the amount you paid for the Service in the 12 months preceding the claim.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Disclaimers
              </h2>
              
              <p className="mb-4">
                The Service is provided "as is" and "as available" without warranties of any kind, either express 
                or implied, including but not limited to:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties that the Service will be uninterrupted or error-free</li>
                <li>Warranties regarding the accuracy or reliability of any information</li>
                <li>Warranties that defects will be corrected</li>
              </ul>

              <p>
                We do not warrant that the Service will meet your specific requirements or that the Service will 
                be compatible with your hardware or software.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Indemnification
              </h2>
              
              <p>
                You agree to indemnify and hold harmless Hungy, its officers, directors, employees, and agents 
                from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from:
              </p>

              <ul className="list-disc ml-6 mt-4 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit to the Service</li>
              </ul>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Governing Law and Dispute Resolution
              </h2>
              
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of Canada, without regard 
                to its conflict of law provisions.
              </p>

              <p className="mb-4">
                Any disputes arising from these Terms or the Service shall be resolved through binding arbitration 
                in accordance with the rules of the Canadian Arbitration Association.
              </p>

              <p>
                You agree to resolve disputes individually and waive any right to participate in a class action 
                or representative proceeding.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Changes to Terms
              </h2>
              
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by:
              </p>

              <ul className="list-disc ml-6 mb-4 space-y-2">
                <li>Posting updated Terms on the Service</li>
                <li>Sending email notifications to registered users</li>
                <li>Displaying prominent notices on the platform</li>
              </ul>

              <p>
                Your continued use of the Service after changes become effective constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Severability
              </h2>
              
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be 
                limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain 
                in full force and effect and enforceable.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>
                Contact Information
              </h2>
              
              <p className="mb-4">
                If you have questions about these Terms of Service, please contact us:
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
          </div>

          {/* Footer Actions */}
          <div className="mt-16 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Contact Us
              </Link>
              <Link href="/privacy-policy" className="bg-gray-100 hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-semibold transition-colors">
                Privacy Policy
              </Link>
              <Link href="/" className="bg-gray-100 hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-semibold transition-colors">
                Back to Home
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Thank you for choosing Hungy. We're committed to providing a reliable and secure platform 
              for your organization's food management needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
