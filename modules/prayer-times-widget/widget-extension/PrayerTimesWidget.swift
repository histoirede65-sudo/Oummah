import SwiftUI
import WidgetKit

private let widgetKind = "PrayerTimesWidget"
private let widgetGroupIdentifier = "group.com.oummah.app"
private let widgetPayloadKey = "oummah.prayer-times-widget.payload.v1"

private func safeCountdownInterval(to timestamp: Double) -> ClosedRange<Date> {
  let now = Date()
  let end = Date(timeIntervalSince1970: timestamp / 1_000)
  return min(now, end)...end
}

private struct WidgetBackground: ViewModifier {
  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(for: .widget) { Color.clear }
    } else {
      content
    }
  }
}

private struct Prayer: Codable, Identifiable {
  let key: String
  let label: String
  let time: String
  let timestamp: Double
  var id: String { key }
}

private struct PrayerDay: Codable {
  let dateKey: String
  let startTimestamp: Double
  let frenchDate: String
  let hijriDate: String
  let prayers: [Prayer]
  let sunrise: Prayer
}

private struct PrayerSchedule: Codable {
  let today: PrayerDay
  let tomorrow: PrayerDay
}

private struct PrayerProgressState {
  let previousPrayer: Prayer?
  let nextPrayer: Prayer?
  let previousTimestamp: Double
  let nextTimestamp: Double
  let progress: Double

  static let empty = PrayerProgressState(
    previousPrayer: nil,
    nextPrayer: nil,
    previousTimestamp: 0,
    nextTimestamp: 0,
    progress: 0
  )
}

private struct PrayerWidgetEntry: TimelineEntry {
  let date: Date
  let schedule: PrayerSchedule?
  let displayedDay: PrayerDay?
  let nextPrayerKey: String?
  let progressState: PrayerProgressState
}

private struct PrayerWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerWidgetEntry {
    PrayerWidgetEntry(date: .now, schedule: nil, displayedDay: nil, nextPrayerKey: nil, progressState: .empty)
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerWidgetEntry) -> Void) {
    completion(entry(for: .now, schedule: loadSchedule()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerWidgetEntry>) -> Void) {
    let isHomeScreen = context.family == .systemMedium || context.family == .systemLarge
    guard let schedule = loadSchedule() else {
      let retryDelay: TimeInterval = isHomeScreen ? 5 * 60 : 60 * 60
      completion(Timeline(entries: [entry(for: .now, schedule: nil)], policy: .after(.now.addingTimeInterval(retryDelay))))
      return
    }

    let now = Date()
    let endTimestamp = (schedule.tomorrow.prayers.map(\.timestamp) + [schedule.tomorrow.sunrise.timestamp]).max() ?? schedule.tomorrow.startTimestamp
    let fiveMinutes: TimeInterval = 5 * 60
    let firstSlot = ceil(now.timeIntervalSince1970 / fiveMinutes) * fiveMinutes
    var timestamps = Set<Int64>()
    timestamps.insert(Int64((now.timeIntervalSince1970 * 1_000).rounded()))

    // Bound the expensive Home Screen render batch. Keep all prayer transitions
    // below so the schedule still advances if iOS delays the next reload.
    let progressEndTimestamp = isHomeScreen
      ? min(endTimestamp, now.addingTimeInterval(2 * 60 * 60).timeIntervalSince1970 * 1_000)
      : endTimestamp
    var slot = firstSlot
    while slot * 1_000 <= progressEndTimestamp {
      timestamps.insert(Int64((slot * 1_000).rounded()))
      slot += fiveMinutes
    }

    let transitions = [
      schedule.today.startTimestamp,
      schedule.today.sunrise.timestamp,
      schedule.tomorrow.startTimestamp,
      schedule.tomorrow.sunrise.timestamp,
    ] + schedule.today.prayers.map(\.timestamp) + schedule.tomorrow.prayers.map(\.timestamp)
    transitions.forEach { timestamp in
      if timestamp >= now.timeIntervalSince1970 * 1_000 && timestamp <= endTimestamp {
        timestamps.insert(Int64(timestamp.rounded()))
      }
    }

    let dates = timestamps.sorted().map { Date(timeIntervalSince1970: Double($0) / 1_000) }
    let entries = dates.map { entry(for: $0, schedule: schedule) }
    if isHomeScreen {
      completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(60 * 60))))
    } else {
      completion(Timeline(entries: entries, policy: .atEnd))
    }
  }

  private func loadSchedule() -> PrayerSchedule? {
    guard let payload = UserDefaults(suiteName: widgetGroupIdentifier)?.string(forKey: widgetPayloadKey),
          let data = payload.data(using: .utf8) else {
      return nil
    }
    return try? JSONDecoder().decode(PrayerSchedule.self, from: data)
  }

  private func entry(for currentDate: Date, schedule: PrayerSchedule?) -> PrayerWidgetEntry {
    guard let schedule else {
      return PrayerWidgetEntry(date: currentDate, schedule: nil, displayedDay: nil, nextPrayerKey: nil, progressState: .empty)
    }
    let isToday = currentDate < date(schedule.tomorrow.startTimestamp)
    let day = isToday ? schedule.today : schedule.tomorrow
    let active = activePrayerKey(for: day, at: currentDate)
    let progressState = progressState(for: currentDate, schedule: schedule)
    return PrayerWidgetEntry(date: currentDate, schedule: schedule, displayedDay: day, nextPrayerKey: active, progressState: progressState)
  }

  private func progressState(for currentDate: Date, schedule: PrayerSchedule) -> PrayerProgressState {
    // Include the complete cached schedule, including tomorrow after Fajr.
    let events = [schedule.today, schedule.tomorrow].flatMap { day in
      (day.prayers + [day.sunrise]).map {
        PrayerEvent(prayer: $0, timestamp: $0.timestamp)
      }
    }
    let ordered = events.sorted { $0.timestamp < $1.timestamp }
    let now = currentDate.timeIntervalSince1970 * 1_000
    guard let nextIndex = ordered.firstIndex(where: { $0.timestamp > now }) else {
      let last = ordered[ordered.count - 1]
      return PrayerProgressState(previousPrayer: last.prayer, nextPrayer: nil, previousTimestamp: last.timestamp, nextTimestamp: last.timestamp, progress: 1)
    }
    let previous = ordered[max(0, nextIndex - 1)]
    let next = ordered[nextIndex]
    let duration = max(1, next.timestamp - previous.timestamp)
    let progress = min(1, max(0, (now - previous.timestamp) / duration))
    return PrayerProgressState(previousPrayer: previous.prayer, nextPrayer: next.prayer, previousTimestamp: previous.timestamp, nextTimestamp: next.timestamp, progress: progress)
  }

  private func activePrayerKey(for day: PrayerDay, at currentDate: Date) -> String? {
    let currentTimestamp = currentDate.timeIntervalSince1970 * 1_000
    guard let fajr = day.prayers.first(where: { $0.key == "Fajr" }),
          let dhuhr = day.prayers.first(where: { $0.key == "Dhuhr" }),
          let asr = day.prayers.first(where: { $0.key == "Asr" }),
          let maghrib = day.prayers.first(where: { $0.key == "Maghrib" }),
          let isha = day.prayers.first(where: { $0.key == "Isha" }) else {
      return nil
    }

    if currentTimestamp >= isha.timestamp { return isha.key }
    if currentTimestamp >= maghrib.timestamp { return maghrib.key }
    if currentTimestamp >= asr.timestamp { return asr.key }
    if currentTimestamp >= dhuhr.timestamp { return dhuhr.key }
    if currentTimestamp >= fajr.timestamp && currentTimestamp < day.sunrise.timestamp { return fajr.key }
    return nil
  }

  private func date(_ milliseconds: Double) -> Date {
    Date(timeIntervalSince1970: milliseconds / 1_000)
  }
}

private struct PrayerEvent {
  let prayer: Prayer
  let timestamp: Double
}

private struct PrayerTimesWidgetView: View {
  let entry: PrayerWidgetEntry

  @Environment(\.widgetFamily) private var widgetFamily

  @ViewBuilder
  var body: some View {
    if #available(iOS 16.0, *) {
      switch widgetFamily {
      case .accessoryRectangular, .accessoryCircular, .accessoryInline:
        LockScreenPrayerView(entry: entry)
          .widgetURL(URL(string: "oummah:///"))
      default:
        HomeScreenPrayerView(entry: entry)
          .widgetURL(URL(string: "oummah:///"))
      }
    } else {
      HomeScreenPrayerView(entry: entry)
        .widgetURL(URL(string: "oummah:///"))
    }
  }
}

// The Home Screen widget is intentionally kept unchanged.
private struct HomeScreenPrayerView: View {
  let entry: PrayerWidgetEntry

  var body: some View {
    GeometryReader { proxy in
      ZStack {
        Image("home-mosque-sunset")
          .resizable()
          .scaledToFill()
          .frame(width: proxy.size.width, height: proxy.size.height)
          .clipped()
          .ignoresSafeArea()

        Color.black
          .opacity(0.68)
          .ignoresSafeArea()

        if let day = entry.displayedDay {
          PrayerContent(day: day, nextPrayerKey: entry.nextPrayerKey, progressState: entry.progressState, size: proxy.size)
        } else {
          VStack(spacing: 8) {
            Image(systemName: "calendar.badge.clock")
              .font(.system(size: 28, weight: .light))
              .foregroundStyle(Color.oummahGold)
            Text("Ouvrez OUMMAH pour synchroniser les horaires")
              .font(.system(size: 14, weight: .semibold, design: .serif))
              .multilineTextAlignment(.center)
              .foregroundStyle(.white)
          }
          .padding()
        }
      }
    }
  }
}

@available(iOS 16.0, *)
private struct LockScreenPrayerView: View {
  let entry: PrayerWidgetEntry

  @Environment(\.widgetFamily) private var widgetFamily

  var nextPrayer: Prayer? { entry.progressState.nextPrayer }

  var prayerName: String {
    guard let prayer = nextPrayer else { return "OUMMAH" }
    return prayer.key == "Sunrise" ? "Chourouk" : prayer.label
  }

  @ViewBuilder
  var body: some View {
    switch widgetFamily {
    case .accessoryRectangular:
      HStack(spacing: 8) {
        Image(systemName: "moon.stars.fill")
          .font(.system(size: 20, weight: .semibold))
          .widgetAccentable()

        VStack(alignment: .leading, spacing: 1) {
          Text("PROCHAINE PRIÈRE")
            .font(.system(size: 10, weight: .semibold, design: .rounded))
          HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text(prayerName.uppercased())
              .font(.system(size: 15, weight: .bold, design: .rounded))
            Text(nextPrayer?.time ?? "—")
              .font(.system(size: 13, weight: .semibold, design: .rounded))
          }
        }
        .lineLimit(1)
        .minimumScaleFactor(0.72)
        Spacer(minLength: 0)
      }

    case .accessoryCircular:
      VStack(spacing: 0) {
        Image(systemName: "moon.stars.fill")
          .font(.system(size: 13, weight: .semibold))
          .widgetAccentable()
        Text(prayerName.uppercased())
          .font(.system(size: 10, weight: .bold, design: .rounded))
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        Text(nextPrayer?.time ?? "—")
          .font(.system(size: 11, weight: .bold, design: .rounded))
      }

    case .accessoryInline:
      if let prayer = nextPrayer {
        Label("\(prayerName) · \(prayer.time)", systemImage: "moon.stars.fill")
      } else {
        Label("OUMMAH · Ouvrez l’app", systemImage: "moon.stars.fill")
      }

    default:
      EmptyView()
    }
  }


}

private struct PrayerContent: View {
  let day: PrayerDay
  let nextPrayerKey: String?
  let progressState: PrayerProgressState
  let size: CGSize
  
  @Environment(\.widgetFamily) var widgetFamily

  private var byKey: [String: Prayer] {
    Dictionary(uniqueKeysWithValues: day.prayers.map { ($0.key, $0) })
  }

  var body: some View {
    switch widgetFamily {
    case .systemMedium:
      HorizontalPrayerLayout(
        day: day,
        nextPrayerKey: nextPrayerKey,
        progressState: progressState,
        byKey: byKey,
        size: size
      )
    case .systemLarge:
      VerticalPrayerLayout(
        day: day,
        nextPrayerKey: nextPrayerKey,
        progressState: progressState,
        byKey: byKey,
        size: size
      )
    @unknown default:
      VerticalPrayerLayout(
        day: day,
        nextPrayerKey: nextPrayerKey,
        progressState: progressState,
        byKey: byKey,
        size: size
      )
    }
  }
}

// Presentation-only layouts. The provider and all schedule calculations remain unchanged.
private struct VerticalPrayerLayout: View {
  let day: PrayerDay
  let nextPrayerKey: String?
  let progressState: PrayerProgressState
  let byKey: [String: Prayer]
  let size: CGSize

  var body: some View {
    GeometryReader { proxy in
      let w = proxy.size.width
      let items = prayerItems

      PremiumPrayerLayout(
        day: day,
        currentPrayer: day.prayers.first(where: { $0.key == nextPrayerKey }),
        progressState: progressState,
        items: items,
        columns: 3,
        compact: false,
        width: w
      )
      .frame(width: w, height: proxy.size.height)
      .padding(.horizontal, 16)
      .padding(.vertical, 14)
      .background(Color.oummahSurface.opacity(0.82))
    }
  }

  private var prayerItems: [PrayerCellData] {
    [
      PrayerCellData(id: "Fajr", label: "Fajr", prayer: byKey["Fajr"], symbol: "cloud.sun.fill"),
      PrayerCellData(id: "Sunrise", label: "Chourouk", prayer: day.sunrise, symbol: "sunrise.fill"),
      PrayerCellData(id: "Dhuhr", label: "Dhohr", prayer: byKey["Dhuhr"], symbol: "sun.max.fill"),
      PrayerCellData(id: "Asr", label: "Asr", prayer: byKey["Asr"], symbol: "sun.max.fill"),
      PrayerCellData(id: "Maghrib", label: "Maghrib", prayer: byKey["Maghrib"], symbol: "cloud.sun.fill"),
      PrayerCellData(id: "Isha", label: "Isha", prayer: byKey["Isha"], symbol: "moon.stars.fill"),
    ]
  }
}

// Medium widget layout — same hierarchy, with a denser six-column schedule row.
private struct HorizontalPrayerLayout: View {
  let day: PrayerDay
  let nextPrayerKey: String?
  let progressState: PrayerProgressState
  let byKey: [String: Prayer]
  let size: CGSize

  var body: some View {
    GeometryReader { proxy in
      MediumPremiumLayout(
        day: day,
        currentPrayer: day.prayers.first(where: { $0.key == nextPrayerKey }),
        progressState: progressState,
        items: prayerItems
      )
      .padding(.horizontal, 8)
      .padding(.vertical, 5)
      .frame(width: proxy.size.width, height: proxy.size.height)
      .background(Color.oummahSurface.opacity(0.82))
    }
  }

  private var prayerItems: [PrayerCellData] {
    [
      PrayerCellData(id: "Fajr", label: "Fajr", prayer: byKey["Fajr"], symbol: "cloud.sun.fill"),
      PrayerCellData(id: "Dhuhr", label: "Dhohr", prayer: byKey["Dhuhr"], symbol: "sun.max.fill"),
      PrayerCellData(id: "Asr", label: "Asr", prayer: byKey["Asr"], symbol: "sun.max.fill"),
      PrayerCellData(id: "Maghrib", label: "Maghrib", prayer: byKey["Maghrib"], symbol: "cloud.sun.fill"),
      PrayerCellData(id: "Isha", label: "Isha", prayer: byKey["Isha"], symbol: "moon.stars.fill"),
    ]
  }
}

private struct MediumPremiumLayout: View {
  let day: PrayerDay
  let currentPrayer: Prayer?
  let progressState: PrayerProgressState
  let items: [PrayerCellData]

  private var previousLabel: String {
    prayerLabel(progressState.previousPrayer)
  }

  private var nextLabel: String {
    prayerLabel(progressState.nextPrayer)
  }

  var body: some View {
    VStack(spacing: 0) {
      HStack(spacing: 5) {
        Image(systemName: "moon.fill")
          .font(.system(size: 12, weight: .light))
          .foregroundStyle(Color.oummahGold)
        Text(day.hijriDate)
          .font(.system(size: 9, weight: .medium, design: .serif))
          .foregroundStyle(Color.oummahTextSecondary)
          .lineLimit(1)
          .minimumScaleFactor(0.52)
          .layoutPriority(1)
        Spacer(minLength: 3)
        Text("OUMMAH")
          .font(.system(size: 9, weight: .semibold, design: .serif))
          .foregroundStyle(Color.oummahGold)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }
      .padding(.horizontal, 5)
      .frame(height: 11)

      VStack(spacing: 0) {
        Text("Prochaine prière")
          .font(.system(size: 9, weight: .medium, design: .rounded))
          .foregroundStyle(Color.oummahTextSecondary)
        HStack(alignment: .firstTextBaseline, spacing: 5) {
          Text(nextPrayerLabel.uppercased())
          Text("·")
          Text(progressState.nextPrayer?.time ?? "—")
        }
          .font(.system(size: 17, weight: .semibold, design: .serif))
        .foregroundStyle(Color.oummahGold)
        .lineLimit(1)
        .minimumScaleFactor(0.65)
        .frame(maxWidth: .infinity, alignment: .center)
        Text("dans")
          .font(.system(size: 9, weight: .medium, design: .rounded))
          .foregroundStyle(Color.oummahTextSecondary)
          .frame(maxWidth: .infinity, alignment: .center)
        CenteredCountdown(timestamp: progressState.nextPrayer?.timestamp)
      }
      .frame(height: 62)
      .frame(maxWidth: .infinity, alignment: .center)

      HStack(spacing: 5) {
        Text("\(previousLabel.uppercased())  \(progressState.previousPrayer?.time ?? "—")")
          .lineLimit(1)
          .minimumScaleFactor(0.58)
          .frame(width: 90, alignment: .leading)
        MediumProgressBar(progress: progressState.progress)
          .frame(maxWidth: .infinity)
        Text("\(nextLabel.uppercased())  \(progressState.nextPrayer?.time ?? "—")")
          .lineLimit(1)
          .minimumScaleFactor(0.58)
          .frame(width: 90, alignment: .trailing)
      }
      .font(.system(size: 10, weight: .medium, design: .rounded))
      .foregroundStyle(Color.oummahTextSecondary)
      .padding(.horizontal, 5)
      .frame(height: 11)

      Rectangle()
        .fill(Color.oummahGold.opacity(0.18))
        .frame(height: 1)
        .padding(.top, 2)

      Text("Prière actuelle")
        .font(.system(size: 9.5, weight: .medium, design: .serif))
        .foregroundStyle(Color.oummahTextSecondary)
        .frame(height: 12)
        .padding(.top, 2)

      LazyVGrid(columns: Array(repeating: GridItem(.flexible(minimum: 0), spacing: 4), count: items.count), spacing: 0) {
        ForEach(items) { item in
          MediumPrayerCell(item: item, active: item.id == currentPrayer?.key)
        }
      }
      .frame(height: 52)
      .padding(.horizontal, 2)
      .padding(.bottom, 1)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background {
      MediumGeometryMotif()
    }
  }

  private var nextPrayerLabel: String {
    prayerLabel(progressState.nextPrayer)
  }

  private func prayerLabel(_ prayer: Prayer?) -> String {
    guard let prayer else { return "—" }
    return prayer.key == "Sunrise" ? "Chourouk" : prayer.label
  }
}

private struct CountdownText: View {
  let timestamp: Double?
  let fontSize: CGFloat

  var body: some View {
    Group {
      if let timestamp {
        if #available(iOS 16.0, *) {
          Text(
            timerInterval: safeCountdownInterval(to: timestamp),
            countsDown: true
          )
        } else {
          Text(Date(timeIntervalSince1970: timestamp / 1_000), style: .timer)
        }
      } else {
        Text("—")
      }
    }
    .font(.system(size: fontSize, weight: .semibold, design: .rounded))
    .monospacedDigit()
    .multilineTextAlignment(.center)
    .lineLimit(1)
    .minimumScaleFactor(0.7)
  }
}

private struct CenteredCountdown: View {
  let timestamp: Double?

  var body: some View {
    GeometryReader { proxy in
      CountdownText(timestamp: timestamp, fontSize: 21)
        .foregroundStyle(Color.oummahText)
        .frame(
          width: proxy.size.width,
          height: proxy.size.height,
          alignment: .center
        )
    }
    .frame(maxWidth: .infinity)
    .frame(height: 27)
  }
}

private struct MediumProgressBar: View {
  let progress: Double

  var body: some View {
    GeometryReader { proxy in
      let value = min(1, max(0, progress))
      let x = proxy.size.width * CGFloat(value)
      ZStack(alignment: .leading) {
        Capsule()
          .fill(Color.oummahGold.opacity(0.22))
          .frame(height: 3)
        Capsule()
          .fill(Color.oummahGold)
          .frame(width: max(3, x), height: 3)
        Circle()
          .fill(Color.oummahGold)
          .frame(width: 8, height: 8)
          .offset(x: max(0, x - 4))
      }
    }
    .frame(height: 8)
  }
}

private struct MediumPrayerCell: View {
  let item: PrayerCellData
  let active: Bool

  var body: some View {
    VStack(spacing: 1) {
      Image(systemName: item.symbol)
        .font(.system(size: active ? 20 : 18, weight: active ? .semibold : .medium))
        .foregroundStyle(active ? Color.oummahGold : Color.oummahText)
      Text(item.label.uppercased())
        .font(.system(size: active ? 12 : 11, weight: .medium, design: .rounded))
        .foregroundStyle(active ? Color.oummahGold : Color.oummahText)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
      Text(item.prayer?.time ?? "—")
        .font(.system(size: active ? 17 : 16, weight: .bold, design: .rounded))
        .foregroundStyle(active ? Color.oummahGold : Color.oummahText)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .frame(height: 52)
    .frame(maxWidth: .infinity)
  }
}

private struct MediumGeometryMotif: View {
  var body: some View {
    ZStack {
      Color.clear
      Text("\u{0644}\u{0627} \u{0625}\u{0644}\u{0647} \u{0625}\u{0644}\u{0627} \u{0627}\u{0644}\u{0644}\u{0647}")
        .font(.system(size: 42, weight: .regular, design: .serif))
        .foregroundStyle(Color.oummahGold.opacity(0.045))
        .lineLimit(1)
        .minimumScaleFactor(0.45)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .scaleEffect(1.35)
    }
    .allowsHitTesting(false)
  }
}

private struct SmallIslamicMotif: View {
  var body: some View {
    ZStack {
      ForEach(0..<8, id: \.self) { index in
        Diamond()
          .stroke(Color.oummahGold.opacity(0.075), lineWidth: 0.8)
          .frame(width: 8, height: 13)
          .rotationEffect(.degrees(Double(index) * 45))
      }
      Diamond()
        .stroke(Color.oummahGold.opacity(0.09), lineWidth: 0.8)
        .frame(width: 5, height: 5)
    }
  }
}

private struct Diamond: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    path.move(to: CGPoint(x: rect.midX, y: rect.minY))
    path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
    path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
    path.addLine(to: CGPoint(x: rect.minX, y: rect.midY))
    path.closeSubpath()
    return path
  }
}

private struct PrayerCellData: Identifiable {
  let id: String
  let label: String
  let prayer: Prayer?
  let symbol: String
}

private struct PremiumPrayerLayout: View {
  let day: PrayerDay
  let currentPrayer: Prayer?
  let progressState: PrayerProgressState
  let items: [PrayerCellData]
  let columns: Int
  let compact: Bool
  let width: CGFloat

  var body: some View {
    VStack(spacing: compact ? 3 : 9) {
      HStack(spacing: 5) {
        Image(systemName: "moon.fill")
          .font(.system(size: compact ? 11 : 13, weight: .light))
          .foregroundStyle(Color.oummahGold.opacity(0.9))
          .padding(.leading, compact ? 2 : 0)
        Text("\(day.hijriDate) · \(day.frenchDate)")
          .font(.system(size: compact ? 8.5 : 11, weight: .medium, design: .serif))
          .foregroundStyle(Color.oummahTextSecondary)
          .lineLimit(1)
          .minimumScaleFactor(0.65)
          .padding(.horizontal, compact ? 2 : 0)
        Spacer(minLength: 0)
      }
      .padding(.horizontal, compact ? 1 : 0)

      VStack(spacing: compact ? 0 : 2) {
        Text("PRIÈRE ACTUELLE")
          .font(.system(size: compact ? 7 : 9, weight: .semibold, design: .rounded))
          .tracking(1.1)
          .foregroundStyle(Color.oummahTextSecondary.opacity(0.82))
        Text(currentPrayer?.label.uppercased() ?? "—")
          .font(.system(size: compact ? 15.5 : 23, weight: .semibold, design: .serif))
          .foregroundStyle(Color.oummahText)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Text(currentPrayer?.time ?? "—")
          .font(.system(size: compact ? 23 : 34, weight: .bold, design: .rounded))
          .foregroundStyle(Color.oummahText)
          .lineLimit(1)
      }

      PrayerProgressBar(progress: progressState.progress, compact: compact)
        .padding(.horizontal, compact ? 18 : 0)

      NextPrayerView(progressState: progressState, compact: compact)

      LazyVGrid(columns: Array(repeating: GridItem(.flexible(minimum: 0), spacing: compact ? 2 : 7), count: columns), spacing: compact ? 1 : 7) {
        ForEach(items) { item in
          PrayerSummaryCell(prayer: item.prayer, label: item.label, symbol: item.symbol, active: item.id == currentPrayer?.key, compact: compact)
        }
      }
      .frame(maxWidth: .infinity)
      .padding(.bottom, compact ? 2 : 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}
private struct PrayerSummaryCell: View {
  let prayer: Prayer?
  let label: String
  let symbol: String
  let active: Bool
  let compact: Bool

  var body: some View {
    VStack(spacing: 2) {
      Image(systemName: symbol)
        .font(.system(size: compact ? 9.5 : 11, weight: .medium))
        .foregroundStyle(active ? Color.oummahGold : Color.oummahTextSecondary)
      Text(label.uppercased())
        .font(.system(size: compact ? 7.5 : 8.5, weight: .semibold, design: .rounded))
        .lineLimit(1)
        .minimumScaleFactor(compact ? 0.5 : 0.65)
      Text(prayer?.time ?? "—")
        .font(.system(size: compact ? 10.5 : 11.5, weight: .bold, design: .rounded))
        .foregroundStyle(active ? Color.oummahGold : Color.oummahText)
        .lineLimit(1)
        .minimumScaleFactor(compact ? 0.65 : 0.7)
    }
    .frame(maxWidth: .infinity, minHeight: compact ? 35 : 48, maxHeight: compact ? 35 : .infinity)
    .padding(.vertical, compact ? 1 : 3)
    .background(Color.clear)
    .overlay(alignment: .bottom) {
      if active {
        Capsule()
          .fill(Color.oummahGold)
          .frame(width: 22, height: 2)
      }
    }
  }
}

private struct PrayerProgressBar: View {
  let progress: Double
  let compact: Bool

  var body: some View {
    GeometryReader { proxy in
      let clamped = min(1, max(0, progress))
      let progressWidth = proxy.size.width * CGFloat(clamped)
      ZStack(alignment: .leading) {
        Capsule()
          .fill(Color.oummahGold.opacity(0.18))
          .frame(height: compact ? 1.5 : 2)
        Capsule()
          .fill(Color.oummahGold.opacity(0.82))
          .frame(width: max(4, progressWidth), height: compact ? 1.5 : 2)
        Circle()
          .fill(Color.oummahGold)
          .frame(width: compact ? 6 : 7, height: compact ? 6 : 7)
          .offset(x: max(0, progressWidth - (compact ? 3 : 3.5)))
      }
    }
    .frame(height: compact ? 7 : 8)
  }
}

private struct DayProgressIndicator: View {
  let progressState: PrayerProgressState
  let center: CGPoint
  let radiusX: CGFloat
  let radiusY: CGFloat

  private var position: CGPoint {
    let previousAngle = angle(for: progressState.previousPrayer)
    let nextAngle = angle(for: progressState.nextPrayer)
    let degrees = previousAngle + (nextAngle - previousAngle) * progressState.progress
    let radians = degrees * .pi / 180
    return CGPoint(
      x: center.x + radiusX * CGFloat(cos(radians)),
      y: center.y + radiusY * CGFloat(sin(radians))
    )
  }

  private func angle(for prayer: Prayer?) -> Double {
    switch prayer?.key {
    case "Fajr": return 140
    case "Sunrise": return 220
    case "Dhuhr": return 270
    case "Asr": return 320
    case "Maghrib": return 400
    case "Isha": return 450
    default: return 140
    }
  }

  var body: some View {
    ZStack {
      Circle()
        .fill(Color.oummahGold.opacity(0.32))
        .frame(width: 22, height: 22)
      Circle()
        .fill(Color.oummahGold)
        .frame(width: 8, height: 8)
    }
    .position(position)
  }
}

private struct NextPrayerView: View {
  let progressState: PrayerProgressState
  let compact: Bool

  var body: some View {
    if let nextPrayer = progressState.nextPrayer {
      VStack(spacing: compact ? 1 : 2) {
        Text("Prochaine prière")
          .font(.system(size: compact ? 9.75 : 11.7, weight: .medium, design: .rounded))
          .foregroundStyle(.white.opacity(0.72))
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text(nextPrayer.label.uppercased())
          Text("·")
          Text(nextPrayer.time)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        VStack(spacing: 0) {
          Text("dans")
            .font(.system(size: compact ? 10.5 : 13, weight: .medium, design: .rounded))
          CountdownText(
            timestamp: nextPrayer.timestamp,
            fontSize: compact ? 13.5 : 18.5
          )
          .frame(maxWidth: .infinity)
        }
        .frame(maxWidth: .infinity, alignment: .center)
      }
      .font(.system(size: compact ? 14.95 : 20.8, weight: .semibold, design: .rounded))
      .foregroundStyle(Color.oummahGold)
      .lineLimit(1)
      .minimumScaleFactor(compact ? 0.6 : 0.7)
      .frame(maxWidth: .infinity, alignment: .center)
    }
  }
}

private struct LargePrayerNode: View {
  let prayer: Prayer?
  let label: String
  let symbol: String
  let active: Bool

  @ViewBuilder var body: some View {
    if let prayer {
      VStack(spacing: 1) {
        Text(label)
          .font(.system(size: 19.5, weight: .semibold, design: .serif))
          .foregroundStyle(active ? Color.oummahGold : .white)
          .lineLimit(1)
        ZStack {
          if active {
            Circle().fill(Color.oummahGold.opacity(0.12)).frame(width: 56, height: 56)
            Circle().stroke(Color.oummahGold.opacity(0.30), lineWidth: 1).frame(width: 48, height: 48)
            Circle().stroke(Color.oummahGold.opacity(0.20), lineWidth: 1).frame(width: 42, height: 42)
          }
          Circle()
            .fill(active ? Color.oummahGold : Color.black.opacity(0.78))
            .frame(width: 34, height: 34)
          Circle()
            .stroke(Color.oummahGold, lineWidth: active ? 1.8 : 1.2)
            .frame(width: 34, height: 34)
          Image(systemName: symbol)
            .font(.system(size: 14, weight: .medium))
            .foregroundStyle(active ? Color.black : Color.oummahGold)
        }
        Text(prayer.time)
          .font(.system(size: 20.15, weight: .bold, design: .rounded))
          .foregroundStyle(active ? Color.oummahGold : .white)
          .lineLimit(1)
      }
      .frame(width: 108, height: 88)
    }
  }
}

private struct MediumPrayerNode: View {
  let prayer: Prayer?
  let label: String
  let symbol: String
  let active: Bool

  @ViewBuilder var body: some View {
    if let prayer {
      VStack(spacing: 0) {
        Text(label)
          .font(.system(size: 15.6, weight: .semibold, design: .serif))
          .foregroundStyle(active ? Color.oummahGold : .white)
          .lineLimit(1)
          .minimumScaleFactor(0.75)
        ZStack {
          if active {
            Circle().fill(Color.oummahGold.opacity(0.13)).frame(width: 32, height: 32)
            Circle().stroke(Color.oummahGold.opacity(0.30), lineWidth: 0.8).frame(width: 28, height: 28)
          }
          Circle()
            .fill(active ? Color.oummahGold : Color.black.opacity(0.78))
            .frame(width: 22, height: 22)
          Circle()
            .stroke(Color.oummahGold, lineWidth: active ? 1.3 : 0.9)
            .frame(width: 22, height: 22)
          Image(systemName: symbol)
            .font(.system(size: 9, weight: .medium))
            .foregroundStyle(active ? Color.black : Color.oummahGold)
        }
        Text(prayer.time)
          .font(.system(size: 16.25, weight: .bold, design: .rounded))
          .foregroundStyle(active ? Color.oummahGold : .white)
          .lineLimit(1)
      }
      .frame(width: 76, height: 58)
    }
  }
}

private extension Color {
  static let oummahBackground = Color(red: 0.031, green: 0.027, blue: 0.075)
  static let oummahSurface = Color(red: 0.090, green: 0.063, blue: 0.149)
  static let oummahGold = Color(red: 0.890, green: 0.710, blue: 0.353)
  static let oummahText = Color(red: 0.973, green: 0.957, blue: 0.933)
  static let oummahTextSecondary = Color(red: 0.780, green: 0.745, blue: 0.820)
}

struct PrayerTimesWidget: Widget {
  private var supportedPrayerFamilies: [WidgetFamily] {
    if #available(iOS 16.0, *) {
      return [.systemMedium, .systemLarge, .accessoryRectangular, .accessoryCircular, .accessoryInline]
    }
    return [.systemMedium, .systemLarge]
  }

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: widgetKind, provider: PrayerWidgetProvider()) { entry in
      PrayerTimesWidgetView(entry: entry)
        .modifier(WidgetBackground())
    }
    .configurationDisplayName("Horaires de prière")
    .description("Vos horaires de prière OUMMAH.")
    .supportedFamilies(supportedPrayerFamilies)
    .contentMarginsDisabled()
  }
}

// MARK: - Verset OUMMAH · écran verrouillé

private let verseWidgetKind = "OummahVerseLockScreenWidget"

private struct LockScreenVerse: Identifiable {
  let surah: Int
  let ayah: Int
  let text: String
  var id: String { "\(surah):\(ayah)" }
  var reference: String { "Coran \(surah):\(ayah)" }
}

// Traduction française de Muhammad Hamidullah (Quran.com, ressource 31).
// Les appels de notes ont seuls été retirés : aucun verset n'est raccourci ni paraphrasé.
private let lockScreenVerses: [LockScreenVerse] = [
  LockScreenVerse(surah: 1, ayah: 1, text: "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux."),
  LockScreenVerse(surah: 1, ayah: 2, text: "Louange à Allah, Seigneur de l’Univers."),
  LockScreenVerse(surah: 1, ayah: 6, text: "Guide-nous dans le droit chemin,"),
  LockScreenVerse(surah: 78, ayah: 8, text: "Nous vous avons créés en couples,"),
  LockScreenVerse(surah: 78, ayah: 29, text: "alors que Nous avons dénombré toutes choses en écrit."),
  LockScreenVerse(surah: 89, ayah: 14, text: "Car ton Seigneur demeure aux aguets."),
  LockScreenVerse(surah: 89, ayah: 17, text: "Mais non ! C’est vous plutôt, qui n’êtes pas généreux envers les orphelins ;"),
  LockScreenVerse(surah: 90, ayah: 4, text: "Nous avons, certes, créé l’homme pour une vie de lutte."),
  LockScreenVerse(surah: 93, ayah: 3, text: "Ton Seigneur ne t’a ni abandonné, ni détesté."),
  LockScreenVerse(surah: 93, ayah: 4, text: "La vie dernière t’est, certes, meilleure que la vie présente."),
  LockScreenVerse(surah: 93, ayah: 5, text: "Ton Seigneur t’accordera certes [Ses faveurs], et alors tu seras satisfait."),
  LockScreenVerse(surah: 93, ayah: 9, text: "Quant à l’orphelin, donc, ne le maltraite pas."),
  LockScreenVerse(surah: 93, ayah: 11, text: "Et quant au bienfait de ton Seigneur, proclame-le."),
  LockScreenVerse(surah: 94, ayah: 1, text: "N’avons-Nous pas ouvert pour toi ta poitrine ?"),
  LockScreenVerse(surah: 94, ayah: 4, text: "Et exalté pour toi ta renommée ?"),
  LockScreenVerse(surah: 95, ayah: 4, text: "Nous avons certes créé l’homme dans la forme la plus parfaite."),
  LockScreenVerse(surah: 95, ayah: 8, text: "Allah n’est-Il pas le plus sage des Juges ?"),
  LockScreenVerse(surah: 96, ayah: 1, text: "Lis, au nom de ton Seigneur qui a créé,"),
  LockScreenVerse(surah: 96, ayah: 3, text: "Lis! Ton Seigneur est le Très Noble,"),
  LockScreenVerse(surah: 96, ayah: 14, text: "Ne sait-il pas que vraiment Allah voit ?"),
  LockScreenVerse(surah: 97, ayah: 3, text: "La nuit d’Al-Qadr est meilleure que mille mois."),
  LockScreenVerse(surah: 99, ayah: 7, text: "Quiconque fait un bien fût-ce du poids d’un atome, le verra,"),
  LockScreenVerse(surah: 99, ayah: 8, text: "et quiconque fait un mal fût-ce du poids d’un atome, le verra"),
  LockScreenVerse(surah: 1, ayah: 3, text: "Le Tout Miséricordieux, le Très Miséricordieux,"),
  LockScreenVerse(surah: 1, ayah: 4, text: "Maître du Jour de la Rétribution."),
  LockScreenVerse(surah: 1, ayah: 5, text: "C’est Toi [Seul] que nous adorons, et c’est Toi [Seul] dont nous implorons secours."),
  LockScreenVerse(surah: 2, ayah: 147, text: "La vérité vient de ton Seigneur. Ne sois donc pas de ceux qui doutent."),
  LockScreenVerse(surah: 2, ayah: 152, text: "Souvenez-vous de Moi donc, Je Me souviendrai de vous. Remerciez- Moi et ne soyez pas ingrats envers Moi !"),
  LockScreenVerse(surah: 2, ayah: 192, text: "S’ils cessent, Allah est, certes, Pardonneur et Miséricordieux."),
  LockScreenVerse(surah: 3, ayah: 5, text: "Rien, vraiment, ne se cache d’Allah de ce qui existe sur la terre ou dans le ciel."),
  LockScreenVerse(surah: 3, ayah: 60, text: "La vérité vient de ton Seigneur. Ne sois donc pas du nombre des sceptiques."),
  LockScreenVerse(surah: 3, ayah: 74, text: "Il réserve à qui Il veut Sa miséricorde. Et Allah est Détenteur de la grâce immense."),
  LockScreenVerse(surah: 3, ayah: 115, text: "Et quelque bien qu’ils fassent, il ne leur sera pas dénié. Car Allah connaît bien les pieux."),
  LockScreenVerse(surah: 3, ayah: 132, text: "Et obéissez à Allah et au Messager afin qu’il vous soit fait miséricorde !"),
  LockScreenVerse(surah: 3, ayah: 138, text: "Voilà un exposé pour les gens, un guide, et une exhortation pour les pieux."),
  LockScreenVerse(surah: 3, ayah: 150, text: "Mais c’est Allah votre Maître. Il est meilleur des secoureurs."),
  LockScreenVerse(surah: 3, ayah: 189, text: "A Allah appartient le royaume des cieux et de la terre. Et Allah est Omnipotent."),
  LockScreenVerse(surah: 4, ayah: 28, text: "Allah veut vous alléger (les obligations,) car l’homme a été créé faible."),
  LockScreenVerse(surah: 4, ayah: 45, text: "Allah connaît mieux vos ennemis. Et Allah suffit comme protecteur. Et Allah suffit comme secoureur."),
  LockScreenVerse(surah: 4, ayah: 68, text: "et Nous les aurions guidés certes vers un droit chemin."),
  LockScreenVerse(surah: 4, ayah: 70, text: "Cette grâce vient d’Allah. Et Allah suffit comme Parfait Connaisseur."),
  LockScreenVerse(surah: 4, ayah: 99, text: "À ceux-là, Allah accordera le pardon. Et Allah est Clément et Pardonneur."),
  LockScreenVerse(surah: 4, ayah: 106, text: "Et implore d’Allah le pardon car Allah est certes Pardonneur et Miséricordieux."),
  LockScreenVerse(surah: 13, ayah: 9, text: "Le Connaisseur de ce qui est caché et de ce qui est apparent, Le Grand, Le Sublime."),
  LockScreenVerse(surah: 13, ayah: 29, text: "Ceux qui croient et font de bonnes œuvres, auront le plus grand bien et aussi le plus bon retour."),
  LockScreenVerse(surah: 20, ayah: 2, text: "Nous n’avons point fait descendre sur toi le Coran pour que tu sois malheureux,"),
  LockScreenVerse(surah: 20, ayah: 7, text: "Et si tu élèves la voix, Il connaît certes les secrets, mêmes les plus cachés."),
  LockScreenVerse(surah: 20, ayah: 8, text: "Allah ! Point de divinité que Lui ! Il possède les noms les plus beaux."),
  LockScreenVerse(surah: 20, ayah: 13, text: "Et Moi, Je t’ai choisi. Ecoute donc ce qui va être révélé."),
  LockScreenVerse(surah: 20, ayah: 37, text: "Et Nous t’avons déjà favorisé une première fois."),
  LockScreenVerse(surah: 20, ayah: 41, text: "Et je t’ai assigné à Moi-Même."),
  LockScreenVerse(surah: 20, ayah: 42, text: "Pars, toi et ton frère, avec Mes prodiges; et ne faiblissez pas de M’invoquer."),
  LockScreenVerse(surah: 20, ayah: 112, text: "Et quiconque aura fait de bonnes œuvres tout en étant croyant, ne craindra ni injustice ni oppression."),
  LockScreenVerse(surah: 20, ayah: 122, text: "Son Seigneur l’a ensuite élu, agréé son repentir et l’a guidé."),
  LockScreenVerse(surah: 39, ayah: 1, text: "La révélation du Livre vient d’Allah, le Puissant, le Sage."),
  LockScreenVerse(surah: 39, ayah: 30, text: "En vérité tu mourras et ils mourront eux aussi ;"),
  LockScreenVerse(surah: 39, ayah: 62, text: "Allah est le Créateur de toute chose, et de toute chose Il est Garant."),
  LockScreenVerse(surah: 48, ayah: 7, text: "A Allah appartiennent les armées des cieux et de la Terre ; et Allah est Puissant et Sage."),
  LockScreenVerse(surah: 51, ayah: 5, text: "Ce qui vous est promis est certainement vrai."),
  LockScreenVerse(surah: 51, ayah: 6, text: "Et la Rétribution arrivera inévitablement."),
  LockScreenVerse(surah: 51, ayah: 20, text: "Il y a sur terre des preuves pour ceux qui croient avec certitude ;"),
  LockScreenVerse(surah: 51, ayah: 21, text: "ainsi qu’en vous-mêmes. N’observez-vous donc pas ?"),
  LockScreenVerse(surah: 51, ayah: 48, text: "Et la terre, Nous l’avons étendue. Et de quelle excellente façon Nous l’avons nivelée !"),
  LockScreenVerse(surah: 51, ayah: 55, text: "Et rappelle ! Car le rappel profite aux croyants."),
  LockScreenVerse(surah: 51, ayah: 56, text: "Je n’ai créé les djinns et les hommes que pour qu’ils M’adorent."),
  LockScreenVerse(surah: 51, ayah: 58, text: "En vérité, c’est Allah qui est le Grand Pourvoyeur, Le Détenteur de la force, l’Inébranlable."),
  LockScreenVerse(surah: 55, ayah: 1, text: "Le Tout Miséricordieux."),
  LockScreenVerse(surah: 55, ayah: 2, text: "Il a enseigné le Coran."),
  LockScreenVerse(surah: 55, ayah: 60, text: "Y a-t-il d’autre récompense pour le bien, que le bien ?"),
  LockScreenVerse(surah: 55, ayah: 78, text: "Béni soit le Nom de ton Seigneur, Plein de Majesté et de Munificence !"),
  LockScreenVerse(surah: 89, ayah: 27, text: "\"ô toi, âme apaisée,"),
  LockScreenVerse(surah: 89, ayah: 28, text: "retourne vers ton Seigneur, satisfaite et agréée ;"),
  LockScreenVerse(surah: 89, ayah: 29, text: "entre donc parmi Mes serviteurs,"),
  LockScreenVerse(surah: 89, ayah: 30, text: "et entre dans Mon Paradis.\""),
  LockScreenVerse(surah: 91, ayah: 9, text: "A réussi, certes celui qui la purifie."),
  LockScreenVerse(surah: 91, ayah: 10, text: "Et est perdu, certes, celui qui la corrompt."),
  LockScreenVerse(surah: 92, ayah: 7, text: "Nous lui faciliterons la voie au plus grand bonheur."),
  LockScreenVerse(surah: 94, ayah: 5, text: "A côté de la difficulté est, certes, une facilité !"),
  LockScreenVerse(surah: 94, ayah: 6, text: "A côté de la difficulté, est certes, une facilité !"),
  LockScreenVerse(surah: 112, ayah: 2, text: "Allah, Le Seul à être imploré pour ce que nous désirons."),
]

private struct VerseWidgetEntry: TimelineEntry {
  let date: Date
  let verse: LockScreenVerse
}

private struct VerseWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> VerseWidgetEntry {
    VerseWidgetEntry(date: .now, verse: lockScreenVerses[0])
  }

  func getSnapshot(in context: Context, completion: @escaping (VerseWidgetEntry) -> Void) {
    completion(entry(for: .now))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<VerseWidgetEntry>) -> Void) {
    let calendar = Calendar.current
    let now = Date()
    let start = calendar.date(bySetting: .second, value: 0, of: now) ?? now

    // 48 entrées préparées d’un coup : un nouveau verset toutes les ~30 minutes.
    // iOS garde la main sur le moment exact d’affichage ; un verrouillage/déverrouillage
    // ne déclenche pas à lui seul un refresh garanti par WidgetKit.
    let entries = (0..<48).compactMap { offset -> VerseWidgetEntry? in
      guard let date = calendar.date(byAdding: .minute, value: offset * 30, to: start) else { return nil }
      return entry(for: date)
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }

  private func entry(for date: Date) -> VerseWidgetEntry {
    VerseWidgetEntry(date: date, verse: verse(for: date))
  }

  private func verse(for date: Date) -> LockScreenVerse {
    guard !lockScreenVerses.isEmpty else {
      return LockScreenVerse(surah: 93, ayah: 3, text: "Ton Seigneur ne t’a ni abandonné, ni détesté.")
    }

    // Mélange déterministe : stable pendant le créneau de 30 min,
    // mais suffisamment dispersé pour éviter une lecture séquentielle évidente.
    let slot = Int(floor(date.timeIntervalSince1970 / (30 * 60)))
    let mixed = (slot &* 73 &+ 41) ^ (slot >> 3)
    let index = abs(mixed) % lockScreenVerses.count
    return lockScreenVerses[index]
  }
}

private struct VerseLockScreenView: View {
  let entry: VerseWidgetEntry

  private var verseFontSize: CGFloat {
    switch entry.verse.text.count {
    case 0...55:
      return 13.4
    case 56...82:
      return 12.5
    default:
      return 11.4
    }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      HStack(spacing: 5) {
        Image(systemName: "book.closed.fill")
          .font(.system(size: 8.5, weight: .semibold))
        Text(entry.verse.reference.uppercased())
          .font(.system(size: 9, weight: .semibold, design: .rounded))
          .tracking(0.25)
          .lineLimit(1)
        Spacer(minLength: 0)
      }
      .foregroundStyle(.secondary)

      Text(entry.verse.text)
        .font(.system(size: verseFontSize, weight: .semibold, design: .serif))
        .foregroundStyle(.primary)
        .lineLimit(4)
        .minimumScaleFactor(0.85)
        .allowsTightening(true)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
    .padding(.horizontal, 2)
    .padding(.vertical, 1)
    .widgetURL(URL(string: "oummah:///surah/\(entry.verse.surah)?verse=\(entry.verse.ayah)&source=widget"))
  }
}

@available(iOS 16.0, *)
struct OummahVerseLockScreenWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: verseWidgetKind, provider: VerseWidgetProvider()) { entry in
      VerseLockScreenView(entry: entry)
        .modifier(WidgetBackground())
    }
    .configurationDisplayName("Verset OUMMAH")
    .description("Un court verset en français sur votre écran verrouillé.")
    .supportedFamilies([.accessoryRectangular])
  }
}

// MARK: - Tahajjud · accueil et écran verrouillé

private let tahajjudWidgetKind = "TahajjudWidget"
private let tahajjudPayloadKey = "oummah.tahajjud-widget.payload.v1"

private struct TahajjudNight: Codable {
  let key: String
  let isha: Double
  let lastThirdStart: Double
  let fajr: Double
}

private struct TahajjudPayload: Codable {
  let nights: [TahajjudNight]
  let validated: [String]
}

private enum TahajjudPhase {
  /** Before the last third: countdown to its start. */
  case evening(TahajjudNight)
  /** Last third in progress: time left until Fajr. */
  case lastThird(TahajjudNight)
  case done(TahajjudNight)
  /** Daytime: tonight's last third. */
  case day(TahajjudNight)
  case empty
}

private struct TahajjudEntry: TimelineEntry {
  let date: Date
  let phase: TahajjudPhase
}

private func loadTahajjudPayload() -> TahajjudPayload? {
  guard
    let raw = UserDefaults(suiteName: widgetGroupIdentifier)?.string(forKey: tahajjudPayloadKey),
    let data = raw.data(using: .utf8)
  else { return nil }
  return try? JSONDecoder().decode(TahajjudPayload.self, from: data)
}

/** Same rule as the app: the widget only picks the state of the nights the app computed. */
private func tahajjudPhase(at date: Date, payload: TahajjudPayload?) -> TahajjudPhase {
  guard let payload = payload else { return .empty }
  let now = date.timeIntervalSince1970 * 1_000
  let nights = payload.nights.sorted { $0.isha < $1.isha }
  if let current = nights.first(where: { now >= $0.isha && now < $0.fajr }) {
    if payload.validated.contains(current.key) { return .done(current) }
    return now < current.lastThirdStart ? .evening(current) : .lastThird(current)
  }
  if let next = nights.first(where: { $0.isha > now }) { return .day(next) }
  return .empty
}

private func tahajjudClock(_ timestamp: Double) -> String {
  let formatter = DateFormatter()
  formatter.locale = Locale(identifier: "fr_FR")
  formatter.dateFormat = "HH:mm"
  return formatter.string(from: Date(timeIntervalSince1970: timestamp / 1_000))
}

private struct TahajjudProvider: TimelineProvider {
  func placeholder(in context: Context) -> TahajjudEntry {
    TahajjudEntry(date: Date(), phase: .empty)
  }

  func getSnapshot(in context: Context, completion: @escaping (TahajjudEntry) -> Void) {
    let now = Date()
    completion(TahajjudEntry(date: now, phase: tahajjudPhase(at: now, payload: loadTahajjudPayload())))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TahajjudEntry>) -> Void) {
    let payload = loadTahajjudPayload()
    let now = Date()
    // One entry now, then one at each ‘Isha / last third / Fajr of the published nights.
    var dates: [Date] = [now]
    for night in payload?.nights ?? [] {
      for timestamp in [night.isha, night.lastThirdStart, night.fajr] {
        let date = Date(timeIntervalSince1970: timestamp / 1_000 + 1)
        if date > now { dates.append(date) }
      }
    }
    let entries = dates.sorted().prefix(40).map { TahajjudEntry(date: $0, phase: tahajjudPhase(at: $0, payload: payload)) }
    completion(Timeline(entries: Array(entries), policy: .atEnd))
  }
}

@available(iOS 16.0, *)
private struct TahajjudSmallView: View {
  let entry: TahajjudEntry

  private var eyebrow: String {
    switch entry.phase {
    case .evening: return "DERNIER TIERS DANS"
    case .lastThird: return "DERNIER TIERS"
    case .done: return "QIYAM AL-LAYL"
    case .day: return "CE SOIR"
    case .empty: return "QIYAM AL-LAYL"
    }
  }

  var body: some View {
    ZStack(alignment: .leading) {
      LinearGradient(
        colors: [Color(red: 0.082, green: 0.063, blue: 0.212), Color(red: 0.016, green: 0.012, blue: 0.047)],
        startPoint: .topTrailing,
        endPoint: .bottomLeading
      )
      .ignoresSafeArea()

      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 5) {
          Image(systemName: "moon.stars.fill")
            .font(.system(size: 11, weight: .semibold))
          Text(eyebrow)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .tracking(0.8)
        }
        .foregroundStyle(Color.oummahGold)

        Spacer(minLength: 0)

        switch entry.phase {
        case .evening(let night):
          Text(timerInterval: safeCountdownInterval(to: night.lastThirdStart), countsDown: true)
            .font(.system(size: 30, weight: .medium, design: .serif))
            .foregroundStyle(.white)
            .minimumScaleFactor(0.6)
          Text("Dernier tiers \(tahajjudClock(night.lastThirdStart)) → \(tahajjudClock(night.fajr))")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.oummahTextSecondary)
        case .lastThird(let night):
          Text("En cours")
            .font(.system(size: 26, weight: .medium, design: .serif))
            .foregroundStyle(.white)
          Text(timerInterval: safeCountdownInterval(to: night.fajr), countsDown: true)
            .font(.system(size: 16, weight: .bold, design: .rounded))
            .foregroundStyle(Color.oummahGold)
          Text("jusqu’à Fajr, \(tahajjudClock(night.fajr))")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.oummahTextSecondary)
        case .done(let night):
          Text("Nuit accomplie")
            .font(.system(size: 24, weight: .medium, design: .serif))
            .foregroundStyle(.white)
          Text("Fajr à \(tahajjudClock(night.fajr))")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.oummahTextSecondary)
        case .day(let night):
          Text(tahajjudClock(night.lastThirdStart))
            .font(.system(size: 34, weight: .medium, design: .serif))
            .foregroundStyle(.white)
          Text("début du dernier tiers")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.oummahTextSecondary)
        case .empty:
          Text("Ouvrez OUMMAH")
            .font(.system(size: 18, weight: .medium, design: .serif))
            .foregroundStyle(.white)
        }
      }
      .lineLimit(1)
      .padding(14)
    }
  }
}

@available(iOS 16.0, *)
private struct TahajjudLockScreenView: View {
  let entry: TahajjudEntry

  @Environment(\.widgetFamily) private var widgetFamily

  @ViewBuilder
  var body: some View {
    switch widgetFamily {
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 1) {
        HStack(spacing: 4) {
          Image(systemName: "moon.stars.fill")
            .font(.system(size: 10, weight: .semibold))
            .widgetAccentable()
          Text(rectangularTitle)
            .font(.system(size: 10, weight: .semibold, design: .rounded))
        }
        rectangularMain
        Text(rectangularDetail)
          .font(.system(size: 12, weight: .medium, design: .rounded))
      }
      .lineLimit(1)
      .minimumScaleFactor(0.75)
      .frame(maxWidth: .infinity, alignment: .leading)

    case .accessoryInline:
      inline

    case .accessoryCircular:
      VStack(spacing: 0) {
        Image(systemName: "moon.stars.fill")
          .font(.system(size: 13, weight: .semibold))
          .widgetAccentable()
        Text(circularText)
          .font(.system(size: 12, weight: .bold, design: .rounded))
          .lineLimit(1)
          .minimumScaleFactor(0.6)
      }

    default:
      TahajjudSmallView(entry: entry)
    }
  }

  private var rectangularTitle: String {
    switch entry.phase {
    case .evening: return "DERNIER TIERS DANS"
    case .lastThird: return "DERNIER TIERS EN COURS"
    case .done, .empty: return "QIYAM AL-LAYL"
    case .day: return "QIYAM CE SOIR"
    }
  }

  @ViewBuilder
  private var rectangularMain: some View {
    switch entry.phase {
    case .evening(let night):
      Text(timerInterval: safeCountdownInterval(to: night.lastThirdStart), countsDown: true)
        .font(.system(size: 19, weight: .bold, design: .rounded))
    case .lastThird(let night):
      Text(timerInterval: safeCountdownInterval(to: night.fajr), countsDown: true)
        .font(.system(size: 19, weight: .bold, design: .rounded))
    case .done:
      Text("Nuit accomplie")
        .font(.system(size: 17, weight: .bold, design: .rounded))
    case .day(let night):
      Text("Dernier tiers \(tahajjudClock(night.lastThirdStart))")
        .font(.system(size: 17, weight: .bold, design: .rounded))
    case .empty:
      Text("Ouvrez OUMMAH")
        .font(.system(size: 17, weight: .bold, design: .rounded))
    }
  }

  private var rectangularDetail: String {
    switch entry.phase {
    case .evening(let night): return "Dernier tiers \(tahajjudClock(night.lastThirdStart)) → \(tahajjudClock(night.fajr))"
    case .lastThird(let night): return "jusqu’à Fajr, \(tahajjudClock(night.fajr))"
    case .done(let night): return "Fajr à \(tahajjudClock(night.fajr))"
    case .day(let night): return "jusqu’à Fajr, \(tahajjudClock(night.fajr))"
    case .empty: return "pour calculer la nuit"
    }
  }

  private var circularText: String {
    switch entry.phase {
    case .evening(let night), .day(let night): return tahajjudClock(night.lastThirdStart)
    case .lastThird(let night): return tahajjudClock(night.fajr)
    case .done: return "✓"
    case .empty: return "—"
    }
  }

  @ViewBuilder
  private var inline: some View {
    switch entry.phase {
    case .evening(let night):
      Text(Image(systemName: "moon.stars.fill")) + Text(" Dernier tiers dans ") + Text(timerInterval: safeCountdownInterval(to: night.lastThirdStart), countsDown: true)
    case .lastThird(let night):
      Label("Dernier tiers · jusqu’à \(tahajjudClock(night.fajr))", systemImage: "moon.stars.fill")
    case .done:
      Label("Qiyam · nuit accomplie", systemImage: "moon.stars.fill")
    case .day(let night):
      Label("Dernier tiers · \(tahajjudClock(night.lastThirdStart))", systemImage: "moon.stars.fill")
    case .empty:
      Label("Qiyam al-Layl · ouvrez OUMMAH", systemImage: "moon.stars.fill")
    }
  }
}

@available(iOS 16.0, *)
struct TahajjudWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: tahajjudWidgetKind, provider: TahajjudProvider()) { entry in
      TahajjudLockScreenView(entry: entry)
        .widgetURL(URL(string: "oummah:///tahajjud"))
        .modifier(WidgetBackground())
    }
    .configurationDisplayName("Qiyam al-Layl")
    .description("Le dernier tiers de la nuit : compte à rebours, puis temps restant avant Fajr.")
    .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryInline, .accessoryCircular])
    .contentMarginsDisabled()
  }
}

// MARK: - Scan : ouvre directement le scanner de produits

private let scanWidgetKind = "ScanWidget"
private let scanURL = URL(string: "oummah:///boycott/scanner")

private struct ScanEntry: TimelineEntry {
  let date: Date
}

private struct ScanProvider: TimelineProvider {
  func placeholder(in context: Context) -> ScanEntry { ScanEntry(date: Date()) }
  func getSnapshot(in context: Context, completion: @escaping (ScanEntry) -> Void) { completion(ScanEntry(date: Date())) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<ScanEntry>) -> Void) {
    // Static content: no refresh needed.
    completion(Timeline(entries: [ScanEntry(date: Date())], policy: .never))
  }
}

private let scanGold = Color(red: 0.95, green: 0.71, blue: 0.24)
private let scanCream = Color(red: 0.97, green: 0.95, blue: 0.87)

private struct ScanBackground: ViewModifier {
  private var gradient: LinearGradient {
    LinearGradient(
      colors: [Color(red: 0.12, green: 0.16, blue: 0.12), Color(red: 0.04, green: 0.05, blue: 0.04)],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(for: .widget) { gradient }
    } else {
      content.background(gradient)
    }
  }
}

@available(iOS 16.0, *)
private struct ScanWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ScanEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        Image(systemName: "barcode.viewfinder")
          .font(.system(size: 24, weight: .semibold))
      }
      .widgetAccentable()
    case .accessoryRectangular:
      HStack(spacing: 8) {
        Image(systemName: "barcode.viewfinder")
          .font(.system(size: 26, weight: .semibold))
          .widgetAccentable()
        VStack(alignment: .leading, spacing: 1) {
          Text("Scanner").font(.headline)
          Text("Halal · boycott").font(.caption).foregroundStyle(.secondary)
        }
        Spacer(minLength: 0)
      }
    default:
      VStack(spacing: 8) {
        ZStack {
          Circle().fill(scanGold.opacity(0.16)).frame(width: 74, height: 74)
          Image(systemName: "barcode.viewfinder")
            .font(.system(size: 40, weight: .semibold))
            .foregroundStyle(scanGold)
        }
        Text("Scanner")
          .font(.system(size: 17, weight: .bold))
          .foregroundStyle(scanCream)
        Text("Halal · boycott")
          .font(.system(size: 12, weight: .medium))
          .foregroundStyle(scanGold.opacity(0.75))
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

@available(iOS 16.0, *)
struct ScanWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: scanWidgetKind, provider: ScanProvider()) { entry in
      ScanWidgetView(entry: entry)
        .widgetURL(scanURL)
        .modifier(ScanBackground())
    }
    .configurationDisplayName("Scanner OUMMAH")
    .description("Ouvre directement le scanner de produits.")
    .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular])
  }
}

// MARK: - Halal autour de moi : ouvre directement les adresses halal proches

private let halalWidgetKind = "HalalWidget"
private let halalURL = URL(string: "oummah:///halal")

@available(iOS 16.0, *)
private struct HalalWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ScanEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        Image(systemName: "fork.knife")
          .font(.system(size: 22, weight: .semibold))
      }
      .widgetAccentable()
    case .accessoryRectangular:
      HStack(spacing: 8) {
        Image(systemName: "fork.knife.circle")
          .font(.system(size: 26, weight: .semibold))
          .widgetAccentable()
        VStack(alignment: .leading, spacing: 1) {
          Text("Halal").font(.headline)
          Text("Autour de moi").font(.caption).foregroundStyle(.secondary)
        }
        Spacer(minLength: 0)
      }
    default:
      VStack(spacing: 8) {
        ZStack {
          Circle().fill(scanGold.opacity(0.16)).frame(width: 74, height: 74)
          Image(systemName: "fork.knife")
            .font(.system(size: 36, weight: .semibold))
            .foregroundStyle(scanGold)
        }
        Text("Halal")
          .font(.system(size: 17, weight: .bold))
          .foregroundStyle(scanCream)
        Text("Autour de moi")
          .font(.system(size: 12, weight: .medium))
          .foregroundStyle(scanGold.opacity(0.75))
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

@available(iOS 16.0, *)
struct HalalWidget: Widget {
  var body: some WidgetConfiguration {
    // Same static provider as the scanner: nothing to refresh.
    StaticConfiguration(kind: halalWidgetKind, provider: ScanProvider()) { entry in
      HalalWidgetView(entry: entry)
        .widgetURL(halalURL)
        .modifier(ScanBackground())
    }
    .configurationDisplayName("Halal autour de moi")
    .description("Ouvre directement les restaurants et commerces halal autour de vous.")
    .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular])
  }
}

// MARK: - Qibla : ouvre directement la boussole

private let qiblaWidgetKind = "QiblaWidget"
private let qiblaURL = URL(string: "oummah:///qibla")

@available(iOS 16.0, *)
private struct QiblaWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ScanEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        Image(systemName: "location.north.circle")
          .font(.system(size: 26, weight: .semibold))
      }
      .widgetAccentable()
    case .accessoryRectangular:
      HStack(spacing: 8) {
        Image(systemName: "location.north.circle")
          .font(.system(size: 26, weight: .semibold))
          .widgetAccentable()
        VStack(alignment: .leading, spacing: 1) {
          Text("Qibla").font(.headline)
          Text("Direction").font(.caption).foregroundStyle(.secondary)
        }
        Spacer(minLength: 0)
      }
    default:
      VStack(spacing: 8) {
        ZStack {
          Circle().fill(scanGold.opacity(0.16)).frame(width: 74, height: 74)
          Image(systemName: "location.north.circle")
            .font(.system(size: 40, weight: .semibold))
            .foregroundStyle(scanGold)
        }
        Text("Qibla")
          .font(.system(size: 17, weight: .bold))
          .foregroundStyle(scanCream)
        Text("Trouver la direction")
          .font(.system(size: 12, weight: .medium))
          .foregroundStyle(scanGold.opacity(0.75))
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

@available(iOS 16.0, *)
struct QiblaWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: qiblaWidgetKind, provider: ScanProvider()) { entry in
      QiblaWidgetView(entry: entry)
        .widgetURL(qiblaURL)
        .modifier(NightBackground())
    }
    .configurationDisplayName("Qibla")
    .description("Ouvre directement la boussole de la Qibla.")
    .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular])
  }
}

// MARK: - Reprendre le Coran : le marque-page du Mushaf

private let quranWidgetKind = "QuranWidget"
private let quranBookmarkKey = "oummah.quran-widget.bookmark.v1"

private struct QuranBookmark: Decodable {
  let surahId: Int
  let page: Int
  let name: String
  let arabicName: String
}

private struct QuranEntry: TimelineEntry {
  let date: Date
  let bookmark: QuranBookmark?
}

private struct QuranProvider: TimelineProvider {
  private func read() -> QuranBookmark? {
    guard let raw = UserDefaults(suiteName: widgetGroupIdentifier)?.string(forKey: quranBookmarkKey),
          let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(QuranBookmark.self, from: data)
  }

  func placeholder(in context: Context) -> QuranEntry {
    QuranEntry(date: Date(), bookmark: QuranBookmark(surahId: 2, page: 23, name: "Al-Baqara", arabicName: "البقرة"))
  }
  func getSnapshot(in context: Context, completion: @escaping (QuranEntry) -> Void) {
    completion(QuranEntry(date: Date(), bookmark: read() ?? placeholder(in: context).bookmark))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<QuranEntry>) -> Void) {
    // Reloaded by the app each time the bookmark changes.
    completion(Timeline(entries: [QuranEntry(date: Date(), bookmark: read())], policy: .never))
  }
}

@available(iOS 16.0, *)
private struct QuranWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: QuranEntry

  private var title: String { entry.bookmark?.name ?? "Coran" }
  private var subtitle: String {
    if let bookmark = entry.bookmark { return "Page \(bookmark.page) · Continuer" }
    return "Commencer la lecture"
  }

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        VStack(spacing: 0) {
          Image(systemName: "bookmark.fill").font(.system(size: 13, weight: .semibold))
          if let bookmark = entry.bookmark {
            Text("p. \(bookmark.page)").font(.system(size: 12, weight: .bold)).minimumScaleFactor(0.7)
          }
        }
      }
      .widgetAccentable()
    case .accessoryRectangular:
      HStack(spacing: 8) {
        Image(systemName: "bookmark.fill")
          .font(.system(size: 22, weight: .semibold))
          .widgetAccentable()
        VStack(alignment: .leading, spacing: 1) {
          Text(title).font(.headline).lineLimit(1)
          Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1)
        }
        Spacer(minLength: 0)
      }
    case .systemMedium:
      HStack(spacing: 16) {
        ZStack {
          Circle().fill(scanGold.opacity(0.16)).frame(width: 66, height: 66)
          Image(systemName: "bookmark.fill")
            .font(.system(size: 30, weight: .semibold))
            .foregroundStyle(scanGold)
        }
        VStack(alignment: .leading, spacing: 3) {
          Text("REPRENDRE LE CORAN")
            .font(.system(size: 10, weight: .bold))
            .tracking(1.4)
            .foregroundStyle(scanGold.opacity(0.85))
          Text(title)
            .font(.system(size: 19, weight: .bold))
            .foregroundStyle(scanCream)
            .lineLimit(1)
          Text(subtitle)
            .font(.system(size: 12.5, weight: .medium))
            .foregroundStyle(scanCream.opacity(0.7))
        }
        Spacer(minLength: 0)
        if let bookmark = entry.bookmark {
          Text(bookmark.arabicName)
            .font(.system(size: 28, weight: .bold))
            .foregroundStyle(scanGold)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
        }
      }
      .padding(.horizontal, 4)
    default:
      VStack(spacing: 6) {
        if let bookmark = entry.bookmark {
          Text(bookmark.arabicName)
            .font(.system(size: 28, weight: .bold))
            .foregroundStyle(scanGold)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
        } else {
          Image(systemName: "book.fill")
            .font(.system(size: 32, weight: .semibold))
            .foregroundStyle(scanGold)
        }
        Text(title)
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(scanCream)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
        Text(subtitle)
          .font(.system(size: 11.5, weight: .medium))
          .foregroundStyle(scanGold.opacity(0.8))
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

@available(iOS 16.0, *)
struct QuranWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: quranWidgetKind, provider: QuranProvider()) { entry in
      QuranWidgetView(entry: entry)
        .widgetURL(URL(string: entry.bookmark.map { "oummah:///surah/\($0.surahId)?mushafPage=\($0.page)" } ?? "oummah:///quran"))
        .modifier(NightBackground())
    }
    .configurationDisplayName("Reprendre le Coran")
    .description("Rouvre le Mushaf à la page de votre marque-page.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
  }
}

/// Night background (violet-black) used by the Qibla and Quran widgets.
private struct NightBackground: ViewModifier {
  private var gradient: LinearGradient {
    LinearGradient(
      colors: [Color(red: 0.14, green: 0.10, blue: 0.18), Color(red: 0.04, green: 0.05, blue: 0.04)],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(for: .widget) { gradient }
    } else {
      content.background(gradient)
    }
  }
}

@available(iOS 16.0, *)
@main
struct OummahWidgetBundle: WidgetBundle {
  var body: some Widget {
    PrayerTimesWidget()
    OummahVerseLockScreenWidget()
    TahajjudWidget()
    ScanWidget()
    HalalWidget()
    QiblaWidget()
    QuranWidget()
  }
}
