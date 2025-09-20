"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getArtisanPublic, upsertArtisanPublic } from "@/lib/firestore";

export default function ArtisanProfileEditorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    tagline: "",
    bio: "",
    locationCity: "",
    locationCountry: "",
    instagram: "",
    website: "",
    whatsapp: "",
    specialties: "",
    materials: "",
    acceptingCommissions: false,
    startingPrice: "",
    avatar: "",
    coverImage: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const existing = await getArtisanPublic(user.uid);
      if (existing) {
        setForm((f) => ({
          ...f,
          displayName: existing.displayName || "",
          tagline: existing.tagline || "",
          bio: existing.bio || "",
          locationCity: existing.location?.city || "",
          locationCountry: existing.location?.country || "",
          instagram: existing.socials?.instagram || "",
          website: existing.socials?.website || "",
          whatsapp: existing.socials?.whatsapp || "",
          specialties: (existing.specialties || []).join(", ") || "",
          materials: (existing.materials || []).join(", ") || "",
          acceptingCommissions: !!existing.acceptingCommissions,
          startingPrice: existing.startingPrice?.toString() || "",
          avatar: existing.avatar || "",
          coverImage: existing.coverImage || "",
        }));
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!loading && user === null) router.push("/sign-in");
  }, [user, loading, router]);

  const save = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const payload = {
        displayName: form.displayName,
        tagline: form.tagline,
        bio: form.bio,
        avatar: form.avatar || undefined,
        coverImage: form.coverImage || undefined,
        location: {
          city: form.locationCity || undefined,
          country: form.locationCountry || undefined,
        },
        socials: {
          instagram: form.instagram || undefined,
          website: form.website || undefined,
          whatsapp: form.whatsapp || undefined,
        },
        specialties: form.specialties
          ? form.specialties.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        materials: form.materials
          ? form.materials.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        acceptingCommissions: !!form.acceptingCommissions,
        startingPrice: form.startingPrice ? Number(form.startingPrice) : 0,
      };
      const { error } = await upsertArtisanPublic(user.uid, payload);
      if (error) throw new Error(error);
      toast.success("Saved your storefront details.");
    } catch (e) {
      toast.error(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const goToStorefront = () => router.push(`/artisan/${user?.uid}`);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Storefront</h1>
        <Button variant="secondary" onClick={goToStorefront}>View Storefront</Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="Display name"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
            <Input
              placeholder="Tagline"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </div>
          <Textarea
            placeholder="Short bio/story"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="City"
              value={form.locationCity}
              onChange={(e) => setForm((f) => ({ ...f, locationCity: e.target.value }))}
            />
            <Input
              placeholder="Country"
              value={form.locationCountry}
              onChange={(e) => setForm((f) => ({ ...f, locationCountry: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Instagram handle"
              value={form.instagram}
              onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            />
            <Input
              placeholder="Website URL"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
            <Input
              placeholder="WhatsApp number"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            />
          </div>

          <Input
            placeholder="Specialties (comma separated)"
            value={form.specialties}
            onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
          />
          <Input
            placeholder="Materials (comma separated)"
            value={form.materials}
            onChange={(e) => setForm((f) => ({ ...f, materials: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.acceptingCommissions}
                onChange={(e) => setForm((f) => ({ ...f, acceptingCommissions: e.target.checked }))}
              />
              Accepting custom orders
            </label>
            <Input
              type="number"
              placeholder="Starting price (₹)"
              value={form.startingPrice}
              onChange={(e) => setForm((f) => ({ ...f, startingPrice: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder="Avatar URL"
              value={form.avatar}
              onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
            />
            <Input
              placeholder="Cover image URL"
              value={form.coverImage}
              onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={save} disabled={saving}>
              Save
            </Button>
            <Button onClick={save} disabled={saving}>
              Save & Stay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
