import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { getGoogleMapsApiKey } from "@/lib/env";

let configured = false;

export function configureMapsLoader() {
  if (configured) {
    return;
  }

  setOptions({ key: getGoogleMapsApiKey() });
  configured = true;
}

export async function loadMapsLibrary(): Promise<unknown> {
  configureMapsLoader();
  return importLibrary("maps");
}
