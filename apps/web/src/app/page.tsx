import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to <span className="text-blue-600">NexusHub AI</span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          The ultimate AI-powered team collaboration platform. Connect, build, and manage your workspaces all in one place.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/login">
            <Button size="lg" className="w-32">
              Sign In
            </Button>
          </Link>
          
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-32">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}