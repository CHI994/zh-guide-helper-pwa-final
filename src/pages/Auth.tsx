import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
// Select 組件已移除，改為手動輸入團隊名稱
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Facebook, MessageCircle, Home, Crown } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";

// 系統已改為支援任意團隊名稱的手動輸入模式

const Auth = () => {
  const [teamName, setTeamName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useCustomAuth();
  const [searchParams] = useSearchParams();

  // 處理 URL 參數預填
  useEffect(() => {
    const teamFromUrl = searchParams.get('team');
    const usernameFromUrl = searchParams.get('username');
    
    if (teamFromUrl) {
      setTeamName(teamFromUrl);
    }
    
    if (usernameFromUrl) {
      setUsername(usernameFromUrl);
      
      // 如果是 GM001，自動填入密碼
      if (usernameFromUrl === 'GM001') {
        setPassword('32903290');
        
        // 如果團隊和用戶名都有，可以考慮自動登入
        if (teamFromUrl) {
          toast({
            title: "檢測到團隊切換",
            description: `正在為您切換到團隊「${teamFromUrl}」`,
          });
          
          // 延遲自動登入，讓用戶看到提示
          setTimeout(async () => {
            try {
              setLoading(true);
              const result = await login(teamFromUrl, 'GM001', '32903290');
              
              if (result.success) {
                navigate('/');
              } else {
                toast({
                  title: "登入失敗",
                  description: result.error || "登入時發生錯誤",
                  variant: "destructive",
                });
              }
            } catch (error: any) {
              toast({
                title: "登入失敗",
                description: error.message || "登入時發生錯誤",
                variant: "destructive",
              });
            } finally {
              setLoading(false);
            }
          }, 1500);
        }
      }
    }
  }, [searchParams, login, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim() || !username.trim() || !password.trim()) {
      toast({
        title: "登入失敗",
        description: "請填寫團隊名稱、帳號和密碼",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // 直接使用手動輸入的團隊名稱
      const result = await login(teamName.trim(), username.trim(), password);
      
      if (result.success) {
        toast({
          title: "登入成功",
          description: `歡迎，${username}！`,
        });
        navigate("/");
      } else {
        toast({
          title: "登入失敗",
          description: result.error || "帳號或密碼錯誤",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("登入過程錯誤:", error);
      toast({
        title: "系統錯誤",
        description: "請稍後再試或聯繫管理員",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with Mascot */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
            <Crown className="w-20 h-20 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            公會管理助手
          </h1>
          <p className="text-lg text-slate-600 mb-1">
            線上遊戲分鑽系統
          </p>
          <p className="text-sm text-slate-500 bg-slate-100 rounded-lg p-3 mt-4">
            本系統須註冊才能使用，相關資料請詢問您的團隊主事。
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Team Name Input */}
              <div className="space-y-2">
                <Label htmlFor="team" className="text-sm font-medium text-slate-700">
                  團隊名稱 <span className="text-red-500">*必填</span>
                </Label>
                <Input
                  id="team"
                  type="text"
                  placeholder="請輸入團隊名稱"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="h-12"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 提示：團隊名稱需與管理員提供的名稱完全一致
                </p>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                  帳號 <span className="text-red-500">*必填</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="請輸入帳號"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  密碼 <span className="text-red-500">*必填</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  onClick={() => toast({ 
                    title: "聯繫管理員", 
                    description: "請聯繫您的團隊管理員重設密碼" 
                  })}
                >
                  忘記登入？
                </button>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? "登入中..." : "登入"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center space-x-8">
          <a href="#" className="flex flex-col items-center text-blue-600 hover:text-blue-700">
            <Facebook className="w-6 h-6 mb-1" />
            <span className="text-xs">Facebook</span>
            <span className="text-xs">官方粉絲團</span>
          </a>
          <a href="#" className="flex flex-col items-center text-green-600 hover:text-green-700">
            <MessageCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">與我們聯繫</span>
          </a>
          <a href="#" className="flex flex-col items-center text-amber-600 hover:text-amber-700">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">官網 & 登錄</span>
            <span className="text-xs">官方網站</span>
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Copyright Diamond-System © 2025 Ver.2025.8.21.1
        </div>
      </div>
    </div>
  );
};

export default Auth;