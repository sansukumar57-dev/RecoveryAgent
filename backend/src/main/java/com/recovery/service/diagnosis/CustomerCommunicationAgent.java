package com.recovery.service.diagnosis;

import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import org.springframework.stereotype.Service;

@Service
public class CustomerCommunicationAgent {

    public static record MessageResult(String messageText, String language) {}

    public MessageResult generateMessage(Customer customer, Payment payment, String selectedLanguage) {
        String name = customer.getName();
        String plan = customer.getPlan() != null ? customer.getPlan() : "Subscription";
        double amountInRupees = payment.getAmountMinor() / 100.0;
        String formattedAmount = String.format("₹%,.2f", amountInRupees);
        String reason = payment.getFailureReason();

        String lang = (selectedLanguage != null) ? selectedLanguage : "English";
        
        // Randomly fallback or choose Hinglish if customer preference or name suggests, but default to lang
        if (selectedLanguage == null && customer.getChannelPref() != null && customer.getChannelPref().contains("hinglish")) {
            lang = "Hinglish";
        }

        String msg;
        if ("Hinglish".equalsIgnoreCase(lang)) {
            msg = generateHinglish(name, plan, formattedAmount, reason);
        } else {
            msg = generateEnglish(name, plan, formattedAmount, reason);
            lang = "English";
        }

        return new MessageResult(msg, lang);
    }

    private String generateEnglish(String name, String plan, String amount, String reason) {
        String base = "Hi " + name + ", your payment of " + amount + " for the " + plan + " plan did not go through. ";
        
        if ("insufficient_funds".equalsIgnoreCase(reason)) {
            return base + "It looks like there were insufficient funds in your account. You can retry with a different card or UPI account.";
        } else if ("card_expired".equalsIgnoreCase(reason)) {
            return base + "It looks like your card has expired. Please use the link below to update your payment details securely.";
        } else if ("mandate_lapsed".equalsIgnoreCase(reason) || "mandate_revoked".equalsIgnoreCase(reason)) {
            return base + "Your automated payment mandate could not be authorized. Please re-authenticate your subscription link.";
        } else if ("timeout".equalsIgnoreCase(reason) || "gateway_timeout".equalsIgnoreCase(reason)) {
            return base + "The gateway timed out during processing. You can try retrying the payment or use this direct payment link.";
        } else {
            return base + "It seems the payment attempt was interrupted. I have generated a fresh, secure payment link for you.";
        }
    }

    private String generateHinglish(String name, String plan, String amount, String reason) {
        String base = "Hi " + name + ", aapka " + amount + " ka " + plan + " payment complete nahi ho paya. ";
        
        if ("insufficient_funds".equalsIgnoreCase(reason)) {
            return base + "Aisa lagta hai ki aapke account mein insufficient balance tha. Aap dusre card ya UPI se try kar sakte hain.";
        } else if ("card_expired".equalsIgnoreCase(reason)) {
            return base + "Aapka card expire ho chuka hai. Kripya niche diye gaye link par click karke payment details update karein.";
        } else if ("mandate_lapsed".equalsIgnoreCase(reason) || "mandate_revoked".equalsIgnoreCase(reason)) {
            return base + "Aapka auto-pay mandate complete nahi ho paya. Kripya link par jaakar isse dobara authenticate karein.";
        } else if ("timeout".equalsIgnoreCase(reason) || "gateway_timeout".equalsIgnoreCase(reason)) {
            return base + "Bank gateway timeout ki wajah se payment fail hua. Aap is payment link ka use karke retry kar sakte hain.";
        } else {
            return base + "Lagta hai payment attempt ke dauran koi issue aaya. Main aapke liye ek fresh secure payment link generate kar raha hoon.";
        }
    }
}
