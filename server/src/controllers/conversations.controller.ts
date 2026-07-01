import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Conversation, Message } from '../models/Conversation';
import { Stylist } from '../models/Stylist';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../utils/apiError';
import { sendSuccess } from '../utils/apiResponse';
import { getIO } from '../socket';
import { createNotification } from '../utils/notify';

export const getMyConversations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  let filter: any = {};
  if (role === 'stylist') {
    const stylist = await Stylist.findOne({ userId });
    if (!stylist) throw new ApiError(404, 'Stylist profile not found');
    filter.stylistId = stylist.id;
  } else {
    filter.clientId = userId;
  }

  filter.archived = false;

  const conversations = await Conversation.find(filter)
    .populate('clientId', 'name avatar')
    .populate('stylistId', 'name image')
    .sort({ 'lastMessage.createdAt': -1 });

  return sendSuccess(res, { conversations });
});

export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const role = req.user?.role;

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, 'Conversation not found');

  if (role === 'stylist') {
    const stylist = await Stylist.findOne({ userId });
    if (!stylist || conversation.stylistId.toString() !== stylist.id) {
      throw new ApiError(403, 'Access denied');
    }
  } else if (conversation.clientId.toString() !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  const messages = await Message.find({ conversationId: id })
    .populate('senderId', 'name avatar role')
    .sort({ createdAt: 1 })
    .limit(200);

  if (role === 'stylist' && conversation.unreadStylist > 0) {
    conversation.unreadStylist = 0;
    await conversation.save();
  } else if (role === 'client' && conversation.unreadClient > 0) {
    conversation.unreadClient = 0;
    await conversation.save();
  }

  return sendSuccess(res, { conversation, messages });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!content?.trim()) throw new ApiError(400, 'Message content is required');

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, 'Conversation not found');

  if (role === 'stylist') {
    const stylist = await Stylist.findOne({ userId });
    if (!stylist || conversation.stylistId.toString() !== stylist.id) {
      throw new ApiError(403, 'Access denied');
    }
  } else if (conversation.clientId.toString() !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  const message = await Message.create({
    conversationId: id,
    senderId: new mongoose.Types.ObjectId(userId),
    senderRole: role,
    content: content.trim()
  });

    conversation.lastMessage = {
    content: content.trim(),
    senderId: message.senderId,
    createdAt: message.createdAt
  };

  if (role === 'stylist') {
    conversation.unreadClient += 1;
  } else {
    conversation.unreadStylist += 1;
  }

  await conversation.save();

  const populated = await message.populate('senderId', 'name avatar role');

  getIO().of('/conversations').to(`conversation:${id}`).emit('message:new', populated);

  const recipientId = role === 'stylist' ? conversation.clientId : conversation.stylistId;
  const sender = await User.findById(userId).select('name');
  createNotification({
    userId: recipientId.toString(),
    type: 'booking',
    title: 'New Message',
    message: `You have a new message from ${sender?.name || 'Someone'}`,
    link: role === 'stylist' ? '/stylist/messages' : '/app/messages',
    metadata: { conversationId: id },
  }).catch(() => {});

  return sendSuccess(res, { message: populated }, 'Message sent', 201);
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  if (role === 'stylist') {
    const { clientId, bookingId, subject } = req.body;
    const stylist = await Stylist.findOne({ userId });
    if (!stylist) throw new ApiError(404, 'Stylist profile not found');

    const client = await User.findById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');

    let conversation = await Conversation.findOne({
      stylistId: stylist.id,
      clientId
    });

    if (!conversation) {
      conversation = await Conversation.create({
        stylistId: stylist.id,
        clientId,
        bookingId,
        subject
      });
    }

    return sendSuccess(res, { conversation }, 'Conversation created');
  }

  const { stylistId, bookingId, subject } = req.body;
  const stylist = await Stylist.findById(stylistId);
  if (!stylist) throw new ApiError(404, 'Stylist not found');

  let conversation = await Conversation.findOne({
    stylistId: stylist.id,
    clientId: userId
  });

  if (!conversation) {
    conversation = await Conversation.create({
      stylistId: stylist.id,
      clientId: userId,
      bookingId,
      subject
    });
  }

  return sendSuccess(res, { conversation }, 'Conversation created');
});

export const getUnreadCounts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  let filter: any = {};
  if (role === 'stylist') {
    const stylist = await Stylist.findOne({ userId });
    if (!stylist) throw new ApiError(404, 'Stylist profile not found');
    filter.stylistId = stylist.id;
  } else {
    filter.clientId = userId;
  }

  filter.archived = { $ne: true };

  const conversations = await Conversation.find(filter);
  const unreadCount = conversations.reduce((sum, c) => {
    return sum + (role === 'stylist' ? c.unreadStylist : c.unreadClient);
  }, 0);

  return sendSuccess(res, { unreadCount });
});

export const archiveConversation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(404, 'Conversation not found');

  let authorized = false;
  if (userRole === 'admin') {
    authorized = true;
  } else if (userRole === 'stylist' || userRole === 'client') {
    const stylist = userRole === 'stylist' ? await Stylist.findOne({ userId }) : null;
    const stylistId = stylist?.id?.toString();
    authorized = conversation.stylistId.toString() === stylistId || conversation.clientId.toString() === userId;
  }
  if (!authorized) throw new ApiError(403, 'Not authorized to archive this conversation');

  conversation.archived = true;
  await conversation.save();

  return sendSuccess(res, null, 'Conversation archived');
});