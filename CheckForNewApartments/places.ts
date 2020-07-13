import { TravelMode, TransitMode } from "@googlemaps/google-maps-services-js";
import { Place, ArrivalTime } from "./types";

const workStart: ArrivalTime = { weekDay: 'Monday', hour: 9, minute: 0 };
const hobbyStart: ArrivalTime = { weekDay: 'Tuesday', hour: 18, minute: 0 };

const PLACES: Place[] = [
  {
    id: 'My work',
    address: 'Annankatu 1, 00100 Helsinki',
    transitOptions: {
      arrivalTime: workStart,
      modes: [TravelMode.transit, TravelMode.bicycling],
      waypoints: ['Rautatieasema, 00100 Helsinki']
    }
  },
  {
    id: 'My hobby',
    address: 'Tali Frisbeegolf',
    transitOptions: {
      arrivalTime: hobbyStart,
      modes: [TravelMode.transit, TravelMode.driving],
      transitModes: [TransitMode.bus],
    },
  },
];

export default PLACES;
