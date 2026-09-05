import { invitation, mapsUrl } from "@/content/invitation";
import { SectionHeading } from "@/components/invitation/SectionHeading";

export function VenueSection() {
  return (
    <section
      id="venue"
      className="invitation-section border-t border-border px-6 py-24"
    >
      <SectionHeading
        eyebrow="Locations"
        title="Venue"
        description="Ceremony in Nasugbu, celebration in Tagaytay."
      />

      <div className="mx-auto mt-14 grid max-w-4xl gap-12 md:grid-cols-2">
        {[invitation.venues.ceremony, invitation.venues.reception].map(
          (venue) => (
            <div key={venue.name}>
              <p className="text-xs tracking-[0.22em] text-accent uppercase">
                {venue.title}
              </p>
              <h3 className="font-display mt-3 text-3xl font-medium">
                {venue.name}
              </h3>
              <p className="mt-3 text-muted">{venue.address}</p>
              <a
                href={mapsUrl(venue.mapsQuery)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm tracking-wide text-foreground underline underline-offset-4"
              >
                Open in Maps
              </a>
            </div>
          ),
        )}
      </div>

      <div className="mx-auto mt-20 max-w-4xl">
        <h3 className="font-display text-center text-3xl font-medium">
          Nearby hotels
        </h3>
        <ul className="mt-10 space-y-8">
          {invitation.hotels.map((hotel) => (
            <li
              key={hotel.name}
              className="flex flex-col gap-1 border-b border-border pb-8 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <div>
                <p className="text-lg text-foreground">{hotel.name}</p>
                <p className="text-sm text-muted">{hotel.detail}</p>
              </div>
              <a
                href={mapsUrl(hotel.mapsQuery)}
                target="_blank"
                rel="noreferrer"
                className="text-sm tracking-wide underline underline-offset-4"
              >
                Maps
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
