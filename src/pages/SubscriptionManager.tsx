import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, Plus, Minus, RefreshCw, Users, Activity, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
}

interface TeamSubscription {
  id: string;
  team_id: string;
  team_name: string;
  is_active: boolean;
  days_remaining: number;
  total_days_purchased: number;
  total_days_used: number;
  created_at: string;
  updated_at: string;
}

const SubscriptionManager = () => {
  const navigate = useNavigate();
  const { user } = useCustomAuth();
  const { runDailyCountdown } = useSubscription();
  
  // 權限檢查：只有超級管理員可以訪問
  if (!user?.is_super_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-slate-800/90 border-red-500/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white mb-2">
              權限不足
            </CardTitle>
            <p className="text-slate-300">
              只有超級管理員可以訪問訂閱管理頁面
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [subscriptions, setSubscriptions] = useState<TeamSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 管理表單狀態
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDaysToAdd, setPendingDaysToAdd] = useState(0);
  
  // 團隊管理狀態
  const [newTeamName, setNewTeamName] = useState('');
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  
  // 刪除團隊狀態
  const [showDeleteTeamDialog, setShowDeleteTeamDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [teamStats, setTeamStats] = useState<{[key: string]: {members: number, roles: number}} | null>(null);

  // 載入所有團隊和訂閱資料
  const loadData = async () => {
    try {
      setLoading(true);

      // 載入所有團隊
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // 載入所有訂閱資料
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('team_subscriptions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (subscriptionsError && subscriptionsError.code !== 'PGRST116') {
        throw subscriptionsError;
      }

      setSubscriptions(subscriptionsData || []);

      // 載入團隊統計信息
      await loadTeamStats(teamsData || []);
    } catch (error: any) {
      console.error('載入數據失敗:', error);
      toast({
        title: "載入失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 載入團隊統計信息
  const loadTeamStats = async (teamList: Team[]) => {
    try {
      const stats: {[key: string]: {members: number, roles: number}} = {};
      
      for (const team of teamList) {
        // 獲取團隊成員數量
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('team_id', team.id);

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn(`獲取團隊 ${team.name} 成員失敗:`, profileError);
        }

        // 獲取團隊角色數量
        const { data: roles, error: roleError } = await supabase
          .from('user_roles')
          .select('id')
          .in('profile_id', (profiles || []).map(p => p.id));

        if (roleError && roleError.code !== 'PGRST116') {
          console.warn(`獲取團隊 ${team.name} 角色失敗:`, roleError);
        }

        stats[team.id] = {
          members: profiles?.length || 0,
          roles: roles?.length || 0
        };
      }
      
      setTeamStats(stats);
    } catch (error) {
      console.error('載入團隊統計失敗:', error);
    }
  };

  // 顯示確認對話框
  const handleDaysButtonClick = (days: number) => {
    if (!selectedTeamId) {
      toast({
        title: "請選擇團隊",
        description: "請先選擇要增加天數的團隊",
        variant: "destructive",
      });
      return;
    }
    setPendingDaysToAdd(days);
    setConfirmDialogOpen(true);
  };

  // 確認增加訂閱天數
  const confirmAddDays = async () => {
    if (!selectedTeamId || !pendingDaysToAdd) {
      return;
    }

    try {
      setIsProcessing(true);

      const { error } = await supabase.rpc('add_subscription_days', {
        team_id_param: selectedTeamId,
        days_to_add: pendingDaysToAdd,
        reason_param: '管理員手動增加',
        operator_name_param: user?.username || 'GM001'
      });

      if (error) throw error;

      toast({
        title: "增加成功",
        description: `已為團隊增加 ${pendingDaysToAdd} 天訂閱`,
      });

      // 重置表單
      setSelectedTeamId('');
      setPendingDaysToAdd(0);
      setConfirmDialogOpen(false);

      // 重新載入數據
      await loadData();
    } catch (error: any) {
      console.error('增加天數失敗:', error);
      toast({
        title: "增加失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 創建新團隊
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "請輸入團隊名稱",
        description: "團隊名稱不能為空",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingTeam(true);

      // 檢查團隊名稱是否已存在
      const { data: existingTeam, error: checkError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('name', newTeamName.trim())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingTeam) {
        toast({
          title: "團隊名稱已存在",
          description: `團隊「${newTeamName}」已經存在，請使用不同的名稱`,
          variant: "destructive",
        });
        return;
      }

      // 創建新團隊
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "團隊創建成功",
        description: `團隊「${newTeamName}」已成功創建，您可以使用 GM001 帳號登入該團隊進行管理`,
        duration: 5000,
      });

      // 重置表單並關閉對話框
      setNewTeamName('');
      setShowCreateTeamDialog(false);
      
      // 重新載入團隊列表
      await loadData();

    } catch (error: any) {
      console.error('創建團隊失敗:', error);
      toast({
        title: "創建失敗",
        description: error.message || "創建團隊時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // 跨團隊登入功能
  const handleTeamLogin = async (teamName: string) => {
    try {
      // 顯示確認對話框
      const confirmed = window.confirm(
        `您確定要切換到團隊「${teamName}」嗎？\n\n這將會重新載入頁面並以 GM001 身分登入該團隊。`
      );

      if (!confirmed) return;

      // 清除當前的認證狀態
      localStorage.removeItem('custom_auth_session');

      // 使用 GM001 帳號登入指定團隊
      const { login } = await import('@/hooks/useCustomAuth');
      
      toast({
        title: "正在切換團隊",
        description: `正在切換到團隊「${teamName}」...`,
      });

      // 延遲一下讓用戶看到提示
      setTimeout(() => {
        // 直接重新導向到登入頁面，並預填團隊名稱
        const loginUrl = `/auth?team=${encodeURIComponent(teamName)}&username=GM001`;
        window.location.href = loginUrl;
      }, 1000);

    } catch (error: any) {
      console.error('團隊切換失敗:', error);
      toast({
        title: "切換失敗",
        description: error.message || "團隊切換時發生錯誤",
        variant: "destructive",
      });
    }
  };

  // 準備刪除團隊
  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setDeleteConfirmName('');
    setShowDeleteTeamDialog(true);
  };

  // 執行刪除團隊
  const confirmDeleteTeam = async () => {
    if (!teamToDelete || deleteConfirmName !== teamToDelete.name) {
      toast({
        title: "確認失敗",
        description: "請輸入正確的團隊名稱",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeletingTeam(true);

      // 檢查是否為當前登入的團隊
      if (user?.team_name === teamToDelete.name && !user?.is_super_admin) {
        toast({
          title: "無法刪除",
          description: "您不能刪除自己當前所在的團隊",
          variant: "destructive",
        });
        return;
      }

      console.log(`開始刪除團隊: ${teamToDelete.name} (ID: ${teamToDelete.id})`);

      // 步驟1：刪除團隊的用戶角色
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('team_id', teamToDelete.id);

      if (profiles && profiles.length > 0) {
        const profileIds = profiles.map(p => p.id);
        
        const { error: roleDeleteError } = await supabase
          .from('user_roles')
          .delete()
          .in('profile_id', profileIds);

        if (roleDeleteError) {
          console.warn('刪除用戶角色時發生錯誤:', roleDeleteError);
        } else {
          console.log(`已刪除 ${profileIds.length} 個成員的角色記錄`);
        }
      }

      // 步驟2：刪除團隊成員 profiles
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('team_id', teamToDelete.id);

      if (profileDeleteError) {
        console.warn('刪除團隊成員時發生錯誤:', profileDeleteError);
      } else {
        console.log('已刪除團隊成員記錄');
      }

      // 步驟3：刪除團隊訂閱記錄
      const { error: subscriptionDeleteError } = await supabase
        .from('team_subscriptions')
        .delete()
        .eq('team_id', teamToDelete.id);

      if (subscriptionDeleteError) {
        console.warn('刪除團隊訂閱記錄時發生錯誤:', subscriptionDeleteError);
      } else {
        console.log('已刪除團隊訂閱記錄');
      }

      // 步驟4：最後刪除團隊本身
      const { error: teamDeleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamToDelete.id);

      if (teamDeleteError) {
        throw new Error(`刪除團隊失敗: ${teamDeleteError.message}`);
      }

      console.log('團隊刪除完成');

      toast({
        title: "團隊刪除成功",
        description: `團隊「${teamToDelete.name}」及其所有相關資料已被永久刪除`,
        duration: 5000,
      });

      // 重置狀態並重新載入數據
      setShowDeleteTeamDialog(false);
      setTeamToDelete(null);
      setDeleteConfirmName('');
      
      // 重新載入團隊列表
      await loadData();

    } catch (error: any) {
      console.error('刪除團隊失敗:', error);
      toast({
        title: "刪除失敗",
        description: error.message || "刪除團隊時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTeam(false);
    }
  };

  // 執行每日倒數
  const handleDailyCountdown = async () => {
    try {
      setIsProcessing(true);
      const result = await runDailyCountdown();
      
      if (result.success) {
        toast({
          title: "倒數執行成功",
          description: "所有團隊的訂閱天數已更新",
        });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "倒數執行失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (days: number, isActive: boolean) => {
    if (!isActive || days <= 0) return 'destructive';
    if (days <= 7) return 'destructive';
    if (days <= 30) return 'secondary';
    return 'default';
  };

  // 獲取狀態文字
  const getStatusText = (days: number, isActive: boolean) => {
    if (!isActive || days <= 0) return '已到期';
    if (days <= 7) return '即將到期';
    if (days <= 30) return '注意到期';
    return '正常';
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-treasure-deep-blue to-treasure-royal-blue p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="text-treasure-gold border-treasure-border hover:bg-treasure-surface backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
          <div className="text-white">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-treasure-gold to-treasure-amber bg-clip-text text-transparent">
              ⏰ 訂閱管理系統
            </h1>
            <p className="text-treasure-gold/80">
              管理所有團隊的訂閱狀態和天數
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 管理操作區 */}
          <Card className="lg:col-span-1 bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardHeader>
              <CardTitle className="text-treasure-gold flex items-center gap-2">
                <Plus className="w-5 h-5" />
                增加訂閱天數
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team-select" className="text-treasure-gold">選擇團隊</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="bg-treasure-surface/30 border-treasure-border text-treasure-gold">
                    <SelectValue placeholder="請選擇團隊" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-treasure-gold">選擇增加天數</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDaysButtonClick(7)}
                    disabled={isProcessing}
                    className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    7天
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDaysButtonClick(30)}
                    disabled={isProcessing}
                    className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    30天
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDaysButtonClick(60)}
                    disabled={isProcessing}
                    className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    60天
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDaysButtonClick(90)}
                    disabled={isProcessing}
                    className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    90天
                  </Button>
                </div>
              </div>

              {/* 系統操作 */}
              <div className="pt-4 border-t border-treasure-border/30">
                <Label className="text-treasure-gold mb-3 block">系統操作</Label>
                <Button
                  variant="outline"
                  onClick={handleDailyCountdown}
                  disabled={isProcessing}
                  className="w-full border-treasure-border text-treasure-gold hover:bg-treasure-surface"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  執行每日倒數
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="w-full border-treasure-border text-treasure-gold hover:bg-treasure-surface"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                重新載入數據
              </Button>
            </CardContent>
          </Card>

          {/* 訂閱列表 */}
          <Card className="lg:col-span-2 bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardHeader>
              <CardTitle className="text-treasure-gold flex items-center gap-2">
                <Users className="w-5 h-5" />
                團隊訂閱狀態
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-treasure-gold" />
                  <span className="ml-2 text-treasure-gold">載入中...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-treasure-border/30 hover:bg-treasure-surface/20">
                        <TableHead className="text-treasure-gold">團隊名稱</TableHead>
                        <TableHead className="text-treasure-gold">剩餘天數</TableHead>
                        <TableHead className="text-treasure-gold">狀態</TableHead>
                        <TableHead className="text-treasure-gold">總購買/已用</TableHead>
                        <TableHead className="text-treasure-gold">最後更新</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow 
                          key={sub.id} 
                          className="border-treasure-border/20 hover:bg-treasure-surface/10"
                        >
                          <TableCell className="text-treasure-gold font-medium">
                            {sub.team_name}
                          </TableCell>
                          <TableCell className="text-treasure-gold">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className={`font-bold ${
                                sub.days_remaining <= 0 ? 'text-red-400' :
                                sub.days_remaining <= 7 ? 'text-yellow-400' :
                                sub.days_remaining <= 30 ? 'text-yellow-300' :
                                'text-green-400'
                              }`}>
                                {sub.days_remaining}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(sub.days_remaining, sub.is_active)}>
                              {getStatusText(sub.days_remaining, sub.is_active)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-treasure-gold">
                            {sub.total_days_purchased} / {sub.total_days_used}
                          </TableCell>
                          <TableCell className="text-treasure-gold text-sm">
                            {new Date(sub.updated_at).toLocaleString('zh-TW')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {subscriptions.length === 0 && (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-treasure-gold/50" />
                      <p className="text-treasure-gold/70">暫無訂閱記錄</p>
                      <p className="text-treasure-gold/50 text-sm mt-2">
                        當團隊首次使用系統時會自動創建試用期訂閱
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-treasure-gold" />
              <div className="text-2xl font-bold text-treasure-gold">{teams.length}</div>
              <div className="text-sm text-treasure-gold/80">總團隊數</div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-6 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold text-green-400">
                {subscriptions.filter(s => s.is_active && s.days_remaining > 0).length}
              </div>
              <div className="text-sm text-treasure-gold/80">活躍訂閱</div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold text-yellow-400">
                {subscriptions.filter(s => s.days_remaining <= 7 && s.days_remaining > 0).length}
              </div>
              <div className="text-sm text-treasure-gold/80">即將到期</div>
            </CardContent>
          </Card>

          <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border">
            <CardContent className="p-6 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <div className="text-2xl font-bold text-red-400">
                {subscriptions.filter(s => !s.is_active || s.days_remaining <= 0).length}
              </div>
              <div className="text-sm text-treasure-gold/80">已到期</div>
            </CardContent>
          </Card>
        </div>

        {/* 團隊管理區塊 */}
        <Card className="bg-treasure-surface/50 backdrop-blur-sm border-treasure-border mt-6">
          <CardHeader>
            <CardTitle className="text-treasure-gold flex items-center gap-2">
              🏢 團隊管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button
                onClick={() => setShowCreateTeamDialog(true)}
                className="bg-treasure-gold hover:bg-treasure-amber text-treasure-deep-blue"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增團隊
              </Button>
            </div>

            <div className="bg-treasure-dark/30 rounded-lg p-4">
              <h3 className="text-treasure-gold font-semibold mb-4">現有團隊列表</h3>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-treasure-gold" />
                  <span className="ml-2 text-treasure-gold">載入中...</span>
                </div>
              ) : teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <Card key={team.id} className="bg-treasure-surface/30 border-treasure-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-treasure-gold font-medium">{team.name}</h4>
                            <div className="text-treasure-gold/70 text-sm space-y-1">
                              <p>團隊 ID: {team.id.slice(0, 8)}...</p>
                              {teamStats && teamStats[team.id] && (
                                <p>成員: {teamStats[team.id].members} | 角色: {teamStats[team.id].roles}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
                              onClick={() => handleTeamLogin(team.name)}
                            >
                              🔑 管理
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                              onClick={() => handleDeleteTeam(team)}
                            >
                              🗑️ 刪除
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-treasure-gold/50" />
                  <p className="text-treasure-gold/70">暫無團隊</p>
                  <p className="text-treasure-gold/50 text-sm mt-2">
                    點擊上方「新增團隊」按鈕來創建第一個團隊
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 創建團隊對話框 */}
        <Dialog open={showCreateTeamDialog} onOpenChange={setShowCreateTeamDialog}>
          <DialogContent className="bg-treasure-surface border-treasure-border">
            <DialogHeader>
              <DialogTitle className="text-treasure-gold">創建新團隊</DialogTitle>
              <DialogDescription className="text-treasure-gold/70">
                輸入新團隊的名稱。創建後您可以使用 GM001 帳號登入該團隊進行管理。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="teamName" className="text-treasure-gold">團隊名稱</Label>
                <Input
                  id="teamName"
                  placeholder="請輸入團隊名稱..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="bg-white border-treasure-border text-black placeholder-slate-400"
                  disabled={isCreatingTeam}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTeamDialog(false);
                  setNewTeamName('');
                }}
                disabled={isCreatingTeam}
                className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={isCreatingTeam || !newTeamName.trim()}
                className="bg-treasure-gold hover:bg-treasure-amber text-treasure-deep-blue"
              >
                {isCreatingTeam ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    創建中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    創建團隊
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 刪除團隊確認對話框 */}
        <Dialog open={showDeleteTeamDialog} onOpenChange={setShowDeleteTeamDialog}>
          <DialogContent className="bg-treasure-surface border-red-500/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                危險操作：刪除團隊
              </DialogTitle>
              <DialogDescription className="text-treasure-gold/70">
                您即將刪除團隊「<span className="text-red-400 font-semibold">{teamToDelete?.name}</span>」
              </DialogDescription>
            </DialogHeader>
            
            {teamToDelete && teamStats && teamStats[teamToDelete.id] && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 my-4">
                <h4 className="text-red-400 font-semibold mb-2">⚠️ 刪除影響範圍：</h4>
                <ul className="text-treasure-gold/80 text-sm space-y-1">
                  <li>• {teamStats[teamToDelete.id].members} 個團隊成員帳號</li>
                  <li>• {teamStats[teamToDelete.id].roles} 個角色記錄</li>
                  <li>• 所有相關的訂閱記錄</li>
                  <li>• 團隊的所有歷史資料</li>
                </ul>
                <p className="text-red-400 font-semibold text-sm mt-3">
                  ⚠️ 此操作無法復原！
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="confirmTeamName" className="text-treasure-gold">
                  請輸入團隊名稱「{teamToDelete?.name}」來確認刪除
                </Label>
                <Input
                  id="confirmTeamName"
                  placeholder={`請輸入：${teamToDelete?.name}`}
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="bg-treasure-dark border-red-500/50 text-treasure-gold placeholder-treasure-gold/30"
                  disabled={isDeletingTeam}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteTeamDialog(false);
                  setTeamToDelete(null);
                  setDeleteConfirmName('');
                }}
                disabled={isDeletingTeam}
                className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
              >
                取消
              </Button>
              <Button
                onClick={confirmDeleteTeam}
                disabled={isDeletingTeam || deleteConfirmName !== teamToDelete?.name}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingTeam ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    刪除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    永久刪除
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 確認對話框 */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="bg-treasure-surface border-treasure-border">
            <DialogHeader>
              <DialogTitle className="text-treasure-gold">確認增加訂閱天數</DialogTitle>
              <DialogDescription className="text-treasure-gold/70">
                您確定要為選中的團隊增加 <span className="text-treasure-amber font-semibold">{pendingDaysToAdd}</span> 天訂閱嗎？
                <br />
                <span className="text-sm text-treasure-gold/50 mt-2 block">
                  團隊：{teams.find(t => t.id === selectedTeamId)?.name}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                className="border-treasure-border text-treasure-gold hover:bg-treasure-surface"
              >
                取消
              </Button>
              <Button
                onClick={confirmAddDays}
                disabled={isProcessing}
                className="bg-treasure-gold hover:bg-treasure-amber text-treasure-deep-blue"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    確認增加
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SubscriptionManager;