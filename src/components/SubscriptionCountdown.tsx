import React from 'react';
import { Clock, Calendar, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/useSubscription';
import { useCustomAuth } from '@/hooks/useCustomAuth';

const SubscriptionCountdown = () => {
  const { subscription, loading, getSubscriptionStatus, isSubscriptionActive } = useSubscription();
  const { team, user } = useCustomAuth();

  if (loading || !team) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3">
        <div className="flex justify-center items-center">
          <Clock className="w-4 h-4 animate-spin mr-2" />
          <span>載入訂閱狀態...</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <XCircle className="w-5 h-5 text-red-300" />
            <span className="font-medium">
              {team.name} - 未啟用訂閱
            </span>
          </div>
          <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-gray-800">
            <CreditCard className="w-4 h-4 mr-1" />
            啟用服務
          </Button>
        </div>
      </div>
    );
  }

  const status = getSubscriptionStatus();
  const daysRemaining = subscription.days_remaining || 0;
  const isActive = isSubscriptionActive();

  const getGradientColor = () => {
    switch (status.status) {
      case 'expired':
        return 'from-red-600 to-red-800';
      case 'warning':
        return 'from-red-500 to-orange-600';
      case 'attention':
        return 'from-yellow-500 to-orange-500';
      case 'active':
      default:
        return 'from-blue-600 to-purple-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-300" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-300" />;
      case 'attention':
        return <Clock className="w-5 h-5 text-yellow-300" />;
      case 'active':
      default:
        return <CheckCircle className="w-5 h-5 text-green-300" />;
    }
  };

  const formatEndDate = (subscription: any) => {
    if (!subscription.subscription_start) return '未設置';
    
    const startDate = new Date(subscription.subscription_start);
    const endDate = new Date(startDate.getTime() + (subscription.total_days_purchased * 24 * 60 * 60 * 1000));
    
    return endDate.toLocaleDateString('zh-TW');
  };

  return (
    <>
      <div className={`bg-gradient-to-r ${getGradientColor()} text-white px-6 py-3`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <span className="font-medium">
                {team.name} 訂閱狀態
              </span>
              <div className="text-xs opacity-90">
                {status.message}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* 剩餘天數顯示 */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <div className="text-right">
                <div className={`font-bold text-xl ${
                  daysRemaining <= 0 ? 'text-red-300' : 
                  daysRemaining <= 7 ? 'text-yellow-300' : 
                  daysRemaining <= 30 ? 'text-yellow-200' : 
                  'text-green-300'
                }`}>
                  {daysRemaining}
                </div>
                <div className="text-xs opacity-90">
                  天剩餘
                </div>
              </div>
            </div>
            
            {/* 預計到期日期 */}
            <div className="text-sm opacity-90 text-right hidden sm:block">
              <div>預計到期</div>
              <div className="font-medium">
                {formatEndDate(subscription)}
              </div>
            </div>
            
            {/* 使用統計 */}
            <div className="text-sm opacity-90 text-right hidden md:block">
              <div>已用/總計</div>
              <div className="font-medium">
                {subscription.total_days_used}/{subscription.total_days_purchased} 天
              </div>
            </div>
            
            {/* 續費按鈕 */}
            {(daysRemaining <= 30 || !isActive) && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-white text-white hover:bg-white hover:text-purple-600"
                onClick={() => {
                  // TODO: 實現續費功能
                  alert('續費功能開發中...');
                }}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                續費
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* 警告訊息 */}
      {daysRemaining <= 7 && daysRemaining > 0 && (
        <Alert className="mx-6 mt-2 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>注意：</strong>您的訂閱將在 {daysRemaining} 天後到期！
            請及時續費以避免服務中斷。
          </AlertDescription>
        </Alert>
      )}
      
      {/* 到期訊息 */}
      {daysRemaining <= 0 && (
        <Alert className="mx-6 mt-2 bg-red-50 border-red-200">
          <XCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>訂閱已到期：</strong>所有功能已暫停使用！
            請聯絡管理員或續費以恢復服務。
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default SubscriptionCountdown;