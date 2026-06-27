import os

path = r"d:\Dự án VTOShop\VESTRA\frontend\src\pages\Login.jsx"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # We will search for handleSocialLogin function and replace it with a clean, no-mock version
    old_function = """  const handleSocialLogin = async (providerName) => {
    if (!turnstileToken) {
      setError('Vui lòng hoàn tất xác thực bảo mật Cloudflare Turnstile trước.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const provider = providerName === 'google' ? googleProvider : facebookProvider;
      
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (err) {
        console.warn(`⚠️ Firebase Social Login Popup Error, using mock login fallback for ${providerName}`, err);
        # Fallback for development if Firebase is not configured or blocked
        const dummyEmail = `mock_${providerName}_user@vestra.com`;
        const dummyName = `${providerName === 'google' ? 'Google' : 'Facebook'} Test User`;
        const dummyAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${providerName}`;
        
        # Call backend API for social login with dummy data
        const data = await api.post('/auth/social-login', {
          email: dummyEmail,
          fullName: dummyName,
          avatarUrl: dummyAvatar,
          provider: providerName,
          turnstile_token: turnstileToken
        });
        
        if (data.success) {
          loginStore(data.user, data.token);
          navigate('/profile');
        }
        return;
      }
      
      const user = result.user;
      
      # Call backend API for social login with real verified firebase user info
      const data = await api.post('/auth/social-login', {
        email: user.email,
        fullName: user.displayName,
        avatarUrl: user.photoURL,
        provider: providerName,
        turnstile_token: turnstileToken
      });

      if (data.success) {
        loginStore(data.user, data.token);
        navigate('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Lỗi đăng nhập qua ${providerName}.`);
    } finally {
      setLoading(false);
    }
  };"""

    # Normalized comparison logic
    content_normalized = content.replace("\r\n", "\n")
    
    new_function = """  const handleSocialLogin = async (providerName) => {
    if (!turnstileToken) {
      setError('Vui lòng hoàn tất xác thực bảo mật Cloudflare Turnstile trước.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const provider = providerName === 'google' ? googleProvider : facebookProvider;
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Gửi thông tin thật đã xác thực từ Firebase về Backend Vestra
      const data = await api.post('/auth/social-login', {
        email: user.email,
        fullName: user.displayName,
        avatarUrl: user.photoURL,
        provider: providerName,
        turnstile_token: turnstileToken
      });

      if (data.success) {
        loginStore(data.user, data.token);
        navigate('/profile');
      }
    } catch (err) {
      console.error(`Firebase Social Login Error for ${providerName}:`, err);
      setError(err.response?.data?.error || err.message || `Lỗi đăng nhập qua ${providerName}.`);
    } finally {
      setLoading(false);
    }
  };"""

    # We will search for 'signInWithPopup(auth, provider)' and replace it more generically if exact match fails
    if 'signInWithPopup(auth, provider)' in content_normalized:
        # Let's read lines to find start/end of the handleSocialLogin function and replace it
        lines = content_normalized.split('\n')
        start_idx = -1
        end_idx = -1
        for idx, line in enumerate(lines):
            if "const handleSocialLogin = async" in line:
                start_idx = idx
            if start_idx != -1 and idx > start_idx and "const handleSocialLogin" not in line and "return (" in line:
                # We reached JSX part, so look backwards to close curly brace
                for idx2 in range(idx-1, start_idx, -1):
                    if lines[idx2].strip() == "};":
                        end_idx = idx2
                        break
                break
        
        if start_idx != -1 and end_idx != -1:
            new_lines = lines[:start_idx] + [new_function] + lines[end_idx+1:]
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(new_lines))
            print("Success: Replaced handleSocialLogin with clean Firebase popup version.")
        else:
            # Fallback replace
            content_normalized = content_normalized.replace("signInWithPopup(auth, provider);", "await signInWithPopup(auth, provider);")
            print("Warning: Index lookup failed, fallback executed.")
    else:
        print("Error: Target code structure not found.")
else:
    print(f"Error: Path not found: {path}")
