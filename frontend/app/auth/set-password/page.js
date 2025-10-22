"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { linkPasswordToCurrentUser } from "@/lib/auth";
import { GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth";

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") || "/";
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      const hasPassword = Array.isArray(user.providerData)
        ? user.providerData.some((p) => p.providerId === "password")
        : false;

      if (hasPassword) {
        // Already has a password; no need to be here.
        router.replace(next);
        return;
      }
      // Only render when a user exists and needs a password.
      setReady(true);
    });
    return () => unsub();
  }, [router, next]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setSubmitting(true);
      await linkPasswordToCurrentUser(password);
      toast.success("Password set successfully.");
      router.push(next); // go back to where the user intended to go
    } catch (e) {
      // Handle common Firebase linking errors gracefully.
      if (e?.code === "auth/requires-recent-login") {
        try {
          await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
          await linkPasswordToCurrentUser(password);
          toast.success("Password set successfully.");
          router.push("/");
          return;
        } catch (reauthErr) {
          toast.error(reauthErr?.message || "Reauthentication failed.");
        }
      } else if (e?.code === "auth/credential-already-in-use") {
        toast.error("A password is already set for this email. Try logging in with email and password.");
      } else {
        toast.error(e?.message || "Failed to set password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold mb-4">Set your password</h1>
      <p className="text-sm text-gray-600 mb-6">
        You signed in with Google. Set a password to also log in using your email.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Saving..." : "Save password"}
        </Button>
      </form>
    </div>
  );
}