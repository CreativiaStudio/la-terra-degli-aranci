export interface ChildGuest {
  name: string;
  age: number;
}

export type PartyType = 'singolo' | 'coppia' | 'famiglia' | 'gruppo';

export type DietaryOption =
  | 'celiachia'
  | 'lattosio'
  | 'vegetariano'
  | 'vegano'
  | 'crostacei'
  | 'frutta_secca'
  | 'personalizzato';

export interface RsvpSubmission {
  id: string;
  submittedAt: string;
  fullName: string;
  phone: string;
  email?: string;
  attending: boolean;
  partyType?: PartyType;
  adultsCount?: number;
  companions?: string[];
  hasPlusOne: boolean;
  plusOneName?: string;
  hasChildren: boolean;
  childrenCount: number;
  childrenList?: ChildGuest[];
  dietaryRestrictions?: DietaryOption[];
  dietaryCustomNotes?: string;
  djSongRequest?: string;
  personalMessage?: string;
  updatedAt?: string;
}

export interface RsvpStats {
  totalAttending: number;
  totalDeclined: number;
  totalPlusOnes: number;
  totalChildren: number;
  totalAdults: number;
  dietaryCounts: Record<DietaryOption, number>;
}
