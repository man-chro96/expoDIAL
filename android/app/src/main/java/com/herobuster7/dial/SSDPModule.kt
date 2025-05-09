package com.herobuster7.dial

import android.os.AsyncTask
import android.util.Log
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class SSDPModule {

    private val SSDP_PORT = 1900
    private val SSDP_M_SEARCH = "M-SEARCH * HTTP/1.1\r\n" +
            "HOST: 239.255.255.250:1900\r\n" +
            "MAN: \"ssdp:discover\"\r\n" +
            "MX: 3\r\n" +
            "ST: urn:dial-multiscreen-org:service:dial:1\r\n\r\n"

    // Starts SSDP search
    fun startSSDPDiscovery() {
        // Run the SSDP discovery task in an AsyncTask
        AsyncTask.execute {
            try {
                val socket = DatagramSocket()
                val group = InetAddress.getByName("239.255.255.250")
                val message = SSDP_M_SEARCH.toByteArray()
                val packet = DatagramPacket(message, message.size, group, SSDP_PORT)

                // Send M-SEARCH message
                socket.send(packet)

                // Receive response
                val responsePacket = DatagramPacket(ByteArray(1024), 1024)
                socket.receive(responsePacket)

                val response = String(responsePacket.data, 0, responsePacket.length)
                Log.d("SSDPModule", "Received response: $response")

                // Call the method to process the result (parse the response)
                processSSDPResponse(response)

                socket.close()
            } catch (e: Exception) {
                Log.e("SSDPModule", "Error in SSDP discovery", e)
            }
        }
    }

    // Parse SSDP response and log device details
    private fun processSSDPResponse(response: String) {
        if (response.contains("LOCATION")) {
            val location = response.substringAfter("LOCATION:").substringBefore("\r\n").trim()
            Log.d("SSDPModule", "Found device at: $location")
            // Here you can send the result back to React Native JS
            // Using ReactContext to pass the result to JS (discussed below)
        }
    }
}
