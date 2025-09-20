"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  signInWithEmail,
  signInWithGoogle,
  createOrUpdateUserProfile,
} from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Mail, Chrome } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRolePrompt, setShowRolePrompt] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("customer");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    const { user, error } = await signInWithEmail(data.email, data.password);

    if (error) {
      setError(error);
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    const { user, isNewUser, error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    if (isNewUser) {
      setPendingGoogleUser(user);
      setShowRolePrompt(true);
      setLoading(false);
      return;
    }

    router.push("/");

    setLoading(false);
  };

  const confirmRole = async () => {
    if (!pendingGoogleUser) return;
    setLoading(true);
    const profile = {
      name: pendingGoogleUser.displayName,
      email: pendingGoogleUser.email,
      role: selectedRole,
      photoURL: pendingGoogleUser.photoURL || null,
      createdAt: new Date(),
    };
    const { error } = await createOrUpdateUserProfile(
      pendingGoogleUser.uid,
      profile
    );
    if (error) setError(error);
    else {
      if (selectedRole === "artisan") router.push("/artisan/profile");
      else router.push("/");
    }
    setShowRolePrompt(false);
    setPendingGoogleUser(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Palette className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <p className="text-gray-600">Sign in to your Artivio account</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {showRolePrompt && (
            <div className="p-4 border rounded-xl bg-gray-50 space-y-3">
              <p className="font-medium">Select your role to finish setup</p>
              <Select
                onValueChange={(v) => setSelectedRole(v)}
                defaultValue={selectedRole}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Shop for crafts</SelectItem>
                  <SelectItem value="artisan">Sell my crafts</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={confirmRole}
                disabled={loading}
                className="w-full rounded-full"
                size="lg"
              >
                Confirm role
              </Button>
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                className="rounded-full"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password", { required: "Password is required" })}
                className="rounded-full"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full"
              size="lg"
            >
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full rounded-full"
            size="lg"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google
          </Button>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
