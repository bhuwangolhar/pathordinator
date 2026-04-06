import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <div className="home-wrapper">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-logo">
              <span className="logo-icon">📦</span>
              <span className="logo-text">Pathordinator</span>
            </div>
            <div className="nav-links">
              <button onClick={() => navigate("/login")} className="nav-btn login-btn">
                Sign In
              </button>
              <button onClick={() => navigate("/signup")} className="nav-btn signup-btn">
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Organize Your Deliveries,
              <br />
              Empower Your Team
            </h1>
            <p className="hero-subtitle">
              A modern platform to manage delivery partners, track orders in real-time,
              and streamline your logistics operations
            </p>
            <button onClick={() => navigate("/signup")} className="cta-button">
              Start Free Today
            </button>
          </div>
          <div className="hero-image">
            <div className="illustration">
              <div className="box box-1"></div>
              <div className="box box-2"></div>
              <div className="box box-3"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="features-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage deliveries efficiently</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Manage Teams</h3>
              <p>Create and manage your organization, invite team members with custom roles</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3>Real-Time Tracking</h3>
              <p>Track delivery partners in real-time with live location updates</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Order Management</h3>
              <p>Organize and monitor all your orders with detailed status tracking</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Reliable</h3>
              <p>Enterprise-grade security with encrypted data and role-based access control</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>&copy; 2026 Pathordinator. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

const styles = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; background: #F7F8FA; }

  .home-wrapper { min-height: 100vh; display: flex; flex-direction: column; }

  /* Navigation */
  .navbar {
    background: white;
    border-bottom: 1px solid #E2E8F0;
    padding: 16px 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-decoration: none;
    color: #0F172A;
    font-weight: 700;
    font-size: 18px;
  }

  .logo-icon {
    font-size: 24px;
  }

  .nav-links {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .nav-btn {
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .login-btn {
    background: transparent;
    color: #667eea;
    border: 1px solid #667eea;
  }

  .login-btn:hover {
    background: #667eea;
    color: white;
  }

  .signup-btn {
    background: #667eea;
    color: white;
  }

  .signup-btn:hover {
    background: #764ba2;
  }

  /* Hero Section */
  .hero {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 20px;
    width: 100%;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .hero-title {
    font-size: 48px;
    font-weight: 700;
    color: #0F172A;
    line-height: 1.2;
    margin: 0;
    letter-spacing: -1px;
  }

  .hero-subtitle {
    font-size: 18px;
    color: #64748B;
    line-height: 1.6;
    margin: 0;
  }

  .cta-button {
    padding: 14px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    width: fit-content;
    font-family: 'DM Sans', sans-serif;
  }

  .cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
  }

  /* Hero Image */
  .hero-image {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
  }

  .illustration {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .box {
    position: absolute;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .box-1 {
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    top: 20px;
    left: 0px;
    animation: float 3s ease-in-out infinite;
  }

  .box-2 {
    width: 100px;
    height: 100px;
    background: #FF6B6B;
    top: 150px;
    right: 0px;
    animation: float 3.5s ease-in-out infinite 0.5s;
  }

  .box-3 {
    width: 80px;
    height: 80px;
    background: #4ECDC4;
    bottom: 20px;
    left: 40px;
    animation: float 4s ease-in-out infinite 1s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  /* Features Section */
  .features {
    padding: 100px 20px;
    background: white;
    border-top: 1px solid #E2E8F0;
    border-bottom: 1px solid #E2E8F0;
  }

  .features-header {
    text-align: center;
    max-width: 1200px;
    margin: 0 auto 60px;
  }

  .features-header h2 {
    font-size: 36px;
    font-weight: 700;
    color: #0F172A;
    margin: 0 0 12px 0;
  }

  .features-header p {
    font-size: 16px;
    color: #64748B;
    margin: 0;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .feature-card {
    padding: 32px;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    background: #F8FAFC;
    transition: all 0.3s;
  }

  .feature-card:hover {
    border-color: #667eea;
    background: white;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    transform: translateY(-4px);
  }

  .feature-icon {
    font-size: 40px;
    margin-bottom: 16px;
  }

  .feature-card h3 {
    font-size: 18px;
    font-weight: 600;
    color: #0F172A;
    margin: 0 0 8px 0;
  }

  .feature-card p {
    font-size: 14px;
    color: #64748B;
    margin: 0;
    line-height: 1.6;
  }

  /* Footer */
  .footer {
    background: #0F172A;
    color: #94A3B8;
    text-align: center;
    padding: 32px 20px;
    font-size: 13px;
    margin-top: auto;
  }

  .footer p {
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero {
      grid-template-columns: 1fr;
      padding: 40px 20px;
    }

    .hero-title {
      font-size: 32px;
    }

    .hero-image {
      height: 300px;
    }

    .nav-container {
      flex-wrap: wrap;
    }
  }
`;
