#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNEsp32Idf, NSObject)

RCT_EXTERN_METHOD(checkPermissions:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startBleScan:(nullable NSString *) prefix
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopBleScan)

RCT_EXTERN_METHOD(connectDevice:(NSString *) name pop:(nullable NSString *) pop
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnectDevice)                  

RCT_EXTERN_METHOD(startWifiScan(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(doProvisioning:(NSString *) ssid passPhrase:(NSString *) passPhrase
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup{
  return YES;
}
@end
