import React from 'react';
import { XCircle, Clock, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useNavigate } from 'react-router-dom';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
  allowExpired?: boolean; // 是否允許到期用戶訪問（只讀模式）
  requiredDays?: number;  // 需要的最少剩餘天數
}

const SubscriptionProtectedRoute: React.FC<SubscriptionProtectedRouteProps> = ({
  children,
  allowExpired = false,
  requiredDays = 0
}) => {
  const { subscription, loading, isSubscriptionActive } = useSubscription();
  const { team, user } = useCustomAuth();
  const navigate = useNavigate();

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white">檢查訂閱狀態中...</p>
        </div>
      </div>
    );
  }

  const daysRemaining = subscription?.days_remaining || 0;
  const isActive = isSubscriptionActive();

  // 訂閱已到期且不允許訪問
  if (!isActive && !allowExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full bg-slate-800/90 border-red-500/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-white mb-2">
              訂閱已到期
            </CardTitle>
            <p className="text-slate-300">
              {team?.name} 的訂閱服務已到期，無法使用系統功能
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-300 font-medium">服務已暫停</span>
              </div>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• 所有拍賣功能已停用</li>
                <li>• 錢包和資金管理功能已鎖定</li>
                <li>• 團隊設定和管理功能不可用</li>
                <li>• 僅可查看歷史記錄（只讀模式）</li>
              </ul>
            </div>

            {subscription && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">團隊名稱:</span>
                    <div className="text-white font-medium">{subscription.team_name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">剩餘天數:</span>
                    <div className="text-red-400 font-bold">{daysRemaining} 天</div>
                  </div>
                  <div>
                    <span className="text-slate-400">總購買:</span>
                    <div className="text-white">{subscription.total_days_purchased} 天</div>
                  </div>
                  <div>
                    <span className="text-slate-400">已使用:</span>
                    <div className="text-white">{subscription.total_days_used} 天</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1 border-slate-500 text-slate-300 hover:bg-slate-700"
              >
                返回首頁
              </Button>
              <Button
                onClick={() => {
                  // TODO: 實現續費功能
                  alert('請聯絡管理員進行續費操作');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                聯絡續費
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 剩餘天數不足警告（但仍可使用）
  if (isActive && requiredDays > 0 && daysRemaining <= requiredDays) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
        <Alert className="m-6 bg-yellow-500/10 border-yellow-500/50">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            <strong>注意：</strong>您的訂閱剩餘 {daysRemaining} 天，
            建議及時續費以確保服務不中斷。
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // 訂閱有效，正常顯示內容
  return <>{children}</>;
};

export default SubscriptionProtectedRoute;