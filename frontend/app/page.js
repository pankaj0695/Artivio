import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Users, Palette } from "lucide-react";

export default function HomePage() {
  const featuredProducts = [
    {
      id: 1,
      title: "Handcrafted Ceramic Vase",
      price: 2999,
      image:
        "https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg",
      artisan: "Maya Ceramics",
      rating: 4.8,
    },
    {
      id: 2,
      title: "Woven Silk Scarf",
      price: 1899,
      image:
        "https://images.pexels.com/photos/1040173/pexels-photo-1040173.jpeg",
      artisan: "Textile Traditions",
      rating: 4.9,
    },
    {
      id: 3,
      title: "Brass Jewelry Set",
      price: 3499,
      image:
        "https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg",
      artisan: "Heritage Crafts",
      rating: 4.7,
    },
  ];

  const categories = [
    { name: "Pottery", icon: "🏺", count: "120+ items" },
    { name: "Textiles", icon: "🧵", count: "85+ items" },
    { name: "Jewelry", icon: "💍", count: "95+ items" },
    { name: "Woodwork", icon: "🪵", count: "67+ items" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-purple-100 text-purple-700 rounded-full px-4 py-2">
                  ✨ AI-Powered Marketplace
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Discover
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                    {" "}
                    Artisan{" "}
                  </span>
                  Crafts
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Connect with talented artisans and discover unique,
                  handcrafted pieces. Our AI-powered platform helps artisans
                  showcase their work beautifully.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="rounded-full px-8 py-6 text-lg">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 py-6 text-lg"
                  >
                    Become an Artisan
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-gray-600">Artisans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">2,000+</div>
                  <div className="text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">4.9</div>
                  <div className="text-gray-600">Rating</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card className="rounded-2xl overflow-hidden shadow-lg">
                    <div className="aspect-[3/4]">
                      <Image
                        src="https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                  <Card className="rounded-2xl overflow-hidden shadow-lg">
                    <div className="aspect-square">
                      <Image
                        src="https://images.pexels.com/photos/1040173/pexels-photo-1040173.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                </div>
                <div className="space-y-4 pt-8">
                  <Card className="rounded-2xl overflow-hidden shadow-lg">
                    <div className="aspect-square">
                      <Image
                        src="https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                  <Card className="rounded-2xl overflow-hidden shadow-lg">
                    <div className="aspect-[3/4]">
                      <Image
                        src="https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg"
                        alt="Artisan craft"
                        fill
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600">
              Explore our diverse collection of handcrafted items
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${category.name.toLowerCase()}`}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 rounded-2xl border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{category.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Crafts
            </h2>
            <p className="text-xl text-gray-600">
              Handpicked pieces from our talented artisans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="group rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="rounded-full">
                      {product.artisan}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">
                        {product.rating}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ₹{product.price}
                    </span>
                    <Button size="sm" className="rounded-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Artivio?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 rounded-2xl p-6 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Palette className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                AI-Powered Discovery
              </h3>
              <p className="text-gray-600">
                Our AI helps artisans create compelling product descriptions,
                videos, and showcase their work beautifully.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-2xl p-6 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Direct from Artisans
              </h3>
              <p className="text-gray-600">
                Shop directly from skilled artisans and support traditional
                craftsmanship while getting authentic pieces.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-2xl p-6 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality Guaranteed</h3>
              <p className="text-gray-600">
                Every product is carefully curated and quality-checked to ensure
                you get the best handcrafted items.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
