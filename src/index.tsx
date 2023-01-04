import {
	NativeModules,
	NativeEventEmitter,
	EmitterSubscription,
	AppState,
	AppStateStatus,
} from 'react-native';
import { useEffect, useState, useRef } from 'react'

export type EspProvisioning = {
	/**
	 * check if has proper permissions, if not will request the needed permissions at native
	 */
	checkPermissions(): Promise<boolean>
	/**
	 * search BLE ESP device
	 * @param prefix prefix of device name
	 */
	startBleScan(prefix: string | null): Promise<boolean>
	stopBleScan(): void
	/**
	 * connect to an ESP device
	 * @param uuid device serviceID
	 * @param pop proof of possession
	 */
	connectDevice(uuid: string, pop: string | null): Promise<boolean>
	/**
	 * connet to an ESP device through wifi
	 * @param pop proof of possession
	 */
	connectWifiDevice(pop: string | null): Promise<boolean>
	/**
	 * disconnect the connected ESP device
	 */
	disconnectDevice(): void
	/**
	 *
	 */
	startWifiScan(): Promise<boolean>
	/**
	 * provisioning Wi-Fi configuration
	 * @param ssidValue Wi-Fi SSID
	 * @param passphraseValue password
	 */
	doProvisioning(ssidValue: string, passphraseValue: string): Promise<boolean>
}

declare enum BleScanStatus {
	FAILED = 0,
	COMPLETED = 1,
}
export interface BleScanEvent {
	status: BleScanStatus
}
export interface BleDevice {
	deviceName: string
	serviceUuid: string
}

type BleScanEventListener = (
	event: BleScanEvent | BleDevice | BleDevice[]
) => void

export interface EspEventEmitter extends NativeEventEmitter {
	addListener(
		eventType: 'scanBle',
		listener: BleScanEventListener
	): EmitterSubscription
}

declare enum DeviceConnectionStatus {
	CONNECTED = 1,
	FAILED = 2,
	DISCONNECTED = 3,
}
export interface DeviceConnectionEvent {
	status: DeviceConnectionStatus
}
type DeviceConnectionEventListener = (event: DeviceConnectionEvent) => void
export interface EspEventEmitter extends NativeEventEmitter {
	addListener(
		eventType: 'connection',
		listener: DeviceConnectionEventListener
	): EmitterSubscription
}

declare enum WifiScanStatus {
	FAILED = 0,
}
declare enum WifiAuthMode {
	WIFI_UNKNOWN = -1,
	WIFI_OPEN = 0,
	WIFI_WEP = 1,
	WIFI_WPA_PSK = 2,
	WIFI_WPA2_PSK = 3,
	WIFI_WPA_WPA2_PSK = 4,
	WIFI_WPA2_ENTERPRISE = 5,
}
export interface WifiAP {
	ssid: string
	auth: WifiAuthMode
	rssi: number
}
export type WifiAPWithPwd = WifiAP & { password: string }
export interface WifiScanEvent {
	status?: WifiScanStatus
	message?: string
	wifiList?: WifiAP[]
}
type WifiScanEventListener = (event: WifiScanEvent) => void
export interface EspEventEmitter extends NativeEventEmitter {
	addListener(
		eventType: 'scanWifi',
		listener: WifiScanEventListener
	): EmitterSubscription
}

declare enum PermissionType {
	REQUEST_ENABLE_BT = 1,
	REQUEST_FINE_LOCATION = 2,
}

declare enum PermissionStatus {
	UNKNOWN = 0,
	LIMITED = 1,
	DENIED = 2,
	ALLOWED = 3,
}
export interface PermissionEvent {
	type: PermissionType
	status: PermissionStatus
}
type PermissionEventListener = (event: PermissionEvent) => void
export interface EspEventEmitter extends NativeEventEmitter {
	addListener(
		eventType: 'permission',
		listener: PermissionEventListener
	): EmitterSubscription
}

declare enum ProvisioningStatus {
	PROV_INIT_FAILED = 0,
	PROV_CONFIG_SENT = 1,
	PROV_CONFIG_FAILED = 2,
	PROV_CONFIG_APPLIED = 3,
	PROV_APPLY_FAILED = 4,
	PROV_COMPLETED = 5,
	PROV_FAILED = 6,
}
export interface ProvisioningEvent {
	status: ProvisioningStatus
	message?: string
}

type ProvisioningEventListener = (event: ProvisioningEvent) => void
export interface EspEventEmitter extends NativeEventEmitter {
	addListener(
		eventType: 'provisioning',
		listener: ProvisioningEventListener
	): EmitterSubscription
}

declare enum CustomDataStatus {
	CUSTOM_DATA_FAIL = 0,
	CUSTOM_DATA_SUCCESS = 1,
	CUSTOM_DATA_SENDING = 2,
}
export interface CustomDataEvent {
	status: CustomDataStatus
	message?: string
}

type CustomDataEventListener = (event: CustomDataEvent) => void
export interface EspEventEmitter extends NativeEventEmitter {
	addListener(
		eventType: 'customData',
		listener: CustomDataEventListener
	): EmitterSubscription
}

const { RNEsp32Idf } = NativeModules as { RNEsp32Idf: EspProvisioning }

const eventEmitter: EspEventEmitter = new NativeEventEmitter(RNEsp32Idf as any)

export default RNEsp32Idf

export type MessageInfo = {
	scanBle: string
	scanWifi: string
	connectDevice: string
	sendingWifiCredential: string
	confirmWifiConnection: string
	enableBluetooth: string
	enableLocation: string
	scanBleFailed: string
	connectFailed: string
	disconnected: string
	initSessionError: string
	completed: string
	applyError: string
	customDataSent: string
	customDataFail: string
	customDataSending: string
}

type ProvisioningProps = {
	devicePrefix: string | null
	pop?: string | null
	message: MessageInfo
}
export function useProvisioning({
	devicePrefix,
	pop = null,
	message,
}: ProvisioningProps) {
	console.log('Invoke func useProvisioning')
	const msg = useRef<MessageInfo>(message)
	const [bleDevices, setBleDevices] = useState<BleDevice[]>([])
	const [wifiAPs, setWifiAPs] = useState<WifiAP[]>([])
	const [loading, setLoading] = useState(true)
	const [status, setStatus] = useState(message.scanBle)
	const isConnecting = useRef(false)
	const [currentStep, setCurrentStep] = useState(1)

	const [provSent, setProvSent] = useState(
		initStep(message.sendingWifiCredential, true)
	)
	const [provApplied, setProvApplied] = useState(
		initStep(message.confirmWifiConnection)
	)
	const [provFinal, setProvFinal] = useState(initStep(''))

	const currentWifi = useRef<WifiAP>()
	const currentDevice = useRef<BleDevice>()

	function connectDevice(bleDevice: BleDevice) {
		if (isConnecting.current) return
		isConnecting.current = true
		RNEsp32Idf.stopBleScan()
		console.log('Connect to device:', bleDevice, pop)
		setStatus(message.connectDevice)
		currentDevice.current = bleDevice
		RNEsp32Idf.connectDevice(bleDevice.serviceUuid, pop)
	}

	function configWifi(wifi: WifiAP) {
		console.log('Selected Wifi:', wifi)
		currentWifi.current = wifi
		setCurrentStep(!wifi.ssid || wifi.auth > 0 ? 3 : 4)
		if (!wifi.auth) {
			doProvisioning(wifi)
		}
	}

	useEffect(() => {
		eventEmitter.addListener('scanWifi', (event) => {
			console.log('Event scanWifi', event)
			setLoading(false)
			setStatus('')
			if (event.wifiList) {
				setWifiAPs(event.wifiList)
			} else if (event.message) {
				setStatus(event.message)
			}
		})
		return function () {
			console.log('Cleanup the resource')
			RNEsp32Idf.stopBleScan()
			RNEsp32Idf.disconnectDevice()
			eventEmitter.removeAllListeners('scanWifi')
		}
	}, [])
	useEffect(() => {
		console.log('Added AppSateChanged listener')
		async function _handleAppStateChange(nextAppState: AppStateStatus) {
			console.log(`AppSateChanged: ${nextAppState}`)
			if (nextAppState === 'active') {
				console.log('Start checkPermissions')
				const result = await RNEsp32Idf.checkPermissions()
				console.log(`checkPermissions result: ${result}`)
				if (result && !isConnecting.current && currentStep === 1) {
					console.log('Start BleScan')
					RNEsp32Idf.startBleScan(devicePrefix)
				}
			}
		}
		AppState.addEventListener('change', _handleAppStateChange)

		eventEmitter.addListener('permission', (event) => {
			console.log('Event permission', event)
			if (event.status) {
				if (currentStep === 1 && !isConnecting.current) {
					RNEsp32Idf.startBleScan(devicePrefix)
					setBleDevices([])
				} else if (currentStep === 2) {
					RNEsp32Idf.startWifiScan()
				}
			} else {
				setStatus(
					event.type === 1
						? msg.current.enableBluetooth
						: msg.current.enableLocation
				)
			}
		})
		return function () {
			console.log('Removed AppSateChanged listener')
			eventEmitter.removeAllListeners('permission')
			AppState.removeEventListener('change', _handleAppStateChange)
		}
	}, [currentStep, devicePrefix])

	useEffect(() => {
		console.log('Added listeners')
		eventEmitter.addListener('scanBle', (event) => {
			console.log('Event scanBle', event)
			if (event instanceof Array) {
				setBleDevices(event)
			} else if ((event as BleDevice).deviceName) {
				setBleDevices((prev) =>
					prev.some((it) => it.serviceUuid === (event as BleDevice).serviceUuid)
						? prev
						: prev.concat(event as BleDevice)
				)
			} else if ((event as BleScanEvent).status === 0) {
				setLoading(false)
				setStatus(msg.current.scanBleFailed)
			} else {
				setLoading(false)
				if (!isConnecting.current) setStatus('')
			}
		})

		eventEmitter.addListener('connection', (event) => {
			isConnecting.current = false
			console.log('Event connection', event)
			switch (event.status) {
				case 1: //connected
					RNEsp32Idf.startWifiScan()
					setCurrentStep(2)
					setLoading(true)
					setStatus(msg.current.scanWifi)
					break
				case 2: //failed
					setStatus(msg.current.connectFailed)
					break
				case 3: //disconnected
					setStatus(msg.current.disconnected)
					break
			}
		})

		eventEmitter.addListener('customData', (event) => {
			console.log('Custom data', event)
			switch(event.status) {
				case 1:
					setStatus(msg.current.customDataSent)
					break
				case 2:
					setStatus(msg.current.customDataSending)
					break
				default:
					setStatus(msg.current.customDataFail)
					break
			}
		})

		eventEmitter.addListener('provisioning', (event) => {
			console.log('Event provisioning', event)
			switch (event.status) {
				case 0:
				case 2:
					setProvSent(doneStep(event.message!, true))
					setProvFinal(doneStep(msg.current.initSessionError, true))
					break
				case 3:
					setProvSent((prev) => ({ ...prev, done: true }))
					setProvApplied((prev) => ({ ...prev, progress: true }))
					break
				case 5:
					setProvApplied((prev) => ({ ...prev, done: true }))
					setProvFinal(doneStep(msg.current.completed))
					break
				default:
					setProvApplied(doneStep(event.message!, false))
					setProvFinal(doneStep(msg.current.applyError, true))
			}
		})

		return function () {
			console.log('Removed listeners')
			eventEmitter.removeAllListeners('scanBle')
			eventEmitter.removeAllListeners('connection')
			eventEmitter.removeAllListeners('customData')
			eventEmitter.removeAllListeners('provisioning')
		}
	}, [devicePrefix])

	return {
		bleDevices,
		wifiAPs,
		loading,
		status,
		currentStep,
		currentWifi,
		currentDevice,
		results: [provSent, provApplied, provFinal],
		setCurrentStep,
		connectDevice,
		configWifi,
		doProvisioning,
	}
}

function doProvisioning(_wifi: WifiAP | WifiAPWithPwd) {
	RNEsp32Idf.doProvisioning(_wifi.ssid, 'password' in _wifi ? _wifi.password : '')
}

export type ProvisioningStepStatus = {
	done: boolean
	progress: boolean
	failed: boolean
	message: string
}

function initStep(message: string, progress = false): ProvisioningStepStatus {
	return {
		done: false,
		progress,
		failed: false,
		message,
	}
}

function doneStep(message: string, failed = false): ProvisioningStepStatus {
	return {
		progress: false,
		done: true,
		failed,
		message,
	}
}

