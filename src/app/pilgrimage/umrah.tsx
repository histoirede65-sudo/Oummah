import { Redirect } from "expo-router";

/** Old route: the ‘Umra is now read as a book. */
export default function Umrah() {
  return <Redirect href="/pilgrimage/book?rite=umrah" />;
}
