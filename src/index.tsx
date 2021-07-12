import { NativeModules } from 'react-native';

type Esp32IdfType = {
  connectWifiDevice(pop: String): Promise<String>;
};

const { Esp32Idf } = NativeModules;

export default Esp32Idf as Esp32IdfType;
