export interface Transaction {
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  data?: {
    method?: string;
    policyId?: string | number;
    amount?: string;
    error?: string;
    [key: string]: any;
  };
} 