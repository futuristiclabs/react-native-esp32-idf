# react-native-esp32-idf

provisioning wifi to esp devices

## Installation

```sh
npm install react-native-esp32-idf
```

## Usage

```js
import Esp32Idf from "react-native-esp32-idf";

// ...

// connect to esp device through wifi
// first connect to the hotspot of the device and later 

const connectToEspDevice = async()=>{
    try{
        const result = await Esp32Idf.connectWifiDevice("pop"); //proof of possession
        
    }
    catch(err){
        console.log(err)

    }
}

// After connecting scan wifi 
// note scan methods works only when esp device is connected

const scanWifiNetworks = async()=>{
    try{
        const result = await Esp32Idf.startWifiScan()
        console.log(result)
    }
    catch(err){
        console.log(err)
    }
}

// After scan wifi networks select the ssid to which you want device to connect
// enter password
const doProvisioningToDevice = async()=>{
    let ssid = selectedWifiSSID
    let password = "User Entered Password for above network"
    try{
        const result = await Esp32Idf.doProvisioning(ssid,password)
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
