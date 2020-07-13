import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { parseApartmentsFromEmail } from '../CheckForNewApartments/logic';
import { Apartment } from '../CheckForNewApartments/types';

// Example email made with an Etuovi alert that notifies from any apartment in Finland
const example1 = fs.readFileSync(path.join(__dirname, 'example1.html'), { encoding: 'utf8' });

it('should parse apartments from example1 email', () => {
  const apts = parseApartmentsFromEmail(example1);
  assert.deepStrictEqual(apts.length, 3, 'expected to find correct amount of apartments');
  const expected: Apartment[] = [
    {
      id: '/kohde/p43669',
      url: 'https://www.etuovi.com/kohde/p43669',
      address: 'Leikkikuja 4 as 3, 14700, Kirkonkylä, Hämeenlinna, Suomi',
      addressComponents: {
        street: 'Leikkikuja 4 as 3',
        postalCode: '14700',
        city: 'Hämeenlinna',
        country: 'Suomi',
      },
    },
    {
      id: '/kohde/p32942',
      url: 'https://www.etuovi.com/kohde/p32942',
      address: 'Repolankatu 29, 81700, Brahea, Lieksa, Suomi',
      addressComponents: {
        street: 'Repolankatu 29',
        postalCode: '81700',
        city: 'Lieksa',
        country: 'Suomi',
      },
    },
    {
      id: '/kohde/20061173',
      url: 'https://www.etuovi.com/kohde/20061173',
      address: 'Höyrymyllyntie 6 A 3, 90520, Toppilansalmi, Oulu, Suomi',
      addressComponents: {
        street: 'Höyrymyllyntie 6 A 3',
        postalCode: '90520',
        city: 'Oulu',
        country: 'Suomi',
      },
    },
  ];

  assert.deepStrictEqual(apts, expected);
});

