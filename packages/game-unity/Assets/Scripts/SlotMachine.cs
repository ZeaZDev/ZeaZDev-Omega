// ZeaZDev [Unity Script - Slot Machine] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

using System.Collections;
using UnityEngine;

/// <summary>
/// Main slot machine controller with reel spinning logic
/// Implements provably fair random number generation
/// </summary>
public class SlotMachine : MonoBehaviour
{
    [Header("Reel Configuration")]
    public GameObject[] reels; // 3 reels
    public float spinDuration = 2.0f;
    public string[] symbols = { "🍒", "🍋", "🍊", "🍇", "💎", "7️⃣" };
    
    [Header("Game State")]
    private bool isSpinning = false;
    private string[] currentResult;
    
    private Web3Bridge web3Bridge;
    
    void Start()
    {
        web3Bridge = GetComponent<Web3Bridge>();
        currentResult = new string[3];
        InitializeReels();
    }
    
    void InitializeReels()
    {
        // Initialize reel positions
        for (int i = 0; i < reels.Length; i++)
        {
            if (reels[i] != null)
            {
                // Set initial symbol
                SetReelSymbol(i, symbols[Random.Range(0, symbols.Length)]);
            }
        }
    }
    
    /// <summary>
    /// Start spinning the reels
    /// Called from Web3Bridge after bet is placed
    /// </summary>
    public void Spin(string[] result)
    {
        if (isSpinning) return;
        
        currentResult = result;
        StartCoroutine(SpinReels());
    }
    
    IEnumerator SpinReels()
    {
        isSpinning = true;
        
        // Spin each reel with slight delay
        for (int i = 0; i < reels.Length; i++)
        {
            StartCoroutine(SpinReel(i, currentResult[i]));
            yield return new WaitForSeconds(0.3f);
        }
        
        // Wait for all spins to complete
        yield return new WaitForSeconds(spinDuration);
        
        isSpinning = false;
        CheckResult();
    }
    
    IEnumerator SpinReel(int reelIndex, string finalSymbol)
    {
        float elapsed = 0f;
        int spinCount = 0;
        
        while (elapsed < spinDuration)
        {
            // Rapidly change symbols during spin
            if (spinCount % 5 == 0) // Update every 5 frames
            {
                string randomSymbol = symbols[Random.Range(0, symbols.Length)];
                SetReelSymbol(reelIndex, randomSymbol);
            }
            
            elapsed += Time.deltaTime;
            spinCount++;
            yield return null;
        }
        
        // Set final symbol
        SetReelSymbol(reelIndex, finalSymbol);
    }
    
    void SetReelSymbol(int reelIndex, string symbol)
    {
        if (reels[reelIndex] != null)
        {
            // Update reel display (would use TextMeshPro or UI Text in real implementation)
            UnityEngine.UI.Text reelText = reels[reelIndex].GetComponentInChildren<UnityEngine.UI.Text>();
            if (reelText != null)
            {
                reelText.text = symbol;
            }
        }
    }
    
    void CheckResult()
    {
        // Check if all three symbols match
        bool isWin = (currentResult[0] == currentResult[1]) && 
                     (currentResult[1] == currentResult[2]);
        
        if (isWin)
        {
            Debug.Log($"WIN! All {currentResult[0]}");
            PlayWinAnimation();
        }
        else
        {
            Debug.Log("No match - Try again!");
        }
    }
    
    void PlayWinAnimation()
    {
        // Play celebration animation
        StartCoroutine(FlashReels());
    }
    
    IEnumerator FlashReels()
    {
        // Flash reels 3 times
        for (int i = 0; i < 3; i++)
        {
            foreach (GameObject reel in reels)
            {
                reel.GetComponent<Renderer>().material.color = Color.yellow;
            }
            yield return new WaitForSeconds(0.2f);
            
            foreach (GameObject reel in reels)
            {
                reel.GetComponent<Renderer>().material.color = Color.white;
            }
            yield return new WaitForSeconds(0.2f);
        }
    }
    
    /// <summary>
    /// Generate provably fair result using seed
    /// In production, seed would come from blockchain
    /// </summary>
    public string[] GenerateResult(uint seed)
    {
        Random.InitState((int)seed);
        string[] result = new string[3];
        
        for (int i = 0; i < 3; i++)
        {
            result[i] = symbols[Random.Range(0, symbols.Length)];
        }
        
        return result;
    }
}
