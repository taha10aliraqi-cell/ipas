const fs = require('fs');
const path = require('path');

// 1. Patch expo-modules-jsi Package.swift
const targetFile = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Package.swift');
if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
  content = content.replace('targets: ["ExpoModulesJSI"],\n    )', 'targets: ["ExpoModulesJSI"]\n    )');
  content = content.replace(/\]\,\s*\n\s*\)\,\s*\n\s*\/\/\s*C\+\+/g, ']\n    ),\n\n    // C++');
  content = content.replace(/\]\,\s*\n\s*\)\,\s*\n\s*\/\/\s*Tests/g, ']\n    ),\n\n    // Tests');
  content = content.replace('path: "Tests",\n    ),', 'path: "Tests"\n    )');
  content = content.replace('path: "Benchmarks",\n    ),', 'path: "Benchmarks"\n    )');
  fs.writeFileSync(targetFile, content);
  console.log('Successfully patched expo-modules-jsi Package.swift for Swift 6.0!');
}

// 2. Patch RuntimeScheduler.h to remove undefined SWIFT_RETURNS_RETAINED
const runtimeSchedulerFile = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Sources/ExpoModulesJSI-Cxx/include/RuntimeScheduler.h');
if (fs.existsSync(runtimeSchedulerFile)) {
  let rContent = fs.readFileSync(runtimeSchedulerFile, 'utf8');
  rContent = rContent.replace(/SWIFT_RETURNS_RETAINED/g, '');
  fs.writeFileSync(runtimeSchedulerFile, rContent);
  console.log('Successfully patched RuntimeScheduler.h (removed SWIFT_RETURNS_RETAINED)!');
}

// 3. Also patch expo-modules-macros-plugin Package.swift
const macroFile = path.join(__dirname, '../node_modules/@expo/expo-modules-macros-plugin/apple/Package.swift');
if (fs.existsSync(macroFile)) {
  let macroContent = fs.readFileSync(macroFile, 'utf8');
  macroContent = macroContent.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
  fs.writeFileSync(macroFile, macroContent);
  console.log('Successfully patched expo-modules-macros-plugin Package.swift for Swift 6.0!');
}
