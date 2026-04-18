// In-memory registry of active SSE connections
// Map<userId, Set<response>>
// We use a Set per user because the same user may have multiple
// browser tabs open simultaneously — each gets its own connection
const clients = new Map();

// Maximum SSE connections per user — prevents memory exhaustion from
// a single user opening too many tabs (or a malicious flood)
const MAX_CONNECTIONS_PER_USER = 5;

// ─── Register a new SSE connection ────────────────────────────────────────

export const addClient = (userId, res) => {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }

  const userConnections = clients.get(userId);

  // If user already has max connections, close the oldest one
  if (userConnections.size >= MAX_CONNECTIONS_PER_USER) {
    const oldest = userConnections.values().next().value;
    try {
      oldest.end();
    } catch {
      // Connection may already be dead — that's fine
    }
    userConnections.delete(oldest);
  }

  userConnections.add(res);
};

// ─── Remove an SSE connection (on disconnect) ─────────────────────────────

export const removeClient = (userId, res) => {
  if (!clients.has(userId)) return;

  clients.get(userId).delete(res);

  // Clean up the map entry if the user has no more connections
  if (clients.get(userId).size === 0) {
    clients.delete(userId);
  }
};

// ─── Send an event to a specific user ─────────────────────────────────────
// eventType: a string the client uses to filter events e.g. 'notification', 'chat', 'order'
// data:      any serialisable object

export const sendToUser = (userId, eventType, data) => {
  if (!clients.has(userId)) return; // user not connected — that's fine

  const userConnections = clients.get(userId);

  for (const res of userConnections) {
    try {
      // SSE wire format:
      //   event: <eventType>\n
      //   data: <JSON string>\n\n
      // The double newline signals the end of one event
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      // If writing fails, the connection is broken — remove it
      removeClient(userId, res);
    }
  }
};

// ─── Send an event to multiple users at once ──────────────────────────────
// e.g. send a chat message to both the client and the admin

export const sendToUsers = (userIds, eventType, data) => {
  for (const userId of userIds) {
    sendToUser(userId, eventType, data);
  }
};

// ─── Get count of connected users (useful for debugging) ──────────────────

export const getConnectedCount = () => clients.size;

// Check if a specific user is currently connected
export const isUserOnline = (userId) => clients.has(userId);

// Get all currently connected userIds
export const getOnlineUserIds = () => Array.from(clients.keys());
