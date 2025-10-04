const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class TwilioService {
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digits
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned; // India country code
    }
    
    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  async sendOTP(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('Sending OTP to:', formattedPhone);
      
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: formattedPhone,
          channel: 'sms'
        });
      
      console.log('OTP sent successfully:', verification.sid);
      return { success: true, sid: verification.sid };
    } catch (error) {
      console.error('Twilio send OTP error:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyOTP(phoneNumber, code) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('Verifying OTP for:', formattedPhone, 'Code:', code);
      
      const verificationCheck = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: formattedPhone,
          code: code
        });
      
      console.log('Verification result:', verificationCheck.status);
      return { 
        success: verificationCheck.status === 'approved',
        status: verificationCheck.status 
      };
    } catch (error) {
      console.error('Twilio verify OTP error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TwilioService();