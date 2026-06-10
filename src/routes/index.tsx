import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getDreamozData } from "@/lib/dreamoz.functions";
import { MapPin, Globe, Mail, Phone, Facebook, Twitter, Instagram } from "lucide-react";

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
  loader: ({ context }) => context.queryClient.ensureQueryData(dataQuery),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-8 text-destructive">Failed to load: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function Index() {
  const { data } = useSuspenseQuery(dataQuery);
  const { member, products, posts } = data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">{member?.name ?? "Member"}</div>
          <ul className="flex gap-6 text-sm">
            <li><a href="#home" className="hover:text-primary">Home</a></li>
            <li><a href="#products" className="hover:text-primary">Products</a></li>
            <li><a href="#blogs" className="hover:text-primary">Blogs</a></li>
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-12">
        {/* Profile */}
        <section id="home" className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {member?.profilePicture && (
              <img
                src={member.profilePicture}
                alt={member?.name ?? "Profile"}
                className="h-28 w-28 rounded-full object-cover border"
                onError={(e) => ((e.currentTarget.style.display = "none"))}
              />
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{member?.name ?? "—"}</h1>
              {member?.customerName && (
                <p className="text-sm text-muted-foreground">Contact: {member.customerName}</p>
              )}
              <div className="grid gap-2 text-sm sm:grid-cols-2 pt-2">
                {member?.email && (
                  <InfoRow icon={<Mail className="h-4 w-4" />} text={member.email} />
                )}
                {member?.mobile && (
                  <InfoRow icon={<Phone className="h-4 w-4" />} text={member.mobile} />
                )}
                {member?.web && (
                  <InfoRow
                    icon={<Globe className="h-4 w-4" />}
                    text={
                      <a href={member.web} target="_blank" rel="noreferrer" className="hover:underline">
                        {member.web}
                      </a>
                    }
                  />
                )}
                {member?.location && (
                  <InfoRow icon={<MapPin className="h-4 w-4" />} text={member.location} />
                )}
              </div>
              {(member?.latitude || member?.longitude) && (
                <p className="text-xs text-muted-foreground">
                  Lat {member.latitude} · Long {member.longitude}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                {member?.facebook && (
                  <a href={member.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
                {member?.twitter && (
                  <a href={member.twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
                    <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
                {member?.instagram && (
                  <a href={member.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Products</h2>
            <span className="text-sm text-muted-foreground">{products.length} items</span>
          </div>
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

        {/* Blogs / Posts */}
        <section id="blogs" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Blogs</h2>
            <span className="text-sm text-muted-foreground">{posts.length} items</span>
          </div>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p: any, i: number) => (
                <PostRow key={p.id ?? i} item={p} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-foreground/90">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}

function ItemCard({ item }: { item: any }) {
  const img = item.image ?? item.picture ?? item.thumbnail;
  const title = item.title ?? item.name ?? "Untitled";
  const price = item.price ?? item.cost;
  return (
    <article className="overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md">
      {img && (
        <img
          src={img}
          alt={title}
          className="h-40 w-full object-cover"
          onError={(e) => ((e.currentTarget.style.display = "none"))}
        />
      )}
      <div className="p-4 space-y-1">
        <h3 className="font-medium line-clamp-2">{title}</h3>
        {price != null && (
          <p className="text-sm font-semibold text-primary">${price}</p>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {String(item.description).replace(/<[^>]+>/g, "")}
          </p>
        )}
      </div>
    </article>
  );
}

function PostRow({ item }: { item: any }) {
  const img = item.image ?? item.picture ?? item.thumbnail;
  const title = item.title ?? item.name ?? "Untitled";
  return (
    <article className="flex gap-4 rounded-lg border bg-card p-4 shadow-sm">
      {img && (
        <img
          src={img}
          alt={title}
          className="h-20 w-20 shrink-0 rounded object-cover"
          onError={(e) => ((e.currentTarget.style.display = "none"))}
        />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{title}</h3>
        {item.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {String(item.description).replace(/<[^>]+>/g, "")}
          </p>
        )}
        {item.date && (
          <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
        )}
      </div>
    </article>
  );
}
