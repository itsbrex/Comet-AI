{
  "targets": [
    {
      "target_name": "comet_ai_sidebar",
      "sources": [
        "src/comet_sidebar_addon.mm",
        "src/SwiftBridge.mm",
        "src/CometSidebar.swift"
      ],
      "include_dirs": [
        "<!$(node -p \"require('node-addon-api').include\")",
        "src"
      ],
      "link_settings": {
        "libraries": [
          "-framework Foundation",
          "-framework AppKit",
          "-framework SwiftUI",
          "-framework Cocoa"
        ],
        "xcode_settings": {
          "CLANG_ENABLE_MODULES": "YES",
          "SWIFT_VERSION": "5.9",
          "MACOSX_DEPLOYMENT_TARGET": "13.0",
          "DEFINES_MODULE": "YES",
          "SWIFT_OBJC_BRIDGING_HEADER": "src/CometSidebar-Bridging-Header.h"
        }
      },
      "conditions": [
        ["OS=='mac'", {
          "cflags": [
            "-fobjc-arc"
          ],
          "xcode_settings": {
            "CLANG_ENABLE_MODULES": "YES",
            "SWIFT_OBJC_BRIDGING_HEADER": "src/CometSidebar-Bridging-Header.h",
            "SWIFT_OPTIMIZATION_LEVEL": "-O"
          }
        }]
      ]
    }
  ]
}
