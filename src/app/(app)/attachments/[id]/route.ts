import { NextResponse, type NextRequest } from "next/server";

import * as service from "@/lib/attachments/service";
import * as attachmentStore from "@/lib/attachments/store";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * Downloads one camp or activity document.
 *
 * The storage bucket is private, so this is the only way to a file: access is
 * checked exactly as on the page the document is listed on, then the browser
 * is sent to a signed link that expires within a minute. The URL here is
 * stable, so it can be bookmarked or shared with another leader, who will be
 * checked in turn.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/attachments/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in to download documents.", { status: 401 });

  const { id } = await ctx.params;
  const attachment = await attachmentStore.findAttachment(id);
  if (!attachment) return new Response("Document not found.", { status: 404 });

  const access = await service.attachmentAccess(user, attachment);
  if (!access.view) return new Response("Document not found.", { status: 404 });

  const url = await service.createDownloadUrl(attachment.storagePath, attachment.fileName);
  return NextResponse.redirect(url);
}
