/**
 * @file page.tsx  (app/page.tsx)
 * @description Landing page (route: /).
 *
 * This is a React Server Component — no client-side JavaScript bundle is
 * added for this page. It renders a static hero section introducing NexusHub.
 *
 * Navigation:
 *  - "Get Started" button is a placeholder; wire it to /register or /login
 *    once the authentication flow is fully integrated.
 */

import { Button } from "@/components/ui/button";

/**
 * Home
 *
 * Root landing page rendered at the "/" route.
 * Displays the NexusHub branding and a primary call-to-action button.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">NexusHub AI</h1>
      <p className="text-muted-foreground">
        Enterprise Collaboration Platform
      </p>

      {/* Primary CTA — link to /register or /login when auth is wired up */}
      <Button>Get Started</Button>
    </main>
  );
}