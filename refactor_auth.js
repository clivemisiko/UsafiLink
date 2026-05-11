const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'frontend/src/pages/Login.jsx',
    'frontend/src/pages/Register.jsx',
    'frontend/src/pages/ForgotPassword.jsx',
    'frontend/src/pages/ResetPassword.jsx',
    'frontend/src/pages/VerifyEmail.jsx',
    'frontend/src/pages/ResendVerification.jsx',
    'frontend/src/pages/Landing.jsx'
];

for (const filepath of filesToUpdate) {
    if (!fs.existsSync(filepath)) continue;

    let content = fs.readFileSync(filepath, 'utf-8');

    // Remove the wrapper dark backgrounds entirely and replace with Tailwind classes
    content = content.replace(
        /style=\{\{\s*minHeight:\s*'100vh',?\s*background:\s*'linear-gradient[^']*',?\s*display:\s*'flex',?\s*flexDirection:\s*'column',?\s*alignItems:\s*'center',?\s*justifyContent:\s*'center',?\s*padding:\s*'40px 16px',?\s*fontFamily:\s*"'Inter',sans-serif",?\s*position:\s*'relative',?\s*overflow:\s*'hidden'\s*\}\}/g,
        'className="min-h-screen bg-parchment text-ink flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans"'
    );
    
    // Same for others without flexDirection
    content = content.replace(
        /style=\{\{\s*minHeight:\s*'100vh',?\s*background:\s*'linear-gradient[^']*',?\s*display:\s*'flex',?\s*alignItems:\s*'center',?\s*justifyContent:\s*'center',?\s*padding:\s*'40px 16px',?\s*fontFamily:\s*"'Inter',sans-serif",?\s*position:\s*'relative',?\s*overflow:\s*'hidden'\s*\}\}/g,
        'className="min-h-screen bg-parchment text-ink flex items-center justify-center p-4 relative overflow-hidden font-sans"'
    );

    // Login and Register
    content = content.replace(
        /style=\{\{\s*minHeight:\s*'100vh',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*justifyContent:\s*'center',\s*padding:\s*'40px 16px',\s*fontFamily:\s*"'Inter',sans-serif",\s*position:\s*'relative',\s*overflow:\s*'hidden',\s*background:\s*'linear-gradient[^']*'\s*\}\}/g,
        'className="min-h-screen bg-parchment text-ink flex items-center justify-center p-4 relative overflow-hidden font-sans"'
    );

    // Landing
    content = content.replace(
        /style=\{\{\s*background:\s*'linear-gradient[^']*',\s*minHeight:\s*'100vh',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*position:\s*'relative',\s*overflow:\s*'hidden'\s*\}\}/g,
        'className="min-h-screen bg-parchment text-ink flex items-center relative overflow-hidden font-sans"'
    );

    // Card background
    content = content.replace(
        /background:\s*'rgba\(255, 255, 255, 0\.08\)',\s*backdropFilter:\s*'blur\(20px\)'/g,
        "background: '#ffffff'"
    );

    // Colors
    content = content.replace(/color:\s*'#fff'/g, "color: '#1e293b'");
    content = content.replace(/color:\s*'rgba\(167, 243, 208, 0\.8\)'/g, "color: '#64748b'");
    content = content.replace(/color:\s*'rgba\(255, 255, 255, 0\.35\)'/g, "color: '#94a3b8'");
    content = content.replace(/background:\s*'rgba\(255, 255, 255, 0\.12\)'/g, "background: '#e2e8f0'");
    content = content.replace(/border:\s*'1px solid rgba\(255, 255, 255, 0\.15\)'/g, "border: 'none'");
    
    // Inputs
    content = content.replace(/background:\s*'rgba\(255, 255, 255, 0\.05\)'/g, "background: '#f8fafc'");
    content = content.replace(/border:\s*'1px solid rgba\(255, 255, 255, 0\.2\)'/g, "border: '1px solid #cbd5e1'");

    // Google Modal Buttons
    content = content.replace(/background:\s*'rgba\(255, 255, 255, 0\.1\)'/g, "background: '#f1f5f9'");
    content = content.replace(/background:\s*'rgba\(255, 255, 255, 0\.15\)'/g, "background: '#e2e8f0'");

    // Primary colors
    content = content.replace(/linear-gradient\(135deg,\s*#059669,\s*#0d9488\)/g, "#849b87");
    content = content.replace(/linear-gradient\(135deg,#059669,#0d9488\)/g, "#849b87");
    content = content.replace(/linear-gradient\(90deg,\s*#34d399,\s*#6ee7b7\)/g, "#849b87");
    content = content.replace(/color:\s*'#34d399'/g, "color: '#849b87'");

    content = content.replace(/boxShadow:\s*'0 8px 32px rgba\(0, 0, 0, 0\.3\)'/g, "boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'");

    // Fix the logo "Link" text gradient override
    content = content.replace(
        /background:\s*'#849b87',\s*WebkitBackgroundClip:\s*'text',\s*WebkitTextFillColor:\s*'transparent'/g,
        "color: '#849b87'"
    );

    // Write back
    fs.writeFileSync(filepath, content, 'utf-8');
}

console.log('Done');
