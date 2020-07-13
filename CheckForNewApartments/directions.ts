import {
  FullAddress,
  AddressComponents,
  TransitOptions,
  ArrivalTime,
  Apartment,
  DirectionsForPlace,
  DirectionsForApartment,
  FixedRouteLeg,
  FixedDirectionsStep,
  Place
} from "./types";
import {
  DirectionsResponse,
  Client,
  UnitSystem,
  TransitRoutingPreference,
  TravelMode,
  Status
} from "@googlemaps/google-maps-services-js";
import { config } from "./config";
import moment from "moment-timezone";
import PLACES from "./places";
import cheerio from "cheerio";
import { mapSeriesAsync, weekDayToIsoWeekday } from "./util";

// Apartment address might have too many components and G maps doesn't recognize the address
// Splitting to components and sending only certain parts help.
async function fetchDirections(
  apartmentAddress: AddressComponents,
  placeAddress: FullAddress,
  transitOptions: TransitOptions
): Promise<DirectionsResponse[]> {
  const client = new Client();

  const responses = await mapSeriesAsync(transitOptions.modes, async mode => {
    try {
      return await client.directions({
        params: {
          key: config.googleMapsKey,
          origin: `${apartmentAddress.street}, ${apartmentAddress.postalCode}, ${apartmentAddress.city}`,
          destination: placeAddress,
          units: UnitSystem.metric,
          mode,
          arrival_time: arrivalTimeToUnix(transitOptions.arrivalTime),
          transit_mode: transitOptions.transitModes,
          transit_routing_preference: TransitRoutingPreference.fewer_transfers,
          // "Waypoints are only supported for driving, walking and bicycling directions."
          waypoints: mode !== TravelMode.transit
            ? transitOptions.waypoints || []
            : [],
        },
      });
    } catch (e) {
      if (e.response && e.response.data) {
        const message = e.response.data.error_message;
        // XXX: How to get logger instance here?
        console.error('Error fetching directions:' , message);
      } else {
        console.error('Error fetching directions:' , e);
      }

      throw e;
    }
  });

  return responses;
}

function travelModeToLabel(mode: TravelMode): string  {
  return {
    // Works in telegram HTML parsing mode
    // For codes see https://emojipedia.org/bicycle/
    // Bike example: code point U+1F6B2 -> &#xF6B2
    [TravelMode.bicycling]: '&#x1F6B2',
    [TravelMode.driving]: '&#x1F697',
    [TravelMode.transit]: '&#x1F68C',
    [TravelMode.walking]: '&#x1F6B6',
  }[mode.toLowerCase()];
}

function arrivalTimeToUnix(arrivalTime: ArrivalTime): number {
  const wantedDay = weekDayToIsoWeekday(arrivalTime.weekDay);

  let date = moment();
  // if we haven't yet passed the day of the week:
  if (moment().isoWeekday() <= wantedDay) {
    // get this week's instance of that day
    date = date.isoWeekday(wantedDay)
  } else {
    // otherwise, get next week's instance of that day
    date = moment().add(1, 'weeks').isoWeekday(wantedDay);
  }

  const arrival = date
    .hour(arrivalTime.hour)
    .minute(arrivalTime.minute)
    .second(0)

  return arrival.unix();
}

async function findDirectionsForPlace(apartment: Apartment, place: Place): Promise<DirectionsForPlace> {
  const directions = await fetchDirections(apartment.addressComponents, place.address, place.transitOptions);
  return {
    placeId: place.id,
    directionsResponses: directions,
  };
}

async function findDirectionsForApartment(apartment: Apartment): Promise<DirectionsForApartment> {
  const directionsForPlaces = await mapSeriesAsync(PLACES, (place) => findDirectionsForPlace(apartment, place));
  return {
    apartmentId: apartment.id,
    directionsForPlaces: directionsForPlaces,
  };
}

function getMessageForPlaceTravel(apartment: Apartment, directionsForPlace: DirectionsForPlace): string {
  const lines: string[] = [];
  // Can't be undefined
  const place = PLACES.find(p => p.id === directionsForPlace.placeId) as Place;
  const hasWayPoints = place.transitOptions && place.transitOptions.waypoints && place.transitOptions.waypoints.length > 0;
  const wayPointAddition = hasWayPoints
    ? `via ${place.transitOptions?.waypoints?.length} waypoints`
    : '';
  lines.push(`<b>Travel from apartment to ${directionsForPlace.placeId} ${wayPointAddition}</b>`);

  const responses = directionsForPlace.directionsResponses
    .map((response, index) => {
      return {
        mode: place.transitOptions.modes[index],
        response,
      };
    });

  const firstSuccessRes = responses.filter(r => isSuccessResponse(r.response))[0];
  if (!firstSuccessRes) {
    lines.push('No routes could be found');
    return lines.join('\n');
  }

  responses.forEach(({ response, mode }) => {
    getMessageLinesForTravelMode(place, mode, response).forEach(line => lines.push(line));
  });

  const link = formatGoogleMapsLink(apartment.address, place.address, place.transitOptions);
  lines.push(`<b>Link:</b> ${link}`)

  return lines.join('\n');
}

function getMessageLinesForTravelMode(place: Place, mode: TravelMode, response: DirectionsResponse): string[] {
  const lines: string[] = [];

  if (!isSuccessResponse(response) || response.data.routes.length === 0) {
    console.error(response.data);
    lines.push(`${travelModeToLabel(mode)} No route found ${response.data.error_message || ''}`);
    return lines;
  }

  const legCount = response.data.routes[0].legs.length
  const totalSec = response.data.routes[0].legs.reduce((acc, leg) => acc + leg.duration.value, 0);
  const totalMeter = response.data.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
  const lineParts = [
    `${travelModeToLabel(mode)} total of `,
    `${formatDuration(totalSec)}, ${formatDistance(totalMeter)} travel`,
    mode === TravelMode.transit && place.transitOptions.waypoints && place.transitOptions.waypoints.length > 0
      ? ' <i>(waypoints not supported in transit mode)</i>'
      : '',
    response.data.routes.length > 1
      ? ` (${response.data.routes.length} routes available)`
      : '',
    legCount > 1
      ? `. Route with ${legCount} legs:`
      : '',
  ];
  lines.push(lineParts.join(''));
  lines.push('');
  if (mode === TravelMode.transit) {
    // Transit mode has one leg, since waypoints are not supported
    const leg = response.data.routes[0].legs[0] as FixedRouteLeg;
    getMessageLinesForTransit(leg).forEach(line => lines.push(line));
  } else {
    const legs = response.data.routes[0].legs as FixedRouteLeg[];
    getMessageLinesForOtherTravel(place, legs).forEach(line => lines.push(line));
  }

  lines.push('\n');
  return lines;
}

function isSuccessResponse(response: DirectionsResponse): boolean {
  return response.status === 200 && response.data.status === Status.OK;
}

function getMessageLinesForTransit(leg: FixedRouteLeg): string[] {
  const lines: string[] = [];
  const departure = moment.unix(leg.departure_time.value).tz(leg.departure_time.time_zone);
  lines.push(`o  Departure ${departure.format('HH:MM [on] ddd')} (${leg.departure_time.time_zone})`);
  leg.steps.forEach((step: FixedDirectionsStep) => {
    lines.push(`|  <i>${parseGoogleHtmlInstructions(step.html_instructions)} (${formatDuration(step.duration.value)})</i>`);
  });
  const arrival = moment.unix(leg.arrival_time.value).tz(leg.arrival_time.time_zone);
  lines.push(`o  Arrival ${arrival.format('HH:MM [on] ddd')} (${leg.arrival_time.time_zone})`);

  return lines;
}

function getMessageLinesForOtherTravel(place: Place, legs: FixedRouteLeg[]): string[] {
  const lines: string[] = [];
  legs.forEach((leg, index) => {
    const firstStep = leg.steps[0] as FixedDirectionsStep
    const legTravelMode = firstStep.travel_mode;

    const startAddress = leg.start_address
      ? `${leg.start_address.split(',')[0].trim()} `
      : ''
    lines.push(`${index + 1}. ${startAddress}`);
    lines.push(`|  <i>${formatDuration(leg.duration.value)}, ${formatDistance(leg.distance.value)} by ${travelModeToLabel(legTravelMode)}</i>`);
  });
  lines.push(`o  ${place.address} (${place.id})`);

  return lines;
}

// Return HTML suitable for Telegram
// https://developers.google.com/maps/documentation/directions/intro#Steps
function parseGoogleHtmlInstructions(html: string): string {
  // Don't wrap content to <html><body> etc tags
  const $ = cheerio.load(html, { xmlMode: true });

  // Remove all div wrappers, and replace them with just their content.
  // There might be other tags in Google's instructions_html,
  // but it's not documented.
  $('div').each(function() {
    $(this).replaceWith(($(this) as any).html());
  });

  const newHtml = $.html();
  // HTML contains <wbr/> which indicates a line break
  return newHtml.replace(/<wbr\/>/g, '\n');
}

function formatDistance(distanceMeter: number): string {
  return `${(distanceMeter / 1000).toFixed(1)} km`;
}

function formatDuration(durationSec: number): string {
  return `${Math.round(durationSec / 60).toFixed(0)} min`;
}

function formatGoogleMapsLink(address1: FullAddress, address2: FullAddress, transitOptions: TransitOptions): string {
  // https://stackoverflow.com/questions/11354211/google-maps-query-parameter-clarification
  // https://developers.google.com/maps/documentation/urls/guide#directions-action
  const waypoints = transitOptions.waypoints || [];

  return [
    'https://www.google.com/maps/dir/?api=1',
    `&origin=${encodeURIComponent(address1)}`,
    `&destination=${encodeURIComponent(address2)}`,
    `&waypoints=${encodeURIComponent(waypoints.join('|'))}`,
  ].join('');
}

export function getMessagesForTravels(apartment: Apartment, directionsForApartments: DirectionsForApartment[]): string[] {
  const directionsForApt = directionsForApartments.find(d => apartment.id === d.apartmentId);
  if (!directionsForApt) {
    return [];
  }

  return directionsForApt.directionsForPlaces.map(directionsForPlace => {
    return getMessageForPlaceTravel(apartment, directionsForPlace);
  })
}

export async function findDirectionsForApartments(apartments: Apartment[]): Promise<DirectionsForApartment[]> {
  const directionsForApartment = await mapSeriesAsync(apartments, findDirectionsForApartment);
  return directionsForApartment;
}
