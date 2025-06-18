import { sendUserUpdateEmail } from '../models/email'; 

export async function userAfterOperation({
  operation,
  item,
  originalItem,
  context,
}: {
  operation: 'create' | 'update' | 'delete';
  item: any;
  originalItem: any;
  context: any;
}) {
  if (['create', 'update', 'delete'].includes(operation)) {
    try {
      await context.db.UserLog.createOne({
        data: {
          user: { connect: { id: item?.id || originalItem?.id } },
          operation,
          before: originalItem ? JSON.stringify(originalItem) : null,
          after: item ? JSON.stringify(item) : null,
          timestamp: new Date().toISOString(),
        },
      });

      await sendUserUpdateEmail(
        item?.email || originalItem?.email || 'admin@yourdomain.com',
        `Your Account Was ${operation[0].toUpperCase() + operation.slice(1)}`,
        `<p>Hi ${item?.name || originalItem?.name || 'User'}, your account was ${operation}d.</p>`
      );
    } catch (error) {
      console.error(`Failed in afterOperation (${operation}):`, error);
    }
  }
}