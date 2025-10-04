const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class TwilioService {
  constructor() {
    this.verifyServiceSid = null;
  }

  async getOrCreateVerifyService() {
    if (this.verifyServiceSid) {
      return this.verifyServiceSid;
    }

    // Check if credentials are properly configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }

    try {
      // Try to use the configured service first
      if (process.env.TWILIO_VERIFY_SERVICE_SID) {
        const service = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).fetch();
        this.verifyServiceSid = service.sid;
        console.log('Using existing Twilio Verify Service:', this.verifyServiceSid);
        return this.verifyServiceSid;
      }
    } catch (error) {
      console.log('Configured verify service not found, creating new one...');
    }

    try {
      // Create a new verify service
      const service = await client.verify.v2.services.create({
        friendlyName: 'LocalHub OTP Service'
      });
      this.verifyServiceSid = service.sid;
      console.log('Created new Twilio Verify Service:', this.verifyServiceSid);
      console.log('Please update your .env file with: TWILIO_VERIFY_SERVICE_SID=' + this.verifyServiceSid);
      return this.verifyServiceSid;
    } catch (error) {
      console.error('Failed to create verify service:', error.message);
      throw new Error('Twilio service initialization failed: ' + error.message);
    }
  }

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
      const serviceSid = await this.getOrCreateVerifyService();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('Sending OTP to:', formattedPhone);
      
      const verification = await client.verify.v2
        .services(serviceSid)
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
      const serviceSid = await this.getOrCreateVerifyService();
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('Verifying OTP for:', formattedPhone, 'Code:', code, 'Service:', serviceSid);
      
      const verificationCheck = await client.verify.v2
        .services(serviceSid)
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
      
      // Handle specific error cases
      if (error.code === 20404) {
        return { 
          success: false, 
          error: 'No pending verification found for this phone number. Please request a new OTP.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TwilioService();