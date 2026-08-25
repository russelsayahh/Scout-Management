import type { Gender, Patrol, ScoutDetails, ScoutStatus } from "@/lib/scouts/types";

/**
 * Sample register for a Scout troop, used to seed `.data/scouts.json` on first
 * run. Deterministic, so every checkout starts from the same 42 records.
 *
 * Columns: first, last, date of birth, gender, patrol, status, guardian,
 * medical notes.
 */
type Row = [string, string, string, Gender, Patrol, ScoutStatus, string, string];

const ROWS: Row[] = [
  ["Amara", "Osei", "2012-03-14", "female", "Kestrel", "active", "Grace Osei", "Mild asthma - inhaler in day bag."],
  ["Ben", "Carter", "2012-07-02", "male", "Falcon", "active", "Rachel Carter", ""],
  ["Ines", "Moreau", "2013-01-27", "female", "Otter", "active", "Luc Moreau", "Nut allergy - carries an EpiPen."],
  ["Jonah", "Whitfield", "2011-11-09", "male", "Kestrel", "active", "Rowan Whitfield", ""],
  ["Priya", "Shah", "2012-09-18", "female", "Kingfisher", "active", "Anita Shah", ""],
  ["Marcus", "Bello", "2013-05-30", "male", "Badger", "active", "Aisha Bello", "Wears glasses for close work."],
  ["Freya", "Lindqvist", "2012-02-11", "female", "Heron", "active", "Marta Lindqvist", ""],
  ["Oliver", "Nowak", "2011-08-23", "male", "Peregrine", "active", "Tomasz Nowak", ""],
  ["Zara", "Ahmed", "2013-04-05", "female", "Osprey", "active", "Nadia Ahmed", ""],
  ["Callum", "Reid", "2012-12-19", "male", "Kestrel", "active", "Fiona Reid", "Lactose intolerant."],
  ["Nadia", "Haddad", "2013-08-08", "female", "Falcon", "active", "Samir Haddad", ""],
  ["Theo", "Bennett", "2012-06-25", "male", "Otter", "active", "Claire Bennett", ""],
  ["Maya", "Fernandes", "2013-02-16", "female", "Kingfisher", "active", "Rosa Fernandes", ""],
  ["Harry", "Dunn", "2011-10-30", "male", "Badger", "active", "Peter Dunn", "Epilepsy - see care plan on file."],
  ["Leila", "Karim", "2012-05-12", "female", "Heron", "active", "Yusuf Karim", ""],
  ["Ewan", "MacLeod", "2013-07-21", "male", "Peregrine", "active", "Isla MacLeod", ""],
  ["Sofia", "Rossi", "2012-04-03", "female", "Osprey", "active", "Elena Rossi", ""],
  ["Daniel", "Okonkwo", "2011-09-15", "male", "Kestrel", "active", "Chidi Okonkwo", ""],
  ["Ruby", "Hughes", "2013-11-02", "female", "Falcon", "active", "Sian Hughes", ""],
  ["Arjun", "Patel", "2012-08-29", "male", "Otter", "active", "Meera Patel", "Vegetarian - no gelatine."],
  ["Elsie", "Baker", "2013-03-07", "female", "Kingfisher", "active", "Tom Baker", ""],
  ["Kai", "Yamamoto", "2012-01-20", "male", "Badger", "active", "Yuki Yamamoto", ""],
  ["Grace", "Mbeki", "2013-06-11", "female", "Heron", "active", "Thandi Mbeki", ""],
  ["Louis", "Girard", "2011-12-04", "male", "Peregrine", "active", "Camille Girard", ""],
  ["Hannah", "Kowalski", "2012-10-17", "female", "Osprey", "active", "Piotr Kowalski", "Hay fever in summer."],
  ["Sam", "Doyle", "2013-09-26", "male", "Kestrel", "active", "Niamh Doyle", ""],
  ["Aria", "Novak", "2012-11-13", "female", "Falcon", "active", "Jana Novak", ""],
  ["Felix", "Andersen", "2013-05-08", "male", "Otter", "active", "Lars Andersen", ""],
  ["Tilly", "Warren", "2012-07-31", "female", "Kingfisher", "active", "Dawn Warren", ""],
  ["Omar", "Farouk", "2011-10-06", "male", "Badger", "active", "Layla Farouk", ""],
  ["Bea", "Sinclair", "2013-12-22", "female", "Heron", "active", "Alan Sinclair", ""],
  ["Noah", "Adeyemi", "2012-03-28", "male", "Peregrine", "active", "Funke Adeyemi", "Sickle cell trait - noted for expeditions."],
  ["Clara", "Petrov", "2013-08-14", "female", "Osprey", "active", "Irina Petrov", ""],
  ["Reuben", "Clarke", "2012-06-09", "male", "Kestrel", "inactive", "Helen Clarke", ""],
  ["Alice", "Thornton", "2013-04-24", "female", "Falcon", "inactive", "Mark Thornton", ""],
  ["Idris", "Rahman", "2012-09-01", "male", "Otter", "inactive", "Sana Rahman", ""],
  ["Rosa", "Delgado", "2014-02-18", "female", "Unassigned", "waiting-list", "Pilar Delgado", ""],
  ["Jack", "Fletcher", "2014-05-27", "male", "Unassigned", "waiting-list", "Emma Fletcher", ""],
  ["Nia", "Roberts", "2014-01-10", "female", "Unassigned", "waiting-list", "Gareth Roberts", "Mild eczema."],
  ["Toby", "Wallace", "2011-07-19", "male", "Peregrine", "active", "Julie Wallace", ""],
  ["Sana", "Iqbal", "2012-02-26", "female", "Osprey", "active", "Bilal Iqbal", ""],
  ["Milo", "Hart", "2013-10-15", "male", "Badger", "active", "Kate Hart", ""],
];

/** Indices archived, with the reason recorded at the time. */
const ARCHIVED: Record<number, string> = {
  33: "Moved out of the district in July 2026.",
  35: "Aged up to Explorers.",
  38: "Family withdrew from the waiting list.",
};

const STREETS = [
  "Mill Lane",
  "Beacon Road",
  "Riverside Way",
  "Oak Close",
  "Chapel Street",
  "Elm Grove",
  "Fairview Terrace",
  "Kingfisher Drive",
];

const TOWN = "Riverside, RV2 4QH";

/** Older scouts tend to have their own phone; the youngest do not. */
function ownPhone(index: number, dateOfBirth: string): string {
  const year = Number.parseInt(dateOfBirth.slice(0, 4), 10);
  if (year > 2012) return "";
  return `+44 7911 ${String(123000 + index * 7).slice(0, 6)}`;
}

function email(first: string, last: string, index: number): string {
  if (index % 4 === 0) return "";
  return `${first}.${last}@riverside-scouts.example`.toLowerCase();
}

/** Joined between 2021 and 2025, spread deterministically across the roll. */
function joinDate(index: number): string {
  const year = 2021 + (index % 5);
  const month = ((index * 3) % 12) + 1;
  const day = ((index * 5) % 27) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface SeedScout extends ScoutDetails {
  archived: boolean;
  archiveReason: string;
}

export function buildSeedScouts(): SeedScout[] {
  return ROWS.map((row, index) => {
    const [firstName, lastName, dateOfBirth, gender, patrol, status, guardian, medicalNotes] = row;
    const archiveReason = ARCHIVED[index] ?? "";

    return {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      avatar: null,
      phone: ownPhone(index, dateOfBirth),
      email: email(firstName, lastName, index),
      address: `${(index % 60) + 1} ${STREETS[index % STREETS.length]}, ${TOWN}`,
      emergencyContactName: guardian,
      emergencyContactPhone: `+44 7700 ${String(900200 + index * 13).slice(0, 6)}`,
      medicalNotes,
      joinDate: joinDate(index),
      patrol,
      status,
      archived: archiveReason !== "",
      archiveReason,
    };
  });
}
