// frontend/src/services/messaging.ts
import { api } from "./api";
// Type-only import to avoid evaluating the SDK at build time
import type {
  Client as ConversationsClient,
  Conversation,
  Message,
} from "@twilio/conversations";

type TwilioModule = typeof import("@twilio/conversations");
let conversationsModulePromise: Promise<TwilioModule> | null = null;
async function loadTwilioModule(): Promise<TwilioModule> {
  if (!conversationsModulePromise) {
    conversationsModulePromise = import("@twilio/conversations");
  }
  return conversationsModulePromise;
}

/** ---- REST endpoints (your Django API) ---- */
export async function twilioToken() {
  const { data } = await api.get("/messaging/twilio-token/");
  return data as { token: string };
}

export async function createConversation(other_user_id: number) {
  const { data } = await api.post("/messaging/conversations/create/", {
    other_user_id,
  });
  return data as { conversation_sid: string };
}

export async function createConversationByUsername(other_username: string) {
  const { data } = await api.post("/messaging/conversations/create/", {
    other_username,
  });
  return data as { conversation_sid: string };
}

export async function sendMessage(conversation_sid: string, body: string) {
  const { data } = await api.post("/messaging/messages/send/", {
    conversation_sid,
    body,
  });
  return data as { sid: string };
}

export async function markRead(message_sid: string) {
  const { data } = await api.post("/messaging/messages/mark-read/", {
    message_sid,
  });
  return { success: !!data };
}

/** ---- Twilio Conversations client (browser SDK) ----
 * We cache a single client instance per session.
 * If the logged-in user changes, call resetTwilioClient() first.
 */
let clientPromise: Promise<ConversationsClient> | null = null;
let cachedClient: ConversationsClient | null = null;

async function createClient(): Promise<ConversationsClient> {
  const { token } = await twilioToken();
  const { Client } = await loadTwilioModule();
  const convClient = new Client(token);
  cachedClient = convClient;

  convClient.on("tokenAboutToExpire", async () => {
    const fresh = await twilioToken();
    await convClient.updateToken(fresh.token);
  });
  convClient.on("tokenExpired", async () => {
    const fresh = await twilioToken();
    await convClient.updateToken(fresh.token);
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

/** Call this on login/logout (or whenever the auth user changes) */
export function resetTwilioClient() {
  try {
    cachedClient?.removeAllListeners?.();
    // @ts-ignore - shutdown is present in recent SDKs
    cachedClient?.shutdown?.();
  } catch {}
  cachedClient = null;
  clientPromise = null;
}

/** ---- Higher-level helpers ---- */
export async function openOrCreateByUserId(other_user_id: number): Promise<string> {
  const res = await createConversation(other_user_id);
  return res.conversation_sid;
}

export async function openOrCreateByUsername(username: string): Promise<string> {
  const res = await createConversationByUsername(username);
  return res.conversation_sid;
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

/** Use the SDK-level read horizon for the current participant */
export async function markAllRead(conversation: Conversation) {
  try {
    await conversation.setAllMessagesRead();
  } catch {}
}

export type { ConversationsClient, Conversation, Message };
