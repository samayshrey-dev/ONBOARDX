import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StrokeText from '../../components/StrokeText';
import ScrollFloat from '../../components/ScrollFloat';
import GridScan from '../../components/GridScan';

const LandingHome = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  const handleDashboardRedirect = () => {
    if (role === 'PARTNER') navigate('/partner');
    else if (role === 'REVIEWER') navigate('/reviewer');
    else if (role === 'ADMIN') navigate('/admin');
    else navigate('/partner');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-vh-100 d-flex flex-column position-relative overflow-hidden">
      <GridScan />

      {/* Top Header Navbar */}
      <header
        className="px-4 py-3 border-bottom border-dark sticky-top animate-fade-in-down"
        style={{ backgroundColor: '#FFFFFF', zIndex: 1020 }}
      >
        <div className="container-fluid max-w-7xl d-flex align-items-center justify-content-between">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none hover-scale">
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{ width: 36, height: 36, backgroundColor: '#000000', borderRadius: '4px', fontSize: '1.1rem' }}
            >
              ●
            </div>
            <div>
              <span className="font-mono h5 mb-0 fw-bold text-dark tracking-tight">
                ONBOARDX
              </span>
            </div>
          </Link>

          <nav className="d-none d-md-flex align-items-center gap-4 font-mono small">
            <button onClick={() => scrollToSection('features')} className="btn btn-link text-decoration-none text-muted p-0 hover-scale">
              FEATURES
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="btn btn-link text-decoration-none text-muted p-0 hover-scale">
              HOW IT WORKS
            </button>
            <button onClick={() => scrollToSection('roles')} className="btn btn-link text-decoration-none text-muted p-0 hover-scale">
              ROLES
            </button>
            <button onClick={() => scrollToSection('faq')} className="btn btn-link text-decoration-none text-muted p-0 hover-scale">
              FAQ
            </button>
          </nav>

          <div className="d-flex align-items-center gap-3">
            {user ? (
              <button onClick={handleDashboardRedirect} className="btn btn-ox-black font-mono text-uppercase hover-lift">
                DASHBOARD ({role}) →
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ox-white font-mono text-uppercase text-decoration-none px-3 hover-lift">
                  LOGIN
                </Link>
                <Link to="/register" className="btn btn-ox-black font-mono text-uppercase text-decoration-none px-3 hover-lift">
                  REGISTER →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-5 text-center px-3 border-bottom border-dark position-relative" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container max-w-5xl py-4 animate-fade-in-up">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 mb-3 border border-dark font-mono text-uppercase animate-pulse-glow" style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#F8F9FA', borderRadius: '50px' }}>
            <span>● SMART ENTERPRISE PARTNER ONBOARDING</span>
          </div>

          <div className="my-3 mx-auto" style={{ maxWidth: 780 }}>
            <StrokeText
              text="ONBOARDX"
              strokeColor="#000000"
              fillColor="#000000"
              strokeWidth={1.4}
              drawDuration={1.6}
              fillDelay={0.2}
              stagger={0.05}
              ease="power2.out"
              trigger="mount"
              fillMode="wipe"
              fontSize={128}
              fontWeight={800}
              letterSpacing={-4}
              reverse={false}
            />
          </div>

          <h1 className="ox-display-title mb-4 text-dark" style={{ fontSize: '2.4rem' }}>
            STAGE-GATED COMPLIANCE & PARTNER APPROVALS.
          </h1>

          <p className="lead text-secondary mb-5 mx-auto font-mono" style={{ maxWidth: 740, fontSize: '1.05rem', lineHeight: 1.6 }}>
            ONBOARDX replaces static email exchanges with connected blueprint checklists, real-time document verification, and multi-stage compliance sign-offs.
          </p>

          {/* CTA Buttons */}
          <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
            <Link to="/register" className="btn btn-ox-black btn-lg font-mono text-uppercase px-4 py-3 hover-lift shadow-sm">
              START ONBOARDING →
            </Link>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="btn btn-ox-white btn-lg font-mono text-uppercase px-4 py-3 hover-lift"
            >
              EXPLORE WORKFLOW
            </button>
          </div>

          {/* Signature Stepper Visual Preview */}
          <div className="p-4 text-start border border-dark bg-light mx-auto rounded-1 hover-lift shadow-sm" style={{ maxWidth: 940 }}>
            <div className="font-mono text-uppercase text-dark small fw-bold mb-3 border-bottom border-dark pb-2 d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <span className="spinner-grow spinner-grow-sm text-dark" role="status"></span>
                PARTNER JOURNEY WORKFLOW PREVIEW
              </span>
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>STAGE-GATED PIPELINE</span>
            </div>
            <div className="row g-3">
              {[
                { stage: '01', label: 'REGISTRATION', desc: 'Profile & Blueprint initialization' },
                { stage: '02', label: 'CHECKLIST', desc: 'Upload mandatory compliance files' },
                { stage: '03', label: 'VERIFICATION', desc: 'Split-screen officer document review' },
                { stage: '04', label: 'APPROVAL', desc: 'Executive sign-off & account activation' },
              ].map((st, idx) => {
                const isCurrent = idx === activeStep;
                const isPast = idx < activeStep;

                let cardBg = '#FFFFFF';
                let textColor = '#000000';
                let statusText = '○ UPCOMING';

                if (isCurrent) {
                  cardBg = '#000000';
                  textColor = '#FFFFFF';
                  statusText = '● ACTIVE STAGE';
                } else if (isPast) {
                  cardBg = '#F4F4F5';
                  textColor = '#1E1E22';
                  statusText = '✓ COMPLETED';
                }

                return (
                  <div key={idx} className="col-12 col-sm-6 col-lg-3">
                    <div
                      onClick={() => setActiveStep(idx)}
                      className="p-3 border border-dark h-100 transition-all"
                      style={{
                        backgroundColor: cardBg,
                        color: textColor,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isCurrent ? 'scale(1.04)' : 'scale(1)',
                        boxShadow: isCurrent ? '0 10px 24px rgba(0,0,0,0.2)' : 'none'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2 font-mono">
                        <span className="small opacity-75">{st.stage}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{statusText}</span>
                      </div>
                      <div className="font-mono fw-bold text-uppercase small mb-1">{st.label}</div>
                      <div className="small opacity-75" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>{st.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Product Capabilities & Features */}
      <section id="features" className="py-5 px-3 border-bottom border-dark bg-white">
        <div className="container max-w-6xl py-4">
          <div className="text-center mb-5 animate-fade-in-up">
            <div className="font-mono text-uppercase text-muted small fw-bold mb-2">ENTERPRISE PLATFORM FEATURES</div>
            <h2 className="ox-section-title mb-3">
              <ScrollFloat
                animationDuration={1}
                ease='back.inOut(2)'
                scrollStart='center bottom+=50%'
                scrollEnd='bottom bottom-=40%'
                stagger={0.03}
              >
                ENGINEERED FOR COMPLIANCE PRECISION
              </ScrollFloat>
            </h2>
            <p className="font-mono text-muted small mx-auto" style={{ maxWidth: 640 }}>
              End-to-end partner governance with dynamic document validation and real-time audit logging.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                num: '01',
                title: 'DYNAMIC ONBOARDING BLUEPRINTS',
                desc: 'Role and partner-specific blueprint templates (Company, Distributor, Franchisee) with custom requirement schemas.'
              },
              {
                num: '02',
                title: 'DOCUMENT VERIFICATION WORKSPACE',
                desc: 'Two-panel document review workspace for compliance officers with direct correction requests and feedback notes.'
              },
              {
                num: '03',
                title: 'LIVE COMPLIANCE REVIEW QUEUE',
                desc: 'Focused action queue enabling compliance teams to review, request corrections, or approve items efficiently.'
              },
              {
                num: '04',
                title: 'MULTI-STAGE APPROVAL GATES',
                desc: 'Progressive stage gates requiring verification completion before proceeding to executive final sign-off.'
              },
              {
                num: '05',
                title: 'REAL-TIME STATUS TRACKING',
                desc: 'Instant visibility into overall progress, completed tasks, pending documents, and next step callouts.'
              },
              {
                num: '06',
                title: 'CHRONOLOGICAL AUDIT LOGS',
                desc: 'Complete chronological audit log of all submission events, reviewer checks, uploads, and approval decisions.'
              }
            ].map((feat, idx) => (
              <div key={idx} className={`col-12 col-md-6 col-lg-4 animate-fade-in-up stagger-${(idx % 4) + 1}`}>
                <div className="p-4 border border-dark h-100 bg-light rounded-1 hover-lift">
                  <div className="font-mono fw-bold text-muted mb-2" style={{ fontSize: '0.8rem' }}>{feat.num}</div>
                  <h5 className="font-mono fw-bold text-dark text-uppercase mb-2" style={{ fontSize: '0.95rem' }}>{feat.title}</h5>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-5 px-3 border-bottom border-dark" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container max-w-5xl py-4">
          <div className="text-center mb-5 animate-fade-in-up">
            <div className="font-mono text-uppercase text-muted small fw-bold mb-2">WORKFLOW ARCHITECTURE</div>
            <h2 className="ox-section-title">FIVE STAGES TO ACTIVATION</h2>
          </div>

          <div className="d-flex flex-column gap-3">
            {[
              { num: '01', title: 'CREATE APPLICATION', desc: 'Partner registers account, selects onboarding type (Company, Distributor, Franchisee), and initializes profile.' },
              { num: '02', title: 'COMPLETE CHECKLIST', desc: 'Dynamic blueprint generates exact compliance document checklist required for partner classification.' },
              { num: '03', title: 'UPLOAD DOCUMENTS', desc: 'Partner uploads required compliance files with instant file validation and replacement support.' },
              { num: '04', title: 'VERIFY', desc: 'Reviewer inspects documents in split workspace, either verifying items or requesting specific corrections.' },
              { num: '05', title: 'APPROVE', desc: 'Admin reviews verified checklist and grants final application approval to activate partner account.' }
            ].map((step, idx) => (
              <div key={idx} className={`p-4 border border-dark bg-white rounded-1 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 hover-lift animate-fade-in-up stagger-${idx + 1}`}>
                <div className="d-flex align-items-center gap-3">
                  <div className="ox-editorial-num text-dark" style={{ fontSize: '2rem', minWidth: 50 }}>{step.num}</div>
                  <div>
                    <h5 className="font-mono fw-bold text-dark text-uppercase mb-1" style={{ fontSize: '1rem' }}>{step.title}</h5>
                    <p className="text-secondary small mb-0" style={{ fontSize: '0.85rem' }}>{step.desc}</p>
                  </div>
                </div>
                <div className="font-mono text-uppercase small border border-dark px-3 py-1 bg-light text-nowrap align-self-start align-self-sm-center" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                  STAGE {step.num}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Workspaces Section */}
      <section id="roles" className="py-5 px-3 border-bottom border-dark bg-white">
        <div className="container max-w-6xl py-4">
          <div className="text-center mb-5 animate-fade-in-up">
            <div className="font-mono text-uppercase text-muted small fw-bold mb-2">ROLE-BASED WORKSPACES</div>
            <h2 className="ox-section-title mb-2">DEDICATED INTERFACES FOR EVERY ROLE</h2>
            <p className="font-mono text-muted small">
              EACH USER ROLE RECEIVES A FOCUSED WORKSPACE DESIGNED FOR THEIR SPECIFIC TASK.
            </p>
          </div>

          <div className="row g-4">
            {/* Partner */}
            <div className="col-md-4 animate-fade-in-up stagger-1">
              <div className="p-4 border border-dark h-100 bg-white d-flex flex-column justify-content-between hover-lift">
                <div>
                  <div className="font-mono fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                    ROLE 01
                  </div>
                  <h4 className="font-mono fw-bold text-dark uppercase mb-3">PARTNER</h4>
                  <p className="text-secondary small mb-4">
                    Guided onboarding journey interface. Progress indicators, document upload checklist, real-time reviewer feedback, and activity log.
                  </p>
                </div>
                <Link to="/register" className="btn btn-ox-black font-mono text-uppercase w-100 text-center hover-lift">
                  PARTNER REGISTRATION →
                </Link>
              </div>
            </div>

            {/* Reviewer */}
            <div className="col-md-4 animate-fade-in-up stagger-2">
              <div className="p-4 border border-dark h-100 bg-white d-flex flex-column justify-content-between hover-lift">
                <div>
                  <div className="font-mono fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                    ROLE 02
                  </div>
                  <h4 className="font-mono fw-bold text-dark uppercase mb-3">REVIEWER</h4>
                  <p className="text-secondary small mb-4">
                    Compliance action queue. Side-by-side document viewer, one-click document approval, and change request feedback tools.
                  </p>
                </div>
                <Link to="/login" className="btn btn-ox-white font-mono text-uppercase w-100 text-center hover-lift">
                  REVIEWER ACCESS →
                </Link>
              </div>
            </div>

            {/* Admin */}
            <div className="col-md-4 animate-fade-in-up stagger-3">
              <div className="p-4 border border-dark h-100 bg-dark text-white d-flex flex-column justify-content-between hover-lift">
                <div>
                  <div className="font-mono fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                    ROLE 03
                  </div>
                  <h4 className="font-mono fw-bold text-white uppercase mb-3">ADMIN</h4>
                  <p className="text-muted small mb-4">
                    Control center dashboard. Operational metrics, Blueprint management, checklist requirement CRUD, and final application approvals.
                  </p>
                </div>
                <Link to="/login" className="btn btn-ox-white font-mono text-uppercase w-100 text-center hover-lift">
                  ADMIN ACCESS →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-5 px-3 border-bottom border-dark" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container max-w-4xl py-4">
          <div className="text-center mb-5 animate-fade-in-up">
            <div className="font-mono text-uppercase text-muted small fw-bold mb-2">FREQUENTLY ASKED QUESTIONS</div>
            <h2 className="ox-section-title">EVERYTHING YOU NEED TO KNOW</h2>
          </div>

          <div className="d-flex flex-column gap-3">
            {[
              {
                q: 'What is ONBOARDX?',
                a: 'ONBOARDX is an enterprise partner onboarding and compliance approval platform. It organizes document verification, requirement blueprints, and multi-tier approval workflows into one structured system.'
              },
              {
                q: 'How do Master Blueprints work?',
                a: 'Admins create blueprint templates (e.g. Corporate Vendor, Regional Distributor, Franchisee) defining required compliance documents. When a partner starts an application, their checklist is automatically generated from the active blueprint.'
              },
              {
                q: 'Can partners replace rejected documents?',
                a: 'Yes! When a reviewer flags a document with feedback notes, the partner receives a clear notification and can immediately re-upload a replacement file from their checklist dashboard.'
              },
              {
                q: 'How is data security enforced?',
                a: 'ONBOARDX enforces strict Role-Based Access Control (RBAC). Partners only see their own applications and uploaded files, Reviewers access assigned verification queues, and Admins oversee governance and final approvals.'
              }
            ].map((item, idx) => (
              <div key={idx} className="border border-dark bg-white rounded-1 overflow-hidden hover-glow">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-100 text-start p-4 bg-white border-0 font-mono fw-bold text-dark d-flex justify-content-between align-items-center"
                  style={{ fontSize: '0.95rem' }}
                >
                  <span>{item.q}</span>
                  <span className="fs-5">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="p-4 pt-0 font-mono text-secondary small border-top border-subtle">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-5 px-3 text-center border-bottom border-dark" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
        <div className="container max-w-4xl py-4 animate-fade-in-up">
          <h2 className="ox-display-title mb-3 text-white" style={{ fontSize: '2.5rem' }}>
            READY TO STREAMLINE PARTNER ONBOARDING?
          </h2>
          <p className="font-mono text-light mb-4 mx-auto" style={{ color: '#E4E4E7', maxWidth: 620, fontSize: '1.05rem', lineHeight: 1.6 }}>
            Experience streamlined partner registration, dynamic blueprints, and verification workflows in ONBOARDX.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link to="/register" className="btn btn-ox-white btn-lg font-mono text-uppercase px-4 py-3 hover-lift">
              START ONBOARDING NOW →
            </Link>
            <Link to="/login" className="btn btn-ox-outline btn-lg font-mono text-uppercase px-4 py-3 text-white border-white hover-lift">
              LOGIN TO ACCOUNT
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-5 px-4 border-top border-dark bg-white font-mono small">
        <div className="container max-w-6xl">
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-5">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  className="d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: 24, height: 24, backgroundColor: '#000000', borderRadius: '2px', fontSize: '0.75rem' }}
                >
                  ●
                </div>
                <span className="fw-bold text-dark h6 mb-0">ONBOARDX</span>
              </div>
              <p className="text-secondary small mb-0" style={{ maxWidth: 360 }}>
                Smart Partner Onboarding & Approval System. Stage-gated compliance workflow engine.
              </p>
            </div>

            <div className="col-6 col-md-3">
              <div className="fw-bold text-dark text-uppercase mb-2" style={{ fontSize: '0.75rem' }}>PRODUCT</div>
              <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-0">
                <li><button onClick={() => scrollToSection('features')} className="btn btn-link p-0 text-secondary text-decoration-none small hover-scale">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="btn btn-link p-0 text-secondary text-decoration-none small hover-scale">How It Works</button></li>
                <li><button onClick={() => scrollToSection('roles')} className="btn btn-link p-0 text-secondary text-decoration-none small hover-scale">Roles</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="btn btn-link p-0 text-secondary text-decoration-none small hover-scale">FAQ</button></li>
              </ul>
            </div>

            <div className="col-6 col-md-2">
              <div className="fw-bold text-dark text-uppercase mb-2" style={{ fontSize: '0.75rem' }}>ACCESS</div>
              <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-0">
                <li><Link to="/login" className="text-secondary text-decoration-none hover-scale">Login</Link></li>
                <li><Link to="/register" className="text-secondary text-decoration-none hover-scale">Register Partner</Link></li>
              </ul>
            </div>

            <div className="col-6 col-md-2">
              <div className="fw-bold text-dark text-uppercase mb-2" style={{ fontSize: '0.75rem' }}>LEGAL & SUPPORT</div>
              <ul className="list-unstyled d-flex flex-column gap-2 small text-muted mb-0">
                <li><Link to="/privacy" className="text-secondary text-decoration-none hover-scale">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-secondary text-decoration-none hover-scale">Terms of Service</Link></li>
                <li><Link to="/contact" className="text-secondary text-decoration-none hover-scale">Contact Support</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-4 border-top border-subtle d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
            <div>© 2026 ONBOARDX. All rights reserved.</div>
            <div>STRICT MONOCHROME WORKFLOW SYSTEM</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingHome;
