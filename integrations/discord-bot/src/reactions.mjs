export const ACK_THINKING = "👀";
export const ACK_ERROR = "❌";

export async function addReaction({ client, channelId, messageId, emoji }) {
  try {
    await client.rest.put(
      `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
    );
    return true;
  } catch (err) {
    console.error(`reaction add failed (${emoji}): ${err.message}`);
    return false;
  }
}

export async function removeOwnReaction({ client, channelId, messageId, emoji }) {
  try {
    await client.rest.delete(
      `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
    );
    return true;
  } catch (err) {
    return false;
  }
}
