"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArtisanPublic, listPortfolio } from "@/lib/firestore";
import { getProducts } from "@/lib/firestore";
import { Share2, MessageCircle, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useStaticTranslation } from "@/lib/use-static-translation";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslatedContent } from "@/lib/use-translated-content";

export default function ArtisanPublicProfilePage() {
  const params = useParams();
  const uid = params?.uid;
  const { user } = useAuth();
  const { t } = useStaticTranslation();
  const { language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  // Translate artisan bio dynamically
  const { translated: translatedBio } = useTranslatedContent(profile?.bio || "", language);
  const { translated: translatedTagline } = useTranslatedContent(profile?.tagline || "", language);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const p = await getArtisanPublic(uid);
        setProfile(p);
        setPortfolio(await listPortfolio(uid));
        const { products: listings } = await getProducts({ artisanId: uid, status: "active" });
        const prods = (listings || []).filter((p) => (p.type || "product") !== "service");
        const servs = (listings || []).filter((p) => (p.type || "product") === "service");
        setProducts(prods);
        setServices(servs);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  if (loading) return <div className="p-8">{t("artisanProfile.loading")}</div>;
  if (!profile) return <div className="p-8">{t("artisanProfile.profileNotFound")}</div>;

  const share = () => {
    if (typeof window !== "undefined") {
      navigator?.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="relative h-40 w-full bg-muted">
          {profile.coverImage && (
            <Image src={profile.coverImage} alt="cover" fill className="object-cover" />
          )}
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 -mt-12 rounded-full border-4 border-white overflow-hidden">
              <Image src={profile.avatar || "/default-avatar.png"} alt="avatar" fill className="object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              {profile.tagline && <p className="text-muted-foreground">{translatedTagline || profile.tagline}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {(profile.specialties || []).slice(0, 6).map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {profile?.socials?.whatsapp && (
                <Button
                  asChild
                  className="rounded-full bg-black text-white hover:bg-black/90 active:bg-black/80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors"
                >
                  <a href={`https://wa.me/${profile.socials.whatsapp}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> {t("artisanProfile.contact")}
                  </a>
                </Button>
              )}
              <Button
                onClick={share}
                className="rounded-full bg-black text-white hover:bg-black/90 active:bg-black/80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors"
              >
                <Share2 className="mr-2 h-4 w-4" /> {t("artisanProfile.share")}
              </Button>
              {user?.uid === uid && (
                <Link href="/artisan/profile">
                  <Button className="rounded-full bg-black text-white hover:bg-black/90 active:bg-black/80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors">
                    <Pencil className="mr-2 h-4 w-4" /> {t("artisanProfile.editProfile")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-sm text-muted-foreground">{translatedBio || profile.bio}</p>}
        </CardContent>
      </Card>

      {/* Products */}
      {products?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Products</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className="p-3">
                {p.images?.[0] && (
                  <div className="relative h-36 w-full mb-2">
                    <Image src={p.images[0]} alt={p.title} fill className="rounded object-cover" />
                  </div>
                )}
                <div className="font-medium">{p.title}</div>
                <div className="text-sm">₹{p.price}</div>
                <Link href={`/products/${p.id}`}>
                  <Button className="mt-2 w-full rounded-full bg-black text-white hover:bg-black/90 active:bg-black/80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors">
                    View
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {services?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Services</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((s) => (
              <Card key={s.id} className="p-3">
                {s.images?.[0] && (
                  <div className="relative h-36 w-full mb-2">
                    <Image src={s.images[0]} alt={s.title} fill className="rounded object-cover" />
                  </div>
                )}
                <div className="font-medium">{s.title}</div>
                <div className="text-sm">₹{s.price}</div>
                <Link href={`/products/${s.id}`}>
                  <Button className="mt-2 w-full rounded-full bg-black text-white hover:bg-black/90 active:bg-black/80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black transition-colors">
                    View
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio */}
      {portfolio?.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Portfolio</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {portfolio.map((item) => (
              <div key={item.id} className="relative h-40 w-full overflow-hidden rounded-lg">
                <Image src={item.media?.[0]?.url || "/placeholder.png"} alt={item.title || ""} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
