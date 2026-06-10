import { createServerFn } from "@tanstack/react-start";

export const getDreamozData = createServerFn({ method: "GET" }).handler(async () => {
  const { dreamozGet } = await import("./dreamoz.server");
  const [member, products, posts] = await Promise.all([
    dreamozGet("/Member/Get"),
    dreamozGet("/Member/Products"),
    dreamozGet("/Member/Posts"),
  ]);
  return {
    member: member?.member ?? null,
    products: products?.products?.posts ?? products?.posts ?? [],
    posts: posts?.posts ?? [],
  };
});
