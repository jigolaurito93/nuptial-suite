export type GuestRsvpStatus = "pending" | "attending" | "declined";

export type RsvpStatus = "attending" | "declining";

export type RsvpPayload = {
  fullName: string;
  contactNumber: string;
  status: RsvpStatus;
  message?: string;
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
