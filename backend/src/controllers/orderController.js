const { Op } = require('sequelize');
const { Order, OrderItem, Restaurant, User } = require('../models');
const { success, created, error, notFound, forbidden, serverError } = require('../utils/response');
const { broadcastOrderUpdate, broadcastRestaurantUpdate } = require('../utils/websocket');
 
// Helper: get restaurant profile for a user
async function getRestaurantProfile(userId) {
  return Restaurant.findOne({ where: { userId } });
}
 
const orderWithItems = {
  include: [
    { model: OrderItem, as: 'items' },
    { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'phone', 'address'] },
    { model: User, as: 'customer', attributes: ['id', 'name', 'email'] },
  ],
};
 
// POST /api/orders — Customer places an order
const placeOrder = async (req, res) => {
  try {
    const { restaurantId, deliveryAddress, items, notes } = req.body;
 
    if (!restaurantId || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      return error(res, 'restaurantId, deliveryAddress, and items[] are required');
    }
 
    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant) {
      return notFound(res, 'Restaurant not found');
    }
 
    // Block placing a new order if one is already active (not yet delivered)
    const activeOrder = await Order.findOne({
      where: {
        customerId: req.user.id,
        status: { [Op.ne]: 'delivered' },
      },
    });
    if (activeOrder) {
      return error(
        res,
        'You already have an active order. Wait for it to be delivered before placing a new one.',
        409
      );
    }
 
    // Validate items
    for (const item of items) {
      if (!item.name || !item.price || !item.quantity) {
        return error(res, 'Each item must have name, price, and quantity');
      }
    }
 
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
 
    const order = await Order.create({
      customerId: req.user.id,
      restaurantId,
      status: 'placed',
      deliveryAddress,
      totalAmount,
      notes: notes || null,
      estimatedDeliveryMinutes: 35,
    });
 
    await OrderItem.bulkCreate(
      items.map((item) => ({
        orderId: order.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }))
    );
 
    const fullOrder = await Order.findByPk(order.id, orderWithItems);
 
    // Notify restaurant in real-time
    broadcastRestaurantUpdate(restaurantId, {
      event: 'new_order',
      order: fullOrder,
    });
 
    return created(res, { order: fullOrder }, 'Order placed successfully');
  } catch (err) {
    return serverError(res, err.message);
  }
};
 
// GET /api/orders/my — Customer: get their active/recent order
const getMyOrder = async (req, res) => {
  try {
    // Return the most recent non-delivered order first, else the latest order
    let order = await Order.findOne({
      where: { customerId: req.user.id },
      ...orderWithItems,
      order: [
        // Active orders first
        ['createdAt', 'DESC'],
      ],
    });
 
    if (!order) {
      return success(res, { order: null });
    }
 
    return success(res, { order });
  } catch (err) {
    return serverError(res, err.message);
  }
};
 
// GET /api/orders/:id — Get single order (customer owns it, or restaurant owns the restaurant)
const getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, orderWithItems);
    if (!order) return notFound(res, 'Order not found');
 
    // Check ownership
    if (req.user.role === 'restaurant') {
      const rp = await getRestaurantProfile(req.user.id);
      if (!rp || rp.id !== order.restaurantId) {
        return forbidden(res, 'You do not own this order');
      }
    } else if (req.user.role === 'customer' && order.customerId !== req.user.id) {
      return forbidden(res, 'You do not own this order');
    }
 
    return success(res, { order });
  } catch (err) {
    return serverError(res, err.message);
  }
};
 
// GET /api/restaurant/orders — Restaurant: get their queue
const getRestaurantOrders = async (req, res) => {
  try {
    const restaurantProfile = await getRestaurantProfile(req.user.id);
    if (!restaurantProfile) return notFound(res, 'Restaurant profile not found');
 
    const { status } = req.query;
    const where = { restaurantId: restaurantProfile.id };
    if (status) where.status = status;
 
    const orders = await Order.findAll({
      where,
      ...orderWithItems,
      order: [['createdAt', 'DESC']],
    });
 
    return success(res, { orders, restaurantId: restaurantProfile.id });
  } catch (err) {
    return serverError(res, err.message);
  }
};
 
// PATCH /api/orders/:id/status — Restaurant: advance order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return error(res, 'status is required');
 
    const order = await Order.findByPk(req.params.id, orderWithItems);
    if (!order) return notFound(res, 'Order not found');
 
    // Verify restaurant owns this order
    const restaurantProfile = await getRestaurantProfile(req.user.id);
    if (!restaurantProfile || restaurantProfile.id !== order.restaurantId) {
      return forbidden(res, 'You do not own this order');
    }
 
    // Enforce valid transition
    if (!Order.isValidTransition(order.status, status)) {
      return error(
        res,
        `Invalid status transition: ${order.status} → ${status}. Next valid status: ${Order.VALID_TRANSITIONS[order.status]?.[0] || 'none (order is complete)'}`,
        422
      );
    }
 
    await order.update({ status });
    const updated = await Order.findByPk(order.id, orderWithItems);
 
    // Broadcast to customer tracking this order
    broadcastOrderUpdate(order.id, {
      event: 'status_update',
      status,
      order: updated,
    });
 
    // Broadcast to other restaurant staff viewing simultaneously
    broadcastRestaurantUpdate(restaurantProfile.id, {
      event: 'order_status_changed',
      orderId: order.id,
      status,
      order: updated,
    });
 
return success(res, { order: updated }, 200, `Order status updated to ${status}`);  } catch (err) {
    return serverError(res, err.message);
  }
};
 
module.exports = { placeOrder, getMyOrder, getOrder, getRestaurantOrders, updateOrderStatus };