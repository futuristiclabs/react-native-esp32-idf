import React
import ESPProvision
import CoreBluetooth

let REQUEST_ENABLE_BT = 1

let BLE_SCAN_COMPLETED = 1
let BLE_SCAN_FAILED = 0
let WIFI_SCAN_FAILED = 0

let DEVICE_CONNECTED = 1
let DEVICE_CONNECTION_FAILED = 2
let DEVICE_DISCONNECTED = 3

let PROV_INIT_FAILED = 0
let PROV_CONFIG_FAILED = 2
let PROV_CONFIG_APPLIED = 3
let PROV_APPLY_FAILED = 4
let PROV_COMPLETED = 5
let PROV_FAILED = 6

let EVENT_SCAN_BLE = "scanBle"
let EVENT_SCAN_WIFI = "scanWifi"
let EVENT_CONNECT_DEVICE = "connection"
let EVENT_PROV = "provisioning"
let EVENT_PERMISSION = "permission"

let PERM_UNKNOWN = 0
let PERM_NA = -1
let PERM_DENIED = 2
let PERM_ALLOWED = 3

@objc(RNEsp32Idf)
class RNEsp32Idf: RCTEventEmitter {
    var manager: CBPeripheralManager?
    var isObserving = false
    var bleDevices:[ESPDevice]?
    var espDevice: ESPDevice?
    var pop = ""
    var isScanning = false
    
    override func startObserving() {
        isObserving = true
    }
    
    override func stopObserving() {
        isObserving = false
    }
    
    override func sendEvent(withName name: String!, body: Any!) {
        if (isObserving) {
            super.sendEvent(withName: name, body: body)
        }
    }
    
    override func supportedEvents() -> [String]! {
        return [EVENT_SCAN_BLE, EVENT_CONNECT_DEVICE, EVENT_SCAN_WIFI, EVENT_PERMISSION, EVENT_PROV]
    }
    
    func checkPermissions() -> Bool {
        var ret = false
        if #available(iOS 13.1, *) {
            switch CBManager.authorization {
            case .allowedAlways, .restricted:
                ret = true
            default:
                break
            }
          } else {
            switch CBPeripheralManager.authorizationStatus() {
            case .authorized, .restricted:
                ret = true
            default:
                break
            }
          }
        return ret
    }
    
    @objc(checkPermissions:reject:)
    func checkPermissions(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        let ret = checkPermissions()
        resolve(ret)
        if (!ret && manager == nil) {
            manager = CBPeripheralManager(delegate: self, queue: nil, options: [CBPeripheralManagerOptionShowPowerAlertKey: true])
        }
    }
    
    @objc(startBleScan:resolve:reject:)
    func startBleScan(prefix: String?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        print("Searching for BLE Devices..")
        if (!checkPermissions() || isScanning) {
            resolve(false)
            return
        }
        isScanning = true
        resolve(true)
        ESPProvisionManager.shared.searchESPDevices(devicePrefix: prefix ?? "", transport: .ble) { bleDevices, error in
            if (!self.isScanning) {
                return
            }
            self.isScanning = false
            self.bleDevices = bleDevices
            if error != nil {
                self.sendEvent(withName: EVENT_SCAN_BLE, body: ["status": BLE_SCAN_FAILED])
            } else {
                let devices = bleDevices!.map({ (device) -> [String: String] in
                    //add serviceUuid to match Android API
                    ["deviceName": device.name, "serviceUuid": device.name]
                })
                self.sendEvent(withName: EVENT_SCAN_BLE, body: devices)
                self.sendEvent(withName: EVENT_SCAN_BLE, body: ["status": BLE_SCAN_COMPLETED])
            }
        }
    }
    
    @objc(stopBleScan)
    func stopBleScan() {
        isScanning = false
    }
    
    @objc(connectDevice:pop:resolve:reject:)
    func connectDevice(name: String, pop: String? = nil, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        self.pop = pop ?? ""
        espDevice = bleDevices?.first(where: { esp -> Bool in esp.name == name})
        if (espDevice == nil) {
            reject("NO_DEVICE", "Can't find the device: \(name).", nil)
            return
        }
        resolve(true)
        espDevice?.security = pop == nil ? .unsecure : .secure
        espDevice?.connect(delegate: self) { status in
            let data: Any
            switch status {
            case .connected:
                data = ["status": DEVICE_CONNECTED]
            case let .failedToConnect(error):
                var errorDescription = ""
                switch error {
                case .securityMismatch, .versionInfoError:
                    errorDescription = error.description
                default:
                    errorDescription = error.description + "\nCheck if POP is correct."
                }
                data = ["status": DEVICE_CONNECTION_FAILED, "message": errorDescription]
            default:
                data = ["status": DEVICE_DISCONNECTED]
            }
            self.sendEvent(withName: EVENT_CONNECT_DEVICE, body: data)
        }
    }
    @objc(disconnectDevice)
    func disconnectDevice() {
        espDevice?.disconnect()
    }
    
    @objc(startWifiScan:reject:)
    func startWifiScan(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        espDevice?.scanWifiList { wifiList, err in
            if (err != nil) {
                self.sendEvent(withName: EVENT_SCAN_WIFI, body:
                                ["status": WIFI_SCAN_FAILED, "message": err!.description])
            }
            else if let list = wifiList {
                let _list = list.sorted { $0.rssi > $1.rssi }.map { wifi in
                    ["ssid": wifi.ssid, "auth": wifi.auth, "rssi": wifi.rssi]
                }
                self.sendEvent(withName: EVENT_SCAN_WIFI, body: ["wifiList": _list])
            }
        }
    }
    
    @objc(doProvisioning:passPhrase:resolve:reject:)
    func doProvisioning(ssid: String, passPhrase: String = "", resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
        espDevice?.provision(ssid: ssid, passPhrase: passPhrase) { status in
            let ret: Any
            switch status {
            case .success:
                ret = ["status": PROV_COMPLETED]
            case let .failure(err):
                switch err {
                case .configurationError:
                    ret = ["status": PROV_CONFIG_FAILED, "message": err.description]
                case .sessionError:
                    ret = ["status": PROV_INIT_FAILED, "message": err.description]
                case .wifiStatusDisconnected:
                    ret = ["status": PROV_APPLY_FAILED, "message": err.description]
                default:
                    ret = ["status": PROV_FAILED, "message": err.description]
                }
            case .configApplied:
                ret = ["status": 3]
            }
            self.sendEvent(withName: EVENT_PROV, body: ret)
        }
    }
}

extension RNEsp32Idf: ESPDeviceConnectionDelegate {
    func getProofOfPossesion(forDevice: ESPDevice, completionHandler: @escaping (String) -> Void) {
        completionHandler(pop)
    }
}

extension RNEsp32Idf: CBPeripheralManagerDelegate {
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        var status: Int?
        switch peripheral.state {
            case .poweredOn:
                _ = checkPermissions()
            case .unauthorized:
                status = PERM_DENIED
            case .unknown:
                status = PERM_UNKNOWN
            default:
                status = PERM_NA
            }
        if(status != nil) {
            sendEvent(withName: EVENT_PERMISSION, body: ["type" : 1, "status": status])
        }
    }
}
