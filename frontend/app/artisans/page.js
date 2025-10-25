"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { listArtisans } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStaticTranslation } from "@/lib/use-static-translation";

export default function ArtisansDirectoryPage() {
  const { t } = useStaticTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const all = await listArtisans(60);
      setItems(all);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((a) =>
      [a.displayName, a.tagline, a.bio, ...(a.specialties || []), ...(a.materials || [])]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(term))
    );
  }, [q, items]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">{t("artisans.heading")}</h1>
        <p className="text-gray-600">{t("artisans.description")}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-8">
        <Input
          placeholder={t("artisans.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-full"
        />
      </div>

      {loading ? (
        <div>{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-600">{t("artisans.noResults")}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((a) => (
            <Link key={a.id} href={`/artisan/${a.id}`}>
              <Card className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="relative h-28 w-full bg-muted">
                  {a.coverImage && /^(https?:\/\/|\/)/i.test(a.coverImage) && (
                    <Image src={a.coverImage} alt="cover" fill className="object-cover" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 -mt-10 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                      {a.avatar && /^(https?:\/\/|\/)/i.test(a.avatar) ? (
                        <Image
                          src={a.avatar}
                          alt={a.displayName || ""}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Image
                          src="/default-avatar.svg"
                          alt={a.displayName || ""}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{a.displayName || t("artisans.untitled")}</div>
                      {a.tagline && (
                        <div className="text-sm text-muted-foreground line-clamp-1">{a.tagline}</div>
                      )}
                    </div>
                  </div>
                  {(a.specialties?.length || 0) > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.specialties.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
