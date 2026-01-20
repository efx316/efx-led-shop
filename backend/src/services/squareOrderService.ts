import { squareApiRequest, locationId } from './squareService.js';

// Type definitions for Square Orders API
interface Order {
  id?: string;
  locationId?: string;
  referenceId?: string;
  lineItems?: any[];
  state?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderLineItem {
  catalogObjectId: string;
  quantity: string;
  name: string;
  note?: string;
}

export interface CreateOrderInput {
  lineItems: OrderLineItem[];
  customerId?: string;
  referenceId?: string;
}

export async function createSquareOrder(input: CreateOrderInput): Promise<Order> {
  try {
    const orderRequest = {
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: locationId,
        line_items: input.lineItems.map(item => ({
          catalog_object_id: item.catalogObjectId,
          quantity: item.quantity,
          name: item.name,
          note: item.note,
        })),
        reference_id: input.referenceId,
        customer_id: input.customerId,
      },
    };

    const response = await squareApiRequest('POST', '/v2/orders', orderRequest);

    if (!response.order) {
      throw new Error('Order creation failed: No order returned');
    }

    return response.order;
  } catch (error) {
    console.error('Error creating Square order:', error);
    throw error;
  }
}

export async function getSquareOrder(orderId: string): Promise<Order | null> {
  try {
    const response = await squareApiRequest('GET', `/v2/orders/${orderId}`);

    if (!response.order) {
      return null;
    }

    return response.order;
  } catch (error) {
    console.error('Error fetching Square order:', error);
    return null;
  }
}

