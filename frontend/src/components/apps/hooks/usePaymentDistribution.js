"use strict";

import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to handle payment distribution across fee items
 * @param {Array} feeItems - Array of fee items
 * @param {Function} setFeeItems - Function to update fee items (optional)
 * @returns {Object} Payment distribution state and functions
 */
export const usePaymentDistribution = (feeItems, setFeeItems) => {
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0);
  const [totalFeeAmount, setTotalFeeAmount] = useState(0);
  const [internalFeeItems, setInternalFeeItems] = useState([]);

  // Initialize internal fee items when external items change
  useEffect(() => {
    if (feeItems && Array.isArray(feeItems)) {
      setInternalFeeItems(feeItems);
    }
  }, [feeItems]);

  // Function to distribute payment across fee rows
  const distributePayment = useCallback((totalAmount) => {
    if (!totalAmount || totalAmount <= 0 || !feeItems || !feeItems.length) {
      return feeItems; // Return original items if no valid amount
    }

    // Get only checked items
    const checkedItems = feeItems.filter(item => item.isChecked);
    if (!checkedItems.length) {
      return feeItems; // Return original items if no checked items
    }

    // Create a copy of the fee items to work with
    const updatedItems = [...feeItems];
    
    // Initialize all checked items with zero payment
    for (let i = 0; i < updatedItems.length; i++) {
      if (updatedItems[i].isChecked) {
        updatedItems[i] = {
          ...updatedItems[i],
          amount_paid: 0,
          isAmountModified: true
        };
      }
    }

    // Group items by type with priority: HP -> BT -> NT -> others
    const hpItems = checkedItems.filter(item => item.code && item.code.includes('HP'));
    const btItems = checkedItems.filter(item => item.code && item.code.includes('BT'));
    const ntItems = checkedItems.filter(item => item.code && item.code.includes('NT'));
    const otherItems = checkedItems.filter(item => 
      (!item.code || 
       (!item.code.includes('HP') && !item.code.includes('BT') && !item.code.includes('NT')))
    );

    // Sort items by code for consistent distribution
    const sortedHpItems = [...hpItems].sort((a, b) => a.code.localeCompare(b.code));
    const sortedBtItems = [...btItems].sort((a, b) => a.code.localeCompare(b.code));
    const sortedNtItems = [...ntItems].sort((a, b) => a.code.localeCompare(b.code));
    const sortedOtherItems = [...otherItems].sort((a, b) => 
      (a.code || '').localeCompare(b.code || '')
    );

    // Combine all items in priority order
    const prioritizedItems = [
      ...sortedHpItems,
      ...sortedBtItems,
      ...sortedNtItems,
      ...sortedOtherItems
    ];

    // Calculate total suggested payment for each category
    const categoryTotals = {
      hp: sortedHpItems.reduce((sum, item) => sum + parseFloat(item.suggested_payment || 0), 0),
      bt: sortedBtItems.reduce((sum, item) => sum + parseFloat(item.suggested_payment || 0), 0),
      nt: sortedNtItems.reduce((sum, item) => sum + parseFloat(item.suggested_payment || 0), 0),
      other: sortedOtherItems.reduce((sum, item) => sum + parseFloat(item.suggested_payment || 0), 0)
    };

    // Total of all suggested payments
    const totalCategoryPayments = categoryTotals.hp + categoryTotals.bt + 
                                 categoryTotals.nt + categoryTotals.other;

    // If total amount is exactly equal to total suggested, use suggested amounts
    if (Math.abs(totalAmount - totalCategoryPayments) < 0.01) {
      for (const item of prioritizedItems) {
        const itemIndex = feeItems.findIndex(fee => fee.code === item.code);
        if (itemIndex === -1) continue;
        
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          amount_paid: parseFloat(item.suggested_payment || 0),
          isAmountModified: true
        };
      }
    } 
    // If we have a different amount to distribute
    else {
      let remainingAmount = totalAmount;
      
      // Calculate how many complete cycles we can do
      const completeCycles = Math.floor(remainingAmount / totalCategoryPayments);
      
      // If we can do at least one complete cycle
      if (completeCycles > 0 && totalCategoryPayments > 0) {
        // Distribute complete cycles
        for (const item of prioritizedItems) {
          const itemIndex = feeItems.findIndex(fee => fee.code === item.code);
          if (itemIndex === -1) continue;
          
          const suggestedPayment = parseFloat(item.suggested_payment || 0);
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            amount_paid: suggestedPayment * completeCycles,
            isAmountModified: true
          };
        }
        
        // Update remaining amount
        remainingAmount -= totalCategoryPayments * completeCycles;
      }
      
      // Now distribute the remaining amount according to priority
      if (remainingAmount > 0) {
        // First try to distribute to HP items
        if (categoryTotals.hp > 0) {
          for (const item of sortedHpItems) {
            const itemIndex = feeItems.findIndex(fee => fee.code === item.code);
            if (itemIndex === -1) continue;
            
            const suggestedPayment = parseFloat(item.suggested_payment || 0);
            const currentPaid = parseFloat(updatedItems[itemIndex].amount_paid || 0);
            
            if (remainingAmount >= suggestedPayment) {
              // Full payment for this item
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + suggestedPayment,
                isAmountModified: true
              };
              remainingAmount -= suggestedPayment;
            } else {
              // Partial payment
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + remainingAmount,
                isAmountModified: true
              };
              remainingAmount = 0;
              break;
            }
            
            if (remainingAmount <= 0) break;
          }
        }
        
        // If there's still remaining amount, try BT items
        if (remainingAmount > 0 && categoryTotals.bt > 0) {
          for (const item of sortedBtItems) {
            const itemIndex = feeItems.findIndex(fee => fee.code === item.code);
            if (itemIndex === -1) continue;
            
            const suggestedPayment = parseFloat(item.suggested_payment || 0);
            const currentPaid = parseFloat(updatedItems[itemIndex].amount_paid || 0);
            
            if (remainingAmount >= suggestedPayment) {
              // Full payment for this item
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + suggestedPayment,
                isAmountModified: true
              };
              remainingAmount -= suggestedPayment;
            } else {
              // Partial payment
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + remainingAmount,
                isAmountModified: true
              };
              remainingAmount = 0;
              break;
            }
            
            if (remainingAmount <= 0) break;
          }
        }
        
        // If there's still remaining amount, try NT items
        if (remainingAmount > 0 && categoryTotals.nt > 0) {
          for (const item of sortedNtItems) {
            const itemIndex = feeItems.findIndex(fee => fee.code === item.code);
            if (itemIndex === -1) continue;
            
            const suggestedPayment = parseFloat(item.suggested_payment || 0);
            const currentPaid = parseFloat(updatedItems[itemIndex].amount_paid || 0);
            
            if (remainingAmount >= suggestedPayment) {
              // Full payment for this item
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + suggestedPayment,
                isAmountModified: true
              };
              remainingAmount -= suggestedPayment;
            } else {
              // Partial payment
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + remainingAmount,
                isAmountModified: true
              };
              remainingAmount = 0;
              break;
            }
            
            if (remainingAmount <= 0) break;
          }
        }
        
        // If there's still remaining amount, try other items
        if (remainingAmount > 0 && categoryTotals.other > 0) {
          for (const item of sortedOtherItems) {
            const itemIndex = feeItems.findIndex(fee => fee.code === item.code);
            if (itemIndex === -1) continue;
            
            const suggestedPayment = parseFloat(item.suggested_payment || 0);
            const currentPaid = parseFloat(updatedItems[itemIndex].amount_paid || 0);
            
            if (remainingAmount >= suggestedPayment) {
              // Full payment for this item
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + suggestedPayment,
                isAmountModified: true
              };
              remainingAmount -= suggestedPayment;
            } else {
              // Partial payment
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + remainingAmount,
                isAmountModified: true
              };
              remainingAmount = 0;
              break;
            }
            
            if (remainingAmount <= 0) break;
          }
        }
        
        // If there's still remaining amount after going through all items once,
        // start another cycle with HP items
        if (remainingAmount > 0) {
          // Start another cycle with HP items
          let cycleItems = [...prioritizedItems];
          
          while (remainingAmount > 0 && cycleItems.length > 0) {
            const item = cycleItems.shift(); // Get the next item in priority order
            const itemIndex = feeItems.findIndex(fee => fee.code === item.code);
            if (itemIndex === -1) continue;
            
            const suggestedPayment = parseFloat(item.suggested_payment || 0);
            const currentPaid = parseFloat(updatedItems[itemIndex].amount_paid || 0);
            
            if (remainingAmount >= suggestedPayment) {
              // Full payment for this item
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + suggestedPayment,
                isAmountModified: true
              };
              remainingAmount -= suggestedPayment;
            } else {
              // Partial payment
              updatedItems[itemIndex] = {
                ...updatedItems[itemIndex],
                amount_paid: currentPaid + remainingAmount,
                isAmountModified: true
              };
              remainingAmount = 0;
              break;
            }
          }
        }
      }
    }
    
    // Round all amount_paid values to 2 decimal places for consistency
    for (let i = 0; i < updatedItems.length; i++) {
      if (updatedItems[i].amount_paid !== undefined) {
        updatedItems[i].amount_paid = Math.round(updatedItems[i].amount_paid * 100) / 100;
      }
    }
    
    // Update internal state
    setInternalFeeItems(updatedItems);
    
    // Try to update external state if setFeeItems is a function
    if (typeof setFeeItems === 'function') {
      try {
        setFeeItems(updatedItems);
      } catch (error) {
        console.error('Error updating fee items:', error);
      }
    }
    
    // Always return the updated items
    return updatedItems;
  }, [feeItems]);

  // Calculate total fee amount when fee items change
  useEffect(() => {
    if (!internalFeeItems || !internalFeeItems.length) return;
    
    const total = internalFeeItems
      .filter(fee => fee.isChecked)
      .reduce((sum, fee) => {
        return sum + parseFloat(fee.amount_paid || fee.suggested_payment || 0);
      }, 0);
    
    setTotalFeeAmount(total);
  }, [internalFeeItems]);

  // Handle total payment amount change
  const handleTotalPaymentChange = useCallback((e) => {
    const value = parseFloat(e.target.value) || 0;
    setTotalPaymentAmount(value);
    
    // Auto-distribute the amount and return the updated items
    return distributePayment(value);
  }, [distributePayment]);

  return {
    totalPaymentAmount,
    setTotalPaymentAmount,
    totalFeeAmount,
    distributePayment,
    handleTotalPaymentChange,
    feeItems: internalFeeItems
  };
};