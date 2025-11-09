import { api } from "./api";
import { Client as ConversationsClient, Conversation, Message } from "@twilio/conversations";

export async function createConversationByUsername(other_username: string) {
  const { data } = await api.post("/messaging/conversations/create/", { other_username });
  return data as { conversation_sid: string };
}

export async function openOrCreateByUsername(username: string): Promise<string> {
  const res = await createConversationByUsername(username);
  return res.conversation_sid;
}

export async function twilioToken() {
  const { data } = await api.get("/messaging/twilio-token/");
  return data as { token: string };
}
export async function createConversation(other_user_id: number) {
  const { data } = await api.post("/messaging/conversations/create/", { other_user_id });
  return data as { conversation_sid: string };
}
export async function sendMessage(conversation_sid: string, body: string) {
  const { data } = await api.post("/messaging/messages/send/", { conversation_sid, body });
  return data as { sid: string };
}
export async function markRead(message_sid: string) {
  const { data } = await api.post("/messaging/messages/mark-read/", { message_sid });
  return { success: !!data };
}

let clientPromise: Promise<ConversationsClient> | null = null;
async function createClient(): Promise<ConversationsClient> {
  const { token } = await twilioToken();
  const convClient = new ConversationsClient(token);

  convClient.on("tokenAboutToExpire", async () => {
    try {
      const fresh = await twilioToken();
      await convClient.updateToken(fresh.token);
    } catch {}
  });
  convClient.on("tokenExpired", async () => {
    try {
      const fresh = await twilioToken();
      await convClient.updateToken(fresh.token);
    } catch {}
  });

  return new Promise((resolve, reject) => {
    const onState = (state: string) => {
      if (state === "connected") {
        convClient.removeListener("connectionStateChanged", onState);
        resolve(convClient);
      } else if (state === "denied" || state === "error") {
        convClient.removeListener("connectionStateChanged", onState);
        reject(new Error(`Twilio connection state: ${state}`));
      }
    };
    convClient.on("connectionStateChanged", onState);
  });
}
export async function getTwilioClient(): Promise<ConversationsClient> {
  if (!clientPromise) clientPromise = createClient();
  return clientPromise;
}
export async function listSubscribedConversations() {
  const client = await getTwilioClient();
  const paginator = await client.getSubscribedConversations();
  return paginator.items as Conversation[];
}
export async function getConversationBySid(sid: string) {
  const client = await getTwilioClient();
  return client.getConversationBySid(sid);
}
export async function getMessages(conversation: Conversation, pageSize = 50) {
  const page = await conversation.getMessages(pageSize);
  return page.items as Message[];
}
export async function markAllRead(conversation: Conversation) {
  try {
    await conversation.setAllMessagesRead();
  } catch {}
}

/** Helper: create (or reuse) a conversation by user id and return its SID */
export async function openOrCreateByUserId(other_user_id: number): Promise<string> {
  const { conversation_sid } = await createConversation(other_user_id);
  return conversation_sid;
}

export type { ConversationsClient, Conversation, Message };
