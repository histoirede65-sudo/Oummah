import { Redirect } from "expo-router";

/** Old route: the Hajj is now read as a book. */
export default function Hajj() {
  return <Redirect href="/pilgrimage/book?rite=hajj" />;
}
