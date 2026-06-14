const WebSocket = require('ws');

let wss = null;

// Map of orderId -> Set of WebSocket clients subscribed to it
const orderSubscribers = new Map();

// Map of restaurantId -> Set of WebSocket clients
const restaurantSubscribers = new Map();

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('[WS] Client connected');
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        handleMessage(ws, msg);
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
      cleanupClient(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to order tracker' }));
  });

  // Heartbeat to detect broken connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        cleanupClient(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}

function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'subscribe_order':
      subscribeToOrder(ws, String(msg.orderId));
      break;
    case 'subscribe_restaurant':
      subscribeToRestaurant(ws, String(msg.restaurantId));
      break;
    case 'unsubscribe_order':
      unsubscribeFromOrder(ws, String(msg.orderId));
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
  }
}

function subscribeToOrder(ws, orderId) {
  if (!orderSubscribers.has(orderId)) {
    orderSubscribers.set(orderId, new Set());
  }
  orderSubscribers.get(orderId).add(ws);
  ws._subscribedOrders = ws._subscribedOrders || new Set();
  ws._subscribedOrders.add(orderId);
  ws.send(JSON.stringify({ type: 'subscribed', channel: 'order', orderId }));
}

function subscribeToRestaurant(ws, restaurantId) {
  if (!restaurantSubscribers.has(restaurantId)) {
    restaurantSubscribers.set(restaurantId, new Set());
  }
  restaurantSubscribers.get(restaurantId).add(ws);
  ws._subscribedRestaurant = restaurantId;
  ws.send(JSON.stringify({ type: 'subscribed', channel: 'restaurant', restaurantId }));
}

function unsubscribeFromOrder(ws, orderId) {
  if (orderSubscribers.has(orderId)) {
    orderSubscribers.get(orderId).delete(ws);
  }
  if (ws._subscribedOrders) {
    ws._subscribedOrders.delete(orderId);
  }
}

function cleanupClient(ws) {
  if (ws._subscribedOrders) {
    ws._subscribedOrders.forEach((orderId) => {
      if (orderSubscribers.has(orderId)) {
        orderSubscribers.get(orderId).delete(ws);
      }
    });
  }
  if (ws._subscribedRestaurant) {
    const rid = ws._subscribedRestaurant;
    if (restaurantSubscribers.has(rid)) {
      restaurantSubscribers.get(rid).delete(ws);
    }
  }
}

function broadcastOrderUpdate(orderId, payload) {
  const key = String(orderId);
  const subscribers = orderSubscribers.get(key);
  if (!subscribers || subscribers.size === 0) return;

  const msg = JSON.stringify({ type: 'order_update', orderId: key, ...payload });
  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function broadcastRestaurantUpdate(restaurantId, payload) {
  const key = String(restaurantId);
  const subscribers = restaurantSubscribers.get(key);
  if (!subscribers || subscribers.size === 0) return;

  const msg = JSON.stringify({ type: 'restaurant_update', restaurantId: key, ...payload });
  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

module.exports = {
  initWebSocket,
  broadcastOrderUpdate,
  broadcastRestaurantUpdate,
};
