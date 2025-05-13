package com.herobuster7.dial

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SSDPModuleBridge(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val ssdpModule = SSDPModule()

    override fun getName(): String {
        return "SSDPModule"
    }

  @ReactMethod
    fun startDiscovery(options: ReadableMap, callback: Callback) {
        val discoveryTimeout = if (options.hasKey("discoveryTimeout")) {
            options.getInt("discoveryTimeout").toLong()
        } else {
            10000L // default timeout if not provided
        }

        val targetPort = if (options.hasKey("targetPort")) {
            options.getInt("targetPort")
        } else {
            -1 // default to -1 if not provided
        }

        ssdpModule.startSSDPDiscovery(object : SSDPListener {
            override fun onDeviceFound(location: String) {
                sendEvent("SSDPResponse", location)
            }

            override fun onError(error: String) {
                sendEvent("SSDPError", error)
            }

            override fun onDiscoveryStopped() {
                sendEvent("SSDPStopped", "Discovery completed")
            }
        }, discoveryTimeout, targetPort)

        callback.invoke("Discovery started with timeout: $discoveryTimeout and port: $targetPort")
    }


    @ReactMethod
    fun stopDiscovery() {
        ssdpModule.stopDiscovery()
    }

    private fun sendEvent(eventName: String, data: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
