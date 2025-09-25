"use client";

import GoBackButton from "../GoBackButton";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 sm:p-6 md:p-10">
      <div className="relative w-full max-w-4xl p-16 py-12 bg-white rounded-lg shadow-lg">
        <GoBackButton className="absolute top-5 left-3" />
        <header className="pb-4 mb-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Last updated: September 4, 2025
          </p>
        </header>

        <div className="space-y-4 prose text-gray-700 max-w-none">
          <p>
            Welcome to our Privacy Policy. Your privacy is critically important
            to us. This policy outlines how we collect, use, protect, and handle
            your personal information as part of our Service.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800">
            1. Information We Collect
          </h2>
          <p>
            We collect information to provide and improve our Service. The types
            of information we may collect include:
          </p>
          <ul className="pl-6 space-y-2 list-disc">
            <li>
              <strong>Personal Identification Information:</strong> Name, email
              address, username, and password when you register for an account.
            </li>
            <li>
              <strong>Usage Data:</strong> We may collect information on how the
              Service is accessed and used. This may include information such as
              your computer&apos;s IP address, browser type, browser version,
              the pages of our Service that you visit, the time and date of your
              visit, and other diagnostic data.
            </li>
            <li>
              <strong>Cookies and Tracking Technologies:</strong> We use cookies
              and similar tracking technologies to track the activity on our
              Service and hold certain information.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800">
            2. How We Use Your Information
          </h2>
          <p>We use the collected data for various purposes:</p>
          <ul className="pl-6 space-y-2 list-disc">
            <li>To provide and maintain our Service.</li>
            <li>To notify you about changes to our Service.</li>
            <li>
              To allow you to participate in interactive features of our Service
              when you choose to do so.
            </li>
            <li>To provide customer support.</li>
            <li>
              To gather analysis or valuable information so that we can improve
              our Service.
            </li>
            <li>To monitor the usage of our Service.</li>
            <li>To detect, prevent and address technical issues.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800">
            3. Information Sharing and Disclosure
          </h2>
          <p>
            We do not sell, trade, or otherwise transfer to outside parties your
            Personally Identifiable Information unless we provide users with
            advance notice. This does not include website hosting partners and
            other parties who assist us in operating our website, conducting our
            business, or serving our users, so long as those parties agree to
            keep this information confidential.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800">
            4. Data Security
          </h2>
          <p>
            The security of your data is important to us, but remember that no
            method of transmission over the Internet or method of electronic
            storage is 100% secure. While we strive to use commercially
            acceptable means to protect your Personal Data, we cannot guarantee
            its absolute security.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800">
            5. Your Data Protection Rights
          </h2>
          <p>
            You have certain data protection rights. We aim to take reasonable
            steps to allow you to correct, amend, delete, or limit the use of
            your Personal Data. You have the right to access, update or delete
            the information we have on you.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800">
            6. Service Providers
          </h2>
          <p>
            We may employ third-party companies and individuals to facilitate
            our Service (&quot;Service Providers&quot;), to provide the Service
            on our behalf, to perform Service-related services or to assist us
            in analyzing how our Service is used.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800">
            7. Children&apos;s Privacy
          </h2>
          <p>
            Our Service does not address anyone under the age of 12
            (&quot;Children&quot;). We do not knowingly collect personally
            identifiable information from anyone under the age of 12.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800">
            8. Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            You are advised to review this Privacy Policy periodically for any
            changes.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800">
            9. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us by email: support@example.com.
          </p>
        </div>
      </div>
    </div>
  );
}
