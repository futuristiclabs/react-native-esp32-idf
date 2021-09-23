# react-native-esp32-idf

provisioning wifi to esp devices

## Installation

```sh
npm install react-native-esp32-idf
```

## Note
This package is based on [react-native-esp-idf](https://www.npmjs.com/package/react-native-esp-idf)
 
with the above package without connecting to bluetooth one cannot connect to wifi of esp device, to slove that issue made neccessary changes to the code .
Now one can connect to esp device wifi without connecting to bluetooth.

Supports Both Android and IOS


## Usage

```js
import RNEsp32Idf,{useProvisioning} from "react-native-esp32-idf";

// ...

// connect to esp device through wifi
// first connect to the hotspot of the device and later 
const devicePrefix = 'PROV_'
	const message: MessageInfo = {
		scanBle: 'Searching device...',
		scanWifi: 'Searching available Wi-Fi...',
		connectDevice: 'Connecting your device...',
		sendingWifiCredential: 'Sending Wi-Fi credentials',
		confirmWifiConnection: 'Confirming Wi-Fi connection',
		enableBluetooth: 'Please enable the Bluetooth to start scan device.',
		enableLocation:
			'Please grant location permission to start scan device.',
		scanBleFailed: 'Scan device failed, please try again.',
		connectFailed: 'Connect to device failed, please try again.',
		disconnected: 'device disconnected, please try again.',
		initSessionError: 'Reboot your device and retry.',
		applyError: 'Reset your device and retry.',
		completed: 'Device has been successfully provisioned!',
	}
	const {
		bleDevices,
		wifiAPs,
		loading,
		status,
		currentStep,
		currentWifi,
		currentDevice,
		results,
		setCurrentStep,
		configWifi,
		connectDevice,
		connectWifiDevice, //newly added 
		doProvisioning,
	} = useProvisioning({ devicePrefix, message, pop: 'abcd1234' })



//android example
const connectToEspDevice = async()=>{
    try{
        const result = await RNEsp32Idf.connectWifiDevice("pop"); //proof of possession
        
    }
    catch(err){
        console.log(err)

    }
}


// ios example

const connectToEspDevice = async()=>{
	try{
		let pop = ""
		let SSID =""
		let Password=""
		const result = await RNEsp32Idf.connectWifiDevice(SSID,POP,Password)

	}
	catch(err){
		console.log(err)
	}
}



```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
