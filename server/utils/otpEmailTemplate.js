// Generates the HTML body for the "Reset Password OTP" email.
const otpEmailTemplate = (name, otp) => `
<div style="font-family: Arial, sans-serif; background:#0a0a0a; padding:32px; color:#fff;">
  <div style="max-width:420px; margin:0 auto; background:#111; border:2px solid #fff; border-radius:12px; padding:32px; text-align:center;">
    <h1 style="letter-spacing:2px; font-size:22px; margin-bottom:8px;">AXT — ATTITUDE X T-SHIRTS</h1>
    <p style="color:#aaa; font-size:14px; margin-bottom:24px;">Password Reset Request</p>
    <p style="font-size:14px; color:#ddd;">Hi ${name || 'there'},</p>
    <p style="font-size:14px; color:#ddd; margin-bottom:24px;">
      Use the One-Time Password below to reset your account password. This code is valid for
      <strong>10 minutes</strong>.
    </p>
    <div style="background:#000; border:2px dashed #39FF14; border-radius:8px; padding:16px; margin-bottom:24px;">
      <span style="font-size:32px; font-weight:900; letter-spacing:10px; color:#39FF14;">${otp}</span>
    </div>
    <p style="font-size:12px; color:#777;">
      If you did not request a password reset, you can safely ignore this email —
      your password will remain unchanged.
    </p>
  </div>
</div>
`;

export default otpEmailTemplate;
