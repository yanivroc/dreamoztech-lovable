import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getDreamozData } from "@/lib/dreamoz.functions";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const IMG_BASE = "https://dreamoztech.com/";

const dataQuery = queryOptions({
  queryKey: ["dreamoz"],
  queryFn: () => getDreamozData(),
});

export const Route = createFileRoute("/")({
  head: ({ loaderData }: any) => {
    const m = loaderData?.member;
    const title = m?.memberFullName ?? "Member Profile";
    const desc = m?.metaDesc ?? "Member profile, products and posts.";
    const keywords = m?.metaKey ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
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

function resolveImg(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return IMG_BASE + path.replace(/\\/g, "/").replace(/^\/+/, "");
}

function Index() {
  const { data } = useSuspenseQuery(dataQuery);
  const { member, products } = data;

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
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold">{member?.memberFullName ?? "—"}</h1>
            </div>
            {avatar && (
              <img
                src={avatar}
                alt={member?.memberFullName ?? "Profile"}
                className="w-[200px] min-w-[200px] rounded-lg object-cover border"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            {member?.description && (
              <div
                className="prose prose-sm max-w-none text-foreground/90 text-left"
                dangerouslySetInnerHTML={{ __html: member.description }}
              />
            )}
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
      </main>
    </div>
  );
}

function ItemCard({ item }: { item: any }) {
  const [open, setOpen] = useState(false);
  const pic = Array.isArray(item.pics) && item.pics.length > 0
    ? [...item.pics].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))[0]
    : null;
  const img = resolveImg(pic?.picThumbPath ?? pic?.picPath ?? item.image);
  const title = item.bizName ?? item.title ?? "Untitled";
  const priceAttr = Array.isArray(item.attributes)
    ? item.attributes.find(
        (a: any) =>
          String(a.title ?? a.name ?? a.key ?? "").toLowerCase() === "price"
      )
    : null;
  const price = priceAttr?.value ?? priceAttr?.price;
  const categories: any[] = Array.isArray(item.categories) ? item.categories : [];
  const desc = item.bizDesc ?? item.description;
  const fullImg = resolveImg(pic?.picPath ?? pic?.picThumbPath ?? item.image);
  const metaDesc = item.metaDesc ?? "";
  const metaKey = item.metaKey ?? "";

  useEffect(() => {
    if (!open) return;
    const prevTitle = document.title;
    const setMeta = (selector: string, attr: string, name: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      const created = !el;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute("content");
      el.setAttribute("content", content);
      return () => {
        if (created) el!.remove();
        else if (prev != null) el!.setAttribute("content", prev);
      };
    };
    document.title = title;
    const restores: Array<() => void> = [];
    if (metaDesc) restores.push(setMeta('meta[name="description"]', "name", "description", metaDesc));
    if (metaKey) restores.push(setMeta('meta[name="keywords"]', "name", "keywords", metaKey));
    restores.push(setMeta('meta[property="og:title"]', "property", "og:title", title));
    if (metaDesc) restores.push(setMeta('meta[property="og:description"]', "property", "og:description", metaDesc));
    return () => {
      document.title = prevTitle;
      restores.forEach((r) => r());
    };
  }, [open, title, metaDesc, metaKey]);



  return (
    <>
      <article
        onClick={() => setOpen(true)}
        className="cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md flex flex-col text-left"
      >
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {fullImg && (
            <img
              src={fullImg}
              alt={title}
              className="w-full max-h-80 object-contain rounded"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {price != null && (
            <div className="text-primary text-lg font-semibold">${price}</div>
          )}
          {desc ? (
            <div
              className="prose prose-sm max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: String(desc) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No description available.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
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
