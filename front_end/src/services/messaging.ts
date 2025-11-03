import { api } from "./api";

export async function twilioToken() {
  const { data } = await api.get("/messaging/twilio-token/");
  return data as { token: string };
}

export async function createConversation(participants: number[]) {
  const { data } = await api.post("/messaging/conversations/create/", { participants });
  return data as { sid: string };
}

export async function sendMessage(conversation_sid: string, body: string) {
  const { data } = await api.post("/messaging/messages/send/", { conversation_sid, body });
  return data as { sid: string };
}

export async function markRead(message_sid: string) {
  const { data } = await api.post("/messaging/messages/mark-read/", { message_sid });
  return data as { success: boolean };
}

