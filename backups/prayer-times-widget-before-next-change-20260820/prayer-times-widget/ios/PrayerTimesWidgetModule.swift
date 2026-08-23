import ExpoModulesCore
import WidgetKit

private let prayerWidgetGroupIdentifier = "group.com.oummah.app"
private let prayerWidgetPayloadKey = "oummah.prayer-times-widget.payload.v1"
private let prayerWidgetKind = "PrayerTimesWidget"

public final class PrayerTimesWidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PrayerTimesWidget")

    AsyncFunction("publish") { (payload: String) in
      guard let defaults = UserDefaults(suiteName: prayerWidgetGroupIdentifier) else {
        throw Exception(name: "PrayerTimesWidgetStorageError", description: "The OUMMAH widget App Group is unavailable.")
      }

      defaults.set(payload, forKey: prayerWidgetPayloadKey)
      DispatchQueue.main.async {
        WidgetCenter.shared.reloadTimelines(ofKind: prayerWidgetKind)
      }
    }
  }
}
