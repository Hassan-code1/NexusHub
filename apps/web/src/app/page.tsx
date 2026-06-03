import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">NexusHub AI</h1>
      <p className="text-muted-foreground">
        Enterprise Collaboration Platform
      </p>

      <Button>Get Started</Button>
    </main>
  );
}