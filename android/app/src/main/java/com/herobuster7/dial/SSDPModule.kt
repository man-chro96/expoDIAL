package com.herobuster7.dial

import android.os.AsyncTask
import android.util.Log
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.SocketTimeoutException

interface SSDPListener {
    fun onDeviceFound(location: String)
    fun onError(error: String)
    fun onDiscoveryStopped()
}

class SSDPModule {

    private val SSDP_PORT = 1900
    private val SSDP_M_SEARCH = "M-SEARCH * HTTP/1.1\r\n" +
        "HOST: 239.255.255.250:1900\r\n" +
        "MAN: \"ssdp:discover\"\r\n" +
        "MX: 3\r\n" +
        "ST: urn:dial-multiscreen-org:service:dial:1\r\n\r\n"

    private var isDiscoveryRunning = false
    private val discoveredDevices = mutableSetOf<String>()

    fun startSSDPDiscovery(listener: SSDPListener, discoveryTimeout: Long, targetPort: Int) {
        if (isDiscoveryRunning) {
            Log.d("SSDPModule", "Discovery is already running.")
            return
        }

        isDiscoveryRunning = true
        discoveredDevices.clear()
        AsyncTask.execute {
            val socket = DatagramSocket()
            try {
                socket.broadcast = true
                socket.soTimeout = 3000

                val group = InetAddress.getByName("239.255.255.250")
                val message = SSDP_M_SEARCH.toByteArray()
                val packet = DatagramPacket(message, message.size, group, SSDP_PORT)

                val endTime = System.currentTimeMillis() + discoveryTimeout

                while (isDiscoveryRunning && System.currentTimeMillis() < endTime) {
                    socket.send(packet)

                    try {
                        val responsePacket = DatagramPacket(ByteArray(2048), 2048)
                        socket.receive(responsePacket)

                        val response = String(responsePacket.data, 0, responsePacket.length)
                        Log.d("SSDPModule", "Received response: $response")

                        val location = parseLocationFromResponse(response)
                        if (location != null) {
                            // Check if the port matches or accept all if targetPort == -1
                            val portMatches = if (targetPort == -1) true else location.contains(":$targetPort")

                            if (portMatches && discoveredDevices.add(location)) {
                                Log.d("SSDPModule", "Found device: $location")
                                listener.onDeviceFound(location)
                            }
                        }

                    } catch (e: SocketTimeoutException) {
                        Log.d("SSDPModule", "No response in this round. Retrying...")
                    }
                }

                stopDiscovery()
                listener.onDiscoveryStopped()

            } catch (e: Exception) {
                Log.e("SSDPModule", "SSDP discovery error", e)
                listener.onError(e.message ?: "Unknown error")
            } finally {
                socket.close()
            }
        }
    }

    fun stopDiscovery() {
        isDiscoveryRunning = false
        Log.d("SSDPModule", "Discovery stopped.")
    }

    private fun parseLocationFromResponse(response: String): String? {
        Regex("(?i)LOCATION:\\s*(http://[^\\s]+)").find(response)?.let {
            return it.groupValues[1].trim()
        }
        return null
    }
}
