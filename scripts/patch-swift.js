const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Package.swift');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // 1. Lower swift-tools-version to 6.0
  content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');

  // 2. Remove trailing commas in argument lists:
  content = content.replace('targets: ["ExpoModulesJSI"],\n    )', 'targets: ["ExpoModulesJSI"]\n    )');
  content = content.replace(/\]\,\s*\n\s*\)\,\s*\n\s*\/\/\s*C\+\+/g, ']\n    ),\n\n    // C++');
  content = content.replace(/\]\,\s*\n\s*\)\,\s*\n\s*\/\/\s*Tests/g, ']\n    ),\n\n    // Tests');
  content = content.replace('path: "Tests",\n    ),', 'path: "Tests"\n    ),');
  content = content.replace('path: "Benchmarks",\n    ),', 'path: "Benchmarks"\n    ),');

  fs.writeFileSync(targetFile, content);
  console.log('Successfully patched expo-modules-jsi Package.swift for Swift 6.0!');
} else {
  console.log('expo-modules-jsi Package.swift not found at:', targetFile);
}

// Also patch expo-modules-macros-plugin if exists
const macroFile = path.join(__dirname, '../node_modules/@expo/expo-modules-macros-plugin/apple/Package.swift');
if (fs.existsSync(macroFile)) {
  let macroContent = fs.readFileSync(macroFile, 'utf8');
  macroContent = macroContent.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
  fs.writeFileSync(macroFile, macroContent);
  console.log('Successfully patched expo-modules-macros-plugin Package.swift for Swift 6.0!');
}
