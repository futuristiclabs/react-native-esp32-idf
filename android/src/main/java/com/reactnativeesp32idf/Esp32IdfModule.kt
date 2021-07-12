package com.reactnativeesp32idf

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import com.espressif.provisioning.DeviceConnectionEvent
import com.espressif.provisioning.ESPConstants
import com.espressif.provisioning.ESPConstants.ProvisionFailureReason
import com.espressif.provisioning.ESPProvisionManager
import com.espressif.provisioning.WiFiAccessPoint
import com.espressif.provisioning.listeners.BleScanListener
import com.espressif.provisioning.listeners.ProvisionListener
import com.espressif.provisioning.listeners.WiFiScanListener
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import java.util.*
import org.greenrobot.eventbus.EventBus
import org.greenrobot.eventbus.Subscribe
import org.greenrobot.eventbus.ThreadMode



private const val REQUEST_ENABLE_BT = 1
private const val REQUEST_FINE_LOCATION = 2
private const val BLE_SCAN_COMPLETED = 1
private const val BLE_SCAN_FAILED = 0
private const val WIFI_SCAN_FAILED = 0
private const val PROV_INIT_FAILED = 0
private const val PROV_CONFIG_FAILED = 2
private const val PROV_CONFIG_APPLIED = 3
private const val PROV_APPLY_FAILED = 4
private const val PROV_COMPLETED = 5
private const val PROV_FAILED = 6
private const val EVENT_SCAN_BLE = "scanBle"
private const val EVENT_SCAN_WIFI = "scanWifi"
private const val EVENT_CONNECT_DEVICE = "connection"
private const val EVENT_PROV = "provisioning"
private const val EVENT_PERMISSION = "permission"
private const val PERM_DENIED = 2
private const val PERM_ALLOWED = 3
private val TAG = Esp32IdfModule::class.java.simpleName

class Esp32IdfModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), PermissionListener, ActivityEventListener {
    private val provisionManager: ESPProvisionManager by lazy(LazyThreadSafetyMode.NONE) {
      ESPProvisionManager.getInstance(reactApplicationContext)
    }

    override fun getName(): String {
        return "RNEsp32Idf"
    }

    // Example method
    // See https://reactnative.dev/docs/native-modules-android

    @ReactMethod
    fun connectWifiDevice(pop: String?, p: Promise) {
      p.resolve(true)
      val security =
        if (pop == null) ESPConstants.SecurityType.SECURITY_0
        else ESPConstants.SecurityType.SECURITY_1

      val espDevice =
        provisionManager.createESPDevice(ESPConstants.TransportType.TRANSPORT_SOFTAP, security)
      if (pop != null) {
        espDevice.proofOfPossession = pop
      }

      espDevice.connectWiFiDevice()
    }

  override fun onRequestPermissionsResult(requestCode:Int, permissions: Array<out String>?, grantResults: IntArray?): Boolean {
    Log.d(TAG,
    "onRequestPermissionsResult, requestCode : $requestCode, permissions : $permissions, grantResults : $grantResults"
    )
    when (requestCode) {
      REQUEST_FINE_LOCATION -> {
        val params = Arguments.createMap()
        // If request is cancelled, the result arrays are empty.
        val status =
          grantResults?.size!! > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
        params.putInt("type", REQUEST_FINE_LOCATION)
        params.putInt("status", if (status) PERM_ALLOWED else PERM_DENIED)
        sendEvent(EVENT_PERMISSION, params)
        return status
      }
    }
    return false
  }

  private fun sendEvent(eventName: String, params: WritableMap?) {
    reactApplicationContext.getJSModule(RCTDeviceEventEmitter::class.java).emit(eventName, params)
  }

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
    if (activity != null) {
      Log.d(TAG, "onActivityResult, requestCode : $requestCode, resultCode : $resultCode")

      if (requestCode == REQUEST_ENABLE_BT) {
        val params = Arguments.createMap()
        params.putInt("type", REQUEST_ENABLE_BT)
        params.putInt("status", if (resultCode == Activity.RESULT_OK) PERM_ALLOWED else PERM_DENIED)
        sendEvent(EVENT_PERMISSION, params)
      }
    }
  }

  override fun onNewIntent(intent: Intent?) {

  }


}
