import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getDreamozData } from "@/lib/dreamoz.functions";
import { Facebook, Twitter, Instagram } from "lucide-react";

const IMG_BASE = "https://dreamoztech.com/";

const dataQuery = queryOptions({
  queryKey: ["dreamoz"],
  queryFn: () => getDreamozData(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Member Profile" },
      { name: "description", content: "Member profile, products and posts." },
    ],
  }),
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(dataQuery),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-8 text-destructive">Failed to load: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function resolveImg(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return IMG_BASE + path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function Index() {
  const { data } = useSuspenseQuery(dataQuery);
  const { member, products, posts } = data;

  const avatar = resolveImg(member?.profilePicture);
  const lat = member?.bizLat;
  const lng = member?.bizLong;
  const hasCoords = lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight truncate">
            {member?.memberFullName ?? "Member"}
          </div>
          <ul className="flex items-center gap-4 text-sm">
            <li><a href="#home" className="hover:text-primary">Home</a></li>
            <li><a href="#products" className="hover:text-primary">Products</a></li>
            <li><a href="#posts" className="hover:text-primary">Posts</a></li>
            {member?.facebookProfile && (
              <li>
                <a href={member.facebookProfile} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <Facebook className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </a>
              </li>
            )}
            {member?.twitterProfile && (
              <li>
                <a href={member.twitterProfile} target="_blank" rel="noreferrer" aria-label="Twitter">
                  <Twitter className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </a>
              </li>
            )}
            {member?.instagramProfile && (
              <li>
                <a href={member.instagramProfile} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </a>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-12">
        <section id="home" className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {avatar && (
              <img
                src={avatar}
                alt={member?.memberFullName ?? "Profile"}
                className="h-28 w-28 rounded-full object-cover border"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <div className="flex-1 space-y-3">
              <h1 className="text-2xl font-bold">{member?.memberFullName ?? "—"}</h1>
              {member?.description && (
                <div
                  className="prose prose-sm max-w-none text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: member.description }}
                />
              )}
            </div>
          </div>

          {mapSrc && (
            <div className="mt-6 overflow-hidden rounded-lg border">
              <iframe
                title="Location map"
                src={mapSrc}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
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
                <ItemCard key={p.id ?? i} item={p} />
              ))}
            </div>
          )}
        </section>

    </div>
  );
}

function ItemCard({ item }: { item: any }) {
  const pic = Array.isArray(item.pics) && item.pics.length > 0
    ? [...item.pics].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0]
    : null;
  const img = resolveImg(pic?.picThumbPath ?? pic?.picPath ?? item.image);
  const title = item.bizName ?? item.title ?? "Untitled";
  const priceAttr = Array.isArray(item.attributes)
    ? item.attributes.find((a: any) => String(a.name ?? a.key ?? "").toLowerCase() === "price")
    : null;
  const price = priceAttr?.value ?? priceAttr?.price;
  const categories: any[] = Array.isArray(item.categories) ? item.categories : [];
  const desc = item.bizDesc ?? item.description;

  return (
    <article className="overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md flex flex-col">
      {img && (
        <img
          src={img}
          alt={title}
          className="h-44 w-full object-cover"
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-medium line-clamp-2">{title}</h3>
        {price != null && (
          <div className="text-primary font-semibold">${price}</div>
        )}
        {desc && (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {String(desc).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
          </p>
        )}
        {categories.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {categories.slice(0, 4).map((c, i) => (
              <span key={i} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                {c.categoryTitle}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function PostRow({ item }: { item: any }) {
  const pic = Array.isArray(item.pics) && item.pics.length > 0
    ? [...item.pics].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0]
    : null;
  const img = resolveImg(pic?.picThumbPath ?? pic?.picPath ?? item.image);
  const title = item.bizName ?? item.title ?? "Untitled";
  const desc = item.bizDesc ?? item.description;
  const date = item.createDateTime ? new Date(item.createDateTime).toLocaleDateString() : null;
  const categories: any[] = Array.isArray(item.categories) ? item.categories : [];

  return (
    <article className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm">
      {img && (
        <img
          src={img}
          alt={title}
          className="h-24 w-24 shrink-0 rounded object-cover"
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium">{title}</h3>
          {date && <span className="shrink-0 text-xs text-muted-foreground">{date}</span>}
        </div>
        {desc && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {String(desc).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
          </p>
        )}
        {categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {categories.slice(0, 4).map((c, i) => (
              <span key={i} className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                {c.categoryTitle}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
