// ZeaZDev [Unity Script - Web3 Bridge] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

using System;
using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// Bridge between Unity and React Native for Web3 interactions
/// Handles slot game logic with $ZEA token integration
/// </summary>
public class Web3Bridge : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void SendMessageToRN(string message);

    private float betAmount = 0f;
    private string tokenType = "ZEA";

    void Start()
    {
        Debug.Log("Web3Bridge initialized");
    }

    /// <summary>
    /// Called from React Native to start a slot game
    /// </summary>
    /// <param name="betAmountStr">Bet amount in wei</param>
    /// <param name="token">Token type (ZEA or DING)</param>
    public void PlaySlots(string betAmountStr, string token)
    {
        try
        {
            betAmount = float.Parse(betAmountStr);
            tokenType = token;

            Debug.Log($"Playing slots with {betAmount} {tokenType}");

            // Simulate slot spin
            SpinSlots();
        }
        catch (Exception e)
        {
            Debug.LogError($"Error playing slots: {e.Message}");
            SendResultToRN("error", "0", "Failed to spin");
        }
    }

    private void SpinSlots()
    {
        // Generate random result (30% win chance)
        float random = UnityEngine.Random.value;
        
        if (random < 0.3f)
        {
            // Win!
            int multiplier = UnityEngine.Random.Range(2, 7); // 2x to 6x
            float winAmount = betAmount * multiplier;
            
            Debug.Log($"Win! {multiplier}x = {winAmount}");
            SendResultToRN("won", winAmount.ToString(), $"{multiplier}x");
        }
        else
        {
            // Loss
            Debug.Log("Loss");
            SendResultToRN("lost", "0", "Better luck next time");
        }
    }

    /// <summary>
    /// Send game result back to React Native
    /// </summary>
    private void SendResultToRN(string outcome, string winAmount, string message)
    {
        string json = $"{{\"outcome\":\"{outcome}\",\"winAmount\":\"{winAmount}\",\"message\":\"{message}\"}}";
        
        #if UNITY_WEBGL && !UNITY_EDITOR
            SendMessageToRN(json);
        #else
            Debug.Log($"Result (desktop mode): {json}");
        #endif
    }

    /// <summary>
    /// Called from React Native to get current balance
    /// </summary>
    public void GetBalance()
    {
        // In production, query blockchain for balance
        string balanceJson = "{\"ZEA\":\"1000\",\"DING\":\"50000\"}";
        
        #if UNITY_WEBGL && !UNITY_EDITOR
            SendMessageToRN(balanceJson);
        #else
            Debug.Log($"Balance (desktop mode): {balanceJson}");
        #endif
    }
}
