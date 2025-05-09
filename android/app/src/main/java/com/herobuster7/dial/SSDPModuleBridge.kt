package com.herobuster7.dial

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Callback

class SSDPModuleBridge(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val ssdpModule = SSDPModule()

    init {
        // Initialize the SSDP discovery
    }

    override fun getName(): String {
        return "SSDPModule"
    }

    // React Native bridge method to start SSDP discovery
    @ReactMethod
    fun startDiscovery(callback: Callback) {
        // Call the SSDP discovery function
        ssdpModule.startSSDPDiscovery()

        // Example of passing data back to JS
        callback.invoke("Discovery started")
    }
}
