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

// Large widget layout — composed independently for the real systemLarge canvas.
private struct VerticalPrayerLayout: View {
  let day: PrayerDay
  let nextPrayerKey: String?
  let progressState: PrayerProgressState
  let byKey: [String: Prayer]
  let size: CGSize

  var body: some View {
    GeometryReader { proxy in
      let w = proxy.size.width
      let h = proxy.size.height
      let cx = w * 0.50
      let cy = h * 0.47
      let ovalW = w * 0.90
      let ovalH = h * 0.56

      ZStack {
        // Thin layered oval, deliberately flatter than the previous version.
        Ellipse()
          .stroke(Color.black.opacity(0.72), lineWidth: 9)
          .frame(width: ovalW, height: ovalH)
          .position(x: cx, y: cy)
        Ellipse()
          .stroke(Color.oummahGold.opacity(0.28), lineWidth: 6)
          .frame(width: ovalW, height: ovalH)
          .position(x: cx, y: cy)
        Ellipse()
          .stroke(Color.oummahGold, lineWidth: 2.2)
          .frame(width: ovalW, height: ovalH)
          .position(x: cx, y: cy)

        DayProgressIndicator(progressState: progressState, center: CGPoint(x: cx, y: cy), radiusX: ovalW / 2, radiusY: ovalH / 2)

        // Quiet central calendar block, matching the reference composition.
        VStack(spacing: 4) {
          HStack(spacing: 7) {
            Rectangle().fill(Color.oummahGold.opacity(0.45)).frame(width: 48, height: 0.7)
            Image(systemName: "calendar")
              .font(.system(size: 11, weight: .medium))
              .foregroundStyle(Color.oummahGold)
            Rectangle().fill(Color.oummahGold.opacity(0.45)).frame(width: 48, height: 0.7)
          }
          Text(day.frenchDate)
            .font(.system(size: 17, weight: .semibold, design: .serif))
            .foregroundStyle(Color.oummahGold)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
          Text(day.hijriDate)
            .font(.system(size: 12, weight: .semibold, design: .serif))
            .foregroundStyle(.white.opacity(0.94))
            .lineLimit(1)
            .minimumScaleFactor(0.8)
          NextPrayerView(progressState: progressState, compact: false)
          HStack(spacing: 8) {
            Rectangle().fill(Color.oummahGold.opacity(0.35)).frame(width: 54, height: 0.6)
            Image(systemName: "diamond.fill")
              .font(.system(size: 5))
              .foregroundStyle(Color.oummahGold)
            Rectangle().fill(Color.oummahGold.opacity(0.35)).frame(width: 54, height: 0.6)
          }
        }
        .frame(width: w * 0.62)
        .position(x: cx, y: cy)

        LargePrayerNode(prayer: day.sunrise, label: "Chourouk", symbol: "sunrise.fill", active: false)
          .position(x: w * 0.22, y: h * 0.25)
        LargePrayerNode(prayer: byKey["Dhuhr"], label: "Dhohr", symbol: "sun.max.fill", active: nextPrayerKey == "Dhuhr")
          .position(x: w * 0.50, y: h * 0.18)
        LargePrayerNode(prayer: byKey["Asr"], label: "Asr", symbol: "sun.max.fill", active: nextPrayerKey == "Asr")
          .position(x: w * 0.78, y: h * 0.25)
        LargePrayerNode(prayer: byKey["Fajr"], label: "Fajr", symbol: "cloud.sun.fill", active: nextPrayerKey == "Fajr")
          .position(x: w * 0.20, y: h * 0.69)
        LargePrayerNode(prayer: byKey["Isha"], label: "Isha", symbol: "moon.stars.fill", active: nextPrayerKey == "Isha")
          .position(x: w * 0.50, y: h * 0.76)
        LargePrayerNode(prayer: byKey["Maghrib"], label: "Maghrib", symbol: "cloud.sun.fill", active: nextPrayerKey == "Maghrib")
          .position(x: w * 0.80, y: h * 0.69)

        HStack(spacing: 8) {
          Rectangle().fill(Color.oummahGold.opacity(0.25)).frame(width: 56, height: 0.6)
          Image(systemName: "building.columns")
            .font(.system(size: 8, weight: .light))
          Text("OUMMAH")
            .font(.system(size: 9, weight: .medium, design: .serif))
          Rectangle().fill(Color.oummahGold.opacity(0.25)).frame(width: 56, height: 0.6)
        }
        .foregroundStyle(Color.oummahGold.opacity(0.72))
        .position(x: cx, y: h * 0.92)

      }
    }
  }
}

// Medium widget layout — intentionally NOT a crop/scale of the large widget.
private struct HorizontalPrayerLayout: View {
  let day: PrayerDay
  let nextPrayerKey: String?
  let progressState: PrayerProgressState
  let byKey: [String: Prayer]
  let size: CGSize

  var body: some View {
    GeometryReader { proxy in
      let w = proxy.size.width
      let h = proxy.size.height
      let currentPrayer = day.prayers.first(where: { $0.key == nextPrayerKey })

      VStack(spacing: 0) {
        ZStack(alignment: .top) {
          Image(systemName: "moon.fill")
            .font(.system(size: 18, weight: .light))
            .foregroundStyle(Color.oummahGold.opacity(0.9))
            .frame(maxWidth: .infinity, alignment: .leading)

          VStack(spacing: 2) {
            Text("Prière actuelle")
              .font(.system(size: 9, weight: .medium, design: .rounded))
              .foregroundStyle(Color.oummahTextSecondary)
            HStack(alignment: .firstTextBaseline, spacing: 7) {
              Text((currentPrayer?.label ?? "—").uppercased())
                .font(.system(size: 22, weight: .semibold, design: .serif))
              Text(currentPrayer?.time ?? "—")
                .font(.system(size: 28, weight: .bold, design: .rounded))
            }
            .foregroundStyle(Color.oummahText)
            NextPrayerView(progressState: progressState, compact: true)
              .multilineTextAlignment(.center)
              .frame(maxWidth: .infinity, alignment: .center)
          }

          Text("OUMMAH")
            .font(.system(size: 9, weight: .semibold, design: .serif))
            .foregroundStyle(Color.oummahGold)
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .frame(height: h * 0.57)

        Rectangle()
          .fill(Color.oummahGold.opacity(0.35))
          .frame(height: 0.8)

        HStack(spacing: 0) {
          PrayerSummaryCell(prayer: day.prayers.first(where: { $0.key == "Fajr" }), symbol: "cloud.sun.fill", active: nextPrayerKey == "Fajr")
          PrayerSummaryCell(prayer: day.sunrise, symbol: "sunrise.fill", active: false)
          PrayerSummaryCell(prayer: byKey["Dhuhr"], symbol: "sun.max.fill", active: nextPrayerKey == "Dhuhr")
          PrayerSummaryCell(prayer: byKey["Asr"], symbol: "sun.max.fill", active: nextPrayerKey == "Asr")
          PrayerSummaryCell(prayer: byKey["Maghrib"], symbol: "cloud.sun.fill", active: nextPrayerKey == "Maghrib")
          PrayerSummaryCell(prayer: byKey["Isha"], symbol: "moon.stars.fill", active: nextPrayerKey == "Isha")
        }
        .frame(height: h * 0.43)
      }
      .padding(.horizontal, 7)
      .padding(.vertical, 6)
      .background(Color.oummahSurface.opacity(0.82))
      .frame(width: w, height: h)
    }
  }
}

private struct PrayerSummaryCell: View {
  let prayer: Prayer?
  let symbol: String
  let active: Bool

  var body: some View {
    VStack(spacing: 2) {
      if active {
        Circle()
          .fill(Color.oummahGold)
          .frame(width: 4, height: 4)
      } else {
        Color.clear
          .frame(width: 4, height: 4)
      }
      Image(systemName: symbol)
        .font(.system(size: 15, weight: .medium))
        .foregroundStyle(active ? Color.oummahGold : Color.oummahTextSecondary)
      Text(prayer?.label.uppercased() ?? "—")
        .font(.system(size: 10, weight: .semibold, design: .rounded))
        .lineLimit(1)
        .minimumScaleFactor(0.65)
      Text(prayer?.time ?? "—")
        .font(.system(size: 13.5, weight: .bold, design: .rounded))
        .foregroundStyle(active ? Color.oummahGold : Color.oummahText)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .padding(.vertical, 2)
    .background(active ? Color.oummahGold.opacity(0.13) : Color.clear)
    .overlay(alignment: .top) {
      if active {
        VStack(spacing: 0) {
          Triangle()
            .fill(Color.oummahGold)
            .frame(width: 11, height: 6)
          RoundedRectangle(cornerRadius: 9)
            .stroke(Color.oummahGold, lineWidth: 1)
            .padding(.top, -1)
        }
      }
    }
    .clipShape(RoundedRectangle(cornerRadius: 9))
  }
}

private struct Triangle: Shape {
  func path(in rect: CGRect) -> Path {
    var path = Path()
    path.move(to: CGPoint(x: rect.midX, y: rect.maxY))
    path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
    path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
    path.closeSubpath()
    return path
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
        Text("\(nextPrayer.label) dans")
          .frame(maxWidth: .infinity, alignment: .center)
        Text(Date(timeIntervalSince1970: nextPrayer.timestamp / 1_000), style: .timer)
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
