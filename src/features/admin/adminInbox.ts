import { adminRpc } from "./adminClient";
import { listCertifierReports, type CertifierReport } from "./halalCertifierAdmin";
import { adminListMosquePosts, type MosquePostProposal } from "../mosques/data/mosquePosts";
import { adminListMosquePrayerTimeUpdates, type MosquePrayerTimeProposal } from "../mosques/data/mosquePrayerUpdates";
import { getAdminSupportTickets, type AdminSupportTicket } from "../support/AdminSupportService";
import { adminListWall, type WallAdminItem } from "../tahajjud/duaWall";

/** Everything waiting for an admin decision, gathered for « À traiter » and the admin home count. */
export type PendingMosque = { id: string; name: string; address: string; created_at: string; submitter_email: string | null };
export type Report = { id: string; mosque_name: string; mosque_address: string; reason: string; details: string | null; reporter_email: string | null; created_at: string };

export type Inbox = {
  mosques: PendingMosque[];
  times: MosquePrayerTimeProposal[];
  posts: MosquePostProposal[];
  reports: Report[];
  wall: WallAdminItem[];
  support: AdminSupportTicket[];
  certifiers: CertifierReport[];
  failed: string[];
};

/** Each source loads on its own: one failing source never hides the others. */
export async function loadInbox(): Promise<Inbox> {
  const failed: string[] = [];
  const safe = async <T,>(label: string, task: () => Promise<T>, fallback: T) => {
    try {
      return await task();
    } catch {
      failed.push(label);
      return fallback;
    }
  };
  const [mosques, times, posts, reports, wall, support, certifiers] = await Promise.all([
    safe("mosquées", () => adminRpc<PendingMosque[]>("admin_list_mosque_submissions", { p_status: "pending" }), []),
    safe("horaires", adminListMosquePrayerTimeUpdates, []),
    safe("annonces", adminListMosquePosts, []),
    safe("signalements", () => adminRpc<Report[]>("admin_list_mosque_reports", { p_status: "pending" }), []),
    safe("mur des duas", adminListWall, []),
    safe("support", () => getAdminSupportTickets("open"), []),
    safe("certificateurs", listCertifierReports, []),
  ]);
  return { mosques: mosques ?? [], times, posts, reports: reports ?? [], wall, support, certifiers, failed };
}

export function inboxTotal(inbox: Inbox | null) {
  if (!inbox) return 0;
  return inbox.mosques.length + inbox.times.length + inbox.posts.length + inbox.reports.length + inbox.wall.length + inbox.support.length + inbox.certifiers.length;
}

