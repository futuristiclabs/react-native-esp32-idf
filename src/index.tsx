import { NativeModules } from 'react-native';

type Esp32IdfType = {
  connectWifiDevice(pop: String): Promise<Boolean>;
};

const { RNEsp32Idf } = NativeModules;

export default RNEsp32Idf as Esp32IdfType;
