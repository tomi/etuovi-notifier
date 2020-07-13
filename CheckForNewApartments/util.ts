import { WeekDay } from "./types";

// https://github.com/sindresorhus/p-map-series
// MIT Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
export async function mapSeriesAsync<ValueType, MappedValueType>(
  iterable: Iterable<PromiseLike<ValueType> | ValueType>,
  cb: (item: ValueType, idx: number) => PromiseLike<MappedValueType> | MappedValueType
): Promise<MappedValueType[]> {
  const results: MappedValueType[] = [];
  let index = 0;
  for (let item of iterable) {
    const result = await cb(await item, index++);
    results.push(result);
  }
  return results;
}

// Returns ISO day of the week with 1 being Monday and 7 being Sunday.
export function weekDayToIsoWeekday(day: WeekDay): number  {
  return {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7,
  }[day];
}
