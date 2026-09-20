export type GuestRsvpStatus = "pending" | "attending" | "declined";

export type RsvpStatus = "attending" | "declining";

export type InviteRsvpStatus = "pending" | "attending" | "declining";

export type PublicInvite = {
  displayName: string;
  plusOnesAllowed: number;
  rsvpStatus: InviteRsvpStatus;
  plusOneNames: string[];
  contactNumber: string | null;
};

export type Invite = PublicInvite & {
  id: string;
  inviteCode: string;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InviteRow = {
  id: string;
  invite_code: string;
  display_name: string;
  plus_ones_allowed: number;
  rsvp_status: InviteRsvpStatus;
  contact_number: string | null;
  message: string | null;
  plus_one_names: string[] | null;
  created_at: string;
  updated_at: string;
};

export type RsvpPayload = {
  fullName?: string;
  contactNumber: string;
  status: RsvpStatus;
  message?: string;
  inviteCode?: string;
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
