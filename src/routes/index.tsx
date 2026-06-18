import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getDreamozData } from "@/lib/dreamoz.functions";
import { SiteHeader, SiteFooter, resolveImg } from "@/components/SiteChrome";
import { ContactForm } from "@/components/ContactForm";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const dataQuery = queryOptions({
  queryKey: ["dreamoz"],
  queryFn: () => getDreamozData(),
});

export const Route = createFileRoute("/")({
  head: ({ loaderData }: any) => {
    const m = loaderData?.member;
    const brand = m?.memberFullName ?? "DreamozTech";
    const title = `Home | ${brand}`;
    const desc = m?.metaDesc ?? "DreamozTech is your all-in-one digital tech mart, bringing everything from everyday accessories to the latest gadgets straight to your doorstep.";
    const keywords = m?.metaKey ?? "";
    const url = "https://dreamoztech.lovable.app/";
    const img = m?.profilePicture ? (String(m.profilePicture).startsWith("http") ? m.profilePicture : `https://dreamoztech.com${m.profilePicture}`) : null;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        ...(img ? [{ property: "og:image", content: img }] : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(img ? [{ name: "twitter:image", content: img }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(dataQuery),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-8 text-destructive">Failed to load: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function Index() {
  const { data } = useSuspenseQuery(dataQuery);
  const { member, products } = data;

  const lat = member?.bizLat;
  const lng = member?.bizLong;
  const hasCoords = lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader member={member} />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-12 flex-1">
        <section id="home" className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-center mb-4">
            {member?.memberFullName ?? "DreamozTech"}: Your All-in-One Digital Tech Mart
          </h1>
          {member?.description && (
            <div className="mt-6 flex flex-col items-center gap-6 text-center">
              <div
                className="rich-content text-left w-full"
                dangerouslySetInnerHTML={{ __html: member.description }}
              />
            </div>
          )}
        </section>

        <section id="products" className="space-y-4">
          <h2 className="text-xl font-semibold">Products</h2>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p: any, i: number) => (
                <ItemCard key={p.id ?? i} item={p} country={member?.country} />
              ))}
            </div>
          )}
        </section>

        <section id="contact" className="space-y-4">
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <ContactForm />
            </div>
            {mapSrc ? (
              <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <iframe
                  title="Location map"
                  src={mapSrc}
                  className="h-full min-h-[420px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-6 shadow-sm text-sm text-muted-foreground">
                Location coming soon.
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter member={member} />
    </div>
  );
}

function ItemCard({ item, country }: { item: any; country?: string | null }) {
  const { add, setOpen } = useCart();
  const pic = Array.isArray(item.pics) && item.pics.length > 0
    ? [...item.pics].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0]
    : null;
  const img = resolveImg(pic?.picThumbPath ?? pic?.picPath ?? item.image);
  const title = item.bizName ?? item.title ?? "Untitled";
  const attrs: any[] = Array.isArray(item.attributes) ? item.attributes : [];
  const getAttr = (name: string) =>
    attrs.find((a) => String(a.title ?? a.name ?? a.key ?? "").toLowerCase() === name.toLowerCase());
  const priceAttr = getAttr("price");
  const priceRaw = priceAttr?.value ?? priceAttr?.price;
  const priceNum = Number(priceRaw);
  const minQty = Math.max(1, Number(getAttr("minquantity")?.value ?? 1) || 1);
  const maxQtyRaw = Number(getAttr("maxquantity")?.value);
  const maxQty = Number.isFinite(maxQtyRaw) && maxQtyRaw > 0 ? maxQtyRaw : undefined;
  const categories: any[] = Array.isArray(item.categories) ? item.categories : [];
  const slug = String(item.bizDisplayTitle ?? "");
  const id = String(item.id ?? slug);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isFinite(priceNum) || priceNum <= 0) {
      toast.error("Price unavailable");
      return;
    }
    add({ id, slug, title, price: priceNum, image: img, minQty, maxQty }, minQty);
    toast.success(`${title} added to cart`);
    setOpen(true);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md flex flex-col text-left">
      <Link to="/$slug" params={{ slug }} className="block">
        {img && (
          <img
            src={img}
            alt={`${title}${categories.length > 0 ? ` - ${categories[0].categoryTitle}` : " product image"}`}
            className="h-44 w-full object-cover"
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </Link>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <Link to="/$slug" params={{ slug }}>
          <h3 className="font-medium line-clamp-2 hover:text-primary">{title}</h3>
        </Link>
        {priceRaw != null && (
          <div className="text-primary font-semibold">{formatPrice(priceRaw, country)}</div>
        )}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 4).map((c, i) => (
              <span key={i} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                {c.categoryTitle}
              </span>
            ))}
          </div>
        )}
        <Button size="sm" className="mt-auto w-full" onClick={handleAdd}>
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
