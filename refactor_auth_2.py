import os

files_to_update = [
    'frontend/src/pages/Login.jsx',
    'frontend/src/pages/Register.jsx',
    'frontend/src/pages/ForgotPassword.jsx',
    'frontend/src/pages/ResetPassword.jsx',
    'frontend/src/pages/VerifyEmail.jsx',
    'frontend/src/pages/ResendVerification.jsx',
    'frontend/src/pages/Landing.jsx'
]

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic replaces for the wrapper backgrounds
    content = content.replace(
        "style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: \"'Inter',sans-serif\", position: 'relative', overflow: 'hidden' }}",
        "className=\"min-h-screen bg-parchment text-ink flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans\""
    )
    content = content.replace(
        "style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#0f766e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: \"'Inter',sans-serif\", position: 'relative', overflow: 'hidden' }}",
        "className=\"min-h-screen bg-parchment text-ink flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans\""
    )

    # For Login and Register
    content = content.replace(
        "style={{\n      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',\n      padding: '40px 16px', fontFamily: \"'Inter',sans-serif\", position: 'relative', overflow: 'hidden',\n      background: 'linear-gradient(135deg, #0f172a 0%, #0d1b2a 25%, #1a1a2e 50%, #16213e 75%, #0f3460 100%)'\n    }}",
        "className=\"min-h-screen bg-parchment text-ink flex items-center justify-center p-4 relative overflow-hidden font-sans\""
    )

    # For Landing
    content = content.replace(
        "style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 40%,#0f766e 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}",
        "className=\"min-h-screen bg-parchment text-ink flex items-center relative overflow-hidden font-sans\""
    )

    # Convert dark translucent card background to solid white card matching the dashboard
    content = content.replace(
        "background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)'",
        "background: '#ffffff', border: '1px solid #e2e8f0'"
    )

    content = content.replace(
        "background: '#fff'",
        "background: '#ffffff'" # Normalized so we don't accidentally match it below if we wanted to
    )

    # The rest of dark theme elements inside Login/Register
    content = content.replace("color: '#fff'", "color: '#1e293b'") # Title colors
    content = content.replace("color: 'rgba(167, 243, 208, 0.8)'", "color: '#64748b'")
    content = content.replace("color: 'rgba(255, 255, 255, 0.35)'", "color: '#94a3b8'")
    content = content.replace("background: 'rgba(255, 255, 255, 0.12)'", "background: '#e2e8f0'")
    content = content.replace("border: '1px solid rgba(255, 255, 255, 0.15)'", "border: 'none'")
    
    # Inputs
    content = content.replace("background: 'rgba(255, 255, 255, 0.05)'", "background: '#f8fafc'")
    content = content.replace("border: '1px solid rgba(255, 255, 255, 0.2)'", "border: '1px solid #cbd5e1'")

    # Google Modal Buttons
    content = content.replace("background: 'rgba(255, 255, 255, 0.1)'", "background: '#f1f5f9'")
    content = content.replace("background: 'rgba(255, 255, 255, 0.15)'", "background: '#e2e8f0'")
    content = content.replace("border: '1px solid rgba(255, 255, 255, 0.2)'", "border: '1px solid #cbd5e1'")

    # Primary colors
    content = content.replace("linear-gradient(135deg, #059669, #0d9488)", "#849b87")
    content = content.replace("linear-gradient(135deg,#059669,#0d9488)", "#849b87")
    content = content.replace("linear-gradient(90deg, #34d399, #6ee7b7)", "#849b87")
    content = content.replace("color: '#34d399'", "color: '#849b87'")

    # Box shadows that look weird on light theme
    content = content.replace("boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'", "boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
