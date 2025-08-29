import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, User, ArrowLeft, UserPlus, Users, Eye, Lock, Unlock, RotateCcw, DollarSign, Edit, Trash2, RefreshCw, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface AccountSettings {
  displayName: string;
  email: string;
  phoneNumber: string;
  discordId: string;
}

export default function AccountSettings() {
  const { toast } = useToast();
  const { user, profile, team, refreshUserData } = useCustomAuth();
  const [settings, setSettings] = useState<AccountSettings>({
    displayName: "",
    email: "",
    phoneNumber: "",
    discordId: "",
  });
  
  const [newAccount, setNewAccount] = useState({
    username: "",
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [lockedMembers, setLockedMembers] = useState<Set<string>>(new Set());
  
  // 補助款發放相關狀態
  const [subsidyDialogOpen, setSubsidyDialogOpen] = useState(false);
  const [subsidyAmount, setSubsidyAmount] = useState<string>("");
  const [memberInput, setMemberInput] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDistributingSubsidy, setIsDistributingSubsidy] = useState(false);

  // 充公相關狀態
  const [confiscateDialogOpen, setConfiscateDialogOpen] = useState(false);
  const [confiscatingMember, setConfiscatingMember] = useState<any>(null);
  const [memberWalletBalance, setMemberWalletBalance] = useState<number>(0);
  const [isConfiscating, setIsConfiscating] = useState(false);

  // 編輯成員相關狀態
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    password: "",
    roles: ["盟友"] // 預設勾選盟友
  });
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);

  // 刪除成員相關狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("accountSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to load account settings:", error);
      }
    }

    // 載入鎖定成員狀態
    const savedLockedMembers = localStorage.getItem("lockedMembers");
    if (savedLockedMembers) {
      try {
        const parsed = JSON.parse(savedLockedMembers);
        setLockedMembers(new Set(parsed));
      } catch (error) {
        console.error("Failed to load locked members:", error);
      }
    }

    // Pre-fill with existing user data if available
    if (profile) {
      setSettings(prev => ({
        ...prev,
        displayName: prev.displayName || profile.username || "",
        email: prev.email || user?.email || "",
      }));
    }

    // Fetch team members
    if (team?.id) {
      fetchTeamMembers();
    }

    // 設置實時監聽 profiles 表的變化
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles 表發生變化:', payload);
          // 當有變化時延遲重新載入成員列表
          if (team?.id) {
            setTimeout(() => {
              console.log('由於資料庫變化，重新載入成員列表');
              fetchTeamMembers();
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, user, team]);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem("accountSettings", JSON.stringify(settings));
    toast({
      title: "帳號設定已儲存",
      description: "所有帳號設定已成功儲存",
    });
  };

  const handleInputChange = (field: keyof AccountSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const fetchTeamMembers = async () => {
    console.log("📋 開始載入團隊成員列表");
    console.log("🏢 團隊資訊:", { teamId: team?.id, teamName: team?.name });
    
    if (!team?.id) {
      console.log("❌ 無法載入成員：缺少 team.id");
      return;
    }
    
    setIsLoadingMembers(true);
    
    try {
      console.log("🔍 查詢數據庫中的所有團隊成員...");
      
      // 統一從數據庫載入所有成員（不再區分預定義和創建帳號）
      // 排除隱藏的用戶（如超級管理員）
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', team.id)
        .neq('is_hidden', true);
      
      if (error) {
        console.error("❌ 查詢錯誤:", error);
        throw error;
      }
      
      console.log("✅ 載入的成員數量:", data?.length || 0);
      console.log("📄 成員列表:", data);
      
      // 顯示每個成員的詳細資訊
      if (data && data.length > 0) {
        console.log("📝 詳細成員名單:");
        data.forEach((member, index) => {
          console.log(`  ${index + 1}. ${member.username} (ID: ${member.id}, 創建時間: ${member.created_at})`);
        });
      }
      
      // 加載本地存儲的角色信息
      const memberRoles = JSON.parse(localStorage.getItem('memberRoles') || '{}');
      console.log("🎭 本地存儲的角色信息:", memberRoles);
      
      // 為成員添加角色信息，對於沒有角色的新成員，自動設定預設角色
      const membersWithRoles = (data || []).map(member => {
        if (!memberRoles[member.id]) {
          console.log(`⚠️ 成員 ${member.username} (${member.id}) 沒有角色記錄，設定預設角色`);
          memberRoles[member.id] = ['盟友'];
          // 立即保存到本地存儲
          localStorage.setItem('memberRoles', JSON.stringify(memberRoles));
        }
        return {
          ...member,
          roles: memberRoles[member.id] || ['盟友'] // 預設角色為盟友
        };
      });
      
      setTeamMembers(membersWithRoles);
      console.log("🎉 成員列表載入完成，總共:", membersWithRoles.length, "名成員");
      
    } catch (error: any) {
      console.error("❌ 載入成員列表失敗:", error);
      toast({
        title: "載入成員列表失敗",
        description: error.message || "發生未知錯誤，請嘗試重新載入",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleToggleLock = (memberId: string, memberName: string) => {
    const isLocked = lockedMembers.has(memberId);
    const newLockedMembers = new Set(lockedMembers);
    
    if (isLocked) {
      newLockedMembers.delete(memberId);
      toast({
        title: "帳號已解鎖",
        description: `${memberName} 的帳號已解除鎖定，可以重新使用拍賣場功能`,
      });
    } else {
      newLockedMembers.add(memberId);
      toast({
        title: "帳號已鎖定",
        description: `${memberName} 的帳號已被鎖定，將無法使用拍賣場功能`,
      });
    }
    
    setLockedMembers(newLockedMembers);
    
    // 儲存鎖定狀態到 localStorage 供其他頁面讀取
    localStorage.setItem('lockedMembers', JSON.stringify(Array.from(newLockedMembers)));
  };

  const handleResetPassword = async (memberId: string, memberName: string) => {
    try {
      // 找到對應的成員資料
      const member = teamMembers.find(m => m.id === memberId);
      if (!member) {
        toast({
          title: "重設密碼失敗",
          description: "找不到該成員的用戶資訊",
          variant: "destructive",
        });
        return;
      }

      // Get team password from localStorage
      const savedSettings = localStorage.getItem("basicSettings");
      let teamPassword = "password123"; // Default fallback
      
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          teamPassword = parsed.teamPassword || teamPassword;
        } catch (error) {
          console.error("Failed to load team password:", error);
        }
      }

      // 使用統一認證系統更新密碼（直接更新數據庫）
      const { data, error } = await supabase
        .from('profiles')
        .update({ password_hash: teamPassword })
        .eq('id', memberId)
        .select();

      if (error) {
        toast({
          title: "重設密碼失敗",
          description: error.message || "無法更新密碼",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "密碼重設成功",
        description: `${memberName} 的密碼已重設為：${teamPassword}`,
      });
    } catch (error: any) {
      toast({
        title: "重設密碼失敗",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    }
  };

  // 開始充公流程
  const handleConfiscateStart = async (member: any) => {
    try {
      
      // 獲取成員錢包餘額（按照錢包頁面的計算邏輯）
      const walletTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
      const memberTransactions = walletTransactions.filter((t: any) => t.participant === member.username);
      
      // 獲取用戶的初始餘額
      const userStartingBalanceKey = `userStartingBalance_${member.username}`;
      const userStartingBalance = parseInt(localStorage.getItem(userStartingBalanceKey) || '0');
      
      // 計算當前餘額（包含初始餘額 + 所有交易金額）
      const balance = memberTransactions.reduce((total: number, transaction: any) => {
        return total + (transaction.amount || 0);
      }, userStartingBalance);

      console.log(`💰 成員 ${member.username} 當前餘額: ${balance} 鑽石`);
      
      setConfiscatingMember(member);
      setMemberWalletBalance(balance);
      setConfiscateDialogOpen(true);
      
    } catch (error: any) {
      console.error('獲取成員錢包餘額失敗:', error);
      toast({
        title: "獲取錢包資訊失敗",
        description: error.message || "無法獲取成員錢包資訊",
        variant: "destructive",
      });
    }
  };

  // 執行充公
  const handleConfiscateExecute = async () => {
    if (!confiscatingMember || memberWalletBalance <= 0) {
      toast({
        title: "無法充公",
        description: "該成員錢包餘額為0或資料異常",
        variant: "destructive",
      });
      return;
    }

    setIsConfiscating(true);

    try {
      // 獲取現有交易記錄
      const existingTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
      
      // 創建充公支出記錄（從成員錢包扣除）
      const confiscateExpense = {
        id: Date.now() + Math.random(),
        type: "支出",
        amount: -memberWalletBalance, // 支出使用負數
        reason: `錢包充公`,
        participant: confiscatingMember.username,
        date: new Date().toLocaleString('zh-TW'),
        category: "充公"
      };

      // 獲取現有公基金記錄
      const existingPublicFund = JSON.parse(localStorage.getItem('publicFundRecords') || '[]');
      
      // 創建公基金收入記錄
      const publicFundIncome = {
        id: Date.now() + Math.random() + 1,
        type: "收入",
        amount: memberWalletBalance,
        reason: `成員錢包充公 - ${confiscatingMember.username}`,
        description: `管理員 ${user?.username || "系統"} 對成員 ${confiscatingMember.username} 執行錢包充公，將 ${memberWalletBalance} 鑽石轉入公基金`,
        operator: user?.username || "系統",
        date: new Date().toLocaleString('zh-TW'),
        category: "充公收入"
      };

      // 更新公基金餘額
      const currentFundData = JSON.parse(localStorage.getItem('publicFundData') || '{}');
      const newBalance = (currentFundData.balance || 0) + memberWalletBalance;
      const updatedFundData = { ...currentFundData, balance: newBalance };

      // 清除該用戶的初始餘額，確保充公後餘額為0
      const userStartingBalanceKey = `userStartingBalance_${confiscatingMember.username}`;
      localStorage.removeItem(userStartingBalanceKey);

      // 更新localStorage
      const updatedTransactions = [...existingTransactions, confiscateExpense];
      const updatedPublicFund = [...existingPublicFund, publicFundIncome];
      
      localStorage.setItem('walletTransactions', JSON.stringify(updatedTransactions));
      localStorage.setItem('publicFundRecords', JSON.stringify(updatedPublicFund));
      localStorage.setItem('publicFundData', JSON.stringify(updatedFundData));

      // 觸發更新事件
      window.dispatchEvent(new Event('walletUpdate'));
      window.dispatchEvent(new Event('publicFundUpdate'));

      toast({
        title: "充公完成",
        description: `已將 ${confiscatingMember.username} 的 ${memberWalletBalance} 鑽石充公至公基金`,
      });


      // 關閉對話框
      setConfiscateDialogOpen(false);
      setConfiscatingMember(null);
      setMemberWalletBalance(0);

    } catch (error: any) {
      console.error('充公執行失敗:', error);
      toast({
        title: "充公失敗",
        description: error.message || "執行充公時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setIsConfiscating(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.username) {
      toast({
        title: "錯誤",
        description: "請輸入帳號ID",
        variant: "destructive",
      });
      return;
    }

    if (!team?.id) {
      toast({
        title: "錯誤",
        description: "無法獲取團隊資訊",
        variant: "destructive",
      });
      return;
    }

    // Get team password from localStorage
    const savedSettings = localStorage.getItem("basicSettings");
    let teamPassword = "password123"; // Default fallback
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        teamPassword = parsed.teamPassword || teamPassword;
      } catch (error) {
        console.error("Failed to load team password:", error);
      }
    }

    setIsAddingAccount(true);
    try {
      console.log('🆕 開始新增帳號（使用統一創建系統）...');
      console.log('📋 帳號資訊:', {
        username: newAccount.username,
        teamName: team.name,
        password: teamPassword
      });
      
      // 使用統一的帳號創建函數（不再依賴 Supabase Auth）
      const { data, error } = await supabase.rpc('create_account_unified', {
        team_name_param: team.name,
        username_param: newAccount.username,
        password_param: teamPassword,
        role_param: '盟友'
      });

      if (error) {
        console.error('❌ 統一創建系統失敗:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || '帳號創建失敗');
      }

      console.log('✅ 帳號創建成功:', data);

      // 立即設定新用戶的角色到本地存儲
      const memberRoles = JSON.parse(localStorage.getItem('memberRoles') || '{}');
      memberRoles[data.profile_id] = ['盟友']; // 設定預設角色
      localStorage.setItem('memberRoles', JSON.stringify(memberRoles));
      console.log('✅ 已設定新用戶角色到本地存儲');

      toast({
        title: "帳號新增成功",
        description: `帳號ID：${newAccount.username}\n團隊：${team.name}\n密碼：${teamPassword}\n預設角色：盟友\n\n此帳號已創建並可用於外部登入系統`,
        duration: 10000,
      });

      // Reset form and close dialog
      setNewAccount({ username: "" });
      setDialogOpen(false);
      
      // 重新載入成員列表
      console.log('🔄 重新載入成員列表...');
      setTimeout(() => {
        fetchTeamMembers();
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ 新增帳號失敗:', error);
      toast({
        title: "新增帳號失敗",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleSubsidyDistribution = async () => {
    if (!subsidyAmount || selectedMemberIds.length === 0) {
      toast({
        title: "錯誤",
        description: "請填寫補助金額並選擇至少一位成員",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(subsidyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "錯誤",
        description: "請輸入有效的補助金額",
        variant: "destructive",
      });
      return;
    }

    setIsDistributingSubsidy(true);
    try {
      const existingTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
      const newTransactions = [];

      for (const memberUsername of selectedMemberIds) {
        const member = teamMembers.find(m => m.username === memberUsername);
        if (member) {
          const transaction = {
            id: Date.now() + Math.random(),
            type: "收入",
            amount: amount,
            reason: `團隊補助款`,
            participant: member.username,
            date: new Date().toLocaleString('zh-TW'),
            category: "團隊補助"
          };
          newTransactions.push(transaction);
        }
      }

      const updatedTransactions = [...existingTransactions, ...newTransactions];
      localStorage.setItem('walletTransactions', JSON.stringify(updatedTransactions));

      // 觸發錢包頁面更新
      window.dispatchEvent(new Event('walletUpdate'));

      toast({
        title: "補助款發放成功",
        description: `已成功向 ${selectedMemberIds.length} 位成員發放 ${amount} 鑽石補助款`,
      });

      // 重置狀態
      setSubsidyAmount("");
      setMemberInput("");
      setSelectedMemberIds([]);
      setSubsidyDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "補助款發放失敗",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    } finally {
      setIsDistributingSubsidy(false);
    }
  };

  // 處理成員ID輸入
  const handleMemberInputChange = (value: string) => {
    setMemberInput(value);
    setShowSuggestions(value.length > 0);
  };

  // 添加成員到選中列表
  const addMemberToSelection = (memberUsername: string) => {
    if (!selectedMemberIds.includes(memberUsername)) {
      setSelectedMemberIds([...selectedMemberIds, memberUsername]);
    }
    setMemberInput("");
    setShowSuggestions(false);
  };

  // 從選中列表移除成員
  const removeMemberFromSelection = (memberUsername: string) => {
    setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberUsername));
  };

  // 獲取匹配的成員建議
  const getMemberSuggestions = () => {
    if (!memberInput) return [];
    return teamMembers
      .filter(member => 
        member.username.toLowerCase().includes(memberInput.toLowerCase()) &&
        !selectedMemberIds.includes(member.username)
      )
      .slice(0, 5); // 限制顯示5個建議
  };

  const handleEditMember = async (member: any) => {
    setEditingMember(member);
    
    // 優先從本地存儲獲取角色信息
    const memberRoles = JSON.parse(localStorage.getItem('memberRoles') || '{}');
    const localRoles = memberRoles[member.id];
    
    if (localRoles && Array.isArray(localRoles)) {
      console.log("✅ 從本地存儲載入角色:", localRoles);
      setEditForm({
        username: member.username,
        password: "",
        roles: localRoles
      });
      setEditDialogOpen(true);
      return;
    }
    
    // 如果本地存儲沒有，嘗試從數據庫獲取
    try {
      console.log("📡 嘗試從數據庫獲取角色...");
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('profile_id', member.id);
      
      if (error) {
        console.warn("數據庫角色查詢失敗，使用預設角色:", error);
        setEditForm({
          username: member.username,
          password: "",
          roles: ["盟友"]
        });
      } else {
        const currentRoles = roleData?.map(r => r.role) || [];
        const finalRoles = currentRoles.length > 0 ? currentRoles : ["盟友"];
        console.log("📡 從數據庫獲取的角色:", finalRoles);
        
        // 同步到本地存儲
        memberRoles[member.id] = finalRoles;
        localStorage.setItem('memberRoles', JSON.stringify(memberRoles));
        
        setEditForm({
          username: member.username,
          password: "",
          roles: finalRoles
        });
      }
    } catch (error) {
      console.warn("獲取成員角色時發生錯誤，使用預設角色:", error);
      setEditForm({
        username: member.username,
        password: "",
        roles: ["盟友"]
      });
    }
    
    setEditDialogOpen(true);
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    const newRoles = [...editForm.roles];
    if (checked) {
      if (!newRoles.includes(role)) {
        newRoles.push(role);
      }
    } else {
      const index = newRoles.indexOf(role);
      if (index > -1) {
        newRoles.splice(index, 1);
      }
    }
    setEditForm(prev => ({ ...prev, roles: newRoles }));
  };

  const handleUpdateMember = async () => {
    if (!editForm.username) {
      toast({
        title: "錯誤",
        description: "請填寫帳號名稱",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingMember(true);
    try {
      // 如果帳號名稱有變更，需要同時更新 Supabase Auth 的 email
      if (editForm.username !== editingMember.username) {
        // 使用與新增成員和登入邏輯一致的 email 格式
        const userHash = btoa(encodeURIComponent(editForm.username)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
        const teamHash = btoa(encodeURIComponent(team?.name || 'team')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
        const newEmail = `user${userHash}@team${teamHash}.local`;
        console.log('Generated email for edit:', newEmail); // Debug log
        
        const { error: emailError } = await supabase.auth.admin.updateUserById(editingMember.user_id, {
          email: newEmail
        });

        if (emailError) {
          console.warn("Email update failed:", emailError);
          // 即使 email 更新失敗，仍繼續更新其他資訊
        }
      }

      // 更新 profiles 表中的 username
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: editForm.username })
        .eq('id', editingMember.id);

      if (profileError) throw profileError;

      // 如果有設定新密碼，更新密碼
      if (editForm.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(editingMember.user_id, {
          password: editForm.password
        });

        if (passwordError) {
          console.warn("Password update failed:", passwordError);
        }
      }

      // 更新成員角色 - 使用本地存儲 + 數據庫雙重存儲
      try {
        console.log("開始更新成員角色:", editingMember.username, "新角色:", editForm.roles);
        
        // 1. 首先更新本地存儲的角色信息
        const memberRoles = JSON.parse(localStorage.getItem('memberRoles') || '{}');
        memberRoles[editingMember.id] = editForm.roles;
        localStorage.setItem('memberRoles', JSON.stringify(memberRoles));
        console.log("✅ 本地存儲角色更新成功");
        
        // 觸發自定義事件來通知權限系統刷新
        window.dispatchEvent(new CustomEvent('memberRolesUpdated', {
          detail: { 
            memberId: editingMember.id, 
            newRoles: editForm.roles,
            isCurrentUser: editingMember.id === profile?.id || editingMember.id === user?.id
          }
        }));
        
        // 2. 嘗試更新數據庫（如果成功則好，失敗也不影響功能）
        try {
          // 嘗試使用 stored procedure
          // 超級管理員使用特殊的 granted_by_id
          const grantedById = (user?.is_super_admin) ? '00000000-0000-0000-0000-000000000001' : (profile?.id || null);
          
          const { data: updateResult, error: updateError } = await supabase
            .rpc('update_member_roles_admin', {
              member_id: editingMember.id,
              new_roles: editForm.roles,
              granted_by_id: grantedById
            });

          if (updateError) {
            console.warn("Stored procedure 失敗，嘗試直接操作:", updateError);
            
            // 直接數據庫操作
            // 先刪除現有角色
            await supabase
              .from('user_roles')
              .delete()
              .eq('profile_id', editingMember.id);

            // 插入新角色
            if (editForm.roles.length > 0) {
              const validRoles = ["盟友", "開單員", "拍賣員", "會計", "管理者"] as const;
              const roleInserts = editForm.roles
                .filter(role => validRoles.includes(role as any))
                .map(role => ({
                  profile_id: editingMember.id,
                  user_id: editingMember.user_id,
                  role: role,
                  granted_by: grantedById
                }));

              if (roleInserts.length > 0) {
                const { error: insertError } = await supabase
                  .from('user_roles')
                  .insert(roleInserts);

                if (insertError) {
                  console.warn("數據庫角色更新失敗，但本地存儲已更新:", insertError);
                } else {
                  console.log("✅ 數據庫角色也更新成功");
                }
              }
            }
          } else {
            console.log("✅ 使用 stored procedure 更新成功:", updateResult);
          }
        } catch (dbError) {
          console.warn("數據庫更新失敗，但本地存儲已更新，功能正常:", dbError);
        }

        // 如果更新的是當前用戶，需要重新獲取用戶數據以更新權限
        console.log("🔍 檢查是否為當前用戶:", {
          editingMemberId: editingMember.id,
          currentProfileId: profile?.id,
          isCurrentUser: editingMember.id === profile?.id
        });
        
        if (editingMember.id === profile?.id) {
          console.log("🔄 更新的是當前用戶，重新載入用戶權限...");
          // 重新獲取用戶數據以更新左側導航欄權限
          await refreshUserData();
          console.log("✅ 權限刷新完成");
          
          // 額外的強制刷新機制：觸發頁面重新渲染
          setTimeout(() => {
            console.log("🔄 額外刷新機制：重新觸發權限檢查");
            window.location.reload();
          }, 1000);
        } else {
          console.log("📝 更新的是其他用戶，無需刷新當前用戶權限");
        }

        toast({
          title: "更新成功",
          description: `已成功更新 ${editForm.username} 的資訊和權限`,
        });
        
      } catch (roleError: any) {
        console.error("Role update error details:", roleError);
        
        // 提供更詳細的錯誤信息
        let errorMessage = "角色權限更新失敗";
        if (roleError.message?.includes("row-level security")) {
          errorMessage = "沒有權限更新角色，請確認您有管理員權限";
        } else if (roleError.message) {
          errorMessage = roleError.message;
        }
        
        toast({
          title: "角色更新失敗",
          description: `基本資訊已更新，但${errorMessage}`,
          variant: "destructive",
        });
      }

      // 關閉對話框並刷新成員列表
      setEditDialogOpen(false);
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "更新失敗",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleDeleteMember = (member: any) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  // 清理所有成員 (保留超級管理員)
  const clearAllMembers = async () => {
    try {
      console.log('🗑️ 開始清理所有成員...');
      console.log('🔍 當前團隊資訊:', { teamId: team?.id, teamName: team?.name });
      console.log('👤 當前用戶資訊:', { userId: user?.id, username: user?.username });
      
      if (!team?.id) {
        throw new Error('無法獲取團隊 ID');
      }
      
      // 首先嘗試使用新的 stored procedure 來批量刪除成員
      console.log('🔧 嘗試使用管理員權限批量清理成員...');
      const { data: result, error: clearError } = await supabase
        .rpc('clear_all_team_members_admin', {
          team_uuid: team.id,
          exclude_usernames: ['超級管理員'] // 排除超級管理員
        });
      
      let deletedCount = 0;
      
      if (clearError) {
        console.warn('⚠️ stored procedure 失敗，回退到直接刪除:', clearError);
        
        // 回退到原來的刪除方法
        const { data: allProfiles, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('team_id', team.id)
          .neq('username', '超級管理員'); // 排除超級管理員
        
        if (queryError) {
          console.error('❌ 查詢 profiles 錯誤:', queryError);
          throw queryError;
        }
        
        console.log(`📊 找到的 profiles 數量: ${allProfiles?.length || 0}`);
        if (allProfiles && allProfiles.length > 0) {
          console.log('📋 將要刪除的成員列表:');
          allProfiles.forEach((profile, index) => {
            console.log(`  ${index + 1}. ${profile.username} (ID: ${profile.id})`);
          });
          
          for (let i = 0; i < allProfiles.length; i++) {
            const profile = allProfiles[i];
            console.log(`🗑️ 正在刪除成員 ${i + 1}/${allProfiles.length}: ${profile.username}`);
            
            try {
              // 刪除用戶角色
              const { error: roleError } = await supabase
                .from('user_roles')
                .delete()
                .eq('profile_id', profile.id);
              
              if (roleError) {
                console.warn(`⚠️ 刪除 ${profile.username} 角色失敗:`, roleError);
              }
              
              // 刪除 profile
              const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profile.id);
              
              if (profileError) {
                console.error(`❌ 刪除 ${profile.username} 的 profile 失敗:`, profileError);
              } else {
                console.log(`✅ 成功刪除 ${profile.username}`);
                deletedCount++;
              }
            } catch (error) {
              console.error(`❌ 刪除 ${profile.username} 時發生錯誤:`, error);
            }
          }
        }
      } else {
        console.log('✅ 批量清理結果:', result);
        deletedCount = result?.deleted_count || 0;
      }
      
      console.log('🔄 驗證清理結果...');
      // 驗證清理結果
      const { data: remainingProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', team?.id);
      
      console.log(`📊 清理後剩餘的 profiles: ${remainingProfiles?.length || 0}`);
      if (remainingProfiles && remainingProfiles.length > 0) {
        console.log('ℹ️  剩餘成員 (預期只有被排除的成員):');
        remainingProfiles.forEach(profile => {
          console.log(`  - ${profile.username} (ID: ${profile.id})`);
        });
      }
      
      // 清理本地存儲
      const keysToRemove = [
        'walletData', 
        'walletTransactions', 
        'memberRoles', 
        'lockedMembers',
        'membersCleared'
      ];
      
      console.log('🧹 清理本地存儲...');
      keysToRemove.forEach(key => {
        const before = localStorage.getItem(key);
        localStorage.removeItem(key);
        const after = localStorage.getItem(key);
        console.log(`  - ${key}: ${before ? 'deleted' : 'was empty'}`);
      });
      
      // 顯示成功訊息
      toast({
        title: "清理完成",
        description: `已成功刪除 ${deletedCount} 個團隊成員，只保留超級管理員`,
      });
      
      // 暫時不自動重新載入，避免 RLS 問題導致成員重新出現
      // 用戶可以手動刷新頁面或點擊重新載入按鈕
      console.log('🔄 成員清理完成，請手動刷新頁面查看結果');
      // setTimeout(() => {
      //   console.log('🔄 重新載入成員列表...');
      //   fetchTeamMembers();
      // }, 1500);
      
    } catch (error) {
      console.error('❌ 清理成員失敗:', error);
      toast({
        title: "清理失敗",
        description: error.message || "清理過程中發生錯誤",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    setIsDeletingMember(true);
    try {
      console.log("開始刪除成員:", memberToDelete.username, memberToDelete.id);
      
      // 獲取該成員的錢包餘額
      const walletData = JSON.parse(localStorage.getItem('walletData') || '{}');
      const memberBalance = walletData[memberToDelete.username] || 0;

      // 如果成員有剩餘鑽石，轉入公基金
      if (memberBalance > 0) {
        // 更新公基金
        const publicFundData = JSON.parse(localStorage.getItem('publicFundData') || '{}');
        const currentBalance = publicFundData.balance || 0;
        publicFundData.balance = currentBalance + memberBalance;
        
        // 記錄公基金交易
        const publicFundTransactions = JSON.parse(localStorage.getItem('publicFundTransactions') || '[]');
        const newTransaction = {
          id: Date.now() + Math.random(),
          type: "收入",
          amount: memberBalance,
          reason: `成員 ${memberToDelete.username} 帳號刪除，餘額轉入`,
          date: new Date().toLocaleString('zh-TW'),
          category: "帳號刪除轉入"
        };
        publicFundTransactions.push(newTransaction);
        
        localStorage.setItem('publicFundData', JSON.stringify(publicFundData));
        localStorage.setItem('publicFundTransactions', JSON.stringify(publicFundTransactions));
        
        // 清除該成員的錢包資料
        delete walletData[memberToDelete.username];
        localStorage.setItem('walletData', JSON.stringify(walletData));
        console.log("轉移成員餘額到公基金:", memberBalance);
      }

      // Check if this is a predefined account
      const isPredefinedAccount = memberToDelete.id.toString().startsWith('predefined_');
      
      if (isPredefinedAccount) {
        console.log("刪除預定義帳號 (僅從本地狀態移除)");
        // For predefined accounts, just remove from local state
        // Don't try database operations as these accounts don't exist in DB
      } else {
        console.log("刪除資料庫帳號");
        // For database accounts, try stored procedure first
        const { data: deleteResult, error: deleteError } = await supabase
          .rpc('delete_team_member_admin', {
            member_id: memberToDelete.id
          });

        if (deleteError) {
          console.warn("使用 stored procedure 失敗，嘗試直接刪除:", deleteError);
          
          // Fallback to direct deletion
          const { error: roleError } = await supabase
            .from('user_roles')
            .delete()
            .eq('profile_id', memberToDelete.id);

          if (roleError) {
            console.warn("刪除用戶角色失敗:", roleError);
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', memberToDelete.id);

          if (profileError) {
            throw profileError;
          }
          
          console.log("資料庫帳號刪除成功");
        } else {
          if (!deleteResult) {
            throw new Error("未找到要刪除的成員或刪除失敗");
          }
          console.log("使用管理員權限刪除成功");
        }
      }

      // Clean up localStorage for both predefined and database accounts
      const memberRoles = JSON.parse(localStorage.getItem('memberRoles') || '{}');
      delete memberRoles[memberToDelete.id];
      localStorage.setItem('memberRoles', JSON.stringify(memberRoles));

      // Clean up wallet transactions for the deleted member
      const walletTransactions = JSON.parse(localStorage.getItem('walletTransactions') || '[]');
      const filteredTransactions = walletTransactions.filter(transaction => 
        transaction.participant !== memberToDelete.username
      );
      localStorage.setItem('walletTransactions', JSON.stringify(filteredTransactions));

      // Clean up user starting balance
      const userStartingBalanceKey = `userStartingBalance_${memberToDelete.username}`;
      localStorage.removeItem(userStartingBalanceKey);

      // Remove from current state
      setTeamMembers(prevMembers => 
        prevMembers.filter(member => member.id !== memberToDelete.id)
      );

      // Update locked members set if needed
      if (lockedMembers.has(memberToDelete.id)) {
        const newLockedMembers = new Set(lockedMembers);
        newLockedMembers.delete(memberToDelete.id);
        setLockedMembers(newLockedMembers);
      }

      // Trigger updates for other components
      window.dispatchEvent(new Event('publicFundUpdate'));
      window.dispatchEvent(new Event('storage')); // Trigger wallet update

      const message = memberBalance > 0 
        ? `已成功刪除成員 ${memberToDelete.username}，其錢包餘額 ${memberBalance} 鑽石已轉入公基金`
        : `已成功刪除成員 ${memberToDelete.username}`;

      toast({
        title: "刪除成功",
        description: message,
      });

      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      
    } catch (error: any) {
      console.error("刪除成員失敗:", error);
      toast({
        title: "刪除失敗",
        description: error.message || "發生未知錯誤，可能缺少管理員權限",
        variant: "destructive",
      });
    } finally {
      setIsDeletingMember(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主頁
          </Link>
          
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            儲存設定
          </Button>
        </div>

        <div className="text-white mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-treasure-gold to-treasure-amber bg-clip-text text-transparent flex items-center gap-3">
            <User className="w-8 h-8 text-treasure-gold" />
            👤 帳號設定
          </h1>
          <p className="text-treasure-gold/80 mt-2">
            {team?.name} | {profile?.username}
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-treasure-gold" />
                補助款發放
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-slate-300">
                  <p className="font-medium">發放團隊補助款</p>
                  <p className="text-sm text-slate-400">
                    向團隊成員發放補助金到個人錢包
                  </p>
                </div>
                <Dialog open={subsidyDialogOpen} onOpenChange={setSubsidyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      補助款發放
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-treasure-gold" />
                        補助款發放
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="subsidyAmount" className="text-slate-300">
                          補助金額 *
                        </Label>
                        <Input
                          id="subsidyAmount"
                          type="number"
                          value={subsidyAmount}
                          onChange={(e) => setSubsidyAmount(e.target.value)}
                          placeholder="輸入補助金額"
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-slate-300">補助成員 *</Label>
                        
                        {/* 成員ID輸入框 */}
                        <div className="relative">
                          <Input
                            value={memberInput}
                            onChange={(e) => handleMemberInputChange(e.target.value)}
                            placeholder="輸入成員ID（支援關鍵字搜尋）"
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && memberInput.trim()) {
                                const exactMatch = teamMembers.find(m => m.username === memberInput.trim());
                                if (exactMatch) {
                                  addMemberToSelection(exactMatch.username);
                                }
                              }
                            }}
                          />
                          
                          {/* 自動完成建議 */}
                          {showSuggestions && getMemberSuggestions().length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {getMemberSuggestions().map((member) => (
                                <div
                                  key={member.id}
                                  className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-slate-300 border-b border-slate-700 last:border-b-0"
                                  onClick={() => addMemberToSelection(member.username)}
                                >
                                  {member.username}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 已選中的成員列表 */}
                        {selectedMemberIds.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-slate-300 text-sm">已選擇的成員：</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedMemberIds.map((memberUsername) => (
                                <div
                                  key={memberUsername}
                                  className="flex items-center gap-2 bg-treasure-gold/20 text-treasure-gold px-2 py-1 rounded-md text-sm"
                                >
                                  <span>{memberUsername}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeMemberFromSelection(memberUsername)}
                                    className="text-treasure-gold hover:text-red-400 ml-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setSubsidyDialogOpen(false)}
                        disabled={isDistributingSubsidy}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleSubsidyDistribution}
                        disabled={isDistributingSubsidy}
                        className="flex items-center gap-2"
                      >
                        {isDistributingSubsidy ? (
                          <>載入中...</>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            發放
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-treasure-gold" />
                團隊管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-slate-300">
                  <p className="font-medium">新增團隊成員</p>
                  <p className="text-sm text-slate-400">
                    為「{team?.name}」團隊新增新的帳號
                  </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      新增帳號
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-treasure-gold" />
                        新增團隊帳號
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        為「{team?.name}」團隊新增一個外部登入帳號，密碼將使用團隊預設密碼。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="newUsername" className="text-slate-300">
                          帳號ID（外部登入用）*
                        </Label>
                        <Input
                          id="newUsername"
                          value={newAccount.username}
                          onChange={(e) => setNewAccount(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="輸入帳號ID（支援中文，將作為外部登入帳號）"
                          className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <div className="text-sm text-slate-400 bg-slate-700/30 p-3 rounded-lg">
                        <p>💡 密碼將自動設為基本設定中的團隊預設密碼</p>
                        <p>🔑 此帳號可用於外部系統登入驗證</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                          disabled={isAddingAccount}
                        >
                          取消
                        </Button>
                        <Button
                          onClick={handleAddAccount}
                          disabled={isAddingAccount}
                          className="flex items-center gap-2"
                        >
                          {isAddingAccount ? (
                            <>載入中...</>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4" />
                              新增帳號
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-treasure-gold" />
                  團隊成員列表
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("🔒 當前鎖定成員:", Array.from(lockedMembers));
                      console.log("📋 所有成員列表:", teamMembers.map(m => ({ id: m.id, username: m.username })));
                      alert(`鎖定成員數量: ${lockedMembers.size}\n鎖定成員ID: ${Array.from(lockedMembers).join(', ')}`);
                    }}
                    className="text-xs border-blue-600/50 text-blue-400 hover:bg-blue-900/20"
                  >
                    🔍 檢查鎖定狀態
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLockedMembers(new Set());
                      localStorage.removeItem('lockedMembers');
                      toast({
                        title: "已解鎖所有成員",
                        description: "所有成員的鎖定狀態已清除，現在可以刪除成員了",
                      });
                    }}
                    className="text-xs border-yellow-600/50 text-yellow-400 hover:bg-yellow-900/20"
                  >
                    🔓 解鎖全部成員
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTeamMembers}
                    disabled={isLoadingMembers}
                    className="flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingMembers ? 'animate-spin' : ''}`} />
                    {isLoadingMembers ? '載入中...' : '重新載入'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">載入中...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">目前沒有團隊成員</p>
                  <p className="text-sm text-slate-500 mb-4">
                    如果您剛創建帳號或遇到載入問題，請嘗試重新登入
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 清除認證狀態並重定向到登入頁面
                      supabase.auth.signOut();
                      window.location.href = '/auth';
                    }}
                    className="text-sm"
                  >
                    重新登入
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member, index) => {
                    const isLocked = lockedMembers.has(member.id);
                    console.log(`成員 ${member.username} (${member.id}) 鎖定狀態:`, isLocked);
                    return (
                      <div 
                        key={member.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isLocked 
                            ? 'bg-red-900/20 border-red-600/50' 
                            : 'bg-slate-700/30 border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isLocked 
                              ? 'bg-red-500/20' 
                              : 'bg-treasure-gold/20'
                          }`}>
                            <User className={`w-5 h-5 ${
                              isLocked 
                                ? 'text-red-400' 
                                : 'text-treasure-gold'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`font-medium ${
                                isLocked 
                                  ? 'text-red-300' 
                                  : 'text-white'
                              }`}>
                                帳號ID: {member.username}
                              </p>
                              {isLocked && (
                                <Lock className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            <p className="text-sm text-slate-400">
                              外部登入帳號 • 加入時間: {new Date(member.created_at).toLocaleDateString('zh-TW')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-slate-400 mr-2">
                            成員 #{index + 1}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            className="flex items-center gap-1 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                            disabled={isLocked}
                          >
                            <Edit className="w-3 h-3" />
                            編輯
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleLock(member.id, member.username)}
                            className={`flex items-center gap-1 ${
                              isLocked
                                ? 'border-red-600/50 text-red-400 hover:bg-red-900/20'
                                : 'border-slate-600 text-slate-300 hover:bg-slate-700/50'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                解鎖
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                鎖定
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(member.id, member.username)}
                            className="flex items-center gap-1 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                            disabled={isLocked}
                          >
                            <RotateCcw className="w-3 h-3" />
                            重設密碼
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfiscateStart(member)}
                            className="flex items-center gap-1 border-orange-600/50 text-orange-400 hover:bg-orange-900/20"
                            disabled={isLocked}
                          >
                            <Building2 className="w-3 h-3" />
                            充公
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMember(member)}
                            className="flex items-center gap-1 border-red-600/50 text-red-400 hover:bg-red-900/20"
                            disabled={isLocked}
                          >
                            <Trash2 className="w-3 h-3" />
                            刪除
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 編輯成員對話框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-treasure-gold" />
                編輯成員
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                修改成員的帳號信息和身分權限。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editUsername" className="text-slate-300">
                  帳號名稱 *
                </Label>
                <Input
                  id="editUsername"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="輸入帳號名稱"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editPassword" className="text-slate-300">
                  密碼 (留空表示不更改)
                </Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="輸入新密碼或留空"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-300">身分 (可複選)</Label>
                <div className="space-y-2">
                  {["盟友", "開單員", "拍賣員", "會計", "管理者"].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox 
                        id={role}
                        checked={editForm.roles.includes(role)}
                        onCheckedChange={(checked) => handleRoleToggle(role, checked as boolean)}
                      />
                      <Label 
                        htmlFor={role} 
                        className="text-slate-300 cursor-pointer flex-1"
                      >
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isUpdatingMember}
              >
                取消
              </Button>
              <Button
                onClick={handleUpdateMember}
                disabled={isUpdatingMember}
                className="flex items-center gap-2"
              >
                {isUpdatingMember ? (
                  <>載入中...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    儲存
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 充公確認對話框 */}
        <Dialog open={confiscateDialogOpen} onOpenChange={setConfiscateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                錢包充公確認
              </DialogTitle>
              <DialogDescription>
                此操作將把成員的所有錢包餘額轉移至公基金，且無法復原
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {confiscatingMember && (
                <>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          成員名稱
                        </Label>
                        <p className="text-lg font-semibold">{confiscatingMember.username}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          當前餘額
                        </Label>
                        <p className="text-lg font-semibold text-orange-600">
                          {memberWalletBalance.toLocaleString()} 鑽石
                        </p>
                      </div>
                    </div>
                  </div>

                  {memberWalletBalance <= 0 ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        ⚠️ 該成員錢包餘額為 0，無需充公
                      </p>
                    </div>
                  ) : (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                      <p className="text-orange-800 dark:text-orange-200 text-sm">
                        <strong>充公後的結果：</strong>
                      </p>
                      <ul className="text-sm text-orange-700 dark:text-orange-300 mt-2 space-y-1">
                        <li>• 成員錢包餘額：{memberWalletBalance.toLocaleString()} → 0 鑽石</li>
                        <li>• 公基金餘額：+ {memberWalletBalance.toLocaleString()} 鑽石</li>
                        <li>• 此操作無法復原</li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setConfiscateDialogOpen(false)}
                disabled={isConfiscating}
              >
                取消
              </Button>
              <Button
                variant="default"
                onClick={handleConfiscateExecute}
                disabled={isConfiscating || memberWalletBalance <= 0}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isConfiscating ? "充公中..." : "確認充公"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 刪除成員確認對話框 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                確認刪除成員
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <p className="text-slate-300 mb-4">
                您確定要刪除成員 <span className="font-semibold text-white">{memberToDelete?.username}</span> 嗎？
              </p>
              
              {(() => {
                const walletData = JSON.parse(localStorage.getItem('walletData') || '{}');
                const memberBalance = walletData[memberToDelete?.username] || 0;
                return memberBalance > 0 ? (
                  <div className="bg-treasure-gold/10 border border-treasure-gold/30 rounded-lg p-3 mb-4">
                    <p className="text-treasure-gold text-sm">
                      <strong>資產轉移：</strong>該成員錢包內的 <span className="font-semibold">{memberBalance} 鑽石</span> 將自動轉入公基金。
                    </p>
                  </div>
                ) : null;
              })()}

              <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-3">
                <p className="text-red-300 text-sm">
                  <strong>警告：</strong>此操作無法復原。刪除後該成員將無法登入系統，所有相關資料也會被移除。
                </p>
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeletingMember}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteMember}
                disabled={isDeletingMember}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              >
                {isDeletingMember ? (
                  <>刪除中...</>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    確認刪除
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}