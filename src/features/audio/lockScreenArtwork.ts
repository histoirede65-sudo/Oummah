import { Asset } from "expo-asset";

const oummahLockScreenArtwork = Asset.fromModule(
  require("./assets/oummah-lockscreen.png"),
);

/** Bundled square artwork used by the native iOS/Android media player. */
export function getOummahLockScreenArtworkUri() {
  return oummahLockScreenArtwork.localUri ?? oummahLockScreenArtwork.uri;
}
