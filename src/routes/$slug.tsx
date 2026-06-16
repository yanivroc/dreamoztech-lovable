import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getDreamozData } from "@/lib/dreamoz.functions";
import { SiteHeader, SiteFooter, resolveImg } from "@/components/SiteChrome";

const dataQuery = queryOptions({
  queryKey: ["dreamoz"],
  queryFn: () => getDreamozData(),
});

function findProduct(products: any[], slug: string) {
  const s = decodeURIComponent(slug).toLowerCase();
  return products.find(
    (p: any) => String(p.bizDisplayTitle ?? "").toLowerCase() === s
  );
}

export const Route = createFileRoute("/$slug")({
  head: ({ loaderData, params }: any) => {
    const m = loaderData?.member;
    const brand = m?.memberFullName ?? "DreamozTech";
    const product = loaderData?.products
      ? findProduct(loaderData.products, params.slug)
      : null;
    const name = product?.bizName ?? "Product";
    const title = `${name} | ${brand}`;
    const desc = product?.metaDesc ?? m?.metaDesc ?? "";
    const keywords = product?.metaKey ?? "";
    return {
      meta: [
        { title },
        ...(desc ? [{ name: "description", content: desc }] : []),
        ...(keywords ? [{ name: "keywords", content: keywords }] : []),
        { property: "og:title", content: title },
        ...(desc ? [{ property: "og:description", content: desc }] : []),
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        ...(desc ? [{ name: "twitter:description", content: desc }] : []),
      ],
    };
  },
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(dataQuery),
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-destructive">Failed to load: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Product not found</div>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(dataQuery);
  const { member, products } = data;
  const item = findProduct(products, slug);

  if (!item) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <SiteHeader member={member} />
        <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1">
          <p className="text-muted-foreground">Product not found.</p>
          <Link to="/" className="text-primary hover:underline">Back to home</Link>
        </main>
        <SiteFooter member={member} />
      </div>
    );
  }

  const pics: any[] = Array.isArray(item.pics)
    ? [...item.pics].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    : [];
  const title = item.bizName ?? "Untitled";
  const priceAttr = Array.isArray(item.attributes)
    ? item.attributes.find(
        (a: any) => String(a.title ?? a.name ?? a.key ?? "").toLowerCase() === "price"
      )
    : null;
  const price = priceAttr?.value ?? priceAttr?.price;
  const desc = item.bizDesc ?? item.description;
  const categories: any[] = Array.isArray(item.categories) ? item.categories : [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader member={member} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1 space-y-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">&larr; Back</Link>
        <article className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          {pics.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {pics.map((pic, i) => {
                const src = resolveImg(pic.picPath ?? pic.picThumbPath);
                if (!src) return null;
                return (
                  <img
                    key={i}
                    src={src}
                    alt={pic.picDescription ?? `${title} image ${i + 1}`}
                    className="w-full max-h-96 object-contain rounded border bg-background"
                    loading={i === 0 ? "eager" : "lazy"}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                );
              })}
            </div>
          )}
          {price != null && (
            <div className="text-primary text-xl font-semibold">${price}</div>
          )}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {categories.map((c, i) => (
                <span key={i} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {c.categoryTitle}
                </span>
              ))}
            </div>
          )}
          {desc ? (
            <div
              className="prose prose-sm max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: String(desc) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No description available.</p>
          )}
        </article>
      </main>
      <SiteFooter member={member} />
    </div>
  );
}
