import { NativeModules } from 'react-native';

type Esp32IdfType = {
  multiply(a: number, b: number): Promise<number>;
};

const { Esp32Idf } = NativeModules;

export default Esp32Idf as Esp32IdfType;
