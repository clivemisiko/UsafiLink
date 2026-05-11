import os
import re

files_to_update = [
    'frontend/src/pages/Login.jsx',
    'frontend/src/pages/Register.jsx',
    'frontend/src/pages/ForgotPassword.jsx',
    'frontend/src/pages/ResetPassword.jsx',
    'frontend/src/pages/VerifyEmail.jsx',
    'frontend/src/pages/ResendVerification.jsx',
    'frontend/src/pages/Landing.jsx'
]

# The goal is to replace the hardcoded inline dark mode styles with Tailwind classes.
for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace root wrapper dark background with bg-parchment text-ink
    content = re.sub(
        r"style=\{\{\s*minHeight:\s*'100vh',\s*display:\s*'flex',.*?(?:background:\s*'linear-gradient\([^)]+\)'.*?|.*?background:\s*'linear-gradient\([^)]+\)')\}\}",
        r'className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-parchment text-ink font-sans"',
        content,
        flags=re.DOTALL
    )

    # For Landing.jsx, the hero section has it
    content = re.sub(
        r"style=\{\{\s*background:\s*'linear-gradient\([^)]+\)',\s*minHeight:\s*'100vh',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*position:\s*'relative',\s*overflow:\s*'hidden'\s*\}\}",
        r'className="min-h-screen flex items-center relative overflow-hidden bg-parchment text-ink"',
        content,
        flags=re.DOTALL
    )

    # Replace the dark translucent card background with a solid white card matching the dashboard
    content = re.sub(
        r"background:\s*'rgba\(255,\s*255,\s*255,\s*0\.08\)',\s*backdropFilter:\s*'blur\(20px\)'",
        r"background: '#ffffff'",
        content
    )
    content = re.sub(
        r"border:\s*'1px solid rgba\(255,\s*255,\s*255,\s*0\.15\)'",
        r"border: '1px solid #e2e8f0'",
        content
    )
    
    # Replace the texts that are #fff with text-ink
    content = re.sub(r"color:\s*'#fff'", r"color: '#1e293b'", content)
    
    # Replace rgba(167, 243, 208, 0.8) and similar light greens with slate-500
    content = re.sub(r"color:\s*'rgba\(167,\s*243,\s*208,\s*0\.[0-9]+\)'", r"color: '#64748b'", content)
    content = re.sub(r"color:\s*'rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)'", r"color: '#64748b'", content)

    # Replace input background/borders
    content = re.sub(r"background:\s*'rgba\(255,\s*255,\s*255,\s*0\.05\)'", r"background: '#f8fafc'", content)
    content = re.sub(r"border:\s*'1px solid rgba\(255,\s*255,\s*255,\s*0\.2\)'", r"border: '1px solid #cbd5e1'", content)
    
    # Replace the buttons/gradients with sage background
    content = re.sub(r"background:\s*'linear-gradient\(135deg,\s*#059669,\s*#0d9488\)'", r"background: '#849b87'", content) # sage color
    content = re.sub(r"background:\s*'linear-gradient\(135deg,\s*#059669,\s*#0d9488\)'", r"background: '#849b87'", content)
    
    # Text fill transparent for the gradient text
    content = re.sub(r"background:\s*'linear-gradient\(90deg,\s*#34d399,\s*#6ee7b7\)'", r"background: '#849b87'", content)

    # Some box shadows
    content = re.sub(r"boxShadow:\s*'0 8px 24px rgba\(5,\s*150,\s*105,\s*0\.[0-9]+\)'", r"boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
