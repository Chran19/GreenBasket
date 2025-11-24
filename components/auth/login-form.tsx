"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Facebook, Mail } from "lucide-react";
import { authenticateUser } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await authenticateUser(email, password);
      if (user) {
        login(user);
        router.push(
          user.role === "farmer"
            ? "/farmer"
            : user.role === "admin"
            ? "/admin"
            : "/buyer"
        );
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="email" className="font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="example@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 text-base border-green-300 focus-visible:ring-green-600 bg-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="font-medium">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="•••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 text-base border-green-300 focus-visible:ring-green-600 bg-white"
          required
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-lg bg-green-700 hover:bg-green-800 transition-transform duration-200 hover:-translate-y-0.5 active:scale-[.97]"
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        Login
      </Button>

      {/* Social Login */}
      <div className="flex items-center gap-3 mt-2">
        <button className="flex-1 h-11 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <Mail size={18} /> Google
        </button>
        <button className="flex-1 h-11 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition">
          <Facebook size={18} /> Facebook
        </button>
      </div>

      {/* Remember + Forgot */}
      <div className="flex justify-between text-sm text-gray-600 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-green-600" />
          Remember Me
        </label>
        <a href="#" className="text-green-700 font-medium hover:underline">
          Forgot Password?
        </a>
      </div>
    </form>
  );
}
