export type RuleKey = 'limit' | 'checkNew' | 'scamPause';
export type TransferStatus = 'sent' | 'pending' | 'approved' | 'declined' | 'blocked';

export type Recipient = {
  id: string;
  name: string;
  initials: string;
  relationship: string;
  iban?: string;
};

export type Transfer = {
  id: string;
  recipient: Recipient;
  direction: 'incoming' | 'outgoing';
  sender?: Recipient;
  amount: number;
  status: TransferStatus;
  createdAt: number;
  pressured: boolean;
  isNew: boolean;
  aboveLimit: boolean;
  limitAtCreation?: number;
  expired: boolean;
};

export type SharedData = {
  balance: number;
  transfers: Transfer[];
  limit: number | null;
  checkNew: boolean;
  scamPause: boolean;
  favouriteIds: string[];
  protectionOffAt: Partial<Record<RuleKey, number>>;
  inviteSent: boolean;
  consent: boolean;
};

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
