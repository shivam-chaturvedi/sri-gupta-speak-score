import nodemailer from "npm:nodemailer@6.9.10";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapePlainText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function buildEmailBody(content: string, html?: boolean): string {
  if (html) return String(content);
  return escapePlainText(String(content));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createTransporter(gmailUser: string, gmailPass: string) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
}

function sendOne(
  transporter: nodemailer.Transporter,
  options: nodemailer.SendMailOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

console.log('Function "send-newsletter" up and running!');

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const { emails, subject, content, html: contentIsHtml } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return jsonResponse(
        { success: false, error: "No recipient emails provided" },
        400,
      );
    }

    if (!subject || !content) {
      return jsonResponse(
        { success: false, error: "Missing subject or content" },
        400,
      );
    }

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_PASS");

    if (!gmailUser || !gmailPass) {
      return jsonResponse(
        {
          success: false,
          error:
            "GMAIL_USER and GMAIL_PASS must be set in Supabase Edge Function secrets",
        },
        500,
      );
    }

    const transporter = createTransporter(gmailUser, gmailPass);

    const htmlBody = buildEmailBody(String(content), Boolean(contentIsHtml));
    const plainText = contentIsHtml ? stripHtml(String(content)) : String(content);
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 640px;">
        <h1 style="color: #111; margin-bottom: 16px;">Dialecta Daily</h1>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <div style="font-size: 16px; line-height: 1.7; color: #333;">
          ${htmlBody}
        </div>
        <br />
        <p style="font-size: 12px; color: #888;">
          You are receiving this because you subscribed to the Dialecta newsletter.
        </p>
      </div>
    `;

    let sent = 0;
    const failed: string[] = [];

    for (const raw of emails) {
      const email = String(raw).trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

      try {
        await sendOne(transporter, {
          from: gmailUser,
          to: email,
          subject: String(subject),
          text: plainText,
          html,
        });
        sent++;
        console.log(`Email sent to ${email}`);
      } catch (e) {
        console.error(`Failed to send to ${email}:`, e);
        failed.push(email);
      }
    }

    transporter.close();

    if (sent === 0 && failed.length > 0) {
      return jsonResponse(
        {
          success: false,
          error: "Failed to send to all recipients. Check Gmail app password and SMTP settings.",
          sent: 0,
          failed,
        },
        500,
      );
    }

    return jsonResponse({
      success: failed.length === 0,
      message: `Sent ${sent} of ${emails.length} emails`,
      sent,
      failed,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
});
