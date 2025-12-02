import { ChevronLeft, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 gradient-primary rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Learnix</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Last updated: December 1, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Learnix, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our online learning platform. Please read
              this policy carefully to understand our practices regarding your
              personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address,
                password, and profile picture
              </li>
              <li>
                <strong>Learning Data:</strong> Course enrollments, quiz
                results, and progress tracking
              </li>
              <li>
                <strong>Payment Information:</strong> Billing address and
                payment method details (processed securely by third-party
                providers)
              </li>
              <li>
                <strong>Communications:</strong> Messages, feedback, and support
                requests
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our platform,
                including pages visited and features used
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide, maintain, and improve our services</li>
              <li>
                To personalize your learning experience and recommendations
              </li>
              <li>To process transactions and send related information</li>
              <li>
                To send you updates, security alerts, and support messages
              </li>
              <li>To analyze usage patterns and improve our platform</li>
              <li>
                To detect, prevent, and address technical issues and fraud
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Information Sharing
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share your
              information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>With Instructors:</strong> Limited information for
                course delivery purposes
              </li>
              <li>
                <strong>Service Providers:</strong> Third parties who assist in
                operating our platform
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with mergers,
                acquisitions, or asset sales
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. This includes encryption,
              secure servers, and regular security assessments. However, no
              method of transmission over the Internet is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Cookies and Tracking
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze how our platform is used</li>
              <li>Deliver personalized content and recommendations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings, but
              disabling them may affect your experience on our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate
                data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                data
              </li>
              <li>
                <strong>Portability:</strong> Request transfer of your data to
                another service
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing
                communications
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a
                href="mailto:privacy@learnix.com"
                className="text-primary hover:underline"
              >
                privacy@learnix.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is
              active or as needed to provide you services. We may also retain
              and use your information to comply with legal obligations, resolve
              disputes, and enforce our agreements. When data is no longer
              needed, we securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for children under the age of 13. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have collected personal data from a
              child under 13, we will take steps to delete that information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries
              other than your own. We ensure that appropriate safeguards are in
              place to protect your data in accordance with applicable data
              protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the "Last updated" date. We encourage you
              to review this Privacy Policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:{' '}
              <a
                href="mailto:privacy@learnix.com"
                className="text-primary hover:underline"
              >
                privacy@learnix.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Learnix. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PrivacyPage;
