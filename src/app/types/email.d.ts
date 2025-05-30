export interface EmailData {
  email: string;
  name: string;
  orderNumber: string;
  total: number;
  status: 'approved' | 'declined' | 'error';
}
