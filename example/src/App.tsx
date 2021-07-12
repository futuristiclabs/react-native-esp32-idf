import * as React from 'react';

import { StyleSheet, View, Button, TextInput, } from 'react-native';
import Esp32Idf from 'react-native-esp32-idf';

export default function App() {
  const [pop, setPop] = React.useState<String | undefined>();
  // const [wifiList, setWifiList] = React.useState<Array<String> | undefined>()
  // const [selectedSSID, setSelectedSSID] = React.useState<String | undefined>()
  const [password, setPassword] = React.useState<String | undefined>()




  const connectToEspDevice = async () => {
    try {
      const result = await Esp32Idf.connectWifiDevice(pop || ''); //proof of possession
      console.log(result)

    }
    catch (err) {
      console.log(err)

    }
  }


  const scanWifiNetworks = async () => {
    try {
      const result = await Esp32Idf.startWifiScan()
      // setWifiList(result)
      console.log(result)
    }
    catch (err) {
      console.log(err)
    }
  }

  const doProvisioningToDevice = async () => {

    try {
      const selectedSSID = ''
      const result = await Esp32Idf.doProvisioning(selectedSSID, password || '')
      console.log(result)
    }
    catch (err) {
      console.log(err)

    }
  }



  return (
    <View style={styles.container}>
      <View>

        <TextInput placeholder="Esp Device pop" onChangeText={(text) => setPop(text)} />
        <Button title="Connect to Device" onPress={connectToEspDevice} />
      </View>
      <View>
        <Button title="scan Wifi list" onPress={scanWifiNetworks} />
        {/* {wifiList?.length > 0 && wifiList?.map((list, index) => (
          <TouchableOpacity key={index} onPress={() => setSelectedSSID(list?.SSID)}>
            <Text>{list?.SSID}</Text>
          </TouchableOpacity>
        )} */}
      </View>
      <View>
        <TextInput placeholder="enter wifi password" onChangeText={(text) => setPassword(text)} />
        <Button title="Do Provisioning" onPress={doProvisioningToDevice} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
