/** 주문 정보 DTO */
export interface OrderDto {
  id: string;
  account_no: string;
  account_product_code: string;
  market: string;
  stock_code: string;
  order_pos: string;
  order_kind: string;
  order_type: string;
  order_price: number | null;
  order_qty: number;
  status: string;
  requested_at: string;
  submitted_at: string | null;
  original_order_id: string | null;
  original_broker_order_no: string | null;
  original_broker_org_no: string | null;
  broker_order_no: string | null;
  broker_org_no: string | null;
  rt_cd: string | null;
  msg_cd: string | null;
  msg1: string | null;
  filled_qty: number;
  remaining_qty: number;
  avg_fill_price: number | null;
  request_payload: unknown | null;
  submit_response_payload: unknown | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
