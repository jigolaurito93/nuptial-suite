export type RsvpStatus = "attending" | "declining";

export type InviteRsvpStatus = "pending" | "attending" | "declining";

export type HouseholdRsvpStatus =
  | "pending"
  | "attending"
  | "declining"
  | "mixed";

export type PublicGuest = {
  id: string;
  fullName: string;
  namePrefix: string | null;
  isPlusOne: boolean;
  rsvpStatus: InviteRsvpStatus;
};

export type PublicInvite = {
  label: string;
  plusOnesAllowed: number;
  contactNumber: string | null;
  message: string | null;
  rsvpOpen: boolean;
  guests: PublicGuest[];
};

export type LookupInviteRow = {
  label: string;
  plus_ones_allowed: number;
  contact_number: string | null;
  message: string | null;
  rsvp_open: boolean;
  guests: unknown;
};

export type Household = {
  id: string;
  inviteCode: string;
  label: string;
  plusOnesAllowed: number;
  contactNumber: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HouseholdRow = {
  id: string;
  invite_code: string;
  label: string;
  plus_ones_allowed: number;
  contact_number: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
};

export type Guest = {
  id: string;
  householdId: string;
  fullName: string;
  namePrefix: string | null;
  isPlusOne: boolean;
  rsvpStatus: InviteRsvpStatus;
  createdAt: string;
  updatedAt: string;
};

export type GuestRow = {
  id: string;
  household_id: string;
  full_name: string;
  name_prefix?: string | null;
  is_plus_one: boolean;
  rsvp_status: InviteRsvpStatus;
  created_at: string;
  updated_at: string;
};

export type GuestWithHousehold = Guest & {
  householdLabel: string;
  householdInviteCode: string;
};

export type WellWish = {
  id: string;
  fullName: string;
  message: string;
  contactNumber: string | null;
  createdAt: string;
};

export type WellWishRow = {
  id: string;
  full_name: string;
  message: string;
  contact_number: string | null;
  created_at: string;
};

export type GuestReply = {
  id: string;
  status: RsvpStatus;
};

export type RsvpPayload = {
  inviteCode: string;
  contactNumber: string;
  message?: string;
  guestReplies: GuestReply[];
  plusOneNames?: string[];
};

export type InvitationSection = {
  id: string;
  title: string;
  description: string;
};

export type AdminSection = {
  id: string;
  title: string;
  description: string;
};
