export const registerUser = async (req, res) => {
  const { fullName, email } = req.body;
  res.json({
    success: true,
    token: "jwt-demo-token-" + Date.now(),
    user: { fullName, email },
    message: "User registered successfully",
  });
};

export const loginUser = async (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    token: "jwt-demo-token-" + Date.now(),
    user: { email, name: email.split("@")[0] },
    message: "Login successful",
  });
};

export const forgotPassword = async (req, res) => {
  res.json({ success: true, message: "OTP sent to registered email (Demo OTP: 123456)" });
};

export const verifyOTP = async (req, res) => {
  res.json({ success: true, message: "OTP verified successfully" });
};

export const resetPassword = async (req, res) => {
  res.json({ success: true, message: "Password updated successfully" });
};
