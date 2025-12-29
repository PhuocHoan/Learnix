import { ChevronLeft, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function TermsPage() {
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
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Last updated: December 1, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Learnix (&quot;the Service&quot;), you
              accept and agree to be bound by these Terms of Service. If you do
              not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Learnix is an online learning platform that provides educational
              content, courses, AI-powered quizzes, and personalized learning
              experiences. We offer both free and premium content to help users
              develop new skills and knowledge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features of the Service, you must create an
              account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Share your account with others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for any illegal or harmful purposes</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on Learnix, including courses, quizzes, text,
              graphics, logos, and software, is the property of Learnix or its
              content creators and is protected by copyright and other
              intellectual property laws. You may not reproduce, distribute, or
              create derivative works without explicit permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Course Enrollment
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              When you enroll in a course, you receive a limited, non-exclusive,
              non-transferable license to access and view the course content for
              personal, non-commercial purposes. This license does not grant you
              ownership of the content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Instructor Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you are an instructor on Learnix, you retain ownership of your
              content but grant Learnix a license to host, display, and
              distribute your content through our platform. You are responsible
              for ensuring your content does not infringe on third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Learnix is provided &quot;as is&quot; without warranties of any
              kind. We are not liable for any indirect, incidental, or
              consequential damages arising from your use of the Service. Our
              total liability shall not exceed the amount you paid for the
              Service in the past 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any
              time for violations of these terms or for any other reason at our
              discretion. Upon termination, your right to use the Service will
              immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms of Service from time to time. We will
              notify you of significant changes by posting a notice on our
              website or sending you an email. Your continued use of the Service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at{' '}
              <a
                href="mailto:support@learnix.com"
                className="text-primary hover:underline"
              >
                support@learnix.com
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

export default TermsPage;
