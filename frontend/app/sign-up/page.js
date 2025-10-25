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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  signUpWithEmail,
  signInWithGoogle,
  createOrUpdateUserProfile,
} from "@/lib/auth";
import { Palette, UserPlus, Loader2 } from "lucide-react";
import { useStaticTranslation } from "@/lib/use-static-translation";

// Google "G" logo SVG
function GoogleIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      role="img"
      focusable="false"
    >
      <path fill="#EA4335" d="M24 9.5c3.35 0 6.38 1.16 8.75 3.45l6.56-6.56C35.07 2.69 29.93 0.5 24 0.5 14.69 0.5 6.64 5.84 2.9 13.44l7.9 6.13C12.37 14.15 17.73 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.68-.15-3.29-.44-4.83H24v9.16h12.7c-.55 2.97-2.2 5.49-4.72 7.18l7.22 5.6C43.78 37.59 46.5 31.54 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.8 27.57c-.5-1.49-.78-3.07-.78-4.57s.28-3.08.78-4.57l-7.9-6.13C1.34 15.39 0.5 19.11 0.5 23s.84 7.61 2.4 10.7l7.9-6.13z" />
      <path fill="#34A853" d="M24 45.5c6.48 0 11.93-2.14 15.9-5.86l-7.22-5.6c-2 1.35-4.58 2.16-8.68 2.16-6.27 0-11.63-4.65-13.2-10.07l-7.9 6.13C6.64 40.16 14.69 45.5 24 45.5z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useStaticTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRolePrompt, setShowRolePrompt] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("customer");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { role: "customer" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");

    if (data.password !== data.confirmPassword) {
      setError(t("auth.passwordMismatch"));
      setLoading(false);
      return;
    }

    // Ensure role is captured even if the Select wasn't registered
    const role = data.role || selectedRole || "customer";
    const { user, error } = await signUpWithEmail(data.email, data.password, {
      name: data.name,
      email: data.email,
      role,
    });

    if (error) {
      setError(error);
    } else {
      // Redirect artisans to onboarding, others to home
      if (role === "artisan") router.push("/artisan/profile");
      else router.push("/");
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await signInWithGoogle();

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // If role is needed, store pendingGoogleUser to complete profile
      if (res.needsPassword) {
        setPendingGoogleUser(res.user);
        router.push(`/auth/set-password?next=/`);
        setLoading(false);
        return;
      }

      // Normal login
      router.push("/");
    } catch (error) {
      setError(error.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Palette className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("auth.joinArtivio")}</CardTitle>
          <p className="text-gray-600">{t("auth.createAccountDesc")}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("auth.firstName")}</Label>
              <Input
                id="name"
                {...register("name", { required: t("auth.nameRequired") })}
                className="rounded-full"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                {...register("email", { required: t("auth.emailRequired") })}
                className="rounded-full"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="role">{t("auth.iWantTo")}</Label>
              {/* Keep Select controlled and sync with RHF */}
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value);
                  setValue("role", value, { shouldDirty: true, shouldTouch: true });
                }}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder={t("auth.selectRolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t("auth.shopForCrafts")}</SelectItem>
                  <SelectItem value="artisan">{t("auth.sellMyCrafts")}</SelectItem>
                </SelectContent>
              </Select>
              {/* Ensure role is part of form data */}
              <input type="hidden" value={selectedRole} {...register("role")} />
            </div>

            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                {...register("password", {
                  required: t("auth.passwordRequired"),
                  minLength: {
                    value: 6,
                    message: t("auth.passwordMinLength"),
                  },
                })}
                className="rounded-full"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                })}
                className="rounded-full"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full inline-flex items-center justify-center gap-2 bg-black text-white shadow-md hover:shadow-lg hover:bg-black/90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              size="lg"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {t("auth.submitSignUp")}
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t("auth.or")} continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-full inline-flex items-center justify-center gap-2 bg-black text-white shadow-md hover:shadow-lg hover:bg-black/90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            size="lg"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.connecting")}
              </>
            ) : (
              <>
                <GoogleIcon className="h-4 w-4" />
                Google
              </>
            )}
          </Button>

          {/* Role prompt (when shown) */}
          {showRolePrompt && (
            <div className="p-4 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm space-y-3">
              <p className="font-medium">{t("auth.selectRole")}</p>
              <Select
                onValueChange={(v) => setSelectedRole(v)}
                defaultValue={selectedRole}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder={t("auth.selectRolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t("auth.shopForCrafts")}</SelectItem>
                  <SelectItem value="artisan">{t("auth.sellMyCrafts")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={confirmRole}
                disabled={loading}
                className="w-full rounded-full"
                size="lg"
              >
                {t("auth.confirmRole")}
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              href="/sign-in"
              className="font-medium text-primary hover:underline"
            >
              {t("auth.signIn")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
