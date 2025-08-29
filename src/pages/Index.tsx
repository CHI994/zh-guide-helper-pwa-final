import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, Users, Search, Zap, Trophy, Home, Coins, Gem, Megaphone, Crown, AlertCircle, User } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { BasicSettingsDialog } from "@/components/BasicSettingsDialog";
import SubscriptionCountdown from "@/components/SubscriptionCountdown";

const Index = () => {
  const { user, profile, team, userRole, loading, logout } = useCustomAuth();
  const { hasPermission } = usePermissions();
  
  // 調試信息
  console.log("🔍 Index 頁面當前用戶信息:", {
    userId: user?.id,
    username: user?.username,
    profileId: profile?.id,
    userRole: userRole,
    teamName: team?.name
  });
  const navigate = useNavigate();
  const [showBasicSettings, setShowBasicSettings] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  // Show a simplified welcome for users without profile data
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Crown className="w-20 h-20 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            歡迎加入鑽石拍賣系統！
          </h1>
          <p className="text-slate-600 mb-4">
            正在設置您的帳戶資料，請稍候...
          </p>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate("/auth");
            }}
          >
            重新登入
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
      {/* Subscription Countdown Bar */}
      <SubscriptionCountdown />
      
      <div className="flex">
        {/* Left Sidebar */}
      <div className="w-64 bg-slate-700 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-600">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              🎮
            </div>
            <div>
              <div className="font-bold text-sm">遊戲團隊管理系統</div>
              <div className="text-xs text-slate-300">拍賣流程管理 v2.0</div>
            </div>
          </div>
          <div className="text-xs text-slate-300">
            系統時間：{new Date().toLocaleString('zh-TW')}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
        <div className="space-y-2">
          <div className="text-slate-400 text-xs font-semibold mb-3">團隊管理</div>
          
          {hasPermission('announcements') && (
            <button 
              onClick={() => navigate("/announcements")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Megaphone className="w-4 h-4 text-red-400" />
              <span className="text-sm">團隊公告</span>
            </button>
          )}
          
          {hasPermission('treasure') && (
            <button 
              onClick={() => navigate("/treasure")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Gem className="w-4 h-4 text-cyan-400" />
              <span className="text-sm">寶物登記</span>
            </button>
          )}
          
          {hasPermission('pending') && (
            <button 
              onClick={() => navigate("/pending")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">等待上架</span>
            </button>
          )}
          
          {hasPermission('auction') && (
            <button 
              onClick={() => navigate("/auction")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Search className="w-4 h-4 text-blue-400" />
              <span className="text-sm">拍賣場</span>
            </button>
          )}
          
          {hasPermission('completed') && (
            <button 
              onClick={() => navigate("/completed")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm">交易完成</span>
            </button>
          )}
          
          {hasPermission('unsold') && (
            <button 
              onClick={() => navigate("/unsold")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm">流標區</span>
            </button>
          )}
          
          {hasPermission('account-inquiry') && (
            <button 
              onClick={() => navigate("/account-inquiry")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Search className="w-4 h-4 text-indigo-400" />
              <span className="text-sm">入帳備查區</span>
            </button>
          )}
          
          {hasPermission('audit') && (
            <button 
              onClick={() => navigate("/audit")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <span className="text-sm">🔍 審核</span>
            </button>
          )}
          
          {hasPermission('wallet') && (
            <button 
              onClick={() => navigate("/wallet")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm">我的錢包</span>
            </button>
          )}

          {hasPermission('profile') && (
            <button 
              onClick={() => navigate("/profile")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-sm">個人資訊</span>
            </button>
          )}

          {hasPermission('public-fund') && (
            <button 
              onClick={() => navigate("/public-fund")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm">🏛️ 公基金明細</span>
            </button>
          )}

          {(hasPermission('announcement-settings') || hasPermission('basic-settings') || hasPermission('account-settings')) && (
            <div className="text-slate-400 text-xs font-semibold mb-3 mt-6">系統設定</div>
          )}
          
          {hasPermission('announcement-settings') && (
            <button 
              onClick={() => navigate("/announcement-settings")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <span className="text-sm">🌟 公告設定</span>
            </button>
          )}
          
          {hasPermission('basic-settings') && (
            <button 
              onClick={() => setShowBasicSettings(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <span className="text-sm">🔧 基本設定</span>
            </button>
          )}
          
          {hasPermission('account-settings') && (
            <button 
              onClick={() => navigate("/account-settings")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <span className="text-sm">👤 帳號設定</span>
            </button>
          )}

          {hasPermission('public-fund-manager') && (
            <button 
              onClick={() => navigate("/public-fund-manager")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <span className="text-sm">🏛️ 公基金收入支出</span>
            </button>
          )}

          {user?.is_super_admin && (
            <button 
              onClick={() => navigate("/subscription-manager")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-left"
            >
              <span className="text-sm">⏰ 訂閱管理</span>
            </button>
          )}
        </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-600">
          <div className="text-xs text-slate-300 mb-1">
            團隊：{loading ? "載入中..." : (team?.name || "未分配團隊")}
          </div>
          <div className="text-xs text-slate-300 mb-1">
            用戶：{user?.username || "未登入"}
          </div>
          <div className="text-xs text-slate-300 mb-3">
            身分：{userRole || "未設定"}
          </div>
          <Button
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => {
              logout();
              navigate("/auth");
            }}
          >
            登出
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800">
          {/* Floating Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
          
          {/* Gradient Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
          {/* Logo and Title Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-6 shadow-2xl">
              <Crown className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              遊戲團隊管理系統
            </h1>
            
            <p className="text-xl text-slate-300 mb-2 opacity-80">
              拍賣流程管理平台
            </p>
            
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm">系統運行正常</span>
              <div className="text-xs ml-4">v2.0</div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">團隊管理</div>
                  <div className="text-sm text-slate-400">多角色權限系統</div>
                </div>
              </div>
            </div>

            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">拍賣系統</div>
                  <div className="text-sm text-slate-400">智能競價管理</div>
                </div>
              </div>
            </div>

            <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Gem className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">寶物管理</div>
                  <div className="text-sm text-slate-400">完整追蹤記錄</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current User Info Card */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl w-full text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-left">
                <div className="text-xl font-semibold text-white">{user?.username}</div>
                <div className="text-sm text-purple-300">{userRole}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <div className="text-slate-400 text-sm">所屬團隊</div>
                <div className="text-white font-medium">
                  {loading ? (
                    <div className="animate-pulse h-5 bg-slate-600 rounded w-20"></div>
                  ) : (
                    team?.name || "未分配團隊"
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-sm">登入時間</div>
                <div className="text-white font-medium">{new Date().toLocaleTimeString('zh-TW')}</div>
              </div>
            </div>
            
            {/* 調試工具 */}
            <div className="mt-4 p-3 bg-black/20 rounded-lg">
              <div className="text-xs text-slate-400 mb-2">調試信息</div>
              <div className="text-xs text-white space-y-1">
                <div>User Role: {userRole || '無'}</div>
                <div>Profile ID: {profile?.id || '無'}</div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const memberRoles = JSON.parse(localStorage.getItem('memberRoles') || '{}');
                    console.log('📝 本地存儲角色:', memberRoles);
                    console.log('👤 當前用戶 profile.id:', profile?.id);
                    console.log('🎭 當前角色:', userRole);
                  }}
                  className="mt-2 text-xs"
                >
                  檢查角色狀態
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Hint */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm mb-2">使用左側選單開始管理</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      </div>
      </div>

      <BasicSettingsDialog 
        open={showBasicSettings} 
        onOpenChange={setShowBasicSettings} 
      />
    </div>
  );
};

export default Index;