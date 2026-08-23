require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name = 'OummahPrayerTimesWidget'
  s.version = package['version']
  s.summary = 'Native bridge for the OUMMAH prayer times widget.'
  s.homepage = 'https://oummah.app'
  s.license = 'MIT'
  s.author = 'OUMMAH'
  s.platforms = { :ios => '15.1' }
  s.swift_version = '5.9'
  s.source = { :git => '' }
  s.static_framework = true
  s.source_files = '**/*.{h,m,swift}'
  s.dependency 'ExpoModulesCore'
end
