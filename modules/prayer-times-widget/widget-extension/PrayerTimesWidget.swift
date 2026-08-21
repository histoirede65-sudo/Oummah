import SwiftUI
import WidgetKit

private let widgetKind = "PrayerTimesWidget"
private let widgetGroupIdentifier = "group.com.oummah.app"
private let widgetPayloadKey = "oummah.prayer-times-widget.payload.v1"

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
    guard let schedule = loadSchedule() else {
      completion(Timeline(entries: [entry(for: .now, schedule: nil)], policy: .after(.now.addingTimeInterval(60 * 60))))
      return
    }

    let now = Date()
    let endTimestamp = (schedule.tomorrow.prayers.map(\.timestamp) + [schedule.tomorrow.sunrise.timestamp]).max() ?? schedule.tomorrow.startTimestamp
    let fiveMinutes: TimeInterval = 5 * 60
    let firstSlot = ceil(now.timeIntervalSince1970 / fiveMinutes) * fiveMinutes
    var timestamps = Set<Int64>()
    timestamps.insert(Int64((now.timeIntervalSince1970 * 1_000).rounded()))

    var slot = firstSlot
    while slot * 1_000 <= endTimestamp {
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
    completion(Timeline(entries: entries, policy: .atEnd))
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
    let events = [
      PrayerEvent(prayer: schedule.today.prayers.first(where: { $0.key == "Fajr" }) ?? schedule.today.sunrise, timestamp: schedule.today.prayers.first(where: { $0.key == "Fajr" })?.timestamp ?? schedule.today.startTimestamp),
      PrayerEvent(prayer: schedule.today.sunrise, timestamp: schedule.today.sunrise.timestamp),
    ] + schedule.today.prayers.map { PrayerEvent(prayer: $0, timestamp: $0.timestamp) } + [
      PrayerEvent(prayer: schedule.tomorrow.prayers.first(where: { $0.key == "Fajr" }) ?? schedule.tomorrow.sunrise, timestamp: schedule.tomorrow.prayers.first(where: { $0.key == "Fajr" })?.timestamp ?? schedule.tomorrow.startTimestamp),
    ]
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

  var body: some View {
    GeometryReader { proxy in
      ZStack {
        Image("home-mosque-sunset")
          .resizable()
          .scaledToFill()
          .frame(width: proxy.size.width, height: proxy.size.height)
          .clipped()
          .ignoresSafeArea()
        
        // Translucent black overlay for readability
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
    .widgetURL(URL(string: "oummah:///"))
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
            timerInterval: Date()...Date(timeIntervalSince1970: timestamp / 1_000),
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
    .lineLimit(1)
    .minimumScaleFactor(0.7)
  }
}

private struct CenteredCountdown: View {
  let timestamp: Double?

  var body: some View {
    GeometryReader { proxy in
      CountdownText(timestamp: timestamp, fontSize: 24)
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
        HStack(alignment: .firstTextBaseline, spacing: 4) {
          Text("dans")
            .font(.system(size: compact ? 10.5 : 13, weight: .medium, design: .rounded))
          if #available(iOS 16.0, *) {
            Text(
              timerInterval: Date()...Date(timeIntervalSince1970: nextPrayer.timestamp / 1_000),
              countsDown: true
            )
          } else {
            Text(Date(timeIntervalSince1970: nextPrayer.timestamp / 1_000), style: .timer)
          }
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

@main
struct PrayerTimesWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: widgetKind, provider: PrayerWidgetProvider()) { entry in
      PrayerTimesWidgetView(entry: entry)
    }
    .configurationDisplayName("Horaires de prière")
    .description("Vos horaires de prière OUMMAH.")
    .supportedFamilies([.systemMedium, .systemLarge])
    .contentMarginsDisabled()
  }
}
