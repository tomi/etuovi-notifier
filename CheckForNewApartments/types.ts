import {
  RouteLeg,
  TravelMode,
  DirectionsStep,
  TransitMode,
  DirectionsResponse
} from "@googlemaps/google-maps-services-js";

export type ApartmentId = string;
export type PlaceId = string;
export type FullAddress = string;

export type FixedRouteLeg = RouteLeg & { arrival_time: ArrivalTime & { value: number }, departure_time: ArrivalTime & { value: number} };
export type FixedDirectionsStep = DirectionsStep & { travel_mode: TravelMode };

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ArrivalTime {
  weekDay: WeekDay;
  hour: number;
  minute: number;
}

export interface TransitOptions {
  arrivalTime?: ArrivalTime;
  modes: TravelMode[];
  // When traveling from Apartment to a place address, which waypoints are
  // needed for the travel
  waypoints?: FullAddress[];
  transitModes?: TransitMode[];
}

export interface AddressComponents {
  street: string;
  city: string;
  cityPart: string;
  postalCode: string;
  country: string;
}

export interface Apartment {
  id: ApartmentId;
  url: string;
  address: FullAddress;
  addressComponents: AddressComponents;
}

export interface Place {
  id: PlaceId;
  address: FullAddress;
  transitOptions: TransitOptions;
}

export interface DirectionsForPlace {
  placeId: PlaceId;
  // For each travel mode (drive, transit, bicycle)
  directionsResponses: DirectionsResponse[];
}

export interface DirectionsForApartment {
  apartmentId: ApartmentId;
  directionsForPlaces: DirectionsForPlace[];
}
