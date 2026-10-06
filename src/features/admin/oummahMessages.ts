import { adminRpc } from "./adminClient";

/** Messages signed « OUMMAH » in the members' messaging (Tahajjud › Amis). */
export type SentOummahMessage = { id: string; body: string; createdAt: string; recipient: string | null; recipientName: string | null };

/** To one member (userId) or to everyone (null). Returns the number of phones notified. */
export async function sendOummahMessage(body: string, userId: string | null, push = true) {
  const result = await adminRpc<{ id: string; devices: number }>("admin_send_oummah_message", { p_body: body, p_user: userId, p_push: push });
  return { id: result.id, devices: Number(result.devices) || 0 };
}

export async function listOummahMessages(): Promise<SentOummahMessage[]> {
  const rows = await adminRpc<Array<{ id: string; body: string; created_at: string; recipient: string | null; recipient_name: string | null }>>("admin_list_oummah_messages", {});
  return rows.map((row) => ({ id: row.id, body: row.body, createdAt: row.created_at, recipient: row.recipient, recipientName: row.recipient_name }));
}

export const deleteOummahMessage = (id: string) => adminRpc<void>("admin_delete_oummah_message", { p_id: id });
