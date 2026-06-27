import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  title: z.string().max(300),
  qty: z.number().int().min(1).max(999),
  price: z.number().min(0),
});

const schema = z.object({
  orderId: z.string().max(200),
  receiptUrl: z.string().url().optional().nullable(),
  currency: z.string().max(8),
  subtotal: z.number().min(0),
  deliveryFee: z.number().min(0),
  total: z.number().min(0),
  buyer: z.object({
    name: z.string().max(120),
    email: z.string().email().max(255),
    phone: z.string().max(60).optional().default(""),
    address: z.string().max(300),
    city: z.string().max(120).optional().default(""),
    postcode: z.string().max(40).optional().default(""),
  }),
  items: z.array(itemSchema).min(1).max(100),
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

const fmt = (n: number, cur: string) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: cur }).format(n);

export const sendOrderEmails = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { BREVO_EMAIL_CONFIG } = await import("./brevo.server");
    const { dreamozGet } = await import("./dreamoz.server");

    const memberResp = await dreamozGet("/Member/Get");
    const member = memberResp?.member ?? memberResp;
    const ownerEmail: string =
      member?.memberEmail ?? "support@dreamoztech.com";
    const brand: string = member?.memberFullName ?? "DreamozTech";

    const cur = data.currency.toUpperCase();
    const rows = data.items
      .map(
        (i) => `<tr>
  <td style="padding:8px;border-bottom:1px solid #eee;">${esc(i.title)}</td>
  <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
  <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${fmt(i.qty * i.price, cur)}</td>
</tr>`
      )
      .join("");

    const summary = `
<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
  <thead>
    <tr style="background:#f7f7f7;">
      <th style="padding:8px;text-align:left;">Item</th>
      <th style="padding:8px;text-align:center;">Qty</th>
      <th style="padding:8px;text-align:right;">Price</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr><td colspan="2" style="padding:6px 8px;text-align:right;">Subtotal</td><td style="padding:6px 8px;text-align:right;">${fmt(data.subtotal, cur)}</td></tr>
    <tr><td colspan="2" style="padding:6px 8px;text-align:right;">Delivery</td><td style="padding:6px 8px;text-align:right;">${fmt(data.deliveryFee, cur)}</td></tr>
    <tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold;border-top:2px solid #333;">Total</td><td style="padding:8px;text-align:right;font-weight:bold;border-top:2px solid #333;">${fmt(data.total, cur)}</td></tr>
  </tfoot>
</table>`;

    const buyerBlock = `
<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">
  <strong>Name:</strong> ${esc(data.buyer.name)}<br/>
  <strong>Email:</strong> ${esc(data.buyer.email)}<br/>
  ${data.buyer.phone ? `<strong>Phone:</strong> ${esc(data.buyer.phone)}<br/>` : ""}
  <strong>Address:</strong> ${esc(data.buyer.address)}${data.buyer.city ? ", " + esc(data.buyer.city) : ""}${data.buyer.postcode ? " " + esc(data.buyer.postcode) : ""}
</p>`;

    const receiptLink = data.receiptUrl
      ? `<p><a href="${esc(data.receiptUrl)}" style="color:#2563eb;">View payment receipt</a></p>`
      : "";

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: BREVO_EMAIL_CONFIG.smtpServer,
      port: BREVO_EMAIL_CONFIG.port,
      secure: false,
      auth: { user: BREVO_EMAIL_CONFIG.login, pass: BREVO_EMAIL_CONFIG.password },
    });

    const from = `"${brand}" <${BREVO_EMAIL_CONFIG.emailFrom}>`;

    // 1) Customer confirmation
    const customerHtml = `
<div style="font-family:Arial,sans-serif;color:#111;max-width:640px;margin:0 auto;">
  <h2 style="color:#111;">Thank you for your order, ${esc(data.buyer.name)}!</h2>
  <p>We've received your order <strong>#${esc(data.orderId)}</strong> and it's being processed.</p>
  ${summary}
  <h3 style="margin-top:24px;">Delivery details</h3>
  ${buyerBlock}
  ${receiptLink}
  <p style="color:#666;font-size:12px;margin-top:24px;">If you have any questions, reply to this email.</p>
  <p style="color:#666;font-size:12px;">— ${esc(brand)}</p>
</div>`;

    // 2) Owner notification
    const ownerHtml = `
<div style="font-family:Arial,sans-serif;color:#111;max-width:640px;margin:0 auto;">
  <h2>New order received #${esc(data.orderId)}</h2>
  ${summary}
  <h3 style="margin-top:24px;">Customer</h3>
  ${buyerBlock}
  ${receiptLink}
</div>`;

    await Promise.all([
      transporter.sendMail({
        from,
        to: data.buyer.email,
        subject: `Order Confirmation #${data.orderId} - ${brand}`,
        html: customerHtml,
      }),
      transporter.sendMail({
        from,
        to: ownerEmail,
        replyTo: data.buyer.email,
        subject: `New Order #${data.orderId} - ${fmt(data.total, cur)}`,
        html: ownerHtml,
      }),
    ]);

    return { ok: true };
  });
