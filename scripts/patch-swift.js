const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let swiftVer = '6.0';
try {
  const out = execSync('swift --version', { encoding: 'utf8' });
  console.log('Swift version output:', out);
  const m = out.match(/Swift version (\d+\.\d+)/);
  if (m) swiftVer = m[1];
} catch (e) {
  console.log('Could not check swift version:', e.message);
}

console.log('Detected Swift version:', swiftVer);

if (parseFloat(swiftVer) >= 6.2) {
  console.log('Swift version is >= 6.2, native Expo 57 Swift support active, no patching needed!');
} else {
  console.log('Applying Swift 6.0 compatibility patches...');

  // 1. Overwrite expo-modules-jsi Package.swift
  const jsiPackageFile = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Package.swift');
  if (fs.existsSync(jsiPackageFile)) {
    const content = `// swift-tools-version: 6.0
import Foundation
import PackageDescription

let packageDir = URL(fileURLWithPath: #filePath).deletingLastPathComponent().path
let podsRoot = resolvePodsRoot()
let publicHeaders = "\\(podsRoot)/Headers/Public"
let reactNative = ProcessInfo.processInfo.environment["RN_ROOT"] ?? ProcessInfo.processInfo.environment["REACT_NATIVE_PATH"] ?? "\\(podsRoot)/../../node_modules/react-native"
let headerSearchPaths = [
  publicHeaders, "\\(publicHeaders)/React-jsi", "\\(publicHeaders)/hermes-engine", "\\(publicHeaders)/React-runtimescheduler",
  "\\(publicHeaders)/React-rendererconsistency", "\\(publicHeaders)/React-performancetimeline", "\\(publicHeaders)/React-timing",
  "\\(publicHeaders)/React-debug", "\\(publicHeaders)/React-callinvoker", "\\(publicHeaders)/React-runtimeexecutor",
  "\\(publicHeaders)/RCT-Folly", "\\(publicHeaders)/ReactNativeDependencies", "\\(publicHeaders)/glog",
  "\\(publicHeaders)/DoubleConversion", "\\(publicHeaders)/fmt", "\\(publicHeaders)/fast_float",
  "\\(reactNative)/ReactCommon", "\\(reactNative)/ReactCommon/jsi", "\\(reactNative)/ReactCommon/runtimeexecutor",
  "\\(reactNative)/ReactCommon/callinvoker", "\\(podsRoot)/RCT-Folly", "\\(podsRoot)/fmt/include",
  "\\(podsRoot)/glog/src", "\\(podsRoot)/DoubleConversion"
]
let generatedModuleMap = "\\(packageDir)/.generated/module.modulemap"
let apiNotesPath = "\\(packageDir)/APINotes"
let cxxIncludeFlags = headerSearchPaths.map({ "-I\\($0)" })
let swiftIncludeFlags = headerSearchPaths.flatMap({ ["-Xcc", "-I\\($0)"] })
let testFrameworks = resolveTestFrameworks()

let package = Package(
  name: "ExpoModulesJSI",
  platforms: [.iOS("16.4"), .tvOS("16.4"), .macOS("13.4")],
  products: [.library(name: "ExpoModulesJSI", type: .dynamic, targets: ["ExpoModulesJSI"])],
  dependencies: [],
  targets: [
    .target(
      name: "ExpoModulesJSI",
      dependencies: ["ExpoModulesJSI-Cxx"],
      swiftSettings: [
        .interoperabilityMode(.Cxx),
        .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
        .enableUpcomingFeature("InferIsolatedConformances"),
        .unsafeFlags([
          "-enable-library-evolution", "-emit-module-interface", "-no-verify-emitted-module-interface",
          "-Xfrontend", "-clang-header-expose-decls=has-expose-attr",
          "-Xcc", "-fmodule-map-file=\\(generatedModuleMap)", "-Xcc", "-iapinotes-modules", "-Xcc", apiNotesPath
        ]),
        .unsafeFlags(swiftIncludeFlags)
      ],
      linkerSettings: [.unsafeFlags(["-Xlinker", "-undefined", "-Xlinker", "dynamic_lookup"])]
    ),
    .target(
      name: "ExpoModulesJSI-Cxx",
      dependencies: [],
      cxxSettings: [.headerSearchPath("include/Public"), .unsafeFlags(cxxIncludeFlags)]
    ),
    .testTarget(name: "Tests", dependencies: testFrameworks.dependencies, path: "Tests"),
    .testTarget(name: "Benchmarks", dependencies: testFrameworks.dependencies, path: "Benchmarks")
  ] + testFrameworks.binaryTargets,
  swiftLanguageModes: [.v6],
  cxxLanguageStandard: .cxx20
)

func resolvePodsRoot() -> String {
  let env = ProcessInfo.processInfo.environment
  if let explicit = env["PODS_ROOT"] { return explicit }
  let repoRoot = env["EXPO_ROOT_DIR"] ?? URL(fileURLWithPath: packageDir).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().path
  return "\\(repoRoot)/apps/bare-expo/ios/Pods"
}

func resolveTestFrameworks() -> (binaryTargets: [Target], dependencies: [Target.Dependency]) {
  let names = ["React", "hermesvm", "ReactNativeDependencies"]
  let available = names.filter({ FileManager.default.fileExists(atPath: "\\(packageDir)/.test-frameworks/\\($0).xcframework") })
  let binaryTargets: [Target] = available.map({ .binaryTarget(name: $0, path: ".test-frameworks/\\($0).xcframework") })
  let dependencies: [Target.Dependency] = ["ExpoModulesJSI"] + available.map({ .target(name: $0) })
  return (binaryTargets, dependencies)
}
`;
    fs.writeFileSync(jsiPackageFile, content, 'utf8');
  }

  // 2. Patch RuntimeScheduler.h
  const runtimeSchedulerFile = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h');
  if (fs.existsSync(runtimeSchedulerFile)) {
    let rContent = fs.readFileSync(runtimeSchedulerFile, 'utf8');
    rContent = rContent.replace(/SWIFT_RETURNS_RETAINED/g, '');
    fs.writeFileSync(runtimeSchedulerFile, rContent, 'utf8');
  }

  // 3. Patch expo-modules-macros-plugin Package.swift
  const macroFile = path.join(__dirname, '../node_modules/@expo/expo-modules-macros-plugin/apple/Package.swift');
  if (fs.existsSync(macroFile)) {
    let macroContent = fs.readFileSync(macroFile, 'utf8');
    macroContent = macroContent.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
    fs.writeFileSync(macroFile, macroContent, 'utf8');
  }
}
