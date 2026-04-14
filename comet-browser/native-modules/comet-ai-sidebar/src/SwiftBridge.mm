//
//  SwiftBridge.mm
//  comet-ai-sidebar
//
//  Objective-C++ bridge to expose Swift code to Node.js/Electron
//

#import "SwiftBridge.h"
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>

// Forward declarations
@class CometSidebarController;

@interface SwiftBridge : NSObject
@property (nonatomic, strong) CometSidebarController *sidebarController;
@end

@implementation SwiftBridge

- (instancetype)init {
    self = [super init];
    if (self) {
        // Initialize the Swift controller
        [self initializeSidebar];
    }
    return self;
}

- (void)initializeSidebar {
    // Create sidebar controller via Swift class name mangling
    Class sidebarClass = NSClassFromString(@"CometSidebarController");
    if (sidebarClass) {
        SEL sharedSelector = NSSelectorFromString(@"shared");
        if ([sidebarClass respondsToSelector:sharedSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            _sidebarController = [sidebarClass performSelector:sharedSelector];
#pragma clang diagnostic pop
        }
    }
}

- (void)showWindow {
    if (_sidebarController) {
        SEL showSelector = NSSelectorFromString(@"showWindow");
        if ([_sidebarController respondsToSelector:showSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [_sidebarController performSelector:showSelector];
#pragma clang diagnostic pop
        }
    }
}

- (void)hideWindow {
    if (_sidebarController) {
        SEL hideSelector = NSSelectorFromString(@"hideWindow");
        if ([_sidebarController respondsToSelector:hideSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [_sidebarController performSelector:hideSelector];
#pragma clang diagnostic pop
        }
    }
}

- (void)toggleWindow {
    if (_sidebarController) {
        SEL toggleSelector = NSSelectorFromString(@"toggleWindow");
        if ([_sidebarController respondsToSelector:toggleSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [_sidebarController performSelector:toggleSelector];
#pragma clang diagnostic pop
        }
    }
}

- (void)configureLLM:(NSString *)endpoint
                model:(NSString *)model
                apiKey:(NSString *)apiKey
              provider:(NSString *)provider {
    if (_sidebarController) {
        SEL configSelector = NSSelectorFromString(@"configureLLMWithEndpoint:model:apiKey:provider:");
        if ([_sidebarController respondsToSelector:configSelector]) {
            NSMethodSignature *signature = [_sidebarController methodSignatureForSelector:configSelector];
            NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
            [invocation setSelector:configSelector];
            [invocation setTarget:_sidebarController];
            [invocation setArgument:&endpoint atIndex:2];
            [invocation setArgument:&model atIndex:3];
            [invocation setArgument:&apiKey atIndex:4];
            [invocation setArgument:&provider atIndex:5];
            [invocation invoke];
        }
    }
}

- (void)loadLLMConfig {
    if (_sidebarController) {
        SEL loadSelector = NSSelectorFromString(@"loadLLMConfig");
        if ([_sidebarController respondsToSelector:loadSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [_sidebarController performSelector:loadSelector];
#pragma clang diagnostic pop
        }
    }
}

- (NSDictionary *)getLLMConfig {
    if (_sidebarController) {
        return @{
            @"endpoint": _sidebarController.llmEndpoint ?: @"",
            @"model": _sidebarController.llmModel ?: @"",
            @"provider": _sidebarController.providerType ?: @"ollama"
        };
    }
    return @{};
}

- (void)setSidebarVersion:(NSString *)version {
    if (_sidebarController) {
        SEL versionSelector = NSSelectorFromString(@"setSidebarVersion:");
        if ([_sidebarController respondsToSelector:versionSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [_sidebarController performSelector:versionSelector withObject:version];
#pragma clang diagnostic pop
        }
    }
}

- (NSString *)getSidebarVersion {
    if (_sidebarController) {
        SEL versionSelector = NSSelectorFromString(@"getSidebarVersion");
        if ([_sidebarController respondsToSelector:versionSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            return [_sidebarController performSelector:versionSelector];
#pragma clang diagnostic pop
        }
    }
    return @"electron";
}

- (void)setAutoStart:(BOOL)enabled {
    if (_sidebarController) {
        SEL autoStartSelector = NSSelectorFromString(@"setAutoStart:");
        if ([_sidebarController respondsToSelector:autoStartSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            [_sidebarController performSelector:autoStartSelector withObject:@(enabled)];
#pragma clang diagnostic pop
        }
    }
}

- (BOOL)getAutoStart {
    if (_sidebarController) {
        SEL autoStartSelector = NSSelectorFromString(@"getAutoStart");
        if ([_sidebarController respondsToSelector:autoStartSelector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
            id result = [_sidebarController performSelector:autoStartSelector];
            return [result boolValue];
#pragma clang diagnostic pop
        }
    }
    return NO;
}

@end

// Factory function to create SwiftBridge instance
SwiftBridge *CreateSwiftBridge() {
    return [[SwiftBridge alloc] init];
}
