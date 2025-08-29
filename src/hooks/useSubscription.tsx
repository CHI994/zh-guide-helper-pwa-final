import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from './useCustomAuth';

interface SubscriptionData {
  id: string;
  team_id: string;
  team_name: string;
  is_active: boolean;
  days_remaining: number;
  subscription_start: string;
  subscription_end?: string;
  last_countdown_update: string;
  total_days_purchased: number;
  total_days_used: number;
  created_at: string;
  updated_at: string;
}

interface SubscriptionTransaction {
  id: string;
  team_id: string;
  transaction_type: string;
  days_amount: number;
  reason?: string;
  operator_id?: string;
  operator_name?: string;
  created_at: string;
}

export const useSubscription = () => {
  const { team, user } = useCustomAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入訂閱數據
  const loadSubscriptionData = async () => {
    if (!team?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 檢查並創建訂閱記錄（如果不存在）
      const { data: isActive } = await supabase.rpc('check_team_subscription_active', {
        team_id_param: team.id
      });

      // 載入訂閱資料
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('team_subscriptions')
        .select('*')
        .eq('team_id', team.id)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError;
      }

      setSubscription(subscriptionData);

      // 載入交易記錄（最近10筆）
      const { data: transactionData, error: transactionError } = await supabase
        .from('subscription_transactions')
        .select('*')
        .eq('team_id', team.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionError) {
        throw transactionError;
      }

      setTransactions(transactionData || []);

    } catch (error: any) {
      console.error('載入訂閱數據失敗:', error);
      setError(error.message || '載入訂閱數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 增加訂閱天數（管理員功能）
  const addSubscriptionDays = async (
    targetTeamId: string, 
    days: number, 
    reason: string = '管理員增加'
  ) => {
    try {
      const { error } = await supabase.rpc('add_subscription_days', {
        team_id_param: targetTeamId,
        days_to_add: days,
        reason_param: reason,
        operator_name_param: user?.username || 'Unknown'
      });

      if (error) throw error;

      // 重新載入數據
      await loadSubscriptionData();

      return { success: true };
    } catch (error: any) {
      console.error('增加訂閱天數失敗:', error);
      return { success: false, error: error.message };
    }
  };

  // 檢查訂閱是否有效
  const isSubscriptionActive = () => {
    return subscription?.is_active && (subscription?.days_remaining || 0) > 0;
  };

  // 獲取剩餘天數狀態
  const getSubscriptionStatus = () => {
    const daysRemaining = subscription?.days_remaining || 0;
    
    if (daysRemaining <= 0) {
      return { status: 'expired', color: 'red', message: '訂閱已到期' };
    } else if (daysRemaining <= 7) {
      return { status: 'warning', color: 'red', message: '即將到期' };
    } else if (daysRemaining <= 30) {
      return { status: 'attention', color: 'yellow', message: '注意到期時間' };
    } else {
      return { status: 'active', color: 'green', message: '訂閱正常' };
    }
  };

  // 執行每日倒數（測試用）
  const runDailyCountdown = async () => {
    try {
      const { error } = await supabase.rpc('daily_subscription_countdown');
      if (error) throw error;
      
      await loadSubscriptionData();
      return { success: true };
    } catch (error: any) {
      console.error('執行每日倒數失敗:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    loadSubscriptionData();

    // 設置定期更新（每5分鐘檢查一次）
    const interval = setInterval(loadSubscriptionData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [team?.id]);

  return {
    subscription,
    transactions,
    loading,
    error,
    loadSubscriptionData,
    addSubscriptionDays,
    isSubscriptionActive,
    getSubscriptionStatus,
    runDailyCountdown
  };
};