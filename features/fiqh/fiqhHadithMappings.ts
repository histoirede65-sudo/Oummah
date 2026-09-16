export type FiqhHadithMappingStatus = "unverified" | "verified" | "not_found";

export type FiqhHadithMapping = {
  sourceId: string;
  collection: string;
  hadithNumber: string;
  canonicalReference?: string | null;
  provider?: "HadeethEnc" | null;
  sourceHadithId: string | null;
  hadithId: string | null;
  status: FiqhHadithMappingStatus | "identity_verified";
};

const entries = [
  ["abudawud-1573", "Sunan Abi Dawud", "1573"],
  ["abudawud-1949", "Sunan Abi Dawud", "1949"],
  ["bukhari-1117", "Sahih al-Bukhari", "1117"],
  ["bukhari-1224", "Sahih al-Bukhari", "1224"],
  ["bukhari-1334", "Sahih al-Bukhari", "1334"],
  ["bukhari-1405", "Sahih al-Bukhari", "1405"],
  ["bukhari-1454", "Sahih al-Bukhari", "1454"],
  ["bukhari-1483", "Sahih al-Bukhari", "1483"],
  ["bukhari-1499", "Sahih al-Bukhari", "1499"],
  ["bukhari-1503", "Sahih al-Bukhari", "1503"],
  ["bukhari-1504", "Sahih al-Bukhari", "1504"],
  ["bukhari-1528", "Sahih al-Bukhari", "1528"],
  ["bukhari-1549", "Sahih al-Bukhari", "1549"],
  ["bukhari-159", "Sahih al-Bukhari", "159"],
  ["bukhari-1652", "Sahih al-Bukhari", "1652"],
  ["bukhari-1727", "Sahih al-Bukhari", "1727"],
  ["bukhari-1728", "Sahih al-Bukhari", "1728"],
  ["bukhari-1730", "Sahih al-Bukhari", "1730"],
  ["bukhari-1731", "Sahih al-Bukhari", "1731"],
  ["bukhari-1748", "Sahih al-Bukhari", "1748"],
  ["bukhari-1900", "Sahih al-Bukhari", "1900"],
  ["bukhari-1906", "Sahih al-Bukhari", "1906"],
  ["bukhari-1907", "Sahih al-Bukhari", "1907"],
  ["bukhari-1923", "Sahih al-Bukhari", "1923"],
  ["bukhari-1935", "Sahih al-Bukhari", "1935"],
  ["bukhari-1937", "Sahih al-Bukhari", "1937"],
  ["bukhari-1957", "Sahih al-Bukhari", "1957"],
  ["bukhari-1958", "Sahih al-Bukhari", "1958"],
  ["bukhari-1990", "Sahih al-Bukhari", "1990"],
  ["bukhari-2002", "Sahih al-Bukhari", "2002"],
  ["bukhari-2017", "Sahih al-Bukhari", "2017"],
  ["bukhari-2020", "Sahih al-Bukhari", "2020"],
  ["bukhari-206", "Sahih al-Bukhari", "206"],
  ["bukhari-248", "Sahih al-Bukhari", "248"],
  ["bukhari-631", "Sahih al-Bukhari", "631"],
  ["bukhari-756", "Sahih al-Bukhari", "756"],
  ["bukhari-757", "Sahih al-Bukhari", "757"],
  ["bukhari-831", "Sahih al-Bukhari", "831"],
  ["bukhari-908", "Sahih al-Bukhari", "908"],
  ["muslim-1112a", "Sahih Muslim", "1112a"],
  ["muslim-1113e", "Sahih Muslim", "1113e"],
  ["muslim-1141a", "Sahih Muslim", "1141a"],
  ["muslim-1155", "Sahih Muslim", "1155"],
  ["muslim-1162a", "Sahih Muslim", "1162a"],
  ["muslim-1164c", "Sahih Muslim", "1164c"],
  ["muslim-1211ab", "Sahih Muslim", "1211ab"],
  ["muslim-1211ae", "Sahih Muslim", "1211ae"],
  ["muslim-1213c", "Sahih Muslim", "1213c"],
  ["muslim-1216a", "Sahih Muslim", "1216a"],
  ["muslim-1218", "Sahih Muslim", "1218"],
  ["muslim-1218a", "Sahih Muslim", "1218a"],
  ["muslim-1218c", "Sahih Muslim", "1218c"],
  ["muslim-1226g", "Sahih Muslim", "1226g"],
  ["muslim-1334", "Sahih Muslim", "1334"],
  ["muslim-1336c", "Sahih Muslim", "1336c"],
  ["muslim-1337", "Sahih Muslim", "1337"],
  ["muslim-226", "Sahih Muslim", "226"],
  ["muslim-276a", "Sahih Muslim", "276a"],
  ["muslim-293", "Sahih Muslim", "293a"],
  ["muslim-335c", "Sahih Muslim", "335c"],
  ["muslim-361", "Sahih Muslim", "361"],
  ["muslim-570b", "Sahih Muslim", "570b"],
  ["muslim-571a", "Sahih Muslim", "571a"],
  ["muslim-572a", "Sahih Muslim", "572a"],
  ["muslim-582", "Sahih Muslim", "582"],
  ["muslim-613b", "Sahih Muslim", "613b"],
  ["muslim-687a", "Sahih Muslim", "687a"],
  ["muslim-705c", "Sahih Muslim", "705c"],
  ["muslim-875g", "Sahih Muslim", "875g"],
  ["muslim-981", "Sahih Muslim", "981"],
  ["muslim-984e", "Sahih Muslim", "984e"],
] as const;

export const FIQH_HADITH_MAPPINGS: readonly FiqhHadithMapping[] = entries.map(
  ([sourceId, collection, hadithNumber]) => ({
    sourceId,
    collection,
    hadithNumber,
    sourceHadithId: null,
    hadithId: null,
    status: "unverified" as const,
  }),
);

const muslim226Mapping: FiqhHadithMapping = {
  sourceId: "muslim-226",
  collection: "Sahih Muslim",
  hadithNumber: "226",
  canonicalReference: "226a",
  provider: "HadeethEnc",
  sourceHadithId: "6264",
  hadithId: "73d4e152-e261-4078-a99e-5f54d0ef3359",
  status: "verified",
};

export const FIQH_HADITH_MAPPINGS_WITH_VERIFIED_IDENTITIES = [
  ...FIQH_HADITH_MAPPINGS.filter((mapping) => mapping.sourceId !== "muslim-226"),
  muslim226Mapping,
] as const;

export const fiqhHadithMappingBySourceId = new Map(
  FIQH_HADITH_MAPPINGS_WITH_VERIFIED_IDENTITIES.map((mapping) => [mapping.sourceId, mapping]),
);
