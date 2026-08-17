import { useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import {
  Workflow,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";
import "./Auth.css";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // --- PASSWORD VALIDATION LOGIC ---
  const checkPasswordStrength = (pass) => {
    return {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /\d/.test(pass),
      special: /[@$!%*?&#]/.test(pass),
    };
  };

  const passwordChecks = checkPasswordStrength(password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const doPasswordsMatch = password === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Validate BEFORE showing loading spinner
    if (!isLogin) {
      if (!isPasswordValid) {
        setError("Password does not meet the security requirements.");
        return;
      }
      if (!doPasswordsMatch) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const userData = isLogin
        ? { email, password }
        : { name, email, password, role: "admin" };

      let response;
      if (isLogin) {
        response = await api.post('/auth/login', userData);
      } else {
        response = await api.post('/auth/register', userData);
      }

      console.log("🔍 Backend Response:", response.data);
      if (response.data.token) {
        localStorage.setItem("workwave_token", response.data.token);
        localStorage.setItem("workwave_user_role", response.data.user.role);
        localStorage.setItem("workwave_user_branch", response.data.user.branchId);
        localStorage.setItem("workwave_user", JSON.stringify(response.data.user));

        window.dispatchEvent(new Event("workwave-auth-changed"));

        const targetRoute = 
          response.data.user.role === 'admin' 
            ? '/adminDashboard' 
            : response.data.user.role === 'worker'
              ? '/workerDashboard' 
              : '/factory-worker';

        navigate(targetRoute, { replace: true });
      }
    } catch (err) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.code === "ERR_NETWORK" || err.response?.status === 404) {
        setError("Unable to connect to WorkWave servers. Please try again in a moment.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="auth-left">
        <div className="brand-content">
          <div className="brand-logo">
            <Workflow size={40} color="#3b82f6" />
            <h1>WorkWave</h1>
          </div>
          <h2 className="brand-headline">
            Manage your branches, <br /> workers, and stock <br /> in one place.
          </h2>
          <p className="brand-subtext">
            The ultimate SaaS platform to scale your business. Track sales,
            monitor expenses, and empower your team from anywhere.
          </p>
          <div className="brand-features">
            <div className="feature-item">✅ Multi-branch management</div>
            <div className="feature-item">✅ Real-time sales tracking</div>
            <div className="feature-item">✅ Secure worker access</div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="form-header">
            <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
            <p>
              {isLogin
                ? "Enter your credentials to access your workspace."
                : "Start your 21-day free trial. No credit card required."}
            </p>
          </div>

          {/* --- ERROR MESSAGE BOX --- */}
          {error && (
            <div className="error-box">
              <AlertCircle size={18} />
              <span>{error}</span>
              {error.toLowerCase().includes('deactivated') && (
                <div className="support-box">
                  <strong>Need help?</strong>
                  <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                    Contact support: <a href="tel:07062640714" style={{ color: '#2563eb', fontWeight: '700' }}>07062640714</a>
                  </p>
                </div>
              )}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name Input (Only for Sign Up) */}
            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Kayode Ogunleye"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Requirements (Only for Sign Up) */}
              {!isLogin && (
                <div className="password-requirements">
                  <p className="req-title">Password must contain:</p>
                  <ul>
                    <li className={passwordChecks.length ? "met" : ""}>
                      {passwordChecks.length ? <Check size={14} /> : <X size={14} />}
                      At least 8 characters
                    </li>
                    <li className={passwordChecks.uppercase ? "met" : ""}>
                      {passwordChecks.uppercase ? <Check size={14} /> : <X size={14} />}
                      One uppercase letter (A-Z)
                    </li>
                    <li className={passwordChecks.lowercase ? "met" : ""}>
                      {passwordChecks.lowercase ? <Check size={14} /> : <X size={14} />}
                      One lowercase letter (a-z)
                    </li>
                    <li className={passwordChecks.number ? "met" : ""}>
                      {passwordChecks.number ? <Check size={14} /> : <X size={14} />}
                      One number (0-9)
                    </li>
                    <li className={passwordChecks.special ? "met" : ""}>
                      {passwordChecks.special ? <Check size={14} /> : <X size={14} />}
                      One special character (@, $, !, %, *, ?, &, #)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Input (Only for Sign Up) */}
            {!isLogin && (
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && !doPasswordsMatch && (
                  <span className="error-text">Passwords do not match</span>
                )}
                {doPasswordsMatch && (
                  <span className="success-text">Passwords match</span>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="auth-btn" 
              disabled={loading || (!isLogin && (!isPasswordValid || !doPasswordsMatch))}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Processing...
                </>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Sign Up */}
          <div className="auth-footer">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <button onClick={() => setIsLogin(false)} className="toggle-auth">
                  Start free trial
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button onClick={() => setIsLogin(true)} className="toggle-auth">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}