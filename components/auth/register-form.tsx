"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerUser, type UserRole } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await registerUser(email, password, name, role);
      if (user) {
        login(user);
        router.push(
          user.role === "farmer"
            ? "/farmer"
            : user.role === "admin"
            ? "/admin"
            : "/buyer"
        );
      } else setError("Registration failed. Please try again.");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-medium">
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 text-base border-green-300 focus-visible:ring-green-600 bg-white"
          required
        />
      </div>

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

      <div className="space-y-2">
        <Label className="font-medium">Account Type</Label>
        <Select
          value={role}
          onValueChange={(value: UserRole) => setRole(value)}
        >
          <SelectTrigger className="h-12 border-green-300 bg-white focus-visible:ring-green-600">
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="farmer">Farmer</SelectItem>
          </SelectContent>
        </Select>
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
        Create Account
      </Button>
    </form>
  );
}
